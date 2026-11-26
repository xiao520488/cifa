/*
 * 作答手感 · 交付前三档截图（design-review 用）。
 *   Copy-Item D:\背单词\scripts\audit-motion-shots.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\audit-motion-shots.js D:\背单词\scripts\cfg-motion.json
 * 只截「学习流复习卡」这一屏（本轮改动的唯一界面），并顺带量横向溢出与关键盒尺寸。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_SCH = 'cijian.scheduler.v1';
  const KEY_PREFS = 'cijian.v1';
  const OUT = 'D:\\背单词\\docs\\screenshots\\motion\\';
  const shots = [];
  const probes = [];

  const seed = async (skin, theme) => {
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([ks, kp, skinArg, themeArg]) => {
        const d = new Date();
        if (d.getHours() < 4) d.setDate(d.getDate() - 1);
        const p = (n) => String(n).padStart(2, '0');
        const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        const s = JSON.parse(localStorage.getItem(ks) || '{}');
        const picked = (s.unlearned || []).slice(0, 3);
        const mk = (word) => ({
          word, phase: 'short', interval: 1, due: today, longInterval: null, longAnchor: null,
          reps: 0, lapses: 0, lastRating: null, lastReviewed: null, hard: false, relearned: false,
          inMistakes: false, skippedImmediate: false, learnedOn: today,
        });
        s.cards = {};
        for (const w of picked) s.cards[w] = mk(w);
        delete s.days[today];
        localStorage.setItem(ks, JSON.stringify(s));
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign({ stage: 'cet4', batchSize: 5, theme: 'light', skin: 'paper' }, prefs.profile, { skin: skinArg, theme: themeArg });
        localStorage.setItem(kp, JSON.stringify(prefs));
      },
      [KEY_SCH, KEY_PREFS, skin, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(320);
    await page.getByRole('button', { name: '开始背单词' }).click();
    await page.waitForSelector('.answer-dock--review', { timeout: 8000 });
    await page.waitForTimeout(260);
  };

  const probe = () =>
    page.evaluate(() => {
      const dock = document.querySelector('.answer-dock--review');
      const card = document.querySelector('.flash-card');
      const btns = [...document.querySelectorAll('.answer-btn')];
      return {
        vw: window.innerWidth,
        docScroll: document.documentElement.scrollWidth,
        overflowX: document.documentElement.scrollWidth > window.innerWidth,
        dockBottom: dock ? Math.round(dock.getBoundingClientRect().bottom) : null,
        dockTop: dock ? Math.round(dock.getBoundingClientRect().top) : null,
        cardH: card ? Math.round(card.getBoundingClientRect().height) : null,
        btnHeights: btns.map((b) => Math.round(b.getBoundingClientRect().height)),
        btnMinWidth: Math.min(...btns.map((b) => Math.round(b.getBoundingClientRect().width))),
        docH: document.documentElement.scrollHeight,
      };
    });

  const viewports = [
    { name: '390', w: 390, h: 844 },
    { name: '360', w: 360, h: 800 },
    { name: '768', w: 768, h: 1024 },
    { name: '1440', w: 1440, h: 900 },
  ];

  await seed('paper', 'light');
  for (const vp of viewports) {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await page.waitForTimeout(280);
    const p = await probe();
    probes.push({ vp: vp.name, ...p });
    const file = `${OUT}review-${vp.name}-paper-light.png`;
    await page.screenshot({ path: file });
    shots.push(file);
  }

  // 皮肤变体的静态外观（动效本身已由 computed style 断言，这里只看有没有画坏）
  for (const [skin, theme] of [['vinyl', 'light'], ['bento', 'dark'], ['nocturne', 'dark']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(skin, theme);
    const p = await probe();
    probes.push({ vp: '390', skin, theme, ...p });
    const file = `${OUT}review-390-${skin}-${theme}.png`;
    await page.screenshot({ path: file });
    shots.push(file);
  }

  const bad = probes.filter((p) => p.overflowX || p.btnMinWidth < 44 || p.btnHeights.some((h) => h < 44));
  return { shots, probes, bad };
};
