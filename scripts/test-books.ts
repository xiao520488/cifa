/**
 * 词库数据校验：`node scripts/test-books.ts`
 *
 * 三层：
 * 1. 清洗函数（scripts/lib/ecdict.ts）的单元用例 —— 音标/释义怎么变，写死期望值；
 * 2. 生成的 `src/data/*.json` 的结构不变量 —— 词形、去重、音标格式、词频单调、字段范围；
 * 3. 「种子池 = 当前词库」—— 调度引擎 seed 之后，未学池恰好是词库减去已学的卡。
 */

import { readFileSync } from 'node:fs';
import { cleanPhonetic, isFunctionWord, parseTranslation, parseCsvLine } from './lib/ecdict.ts';
import { emptyState, Scheduler } from '../src/lib/scheduler/index.ts';
import type { Wordbook } from '../src/lib/types.ts';
import { splitMeaning } from '../src/lib/words.ts';

let failures = 0;
function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures += 1;
    console.log(`✗ ${name}`, detail ?? '');
  }
}

/* ---------------------------------------------------------------- 1. 清洗函数 */

const phoneticCases: Array<[string, string, string]> = [
  ["ә'bændәn", '/əˈbændən/', '西里尔 schwa + ASCII 重音'],
  ["'æbsәns", '/ˈæbsəns/', '词首重音保留'],
  [".ækә'demik", '/ˌækəˈdemik/', '词首 . 是次重音'],
  ["ә'bju:s.ә'bju:z", '/əˈbjuːs/', '两个读音只留第一个'],
  ["ә'bɒ:d", '/əˈbɔːd/', 'ɒː 归一成 ɔː'],
  ["bә:d", '/bɜːd/', 'əː 归一成 ɜː'],
  ["'єәriәl", '/ˈeəriəl/', '西里尔 є 是 e'],
  ["'sku:lbæ^", '/ˈskuːlbæg/', '源数据坏掉的 ^ 是 g'],
  ["'senti,mi:tә(r)", '/ˈsentiˌmiːtər/', '逗号 = 次重音、可省略音只留字母'],
  ['', '', '空音标保持为空'],
  ['不认识的字符', '', '带中文直接放弃'],
];
for (const [input, expected, label] of phoneticCases) {
  const actual = cleanPhonetic(input);
  check(`音标 · ${label}`, actual === expected, { input, actual, expected });
}

const meaningCases: Array<[string, string[], string]> = [
  ['v. 是, 表示, 在\\n[计] 后端, 总线允许', ['v. 是；表示；在'], '领域释义不进第二条'],
  ['pron. 它\\n[计] 信息论, 输入终端, 智能终端, 内捕获', ['pron. 它'], '只有领域释义时不外溢'],
  ['n. 消息, 知识, 通知, 情报, 信息, 问讯处, 起诉', ['n. 消息；知识；通知'], '近义块最多 3 个'],
  ['vt. 理解, 了解, 领会, 听说, 懂\\nvi. 懂得, 认为', ['v. 理解；了解；领会'], 'vt/vi 合并成 v.'],
  ['n. 能力, 才干\\n[经] 能力, 才能', ['n. 能力；才干'], '同词性合并、不重复'],
  ['[网络] 胡德；兜帽；引擎盖', [], '网络释义整条丢弃'],
  ['a. 反常的, 不规则的\\nn. 畸形的人', ['adj. 反常的；不规则的', 'n. 畸形的人'], '两条不同词性'],
];
for (const [input, expected, label] of meaningCases) {
  const actual = parseTranslation(input);
  check(`释义 · ${label}`, JSON.stringify(actual) === JSON.stringify(expected), { input, actual });
}

const csvLine = parseCsvLine('abandon,ә\'bændәn,"n. 放弃, 抛弃","引号 ""里"" 的逗号",3');
check('CSV · 引号里的逗号不切列', csvLine.length === 5 && csvLine[2] === 'n. 放弃, 抛弃', csvLine);
check('CSV · 双引号转义还原', csvLine[3] === '引号 "里" 的逗号', csvLine[3]);

/* ---------------------------------------------------------------- 2. 数据不变量 */

interface RawBook {
  lvl: string;
  label: string;
  source?: string;
  words: Array<{ w: string; ph: string; m: string[]; r?: number; x?: number }>;
}

