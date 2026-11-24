/**
 * 自适应新词量（需求 §三）。
 *
 * 纯函数，不做 IO、不读时钟：输入一天的指标，输出当天该给多少新词以及新的基线。
 * 规则顺序与需求一致，并额外写明三条需求没写、但不定义就会死锁或误伤的判定
 * （见 SCHEDULER_SPEC §3）：无数据日不判罚、断签日不叠乘、基线 ≥1 可恢复。
 */

import type { Action } from './types.ts';

/** 近 3 天权重：今天 0.5、昨天 0.3、前天 0.2。 */
export const ACC_DAY_WEIGHTS = [0.5, 0.3, 0.2] as const;

/** 历史累计正确率在 recentAcc 中的占比。 */
export const HISTORY_WEIGHT = 0.3;
export const RECENT_WEIGHT = 0.7;

export const OVERDUE_WARN_THRESHOLD = 30;
export const OVERDUE_PAUSE_THRESHOLD = 50;
export const COMPLETION_PASS = 0.95;
export const INCREASE_STEP = 5;

const EPS = 1e-9;

export interface AccSample {
  score: number;
  count: number;
}

export interface AccuracyResult {
  /** 0.7×近3天加权 + 0.3×历史；两边都没数据时为 null */
  recentAcc: number | null;
  last3: number | null;
  history: number | null;
}

/**
 * `recentAcc` 的计算。某天没有正式复习记录时该天权重剔除（其余权重照常归一），
 * 三天都没有则回落到历史累计；历史也没有则为 null（上层按「无数据」处理）。
 */
export function computeRecentAccuracy(last3: AccSample[], lifetime: AccSample): AccuracyResult {
  let weightSum = 0;
  let scoreSum = 0;
  for (let i = 0; i < ACC_DAY_WEIGHTS.length; i += 1) {
    const sample = last3[i];
    if (!sample || sample.count <= 0) continue;
    const weight = ACC_DAY_WEIGHTS[i];
    weightSum += weight;
    scoreSum += weight * (sample.score / sample.count);
  }
  const recent = weightSum > 0 ? scoreSum / weightSum : null;
  const history = lifetime.count > 0 ? lifetime.score / lifetime.count : null;
  const recentAcc =
    recent === null && history === null
      ? null
      : recent === null
        ? history
        : history === null
          ? recent
          : RECENT_WEIGHT * recent + HISTORY_WEIGHT * history;
  return { recentAcc, last3: recent, history };
}

export interface AdaptInput {
  currentLimit: number;
  maxLimit: number;
  recentAcc: number | null;
  completionRate: number;
  consecutiveGoodDays: number;
  overdueBacklog: number;
  dueTotal: number;
  activity: { reviews: number; newWords: number; immediateCards: number };
  immediateGroups: number;
  immediateAvgLoops: number | null;
  /** 明确标记「这天人没来」（补结算断签时用），比推断更可靠 */
  absent?: boolean;
}

export interface AdaptFlags {
  noAccuracyData: boolean;
  absentDay: boolean;
  /** 今天没有做任何正式复习（没有到期，或到期都没碰但不算断签） */
  idleDay: boolean;
  decreaseByAccuracy: boolean;
  pauseByAccuracy: boolean;
  decreaseByCompletion: boolean;
  blockedIncrease: boolean;
  increased: boolean;
  immediatePenalty: boolean;
  overdueWarning: boolean;
  overduePause: boolean;
}

export interface AdaptOutcome {
  newWordLimit: number;
  action: Action;
  /** 结算后的基线（pause / maintain 时不变） */
  currentLimit: number;
  consecutiveGoodDays: number;
  reasons: string[];
  flags: AdaptFlags;
}

function clampInt(value: number, lo: number, hi: number): number {
  if (!Number.isFinite(value)) return lo;
  return Math.min(hi, Math.max(lo, Math.trunc(value)));
}

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  const text = (Math.max(0, Math.min(1, value)) * 100).toFixed(1);
  return `${text.replace(/\.0$/, '')}%`;
}

