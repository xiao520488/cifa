async (page) => {
  // 跨界面皮肤审计（v10）。配置在 /icon.svg 的 localStorage 里：
  // __audit_skins / __audit_themes / __audit_vps / __audit_screens / __audit_prefix / __audit_gap
  // 用法：先复制到 playwright-mcp 目录，再 browser_run_code_unsafe({ filename: 'scripts/audit-screens.js' })
  // 裁切模型按轴分开：横向 hidden = 永久裁掉（缺陷）；横向 auto = 可滑到（豁免）；纵向可滚同理。
  // 铁律：session 档只做「进入 → 截图 → 退出本次学习」，绝不答卡（列表阶段不落库，见 SessionScreen 头注释）。
  await page.goto('http://127.0.0.1:5173/icon.svg');
  const cfg = await page.evaluate(() => ({
    skins: JSON.parse(localStorage.getItem('__audit_skins') || '["bento","nocturne","desk","vinyl"]'),
    themes: JSON.parse(localStorage.getItem('__audit_themes') || '["light","dark"]'),
    vps: JSON.parse(localStorage.getItem('__audit_vps') || '[[390,844]]'),
    screens: JSON.parse(localStorage.getItem('__audit_screens') || '["home","cal","me","mistakes","sheet"]'),
    prefix: localStorage.getItem('__audit_prefix') || 'v10',
    gapMax: +(localStorage.getItem('__audit_gap') || 150),
    shots: localStorage.getItem('__audit_shots') !== '0',
  }));
  const PROBE = ({ rootSel, gapMax }) => {
    const root = rootSel ? document.querySelector(rootSel) : document.querySelector('.screen') || document.body;
    const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const ln = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const lu = (c) => .2126 * ln(c.r) + .7152 * ln(c.g) + .0722 * ln(c.b);
    const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + .05) / (x[1] + .05); };
    const ovr = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const bgo = (e) => { const st = []; let n = e; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; } let base = pc(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = ovr(st[i], base); return base; };
    const vis = (e) => { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    // 按轴求「可见盒」+ 该轴是否**真的还能滚到**。
    // v10 修正：旧写法把「祖先 overflow-x 计算值非 visible」当成可滚就豁免，
    // 而 .app__main 的 overflow-x 恒为 hidden → 整站出列检查长期失效（v9 的 nOut:0 作废）。
    // 现在：只有 (auto|scroll) 且 scrollWidth>clientWidth（纵向同理）才算可滚；hidden/clip 的裁剪本身就是缺陷。
    const box = (e) => {
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
      return { ...r, w: r.right - r.left, h: r.bottom - r.top, sx, sy };
    };
    const app = document.querySelector('.app').getBoundingClientRect();
    const low = [], small = [], out = [], outY = [], clip = [], tiny = [];
    const seen = new Set();
    const scope = rootSel ? [root, ...root.querySelectorAll('*')] : [...document.querySelectorAll('.screen *, .topbar *, .readouts *, .sheet, .sheet *, .dialog, .dialog *')];
    for (const e of scope) {
      if (e.closest('[aria-hidden="true"]') || !vis(e)) continue;
      const c = getComputedStyle(e);
      if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        const f0 = pc(c.color), b = bgo(e);
        if (f0) {
          const f = f0.a < 1 ? ovr(f0, b) : f0;
          const sz = parseFloat(c.fontSize), big = sz >= 24 || (sz >= 18.66 && +c.fontWeight >= 700), need = big ? 3 : 4.5;
          const cjk = (e.textContent.match(/[\u4e00-\u9fff]/g) || []).length;
          if (cjk > 4 && sz < 14) tiny.push([String(e.className).slice(0, 18), e.textContent.trim().slice(0, 6), sz, cjk]);
          const ratio = rt(f, b), k = c.color + '|' + e.className;
          if (!seen.has(k) && ratio < need - .01) { seen.add(k); low.push([String(e.className).slice(0, 20), e.textContent.trim().slice(0, 8), sz, +ratio.toFixed(2), need]); }
          if (c.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2 && c.textOverflow !== 'ellipsis') clip.push([String(e.className).slice(0, 20), e.textContent.trim().slice(0, 8), e.scrollWidth - e.clientWidth]);
        }
      }
      if (e.matches('button,a,input,select,[role="button"],[role="checkbox"],textarea')) {
        const r = e.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) continue;
        const cb = box(e);
        const wShort = Math.min(r.width, cb.w) < 43.5, hShort = Math.min(r.height, cb.h) < 43.5;
        if ((wShort && !(r.width >= 44 && cb.sx)) || (hShort && !(r.height >= 44 && cb.sy))) {
          small.push([String(e.className).slice(0, 20) || e.tagName, Math.round(Math.min(r.width, cb.w)) + '/' + Math.round(r.width), Math.round(Math.min(r.height, cb.h)) + '/' + Math.round(r.height), (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 8)]);
        }
      }
      {
        const r = e.getBoundingClientRect(), cb = box(e);
        if (r.width > 3 && (cb.right < r.right - 1.5 || cb.left > r.left + 1.5) && !cb.sx && (r.right > app.right + 1.5 || r.left < app.left - 1.5)) {
          out.push([String(e.className).slice(0, 20), Math.round(r.left) + '-' + Math.round(r.right), 'clip@' + Math.round(cb.right)]);
        }
        // 纵向出列：被 overflow-y:hidden/clip 的祖先永久裁掉，且祖先纵向不可滚
        if (r.height > 3 && (cb.bottom < r.bottom - 1.5 || cb.top > r.top + 1.5) && !cb.sy) {
          outY.push([String(e.className).slice(0, 20), Math.round(r.top) + '-' + Math.round(r.bottom), 'clip@' + Math.round(cb.bottom)]);
        }
      }
    }
    let maxGap = 0, gapAt = null;
    for (const cand of [document.querySelector('.app__main'), document.querySelector('.screen'), document.querySelector('.sheet__body'), document.querySelector('.dialog')]) {
      if (!cand || !vis(cand)) continue;
      const kids = [...cand.children].filter(vis);
      if (kids.length < 2) continue;
      const ys = kids.map((k) => { const r = k.getBoundingClientRect(); return { t: r.top + cand.scrollTop, b: r.bottom + cand.scrollTop }; }).sort((a, b) => a.t - b.t);
      let g = 0;
      for (let i = 1; i < ys.length; i++) g = Math.max(g, Math.round(ys[i].t - ys[i - 1].b));
      if (g > maxGap) { maxGap = g; gapAt = cand.className; }
    }
    const mEl = document.querySelector('.app__main');
    const room = mEl ? mEl.scrollHeight - mEl.clientHeight : 0;
    let cta = null;
    const ctaEl = document.querySelector('.start .start__actions .btn--primary') || document.querySelector('.start .start__actions button');
    if (ctaEl && !rootSel) {
      const r = ctaEl.getBoundingClientRect(), m = mEl.getBoundingClientRect(), tb = document.querySelector('.topbar').getBoundingClientRect();
      const conds = { belowTopbar: r.top >= tb.bottom - 1, aboveFold: r.bottom <= m.bottom + 1, inX: r.right <= m.right + 1 && r.left >= m.left - 1, size: r.width >= 44 && r.height >= 44 };
      cta = { ok: Object.values(conds).every(Boolean), why: Object.keys(conds).filter((k) => !conds[k]).join('+') || null, box: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
    }
    const snapped = [...document.querySelectorAll('*')].filter((e) => { const c = getComputedStyle(e); return (c.overflowX === 'auto' || c.overflowX === 'scroll') && c.scrollSnapType !== 'none' && e.scrollLeft > 1; }).map((e) => String(e.className).slice(0, 18) + '=' + e.scrollLeft);
    return { ovf: document.documentElement.scrollWidth > document.documentElement.clientWidth, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, nLow: low.length, low: low.slice(0, 3), nSmall: small.length, small: small.slice(0, 3), nOut: out.length, out: out.slice(0, 3), nOutY: outY.length, outY: outY.slice(0, 3), nClip: clip.length, clip: clip.slice(0, 3), nTiny: tiny.filter((t) => t[2] < 13).length, nWarn: tiny.length, tiny: [...new Map(tiny.map((t) => [t[0] + '|' + t[2], t])).values()].slice(0, 14), maxGap: maxGap > gapMax ? maxGap : 0, gapAt, room, cta, snapped };
  };
  const setSkin = async (sk, th, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://127.0.0.1:5173/icon.svg');
    await page.evaluate(([a, b]) => { const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}'); s.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, s.profile, { skin: a, theme: b }); localStorage.setItem('cijian.v1', JSON.stringify(s)); }, [sk, th]);
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(340);
  };
  const go = async (kind) => {
    if (kind === 'home') return page.evaluate(() => !!document.querySelector('.start'));
    if (kind === 'cal') return page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('学习日历')); if (b) b.click(); return !!b; });
    if (kind === 'me') return page.evaluate(() => { const b = document.querySelector('.avatar-btn'); if (b) b.click(); return !!b; });
    if (kind === 'mistakes' || kind === 'import' || kind === 'dialog') {
      const label = { mistakes: '错词本', import: '导入词表', dialog: '清空所有学习数据' }[kind];
      return page.evaluate((l) => { const row = [...document.querySelectorAll('.setting-row')].find((r) => (r.querySelector('.setting-row__label') || {}).textContent?.includes(l)); const b = row && row.querySelector('button'); if (b) b.click(); return !!b; }, label);
    }
    if (kind === 'sheet') return page.evaluate(() => { const b = [...document.querySelectorAll('.icon-btn')].find((x) => (x.getAttribute('aria-label') || '').includes('外观')); if (b) b.click(); return !!b; });
    if (kind === 'session') return page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('开始背单词')); if (b) b.click(); return !!b; });
    return false;
  };
  const out = [];
  for (const skin of cfg.skins) {
    for (const theme of cfg.themes) {
      for (const [w, h] of cfg.vps) {
        for (const kind of cfg.screens) {
          await setSkin(skin, theme, w, h);
          let ok = true;
          if (kind === 'mistakes' || kind === 'import' || kind === 'dialog') { await go('me'); await page.waitForTimeout(240); }
          ok = await go(kind);
          await page.waitForTimeout(kind === 'session' ? 420 : 260);
          if (!ok) { out.push({ skin, theme, w, kind, nav: 'FAIL' }); continue; }
          if (kind !== 'sheet' && kind !== 'dialog') {
            await page.evaluate(() => { const m = document.querySelector('.app__main'); if (m) m.scrollTop = 0; });
            await page.waitForTimeout(100);
          }
          const rootSel = kind === 'sheet' ? '.sheet' : kind === 'dialog' ? '.dialog' : null;
          const r = await page.evaluate(PROBE, { rootSel, gapMax: cfg.gapMax });
          const shot = `${cfg.prefix}-${skin}-${kind}-${theme}-${w}.png`;
          if (cfg.shots) await page.screenshot({ path: shot, scale: 'css' });
          out.push({ skin, theme, w, kind, ...r, ...(cfg.shots ? { shot } : {}) });
          if (kind === 'sheet' || kind === 'dialog' || kind === 'import') { await page.keyboard.press('Escape'); await page.waitForTimeout(140); }
          if (kind === 'session') {
            // 学习状态在 cijian.scheduler.v1，不在 cijian.v1 —— 只比后者等于没守
            const snapOf = () => page.evaluate(() => [localStorage.getItem('cijian.v1'), localStorage.getItem('cijian.scheduler.v1')].join('\u0000'));
            const before = await snapOf();
            await page.evaluate(() => { const b = document.querySelector('[aria-label="退出本次学习"], [aria-label="返回首页"]'); if (b) b.click(); });
            await page.waitForTimeout(280);
            out[out.length - 1].dataKept = (await snapOf()) === before;
          }
        }
      }
    }
  }
  const bad = (r) => r.nav === 'FAIL' || r.ovf || r.nLow || r.nSmall || r.nOut || r.nClip || r.nTiny || r.maxGap || (r.cta && !r.cta.ok) || (r.snapped && r.snapped.length) || r.dataKept === false;
  const fails = out.filter(bad);
  return { n: out.length, failCount: fails.length, warnTiny: out.reduce((a, r) => a + (r.nWarn || 0), 0), outYTotal: out.reduce((a, r) => a + (r.nOutY || 0), 0), outYSamples: [...new Set(out.flatMap((r) => r.outY || []).map((x) => x[0] + '@' + x[2]))].slice(0, 12), dataKept: out.filter((r) => r.kind === 'session').every((r) => r.dataKept !== false), fail: fails, pass: out.filter((r) => !bad(r)).map((r) => `${r.skin}/${r.theme}/${r.w}/${r.kind}`) };
}
