import bookMeta from '../data/books.json' with { type: 'json' };
import { cachedBook } from './books.ts';
import { EXAM_BITS } from './types.ts';
import type { ExamKey, LevelKey, LevelMeta, MeaningMode, Word, Wordbook } from './types.ts';

/** 词库清单（构建时生成）：换阶段时词库是异步加载的，阶段列表先靠它显示词数。 */
const BOOK_COUNTS = bookMeta.counts as Partial<Record<LevelKey, number>>;

export const LEVELS: LevelMeta[] = [
  { key: 'senior', short: '高中', name: '高中核心词', desc: '高考高频词 · 默认只给核心释义' },
  { key: 'cet4', short: '四级', name: '四级核心词', desc: '四级高频词 · 默认展开常见多义' },
  { key: 'cet6', short: '六级', name: '六级核心词', desc: '六级高频词 · 默认展开常见多义' },
  { key: 'kaoyan', short: '考研', name: '考研核心词', desc: '考研高频词 · 默认展开熟词僻义' },
  { key: 'custom', short: '自定义', name: '我的词库', desc: '从 CSV / 文本导入的词表' },
];

export function levelMeta(stage: LevelKey): LevelMeta {
  return LEVELS.find((level) => level.key === stage) ?? LEVELS[0];
}

export function getBook(stage: LevelKey, custom: Wordbook | null): Wordbook | null {
  if (stage === 'custom') return custom;
  return cachedBook(stage);
}

/** 某个阶段的词数：已加载就用真实词数，没加载过回落到构建时生成的清单。 */
export function bookCount(stage: LevelKey, custom: Wordbook | null): number {
  if (stage === 'custom') return custom?.words.length ?? 0;
  return cachedBook(stage)?.words.length ?? BOOK_COUNTS[stage] ?? 0;
}

/** 解码 `Word.x` 位掩码：这个词同时出现在哪些考纲里（顺序按 EXAM_BITS 固定）。 */
export function examTags(word: Word): ExamKey[] {
  if (!word.x) return [];
  return (Object.keys(EXAM_BITS) as ExamKey[]).filter((key) => (word.x! & EXAM_BITS[key]) !== 0);
}

/** 词库数据概览：给「我的 → 词库」显示来源与字段覆盖率。 */
export interface BookStats {
  total: number;
  withPhonetic: number;
  withRank: number;
  /** 音标覆盖率，保留一位小数（99.7% 比四舍五入成 100% 诚实） */
  phoneticPercent: string;
  /** 词频覆盖率 */
  rankPercent: string;
}

export function bookStats(book: Wordbook | null): BookStats {
  const words = book?.words ?? [];
  let withPhonetic = 0;
  let withRank = 0;
  for (const word of words) {
    if (word.ph) withPhonetic += 1;
    if (typeof word.r === 'number' && word.r > 0) withRank += 1;
  }
  const total = words.length;
  const percent = (value: number) => (total === 0 ? '0' : ((value / total) * 100).toFixed(1));
  return {
    total,
    withPhonetic,
    withRank,
    phoneticPercent: percent(withPhonetic),
    rankPercent: percent(withRank),
  };
}

export function chunk<T>(list: T[], size: number): T[][] {
  const safeSize = Math.max(1, size);
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += safeSize) out.push(list.slice(i, i + safeSize));
  return out;
}

/** 释义详略：auto 时高中只看核心义，四六级考研展开多义。 */
export function showAllMeanings(mode: MeaningMode, stage: LevelKey): boolean {
  if (mode === 'main') return false;
  if (mode === 'all') return true;
  return stage !== 'senior';
}

/** 把 "v. 放弃；抛弃" 拆成词性前缀与正文。 */
export function splitMeaning(meaning: string): { pos: string; body: string } {
  const match = meaning.match(/^((?:n|v|adj|adv|prep|conj|pron|num|art|int)\.)\s*(.*)$/i);
  if (!match) return { pos: '', body: meaning };
  return { pos: match[1], body: match[2] };
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

const CN_NUMBERS: Record<number, string> = {
  5: '五',
  8: '八',
  10: '十',
  15: '十五',
  20: '二十',
};

export function chineseCount(value: number): string {
  return CN_NUMBERS[value] ?? String(value);
}
