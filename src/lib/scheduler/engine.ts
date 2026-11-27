/**
 * Scheduler 门面：把「结算 → 新词配额 → 学新词 → 即时复习 → 正式复习 → 逾期/归档」
 * 串成一套可持久化的状态机。
 *
 * 设计约束（见 SCHEDULER_SPEC.md）：
 * - 不依赖 React、不读全局时钟（可注入 now，方便测试跨天）。
 * - 不修改入参 state：构造时深拷贝，对外只给快照。
 * - 所有日期都是「学习日」字符串，凌晨 4 点为界。
 */

import { formatMonthDay, addDays, diffDays, toStudyDay } from './studyDay.ts';
import type { StudyDay } from './studyDay.ts';
import { applyAdaptation, computeRecentAccuracy, round3, INCREASE_STEP } from './adaptation.ts';
import type { AdaptFlags, AdaptOutcome } from './adaptation.ts';
import { applyLongReview, applyShortReview, createCard, longDueDay } from './cards.ts';
import {
  IMMEDIATE_TRIGGER,
  answerImmediate as applyImmediateAnswer,
  averageLoops,
  groupFuzzyTotal,
  makeGroup,
} from './immediate.ts';
import {
  buildCalendar,
  buildCalendarRange,
  buildCalendarView,
  buildDailyPlan,
  computeWordBudget,
  overdueBatches,
  pickPrimaryLongBatch,
  plannedNewWordLimit,
  shortBatches,
  snapshotWordSet,
} from './plan.ts';
import type {
  CalendarDay,
  CalendarView,
  CardState,
  DailyPlan,
  DayRecord,
  ImmediateGroup,
  LongBatchJson,
  MistakeEntry,
  MistakeRow,
  MistakeSource,
  Rating,
  SchedulerState,
  SettlementJson,
} from './types.ts';
import { RATING_SCORE } from './types.ts';

export const DEFAULT_GOAL = 20;
/** 逾期超过这个天数仍未复习 → 打回未学新词池（需求 §五.4）。 */
export const OVERDUE_SWEEP_DAYS = 7;

function clampInt(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(value)));
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function emptyState(goal: number = DEFAULT_GOAL): SchedulerState {
  const dailyGoal = clampInt(goal, 1, 999);
  return {
    v: 1,
    userDailyGoal: dailyGoal,
    // 上限默认比目标高 5：自适应规则一次最多奖励 +5，上限若等于目标，那 +5 永远发不出来。
    maxLimit: Math.min(999, dailyGoal + INCREASE_STEP),
    maxLimitPinned: false,
    currentLimit: dailyGoal,
    consecutiveGoodDays: 0,
    newWordOrder: 'list',
    freqRank: {},
    unlearned: [],
    relearned: {},
    cards: {},
    archived: [],
    days: {},
    mistakes: {},
    immediate: {
      pendingCount: 0,
      pendingWords: [],
      active: null,
      stats: { groups: 0, cards: 0, loops: 0, skipped: 0 },
      lastAvgLoops: null,
    },
    pendingLimit: null,
    manual: null,
    lifetime: { score: 0, count: 0 },
    lastSettlement: null,
    lastSettledDay: null,
  };
}

function makeDayRecord(day: StudyDay, limit: number): DayRecord {
  return {
    day,
    dueSnapshot: [],
    snapshotDone: false,
    planSnapshot: [],
    doneToday: [],
    newWordLimit: limit,
    newLearned: [],
    accScore: 0,
    accCount: 0,
    retried: 0,
    immediate: { groups: 0, cards: 0, loops: 0, skipped: 0 },
    settled: false,
    action: null,
    absent: false,
    settlement: null,
  };
}

export interface SchedulerOptions {
  /** 注入时钟，测试跨天用；默认 new Date() */
  now?: () => Date;
}

export interface NewWordAllowance {
  planned: number;
  allowed: number;
  reason: string | null;
}

export interface LearnResult {
  ok: boolean;
  reason: string | null;
  word: string | null;
  pending: number;
  triggerImmediate: boolean;
}

export interface ReviewOutcome {
  ok: boolean;
  reason: string | null;
  card: CardState | null;
  kind: 'short' | 'long' | null;
  /** 是否计入正确率（重试、长期批次都不计） */
  counted: boolean;
  completedToday: boolean;
  archived: boolean;
  nextDue: StudyDay | null;
}

export interface SettlementReport {
  settledDay: StudyDay;
  plannedDay: StudyDay;
  result: SettlementJson;
  flags: AdaptFlags;
  reasons: string[];
}

/** `startOfSession()` 的返回：启动结算了哪几天、今天的计划是什么。 */
export interface SessionStart {
  today: StudyDay;
  /** 这次真正结算过的日子（断档补结算 + 昨天）；重复启动时是幂等回放 */
  reports: SettlementReport[];
  plan: DailyPlan;
}

export interface SchedulerStats {
  userDailyGoal: number;
  maxLimit: number;
  currentLimit: number;
  consecutiveGoodDays: number;
  newCards: number;
  shortCards: number;
  longCards: number;
  archivedCards: number;
  unlearned: number;
  /** 错词本条目数（入口徽标用） */
  mistakes: number;
  lifetimeAcc: number | null;
  pendingImmediate: number;
  lastAvgLoops: number | null;
}

