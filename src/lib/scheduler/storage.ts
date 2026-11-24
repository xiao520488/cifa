/**
 * 调度状态的持久化。
 *
 * 与 App 现有的 `cijian.v1` 完全分开：独立 key、独立清洗。
 * 任何坏字段都回退到默认值，绝不让调度把主界面带崩。
 */

import { emptyState } from './engine.ts';
import { INCREASE_STEP } from './adaptation.ts';
import { isValidStudyDay } from './studyDay.ts';
import type {
  Action,
  CardState,
  DayRecord,
  ImmediateGroup,
  LongInterval,
  MistakeEntry,
  MistakeSource,
  NewWordOrder,
  Rating,
  SchedulerState,
  ShortBatchJson,
  ShortInterval,
  SettlementJson,
} from './types.ts';
import { LONG_INTERVALS, SHORT_INTERVALS } from './types.ts';

export const SCHEDULER_KEY = 'cijian.scheduler.v1';

/** 只要求最常用的两个方法，`localStorage` 与内存实现都能直接传。 */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type Rec = Record<string, unknown>;

function isRecord(value: unknown): value is Rec {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function int(value: unknown, fallback: number, lo: number, hi: number): number {
  const numeric = typeof value === 'number' && Number.isFinite(value) ? Math.trunc(value) : fallback;
  return Math.min(hi, Math.max(lo, numeric));
}

function num(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function wordList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string' && item && !out.includes(item)) out.push(item);
  }
  return out;
}

function rating(value: unknown): Rating | null {
  return value === 'known' || value === 'fuzzy' || value === 'unknown' ? value : null;
}

function action(value: unknown): Action | null {
  return value === 'pause' || value === 'decrease' || value === 'maintain' || value === 'increase' ? value : null;
}

function shortInterval(value: unknown): ShortInterval {
  const numeric = Number(value);
  return (SHORT_INTERVALS as readonly number[]).includes(numeric) ? (numeric as ShortInterval) : 1;
}

function longInterval(value: unknown): LongInterval | null {
  const numeric = Number(value);
  return (LONG_INTERVALS as readonly number[]).includes(numeric) ? (numeric as LongInterval) : null;
}

function readCard(word: string, raw: unknown): CardState | null {
  if (!isRecord(raw)) return null;
  const phase = raw.phase === 'long' || raw.phase === 'archived' ? raw.phase : 'short';
  const due = isValidStudyDay(raw.due) ? raw.due : null;
  const long = longInterval(raw.longInterval);
  const anchor = isValidStudyDay(raw.longAnchor) ? raw.longAnchor : null;
  // 僵尸卡（short 却没有到期日 / long 却缺节点或锚点）直接丢弃，交给上层放回未学池
  if (phase === 'short' && !due) return null;
  if (phase === 'long' && (!long || !anchor)) return null;
  return {
    word,
    phase,
    interval: shortInterval(raw.interval),
    due: phase === 'short' ? due : null,
    longInterval: phase === 'long' ? long : null,
    longAnchor: phase === 'long' ? anchor : null,
    reps: int(raw.reps, 0, 0, 100000),
    lapses: int(raw.lapses, 0, 0, 100000),
    lastRating: rating(raw.lastRating),
    lastReviewed: isValidStudyDay(raw.lastReviewed) ? raw.lastReviewed : null,
    hard: raw.hard === true,
    relearned: raw.relearned === true,
    inMistakes: raw.inMistakes === true,
    skippedImmediate: raw.skippedImmediate === true,
    learnedOn: isValidStudyDay(raw.learnedOn) ? raw.learnedOn : null,
  };
}

function readBatchList(value: unknown): ShortBatchJson[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isRecord)
    .filter((item) => isValidStudyDay(item.sourceDate))
    .map((item) => ({
      sourceDate: item.sourceDate as string,
      daysAgo: int(item.daysAgo, 1, 0, 100000),
      wordCount: int(item.wordCount, 0, 0, 100000),
    }));
}

function readDay(day: string, raw: unknown): DayRecord | null {
  if (!isValidStudyDay(day) || !isRecord(raw)) return null;
  const immediate = isRecord(raw.immediate) ? raw.immediate : {};
  const dueSnapshot = wordList(raw.dueSnapshot);
  const accCount = int(raw.accCount, 0, 0, 100000);
  // 得分不可能超过次数、也不可能为负：坏数据在这里夹住，避免算出负正确率
  const accScore = Math.min(Math.max(0, num(raw.accScore)), accCount);
  return {
    day,
    dueSnapshot,
    snapshotDone: raw.snapshotDone === true || dueSnapshot.length > 0,
    planSnapshot: readBatchList(raw.planSnapshot),
    doneToday: wordList(raw.doneToday),
    newWordLimit: int(raw.newWordLimit, 0, 0, 999),
    newLearned: wordList(raw.newLearned),
    accScore,
    accCount,
    retried: int(raw.retried, 0, 0, 100000),
    immediate: {
      groups: int(immediate.groups, 0, 0, 100000),
      cards: int(immediate.cards, 0, 0, 100000),
      loops: int(immediate.loops, 0, 0, 1000000),
      skipped: int(immediate.skipped, 0, 0, 100000),
    },
    settled: raw.settled === true,
    action: action(raw.action),
    absent: raw.absent === true,
    settlement: readSettlement(raw.settlement),
  };
}

