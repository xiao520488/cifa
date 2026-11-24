import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';
import { cleanPhonetic, parseCsvLine, parseTranslation } from './lib/ecdict.ts';

const rl = createInterface({
  input: createReadStream('D:/背单词/.tmp-vocab/ecdict.csv', 'utf8'),
  crlfDelay: Infinity,
});
const rejected: string[] = [];
const meaningSamples: string[] = [];
const watch = new Set(['in', 'be', 'it', 'information', 'understand', 'god', 'university']);

rl.on('line', (line) => {
  if (!line || line.startsWith('word,phonetic,')) return;
  const f = parseCsvLine(line);
  if (f.length < 9) return;
  const [w, ph, , tr, , , , tag] = f;
  if (!/\bgk\b/.test(tag)) return;
  if (ph && !cleanPhonetic(ph) && rejected.length < 20) rejected.push(`${w} | ${JSON.stringify(ph)}`);
  if (watch.has(w) && meaningSamples.length < 20) {
    meaningSamples.push(`${w} | ${JSON.stringify(tr)} => ${JSON.stringify(parseTranslation(tr))}`);
  }
});

rl.on('close', () => {
  console.log('--- rejected phonetics\n' + rejected.join('\n'));
  console.log('--- meanings\n' + meaningSamples.join('\n'));
});