function blankFlags(): AdaptFlags {
  return {
    noAccuracyData: false,
    absentDay: false,
    idleDay: false,
    decreaseByAccuracy: false,
    pauseByAccuracy: false,
    decreaseByCompletion: false,
    blockedIncrease: false,
    increased: false,
    immediatePenalty: false,
    overdueWarning: false,
    overduePause: false,
  };
}

function failure(reason: string, card: CardState | null = null): ReviewOutcome {
  return {
    ok: false,
    reason,
    card,
    kind: null,
    counted: false,
    completedToday: false,
    archived: false,
    nextDue: card ? card.due : null,
  };
}

export class Scheduler {
  private readonly s: SchedulerState;
  private readonly now: () => Date;
  /** `DayRecord.doneToday` 的成员索引：否则每次作答都要扫一遍当天已答词表（O(n²)）。 */
  private readonly doneIndex = new WeakMap<DayRecord, Set<string>>();

  constructor(state?: SchedulerState | null, options: SchedulerOptions = {}) {
    this.s = state ? clone(state) : emptyState();
    this.now = options.now ?? (() => new Date());
  }

  static create(goal: number = DEFAULT_GOAL, options: SchedulerOptions = {}): Scheduler {
    return new Scheduler(emptyState(goal), options);
  }

  /** 仅供只读展示；改动请走方法。 */
  get state(): SchedulerState {
    return this.s;
  }

  snapshot(): SchedulerState {
    return clone(this.s);
  }

  private doneIndexFor(record: DayRecord): Set<string> {
    let index = this.doneIndex.get(record);
    if (!index) {
      index = new Set(record.doneToday);
      this.doneIndex.set(record, index);
    }
    return index;
  }

  today(): StudyDay {
    return toStudyDay(this.now());
  }

  // ---------------------------------------------------------------- 词池

  /** 设定未学新词池（按传入顺序；已学/已归档的词自动剔除）。 */
  seed(words: string[]): void {
    const seen = new Set<string>();
    // 曾经的 O(n²)：每个词都 `archived.includes(...)`，5000 词就是 1250 万次比较
    const archived = new Set(this.s.archived);
    const pool: string[] = [];
    for (const word of words) {
      if (!word || seen.has(word)) continue;
      seen.add(word);
      if (this.s.cards[word] || archived.has(word)) continue;
      pool.push(word);
    }
    this.s.unlearned = pool;
  }

  setNewWordOrder(order: SchedulerState['newWordOrder'], freqRank: Record<string, number> = {}): void {
    this.s.newWordOrder = order === 'freq' ? 'freq' : 'list';
    this.s.freqRank = freqRank;
  }

  /** 当前可抽取的新词（按设定顺序，不消费）。 */
  newWordPool(): string[] {
    // 「逾期 >7 天被打回池子」的词排在最前：它们并不算真正的生词，是学过的词掉了队。
    // 如果只按词频或词表顺序抽，这些词会被永远压在池尾——「归新词」就等于冷藏。
    const relearned: string[] = [];
    const fresh: string[] = [];
    for (const word of this.s.unlearned) {
      if (this.s.relearned[word] === true) relearned.push(word);
      else fresh.push(word);
    }
    if (this.s.newWordOrder !== 'freq') return [...relearned, ...fresh];
    const rank = this.s.freqRank;
    const byRank = (a: string, b: string): number =>
      (rank[a] ?? Number.MAX_SAFE_INTEGER) - (rank[b] ?? Number.MAX_SAFE_INTEGER);
    // 两组各自内部再按词频排：优先出池，但不打乱组内的常态顺序
    relearned.sort(byRank);
    fresh.sort(byRank);
    return [...relearned, ...fresh];
  }

  // ---------------------------------------------------------------- 每日

  /** 建立当天记录（计划新词量）。幂等；到期快照由 snapshotDue 单独拍。 */
  ensureDay(day: StudyDay = this.today()): DayRecord {
    // 只在「今天」清扫逾期：预览未来某天不该把卡片提前打回新词池
    if (day === this.today()) this.sweepOverdue(day);
    const existing = this.s.days[day];
    if (existing) return existing;
    const record = makeDayRecord(day, plannedNewWordLimit(this.s, day));
    this.s.days[day] = record;
    return record;
  }

  /**
   * 拍下当天到期词表。完成率的分母只认这份快照，所以必须在当天第一次作答之前拍，
   * 且之后不再变（历史不重算，需求 §八.7）。未来日不冻结：等它真的到了再拍，
   * 否则今天新学的词会漏进明天的快照。
   */
  private snapshotDue(record: DayRecord): DayRecord {
    if (record.snapshotDone) return record;
    if (record.day > this.today()) return record;
    const batches = shortBatches(this.s, record.day);
    record.dueSnapshot = batches.flatMap((batch) => batch.words);
    record.planSnapshot = batches.map(({ sourceDate, daysAgo, wordCount }) => ({ sourceDate, daysAgo, wordCount }));
    record.snapshotDone = true;
    return record;
  }

  plan(day: StudyDay = this.today()): DailyPlan {
    this.snapshotDue(this.ensureDay(day));
    const cause =
      this.s.lastSettlement && this.s.lastSettledDay === addDays(day, -1) ? this.s.lastSettlement.reason : null;
    return buildDailyPlan(this.s, day, { cause });
  }

  calendar(days = 8, today: StudyDay = this.today()): CalendarDay[] {
    this.ensureDay(today);
    return buildCalendar(this.s, { today, days });
  }

