// commit B 专项：cal/me 常驻读数带（.app > .readouts[data-readouts-screen]）断言矩阵。
//
// 用法（沿用 audit 家族惯例）：
//   1) Copy-Item scripts\audit-readouts-band.js C:\Users\xiao\.dsh\mcp\playwright-mcp\scripts\ -Force
//   2) browser_run_code_unsafe({ filename: 'scripts/audit-readouts-band.js' })
//   配置键（写在 /icon.svg 的 localStorage，命名与 audit-screens.js 同族）：
//     __band_themes  默认 ["light","dark"]
//     __band_vps     默认 [[390,844],[360,740]]
//     __band_shots   '1' 才截图（默认不截，免得污染 docs/screenshots）
//     __band_prefix  截图前缀，默认 'vB'
//
// ── 为什么必须单独一个脚本（用户的硬条件 H1）────────────────────────────────
// 首页 `.readouts` 带 `aria-hidden="true"`（原 StudyScreen.tsx:78 内联块，现移到
// Readouts.tsx 并保留），而 `audit-screens.js:51` 与 `scan-tiny.js:9` 都对
// `closest('[aria-hidden="true"]')` 直接 `continue` —— 带子里的文本对比度、盒宽、
// 溢出、裁切**全在既有探针的盲区**。「audit-screens 绿了」不等于带子干净。
// 所以下面的 BAND_PROBE 显式钻进带子，**不做 aria-hidden 豁免**。
//
// ── 44px 触控门禁为什么对带子不适用（用户的硬条件 H2：豁免必须写明理由，不许默默放过）──
// 理由：带子是纯展示节点（`aria-hidden` + 只读），**带内零交互元素**。探针的触控检查
// 只圈 `button,a,input,select,[role=…],textarea`（audit-screens.js:65），纯 div/span 不在其列。
// 但豁免的前提本身要实测：本脚本统计 `inter`（交互选择器命中数）与 `pointer`
// （computed cursor:pointer 数），**任一 > 0 立即 FAIL，不再走豁免分支**。
// 这就是规约里「带子不许做成可点跳首页」的结构化落实——一旦有人加 `<button>`，这里就红。
//
// ── 数据纪律（DESIGN_REVIEW 规则段第 5、6、7 条，逐条落实在此）───────────────
// 1. 本矩阵**全程不答卡**，只做导航与探针，因此**学习键** cijian.scheduler.v1 整程必须逐字节不变
//    （endedSch === baseSch → learnDataKept）。**整程不能比双键**：cijian.v1 存的是皮肤/主题偏好，
//    setSkin() 每轮合法改写它，拿「双键整程相等」当门禁等于造一条永假断言（v11 实测踩过，
//    dataKeptAllRun:false 假警报）。**双键只在逐测点窗口内比**（run() 里的 snapOf 前后对比），
//    那一段没有任何合法写入，diff 就是误触交互件，按 FAIL 追凶，不许顺手 restore 掩盖。
// 2. 快照-还原必须**双键**（键名出处 src/lib/storage.ts:3、src/lib/scheduler/storage.ts:28）：
//    学习状态在 cijian.scheduler.v1，只比 cijian.v1 等于没守——v10.2 的数据事故就是这么来的。
//    （还原双键 ≠ 断言双键：备份/还原覆盖两个键是防中途崩，整程门禁仍只看学习键。）
// 3. 临时备份键跑完必须删除。本脚本用 `__bandbak_*` 前缀，**不复用 `__bak_*`**，
//    避免和 audit-phases.js 的自愈协议互相「还原」；收尾无条件删除并断言删净。
//    残留备份比事故更隐蔽：下一次跑测会把用户这期间真实学习产生的数据当脏状态回滚掉。
// 4. `page.evaluate` **不捕获 Node 闭包变量**：本文件里的 SKINS / EXPECT / KEYS / BAK 在页面里
//    一律 undefined，凡页面代码要用必须走第二个参数注入（`page.evaluate(fn, { ks: KEYS, bak: BAK })`）。
//    踩过：`ReferenceError: BAK is not defined`。
// 5. **语义门禁**（v11 收尾拍板③）：vinyl 的呼吸点 = 「播放器在响」，只属于首页；
//    cal/me 常驻带上的这颗点整颗撤掉。pulseOk 逐测点验（首页 anim==='vy-pulse'、带内 content==='none'），
//    不靠肉眼截图——「观感可接受」和「语义对」是两回事，只有断言能守住后者。
//
// ── 开关真值（手抄自 src/lib/skins.ts 的 persistentReadouts）─────────────────
// desk / vinyl = true（cal/me 有节点）；paper / foundry / instrument / broadsheet /
// bento / nocturne = false（cal/me **连隐藏节点都不许有**——按 querySelector 为 null 断言）。
// 手抄两处必须同步；末尾用「外观面板皮肤卡数 === 8」做漂移兜底断言。
async (page) => {
  const SKINS = ['paper', 'breeze', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'desk', 'vinyl'];
  const EXPECT = new Set(['desk', 'vinyl']);
  const KEYS = ['cijian.v1', 'cijian.scheduler.v1'];
  const BAK = '__bandbak_';

  await page.goto('http://127.0.0.1:5173/icon.svg');
  const cfg = await page.evaluate(() => ({
    themes: JSON.parse(localStorage.getItem('__band_themes') || '["light","dark"]'),
    vps: JSON.parse(localStorage.getItem('__band_vps') || '[[390,844],[360,740]]'),
    shots: localStorage.getItem('__band_shots') === '1',
    prefix: localStorage.getItem('__band_prefix') || 'vB',
  }));

  // 开始前先自愈：上一次崩溃残留的 __bandbak_* 若存在，逐字节还原（并如实报告发生过）
  const pre = await page.evaluate(({ ks, bak }) => {
    const saved = ks.map((k) => localStorage.getItem(bak + k));
    if (saved.every((v) => v !== null)) ks.forEach((k, i) => localStorage.setItem(k, saved[i]));
    return { healed: saved.every((v) => v !== null) };
  }, { ks: KEYS, bak: BAK });

  const snapOf = () => page.evaluate((ks) => ks.map((k) => localStorage.getItem(k)).join('\u0000'), KEYS);
  // 整程比对只看**学习键**：cijian.v1 里存的是皮肤/主题偏好，setSkin() 每轮都会合法改写它，
  // 拿双键整程相等当门禁等于自己给自己造一个永远为 false 的断言。逐测点的 dataKept 仍比双键
  // （那一段时间窗里没有 setSkin，双键都该纹丝不动）。
  const schOf = () => page.evaluate(() => localStorage.getItem('cijian.scheduler.v1'));
  const base = await snapOf();
  const baseSch = await schOf();

  await page.evaluate(({ ks, bak }) => {
    for (const k of ks) localStorage.setItem(bak + k, localStorage.getItem(k));
    localStorage.setItem(bak + 'at', new Date().toISOString());
  }, { ks: KEYS, bak: BAK });

  const setSkin = async (sk, th, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://127.0.0.1:5173/icon.svg');
    await page.evaluate(([a, b]) => {
      const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
      s.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, s.profile, { skin: a, theme: b });
      localStorage.setItem('cijian.v1', JSON.stringify(s));
    }, [sk, th]);
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(340);
  };

  const go = async (kind) => {
    if (kind === 'home') return true;
    // v2 第一阶段：日历 / 设置全走底部 Tab；外观面板只在设置页有入口
    if (kind === 'cal') return page.evaluate(() => { const b = document.querySelector('.tabbar [data-tab="data"]'); if (b) b.click(); return !!b; });
    if (kind === 'me') return page.evaluate(() => { const b = document.querySelector('.tabbar [data-tab="settings"]'); if (b) b.click(); return !!b; });
    if (kind === 'mistakes') return page.evaluate(() => { const row = [...document.querySelectorAll('.setting-row')].find((r) => (r.querySelector('.setting-row__label') || {}).textContent?.includes('错词本')); const b = row && row.querySelector('button'); if (b) b.click(); return !!b; });
    if (kind === 'sheet') return page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '快速切换'); if (b) b.click(); return !!b; });
    return false;
  };

  const BAND_PROBE = () => {
    const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const ln = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const lu = (c) => .2126 * ln(c.r) + .7152 * ln(c.g) + .0722 * ln(c.b);
    const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + .05) / (x[1] + .05); };
    const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const bgo = (e) => {
      const st = []; let n = e;
      while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; }
      let b = pc(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 };
      for (let i = st.length - 1; i >= 0; i--) b = over(st[i], b);
      return b;
    };
    // 祖先里有没有 hidden/clip 把带子内容永久裁掉（横向、纵向分开算，同 audit-screens 的模型）
    const clipBox = (e) => {
      const o = e.getBoundingClientRect();
      let r = { left: o.left, top: o.top, right: o.right, bottom: o.bottom }, sx = false, sy = false, n = e.parentElement;
      while (n && n !== document.documentElement) {
        const c = getComputedStyle(n), b = n.getBoundingClientRect();
        if ((c.overflowX === 'auto' || c.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 1) sx = true;
        if ((c.overflowY === 'auto' || c.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) sy = true;
        if (c.overflowX === 'hidden' || c.overflowX === 'clip') { r.left = Math.max(r.left, b.left); r.right = Math.min(r.right, b.right); }
        if (c.overflowY === 'hidden' || c.overflowY === 'clip') { r.top = Math.max(r.top, b.top); r.bottom = Math.min(r.bottom, b.bottom); }
        n = n.parentElement;
      }
      return { ...r, sx, sy };
    };
    const el = document.querySelector('.app > .readouts');
    if (!el) return { present: false };
    const cs = getComputedStyle(el), b = el.getBoundingClientRect();
    const main = document.querySelector('.app__main').getBoundingClientRect();
    const low = [], tiny = [], outX = [], clipped = [];
    for (const e of [el, ...el.querySelectorAll('*')]) {
      const c = getComputedStyle(e), r = e.getBoundingClientRect();
      if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        const f0 = pc(c.color);
        if (f0) {
          const bgc = bgo(e);
          const f = f0.a < 1 ? over(f0, bgc) : f0;
          const sz = parseFloat(c.fontSize);
          const big = sz >= 24 || (sz >= 18.66 && +c.fontWeight >= 700);
          const ratio = rt(f, bgc);
          if (c.display !== 'none' && r.width > 0.5 && ratio < (big ? 3 : 4.5) - 0.01) low.push([String(e.className), e.textContent.trim(), sz, +ratio.toFixed(2)]);
          const cjk = (e.textContent.match(/[\u4e00-\u9fff]/g) || []).length;
          if (c.display !== 'none' && cjk > 4 && sz < 14) tiny.push([String(e.className), e.textContent.trim(), sz]);
        }
      }
      if (c.display === 'none' || r.width < 0.5 || r.height < 0.5) continue;
      const cb = clipBox(e);
      if ((cb.right < r.right - 1.5 || cb.left > r.left + 1.5) && !cb.sx) clipped.push([String(e.className), 'x@' + Math.round(cb.right)]);
      if ((cb.bottom < r.bottom - 1.5 || cb.top > r.top + 1.5) && !cb.sy) clipped.push([String(e.className), 'y@' + Math.round(cb.bottom)]);
      if (r.left < -0.5 || r.right > innerWidth + 0.5) outX.push([String(e.className), Math.round(r.left), Math.round(r.right)]);
    }
    const cells = [...el.querySelectorAll('.readout')].map((c) => {
      const cc = getComputedStyle(c);
      return { key: c.dataset.readout, hidden: cc.display === 'none', k: (c.querySelector('.readout__k') || {}).textContent, v: (c.querySelector('.readout__v') || {}).textContent };
    });
    return {
      present: true, screen: el.dataset.readoutsScreen || null,
      shown: cs.display !== 'none' && b.width > 1 && b.height > 1,
      bandH: Math.round(b.height), bandTop: Math.round(b.top), bandBottom: Math.round(b.bottom),
      belowMain: b.top >= main.bottom - 1.5, inX: b.left >= -0.5 && b.right <= innerWidth + 0.5,
      docOvf: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      bandOverflow: cs.overflowX !== 'visible' || cs.overflowY !== 'visible',
      vals: cells.map((c) => c.v), cells,
      // H2 前提实测：带内交互元素数 + cursor:pointer 数，任一 > 0 就 FAIL（不走豁免）
      inter: el.querySelectorAll('button,a,input,select,textarea,[role],[onclick],[tabindex]').length,
      pointer: [...el.querySelectorAll('*')].filter((e) => getComputedStyle(e).cursor === 'pointer').length,
      // 语义门禁（v11 收尾拍板③）：vy-pulse 的语义是「播放器在响」，只属于首页。
      // 首页 vinyl 必须 animationName==='vy-pulse'；cal/me 必须 content==='none'（整颗点撤掉）。
      // 不测这条的话，「观感可接受」会把语义漂移永久固化下来。
      pulse: (() => { const a = getComputedStyle(el, '::after'); return { content: a.content, anim: a.animationName }; })(),
      low, tiny, outX, clipped,
      snapped: [...document.querySelectorAll('*')].filter((e) => { const c = getComputedStyle(e); return (c.overflowX === 'auto' || c.overflowX === 'scroll') && c.scrollSnapType !== 'none' && e.scrollLeft > 1; }).length,
    };
  };

  // 呼吸点语义门禁（v11 收尾③）：动效=「播放器在响」，这个语法只许出现在首页。
  // 首页 vinyl 必须在响；vinyl 的 cal/me 必须整颗点撤掉（content:none，不是只停动画——
  // 静态 accent 点同样是无语义装饰，违反 vinyl 的 accent 预算）；其余皮肤常驻带不许有动效。
  const pulseOk = (skin, r) => {
    if (!r.present) return true;                                              // false 皮肤查无节点：不适用
    if (r.screen === 'home') return skin !== 'vinyl' || r.pulse.anim === 'vy-pulse';
    if (skin === 'vinyl') return r.pulse.content === 'none';
    return r.pulse.anim === 'none';
  };

  const rows = [];
  const run = async (skin, theme, vp, kind) => {
    const [w, h] = vp;
    await setSkin(skin, theme, w, h);
    if (kind === 'mistakes' || kind === 'sheet') { await go('me'); await page.waitForTimeout(240); }
    const before = await snapOf();
    const ok = await go(kind);
    await page.waitForTimeout(320);
    if (!ok) { const f = { skin, theme, w, kind, nav: 'FAIL' }; rows.push(f); return f; }
    const r = await page.evaluate(BAND_PROBE);
    if (cfg.shots && EXPECT.has(skin)) await page.screenshot({ path: `${cfg.prefix}-${skin}-${kind}-${theme}-${w}.png`, scale: 'css' });
    const row = { skin, theme, w, kind, dataKept: (await snapOf()) === before, ...r };
    rows.push(row);
    if (kind === 'sheet' || kind === 'mistakes') { await page.keyboard.press('Escape'); await page.waitForTimeout(140); }
    return row;
  };

  // 主矩阵：cal × me × 8 皮肤 × 明暗 × 2 视口；每测点先取首页同值做同源对照
  for (const vp of cfg.vps) {
    for (const theme of cfg.themes) {
      for (const skin of SKINS) {
        const home = await run(skin, theme, vp, 'home');
        home.pulseOk = pulseOk(skin, home);
        for (const kind of ['cal', 'me']) {
          const r = await run(skin, theme, vp, kind);
          const want = EXPECT.has(skin);
          r.nodeOk = r.present === want;                                   // false 皮肤：DOM 查无节点
          r.shownOk = !want || !!(r.shown && r.belowMain && r.inX && !r.docOvf); // true 皮肤：可见+沉底+不出列
          r.valsOk = !want || (r.vals.length === 3 && r.vals.every((v) => /^\d+$/.test(v || '')));
          r.sameAsHome = !want || JSON.stringify(r.vals) === JSON.stringify(home.vals); // 三屏同源
          r.noInter = !want || (r.inter === 0 && r.pointer === 0);          // H2 前提
          r.pulseOk = pulseOk(skin, r);                                      // 收尾③ 语义
          r.clean = !want || !(r.low.length || r.tiny.length || r.outX.length || r.clipped.length || r.bandOverflow || r.snapped);
        }
      }
    }
  }

  // 反例：mistakes 屏恒无带节点（开关范围外）；sheet 浮层从设置页打开（v2 第一阶段：
  // 首页调色板已删），此时带子必须仍是设置页那块（data-readouts-screen='me'），
  // 不许退回首页那块、也不许消失——浮层不该改变常驻带的归属。
  const counter = [];
  for (const skin of SKINS) {
    const m = await run(skin, 'light', cfg.vps[0], 'mistakes');
    counter.push({ skin, kind: 'mistakes', absentOk: m.present === false });
    const s = await run(skin, 'light', cfg.vps[0], 'sheet');
    // 开在设置页上：真有两档带子的皮肤必须是 'me'；没有带子的皮肤则必须「查无节点」，
    // 不许借浮层凭空冒出一条 me 带。
    counter.push({ skin, kind: 'sheet', notBand: s.present === false || s.screen === 'me' });
  }

  // 漂移兜底：面板里皮肤卡数必须 === SKINS.length，否则说明皮肤表动过而 EXPECT 没跟
  await setSkin('paper', 'light', cfg.vps[0][0], cfg.vps[0][1]);
  await go('me');
  await page.waitForTimeout(200);
  await go('sheet');
  await page.waitForTimeout(280);
  const cards = await page.evaluate(() => document.querySelectorAll('.sheet .skin-card').length);
  await page.keyboard.press('Escape');

  // 收尾：双键还原（若中途有写入）→ 无条件删除临时备份键并断言删净（规则 3）
  const ended = await snapOf();
  const endedSch = await schOf();
  const cleanup = await page.evaluate(({ ks, bak }) => {
    const out = { restored: false, cleaned: false };
    if (localStorage.getItem(bak + 'at') !== null && ks.every((k) => localStorage.getItem(bak + k) !== null)) {
      for (const k of ks) localStorage.setItem(k, localStorage.getItem(bak + k));
      out.restored = true;
    }
    for (const k of ks) localStorage.removeItem(bak + k);
    localStorage.removeItem(bak + 'at');
    out.cleaned = ks.every((k) => localStorage.getItem(bak + k) === null) && localStorage.getItem(bak + 'at') === null;
    return out;
  }, { ks: KEYS, bak: BAK });

  const bandRows = rows.filter((r) => r.kind === 'cal' || r.kind === 'me');
  const homeRows = rows.filter((r) => r.kind === 'home');
  const badBand = bandRows.filter((r) => r.nav === 'FAIL' || r.nodeOk === false || r.shownOk === false || r.valsOk === false || r.sameAsHome === false || r.noInter === false || r.pulseOk === false || r.clean === false || r.dataKept === false);
  // 首页对照：8 套皮肤首页节点**恒存在**（显隐归皮肤 CSS），且必须是 screen='home'、三项皆数字
  const badHome = homeRows.filter((r) => r.nav === 'FAIL' || r.present !== true || r.screen !== 'home' || !(r.vals || []).every((v) => /^\d+$/.test(v || '')) || r.pulseOk === false || r.dataKept === false);
  return {
    points: bandRows.length,
    failCount: badBand.length + badHome.length + counter.filter((c) => !(c.absentOk || c.notBand)).length + (endedSch === baseSch ? 0 : 1),
    skinCards: cards, driftGuard: cards === SKINS.length,
    healedResidue: pre.healed,
    // 学习数据整程零写入（本矩阵不答卡，任何 diff 都是误触交互件）
    learnDataKept: endedSch === baseSch,
    prefsTouched: ended !== base, // cijian.v1 的偏好键必然被 setSkin 改过，只如实报告
    cleanup,
    tapExemption: '带子 44px 门禁不适用，理由＝带内零交互元素（实测 inter 与 pointer 均为 0）；任一 >0 即 FAIL，不走豁免',
    // 收尾③ 语义统计：首页 vinyl「在响」的测点数 / 常驻带被撤点的测点数（应等于带节点数）
    pulse: {
      homePulsing: homeRows.filter((r) => r.pulse && r.pulse.anim === 'vy-pulse').length,
      bandDotsRemoved: bandRows.filter((r) => r.present && r.pulse.content === 'none').length,
      bandNodes: bandRows.filter((r) => r.present).length,
    },
    bySkin: SKINS.map((s) => ({ skin: s, want: EXPECT.has(s), bandNodes: bandRows.filter((r) => r.skin === s && r.present).length, of: bandRows.filter((r) => r.skin === s).length })),
    counterFail: counter.filter((c) => !(c.absentOk || c.notBand)),
    fail: badBand.concat(badHome),
    samples: bandRows.filter((r) => r.present).slice(0, 6).map((r) => ({ skin: r.skin, kind: r.kind, w: r.w, bandH: r.bandH, vals: r.vals, hiddenCell: r.cells.map((c) => c.hidden), low: r.low.length, clipped: r.clipped.length })),
  };
}