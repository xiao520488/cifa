/**
 * 批次装配与日历（需求 §五、§六、§七、§八）。
 *
 * 纯函数：只读 state，不写。所有「今天到期什么」都从卡片现算，
 * 但完成率的分母只认 `DayRecord.dueSnapshot`（历史不重算）。
 */

import {
  addDays,
  diffDays,
  formatMonthDay,
  isMonthFirst,
  previousMonthFirst,
  previousWeekday,
  weekday,
  weekdayLabel,
} from './studyDay.ts';
import type { StudyDay } from './studyDay.ts';
import type {
  CalendarDay,
  CalendarView,
  DailyPlan,
  DayRecord,
  LongBatch,
  LongForecast,
  LongInterval,
  OverdueBatch,
  PlanWarning,
  SchedulerState,
  ShortBatch,
  ShortInterval,
  WordBudget,
} from './types.ts';
import { LONG_INTERVALS, SHORT_INTERVALS } from './types.ts';
import { longDueDay } from './cards.ts';
import { OVERDUE_PAUSE_THRESHOLD, OVERDUE_WARN_THRESHOLD } from './adaptation.ts';

export const LONG_TYPE: Record<LongInterval, LongBatch['type']> = {
  30: '30d',
  90: '90d',
  180: '180d',
  360: '360d',
};

/** 每日逾期消化建议上限，只作提示（需求 §七.5）。 */
export const OVERDUE_SUGGEST_PER_DAY = 30;

function sum(batches: Array<{ wordCount: number }>): number {
  return batches.reduce((total, batch) => total + batch.wordCount, 0);
}

/**
 * `dueSnapshot` 的成员索引。
 *
 * 完成率的分子要判「这个词在不在当天的快照里」。直接用 `Array.includes` 的话，
 * 5000 词规模下每次结算都是 O(到期数²)，全量基准会顶到几十毫秒——所以这里缓存成 Set。
 * 快照只在当天第一次 `plan()` 拍一次（之后 `snapshotDone` 挡住），因此按长度校验即可。
 */
const snapshotIndexCache = new WeakMap<DayRecord, Set<string>>();

export function snapshotWordSet(record: DayRecord): Set<string> {
  const cached = snapshotIndexCache.get(record);
  if (cached && cached.size === record.dueSnapshot.length) return cached;
  const index = new Set(record.dueSnapshot);
  snapshotIndexCache.set(record, index);
  return index;
}

/** 跳过的即时复习、hardWord 排在批次最前（需求 §四.2、§四.5）。 */
function prioritize(state: SchedulerState, words: string[]): string[] {
  const head: string[] = [];
  const rest: string[] = [];
  for (const word of words) {
    const card = state.cards[word];
    if (card && (card.skippedImmediate || card.hard)) head.push(word);
    else rest.push(word);
  }
  return [...head, ...rest];
}

/** 今天到期的四个短期批次（1/2/6/15 天前），只返回非空行。 */
export function shortBatches(state: SchedulerState, day: StudyDay): ShortBatch[] {
  const groups = new Map<ShortInterval, string[]>();
  for (const card of Object.values(state.cards)) {
    if (card.phase !== 'short' || card.due !== day) continue;
    const bucket = groups.get(card.interval);
    if (bucket) bucket.push(card.word);
    else groups.set(card.interval, [card.word]);
  }
  return SHORT_INTERVALS.filter((interval) => groups.has(interval)).map((interval) => {
    const words = prioritize(state, groups.get(interval) ?? []);
    return {
      sourceDate: addDays(day, -interval),
      daysAgo: interval,
      wordCount: words.length,
      words,
    };
  });
}

/** 逾期池：到期未完成的短期复习，按逾期天数从短到长（需求 §七.4）。 */
export function overdueBatches(state: SchedulerState, day: StudyDay): OverdueBatch[] {
  const groups = new Map<StudyDay, string[]>();
  for (const card of Object.values(state.cards)) {
    if (card.phase !== 'short' || !card.due) continue;
    if (diffDays(card.due, day) <= 0) continue;
    const bucket = groups.get(card.due);
    if (bucket) bucket.push(card.word);
    else groups.set(card.due, [card.word]);
  }
  return [...groups.entries()]
    .map(([sourceDate, words]) => ({
      sourceDate,
      wordCount: words.length,
      overdueDays: diffDays(sourceDate, day),
      words,
    }))
    .sort((a, b) => a.overdueDays - b.overdueDays);
}

