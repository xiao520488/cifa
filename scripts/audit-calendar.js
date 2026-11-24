/**
 * 日历页多视口审查（v1.2 信息层级修复）：4 皮肤 × 2 明暗 × 3 视口 = 24 组，全部量真实 DOM。
 *
 * 用法：灌好 fixture、进到日历页后
 *   browser_run_code_unsafe({ filename: '<本文件的绝对路径>' })
 * 一次跑 24 组会顶破 MCP 的 30s 超时，所以用 `localStorage['__audit_vp']` 指定单档（'360'|'768'|'1440'）。
 * 检查项：横向溢出 / 负荷行槽位顺序与 tone / 裸分数 `0 / 20` 是否绝迹 / 胶囊与短句被裁 /
 *        文字对比度（WCAG AA）/ 问号热区 44×44 / 气泡出界与 Esc 关闭。
 */
async (page) => {
  const SKINS = ['paper', 'foundry', 'instrument', 'broadsheet'];
  const THEMES = ['light', 'dark'];
  const ALL = [{ w: 360, h: 800, l: '360' }, { w: 768, h: 1024, l: '768' }, { w: 1440, h: 900, l: '1440' }];
  const pick = await page.evaluate(() => localStorage.getItem('__audit_vp') || '');
  const out = [];
  for (const vp of ALL.filter((v) => !pick || v.l === pick)) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    for (const skin of SKINS) {
      for (const theme of THEMES) {
        await page.evaluate(([s, t]) => { document.documentElement.dataset.skin = s; document.documentElement.dataset.theme = t; }, [skin, theme]);
        await page.evaluate(() => document.querySelector('.cal-section__head h2')?.scrollIntoView({ block: 'start' }));
        await page.waitForTimeout(70);
        const d = await page.evaluate(() => {
          const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
          const ln = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          const lm = (c) => 0.2126 * ln(c.r) + 0.7152 * ln(c.g) + 0.0722 * ln(c.b);
          const rt = (a, b) => { const x = [lm(a), lm(b)].sort((p, q) => q - p); return (x[0] + 0.05) / (x[1] + 0.05); };
          const ov = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
          const bgOf = (el) => { const st = []; let n = el; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = ov(st[i], base); return base; };
          const low = [], seen = new Set();
          for (const el of document.querySelectorAll('.cal p, .cal span, .cal h1, .cal h2, .cal b, .cal li, .cal dt, .cal dd')) {
            if (el.closest('[aria-hidden="true"]')) continue;
            const cs = getComputedStyle(el);
            if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
            const bx = el.getBoundingClientRect();
            if (bx.width < 2 || bx.height < 2) continue;
            if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            let fg = pc(cs.color); if (!fg) continue;
            const bg = bgOf(el); if (fg.a < 1) fg = ov(fg, bg);
            const size = parseFloat(cs.fontSize);
            const need = size >= 24 || (size >= 18.66 && +cs.fontWeight >= 700) ? 3 : 4.5;
            const r = rt(fg, bg);
            if (r < need - 0.01) { const k = cs.color + '|' + el.className; if (seen.has(k)) continue; seen.add(k); low.push({ t: el.textContent.trim().slice(0, 14), size, c: cs.color, r: +r.toFixed(2), need }); }
          }
          const bad = [], tones = [], clipped = [];
          const cells = [...document.querySelectorAll('.cal-day')];
          for (const cell of cells) {
            const slots = [...cell.querySelectorAll('.cal-load')];
            const first = slots[0];
            const tone = first ? first.className.replace('cal-load cal-load--', '') : null;
            tones.push(tone);
            const date = cell.querySelector('.cal-day__date')?.textContent ?? '?';
            if (!first || !first.textContent.includes('复习')) bad.push(date + ' 首槽不是复习');
            if (slots.length < 2) bad.push(date + ' 槽位<2');
            if (cell.querySelector('.cal-day__count')) bad.push(date + ' 残留裸分数');
            if (!['primary', 'quiet'].includes(tone)) bad.push(date + ' tone=' + tone);
          }
          for (const el of document.querySelectorAll('.cal-load, .cal-batch, .cal-day__empty, .cal-day__reason')) {
            if (el.scrollWidth > el.clientWidth + 1) clipped.push(el.textContent.trim().slice(0, 16) + ` ${el.scrollWidth}>${el.clientWidth}`);
          }
          const btn = document.querySelector('.cal-section__head .hint__btn');
          let hit = null;
          if (btn) { const b = btn.getBoundingClientRect(); const m = parseFloat(getComputedStyle(btn, '::after').inset); hit = { w: Math.round(b.width - 2 * m), h: Math.round(b.height - 2 * m), paint: Math.round(b.width) + 'x' + Math.round(b.height) }; }
          return { ovX: document.documentElement.scrollWidth - document.documentElement.clientWidth, cells: cells.length, tones, bad, clipped, low, hit };
        });
        let pop = null;
        if (d.hit) {
          await page.click('.cal-section__head .hint__btn');
          await page.waitForTimeout(120);
          pop = await page.evaluate(() => { const e = document.querySelector('.hint__pop'); if (!e) return { missing: true }; const b = e.getBoundingClientRect(); return { outX: b.left < 4 || b.right > innerWidth - 4, outY: b.bottom > innerHeight - 4 }; });
          await page.keyboard.press('Escape');
          await page.waitForTimeout(60);
          pop.esc = await page.evaluate(() => !document.querySelector('.hint__pop'));
        }
        out.push({ vp: vp.l, skin, theme, ...d, pop });
      }
    }
  }
  await page.evaluate(() => { const p = JSON.parse(localStorage.getItem('cijian.v1') || '{}').profile || {}; document.documentElement.dataset.skin = p.skin || 'paper'; document.documentElement.dataset.theme = p.theme === 'dark' ? 'dark' : 'light'; });
  return out.map((g) => ({
    vp: g.vp,
    skin: g.skin,
    theme: g.theme,
    ovX: g.ovX,
    tones: g.tones.map((t) => (t === 'primary' ? 'P' : t === 'quiet' ? 'q' : '?')).join(''),
    bad: g.bad.length ? g.bad : '-',
    clipped: g.clipped.length ? g.clipped : '-',
    low: g.low.length ? g.low : '-',
    hit: g.hit && `${g.hit.w}x${g.hit.h}`,
    pop: g.pop,
  }));
}
