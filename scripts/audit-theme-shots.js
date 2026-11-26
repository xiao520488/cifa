/*
 * v2 主题 / 皮肤切换过渡 · 交付截图 + 中间态记录（MOTION_SPEC §13.8 commit 2 的实物证据）。
 *   Copy-Item D:\背单词\scripts\audit-theme-shots.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\audit-theme-shots.js D:\背单词\scripts\cfg-motion.json
 *
 * 16 组（8 皮肤 × 明暗各切一次，切的方向相反：深→浅 / 浅→深）× 3 帧 = 48 张，390 档。
 * 一次切换只截一张：类在 240ms 被摘掉，连截三张必然把后两张挤出去（与转场截图同一条理由）。
 *
 * 中间态对比度：**只记录不设阈值**（§13.4）。两色混合的中途必然低于终值，
 * 卡一个阈值只会逼出假阳性；这里给的是「文本色 vs 逐层合成后的真实底色」，
 * 合成方式与 audit-motion.js 的按压对比度探针一致（半透明层逐层叠加）。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_PREFS = 'cijian.v1';
  const OUT = 'D:\\背单词\\docs\\screenshots\\motion\\v2-theme\\';
  const shots = [];
  const rows = [];
  const fails = [];

  const gotoScreen = async (skin, theme) => {
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([kp, skinArg, themeArg]) => {
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign(
          { stage: 'cet4', batchSize: 5, theme: 'light', skin: 'paper' },
          prefs.profile,
          { skin: skinArg, theme: themeArg },
        );
        localStorage.setItem(kp, JSON.stringify(prefs));
      },
      [KEY_PREFS, skin, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.start', { timeout: 8000 });
    await page.waitForTimeout(200);
  };

  /** 当前帧：类、.app 底色、一段正文的颜色与逐层合成后的底色（含对比度） */
  const frame = () =>
    page.evaluate(() => {
      const parse = (s) => {
        const rgb = s.match(/^rgba?\(([^)]+)\)/);
        if (rgb) {
          const p = rgb[1].split(',').map((x) => Number(x.trim()));
          return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
        }
        const srgb = s.match(/^color\(srgb ([^)]+)\)/);
        if (srgb) {
          const [body, alpha] = srgb[1].split('/');
          const p = body.trim().split(/\s+/).map(Number);
          return {
            r: p[0] * 255,
            g: p[1] * 255,
            b: p[2] * 255,
            a: alpha === undefined ? 1 : Number(alpha.trim()),
          };
        }
        return null;
      };
      const lum = (r, g, b) => {
        const f = (v) => {
          const x = v / 255;
          return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
      };
      const app = document.querySelector('.app');
      const txt =
        document.querySelector('.start__meta') ||
        document.querySelector('.start__eyebrow') ||
        document.querySelector('.topbar__title') ||
        app;
      const fg = parse(getComputedStyle(txt).color);
      const layers = [];
      for (let n = txt; n; n = n.parentElement) {
        const c = parse(getComputedStyle(n).backgroundColor);
        if (c && c.a > 0) {
          layers.push(c);
          if (c.a >= 1) break;
        }
      }
      let r = 255;
      let g = 255;
      let b = 255;
      for (let i = layers.length - 1; i >= 0; i -= 1) {
        const l = layers[i];
        r = l.r * l.a + r * (1 - l.a);
        g = l.g * l.a + g * (1 - l.a);
        b = l.b * l.a + b * (1 - l.a);
      }
      const l1 = lum(fg.r, fg.g, fg.b);
      const l2 = lum(r, g, b);
      return {
        cls: document.documentElement.classList.contains('is-theme-switching'),
        appBg: getComputedStyle(app).backgroundColor,
        textCls: String(txt.className || txt.tagName).slice(0, 24),
        fg: getComputedStyle(txt).color,
        bg: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100,
      };
    });

  const skins = ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'vinyl', 'desk'];
  const passes = [
    { tag: '1', label: '起手', delay: 0, wantCls: true },
    { tag: '2', label: '中段', delay: 70, wantCls: true },
    { tag: '3', label: '落定', delay: 420, wantCls: false },
  ];

  for (const skin of skins) {
    for (const theme of ['light', 'dark']) {
      const from = theme === 'dark' ? 'light' : 'dark';
      const toLabel = theme === 'dark' ? '深色' : '浅色';
      for (const pass of passes) {
        await gotoScreen(skin, from);
        await page.evaluate(() =>
          document.querySelector('.icon-btn[aria-label="切换外观风格"]').click(),
        );
        await page.waitForSelector('.segmented[aria-label="明暗"]', { timeout: 4000 });
        await page.waitForTimeout(420); // 面板入场动画结束再切，否则长任务会把过渡起点推后
        await page.evaluate(
          (label) => document.querySelector(`button[aria-label="${label}"]`).click(),
          toLabel,
        );
        if (pass.delay) await page.waitForTimeout(pass.delay);
        const f = await frame();
        const file = `${OUT}theme-390-${skin}-${from}-to-${theme}-${pass.tag}.png`;
        await page.screenshot({ path: file });
        shots.push(file);
        rows.push({ skin, from, to: theme, pass: pass.label, ...f });
        if (pass.wantCls && !f.cls) fails.push(`${skin}/${from}→${theme}/${pass.label}：过渡类已不在`);
        if (!pass.wantCls && f.cls) fails.push(`${skin}/${from}→${theme}/${pass.label}：420ms 后类还在`);
      }
    }
  }

  return { shots: shots.length, rows, fails };
};
