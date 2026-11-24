export type LevelKey = 'senior' | 'cet4' | 'cet6' | 'kaoyan' | 'custom';

/**
 * 考试标签位掩码。内置词库由 ECDICT 的 `tag` 列生成（见 scripts/build-books.ts），
 * 一个字可能同时属于多个考纲，所以用位掩码而不是字符串数组（体积小一个数量级）。
 */
export const EXAM_BITS = {
  zk: 1,
  gk: 2,
  cet4: 4,
  cet6: 8,
  ky: 16,
  toefl: 32,
  ielts: 64,
  gre: 128,
} as const;

export type ExamKey = keyof typeof EXAM_BITS;

export const EXAM_LABEL: Record<ExamKey, string> = {
  zk: '中考',
  gk: '高考',
  cet4: '四级',
  cet6: '六级',
  ky: '考研',
  toefl: '托福',
  ielts: '雅思',
  gre: 'GRE',
};

export interface Word {
  /** 单词，小写 */
  w: string;
  /** 音标，形如 /əˈbændən/ */
  ph: string;
  /** 释义数组，m[0] 为主要释义（带词性前缀），其余为更多释义 */
  m: string[];
  /** 词频名次（越小越常见，ECDICT 的 bnc / frq 取较小值）；自定义词库没有这个字段 */
  r?: number;
  /** 考试标签位掩码，用 `examTags()` 解码；自定义词库没有这个字段 */
  x?: number;
}

export interface Wordbook {
  lvl: LevelKey;
  label: string;
  /** 数据来源（内置词库才有，例如 ECDICT 1.0.28） */
  source?: string;
  words: Word[];
}

export type MeaningMode = 'auto' | 'main' | 'all';
export type ThemeMode = 'system' | 'light' | 'dark';

/** 外观皮肤：一套完整的排印系统，与浅色/深色相互独立 */
export type Skin = 'paper' | 'foundry' | 'instrument' | 'broadsheet';

export interface Profile {
  name: string;
  stage: LevelKey;
  batchSize: number;
  meaningMode: MeaningMode;
  theme: ThemeMode;
  skin: Skin;
}

export interface StageProgress {
  batchIndex: number;
  /** 已看过的单词下标（相对该词库） */
  seen: number[];
  /** 最近学习日期 YYYY-MM-DD */
  day: string;
}

export interface Store {
  v: 1;
  profile: Profile;
  progress: Record<string, StageProgress>;
  session: { hideMeaning: boolean; hideWord: boolean };
  custom: Wordbook | null;
}

export interface LevelMeta {
  key: LevelKey;
  short: string;
  name: string;
  desc: string;
}
