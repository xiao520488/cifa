// 独立 Node runner：把 scripts/audit-*.js 里的 `async (page) => {...}` 直接 eval 起来，
// 用 playwright 起一个 **headless 隔离 context** 跑，不经过 playwright-mcp 的单请求超时。
//
// 为什么要它（v11 收尾实测）：
//   browser_run_code_unsafe 是一次 HTTP 请求，128 组 × ~2s 直接 Request timed out，
//   结果 JSON 丢了个干净（页面却跑完了，只能看到最后状态）。272 组主矩阵没法在单调用里跑完。
//   拆成 7 批又会把每批的整段脚本回显吃进上下文——审计脚本本身 14KB，比结果贵得多。
//
// 为什么这样是**等价**的：探针逻辑不复制一份，eval 的就是仓库里那个文件，
// 门禁、判据、配置键（__audit_* / __band_*）全部同源；只有「谁启动浏览器」变了。
//
// 为什么隔离 context 更好（DESIGN_REVIEW 规则 1）：全新 context 的 localStorage 是空的，
// 应用按 pristine 自行 seed（cards 0 / unlearned 3846），真实 profile 一个字节都不碰。
//
// 用法（必须在 playwright-mcp 目录下跑，那里才有 node_modules/playwright）：
//   Copy-Item D:\背单词\scripts\run-audit-node.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
//   node run-audit-node.js D:\背单词\scripts\audit-screens.js '{"__audit_skins":"[...]","__audit_vps":"[[390,844]]","__audit_shots":"0"}'
// 第二个参数是写进 localStorage 的配置（值一律字符串），省略则用脚本内默认。
const { chromium } = require('playwright');
const fs = require('fs');

const FILE = process.argv[2];
// argv[3] 可以是 JSON 字面量，也可以是 .json 文件路径——PowerShell 传内嵌 JSON 会把引号吃掉，
// 分批跑矩阵一律用文件（scripts/cfg-*.json），可复现、可 diff。
const ARG = process.argv[3] || '{}';
const CFG = ARG.trim().startsWith('{') ? JSON.parse(ARG) : JSON.parse(fs.readFileSync(ARG, 'utf8'));
const BASE = 'http://127.0.0.1:5173';
const EXE = 'C:\\Users\\xiao\\AppData\\Local\\ms-playwright\\chromium-1254\\chrome-win64\\chrome.exe';

(async () => {
  if (!FILE || !fs.existsSync(FILE)) throw new Error('用法：node run-audit-node.js <audit-script.js> [cfgJson]');
  const src = fs.readFileSync(FILE, 'utf8').trimEnd().replace(/;+$/, ''); // 家族惯例：文件以 } 结尾，不带分号
  const fn = eval('(' + src + ')');                                        // 表达式求值，非 Function 构造
  if (typeof fn !== 'function') throw new Error('脚本不是 async (page) => {...} 表达式');

  const browser = await chromium.launch({ headless: true, executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 160)); });

  // 先落地 origin 再种配置：审计脚本第一件事就是 goto /icon.svg 读 __audit_* / __band_*
  await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
  await page.evaluate((c) => { for (const [k, v] of Object.entries(c)) localStorage.setItem(k, String(v)); }, CFG);
  // **必须 warm-up 一次**：全新 context 里应用还没落过盘，`cijian.v1` 是 null、`cijian.scheduler.v1` 不存在。
  // audit-phases.js 的「快照-还原」会在这一刻把备份抓成 `null` / `"{}"`（v11 实测：8 组 restored 全 false，
  // 而 live 却是 cards 0 / unlearned 3846 的正常态——假失败）。先跑一次首页让应用自行 seed，
  // 备份抓到的才是真基线。探针类脚本不受影响（它们本来就自己 goto）。
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const t0 = Date.now();
  const res = await fn(page);
  const ms = Date.now() - t0;

  // 数据快照：隔离 context 里跑完，把两个键的最终状态如实报出来
  const data = await page.evaluate(() => ({
    prefs: (JSON.parse(localStorage.getItem('cijian.v1') || '{}').profile || {}).skin,
    sch: (() => { try { const s = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}'); return { cards: Object.keys(s.cards || {}).length, unlearned: (s.unlearned || []).length, lastAvgLoops: (s.immediate || {}).lastAvgLoops }; } catch (e) { return { err: String(e) }; } })(),
    bakKeys: Object.keys(localStorage).filter((k) => k.startsWith('__bak_') || k.startsWith('__bandbak_')),
  }));

  console.log(JSON.stringify({ ok: true, ms, data, consoleErrors: errors.slice(0, 5), nErrors: errors.length, result: res }));
  await browser.close();
})().catch((e) => { console.log(JSON.stringify({ ok: false, error: e.message, stack: String(e.stack).split('\n').slice(0, 3) })); process.exit(1); });
