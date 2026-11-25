async (page) => {
  await page.goto('http://127.0.0.1:5173/icon.svg');
  const cfg = await page.evaluate(() => ({
    skins: JSON.parse(localStorage.getItem('__audit_skins') || '["desk","deck","vinyl"]'),
    themes: JSON.parse(localStorage.getItem('__audit_themes') || '["light","dark"]'),
    vps: JSON.parse(localStorage.getItem('__audit_vps') || '[[360,780],[1440,900]]'),
  }));
  const out = [];
  for (const skin of cfg.skins) {
    for (const theme of cfg.themes) {
      for (const [w, h] of cfg.vps) {
        await page.setViewportSize({ width: w, height: h });
        await page.goto('http://127.0.0.1:5173/icon.svg');
        await page.evaluate(([sk, th]) => {
          const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
          s.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, s.profile, { skin: sk, theme: th });
          localStorage.setItem('cijian.v1', JSON.stringify(s));
        }, [skin, theme]);
        await page.goto('http://127.0.0.1:5173/');
        await page.waitForTimeout(320);
        await page.screenshot({ path: `v9-${skin}-${theme}-${w}.png`, scale: 'css' });
        const r = await page.evaluate(() => {
          const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
          const ln = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
          const lu = (c) => .2126 * ln(c.r) + .7152 * ln(c.g) + .0722 * ln(c.b);
          const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + .05) / (x[1] + .05); };
          const ovr = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
          const bgo = (e) => { const st = []; let n = e; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; } let base = pc(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = ovr(st[i], base); return base; };
          const seen = new Set(); const low = [];
          for (const e of document.querySelectorAll('p,span,h1,h2,b,button,label,li')) {
            if (e.closest('[aria-hidden="true"]')) continue;
            const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) continue;
            const rr = e.getBoundingClientRect(); if (rr.width < 2 || rr.height < 2) continue;
            if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
            let f = pc(c.color); if (!f) continue; const b = bgo(e); if (f.a < 1) f = ovr(f, b);
            const sz = parseFloat(c.fontSize), big = sz >= 24 || (sz >= 18.66 && +c.fontWeight >= 700), need = big ? 3 : 4.5;
            const k = c.color + '|' + e.className; if (!seen.has(k) && rt(f, b) < need - .01) { seen.add(k); low.push([e.textContent.trim().slice(0, 10), sz, +rt(f, b).toFixed(2), need]); }
          }
          const small = [];
          for (const e of document.querySelectorAll('button,a,input,[role="button"]')) {
            const rr = e.getBoundingClientRect(); const c = getComputedStyle(e);
            if (!rr.width || !rr.height || c.display === 'none' || c.visibility === 'hidden') continue;
            if (rr.width < 44 || rr.height < 44) small.push([(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 10), Math.round(rr.width), Math.round(rr.height)]);
          }
          const d = document.documentElement;
          /* 横滚容器里的子元素天然超出可视宽度（vinyl 的第 4 盘「半切」是有意的可滑暗示），不算出列 */
          const inScroller = (e) => { let n = e.parentElement; while (n && n !== document.body) { const ox = getComputedStyle(n).overflowX; if (ox === 'auto' || ox === 'scroll') return true; n = n.parentElement; } return false; };
          const app = document.querySelector('.app'), ab = app && app.getBoundingClientRect(); let nOut = 0; const outs = [];
          if (ab) for (const e of document.querySelectorAll('.screen *,.topbar *')) { const rr = e.getBoundingClientRect(); if (!rr.width || !rr.height) continue; if (inScroller(e)) continue; if (rr.right > ab.right + 1.5 || rr.left < ab.left - 1.5) { nOut++; if (outs.length < 3) outs.push(String(e.className).slice(0, 20)); } }
          const cta = document.querySelector('.start__actions .btn--primary'), cb = cta && cta.getBoundingClientRect();
          const main = document.querySelector('.app__main');
          const mb = main.getBoundingClientRect();
          /* v9 新增：CTA 必须完整可见（不被 topbar 裁）、版面内部空洞（相邻可见块之间的最大空档）、静止态横向容器被 snap 滚走内衬 */
          const tb = document.querySelector('.topbar').getBoundingClientRect();
          const ctaOk = cb ? (cb.top >= mb.top - 0.5 && cb.bottom <= mb.bottom + 0.5 && cb.top >= tb.bottom - 0.5 && cb.width >= 44 && cb.height >= 44) : false;
          const SEL = '.start > *, .start__body > *, .today-card > *, .today-card__head > *, .today-card__figures > *, .start__spec > *';
          const boxes = [];
          for (const e of document.querySelectorAll(SEL)) {
            const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') continue;
            const r = e.getBoundingClientRect(); if (r.height < 4 || r.width < 4) continue;
            boxes.push({ t: r.top, b: r.bottom, n: String(e.className).slice(0, 18) });
          }
          boxes.sort((p, q) => p.t - q.t);
          let gap = 0, gapAt = '';
          let reach = mb.top;
          for (const x of boxes) { if (x.t > reach + gap) { gap = Math.round(x.t - reach); gapAt = reach + '→' + x.t + ' 前于 ' + x.n; } if (x.b > reach) reach = x.b; }
          const snapped = [];
          for (const e of document.querySelectorAll('.screen *')) {
            const c = getComputedStyle(e);
            if (c.overflowX === 'auto' && e.scrollLeft > 1) snapped.push([String(e.className).slice(0, 22), e.scrollLeft]);
          }
          return {
            id: d.dataset.skin + '/' + d.dataset.theme + '/' + innerWidth,
            ovf: d.scrollWidth > d.clientWidth ? [d.scrollWidth, d.clientWidth] : 0,
            nLow: low.length, low: low.slice(0, 5),
            nSmall: small.length, small: small.slice(0, 4),
            nOut, outs,
            cta: cb ? [Math.round(cb.top), Math.round(cb.height), ctaOk] : 0,
            /* 阈值 140：内容组与页脚之间的分离留白是结构性的（vinyl 三处 1fr 各 ~120），
               单处 >140 才算「版面没落地」（v9 实测的 314px 空洞就是这类）。 */
            gap: gap > 140 ? [gap, gapAt] : 0, snapped,
            scrollRoom: main ? main.scrollHeight - main.clientHeight : 0,
            H: main ? main.scrollHeight : 0, vh: innerHeight,
          };
        });
        out.push(r);
      }
    }
  }
  const bad = out.filter((r) => r.ovf || r.nLow || r.nSmall || r.nOut || !r.cta || r.cta[2] === false || r.gap || (r.snapped && r.snapped.length));
  return {
    combos: out.length,
    ctaVisibleAll: out.every((r) => r.cta && r.cta[2] === true),
    room: out.map((r) => r.id + ':' + r.scrollRoom).join('  '),
    failCount: bad.length,
    fail: bad,
  };
}