const BOOKS = ['senior', 'cet4', 'cet6', 'kaoyan'] as const;
const WORD_RE = /^[a-z][a-z'’-]{1,23}$/;
const PH_RE = /^\/[^\s/]{1,63}\/$/;
const CJK_RE = /[\u3400-\u9fff]/;
const POS_RE = /^(n|v|adj|adv|prep|conj|pron|num|art|int)\. /;

const meta = JSON.parse(readFileSync('src/data/books.json', 'utf8')) as {
  counts: Record<string, number>;
};

for (const key of BOOKS) {
  const book = JSON.parse(readFileSync(`src/data/${key}.json`, 'utf8')) as RawBook;
  const label = `[${key}]`;

  check(`${label} lvl/label/词库来源齐全`, book.lvl === key && Boolean(book.label) && Boolean(book.source));
  check(`${label} 词数与 books.json 一致`, book.words.length === meta.counts[key], {
    actual: book.words.length,
    expected: meta.counts[key],
  });

  const seen = new Set<string>();
  let duplicate = 0;
  let badWord = 0;
  let badPhonetic = 0;
  let badMeaning = 0;
  let withPhonetic = 0;
  let withRank = 0;
  let unsorted = 0;
  let functionFirst = 0;
  let seenFunction = false;

  for (let i = 0; i < book.words.length; i += 1) {
    const word = book.words[i];
    if (!WORD_RE.test(word.w)) badWord += 1;
    if (seen.has(word.w)) duplicate += 1;
    seen.add(word.w);

    if (word.ph) {
      withPhonetic += 1;
      if (!PH_RE.test(word.ph)) badPhonetic += 1;
    }

    const sensesOk =
      Array.isArray(word.m) &&
      word.m.length >= 1 &&
      word.m.length <= 2 &&
      word.m.every((sense) => sense.length > 0 && CJK_RE.test(sense) && (!POS_RE.test(sense) || splitMeaning(sense).body.length > 0));
    if (!sensesOk) badMeaning += 1;

    // 功能词必须整体排在实词之后（出现过功能词之后又冒出实词就是没押后）
    const fn = isFunctionWord(word.w);
    if (fn) seenFunction = true;
    else if (seenFunction) functionFirst += 1;

    if (typeof word.r === 'number') {
      withRank += 1;
      if (!Number.isInteger(word.r) || word.r <= 0) badMeaning += 1;
      const prev = book.words[i - 1];
      // 只在同一组内比较（功能词组 vs 实词组各自升序）
      if (prev && typeof prev.r === 'number' && isFunctionWord(prev.w) === fn && prev.r > word.r) unsorted += 1;
    }
  }

  check(`${label} 单词小写且词形合法`, badWord === 0, badWord);
  check(`${label} 库内无重复`, duplicate === 0, duplicate);
  check(`${label} 音标格式统一为 /…/`, badPhonetic === 0, badPhonetic);
  check(`${label} 释义 1–2 条且条条含中文`, badMeaning === 0, badMeaning);
  check(`${label} 功能词押后、实词按词频升序`, unsorted === 0 && functionFirst === 0, {
    unsorted,
    functionFirst,
  });
  check(`${label} 首屏不是功能词`, !book.words.slice(0, 5).some((word) => isFunctionWord(word.w)), book.words.slice(0, 5).map((w) => w.w));
  check(`${label} 音标覆盖率 ≥ 98%`, withPhonetic / book.words.length >= 0.98, {
    withPhonetic,
    total: book.words.length,
  });
  check(`${label} 词频覆盖率 ≥ 99%`, withRank / book.words.length >= 0.99, {
    withRank,
    total: book.words.length,
  });
  check(`${label} 每 5 词都有至少 1 个义项`, book.words.every((word) => word.m.length >= 1));
}

/* ---------------------------------------------------------------- 3. 种子池 = 当前词库 */

const book = JSON.parse(readFileSync('src/data/cet4.json', 'utf8')) as Wordbook;

const fresh = new Scheduler(emptyState());
fresh.seed(book.words.map((word) => word.w));
check('seed 后未学池 = 词库词数', fresh.state.unlearned.length === book.words.length, {
  pool: fresh.state.unlearned.length,
  words: book.words.length,
});

// 学掉词库里的第一个词，再 seed 一次：它必须从池子里消失
fresh.learnNewWord(book.words[0].w);
check('学过的词从池子里剔除', !fresh.state.unlearned.includes(book.words[0].w));
fresh.seed(book.words.map((word) => word.w));
check('重新 seed 后池子 = 词库 − 已学', fresh.state.unlearned.length === book.words.length - 1, {
  pool: fresh.state.unlearned.length,
  words: book.words.length,
});

// 换一本词库：池子完全由新书决定；已学的卡如果也在新书里，同样不进池子
const other = JSON.parse(readFileSync('src/data/senior.json', 'utf8')) as Wordbook;
const learnedInOther = other.words.some((word) => word.w === book.words[0].w) ? 1 : 0;
fresh.seed(other.words.map((word) => word.w));
check(
  '换词库后池子跟着新词库走',
  fresh.state.unlearned.length === other.words.length - learnedInOther,
  { pool: fresh.state.unlearned.length, words: other.words.length, learnedInOther },
);

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
