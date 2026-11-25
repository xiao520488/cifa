/* 数据事故全键 diff（Node 侧，不碰浏览器）。
 * 输入：out/real-scheduler.json（真实档案当前值）、out/iso-base.json（隔离档案答卡前）、
 *       out/iso-after.json（隔离档案答卡后）、out/real-profile.json（cijian.v1）。
 * 规则固化（用户 2026-11-25 拍板，三条）：
 *   1) 答卡类测试首选「隔离」：Playwright 独立 context / storageState 注入，不在真实 profile 上跑；
 *      「快照-还原」只是次选。本文件的对照基线 out/iso-base.json 就是隔离档案里长出来的 pristine 状态。
 *   2) 快照-还原必须「双键」：cijian.v1 + cijian.scheduler.v1；只比前者等于没守住学习数据。
 *   3) 还原前「自愈 scrub」保留：被超时打断后直接还原备份，只会还原到脏状态。 */
import fs from 'node:fs';
import path from 'node:path';
const OUT = 'D:/背单词/out';
const read = (n) => {
  const raw = fs.readFileSync(path.join(OUT, n), 'utf8').replace(/^/, '').trim();
  let v = JSON.parse(raw);
  if (typeof v === 'string') v = JSON.parse(v); // evaluate 落盘时外层多包了一层 JSON 字符串
  return v;
};
const isRec = (o) => o && typeof o === 'object' && !Array.isArray(o);
const short = (v) => (typeof v === 'string' ? (v.length > 44 ? v.slice(0, 44) + '…' : v) : Array.isArray(v) ? `Array(${v.length})` : isRec(v) ? `{${Object.keys(v).length} keys}` : JSON.stringify(v));
const canon = (o) => (Array.isArray(o) ? o.map(canon) : isRec(o) ? Object.keys(o).sort().reduce((a, k) => ((a[k] = canon(o[k])), a), {}) : o);

function arrDiff(p, x, y, sink) {
  const a = Array.isArray(x) ? x : [], b = Array.isArray(y) ? y : [];
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  let ia = a.length - 1, ib = b.length - 1;
  while (ia >= i && ib >= i && a[ia] === b[ib]) { ia--; ib--; }
  const removed = a.slice(i, ia + 1), added = b.slice(i, ib + 1);
  if (!removed.length && !added.length) return;
  sink.push({ path: p, kind: 'array', lenA: a.length, lenB: b.length, removed: removed.length, added: added.length, removedSample: removed.slice(0, 3), addedSample: added.slice(0, 3) });
}
function walk(x, y, p, sink) {
  if (sink.length > 600) return;
  if (Array.isArray(x) || Array.isArray(y)) { if (JSON.stringify(x) !== JSON.stringify(y)) arrDiff(p, x, y, sink); return; }
  if (isRec(x) && isRec(y)) {
    const kx = Object.keys(x), ky = Object.keys(y), sy = new Set(ky), sx = new Set(kx);
    const onlyA = kx.filter((k) => !sy.has(k)), onlyB = ky.filter((k) => !sx.has(k));
    if (onlyA.length || onlyB.length) sink.push({ path: p, kind: 'keys', removedKeys: onlyA.length, addedKeys: onlyB.length, removedSample: onlyA.slice(0, 3), addedSample: onlyB.slice(0, 3) });
    for (const k of Object.keys(y)) if (sx.has(k)) walk(x[k], y[k], p ? p + '.' + k : k, sink);
    return;
  }
  if (JSON.stringify(x) !== JSON.stringify(y)) sink.push({ path: p, kind: 'value', from: short(x), to: short(y) });
}
const getAt = (o, p) => (p ? p.split('.').reduce((a, k) => (a == null ? a : a[k]), o) : o);

// 事故当时的逆操作，原样复刻 scripts/audit-phases.js 的 scrub —— 用它做完备性证明
function inverse(s, day) {
  const rec = (s.days || {})[day];
  const learned = (rec && rec.newLearned) || [];
  const n0 = Object.keys(s.cards || {}).length;
  if (learned.length) {
    s.unlearned = learned.concat(s.unlearned || []);
    for (const w of learned) if (s.cards && s.cards[w] && s.cards[w].learnedOn === day) delete s.cards[w];
    rec.newLearned = [];
    rec.immediate = { groups: 0, cards: 0, loops: 0, skipped: 0 };
  }
  if (s.immediate) s.immediate = { pendingCount: 0, pendingWords: [], active: null, stats: { groups: 0, cards: 0, loops: 0, skipped: 0 }, lastAvgLoops: 0 };
  return { movedWords: learned.length, cardsBefore: n0, cardsAfter: Object.keys(s.cards || {}).length };
}

const real = read('real-scheduler.json');
const base = read('iso-base.json');
const after = read('iso-after.json');
const profile = read('real-profile.json');
const day = Object.keys(after.days).filter((d) => (after.days[d].newLearned || []).length).sort().pop() || Object.keys(after.days).sort().pop();

