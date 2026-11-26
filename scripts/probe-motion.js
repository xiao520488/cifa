/*
 * 20 秒探针模板（AGENTS.md「动效类先写 20 秒探针」，v13 起强制）。
 *
 * 什么时候用：改任何动效 / 跨挂载状态（数字滚动、转场、过渡类、模块级记忆）之前，
 * 先跑这个 —— 3 秒内把「内部状态长什么样」打成具体数字，再决定改哪一行。
 * 第一版探针在 v12 花了 40 分钟：状态藏在模块作用域，只能靠改源码打日志反推。
 *
 * 跑法（必须先复制到 playwright-mcp 目录，那里才有 node_modules/playwright）：
 *   Copy-Item D:\背单词\scripts\probe-motion.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\probe-motion.js
 *
 * 读 src/components/RollingNumber.tsx 里 dev-only 的 window.__motionState()：
 *   { t, entries: [{ key, from, to, current, subs, raf }], lastShown }
 * DOM 只作旁证（data-num-key / 文本 / 盒宽），不靠它推状态。
 *
 * 它只验两件事（约 3 秒）：
 *   1. 冷启动不滚：current === to、raf false、lastShown 空。
 *   2. 换屏不串味：去日历再回来，entries 的 key 跟着宿主走，没有残留的 raf。
 * **真实滚动（0→1 那一帧）仍然由 audit-motion.js G3 验**：造 due 卡 + 学一批是重流程，
 * 放进探针就不再是 20 秒了。探针的红线是「状态看不清」，不是「端到端全绿」。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';

  const dump = (label) =>
    page.evaluate((l) => {
      const st = window.__motionState ? window.__motionState() : null;
      return {
        label: l,
        t: st ? st.t : null,
        entries: st ? st.entries : null,
        lastShown: st ? st.lastShown : null,
        hosts: [...document.querySelectorAll('[data-num-key]')].map((el) => ({
          k: el.dataset.numKey,
          text: el.textContent,
          /* 盒宽：可见宿主才有值，display:none 的宿主是 0 —— 读数带在 5 套皮肤里是隐藏的 */
          w: Math.round(el.getBoundingClientRect().width * 10) / 10,
        })),
      };
    }, label);

  const out = {};

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.start', { timeout: 8000 });
  await page.waitForTimeout(150);
  out.home = await dump('首页');

  await page.click('.icon-btn[aria-label="打开学习日历"]');
  await page.waitForTimeout(400);
  out.calendar = await dump('日历');

  await page.click('.icon-btn[aria-label="返回首页"]').catch(() => {});
  await page.waitForTimeout(350);
  out.back = await dump('回首页');

  const st = out.home;
  out.notes = {
    hook: st.entries !== null,
    coldNoRoll: st.entries ? st.entries.every((e) => e.current === e.to && !e.raf) : null,
    /* dev 的 StrictMode 会把挂载跑两遍：subs 归零那一下就会写 lastShown（值等于 current，
       无害）。所以这里只看条数，不当断言用。 */
    lastShownN: st.lastShown ? Object.keys(st.lastShown).length : null,
    keysHome: st.entries ? st.entries.map((e) => e.key) : null,
    keysCalendar: out.calendar.entries ? out.calendar.entries.map((e) => e.key) : null,
    noRafLeft: out.back.entries ? out.back.entries.every((e) => !e.raf) : null,
  };
  return out;
};
