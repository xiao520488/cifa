import type { Word } from './types';

export interface ParseIssue {
  line: number;
  reason: string;
}

export interface ParseResult {
  words: Word[];
  issues: ParseIssue[];
}

const WORD_RE = /^[A-Za-z][A-Za-z'’. -]*$/;
const PHONETIC_RE = /^\/[^/]{1,64}\/$/;

function splitFields(line: string): string[] {
  if (line.includes('\t')) return line.split('\t').map((part) => part.trim());
  if (line.includes(',')) return line.split(',').map((part) => part.trim());
  return [];
}

const POS_PREFIX = '(?:n|v|adj|adv|prep|conj|pron|num|art|int)\\.\\s';
const SENSE_SPLIT = new RegExp(`\\s+(?=${POS_PREFIX})|(?<=；)\\s*(?=${POS_PREFIX})`, 'i');

function splitSenses(meaning: string): string[] {
  // 先用 ASCII 分号和竖线分出义项，再在「新词性前缀」处二次切分；
  // 中文分号「；」是同一个义项内的近义词分隔，只有后面紧跟新词性时才切。
  const rough = meaning
    .split(/[;|]/)
    .map((part) => part.trim())
    .filter(Boolean);

  const senses: string[] = [];
  for (const part of rough) {
    const pieces = part
      .split(SENSE_SPLIT)
      .map((piece) => piece.replace(/[;；\s]+$/, '').trim())
      .filter(Boolean);
    senses.push(...pieces);
  }
  return senses;
}

const CJK_RE = /[\u3400-\u9fff]/;

/**
 * 解析用户粘贴 / 导入的词表。
 * 支持三种写法：
 *   1. abandon,/əˈbændən/,v. 放弃；抛弃
 *   2. abandon  /əˈbændən/  v. 放弃；抛弃
 *   3. abandon,v. 放弃；抛弃;n. 放任
 * 表头（word, 单词）会被自动跳过，空行与 # 开头的行忽略。
 */
export function parseWordList(text: string): ParseResult {
  const words: Word[] = [];
  const issues: ParseIssue[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) return;

    // 表头：只在第一行识别，避免误伤以 "word" 开头的释义
    if (index === 0 && /^(word|单词|英文)$/i.test((line.split(/[,\t]/)[0] ?? '').trim())) return;

    let word = '';
    let phonetic = '';
    let meaningText = '';

    const fields = splitFields(line);
    if (fields.length >= 2) {
      const [first, ...rest] = fields;
      if (!WORD_RE.test(first)) {
        issues.push({ line: index + 1, reason: `「${first.slice(0, 16)}」不是合法的英文单词` });
        return;
      }
      word = first;
      if (rest.length > 0 && PHONETIC_RE.test(rest[0])) {
        phonetic = rest[0];
        rest.shift();
      }
      meaningText = rest.join('；').trim();
    } else {
      const match = line.match(/^([A-Za-z][A-Za-z'’. -]*?)\s+(\/[^/]{1,64}\/)?\s*(.+)$/);
      if (!match) {
        issues.push({ line: index + 1, reason: '无法识别的格式，至少需要「单词 + 释义」' });
        return;
      }
      word = match[1].trim();
      phonetic = (match[2] ?? '').trim();
      meaningText = match[3].trim();
    }

    if (!WORD_RE.test(word)) {
      issues.push({ line: index + 1, reason: `「${word.slice(0, 16)}」不是合法的英文单词` });
      return;
    }
    const senses = splitSenses(meaningText);
    if (senses.length === 0) {
      issues.push({ line: index + 1, reason: '缺少中文释义' });
      return;
    }
    if (!CJK_RE.test(meaningText)) {
      issues.push({ line: index + 1, reason: '释义里没有中文，可能不是有效的词条' });
      return;
    }

    const key = word.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    words.push({ w: word, ph: phonetic, m: senses });
  });

  return { words, issues };
}

/** 把词表导出为 CSV，方便用户备份 / 迁移。 */
export function toCsv(words: Word[]): string {
  const escape = (value: string) => (/[,"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
  const rows = words.map((word) => [escape(word.w), escape(word.ph), escape(word.m.join('；'))].join(','));
  return ['word,phonetic,meaning', ...rows].join('\n');
}