function reachedLongNode(state: SchedulerState, interval: LongInterval, day: StudyDay): string[] {
  const words: string[] = [];
  for (const card of Object.values(state.cards)) {
    if (card.phase !== 'long' || card.longInterval !== interval) continue;
    const due = longDueDay(card);
    if (due && due <= day) words.push(card.word);
  }
  return words;
}

/** 今天是批次日时，落在今天的长期批次（周日跑 30d；每月 1 号跑 90/180/360）。 */
export function longBatchesFor(state: SchedulerState, day: StudyDay): LongBatch[] {
  const isSunday = weekday(day) === 0;
  const isFirst = isMonthFirst(day);
  const out: LongBatch[] = [];
  for (const interval of LONG_INTERVALS) {
    const scheduled = interval === 30 ? isSunday : isFirst;
    if (!scheduled) continue;
    const words = prioritize(state, reachedLongNode(state, interval, day));
    if (words.length === 0) continue;
    out.push({
      type: LONG_TYPE[interval],
      scheduledDate: day,
      wordCount: words.length,
      words,
    });
  }
  return out;
}

function isLongBatchDay(interval: LongInterval, day: StudyDay): boolean {
  return interval === 30 ? weekday(day) === 0 : isMonthFirst(day);
}

/** 最近的（严格早于 day）批次日。 */
function previousBatchDay(interval: LongInterval, day: StudyDay): StudyDay {
  return interval === 30 ? previousWeekday(day, 0) : previousMonthFirst(day);
}

/**
 * 错过批次的长期复习：到期日早于「上一个批次日」，说明本该在那一批里做完。
 * 单独成栏，不计入逾期池总数（需求 §六.3：长期批次不影响新词决策）。
 * 今天就是批次日、且这个词已收进今天的批次时不重复展示。
 */
export function longOverdueBatches(state: SchedulerState, day: StudyDay): OverdueBatch[] {
  const groups = new Map<StudyDay, string[]>();
  for (const card of Object.values(state.cards)) {
    if (card.phase !== 'long' || card.longInterval === null) continue;
    const due = longDueDay(card);
    if (!due) continue;
    if (due <= day && isLongBatchDay(card.longInterval, day)) continue;
    const batchDay = previousBatchDay(card.longInterval, day);
    if (due > batchDay) continue;
    const bucket = groups.get(batchDay);
    if (bucket) bucket.push(card.word);
    else groups.set(batchDay, [card.word]);
  }
  return [...groups.entries()]
    .map(([sourceDate, words]) => ({
      sourceDate,
      wordCount: words.length,
      overdueDays: diffDays(sourceDate, day),
      words,
    }))
    .sort((a, b) => a.overdueDays - b.overdueDays);
}

/** JSON 只能放一条长期批次：按 360 > 180 > 90 > 30 取优先。 */
export function pickPrimaryLongBatch(batches: LongBatch[]): LongBatch | null {
  const priority: LongBatch['type'][] = ['360d', '180d', '90d', '30d'];
  for (const type of priority) {
    const found = batches.find((batch) => batch.type === type);
    if (found) return found;
  }
  return null;
}

/**
 * 当天生效的新词量：手动强制 > 昨日结算写入 > 当前基线。
 * 用户手动改量只影响当天，不改变基线（需求 §三.5）。
 */
export function plannedNewWordLimit(state: SchedulerState, day: StudyDay): number {
  const manual = state.manual && state.manual.day === day ? state.manual.value : null;
  const pending = state.pendingLimit && state.pendingLimit.day === day ? state.pendingLimit.value : null;
  const raw = manual ?? pending ?? state.currentLimit;
  const max = Math.max(0, Math.trunc(state.maxLimit));
  if (!Number.isFinite(raw)) return 0;
  return Math.min(max, Math.max(0, Math.trunc(raw)));
}

function completionOf(record: DayRecord | undefined): { due: number; done: number } {
  if (!record) return { due: 0, done: 0 };
  const due = record.dueSnapshot.length;
  const index = snapshotWordSet(record);
  const done = record.doneToday.filter((word) => index.has(word)).length;
  return { due, done };
}

/**
 * 当天新词预算：结算计划值 → 池余量 → 复习闸 → 逾期闸。
 * `plan()`、`calendar()`、`allowance()`、`learnNewWord()` 共用这一份，避免各处算出不同数字。
 *
 * `allowed` 是「**现在还能学几个**」：配额按「池里剩的 + 今天已学的」算，
 * 这样边学边缩池子不会把当天配额越算越小。
 */