  /** 日历页用：8 天格子 + 未来长期批次预告（没有长期批次时不留空）。 */
  calendarView(days = 8, today: StudyDay = this.today()): CalendarView {
    this.ensureDay(today);
    return buildCalendarView(this.s, { today, days });
  }

  /**
   * 月历用：任意区间（含首尾）。
   *
   * 与 `calendar()` 的唯一区别是不从今天起算——过去日读快照，今天/未来照旧推算。
   * 不调 `ensureDay`：那是「今天」的初始化，给别的日期铺路用的，区间里已经包含今天时由 `plan()` 负责。
   */
  calendarRange(start: StudyDay, end: StudyDay, today: StudyDay = this.today()): CalendarDay[] {
    return buildCalendarRange(this.s, { start, end, today });
  }

  /** 当天还能学几个新词：计划值 → 池余量 → 复习闸 → 逾期闸（与 plan()/日历同源）。 */
  allowance(day: StudyDay = this.today()): NewWordAllowance {
    this.ensureDay(day);
    const budget = computeWordBudget(this.s, day);
    let reason: string | null = null;
    if (budget.blockedBy === 'paused') {
      // 计划值是 0 有两种来源：上限真的设成 0，或今天的计划被结算/截断写成了 0。
      // 后者别甩锅给「上限」——上限可能早就调回来了，只是今天不会再涨回去。
      reason =
        this.s.maxLimit === 0
          ? '今天的新词上限是 0（已暂停），可以先清逾期或休息一天。'
          : '今天的新词计划是 0（已暂停）。改上限或目标后，从下一次结算起按自适应规则恢复，不会立刻回到原值。';
    } else if (budget.blockedBy === 'overdue') {
      const overdue = overdueBatches(this.s, day).reduce((total, batch) => total + batch.wordCount, 0);
      reason = `逾期复习 ${overdue} 个，已超过 50，先清逾期再学新词。`;
    } else if (budget.blockedBy === 'review') {
      const record = this.snapshotDue(this.ensureDay(day));
      const dueTotal = record.dueSnapshot.length;
      const index = snapshotWordSet(record);
      const done = record.doneToday.filter((word) => index.has(word)).length;
      const rate = dueTotal === 0 ? 1 : done / dueTotal;
      reason = `今天的到期复习只完成 ${Math.round(rate * 100)}%，先复习完再学新词。`;
    } else if (budget.blockedBy === 'pool') {
      reason = `未学新词只剩 ${budget.allowed} 个`;
    } else if (budget.blockedBy === 'quota') {
      reason = '今天的新词已经学完了';
    }
    return { planned: budget.planned, allowed: budget.allowed, reason };
  }

  /** 预览接下来要学的新词（不消费；用户中途退出不会有半截记录）。 */
  nextNewWords(count?: number, day: StudyDay = this.today()): string[] {
    const { allowed } = this.allowance(day);
    const take = Math.max(0, Math.min(count ?? allowed, allowed));
    return this.newWordPool().slice(0, take);
  }

  // ---------------------------------------------------------------- 新词

  /**
   * 学一个词：从池里取出、建卡、登记到即时复习。
   * 默认会校验当天配额（复习闸 / 逾期闸 / 上限），`force` 只给「调试或补录」用。
   */
  learnNewWord(word: string, day: StudyDay = this.today(), options: { force?: boolean } = {}): LearnResult {
    if (!word) return { ok: false, reason: '单词为空', word, pending: this.s.immediate.pendingCount, triggerImmediate: false };
    if (this.s.cards[word]) {
      return { ok: false, reason: '这个词已经在学', word, pending: this.s.immediate.pendingCount, triggerImmediate: false };
    }
    const index = this.s.unlearned.indexOf(word);
    if (index < 0) {
      return { ok: false, reason: '这个词不在未学新词池里', word, pending: this.s.immediate.pendingCount, triggerImmediate: false };
    }
    const record = this.ensureDay(day);
    if (options.force !== true) {
      const { allowed, reason } = this.allowance(day);
      if (allowed === 0) {
        return { ok: false, reason: reason ?? '今天暂时不能学新词', word, pending: this.s.immediate.pendingCount, triggerImmediate: false };
      }
    }

    this.s.unlearned.splice(index, 1);
    const created = createCard(word, day, this.s.relearned[word] === true);
    // 与 commitNewWords 同一口径：账本里已有这个词，就把 inMistakes 镜像到卡上
    if (this.s.mistakes[word]) created.inMistakes = true;
    this.s.cards[word] = created;
    if (!record.newLearned.includes(word)) record.newLearned.push(word);

    const immediate = this.s.immediate;
    immediate.pendingWords.push(word);
    immediate.pendingCount = immediate.pendingWords.length;
    return {
      ok: true,
      reason: null,
      word,
      pending: immediate.pendingCount,
      triggerImmediate: immediate.pendingCount >= IMMEDIATE_TRIGGER,
    };
  }

  /** 一批学完时问一句：要不要立刻做即时复习（需求 §四.1）。 */
  endNewWordBatch(): { pending: number; shouldReviewImmediately: boolean } {
    const pending = this.s.immediate.pendingCount;
    return { pending, shouldReviewImmediately: pending >= IMMEDIATE_TRIGGER };
  }

  // ---------------------------------------------------------------- 即时复习

