/**
 * 即时复习队列状态机（v2 轮次模型，2026-11-26 用户拍板，规约 `docs/IMMEDIATE_ROUNDS_SPEC.md`）。
 *
 * 语义：
 * - 会话 = 一次即时复习（一组 N 个词），会话内 1..5 轮。
 * - 点「认识」→ 出队（唯一出队途径）；点「模糊」→ 本轮内最多再出现一次，
 *   本轮第 2 次仍模糊 → 进 `crossRound`，本轮不再出现。
 * - 一轮清空：没有待跨轮词 = 自然收口；有待跨轮词且未到第 5 轮 = 开下一轮；
 *   第 5 轮还有待跨轮词 = 强制收口，残留词进 `hardWords`。
 * - 同一个词本会话累计模糊 3 次 → 由 engine 记进错词本（本文件只报 `mistakeIncrement`），
 *   **但不因记账出队**：本轮第 1 次模糊时它仍在 `queue`，第 2 次时在 `crossRound`。
 * - 纯函数：只操作传入的 group，不读时钟、不碰账本与统计。
 */

import type { StudyDay } from './studyDay.ts';
import type { ImmediateGroup } from './types.ts';

/** 攒够这么多新词就开一组即时复习。 */
export const IMMEDIATE_TRIGGER = 10;
/** 一个会话最多几轮（防死循环的硬上限，用户拍板）。 */
export const IMMEDIATE_MAX_ROUNDS = 5;
/** 累计模糊多少次进错词本（跨轮累计，不要求连续）。 */
export const IMMEDIATE_MISTAKE_THRESHOLD = 3;

export function makeGroup(words: string[], day: StudyDay): ImmediateGroup {
  const list = [...words];
  return {
    schema: 2,
    words: list,
    round: 1,
    queue: [...list],
    fuzzyThisRound: [],
    crossRound: [],
    fuzzyCount: {},
    hardWords: [],
    startedOn: day,
  };
}

export interface ImmediateAnswerResult {
  group: ImmediateGroup;
  /** 作答后的轮次（可能已推进） */
  round: number;
  /** 本轮还需答几个 */
  remaining: number;
  /** 该词本会话累计模糊次数（兼容旧字段名 loops） */
  loops: number;
  /** 本次「模糊」把词推进了下一轮 */
  crossed: boolean;
  /** 本次跨过第 3 次模糊阈值 */
  thresholdCrossed: boolean;
  /** engine 要往错词本里加多少（0 = 不记账；3 = 首次记满；1 = 之后每次 +1） */
  mistakeIncrement: 0 | 1 | 3;
  /** 本轮已清空 */
  roundFinished: boolean;
  /** 整组收口（可以入库） */
  finished: boolean;
  /** 收口时仍未认识、要标硬词的词 */
  hardWords: string[];
}

function drop(list: string[], word: string): void {
  const index = list.indexOf(word);
  if (index >= 0) list.splice(index, 1);
}

/**
 * 两键作答。词不在本轮队列里（例如已经跨轮、或不是队头）时返回 null——UI 只答队头。
 */
export function answerImmediate(group: ImmediateGroup, word: string, known: boolean): ImmediateAnswerResult | null {
  if (!group.words.includes(word)) return null;
  if (!group.queue.includes(word)) return null;

  const g: ImmediateGroup = {
    ...group,
    words: [...group.words],
    queue: [...group.queue],
    fuzzyThisRound: [...group.fuzzyThisRound],
    crossRound: [...group.crossRound],
    fuzzyCount: { ...group.fuzzyCount },
    hardWords: [...group.hardWords],
  };

  let crossed = false;
  let thresholdCrossed = false;
  let mistakeIncrement: 0 | 1 | 3 = 0;

  if (known) {
    drop(g.queue, word);
    drop(g.fuzzyThisRound, word);
  } else {
    const before = g.fuzzyCount[word] ?? 0;
    const after = before + 1;
    g.fuzzyCount[word] = after;

    if (before < IMMEDIATE_MISTAKE_THRESHOLD && after >= IMMEDIATE_MISTAKE_THRESHOLD) {
      thresholdCrossed = true;
      mistakeIncrement = 3; // 前两次没记，这一次把 3 次一起记满
    } else if (before >= IMMEDIATE_MISTAKE_THRESHOLD) {
      mistakeIncrement = 1; // 第 4、5… 次各 +1
    }

    if (g.fuzzyThisRound.includes(word)) {
      // 本轮第 2 次模糊 → 不再回队尾，等下一轮
      drop(g.queue, word);
      drop(g.fuzzyThisRound, word);
      if (!g.crossRound.includes(word)) g.crossRound.push(word);
      crossed = true;
    } else {
      // 本轮第 1 次模糊 → 回本轮队尾，本轮内还会再出现一次
      g.fuzzyThisRound.push(word);
      drop(g.queue, word);
      g.queue.push(word);
    }
  }

  const roundFinished = g.queue.length === 0;
  let finished = false;
  if (roundFinished) {
    if (g.crossRound.length === 0) {
      finished = true; // 自然收口
    } else if (g.round >= IMMEDIATE_MAX_ROUNDS) {
      for (const stuck of g.crossRound) {
        if (!g.hardWords.includes(stuck)) g.hardWords.push(stuck);
      }
      g.crossRound = [];
      finished = true; // 强制收口
    } else {
      g.round += 1;
      g.queue = [...g.crossRound];
      g.crossRound = [];
      g.fuzzyThisRound = [];
    }
  }

  return {
    group: g,
    round: g.round,
    remaining: g.queue.length,
    loops: g.fuzzyCount[word] ?? 0,
    crossed,
    thresholdCrossed,
    mistakeIncrement,
    roundFinished,
    finished,
    hardWords: [...g.hardWords],
  };
}

/** 一组结束时的总模糊次数（= Σ fuzzyCount，用于 immediateReviewStats.avgLoops）。 */
export function groupFuzzyTotal(group: ImmediateGroup): number {
  return group.words.reduce((sum, word) => sum + (group.fuzzyCount[word] ?? 0), 0);
}

export function averageLoops(loops: number, cards: number): number | null {
  return cards > 0 ? loops / cards : null;
}