export function computeWordBudget(state: SchedulerState, day: StudyDay): WordBudget {
  const planned = plannedNewWordLimit(state, day);
  const record = state.days[day];
  const { due, done } = completionOf(record);
  const dueTotal = due || sum(shortBatches(state, day));
  const overdue = sum(overdueBatches(state, day));

  if (planned === 0) return { planned, allowed: 0, blockedBy: 'paused' };
  if (overdue >= OVERDUE_PAUSE_THRESHOLD) return { planned, allowed: 0, blockedBy: 'overdue' };
  const rate = dueTotal === 0 ? 1 : done / dueTotal;
  if (rate < 0.9) return { planned, allowed: 0, blockedBy: 'review' };

  const learnedToday = record ? record.newLearned.length : 0;
  const pool = state.unlearned.length;
  const capTotal = Math.min(planned, pool + learnedToday);
  const allowed = Math.max(0, Math.min(capTotal - learnedToday, pool));

  let blockedBy: WordBudget['blockedBy'] = null;
  if (allowed === 0) {
    if (pool === 0) blockedBy = 'pool';
    else if (learnedToday >= capTotal) blockedBy = 'quota';
  }
  return { planned, allowed, blockedBy };
}

export interface PlanOptions {
  /** 昨日结算给出的中文解释，用于「为什么今天新词少了」 */
  cause?: string | null;
}

export function buildDailyPlan(state: SchedulerState, day: StudyDay, options: PlanOptions = {}): DailyPlan {
  const record = state.days[day];
  const short = shortBatches(state, day);
  const long = longBatchesFor(state, day);
  const overdue = overdueBatches(state, day);
  const longLate = longOverdueBatches(state, day);
  const { due, done } = completionOf(record);
  const dueToday = due || sum(short);
  const overdueCount = sum(overdue);
  const budget = computeWordBudget(state, day);
  const limit = budget.planned;
  const goal = state.userDailyGoal;

  const warning: PlanWarning =
    overdueCount >= OVERDUE_PAUSE_THRESHOLD
      ? 'overdue-pause'
      : overdueCount >= OVERDUE_WARN_THRESHOLD
        ? 'overdue-warning'
        : 'none';

  const parts: string[] = [];
  parts.push(dueToday > 0 ? `今天到期复习 ${dueToday} 个${done > 0 ? `（已完成 ${done} 个）` : ''}。` : '今天没有到期的短期复习。');
  if (limit === 0) parts.push('新词已暂停。');
  else if (limit < goal) parts.push(`计划新词 ${limit} 个，低于目标 ${goal} 个。`);
  else parts.push(`计划新词 ${limit} 个（目标 ${goal} 个）。`);
  if (budget.blockedBy === 'review') parts.push('到期复习还没做完，先复习完再开始学新词。');
  if (budget.blockedBy === 'pool') parts.push(`未学新词只剩 ${budget.allowed} 个。`);
  if (overdueCount > 0) {
    parts.push(
      `另有 ${overdueCount} 个逾期复习${overdueCount >= OVERDUE_PAUSE_THRESHOLD ? '，已超过 50，先清逾期再学新词' : overdueCount >= OVERDUE_WARN_THRESHOLD ? '，建议先清一部分' : ''}（每天清 ${OVERDUE_SUGGEST_PER_DAY} 个左右即可）。`,
    );
  }
  if (longLate.length > 0) parts.push(`长期批次还欠 ${sum(longLate)} 个，下次批次日会一起收。`);
  if (limit < goal && options.cause) parts.push(options.cause);

  return {
    day,
    shortTermBatches: short,
    plannedBatches: record?.snapshotDone
      ? record.planSnapshot
      : short.map(({ sourceDate, daysAgo, wordCount }) => ({ sourceDate, daysAgo, wordCount })),
    longTermBatches: long,
    overduePool: overdue,
    longTermOverdue: longLate,
    newWordLimit: limit,
    allowedNewWords: budget.allowed,
    newWordBlocked: budget.blockedBy,
    userDailyGoal: goal,
    totals: {
      dueToday,
      doneToday: done,
      overdue: overdueCount,
      longOverdue: sum(longLate),
      newLearned: record ? record.newLearned.length : 0,
    },
    warning,
    reason: parts.join(''),
  };
}

