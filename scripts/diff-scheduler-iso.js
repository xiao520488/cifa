/* 隔离实验室：在独立 browser context 里跑答卡流程，真实档案一个字节都不动。
 *
 * 为什么存在：答卡会真的落库，而学习状态在 cijian.scheduler.v1（不是 cijian.v1）。
 * v10 的数据事故就是「在真实档案上跑答卡回归 + 只比对 cijian.v1」造成的，
 * 三条规则的第 1 条（首选隔离）就是它的产物。全键 diff 的结论见 docs/evidence/。
 *
 * 用法（工具序列，按顺序）：
 *   1. browser_tabs { action:'new', isolatedContext:'diffiso', url:'http://127.0.0.1:5173/icon.svg' }
 *      —— 新 context 的 localStorage 与默认 context 完全隔离（首次 navigation 可能报 Timeout，
 *         但 tab 其实已经建好，browser_tabs list 能看到 isolatedContext: diffiso，别重复创建）。
 *   2. 只播种 profile（ cijian.v1 只有 187 字节，学习数据一个字节都不播种）：
 *      browser_evaluate { function: () => localStorage.setItem('cijian.v1', <真实档案的 cijian.v1 原文>) }
 *   3. browser_navigate http://127.0.0.1:5173/ → app 自己长出一份 pristine scheduler 状态（约 39289 字节）。
 *      导出基线：browser_evaluate { filename:'out/iso-base.json', function: () => localStorage.getItem('cijian.scheduler.v1') }
 *      ⚠️ Playwright 侧注入的代码里 require / 动态 import 都不可用（ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING），
 *         所以「落盘」只能靠 browser_evaluate/browser_run_code_unsafe 的 filename 参数；
 *         filename 解析到 MCP 自己的根目录 C:\Users\xiao\.dsh\mcp\playwright-mcp\，跑完要 Copy 回仓库 out/。
 *   4. 跑流程：把下面 ISO_FLOW 整段作为 browser_evaluate 的 function 传进去，反复调，直到返回 done:true。
 *      默认走「认识」路径（与事故当时的最终干净轮次一致）；想验证模糊/不认识分支的残留，
 *      把 IF_FUZZY 打开——注意那条路径会写 mistakes/hard/lapses/loops，快照-还原方案救不回 mistakes（无历史可回滚）。
 *   5. 导出终点：browser_evaluate { filename:'out/iso-after.json', ... }
 *   6. 真实档案另存：browser_evaluate { filename:'out/real-scheduler.json', ... }（默认 context 的 tab）
 *   7. node scripts/diff-report.js  →  A 答卡触碰的字段清单 / B 样本卡全 15 字段 /
 *      C 逆操作完备性证明 / D+I 真实档案复位核对 / F 未学池逐元素顺序 / G 历史日差异
 *
 * 实测结论（v10.2，2026-11-25）：20 词的答卡只碰 8 条路径 ——
 *   unlearned(−20，且是从队首取走) / cards(+20 键) / days[今].newLearned(+20) /
 *   days[今].immediate.groups(0→2) / days[今].immediate.cards(0→20) /
 *   immediate.stats.groups(0→2) / immediate.stats.cards(0→20) / immediate.lastAvgLoops(null→0)
 *   其余 12 个顶层键 + 当天记录的其他 12 个字段全部零写入（源码审计与实测双向对上）。
 *   其中只有 lastAvgLoops 是「无法重建的滚动量」，scrub 不许把它写成 0。 */

// 页面内执行：一次调用最多 44 次点击（≈10s），远小于 MCP 30s 超时；跨调用用 localStorage['__isoFlow'] 续跑。
const ISO_FLOW = async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const S = () => JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
  const btn = (re) => [...document.querySelectorAll('button')].find((b) => re.test((b.textContent || '').trim()) && !b.disabled && b.getBoundingClientRect().width > 1);
  const st = JSON.parse(localStorage.getItem('__isoFlow') || 'null') || { known: 0, fuzzy: 0, next: 0, log: [], done: false, stuck: false };
  if (!btn(/下一批|看完收尾|认识/)) { const s0 = btn(/开始背单词/); if (s0) { s0.click(); await sleep(800); } }
  const IF_FUZZY = false; // true = 首词连点 3 次模糊，用来验证 mistakes/hard 残留
  let target = null, fz = 0;
  for (let i = 0; i < 44; i++) {
    if (document.querySelector('.session-done')) { st.done = true; break; }
    const main = document.querySelector('.app__main');
    const w = main ? (main.textContent || '').trim().split('/')[0].trim() : null;
    if (IF_FUZZY && !target && w && btn(/模糊/)) target = w;
    const k = btn(/认识/), fz0 = btn(/模糊/), nx = btn(/下一批|看完收尾/);
    if (IF_FUZZY && w === target && fz < 3 && fz0) { fz++; fz0.click(); st.fuzzy++; st.log.push({ act: 'fuzzy', w }); }
    else if (k) { k.click(); st.known++; st.log.push({ act: 'known', w }); }
    else if (nx) { nx.click(); st.next++; st.log.push({ act: 'next', w }); }
    else { st.stuck = true; break; }
    await sleep(205);
  }
  localStorage.setItem('__isoFlow', JSON.stringify(st));
  const s = S(), d = s.days[Object.keys(s.days).sort().pop()] || {};
  return {
    done: st.done, stuck: st.stuck, taps: st.log.length, known: st.known, fuzzy: st.fuzzy, next: st.next,
    cards: Object.keys(s.cards || {}).length, newLearned: (d.newLearned || []).length, unlearned: s.unlearned.length,
    mistakes: Object.keys(s.mistakes || {}).length, hard: Object.values(s.cards || {}).filter((c) => c.hard).length,
    loops: s.immediate.stats.loops, lastAvgLoops: s.immediate.lastAvgLoops,
    // 收尾后把流程键清掉，别让下一个 session 接着旧计数
    cleanup: (() => { if (st.done || st.stuck) { localStorage.removeItem('__isoFlow'); return true; } return false; })(),
  };
};
