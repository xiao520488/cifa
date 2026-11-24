import { parseWordList, toCsv } from '../src/lib/csv.ts';

let failures = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures += 1;
    console.log(`✗ ${name}`, detail ?? '');
  }
}

const sample = parseWordList(
  [
    'abandon, /əˈbændən/, v. 放弃；抛弃;n. 放任；纵情',
    'benefit /ˈbenɪfɪt/ n. 好处；v. 有益于',
    'this line is broken',
    'resilience,/rɪˈzɪliəns/,n. 韧性；恢复力',
  ].join('\n'),
);

check('只收下 3 个有效词条', sample.words.length === 3, sample.words.map((w) => w.w));
check('乱码行被记为问题', sample.issues.length === 1 && sample.issues[0].line === 3, sample.issues);

const abandon = sample.words.find((w) => w.w === 'abandon');
check('abandon 有两个义项', abandon?.m.length === 2, abandon?.m);
check('abandon 第二个义项是 n.', abandon?.m[1].startsWith('n.'), abandon?.m);
check('abandon 音标保留', abandon?.ph === '/əˈbændən/', abandon?.ph);

const benefit = sample.words.find((w) => w.w === 'benefit');
check('benefit 在中文分号处按词性切开', benefit?.m.length === 2, benefit?.m);
check('benefit 第二个义项是 v.', benefit?.m[1] === 'v. 有益于', benefit?.m);

const resilience = sample.words.find((w) => w.w === 'resilience');
check('resilience 单个义项不被切碎', resilience?.m.length === 1, resilience?.m);

const withHeader = parseWordList('word,phonetic,meaning\nabandon,/əˈbændən/,v. 放弃\nabandon,/əˈbændən/,v. 重复');
check('表头被跳过', withHeader.words.length === 1, withHeader.words.map((w) => w.w));
check('重复词被去重', withHeader.issues.length === 0 && withHeader.words[0].w === 'abandon');

const noChinese = parseWordList('hello, /həˈləʊ/, hello');
check('英文释义被拒绝', noChinese.words.length === 0 && noChinese.issues.length === 1, noChinese);

const csv = toCsv(sample.words);
check('CSV 导出带表头', csv.startsWith('word,phonetic,meaning'), csv.split('\n')[0]);
check('CSV 可被重新解析', parseWordList(csv).words.length === 3);

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