/* A：答卡到底碰了哪些字段（权威，来自隔离档案的前后差） */
const touched = [];
walk(base, after, '', touched);

/* B：样本卡全字段（回答「learnedOn/interval/ease/lastSeen/reviewCount 逐项」） */
const newWords = after.days[day].newLearned || [];
const sampleWord = newWords.find((w) => after.cards[w]);
const sample = sampleWord ? after.cards[sampleWord] : null;

/* C：逆操作完备性（纯数据变换，在 Node 里跑） */
const invState = (() => { const c = JSON.parse(JSON.stringify(after)); return { c, r: inverse(c, day) }; })();
const residue2 = [];
walk(base, invState.c, '', residue2);
const canonEqual = JSON.stringify(canon(base)) === JSON.stringify(canon(invState.c));

/* D+E：真实档案复位核对（touched 路径 + 源码审计点名的关键标量） */
const CRIT = ['v', 'userDailyGoal', 'maxLimit', 'maxLimitPinned', 'currentLimit', 'consecutiveGoodDays', 'newWordOrder', 'freqRank', 'unlearned', 'relearned', 'cards', 'archived', 'mistakes', 'immediate', 'pendingLimit', 'manual', 'lifetime', 'lastSettlement', 'lastSettledDay']
  .concat(['dueSnapshot', 'snapshotDone', 'planSnapshot', 'doneToday', 'newWordLimit', 'newLearned', 'accScore', 'accCount', 'retried', 'immediate', 'settled', 'action', 'settlement', 'absent'].map((f) => 'days.' + day + '.' + f));
const eq = (b, r) => {
  if (Array.isArray(b) || Array.isArray(r)) { const x = b || [], y = r || []; return x.length === y.length && x.every((v, i) => v === y[i]); }
  return JSON.stringify(canon(b)) === JSON.stringify(canon(r));
};
const check = [];
for (const p of [...touched.map((e) => e.path), ...CRIT]) {
  if (check.some((c) => c.path === p)) continue;
  const b = getAt(base, p), r = getAt(real, p);
  check.push({ path: p || '(root)', ok: eq(b, r), expect: short(b), actual: short(r) });
}

/* F：未学池顺序（3846 项逐元素） */
const A = base.unlearned, B = real.unlearned;
let firstDiffAt = -1;
for (let i = 0; i < Math.max(A.length, B.length); i++) if (A[i] !== B[i]) { firstDiffAt = i; break; }

/* G：days 历史差异（隔离档案是全新安装，历史日本来就没有） */
const gb = Object.keys(base.days), gr = Object.keys(real.days);
const dayDiffs = [];
for (const k of gr.filter((k) => gb.indexOf(k) >= 0)) walk(base.days[k], real.days[k], 'days.' + k, dayDiffs);

const report = {
  day,
  I_wholeTreeRealVsPristine: (() => { const t = []; walk(base, real, '', t); return { count: t.length, list: t, canonEqual: JSON.stringify(canon(base)) === JSON.stringify(canon(real)), rawEqual: JSON.stringify(base) === JSON.stringify(real) }; })(),
  bytes: { real: JSON.stringify(real).length, isoBase: JSON.stringify(base).length, isoAfter: JSON.stringify(after).length },
  A_touchedFields: { count: touched.length, list: touched },
  B_sampleCard: { word: sampleWord, fieldCount: sample ? Object.keys(sample).length : 0, card: sample, pristineHasWord: !!(base.cards && base.cards[sampleWord]) },
  C_inverseProof: { ops: invState.r, residueCount: residue2.length, residue: residue2, canonEqual },
  D_realReset: { total: check.length, notPristineCount: check.filter((c) => !c.ok).length, bad: check.filter((c) => !c.ok) },
  F_unlearnedOrder: { isoLen: A.length, realLen: B.length, identical: firstDiffAt < 0 && A.length === B.length, firstDiffAt, sample: firstDiffAt < 0 ? null : { iso: A.slice(firstDiffAt, firstDiffAt + 3), real: B.slice(firstDiffAt, firstDiffAt + 3) } },
  G_days: { isoDays: gb, realDays: gr, onlyInRealHistory: gr.filter((k) => gb.indexOf(k) < 0), commonDayDiffCount: dayDiffs.length, commonDayDiffs: dayDiffs },
  H_profile: profile,
};
fs.writeFileSync(path.join(OUT, 'diff-report.json'), JSON.stringify(report, null, 1));
const compact = {
  day: report.day, bytes: report.bytes,
  A_count: touched.length, A: touched.slice(0, 40),
  B: report.B_sampleCard,
  C: { ops: invState.r, residueCount: residue2.length, residue: residue2.slice(0, 15), canonEqual },
  D: { total: check.length, notPristine: check.filter((c) => !c.ok).length, bad: check.filter((c) => !c.ok).slice(0, 20) },
  F: report.F_unlearnedOrder,
  I: report.I_wholeTreeRealVsPristine,
  G: report.G_days,
  full: OUT + '/diff-report.json',
};
console.log(JSON.stringify(compact, null, 1));