  startImmediate(): ImmediateGroup | null {
    const immediate = this.s.immediate;
    // 昨天的半组先作废，否则新攒的 10 个永远进不了组
    this.expireStaleImmediate();
    if (immediate.active) return immediate.active;
    if (immediate.pendingCount < IMMEDIATE_TRIGGER) return null;
    const group = makeGroup(immediate.pendingWords, this.today());
    immediate.active = group;
    immediate.pendingWords = [];
    immediate.pendingCount = 0;
    return group;
  }

  answerImmediate(word: string, known: boolean): ReturnType<typeof applyImmediateAnswer> {
    const immediate = this.s.immediate;
    if (!immediate.active) return null;

    const result = applyImmediateAnswer(immediate.active, word, known);
    if (!result) return null; // 不在本轮队列里（已跨轮 / 不是队头）：没什么可答
    immediate.active = result.group;

    // 累计模糊满 3 次才进错词本：第 3 次一次记满，之后每次 +1。
    // 注意「进错词本 ≠ 出队」——词仍在本轮 queue 或 crossRound 里，直到点「认识」。
    if (result.mistakeIncrement > 0) {
      this.recordMistake(word, this.today(), 'immediate', result.mistakeIncrement);
    }

    // 强制收口产生的硬词：卡片已经存在（旧 pendingWords 路径）就顺手标上。
    // 统一学习流里卡片要到 commitNewWords 才建，hardWords 那时才落到卡上。
    if (result.hardWords.length > 0) {
      for (const hardWord of result.hardWords) {
        const card = this.s.cards[hardWord];
        if (card) card.hard = true;
      }
    }

    if (result.finished) {
      const group = result.group;
      const loops = groupFuzzyTotal(group);
      immediate.stats.groups += 1;
      immediate.stats.cards += group.words.length;
      immediate.stats.loops += loops;
      immediate.lastAvgLoops = averageLoops(loops, group.words.length);
      immediate.active = null;

      const record = this.ensureDay(this.today());
      record.immediate.groups += 1;
      record.immediate.cards += group.words.length;
      record.immediate.loops += loops;
    }

    return result;
  }

  /** 跳过即时复习（需求 §四.5）：这批词打标记，明天 1 天批次置顶，不卡流程。 */
  skipImmediate(): string[] {
    const immediate = this.s.immediate;
    // 只算「还没答的」：组里已经答对出队的词不该再被标成跳过（那会让它们明天莫名置顶）
    const words = immediate.active ? [...immediate.active.queue] : [...immediate.pendingWords];
    for (const word of words) {
      const card = this.s.cards[word];
      if (card) card.skippedImmediate = true;
    }
    immediate.stats.skipped += words.length;
    immediate.active = null;
    immediate.pendingWords = [];
    immediate.pendingCount = 0;

    const record = this.ensureDay(this.today());
    record.immediate.skipped += words.length;
    return words;
  }

  /**
   * 跨学习日的即时复习组直接作废（需求 §四 的边界，2026-11-24 补）。
   *
   * 中途退出即时复习后 `active` 会一直挂着；第二天再攒满 10 个时 `startImmediate()`
   * 会把昨天那半组原样返回，新词永远进不了组。所以开新组 / 启动时先把旧的半组
   * 打上 skippedImmediate（明天 1 天批次置顶），再清空。**卡片本身不动**，不会丢词。
   */
  expireStaleImmediate(day: StudyDay = this.today()): string[] {
    const immediate = this.s.immediate;
    const group = immediate.active;
    if (!group || group.startedOn === day) return [];
    const remaining = [...group.queue];
    for (const word of remaining) {
      const card = this.s.cards[word];
      if (card) card.skippedImmediate = true;
    }
    immediate.stats.skipped += remaining.length;
    const record = group.startedOn ? this.s.days[group.startedOn] : undefined;
    if (record) record.immediate.skipped += remaining.length;
    immediate.active = null;
    return remaining;
  }

  // ------------------------------------------------ 统一学习流（v1.1，见 REFACTOR_PLAN §2）

  /**
   * 用指定词开即时复习组（统一流程：列表看完 → 攒够 pending → 开组）。
   *
   * 与 `startImmediate()` 的本质区别：**这里的词还没入库**（列表阶段不建卡，
   * 「清空即时复习才算背完」），所以不走 pendingWords、不建卡，只做校验后开组。
   * 校验：非空、去重、每个词都还在未学池且没有卡；混入非法词整组拒绝。
   * 上一次残留的半组先按跨日规则作废（`expireStaleImmediate`）。
   */
  startImmediateWith(words: string[], day: StudyDay = this.today()): ImmediateGroup | null {
    this.expireStaleImmediate(day);
    const immediate = this.s.immediate;
    if (immediate.active) return immediate.active;
    const list: string[] = [];
    const seen = new Set<string>();
    for (const word of words) {
      if (!word || seen.has(word)) continue;
      seen.add(word);
      if (this.s.cards[word] || this.s.unlearned.indexOf(word) < 0) return null;
      list.push(word);
    }
    if (list.length === 0) return null;
    const group = makeGroup(list, day);
    immediate.active = group;
    return group;
  }

