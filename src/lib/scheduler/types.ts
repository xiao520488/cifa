import type { StudyDay } from './studyDay.ts';

/** 正式复习 / 长期批次的作答。评分：认识 1、模糊 0.5、不认识 0（需求 §二.2）。 */
export type Rating = 'known' | 'fuzzy' | 'unknown';

export const RATING_SCORE: Record<Rating, number> = { known: 1, fuzzy: 0.5, unknown: 0 };
export const RATING_LABEL: Record<Rating, string> = { known: '认识', fuzzy: '模糊', unknown: '不认识' };

export type ShortInterval = 1 | 2 | 6 | 15;
export type LongInterval = 30 | 90 | 180 | 360;

export const SHORT_INTERVALS: readonly ShortInterval[] = [1, 2, 6, 15];
export const LONG_INTERVALS: readonly LongInterval[] = [30, 90, 180, 360];

export type Phase = 'new' | 'short' | 'long' | 'archived';
export type Action = 'pause' | 'decrease' | 'maintain' | 'increase';

/** 未学新词池的抽取顺序：词表顺序（默认）/ 词频。 */
export type NewWordOrder = 'list' | 'freq';

/** 一张卡的全部状态。`word` 即唯一 id。 */
export interface CardState {
  word: string;
  phase: Phase;
  /** 当前所处的短期档位；phase 为 long/archived 时保留最后一次的值 */
  interval: ShortInterval;
  /** 下一次到期学习日；long / archived 阶段为 null（长期用 longAnchor + longInterval 算） */
  due: StudyDay | null;
  /** 长期节点 30/90/180/360；未进入长期为 null */
  longInterval: LongInterval | null;
  /** 进入当前长期节点的学习日 */
  longAnchor: StudyDay | null;
  /** 正式复习次数（不含即时复习、不含重试） */
  reps: number;
  /** 不认识次数 */
  lapses: number;
  lastRating: Rating | null;
  lastReviewed: StudyDay | null;
  /** 即时复习循环 3 次仍不认识 */
  hard: boolean;
  /** 逾期 >7 天被打回未学池、又被重新学到 */
  relearned: boolean;
  /** 错词本 */
  inMistakes: boolean;
  /** 即时复习被用户跳过（次日 1 天批次置顶） */
  skippedImmediate: boolean;
  /** 首次学到这个新词的学习日 */
  learnedOn: StudyDay | null;
}

/** 一个学习日的快照与统计。完成率的分母只认 dueSnapshot。 */
export interface DayRecord {
  day: StudyDay;
  /** 当天到期（短期正式）词表快照，建立当天计划时写入，之后不再变 */
  dueSnapshot: string[];
  /** 快照是否已经拍过（空到期日也需要标记，避免被当成「还没拍」） */
  snapshotDone: boolean;
  /** 当天的批次快照（来源日期 + 词数），日历直接读它，不实时重算 */
  planSnapshot: ShortBatchJson[];
  /** 快照中当天已完成的词 */
  doneToday: string[];
  /** 当天计划的新词量 */
  newWordLimit: number;
  /** 当天实际学的新词 */
  newLearned: string[];
  /** 短期正式复习的加权得分与次数（不含长期批次、即时复习、重试） */
  accScore: number;
  accCount: number;
  /** 答错后立即重试答对的次数（只统计，不进正确率） */
  retried: number;
  immediate: { groups: number; cards: number; loops: number; skipped: number };
  settled: boolean;
  action: Action | null;
  /** 补结算时明确标记「这一天没来」（避免卡片被清扫后看起来像「当天无到期」） */
  absent: boolean;
  /** 结算结果缓存：同一天重复结算时原样返回，不会重复抬高连续优秀天数 */
  settlement: SettlementJson | null;
}

/** 错词来源：正式复习、即时复习循环 3 次、归档抽查、错词本单测。 */
export type MistakeSource = 'review' | 'immediate' | 'archived' | 'quiz';

/**
 * 错词本里的一条记录。
 *
 * 和 `CardState` 刻意解耦：卡片可能被「逾期 >7 天清扫」删掉并放回未学池，
 * 但「这个词我错了几次、最后一次是什么时候」属于历史，不该跟着卡片一起消失。
 */
export interface MistakeEntry {
  word: string;
  /** 累计答错次数（正式复习不认识 + 即时复习 3 次硬词 + 错词本单测答错） */
  count: number;
  /** 最后一次答错的学习日 */
  lastDay: StudyDay;
  /** 最后一次是在哪条路径上错的 */
  source: MistakeSource;
}

/** 错词本一行：条目 + 当前卡片（卡片可能已经不存在）。 */
export interface MistakeRow extends MistakeEntry {
  card: CardState | null;
  /** 卡片还在、能拿出来单测 */
  canQuiz: boolean;
  /** 卡片已被清扫回未学池（不在卡库里），只能看不能测 */
  relearning: boolean;
}

export interface ImmediateGroup {
  words: string[];
  queue: string[];
  loopCount: Record<string, number>;
  startedOn: StudyDay;
}

/** 即时复习状态（需求 §四）。pendingCount 与 pendingWords 永远等长。 */
export interface ImmediateState {
  pendingCount: number;
  pendingWords: string[];
  active: ImmediateGroup | null;
  stats: { groups: number; cards: number; loops: number; skipped: number };
  lastAvgLoops: number | null;
}

export interface ShortBatchJson {
  sourceDate: StudyDay;
  daysAgo: number;
  wordCount: number;
}

