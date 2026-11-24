/**
 * ECDICT 数据清洗的纯函数（无文件系统依赖）。
 *
 * 被 `scripts/build-books.ts`（生成词库）和 `scripts/test-ecdict.ts`（单元测试）共用。
 * 这里的每个函数都只做「一行 CSV → 一个词条字段」的转换，便于单独验证。
 */

/** 考试标签位掩码：与 src/lib/types.ts 的 EXAM_BITS 保持一致。 */
export const EXAM_BITS: Record<string, number> = {
  zk: 1,
  gk: 2,
  cet4: 4,
  cet6: 8,
  ky: 16,
  toefl: 32,
  ielts: 64,
  gre: 128,
};

export const CJK_RE = /[\u3400-\u9fff]/;

/** 单词只保留「单个英文词」：小写、允许撇号与连字符，长度 2–24。 */
export const WORD_RE = /^[a-z][a-z'’-]{1,23}$/;

/* ---------------------------------------------------------------- CSV */

/**
 * 单行 CSV 解析（RFC4180 子集）：ECDICT 的字段里有引号包裹的逗号与 `""` 转义。
 * 实测没有跨行字段；万一引号没闭合，这一行会被当成坏行丢弃，不影响后续行。
 */
export function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/* ---------------------------------------------------------------- 音标 */

/**
 * ECDICT 用的是 stardict 那套「伪 IPA」：西里尔 `ә` 当 schwa、`:` 当长音符、
 * `'` 主重音、`.` 次重音（abuse 这类还会用 `.` 拼两个读音）。
 * 这里统一成 `/…/` 的 IPA 写法，与原有精编词库的字段格式一致。
 */
const PH_CHAR_MAP: Record<string, string> = {
  'ә': 'ə', // 西里尔 schwa
  'є': 'e', // 西里尔 e：'єәriәl = /ˈeəriəl/
  'ε': 'e', // 希腊 epsilon
  ':': 'ː', // 长音符
  "'": 'ˈ', // ASCII 撇号 = 主重音
  'ˊ': 'ˈ',
  'ˋ': 'ˌ',
  'ɡ': 'g',
  '^': 'g', // 源数据里坏掉的 /g/：'^rændtʃaild = /ˈgræntʃaɪld/
};

/** 清洗后只允许这些字符；任何一个不认识就直接放弃这条音标（宁缺勿脏）。 */
const PH_VALID_RE = /^[a-zæɑɒɔəɜɛɪʊʌʃʒθðŋɵɚɝːˈˌ'’\-]+$/i;

export function cleanPhonetic(raw: string): string {
  let text = (raw ?? '').trim();
  if (!text) return '';
  text = text.replace(/^[/[]+/, '').replace(/[/\]]+$/, '').trim();
  text = text.replace(/[（(]\s*(英|美|法|德|意|俄)\s*[)）]/g, '').trim();
  // 可省略的音（centimetre = 'senti,mi:tә(r)）只留字母
  text = text.replace(/[（(]([a-zəә]{1,3})[)）]/gi, '$1');
  if (!text || CJK_RE.test(text)) return '';

  // 还剩空白说明是「音标 + 说明」的脏数据，取第一段
  if (/\s/.test(text)) text = text.split(/\s+/).filter(Boolean)[0] ?? '';

  // 一个词条塞了两个读音（abuse = ә'bju:s.ә'bju:z）时只留第一个；
  // 只有一个重音时，`.` 只是次重音（.ækә'demik → ˌækəˈdemik）
  // 一个词条塞了两个读音（abuse = ә'bju:s.ә'bju:z、does = dʌz; dәz）时只留第一个
  text = text.split(';')[0].trim();
  const leadingDot = text.startsWith('.');
  const parts = text.split('.').map((part) => part.trim()).filter(Boolean);
  if (parts.length > 1) {
    const stressed = parts.filter((part) => /['ˈˊ]/.test(part)).length;
    text = stressed >= 2 ? parts[0] : parts.join('ˌ');
  } else {
    text = parts[0] ?? '';
    if (leadingDot) text = `ˌ${text}`;
  }

  // `,` 在音标里也是次重音（centimetre = 'senti,mi:tә）
  text = text.replace(/,/g, 'ˌ');
  for (const [from, to] of Object.entries(PH_CHAR_MAP)) text = text.split(from).join(to);
  // `ɒː` 实际是 /ɔː/（aboard = ә'bɒ:d → /əˈbɔːd/），`əː` 是 /ɜː/
  text = text.replace(/ɒː/g, 'ɔː').replace(/əː/g, 'ɜː');
  text = text.replace(/ˌ{2,}/g, 'ˌ').replace(/ˈ{2,}/g, 'ˈ');
  text = text.replace(/([ˈˌ])[ˌˈ]/g, '$1');
  if (!text || !PH_VALID_RE.test(text)) return '';
  return `/${text}/`;
}

/* ---------------------------------------------------------------- 释义 */

const POS_MAP: Record<string, string> = {
  n: 'n.',
  vt: 'v.',
  vi: 'v.',
  v: 'v.',
  a: 'adj.',
  adj: 'adj.',
  ad: 'adv.',
  adv: 'adv.',
  prep: 'prep.',
  conj: 'conj.',
  pron: 'pron.',
  num: 'num.',
  art: 'art.',
  int: 'int.',
  aux: 'v.',
};

/**
 * 每条释义最多多少字：
 * 360px 宽下一条释义约 18 个中文字一行，这里把「词性 + 近义词块」一起控在一行内，
 * 保证 5 词同屏不被撑破。
 */
export const SENSE_LIMIT_FIRST = 15;
export const SENSE_LIMIT_EXTRA = 12;
export const MAX_SENSES = 2;
/** 一条释义最多几个近义块（「理解；了解；领会」比「理解；了解；领会；听说；懂」好读）。 */
export const MAX_FRAGMENTS = 3;

/** 按中文标点切成小块，再贪心拼到字数上限（第一个小块无论多长都保留）。 */
export function compactBody(body: string, limit: number): string {
  const fragments = body
    .split(/[；;，,、]/)
    .map((part) => part.trim())
    .filter((part) => part && CJK_RE.test(part));
  if (fragments.length === 0) return '';
  const kept: string[] = [];
  let length = 0;
  for (const fragment of fragments) {
    if (kept.length > 0 && (length + fragment.length > limit || kept.length >= MAX_FRAGMENTS)) break;
    kept.push(fragment);
    length += fragment.length;
    if (length >= limit) break;
  }
  return kept.join('；');
}

interface RawLine {
  /** 词性前缀（已归一化成 n. / v. / adj. …），没有就是空串 */
  pos: string;
  body: string;
  /** 带 [医] [经] 这类领域标记，或压根没有词性前缀 */
  fallback: boolean;
}

function readLine(line: string): RawLine | null {
  const text = line.trim();
  if (!text) return null;
  // [网络] 是众包释义，噪声很大，直接丢
  if (/^\[?(网络|网络释义|网络解释)\]?/.test(text)) return null;

  const hasDomainTag = /^\[[^\]]{1,6}\]/.test(text);
  const withoutTag = text.replace(/^\[[^\]]{1,6}\]\s*/, '').trim();
  if (!withoutTag || !CJK_RE.test(withoutTag)) return null;

  const match = withoutTag.match(/^([A-Za-z]{1,6})\.\s*(.+)$/);
  let pos = '';
  let body = withoutTag;
  if (match) {
    const mapped = POS_MAP[match[1].toLowerCase()];
    if (mapped) {
      pos = mapped;
      body = match[2];
    }
  }
  body = body.replace(/\.{3,}/g, '…').replace(/\s+/g, ' ').trim();
  if (!body || !CJK_RE.test(body)) return null;
  return { pos, body, fallback: hasDomainTag || pos === '' };
}

/**
 * 把 ECDICT 的 `translation` 转成界面用的释义数组。
 *
 * 规则：
 * - 优先用「有词性、没有领域标记」的常规释义；只有一条都没有时才退到 [医]/[计] 这类领域释义
 *   （否则 `it` 的第二条会变成「信息论；输入终端；智能终端」）。
 * - 同词性的多行合并，最多 MAX_SENSES 条。
 * - 每条按标点收敛到字数上限，保证列表不被撑长。
 */
export function parseTranslation(raw: string): string[] {
  const lines = (raw ?? '')
    .split('\\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const primary: RawLine[] = [];
  const fallback: RawLine[] = [];
  for (const line of lines) {
    const parsed = readLine(line);
    if (!parsed) continue;
    if (parsed.fallback) fallback.push(parsed);
    else primary.push(parsed);
  }
  const source = primary.length > 0 ? primary : fallback;

  // 同词性合并（保持出现顺序）
  const merged = new Map<string, string[]>();
  for (const item of source) {
    const list = merged.get(item.pos) ?? [];
    list.push(item.body);
    merged.set(item.pos, list);
  }

  const senses: string[] = [];
  for (const [pos, bodies] of merged) {
    const limit = senses.length === 0 ? SENSE_LIMIT_FIRST : SENSE_LIMIT_EXTRA;
    const body = compactBody(bodies.join('；'), limit);
    if (!body) continue;
    senses.push(pos ? `${pos} ${body}` : body);
    if (senses.length >= MAX_SENSES) break;
  }
  return senses;
}

/* ---------------------------------------------------------------- 词频 */

/** ECDICT 的 bnc / frq 都是「名次，越小越常见」，0 表示没有。取两者更小的那个。 */
export function rankOf(bnc: string, frq: string): number {
  const values = [Number(bnc), Number(frq)].filter((value) => Number.isFinite(value) && value > 0);
  return values.length > 0 ? Math.min(...values) : 0;
}

export function examMask(tags: string[]): number {
  let mask = 0;
  for (const tag of tags) mask |= EXAM_BITS[tag] ?? 0;
  return mask;
}

/* ---------------------------------------------------------------- 排序 */

/**
 * 纯语法功能词（冠词 / 介词 / 代词 / be / 助动词 / 高频连词）。
 *
 * 它们确实在考纲词表里，但**谁都会**：按词频排序的话，每个词库的头两三批全是
 * the / be / and / of / in，第一印象就是「这词库有问题」。这里不删除（词表要完整），
 * 只在排序时整体挪到队尾——学的时候永远最后才轮到它们。
 *
 * 判断刻意保守：只收完全没有实义的词。像 might（n. 力量）、will（n. 意志）、
 * can（n. 罐头）这种一词多义的，照常按词频排。
 */
export const FUNCTION_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'if', 'of', 'in', 'on', 'at', 'to', 'for', 'from', 'by',
  'with', 'as', 'than', 'then', 'so', 'not', 'no', 'yes',
  'be', 'am', 'is', 'are', 'was', 'were', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had',
  'i', 'me', 'my', 'we', 'us', 'our', 'you', 'your', 'he', 'him', 'his', 'she', 'her',
  'it', 'its', 'they', 'them', 'their',
  'this', 'that', 'these', 'those', 'there', 'here',
  // 疑问词 / 关系词 / 情态动词：同样是「谁都会」的词
  'which', 'what', 'who', 'whom', 'whose', 'when', 'where', 'why', 'how',
  'would', 'should', 'could', 'shall', 'must', 'may',
]);

export function isFunctionWord(word: string): boolean {
  return FUNCTION_WORDS.has(word);
}