function readGroup(raw: unknown): ImmediateGroup | null {
  if (!isRecord(raw)) return null;
  const words = wordList(raw.words);
  if (words.length === 0) return null;
  const loopCount: Record<string, number> = {};
  if (isRecord(raw.loopCount)) {
    for (const [word, value] of Object.entries(raw.loopCount)) {
      if (typeof value === 'number' && Number.isFinite(value) && value >= 0) loopCount[word] = Math.trunc(value);
    }
  }
  const queue = wordList(raw.queue).filter((word) => words.includes(word));
  return {
    words,
    queue: queue.length > 0 ? queue : [...words],
    loopCount,
    startedOn: isValidStudyDay(raw.startedOn) ? raw.startedOn : '',
  };
}

function readLimit(raw: unknown): { day: string; value: number } | null {
  if (!isRecord(raw) || !isValidStudyDay(raw.day)) return null;
  return { day: raw.day, value: int(raw.value, 0, 0, 999) };
}

function readLongBatch(raw: unknown): SettlementJson['dailyPlan']['longTermBatch'] {
  if (!isRecord(raw)) return null;
  const type = raw.type === '90d' || raw.type === '180d' || raw.type === '360d' ? raw.type : '30d';
  return {
    type,
    scheduledDate: isValidStudyDay(raw.scheduledDate) ? raw.scheduledDate : '',
    wordCount: int(raw.wordCount, 0, 0, 100000),
  };
}

function readSettlement(raw: unknown): SettlementJson | null {
  if (!isRecord(raw)) return null;
  const decision = action(raw.action);
  if (!decision) return null;
  const metrics = isRecord(raw.metrics) ? raw.metrics : {};
  const plan = isRecord(raw.dailyPlan) ? raw.dailyPlan : {};
  return {
    newWordLimit: int(raw.newWordLimit, 0, 0, 999),
    action: decision,
    metrics: {
      recentAcc: num(metrics.recentAcc, 1),
      completionRate: num(metrics.completionRate, 1),
      consecutiveGoodDays: int(metrics.consecutiveGoodDays, 0, 0, 10000),
      overdueBacklog: int(metrics.overdueBacklog, 0, 0, 100000),
    },
    dailyPlan: {
      shortTermBatches: readBatchList(plan.shortTermBatches),
      longTermBatch: readLongBatch(plan.longTermBatch),
      overduePool: Array.isArray(plan.overduePool)
        ? plan.overduePool
            .filter(isRecord)
            .filter((item) => isValidStudyDay(item.sourceDate))
            .map((item) => ({
              sourceDate: item.sourceDate as string,
              wordCount: int(item.wordCount, 0, 0, 100000),
              overdueDays: int(item.overdueDays, 0, 0, 100000),
            }))
        : [],
    },
    reason: str(raw.reason),
  };
}

/** 历史累计：次数非负、得分夹在 [0, 次数]（每次最多 1 分），坏数据不会算出负正确率。 */
function readLifetime(raw: unknown): { score: number; count: number } {
  const record = isRecord(raw) ? raw : {};
  const count = int(record.count, 0, 0, 10000000);
  const score = Math.min(Math.max(0, num(record.score)), count);
  return { score, count };
}

function mistakeSource(value: unknown): MistakeSource {
  return value === 'immediate' || value === 'archived' || value === 'quiz' ? value : 'review';
}

/**
 * 错词本账本。
 *
 * 老状态（2026-11-24 之前）只有卡片上的 `inMistakes` 布尔，没有次数与日期：
 * 这里按 `lapses` / `lastReviewed` 补一次，之后账本才是唯一来源。
 */
function readMistakes(raw: unknown, cards: Record<string, CardState>): Record<string, MistakeEntry> {
  const out: Record<string, MistakeEntry> = {};
  if (isRecord(raw)) {
    for (const [word, value] of Object.entries(raw)) {
      if (!word || !isRecord(value) || !isValidStudyDay(value.lastDay)) continue;
      out[word] = {
        word,
        count: int(value.count, 1, 1, 100000),
        lastDay: value.lastDay,
        source: mistakeSource(value.source),
      };
    }
  }
  for (const card of Object.values(cards)) {
    if (!card.inMistakes || out[card.word]) continue;
    const lastDay = card.lastReviewed ?? card.learnedOn;
    if (!lastDay) continue;
    out[card.word] = { word: card.word, count: Math.max(1, card.lapses), lastDay, source: 'review' };
  }
  return out;
}