  /**
   * 即时复习组清空后的**入库判定**（完成判定的唯一落库点）。
   *
   * 逐词建卡、出池、记入当天 newLearned；`hardWords` 打 hard 标记（次日 1 天批次
   * 由既有 hard 语义自然置顶）。不复验 allowance：额度在拍列表快照时已定，
   * 复习闸在进列表前已清。非法词（不在池 / 已有卡）进 `rejected`，不整组失败。
   * 刻意**不**往 pendingWords 里塞——那是旧「学一个攒一个」模型的触发器。
   */
  commitNewWords(
    words: string[],
    day: StudyDay = this.today(),
    hardWords: string[] = [],
  ): { committed: string[]; rejected: string[] } {
    const record = this.ensureDay(day);
    const hard = new Set(hardWords);
    const committed: string[] = [];
    const rejected: string[] = [];
    for (const word of words) {
      const index = word ? this.s.unlearned.indexOf(word) : -1;
      if (!word || this.s.cards[word] || index < 0) {
        if (word) rejected.push(word);
        continue;
      }
      this.s.unlearned.splice(index, 1);
      const card = createCard(word, day, this.s.relearned[word] === true);
      if (hard.has(word)) card.hard = true;
      // 账本是唯一来源：这个词之前如果已经错过（含「模糊 3 次」记的账），建卡时补上镜像
      if (this.s.mistakes[word]) card.inMistakes = true;
      this.s.cards[word] = card;
      if (!record.newLearned.includes(word)) record.newLearned.push(word);
      committed.push(word);
    }
    return { committed, rejected };
  }

  /**
   * 丢弃当前即时复习组（统一流程里用户中途退出）。
   * 这组词从未入库（列表阶段不建卡），所以不打 skippedImmediate、不动配额——
   * 它们原样留在未学池，明天重新从列表看起。返回被丢弃的全部词。
   */
  abandonImmediate(): string[] {
    const immediate = this.s.immediate;
    const group = immediate.active;
    immediate.active = null;
    return group ? [...group.words] : [];
  }

  /**
   * 清空全部学习数据（设置页「清空所有学习数据」）。
   *
   * 清的是**学习状态**：卡片、未学池、当天/历史记录、错词本、即时复习、结算与统计——
   * 像新用户第一次打开。**保留设置**：每日目标、上限（含钉住）、新词顺序、词频表，
   * 否则重置完还得重新配一遍目标，测试时很烦。
   * 调用后需要重新 `seed(当前词库)` 灌池子（App 层负责），否则今天没有新词可发。
   */
  resetLearning(): void {
    const s = this.s;
    s.cards = {};
    s.unlearned = [];
    s.relearned = {};
    s.archived = [];
    s.days = {};
    s.mistakes = {};
    s.immediate = {
      pendingCount: 0,
      pendingWords: [],
      active: null,
      stats: { groups: 0, cards: 0, loops: 0, skipped: 0 },
      lastAvgLoops: null,
    };
    s.pendingLimit = null;
    s.manual = null;
    s.consecutiveGoodDays = 0;
    s.currentLimit = s.userDailyGoal;
    s.lifetime = { score: 0, count: 0 };
    s.lastSettlement = null;
    s.lastSettledDay = null;
  }

  // ---------------------------------------------------------------- 错词本

  /**
   * 记一次答错：累计次数 + 最近日期。卡片还在就顺手同步 `inMistakes`（老字段仍在用）。
   * 卡片被清扫回未学池后账本照样留着——「我错过 5 次」是历史，不该跟着卡片消失。
   *
   * `increment` 给即时复习用：同一个词在一组里连错 3 次才变硬词，那 3 次都算数。
   */
  private recordMistake(word: string, day: StudyDay, source: MistakeSource, increment = 1): MistakeEntry {
    const previous = this.s.mistakes[word];
    const step = Math.max(1, Math.trunc(increment));
    const entry: MistakeEntry = {
      word,
      count: (previous ? previous.count : 0) + step,
      lastDay: previous && previous.lastDay > day ? previous.lastDay : day,
      source,
    };
    this.s.mistakes[word] = entry;
    const card = this.s.cards[word];
    if (card) card.inMistakes = true;
    return entry;
  }

  /** 移出错词本（答对、错词本单测答对都走这里）。 */
  private clearMistake(word: string): void {
    delete this.s.mistakes[word];
    const card = this.s.cards[word];
    if (card) {
      card.inMistakes = false;
      card.hard = false;
    }
  }

  /** 错词本列表：最后错的排前面；同一天错的按错得多的排。 */
  mistakes(): MistakeRow[] {
    const rows: MistakeRow[] = [];
    for (const entry of Object.values(this.s.mistakes)) {
      const card = this.s.cards[entry.word] ?? null;
      rows.push({
        ...entry,
        card,
        canQuiz: card !== null && (card.phase === 'short' || card.phase === 'long'),
        relearning: card === null,
      });
    }
    rows.sort((a, b) => {
      if (a.lastDay !== b.lastDay) return a.lastDay < b.lastDay ? 1 : -1;
      if (a.count !== b.count) return b.count - a.count;
      return a.word < b.word ? -1 : a.word > b.word ? 1 : 0;
    });
    return rows;
  }

  mistakeCount(): number {
    return Object.keys(this.s.mistakes).length;
  }

  /**
   * 错词本里的「单测」：只回答「现在还记得吗」，**不动排程、不计正确率、不改完成率**。
   *
   * - 答对 → 移出错词本；卡片仍按原来的到期日复习（不清零、不提前）。
   * - 答错 → 留在本子里，累计次数 +1，最后一次答错日期改成今天。
   */
  quizMistake(
    word: string,
    known: boolean,
    day: StudyDay = this.today(),
  ): { ok: boolean; reason: string | null; removed: boolean; entry: MistakeEntry | null; card: CardState | null } {
    if (!this.s.mistakes[word]) {
      return { ok: false, reason: '这个词不在错词本里', removed: false, entry: null, card: this.s.cards[word] ?? null };
    }
    if (!known) {
      const entry = this.recordMistake(word, day, 'quiz');
      return { ok: true, reason: null, removed: false, entry, card: this.s.cards[word] ?? null };
    }
    this.clearMistake(word);
    return { ok: true, reason: null, removed: true, entry: null, card: this.s.cards[word] ?? null };
  }

