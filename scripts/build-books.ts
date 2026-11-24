/**
 * 从 ECDICT 的 `ecdict.csv` 生成 `src/data/*.json`（内置四本词库）。
 *
 * 用法：
 *   1. 下载源数据（约 63MB，不进仓库）：
 *      curl -L -o .tmp-vocab/ecdict.csv https://ghfast.top/https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv
 *   2. node scripts/build-books.ts
 *
 * 产物字段（见 src/lib/types.ts 的 Word）：
 *   w    单词（小写）
 *   ph   音标，统一成 /…/ 形式
 *   m    释义，最多 2 条（按词性合并、按字数收敛，保证 5 词同屏不被撑破）
 *   r    词频名次（ECDICT 的 bnc / frq 取较小值，越小越常见）
 *   x    考试标签位掩码（见 src/lib/types.ts 的 EXAM_BITS）
 *
 * 词序：按词频名次升序（没名次的排最后，再按字母序）。这样引擎的「词表顺序」
 * 天然就是「高频优先」，不必开 `newWordOrder: 'freq'`，也省掉状态里的 freqRank 体积。
 */

import { createReadStream, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { resolve } from 'node:path';
import { cleanPhonetic, examMask, isFunctionWord, parseCsvLine, parseTranslation, rankOf, WORD_RE } from './lib/ecdict.ts';

const SRC = resolve(process.cwd(), '.tmp-vocab/ecdict.csv');
const OUT_DIR = resolve(process.cwd(), 'src/data');
const DOWNLOAD_HINT =
  'curl -L -o .tmp-vocab/ecdict.csv https://ghfast.top/https://raw.githubusercontent.com/skywind3000/ECDICT/master/ecdict.csv';

interface BookSpec {
  lvl: 'senior' | 'cet4' | 'cet6' | 'kaoyan';
  label: string;
  file: string;
  /** 这本书收录哪个考试标签的词 */
  tag: string;
}

const BOOKS: BookSpec[] = [
  { lvl: 'senior', label: '高中核心词', file: 'senior.json', tag: 'gk' },
  { lvl: 'cet4', label: '四级核心词', file: 'cet4.json', tag: 'cet4' },
  { lvl: 'cet6', label: '六级核心词', file: 'cet6.json', tag: 'cet6' },
  { lvl: 'kaoyan', label: '考研核心词', file: 'kaoyan.json', tag: 'ky' },
];

interface Row {
  w: string;
  ph: string;
  m: string[];
  r: number;
  x: number;
}

async function main(): Promise<void> {
  if (!existsSync(SRC)) {
    console.error(`找不到源数据：${SRC}\n先下载（约 63MB，不进仓库）：\n  ${DOWNLOAD_HINT}`);
    process.exit(1);
  }

  const buckets = new Map<string, Map<string, Row>>(BOOKS.map((book) => [book.tag, new Map()]));
  const rl = createInterface({ input: createReadStream(SRC, 'utf8'), crlfDelay: Infinity });

  let rows = 0;
  let badShape = 0;
  let badMeaning = 0;

  for await (const line of rl) {
    rows += 1;
    if (!line || line.startsWith('word,phonetic,')) continue;
    const fields = parseCsvLine(line);
    if (fields.length < 9) continue;
    const [rawWord, phonetic, , translation, , , , tag, bnc, frq] = fields;
    if (!tag) continue;

    const tags = tag.trim().split(/\s+/).filter(Boolean);
    const wanted = tags.filter((t) => buckets.has(t));
    if (wanted.length === 0) continue;

    const word = rawWord.trim().toLowerCase();
    if (!WORD_RE.test(word)) {
      badShape += 1;
      continue;
    }

    const meanings = parseTranslation(translation);
    if (meanings.length === 0) {
      badMeaning += 1;
      continue;
    }

    const row: Row = {
      w: word,
      ph: cleanPhonetic(phonetic),
      m: meanings,
      r: rankOf(bnc, frq),
      x: examMask(tags),
    };

    for (const t of wanted) {
      const bucket = buckets.get(t);
      if (!bucket) continue;
      const existing = bucket.get(word);
      // 同一个词可能有多行：留「释义更多 + 有音标」的那条
      const better =
        !existing ||
        (!existing.ph && row.ph) ||
        (Boolean(row.ph) === Boolean(existing.ph) && row.m.length > existing.m.length);
      if (better) bucket.set(word, row);
    }
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const report: string[] = [];
  const counts: Record<string, number> = {};
  let totalBytes = 0;

  for (const spec of BOOKS) {
    const bucket = buckets.get(spec.tag) ?? new Map<string, Row>();
    const words = [...bucket.values()]
      .sort((a, b) => {
        // 功能词整体押后（the / be / and 这类不该占据第一屏），组内再按词频
        const af = isFunctionWord(a.w) ? 1 : 0;
        const bf = isFunctionWord(b.w) ? 1 : 0;
        if (af !== bf) return af - bf;
        const ar = a.r > 0 ? a.r : Number.MAX_SAFE_INTEGER;
        const br = b.r > 0 ? b.r : Number.MAX_SAFE_INTEGER;
        if (ar !== br) return ar - br;
        return a.w < b.w ? -1 : a.w > b.w ? 1 : 0;
      })
      .map((row) => {
        const item: Record<string, string | number | string[]> = { w: row.w, ph: row.ph, m: row.m };
        if (row.r > 0) item.r = row.r;
        if (row.x > 0) item.x = row.x;
        return item;
      });

    const path = resolve(OUT_DIR, spec.file);
    // 一个词一行：数据全由脚本生成，但 diff 时要能看清是哪个词变了
    const body = words.map((word) => `    ${JSON.stringify(word)}`).join(',\n');
    writeFileSync(
      path,
      `{\n  "lvl": ${JSON.stringify(spec.lvl)},\n  "label": ${JSON.stringify(spec.label)},\n` +
        `  "source": "ECDICT 1.0.28",\n  "words": [\n${body}\n  ]\n}\n`,
      'utf8',
    );

    const size = readFileSync(path).byteLength;
    totalBytes += size;
    counts[spec.lvl] = words.length;
    const withPh = words.filter((word) => typeof word.ph === 'string' && word.ph).length;
    const withRank = words.filter((word) => typeof word.r === 'number').length;
    report.push(
      `  ${spec.lvl.padEnd(7)} ${String(words.length).padStart(5)} 词 · 音标 ${withPh} (${((withPh / words.length) * 100).toFixed(1)}%) · 词频 ${withRank} · ${(size / 1024).toFixed(0)}KB`,
    );
  }

  // 词库清单：界面里「学习阶段」要在词库按需加载之前就显示每个阶段的词数
  writeFileSync(
    resolve(OUT_DIR, 'books.json'),
    `${JSON.stringify(
      { source: 'ECDICT 1.0.28', counts },
      null,
      2,
    )}\n`,
    'utf8',
  );

  console.log(`读入 ${rows} 行；词形不合规 ${badShape} 条，无可用中文释义 ${badMeaning} 条`);
  console.log(report.join('\n'));
  console.log(`合计 ${(totalBytes / 1024).toFixed(0)}KB（原始 JSON，未压缩）`);
}

await main();