export function applyAdaptation(input: AdaptInput): AdaptOutcome {
  const max = clampInt(input.maxLimit, 0, 999);
  // 基线不按 maxLimit 截断：上限只负责「今天最多给多少」，
  // 用户把上限调小再调回来时，基线不该被永久改写（settle 时也只写回真正增减过的值）。
  const rawBaseline = Math.max(0, Math.trunc(Number.isFinite(input.currentLimit) ? input.currentLimit : 0));
  let consecutiveGoodDays = Math.max(0, Math.trunc(input.consecutiveGoodDays));
  const acc = input.recentAcc;
  const completion = Number.isFinite(input.completionRate) ? Math.max(0, Math.min(1, input.completionRate)) : 1;
  const reviews = Math.max(0, Math.trunc(input.activity.reviews));
  const newWords = Math.max(0, Math.trunc(input.activity.newWords));
  const immediateCards = Math.max(0, Math.trunc(input.activity.immediateCards));
  /** 人根本没来：有到期复习，却没有任何学习动作（断签）。 */
  const absent =
    input.absent === true || (input.dueTotal > 0 && reviews === 0 && newWords === 0 && immediateCards === 0);

  const flags: AdaptFlags = {
    noAccuracyData: false,
    absentDay: absent,
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
  const reasons: string[] = [];
  let limit = rawBaseline;

  // ① 正确率分支（需求 §三.3 前半）
  // 「今天一张正式复习都没做」的日子不算优秀日：否则历史正确率会替它兜底，
  // 空转三天就能白拿一次 +5（连续优秀天数只认真实复习过的日子）。
  if (reviews === 0 && input.dueTotal === 0 && !absent) {
    flags.idleDay = true;
    flags.noAccuracyData = acc === null;
    limit = rawBaseline;
    reasons.push(`今天没有到期的正式复习，新词量维持 ${rawBaseline} 个。`);
  } else if (acc === null) {
    flags.noAccuracyData = true;
    reasons.push(`还没有正式复习数据，先按基线 ${rawBaseline} 个新词开始。`);
  } else if (acc < 0.7 - EPS) {
    limit = 0;
    consecutiveGoodDays = 0;
    flags.pauseByAccuracy = true;
    reasons.push(`近期正确率 ${formatPercent(acc)}，低于 70%，新词暂停，先把学过的词补稳。`);
  } else if (acc < 0.8 - EPS) {
    limit = Math.round(rawBaseline * 0.75);
    consecutiveGoodDays = 0;
    flags.decreaseByAccuracy = true;
    reasons.push(
      limit < rawBaseline
        ? `近期正确率 ${formatPercent(acc)}，在 70%–80% 之间，新词量从 ${rawBaseline} 降到 ${limit}，多留时间复习。`
        : `近期正确率 ${formatPercent(acc)}，在 70%–80% 之间，先维持 ${limit} 个新词，不再加量。`,
    );
  } else if (acc < 0.9 - EPS) {
    limit = rawBaseline;
    consecutiveGoodDays = 0;
    reasons.push(`近期正确率 ${formatPercent(acc)}，在 80%–90% 之间，维持 ${limit} 个新词。`);
  } else {
    const streak = consecutiveGoodDays + 1;
    if (streak >= 3 && completion >= COMPLETION_PASS - EPS) {
      // 需求 §三.3：newWordLimit = min(maxLimit, currentLimit + 5)
      const target = Math.min(max, rawBaseline + INCREASE_STEP);
      consecutiveGoodDays = 0;
      if (target > rawBaseline) {
        limit = target;
        flags.increased = true;
        reasons.push(
          `连续 3 天正确率 ≥90%、复习完成率 ${formatPercent(completion)}，新词量加 ${INCREASE_STEP}：${rawBaseline} → ${limit}。`,
        );
      } else {
        limit = rawBaseline;
        reasons.push(
          `连续 3 天正确率 ≥90%、复习完成率 ${formatPercent(completion)}，但上限 ${max} 已经不高于当前 ${rawBaseline} 个，先维持。`,
        );
      }
    } else {
      limit = rawBaseline;
      consecutiveGoodDays = streak;
      const why =
        streak >= 3
          ? `复习完成率 ${formatPercent(completion)} 不足 95%，暂不增量`
          : `连续优秀 ${streak}/3 天`;
      reasons.push(`近期正确率 ${formatPercent(acc)}，${why}，维持 ${limit} 个新词。`);
    }
  }

  // ② 完成率否决 + 断签保护（需求 §三.3、§七.7）
  if (absent) {
    limit = Math.min(limit, rawBaseline);
    consecutiveGoodDays = 0;
    reasons.push(`这天没有任何学习记录，新词量不按月折算下调，先停在 ${limit} 个，回来优先清逾期。`);
  } else if (completion < 0.9 - EPS) {
    consecutiveGoodDays = 0;
    if (completion < 0.8 - EPS) {
      const reduced = Math.round(rawBaseline * 0.8);
      limit = Math.min(limit, reduced);
      flags.decreaseByCompletion = true;
      reasons.push(
        limit < rawBaseline
          ? `复习完成率 ${formatPercent(completion)}，低于 80%，新词量下调到 ${limit} 个。`
          : `复习完成率 ${formatPercent(completion)}，低于 80%，先维持 ${limit} 个新词。`,
      );
    } else {
      limit = Math.min(limit, rawBaseline);
      flags.blockedIncrease = true;
      reasons.push(`复习完成率 ${formatPercent(completion)}，未达 90%，今天不加新词，维持 ${limit} 个。`);
    }
  }

  // ③ 即时复习信号：平均循环 ≥2 次，轻微下调（需求 §四.4）
  const avgLoops = input.immediateAvgLoops;
  if (limit > 0 && input.immediateGroups > 0 && avgLoops !== null && avgLoops >= 2 - EPS) {
    const reduced = Math.round(limit * 0.9);
    if (reduced < limit) {
      limit = reduced;
      flags.immediatePenalty = true;
      reasons.push(`即时复习平均循环 ${avgLoops.toFixed(1)} 次，这批词偏吃力，新词量再降 10%。`);
    }
  }

  // ④ 逾期硬闸（需求 §三.7、§七.6）
  if (input.overdueBacklog >= OVERDUE_PAUSE_THRESHOLD) {
    limit = 0;
    flags.overduePause = true;
    reasons.push(`逾期复习已累计 ${input.overdueBacklog} 个，超过 ${OVERDUE_PAUSE_THRESHOLD}，先暂停新词，清到 ${OVERDUE_PAUSE_THRESHOLD} 以下再恢复。`);
  } else if (input.overdueBacklog >= OVERDUE_WARN_THRESHOLD) {
    flags.overdueWarning = true;
    reasons.push(`逾期复习 ${input.overdueBacklog} 个，偏多了，建议先清一部分再学新词。`);
  }

  // ⑤ 今天实际能拿多少：上限只做截断，不写回基线
  const newWordLimit = clampInt(limit, 0, max);
  let action: Action;
  if (limit === 0) action = rawBaseline > 0 ? 'pause' : 'maintain';
  else if (limit > rawBaseline) action = 'increase';
  else if (limit < rawBaseline) action = 'decrease';
  else action = 'maintain';

  // ⑥ 基线：只有真正增减才移动；暂停/维持（含被上限截断）都保住基线
  const currentLimit = action === 'decrease' || action === 'increase' ? limit : rawBaseline;

  return { newWordLimit, action, currentLimit, consecutiveGoodDays, reasons, flags };
}
