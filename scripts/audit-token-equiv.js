// 读数族尺寸的**金值守卫**（refactor(tokens) 落地的同时收下，之后可反复复跑）。
//
// 为什么留成正式脚本而不是一次性探针：等值替换的正确判据不是「回归没红」，
// 而是「每个计算值逐条等于替换前的字面量」。期望值全部抄自替换前的 CSS，
// 于是这 17 条同时冻结了 desk 抽屉（96/13/34/11）与 desk/vinyl 常驻带（13/20/6/8/7/26/3/18）的几何——
// 日后谁真要改带段尺寸，必须**显式改这里的期望值**，改不动就说明是意外。
//
// 两条纪律（DESIGN_REVIEW 规则段）：
//   规则 7：页面侧代码看不见 Node 闭包，选择器/期望值一律走 args 注入（本脚本用 [sel, pseudo, props] + 闭包内字面量参数）。
//   Chromium 的 `gap` 在 row==column 时**折叠成单值**（`6px` 而不是 `6px 6px`），期望值按折叠写法。
//
// 跑法（在 playwright-mcp 目录下，隔离 context，不碰真实档案）：
//   node run-audit-node.js D:\背单词\scripts\audit-token-equiv.js '{}'
// 判据：result.allOk === true 且 fail === []。
//
// 另附像素级证据（本轮做过，非本脚本职责）：同条件重截与上一 commit 的 vC-*.png 逐字节比对，
// 15/16 完全相同，唯一差异 45 像素全落在 7×7 呼吸点框内（动画相位）。
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const setSkin = async (sk, th, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(BASE + '/icon.svg');
    await page.evaluate(([s, t]) => {
      const st = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
      st.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, st.profile, { skin: s, theme: t });
      localStorage.setItem('cijian.v1', JSON.stringify(st));
    }, [sk, th]);
    await page.goto(BASE + '/');
    await page.waitForTimeout(600);
  };
  const go = async (kind) => {
    let clicked = false;
    if (kind === 'cal') clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('学习日历')); if (b) { b.click(); return true; } return false; });
    if (kind === 'me') clicked = await page.evaluate(() => { const b = document.querySelector('.avatar-btn'); if (b) { b.click(); return true; } return false; });
    await page.waitForTimeout(500);
    return clicked;
  };
  // 页面侧取值：getComputedStyle 不吃 Node 闭包（规则 7），期望值一律走 args 注入
  const probe = (sel, pseudo, props) => page.evaluate(([s, p, pr]) => {
    const el = document.querySelector(s);
    if (!el) return { missing: s };
    const cs = getComputedStyle(el, p || null);
    const out = {};
    for (const k of pr) out[k] = cs[k];
    return out;
  }, [sel, pseudo, props]);

  const rows = [];
  const check = async (label, vp, kind, skin, sel, pseudo, props, expect) => {
    await setSkin(skin, 'light', vp[0], vp[1]);
    if (kind !== 'home') await go(kind);
    const got = await probe(sel, pseudo, props);
    const diff = Object.keys(expect).filter((k) => String(got[k]) !== String(expect[k])).map((k) => `${k}: got ${got[k]} want ${expect[k]}`);
    rows.push({ label, ok: diff.length === 0 && !got.missing, got, diff });
  };

  // ---- desk 抽屉（≥768 首页）：--ds-cell-h / --ds-readout-k / --ds-readout-v / --ds-kicker
  await check('desk 抽屉格高+字号', [1440, 900], 'home', 'desk',
    "[data-skin='desk'] .app:has(.start) .readout:nth-child(2)", null, ['minHeight'], { minHeight: '96px' });
  await check('desk 抽屉标签/字号', [1440, 900], 'home', 'desk',
    "[data-skin='desk'] .app:has(.start) .readout:nth-child(2) .readout__k", null, ['fontSize'], { fontSize: '13px' });
  await check('desk 抽屉数字', [1440, 900], 'home', 'desk',
    "[data-skin='desk'] .app:has(.start) .readout:nth-child(2) .readout__v", null, ['fontSize'], { fontSize: '34px' });
  await check('desk 轨顶 kicker', [1440, 900], 'home', 'desk',
    "[data-skin='desk'] .app:has(.start) .readouts", '::before', ['fontSize', 'content'], { fontSize: '11px', content: '"CIJIAN · DAILY"' });

  // ---- desk 常驻带：--ds-readout-k / --ds-band-v / --ds-band-gap
  await check('desk 带标签', [390, 844], 'cal', 'desk',
    "[data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout__k", null, ['fontSize'], { fontSize: '13px' });
  await check('desk 带数字', [390, 844], 'cal', 'desk',
    "[data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout__v", null, ['fontSize'], { fontSize: '20px' });
  await check('desk 带单行间距(≤389)', [360, 740], 'cal', 'desk',
    "[data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout", null, ['gap', 'flexDirection'], { gap: '6px', flexDirection: 'row' });

  // ---- vinyl 首页带：--vy-band-pad / --vy-band-disc / --vy-band-cell-gap / --vy-band-v / --vy-dot
  await check('vinyl 首页带内距', [390, 844], 'home', 'vinyl',
    "[data-skin='vinyl'] .readouts", null, ['paddingTop', 'paddingBottom'], { paddingTop: '8px', paddingBottom: '8px' });
  await check('vinyl 带左缘微型盘', [390, 844], 'home', 'vinyl',
    "[data-skin='vinyl'] .readouts", '::before', ['width', 'height'], { width: '26px', height: '26px' });
  await check('vinyl 带两行柱间距', [390, 844], 'home', 'vinyl',
    "[data-skin='vinyl'] .readout", null, ['gap', 'flexDirection'], { gap: '3px', flexDirection: 'column' });
  await check('vinyl 带数字', [390, 844], 'home', 'vinyl',
    "[data-skin='vinyl'] .readout__v", null, ['fontSize'], { fontSize: '18px' });
  await check('vinyl 首页呼吸点', [390, 844], 'home', 'vinyl',
    "[data-skin='vinyl'] .readouts[data-readouts-screen='home']", '::after', ['width', 'height', 'animationName'], { width: '7px', height: '7px', animationName: 'vy-pulse' });

  // ---- vinyl cal/me 带：§16 降级 + 呼吸点仍被圈死在首页
  await check('vinyl cal 带内距(390 宽档)', [390, 844], 'cal', 'vinyl',
    "[data-skin='vinyl'] .readouts[data-readouts-screen='cal']", null, ['paddingTop'], { paddingTop: '8px' });
  await check('vinyl cal 带无呼吸点', [390, 844], 'cal', 'vinyl',
    "[data-skin='vinyl'] .readouts[data-readouts-screen='cal']", '::after', ['content'], { content: 'none' });
  await check('vinyl cal 带内距(≤389)', [360, 740], 'cal', 'vinyl',
    "[data-skin='vinyl'] .readouts[data-readouts-screen='cal']", null, ['paddingTop', 'gap'], { paddingTop: '7px', gap: '12px' });
  await check('vinyl cal 单行间距(≤389)', [360, 740], 'cal', 'vinyl',
    "[data-skin='vinyl'] .readouts[data-readouts-screen='cal'] .readout", null, ['gap', 'flexDirection'], { gap: '6px', flexDirection: 'row' });

  // ---- vinyl 静态点（--vy-dot 第三处引用）
  await check('vinyl 小节标题静态点', [768, 1024], 'me', 'vinyl',
    "[data-skin='vinyl'] .section__title", '::before', ['width', 'height'], { width: '7px', height: '7px' });

  await setSkin('paper', 'light', 390, 844);
  return {
    n: rows.length,
    fail: rows.filter((r) => !r.ok).map((r) => ({ label: r.label, diff: r.diff, got: r.got })),
    allOk: rows.every((r) => r.ok),
    labels: rows.map((r) => r.label),
  };
}
