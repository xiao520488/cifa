async (page) => await page.evaluate(() => {
  const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const ln = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
  const lu = (c) => .2126 * ln(c.r) + .7152 * ln(c.g) + .0722 * ln(c.b);
  const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + .05) / (x[1] + .05); };
  const ov = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
  const bg = (e) => { const st = []; let n = e; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; } let base = pc(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = ov(st[i], base); return base; };
  const seen = new Set(); const low = [];
  for (const e of document.querySelectorAll('p,span,h1,h2,b,button,label,li')) {
    if (e.closest('[aria-hidden="true"]')) continue;
    const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) continue;
    const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue;
    if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
    let f = pc(c.color); if (!f) continue; const b = bg(e); if (f.a < 1) f = ov(f, b);
    const sz = parseFloat(c.fontSize), big = sz >= 24 || (sz >= 18.66 && +c.fontWeight >= 700), need = big ? 3 : 4.5;
    const k = c.color + '|' + e.className; if (!seen.has(k) && rt(f, b) < need - .01) { seen.add(k); low.push([e.textContent.trim().slice(0, 12), sz, +rt(f, b).toFixed(2), need]); }
  }
  const small = [];
  for (const e of document.querySelectorAll('button,a,input,[role="button"]')) {
    const r = e.getBoundingClientRect(); const c = getComputedStyle(e);
    if (!r.width || !r.height || c.display === 'none' || c.visibility === 'hidden') continue;
    if (r.width < 44 || r.height < 44) small.push([(e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 10), Math.round(r.width), Math.round(r.height)]);
  }
  const tiny = [];
  for (const e of document.querySelectorAll('p,span,b,li')) { const c = getComputedStyle(e); if (c.display === 'none') continue; const sz = parseFloat(c.fontSize); const t = e.textContent.trim(); if (sz < 13 && /[\u4e00-\u9fa5]/.test(t) && t.length > 4) tiny.push([t.slice(0, 10), sz]); }
  const app = document.querySelector('.app'), ab = app && app.getBoundingClientRect(); const out = [];
  if (ab) for (const e of document.querySelectorAll('.screen *,.topbar *')) { const r = e.getBoundingClientRect(); if (!r.width || !r.height) continue; if (r.right > ab.right + 1.5 || r.left < ab.left - 1.5) out.push([String(e.className).slice(0, 22), Math.round(r.left), Math.round(r.right)]); }
  const d = document.documentElement, cta = document.querySelector('.start__actions .btn--primary'), cb = cta && cta.getBoundingClientRect();
  return { skin: d.dataset.skin, theme: d.dataset.theme, vp: innerWidth + 'x' + innerHeight, ovf: d.scrollWidth > d.clientWidth ? [d.scrollWidth, d.clientWidth] : 0, low: low.slice(0, 6), nLow: low.length, small: small.slice(0, 6), nSmall: small.length, tiny: tiny.length, out: out.slice(0, 5), nOut: out.length, cta: cb ? [Math.round(cb.top), Math.round(cb.height), cb.top < innerHeight] : 0, H: document.querySelector('.app__main')?.scrollHeight }
})