/** 把任意输入清洗成合法状态；坏的整段丢弃。 */
export function sanitizeScheduler(raw: unknown): SchedulerState {
  const base = emptyState();
  if (!isRecord(raw)) return base;

  const goal = int(raw.userDailyGoal, base.userDailyGoal, 1, 999);
  const pinned = raw.maxLimitPinned === true;
  let maxLimit = int(raw.maxLimit, base.maxLimit, 0, 999);
  // 一次性迁移（2026-11-24）：旧版 `setUserDailyGoal()` 会把未钉住的上限同步成目标，
  // 于是 `maxLimit === userDailyGoal`，自适应奖励的 +5 永远被截断。
  // 只有「没手动钉过、上限大于 0、且不高于目标」才提到 目标 +5；
  // 上限 0 是用户主动暂停，绝不能偷偷改回来。
  if (!pinned && maxLimit > 0 && maxLimit <= goal) maxLimit = Math.min(999, goal + INCREASE_STEP);

  const cards: Record<string, CardState> = {};
  const dropped: string[] = [];
  if (isRecord(raw.cards)) {
    for (const [word, value] of Object.entries(raw.cards)) {
      if (!word) continue;
      const card = readCard(word, value);
      if (card) cards[word] = card;
      else dropped.push(word);
    }
  }

  // 归档索引完全由卡片状态推导：不留下「没有卡片的归档词」，也不漏掉已归档的卡
  const archived = Object.values(cards)
    .filter((card) => card.phase === 'archived')
    .map((card) => card.word);

  // 僵尸卡（被丢弃的）放回未学池尾部，按新词重学，不凭空消失
  const unlearned = wordList([...wordList(raw.unlearned), ...dropped]).filter(
    (word) => !cards[word] && !archived.includes(word),
  );

  const relearned: Record<string, boolean> = {};
  if (isRecord(raw.relearned)) {
    for (const [word, value] of Object.entries(raw.relearned)) {
      if (value === true) relearned[word] = true;
    }
  }

  const freqRank: Record<string, number> = {};
  if (isRecord(raw.freqRank)) {
    for (const [word, value] of Object.entries(raw.freqRank)) {
      if (typeof value === 'number' && Number.isFinite(value)) freqRank[word] = Math.trunc(value);
    }
  }

  const days: Record<string, DayRecord> = {};
  if (isRecord(raw.days)) {
    const entries = Object.entries(raw.days)
      .filter(([day]) => isValidStudyDay(day))
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .slice(-400);
    for (const [day, value] of entries) {
      const record = readDay(day, value);
      if (record) days[day] = record;
    }
  }

  const immediateRaw = isRecord(raw.immediate) ? raw.immediate : {};
  const pendingWords = wordList(immediateRaw.pendingWords).filter((word) => cards[word]);
  const statsRaw = isRecord(immediateRaw.stats) ? immediateRaw.stats : {};
  const lastAvgLoops = immediateRaw.lastAvgLoops;
  const order: NewWordOrder = raw.newWordOrder === 'freq' ? 'freq' : 'list';

  return {
    v: 1,
    userDailyGoal: goal,
    maxLimit,
    maxLimitPinned: pinned,
    currentLimit: int(raw.currentLimit, goal, 0, 999),
    consecutiveGoodDays: int(raw.consecutiveGoodDays, 0, 0, 10000),
    newWordOrder: order,
    freqRank,
    unlearned,
    relearned,
    cards,
    archived,
    days,
    mistakes: readMistakes(raw.mistakes, cards),
    immediate: {
      pendingCount: pendingWords.length,
      pendingWords,
      active: readGroup(immediateRaw.active),
      stats: {
        groups: int(statsRaw.groups, 0, 0, 100000),
        cards: int(statsRaw.cards, 0, 0, 100000),
        loops: int(statsRaw.loops, 0, 0, 1000000),
        skipped: int(statsRaw.skipped, 0, 0, 100000),
      },
      lastAvgLoops: typeof lastAvgLoops === 'number' && Number.isFinite(lastAvgLoops) ? lastAvgLoops : null,
    },
    pendingLimit: readLimit(raw.pendingLimit),
    manual: readLimit(raw.manual),
    lifetime: readLifetime(raw.lifetime),
    lastSettlement: readSettlement(raw.lastSettlement),
    lastSettledDay: isValidStudyDay(raw.lastSettledDay) ? raw.lastSettledDay : null,
  };
}

function resolveStorage(store?: KeyValueStore | null): KeyValueStore | null {
  if (store) return store;
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function saveScheduler(state: SchedulerState, store?: KeyValueStore | null): void {
  const target = resolveStorage(store);
  if (!target) return;
  try {
    target.setItem(SCHEDULER_KEY, JSON.stringify(state));
  } catch {
    /* 隐私模式 / 存满：静默降级，不打断学习 */
  }
}

export function loadScheduler(store?: KeyValueStore | null): SchedulerState {
  const target = resolveStorage(store);
  if (!target) return emptyState();
  let raw: string | null = null;
  try {
    raw = target.getItem(SCHEDULER_KEY);
  } catch {
    return emptyState();
  }
  if (!raw) return emptyState();
  try {
    return sanitizeScheduler(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}
