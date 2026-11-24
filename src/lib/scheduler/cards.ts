/**
 * 单张卡的流转（需求 §二.3、§五、§六）。
 *
 *   1d ──认识──▶ 2d ──▶ 6d ──▶ 15d ──▶ 长期 30 ──▶ 90 ──▶ 180 ──▶ 360 ──▶ 归档
 *    ▲              │
 *    └── 不认识 ─────┘   模糊则回退一档：1→1、2→1、6→2、15→6
 *
 * 全部是纯函数：传入旧卡，返回新卡，不修改入参。
 */

import { addDays } from './studyDay.ts';
import type { StudyDay } from './studyDay.ts';
import type { CardState, LongInterval, Rating, ShortInterval } from './types.ts';

/** 短期档位 → 下一档；15 之后进长期。 */
const NEXT_SHORT: Record<ShortInterval, ShortInterval | null> = { 1: 2, 2: 6, 6: 15, 15: null };
/** 模糊：回退一档（需求例：6 天批次模糊 → 打回 2 天）。 */
const PREV_SHORT: Record<ShortInterval, ShortInterval> = { 1: 1, 2: 1, 6: 2, 15: 6 };
const NEXT_LONG: Record<LongInterval, LongInterval | null> = { 30: 90, 90: 180, 180: 360, 360: null };

export function nextShortInterval(interval: ShortInterval): ShortInterval | null {
  return NEXT_SHORT[interval];
}

export function fuzzyInterval(interval: ShortInterval): ShortInterval {
  return PREV_SHORT[interval];
}

export function nextLongInterval(interval: LongInterval): LongInterval | null {
  return NEXT_LONG[interval];
}

export function createCard(word: string, learnedOn: StudyDay, relearned = false): CardState {
  return {
    word,
    phase: 'short',
    interval: 1,
    due: addDays(learnedOn, 1),
    longInterval: null,
    longAnchor: null,
    reps: 0,
    lapses: 0,
    lastRating: null,
    lastReviewed: null,
    hard: false,
    relearned,
    inMistakes: false,
    skippedImmediate: false,
    learnedOn,
  };
}

function touch(card: CardState, rating: Rating, day: StudyDay): CardState {
  return { ...card, reps: card.reps + 1, lastRating: rating, lastReviewed: day };
}

/** 短期正式复习：1/2/6/15 天的作答。 */
export function applyShortReview(card: CardState, rating: Rating, day: StudyDay): CardState {
  const base = touch(card, rating, day);

  if (rating === 'known') {
    const next = NEXT_SHORT[card.interval];
    if (next !== null) return { ...base, interval: next, due: addDays(day, next) };
    // 15 天档答对 → 进入长期 30 天节点
    return { ...base, phase: 'long', due: null, longInterval: 30, longAnchor: day };
  }

  if (rating === 'fuzzy') {
    const next = PREV_SHORT[card.interval];
    return { ...base, interval: next, due: addDays(day, next) };
  }

  // 不认识：打回 1 天批次 + 错词本
  return { ...base, interval: 1, due: addDays(day, 1), lapses: card.lapses + 1, inMistakes: true };
}

/** 长期批次（30/90/180/360）的作答。答对进下一节点，360 答对归档；模糊/不认识打回短期 1 天。 */
export function applyLongReview(card: CardState, rating: Rating, day: StudyDay): CardState {
  const base = touch(card, rating, day);
  const current = card.longInterval ?? 30;

  if (rating === 'known') {
    const next = NEXT_LONG[current];
    if (next !== null) return { ...base, longInterval: next, longAnchor: day, due: null };
    return { ...base, phase: 'archived', due: null, longInterval: null, longAnchor: null };
  }

  return {
    ...base,
    phase: 'short',
    interval: 1,
    due: addDays(day, 1),
    longInterval: null,
    longAnchor: null,
    lapses: rating === 'unknown' ? card.lapses + 1 : card.lapses,
    inMistakes: true,
  };
}

/** 长期节点的到期学习日 = 进入该节点的日期 + 节点天数。 */
export function longDueDay(card: CardState): StudyDay | null {
  if (card.phase !== 'long' || !card.longAnchor || card.longInterval === null) return null;
  return addDays(card.longAnchor, card.longInterval);
}

export function isDue(card: CardState, day: StudyDay): boolean {
  return card.phase === 'short' && card.due !== null && card.due <= day;
}