  // ---------------------------------------------------------------- 正式复习

  submitReview(word: string, rating: Rating, options: { isRetry?: boolean; day?: StudyDay } = {}): ReviewOutcome {
    const day = options.day ?? this.today();
    const card = this.s.cards[word];
    if (!card) return failure('没有这个词的学习记录');
    if (card.phase === 'archived') return failure('这个词已归档，只能在归档库里手动抽查');
    if (card.phase !== 'short' && card.phase !== 'long') return failure('这个词还没开始学', card);

    const kind: 'short' | 'long' = card.phase === 'long' ? 'long' : 'short';
    const record = this.snapshotDue(this.ensureDay(day));

    // 答错后的当场重试：只记次数，不调排程、不进正确率（需求 §二.4）
    if (options.isRetry) {
      record.retried += 1;
      return {
        ok: true,
        reason: null,
        card,
        kind,
        counted: false,
        completedToday: false,
        archived: false,
        nextDue: card.due,
      };
    }

    // 一个词在一个批次里只作答一次：今天已经答过、或还没到期，都不再接受新的评分
    if (card.lastReviewed === day) return failure('这个词今天已经复习过了', card);
    if (kind === 'short' && card.due !== null && card.due > day) {
      return failure(`这个词要到 ${card.due} 才复习`, card);
    }

    const next = kind === 'long' ? applyLongReview(card, rating, day) : applyShortReview(card, rating, day);
    // 重新走过一次，就不再需要「跳过即时复习 / 难词置顶」的标记
    next.skippedImmediate = false;
    next.hard = false;
    this.s.cards[word] = next;

    // 错词本账本：不认识进本子，认识出本子（只是移出，排程仍按 next 走）
    if (rating === 'unknown') this.recordMistake(word, day, 'review');
    else if (rating === 'known') this.clearMistake(word);

    if (kind === 'short') {
      const score = RATING_SCORE[rating];
      record.accScore += score;
      record.accCount += 1;
      this.s.lifetime.score += score;
      this.s.lifetime.count += 1;
    }

    const inSnapshot = snapshotWordSet(record).has(word);
    const doneIndex = this.doneIndexFor(record);
    if (inSnapshot && !doneIndex.has(word)) {
      record.doneToday.push(word);
      doneIndex.add(word);
    }

    const archived = next.phase === 'archived';
    if (archived && !this.s.archived.includes(word)) this.s.archived.push(word);

    return {
      ok: true,
      reason: null,
      card: next,
      kind,
      counted: kind === 'short',
      completedToday: inSnapshot,
      archived,
      nextDue: next.due,
    };
  }

  /** 这个词今天是否已经作答过（含别的批次里答过）。 */
  answeredToday(word: string, day: StudyDay = this.today()): boolean {
    const card = this.s.cards[word];
    return card !== undefined && card.lastReviewed === day;
  }

  /**
   * UI 的正式作答入口：**同一天同一词第二次及以后一律按 isRetry 处理**。
   *
   * `submitReview()` 对 `lastReviewed === day` 是直接拒绝的，这是排程守卫（防止一天内
   * 连点三次「认识」跳到 15 天档）。但页面里同一词确实可能一天出现两次——
   * 最典型的是「1 天批次答不认识 → 打回错词本 → 当天在错词本里再答一次」，
   * 这属于跨批次同日重复，不是新的一次回忆。这里把它自动降级成 isRetry：
   * 只记 `record.retried`，不动排程、不进正确率、不改完成率分母之外的东西。
   *
   * 界面层一律走这个入口，不要自己去判断 isRetry。
   */
  answer(word: string, rating: Rating, day: StudyDay = this.today()): ReviewOutcome {
    if (this.answeredToday(word, day)) {
      return this.submitReview(word, rating, { day, isRetry: true });
    }
    return this.submitReview(word, rating, { day });
  }

  /** 清逾期：与正式复习同一条路径，下一次间隔从「实际复习日」重新算（需求 §五.3）。 */
  reviewOverdue(word: string, rating: Rating, day: StudyDay = this.today()): ReviewOutcome {
    const card = this.s.cards[word];
    if (!card) return failure('没有这个词的学习记录');
    if (card.phase === 'short' && card.due && diffDays(card.due, day) <= 0) {
      return failure('这个词还没有逾期', card);
    }
    return this.submitReview(word, rating, { day });
  }

  /** 逾期 >7 天仍没复习：移出逾期池，归入未学池尾部，打 relearned 标记（需求 §五.4）。 */
  sweepOverdue(day: StudyDay = this.today()): string[] {
    const moved: string[] = [];
    for (const [word, card] of Object.entries(this.s.cards)) {
      if (card.phase !== 'short' || !card.due) continue;
      if (diffDays(card.due, day) <= OVERDUE_SWEEP_DAYS) continue;
      delete this.s.cards[word];
      this.s.relearned[word] = true;
      if (!this.s.unlearned.includes(word)) this.s.unlearned.push(word);
      moved.push(word);
    }
    return moved;
  }

