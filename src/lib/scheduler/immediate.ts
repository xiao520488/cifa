/**
 * 即时复习队列状态机（需求 §四）。
 *
 * - 累计满 10 个新词触发一组；组大小按累计结果走，不拆碎用户批次。
 * - 组内两键：认识出队；不认识放回队尾，同一词最多循环 3 次，
 *   第 3 次仍不认识 → 标记 hardWord 放过（次日 1 天正式批次自然收到）。
 * - 纯函数：只操作传入的 group，统计写回由 engine 负责。
 */

import type { StudyDay } from './studyDay.ts';
import type { ImmediateGroup } from './types.ts';

export const IMMEDIATE_TRIGGER = 10;
export const IMMEDIATE_MAX_LOOPS = 3;

export function makeGroup(words: string[], day: StudyDay): ImmediateGroup {
  return { words: [...words], queue: [...words], loopCount: {}, startedOn: day };
}

export interface ImmediateAnswerResult {
  group: ImmediateGroup;
  remaining: number;
  /** 这个词到目前为止被答错的次数（第 1 次答错 = 1） */
  loops: number;
  /** 3 次仍不认识，已放过 */
  hard: boolean;
  /** 本组做完 */
  finished: boolean;
}

export function answerImmediate(group: ImmediateGroup, word: string, known: boolean): ImmediateAnswerResult {
  const queue = [...group.queue];
  const loopCount = { ...group.loopCount };
  const index = queue.indexOf(word);

  if (known) {
    if (index >= 0) queue.splice(index, 1);
    return {
      group: { ...group, queue, loopCount },
      remaining: queue.length,
      loops: loopCount[word] ?? 0,
      hard: false,
      finished: queue.length === 0,
    };
  }

  const loops = (loopCount[word] ?? 0) + 1;
  loopCount[word] = loops;
  if (index >= 0) queue.splice(index, 1);

  if (loops >= IMMEDIATE_MAX_LOOPS) {
    return {
      group: { ...group, queue, loopCount },
      remaining: queue.length,
      loops,
      hard: true,
      finished: queue.length === 0,
    };
  }

  queue.push(word);
  return { group: { ...group, queue, loopCount }, remaining: queue.length, loops, hard: false, finished: false };
}

/** 一组结束时的总循环次数（用于 immediateReviewStats.avgLoops）。 */
export function groupLoops(group: ImmediateGroup): number {
  return group.words.reduce((sum, word) => sum + (group.loopCount[word] ?? 0), 0);
}

export function averageLoops(loops: number, cards: number): number | null {
  return cards > 0 ? loops / cards : null;
}