export interface CalendarOptions {
  today: StudyDay;
  /** 从今天起看多少天，至少 8 天（今天 + 未来 7 天，需求 §八.2） */
  days?: number;
}

export function buildCalendar(state: SchedulerState, options: CalendarOptions): CalendarDay[] {
  const days = Math.max(8, Math.trunc(options.days ?? 8));
  const out: CalendarDay[] = [];
  for (let offset = 0; offset < days; offset += 1) {
    const day = addDays(options.today, offset);
    const record = state.days[day];
    const short = shortBatches(state, day);
    const long = longBatchesFor(state, day);
    const { due, done } = completionOf(record);
    const dueTotal = due || sum(short);
    const plan = record ? record.newWordLimit : plannedNewWordLimit(state, day);
    const budget = computeWordBudget(state, day);
    const batchesForDay = record?.snapshotDone
      ? record.planSnapshot
      : short.map(({ sourceDate, daysAgo, wordCount }) => ({ sourceDate, daysAgo, wordCount }));
    const isPast = day < options.today;
    const isFuture = day > options.today;
    out.push({
      day,
      weekdayLabel: weekdayLabel(day),
      shortTermBatches: batchesForDay,
      longTermBatches: long,
      newWordPlan: plan,
      // 历史日的「现在还能学多少」没有意义（池子早变了）：直接回填当天实际学到的数，
      // 免得日历出现「计划 20、可学 0、已学 20」这种自相矛盾的三联。
      // 未来日同理：复习闸算的是「今天的复习做完没有」，套到还没到的日子上永远是 0/到期数，
      // 于是天天显示「因复习未完成，实际 0」——纯属胡说。未来日只报计划值，不装作知道届时能学多少。
      newWordAllowed: isPast ? (record ? record.newLearned.length : 0) : isFuture ? plan : budget.allowed,
      newWordBlocked: isPast || isFuture ? null : budget.blockedBy,
      newWordDone: record ? record.newLearned.length : 0,
      newWordGoal: state.userDailyGoal,
      dueTotal,
      doneTotal: done,
      overdue: record ? dueTotal - done : 0,
      isToday: day === options.today,
      isPast,
      estimated: isFuture,
    });
  }
  return out;
}

/**
 * 未来长期批次的预告（需求：未来 7 天没有长期批次时不能留空）。
 *
 * 先扫一遍长期卡找最早到期日，再从那天起只检查「周日 / 1 号」这些批次日，
 * 避免为了预告把 400 天每天的全量批次都算一遍（5000 词规模下那是几十万次遍历）。
 */
export function nextLongForecast(state: SchedulerState, today: StudyDay, days = 8): LongForecast | null {
  let earliest: StudyDay | null = null;
  for (const card of Object.values(state.cards)) {
    if (card.phase !== 'long' || card.longInterval === null) continue;
    const due = longDueDay(card);
    if (!due) continue;
    if (!earliest || due < earliest) earliest = due;
  }
  if (!earliest) return null;

  const horizon = Math.max(1, Math.trunc(days)) - 1;
  const start = Math.max(1, diffDays(today, earliest));
  // 30 天批次每周日都有；90/180/360 每月 1 号。40 天内必然命中，够用。
  for (let offset = start; offset <= start + 40; offset += 1) {
    const day = addDays(today, offset);
    if (weekday(day) !== 0 && !isMonthFirst(day)) continue;
    const primary = pickPrimaryLongBatch(longBatchesFor(state, day));
    if (!primary) continue;
    return {
      type: primary.type,
      date: day,
      weekdayLabel: weekdayLabel(day),
      daysAhead: offset,
      wordCount: primary.wordCount,
      withinWindow: offset <= horizon,
    };
  }
  return null;
}

/** 日历页一次取全：8 天格子 + 长期预告。 */
export function buildCalendarView(state: SchedulerState, options: CalendarOptions): CalendarView {
  const days = buildCalendar(state, options);
  return { days, longForecast: nextLongForecast(state, options.today, Math.max(8, Math.trunc(options.days ?? 8))) };
}

/** 日历标题用的一行摘要，例如「1天前（11月23日）：20 词」。 */
export function describeShortBatch(batch: ShortBatch): string {
  return `${batch.daysAgo}天前（${formatMonthDay(batch.sourceDate)}）：${batch.wordCount} 词`;
}