  /** 归档库里手动抽查用：抽到就按短期正式复习处理。 */
  sampleArchived(word: string): boolean {
    return this.s.archived.includes(word);
  }

  /**
   * 归档库抽查：只记录这次回忆结果，**不改调度**（需求 §六.6：归档不进自动排程）。
   * 答错的词会进错词本，但仍留在归档库。
   */
  reviewArchived(word: string, rating: Rating, day: StudyDay = this.today()): ReviewOutcome {
    const card = this.s.cards[word];
    if (!card) return failure('没有这个词的学习记录');
    if (card.phase !== 'archived') return failure('这个词不在归档库里', card);
    card.reps += 1;
    card.lastRating = rating;
    card.lastReviewed = day;
    if (rating === 'unknown') {
      card.lapses += 1;
      this.recordMistake(word, day, 'archived');
    } else if (rating === 'known') {
      this.clearMistake(word);
    }
    return {
      ok: true,
      reason: null,
      card,
      kind: null,
      counted: false,
      completedToday: false,
      archived: true,
      nextDue: null,
    };
  }

  // ---------------------------------------------------------------- 结算

  /**
   * 结算刚结束的一天，算出下一天的新词量。
   * 返回报告里的 `dailyPlan` 是**新一天**的计划（JSON 里的 batch 就是明天要复习的）。
   */
  settle(endedDay?: StudyDay): SettlementReport {
    const day = endedDay ?? addDays(this.today(), -1);
    if (day > this.today()) throw new Error(`不能结算还没结束的一天：${day}`);
    const record = this.snapshotDue(this.ensureDay(day));

    // 同一天重复结算：原样回放缓存，不再移动基线 / 连击
    if (record.settled && record.settlement) {
      return {
        settledDay: day,
        plannedDay: addDays(day, 1),
        result: record.settlement,
        flags: blankFlags(),
        reasons: [record.settlement.reason],
      };
    }

    const dueTotal = record.dueSnapshot.length;
    const done = record.doneToday.filter((word) => record.dueSnapshot.includes(word)).length;
    const completionRate = dueTotal === 0 ? 1 : done / dueTotal;

    const last3 = [0, 1, 2].map((offset) => {
      const past = this.s.days[addDays(day, -offset)];
      return { score: past ? past.accScore : 0, count: past ? past.accCount : 0 };
    });
    const accuracy = computeRecentAccuracy(last3, this.s.lifetime);

    const nextDay = addDays(day, 1);
    const backlog = overdueBatches(this.s, nextDay).reduce((total, batch) => total + batch.wordCount, 0);
    const immediateAvgLoops =
      record.immediate.cards > 0 ? record.immediate.loops / record.immediate.cards : null;
    // 断档结算（隔了好几天才补）：连续优秀天数本来就断了，先清零再算
    const gapped = this.s.lastSettledDay !== null && diffDays(this.s.lastSettledDay, day) > 1;

    const outcome: AdaptOutcome = applyAdaptation({
      currentLimit: this.s.currentLimit,
      maxLimit: this.s.maxLimit,
      recentAcc: accuracy.recentAcc,
      completionRate,
      consecutiveGoodDays: gapped ? 0 : this.s.consecutiveGoodDays,
      overdueBacklog: backlog,
      dueTotal,
      activity: { reviews: done, newWords: record.newLearned.length, immediateCards: record.immediate.cards },
      immediateGroups: record.immediate.groups,
      immediateAvgLoops,
      absent: record.absent,
    });

    this.s.currentLimit = outcome.currentLimit;
    this.s.consecutiveGoodDays = outcome.consecutiveGoodDays;
    this.s.pendingLimit = { day: nextDay, value: outcome.newWordLimit };
    this.s.lastSettledDay = day;
    record.settled = true;
    record.action = outcome.action;
    // 如果明天的记录已经被提前建出来了（例如预览过未来日历），把计划值同步过去，
    // 免得日历里明天的格子还挂着旧数字。
    const nextRecord = this.s.days[nextDay];
    if (nextRecord) nextRecord.newWordLimit = plannedNewWordLimit(this.s, nextDay);

    const nextPlan = buildDailyPlan(this.s, nextDay, { cause: outcome.reasons.join(' ') });
    const primaryLong = pickPrimaryLongBatch(nextPlan.longTermBatches);
    const longTermBatch: LongBatchJson | null = primaryLong
      ? { type: primaryLong.type, scheduledDate: primaryLong.scheduledDate, wordCount: primaryLong.wordCount }
      : null;

    const result: SettlementJson = {
      newWordLimit: outcome.newWordLimit,
      action: outcome.action,
      metrics: {
        recentAcc: round3(accuracy.recentAcc ?? 1),
        completionRate: round3(completionRate),
        consecutiveGoodDays: outcome.consecutiveGoodDays,
        overdueBacklog: backlog,
      },
      dailyPlan: {
        shortTermBatches: nextPlan.shortTermBatches.map((batch) => ({
          sourceDate: batch.sourceDate,
          daysAgo: batch.daysAgo,
          wordCount: batch.wordCount,
        })),
        longTermBatch,
        overduePool: nextPlan.overduePool.map((batch) => ({
          sourceDate: batch.sourceDate,
          wordCount: batch.wordCount,
          overdueDays: batch.overdueDays,
        })),
      },
      reason: `${formatMonthDay(day)}结算：${outcome.reasons.join(' ')}`,
    };

    this.s.lastSettlement = result;
    record.settlement = result;
    return {
      settledDay: day,
      plannedDay: nextDay,
      result,
      flags: outcome.flags,
      reasons: outcome.reasons,
    };
  }

