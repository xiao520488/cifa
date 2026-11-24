/**
 * 词库 ↔ 调度引擎之间的薄胶水（纯函数，无 React）。
 *
 * 调度模块只认单词字符串，App 的词库是 `Word[]`。这一层负责：
 * - 把当前词库喂成「未学新词池」；
 * - 判断词库有没有真的换过（换阶段 / 导入新词表才重灌池子）；
 * - 给界面提供按单词查词条的表。
 *
 * 注意：**旧版 `seen`（浏览过的下标）不迁移成调度卡**。`seen` 只是「翻到过」，
 * 不是「学过」；一次性把几百个词变成「今天学过、明天到期」会把复习队列直接撑爆。
 * `cijian.v1` 原样保留，两套进度各管各的。
 */

import type { Word, Wordbook } from './types';

export function deckOf(book: Wordbook | null): Word[] {
  return book ? book.words : [];
}

export function deckWords(book: Wordbook | null): string[] {
  const list = deckOf(book);
  const out: string[] = [];
  for (const word of list) if (word.w) out.push(word.w);
  return out;
}

/**
 * 词库指纹：只取「换没换」需要的几个点，不拼 3500 个词。
 * 换阶段、重新导入、词数变化都会翻指纹；只翻批次不会。
 */
export function deckSignature(book: Wordbook | null): string {
  if (!book) return 'empty';
  const words = book.words;
  const head = words[0]?.w ?? '';
  const tail = words[words.length - 1]?.w ?? '';
  return `${book.lvl}:${words.length}:${head}:${tail}`;
}

export function wordLookup(book: Wordbook | null): Map<string, Word> {
  const map = new Map<string, Word>();
  for (const word of deckOf(book)) if (word.w) map.set(word.w, word);
  return map;
}
