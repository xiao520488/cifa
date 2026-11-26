/* 按下态截图（按住不放时截一张）：证明「按下 = 缩小 + 底色变化」在极端皮肤上也成立 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_SCH = 'cijian.scheduler.v1';
  const KEY_PREFS = 'cijian.v1';
  const OUT = 'D:\\背单词\\docs\\screenshots\\motion\\';
  const KNOWN = '.answer-dock--review .answer-btn--known';
  const shots = [];

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

  for (const [skin, theme] of [['paper', 'light'], ['nocturne', 'dark'], ['vinyl', 'light']]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(skin, theme);
    const box = await page.locator(KNOWN).boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(90); // 越过 50ms 按压过渡
    const file = `${OUT}pressed-390-${skin}-${theme}.png`;
    await page.screenshot({ path: file });
    shots.push(file);
    await page.mouse.move(2, 2);
    await page.mouse.up();
    await page.waitForTimeout(260);
  }
  return { shots };
};