  /** 从某天补跑到今天（断签回来时用）；断签日直接标 absent，不叠乘，见 SCHEDULER_SPEC §3。 */
  catchUp(fromDay: StudyDay, toDay: StudyDay = this.today()): SettlementReport[] {
    const reports: SettlementReport[] = [];
    let cursor = fromDay;
    while (cursor < toDay) {
      const record = this.ensureDay(cursor);
      const idle =
        record.accCount === 0 &&
        record.newLearned.length === 0 &&
        record.immediate.cards === 0 &&
        record.doneToday.length === 0;
      if (idle) record.absent = true;
      reports.push(this.settle(cursor));
      cursor = addDays(cursor, 1);
    }
    return reports;
  }

  /**
   * 每次启动都调一次（不要只在「跨天首次打开」时调）。
   *
   * 结算的是「刚结束的一天」，靠 `DayRecord.settlement` 缓存做幂等：
   * 同一天开十次，基线、连击、逾期都只动一次。这样凌晨 4 点边界前后各开一次也不会漏结算——
   * 3:59 打开算的是前一天，4:01 再打开算的是刚过去的那一天。
   *
   * 中间断档的日子走 `catchUp`（直接标 absent，不叠乘）。
   */
  startOfSession(): SessionStart {
    const today = this.today();
    // 先作废昨天的即时复习半组，再结算：否则昨天那组的 skipped 统计落不到昨天的记录上
    this.expireStaleImmediate(today);
    const reports: SettlementReport[] = [];
    const last = this.s.lastSettledDay;
    if (last && diffDays(last, today) > 1) reports.push(...this.catchUp(addDays(last, 1), today));
    reports.push(this.settle(addDays(today, -1)));
    const plan = this.plan(today);
    return { today, reports, plan };
  }

  // ---------------------------------------------------------------- 设置

  setUserDailyGoal(goal: number): void {
    const next = clampInt(goal, 1, 999);
    this.s.userDailyGoal = next;
    // 没手动钉过上限时，上限始终跟着目标 +5：否则自适应奖励的 +5 永远发不出来
    if (!this.s.maxLimitPinned) this.s.maxLimit = Math.min(999, next + INCREASE_STEP);
    // 基线不跟着上限走：上限只做截断（见 SCHEDULER_SPEC §3 第 ⑤ 条）
    if (this.s.pendingLimit) this.s.pendingLimit.value = Math.min(this.s.pendingLimit.value, this.s.maxLimit);
    if (this.s.manual) this.s.manual.value = Math.min(this.s.manual.value, this.s.maxLimit);
    const today = this.today();
    const record = this.s.days[today];
    if (record) record.newWordLimit = plannedNewWordLimit(this.s, today);
  }

  setMaxLimit(limit: number): void {
    const next = clampInt(limit, 0, 999);
    this.s.maxLimit = next;
    this.s.maxLimitPinned = true;
    if (this.s.pendingLimit) this.s.pendingLimit.value = Math.min(this.s.pendingLimit.value, next);
    if (this.s.manual) this.s.manual.value = Math.min(this.s.manual.value, next);
    const today = this.today();
    const record = this.s.days[today];
    if (record) record.newWordLimit = plannedNewWordLimit(this.s, today);
  }

  /** 手动强制改当天新词量：只影响今天，不动基线（需求 §三.5）。 */
  setManualNewWords(count: number): number {
    const day = this.today();
    const value = clampInt(count, 0, this.s.maxLimit);
    this.s.manual = { day, value };
    const record = this.ensureDay(day);
    record.newWordLimit = plannedNewWordLimit(this.s, day);
    return value;
  }

  clearManualNewWords(): void {
    this.s.manual = null;
    const today = this.today();
    const record = this.s.days[today];
    if (record) record.newWordLimit = plannedNewWordLimit(this.s, today);
  }

  stats(): SchedulerStats {
    let shortCards = 0;
    let longCards = 0;
    for (const card of Object.values(this.s.cards)) {
      if (card.phase === 'short') shortCards += 1;
      else if (card.phase === 'long') longCards += 1;
    }
    const lifetime = this.s.lifetime;
    return {
      userDailyGoal: this.s.userDailyGoal,
      maxLimit: this.s.maxLimit,
      currentLimit: this.s.currentLimit,
      consecutiveGoodDays: this.s.consecutiveGoodDays,
      newCards: this.s.unlearned.length,
      shortCards,
      longCards,
      archivedCards: this.s.archived.length,
      unlearned: this.s.unlearned.length,
      mistakes: this.mistakeCount(),
      lifetimeAcc: lifetime.count > 0 ? lifetime.score / lifetime.count : null,
      pendingImmediate: this.s.immediate.pendingCount,
      lastAvgLoops: this.s.immediate.lastAvgLoops,
    };
  }

  /** 长期节点到期但还没进批次的词数（给「我的」展示用）。 */
  longDueCount(day: StudyDay = this.today()): number {
    return Object.values(this.s.cards).filter((card) => {
      if (card.phase !== 'long') return false;
      const due = longDueDay(card);
      return due !== null && due <= day;
    }).length;
  }
}