export interface LongBatchJson {
  type: '30d' | '90d' | '180d' | '360d';
  scheduledDate: StudyDay;
  wordCount: number;
}

export interface OverdueJson {
  sourceDate: StudyDay;
  wordCount: number;
  overdueDays: number;
}

export interface DailyPlanJson {
  shortTermBatches: ShortBatchJson[];
  longTermBatch: LongBatchJson | null;
  overduePool: OverdueJson[];
}

/** 需求 §九 的结算输出，严格只有这 5 个键。 */
export interface SettlementJson {
  newWordLimit: number;
  action: Action;
  metrics: {
    recentAcc: number;
    completionRate: number;
    consecutiveGoodDays: number;
    overdueBacklog: number;
  };
  dailyPlan: DailyPlanJson;
  reason: string;
}

/** 供 UI 使用的批次（比 JSON 多带词表）。 */
export interface ShortBatch extends ShortBatchJson {
  words: string[];
}

export interface LongBatch extends LongBatchJson {
  words: string[];
}

export interface OverdueBatch extends OverdueJson {
  words: string[];
}

export type PlanWarning = 'none' | 'overdue-warning' | 'overdue-pause';

/** 当天新词预算：计划值、现在真正能开始学多少、被哪道闸挡住 */
export interface WordBudget {
  planned: number;
  allowed: number;
  blockedBy: 'review' | 'overdue' | 'pool' | 'quota' | 'paused' | null;
}

export interface DailyPlan {
  day: StudyDay;
  /** 还剩下的今日批次（做完就消失，用于复习流程） */
  shortTermBatches: ShortBatch[];
  /** 当天一开始的批次快照（做完也不变，用于日历与进度展示） */
  plannedBatches: ShortBatchJson[];
  longTermBatches: LongBatch[];
  /** 短期逾期池（影响新词决策的只有这一栏） */
  overduePool: OverdueBatch[];
  /** 长期逾期（错过周日/1 号批次），只展示，不影响新词量（需求 §六.3） */
  longTermOverdue: OverdueBatch[];
  /** 结算出来的计划新词量（需求 §八.1.B 的「计划值」） */
  newWordLimit: number;
  /** 现在真的能开始学的量：复习闸 / 逾期闸 / 池余量之后的值 */
  allowedNewWords: number;
  /** 被哪道闸挡住；没被挡就是 null */
  newWordBlocked: WordBudget['blockedBy'];
  userDailyGoal: number;
  totals: {
    dueToday: number;
    doneToday: number;
    overdue: number;
    longOverdue: number;
    newLearned: number;
  };
  warning: PlanWarning;
  reason: string;
}

export interface CalendarDay {
  day: StudyDay;
  weekdayLabel: string;
  /** 当天批次的快照（历史日不重算；未来日是已排定的到期词） */
  shortTermBatches: ShortBatchJson[];
  longTermBatches: LongBatch[];
  /** 计划新词（当天结算写入，未来日期为预估值） */
  newWordPlan: number;
  /** 现在真的能开始学的量（未来日期为预估值） */
  newWordAllowed: number;
  /** 被哪道闸挡住（今日/未来才有意义；历史日恒为 null） */
  newWordBlocked: WordBudget['blockedBy'];
  /** 实际学到的新词 */
  newWordDone: number;
  /** 当天的新词目标（用来标 ↑ +5 / 减量） */
  newWordGoal: number;
  dueTotal: number;
  doneTotal: number;
  /** 当天没做完的到期复习 → 日历标「逾期 X 词」 */
  overdue: number;
  isToday: boolean;
  isPast: boolean;
  /** 未来日期没有真实数据，只有已排定的批次与估算新词量 */
  estimated: boolean;
}

/** 未来某个长期批次日的预告：本周日 30 天批次、约 30 词。 */
export interface LongForecast {
  type: LongBatchJson['type'];
  /** 批次日 */
  date: StudyDay;
  weekdayLabel: string;
  /** 距今几天（1 = 明天） */
  daysAhead: number;
  /** 预计会进这一批的词数 */
  wordCount: number;
  /** 是否落在日历窗口内（窗口内已有批次时 UI 不必再挂预告行） */
  withinWindow: boolean;
}

/** 日历页一次要的全部东西：8 天格子 + 长期批次预告。 */
export interface CalendarView {
  days: CalendarDay[];
  /** 窗口内的长期批次预告；窗口内已有长期批次或长期库为空时为 null */
  longForecast: LongForecast | null;
}

/** 全部持久化状态。存独立 key，不碰 `cijian.v1`。 */
export interface SchedulerState {
  v: 1;
  userDailyGoal: number;
  maxLimit: number;
  maxLimitPinned: boolean;
  currentLimit: number;
  consecutiveGoodDays: number;
  newWordOrder: NewWordOrder;
  /** 词频名次，freq 序时使用 */
  freqRank: Record<string, number>;
  unlearned: string[];
  relearned: Record<string, boolean>;
  cards: Record<string, CardState>;
  archived: string[];
  days: Record<StudyDay, DayRecord>;
  /** 错词本账本（与卡片生命周期无关，见 MistakeEntry） */
  mistakes: Record<string, MistakeEntry>;
  immediate: ImmediateState;
  /** 昨日结算写入的次日新词量 */
  pendingLimit: { day: StudyDay; value: number } | null;
  /** 用户手动强制改的当天新词量（不改变基线） */
  manual: { day: StudyDay; value: number } | null;
  lifetime: { score: number; count: number };
  lastSettlement: SettlementJson | null;
  lastSettledDay: StudyDay | null;
}
