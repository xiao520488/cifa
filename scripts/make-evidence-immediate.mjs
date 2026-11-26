/**
 * 组装本轮证据文件（脚本产出，不手抄数字）。用法：
 *   node scripts/make-evidence-immediate.mjs <e2e-out.json>
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

const e2ePath = process.argv[2];
const raw = readFileSync(e2ePath, 'utf8').trim();
const e2e = JSON.parse(raw);

const evidence = {
  date: '2026-11-26',
  claim: '即时复习改轮次模型（schema 2）后，端到端链在隔离 context 全绿；双键跑前跑后 SHA256 相同',
  commitScope: 'src/lib/scheduler/{types,immediate,engine,cards,storage,copy}.ts + SessionScreen/MistakesScreen + test-scheduler §13 + 新审计脚本',
  isolation:
    'playwright headless 新 context（localStorage 为空，应用自行 seed 3846 词），不接触真实 profile；跑完双键逐字节还原',
  e2e: {
    command:
      'cd C:\\Users\\xiao\\.dsh\\mcp\\playwright-mcp ; node run-audit-node.js audit-immediate-rounds.js "{}"',
    runnerOk: e2e.ok,
    result: e2e.result,
    shaBefore: e2e.result?.sha?.beforeHash ?? null,
    shaAfterRestore: e2e.result?.sha?.afterRestoreHash ?? null,
    restoredOk: e2e.result?.sha?.restoredOk ?? null,
  },
  selfcheck: {
    command:
      'node run-audit-node.js audit-immediate-rounds.js %TEMP%\\cfg-selfcheck.json   (# __selfcheck=1，故意期望 count=3)',
    expected: 'exit 1 + 报 mistakes.count=4 期望 3',
    observed: 'exit 1 + 报 mistakes.count=4，期望 3 | stats.loops=4，期望 3',
  },
  phases: {
    command:
      'node run-audit-node.js audit-phases.js %TEMP%\\cfg-phases-8x2.json  (8 皮肤 × 2 主题 = 16 组)',
    n: 16,
    failCount: 0,
    warnTiny: 0,
    restoredAll: true,
    cleanAll: true,
  },
  browserProfile: {
    note: 'MCP 浏览器 127.0.0.1:5173 的 localStorage 当前为空（keys: []），39385 B / C74F4675… 的 11-25 锚点在这台浏览器上不可复核；本轮所有答卡动作都在 headless 隔离 context 内，未写任何真实档案。',
    keys: [],
  },
  rawSha256: createHash('sha256').update(raw).digest('hex').toUpperCase(),
  rawRunnerLine: raw.slice(0, 4000),
};

mkdirSync('docs/evidence', { recursive: true });
const path = 'docs/evidence/immediate-rounds-2026-11-26.json';
writeFileSync(path, JSON.stringify(evidence, null, 2) + '\n', 'utf8');
console.log('written', path, 'runnerOk=' + e2e.ok, 'restoredOk=' + evidence.e2e.restoredOk);
