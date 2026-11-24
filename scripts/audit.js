async (page) => {
  return await page.evaluate(() => {
    const parseColor = (s) => {
      const m = s.match(/rgba?\(([^)]+)\)/);
      if (!m) return null;
      const p = m[1].split(',').map((v) => parseFloat(v));
      return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    };
    const lin = (v) => {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
    const ratio = (a, b) => {
      const xs = [lum(a), lum(b)].sort((x, y) => y - x);
      return (xs[0] + 0.05) / (xs[1] + 0.05);
    };
    const over = (fg, bg) => ({
      r: fg.r * fg.a + bg.r * (1 - fg.a),
      g: fg.g * fg.a + bg.g * (1 - fg.a),
      b: fg.b * fg.a + bg.b * (1 - fg.a),
      a: 1,
    });
    const bgOf = (el) => {
      const stack = [];
      let node = el;
      while (node) {
        const c = parseColor(getComputedStyle(node).backgroundColor);
        if (c && c.a > 0) {
          stack.push(c);
          if (c.a >= 1) break;
        }
        node = node.parentElement;
      }
      let base = { r: 255, g: 255, b: 255, a: 1 };
      for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
      return base;
    };
    const seen = new Set();
    const low = [];
    for (const el of document.querySelectorAll('p, span, h1, h2, button, input, label, li, textarea')) {
      if (el.closest('[aria-hidden="true"]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
      const b = el.getBoundingClientRect();
      if (b.width < 2 || b.height < 2) continue;
      if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)) continue;
      let fg = parseColor(cs.color);
      if (!fg) continue;
      const bg = bgOf(el);
      if (fg.a < 1) fg = over(fg, bg);
      const r = ratio(fg, bg);
      const size = parseFloat(cs.fontSize);
      const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight) >= 700);
      const need = large ? 3 : 4.5;
      if (r < need - 0.01) {
        const key = cs.color + '|' + el.className;
        if (seen.has(key)) continue;
        seen.add(key);
        low.push({
          text: el.textContent.trim().slice(0, 20),
          size,
          weight: cs.fontWeight,
          color: cs.color,
          bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})`,
          ratio: +r.toFixed(2),
          need,
        });
      }
    }
    const small = [];
    for (const el of document.querySelectorAll('button, a, input, textarea, [role="button"]')) {
      const b = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      if (b.width === 0 || b.height === 0 || cs.visibility === 'hidden' || cs.display === 'none') continue;
      if (b.width < 44 || b.height < 44)
        small.push({
          label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 18),
          w: +b.width.toFixed(1),
          h: +b.height.toFixed(1),
          cls: String(el.className).slice(0, 40),
        });
    }
    const doc = document.documentElement;
    const main = document.querySelector('.app__main');
    const clipped = [];
    for (const el of document.querySelectorAll('.word-row__word, .word-row__ph, .meaning, .stage-option__short')) {
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible')
        clipped.push(el.textContent.trim().slice(0, 20));
    }
    return {
      docOverflow: doc.scrollWidth > doc.clientWidth,
      docW: doc.scrollWidth,
      clientW: doc.clientWidth,
      mainOverflow: main ? main.scrollWidth > main.clientWidth : null,
      lowContrast: low,
      smallTargets: small,
      clipped,
      theme: document.documentElement.dataset.theme,
    };
  });
}
