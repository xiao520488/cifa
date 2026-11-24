/**
 * 词库换血后的多视口审查：4 皮肤 × 2 明暗 × 3 视口（360/768/1440）。
 *
 * 用法（配合浏览器 MCP）：
 *   在「学习中」页面上执行 browser_run_code_unsafe({ filename: 'scripts/audit-vocab.js' })
 * 每一项都拿真实 DOM 量：横向溢出、5 词是否全见、对比度、点击目标、截断文本。
 */
async (page) => {
  const SKINS = ['paper', 'foundry', 'instrument', 'broadsheet'];
  const THEMES = ['light', 'dark'];
  const VIEWPORTS = [
    { w: 360, h: 800, label: '360' },
    { w: 768, h: 1024, label: '768' },
    { w: 1440, h: 900, label: '1440' },
  ];

  const report = [];

  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(120);

    for (const skin of SKINS) {
      for (const theme of THEMES) {
        await page.evaluate(
          ([s, t]) => {
            document.documentElement.dataset.skin = s;
            document.documentElement.dataset.theme = t;
          },
          [skin, theme],
        );
        await page.waitForTimeout(60);

        const data = await page.evaluate(() => {
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

          // 对比度：只报低于阈值的
          const low = [];
          const seen = new Set();
          for (const el of document.querySelectorAll('p, span, h1, h2, button, input, label, li')) {
            if (el.closest('[aria-hidden="true"]')) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === 'hidden' || cs.display === 'none' || parseFloat(cs.opacity) === 0) continue;
            const box = el.getBoundingClientRect();
            if (box.width < 2 || box.height < 2) continue;
            if (![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0)) continue;
            let fg = parseColor(cs.color);
            if (!fg) continue;
            const bg = bgOf(el);
            if (fg.a < 1) fg = over(fg, bg);
            const r = ratio(fg, bg);
            const size = parseFloat(cs.fontSize);
            const large = size >= 24 || (size >= 18.66 && parseInt(cs.fontWeight, 10) >= 700);
            const need = large ? 3 : 4.5;
            if (r < need - 0.01) {
              const key = `${cs.color}|${el.className}`;
              if (seen.has(key)) continue;
              seen.add(key);
              low.push({
                text: el.textContent.trim().slice(0, 16),
                size,
                color: cs.color,
                ratio: +r.toFixed(2),
                need,
              });
            }
          }

          // 点击目标 < 44
          const small = [];
          for (const el of document.querySelectorAll('button, [role="button"], input, textarea')) {
            const box = el.getBoundingClientRect();
            const cs = getComputedStyle(el);
            if (box.width === 0 || box.height === 0 || cs.display === 'none' || cs.visibility === 'hidden') continue;
            if (box.width < 44 || box.height < 44) {
              small.push({
                label: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 14),
                w: Math.round(box.width),
                h: Math.round(box.height),
              });
            }
          }

          const rows = [...document.querySelectorAll('.word-row')];
          const dock = document.querySelector('.dock');
          const dockTop = dock ? dock.getBoundingClientRect().top : innerHeight;
          const visible = rows.filter((r) => r.getBoundingClientRect().bottom <= dockTop - 1).length;
          const lastBottom = rows.length ? Math.round(rows[rows.length - 1].getBoundingClientRect().bottom) : 0;

          const clipped = [];
          for (const el of document.querySelectorAll('.word-row__word, .word-row__ph, .meaning, .setting-row__value, .study-bar__title, .study-bar__sub')) {
            if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).overflow !== 'visible') {
              clipped.push(el.textContent.trim().slice(0, 18));
            }
          }

          return {
            rows: rows.length,
            visible,
            lastBottom,
            dockTop: Math.round(dockTop),
            rowHeights: rows.map((r) => Math.round(r.getBoundingClientRect().height)),
            docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            lowContrast: low,
            smallTargets: small,
            clipped,
          };
        });

        report.push({ viewport: vp.label, skin, theme, ...data });
      }
    }
  }

  // 还原成 React 状态里的皮肤（避免后续截图/操作跑偏）
  await page.evaluate(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('cijian.v1') || '{}').profile || {};
      document.documentElement.dataset.skin = profile.skin || 'paper';
      document.documentElement.dataset.theme = profile.theme === 'dark' ? 'dark' : 'light';
    } catch {
      /* 忽略 */
    }
  });
  await page.setViewportSize({ width: 360, height: 800 });

  return report;
}
