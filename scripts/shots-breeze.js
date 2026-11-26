/*
 * 第 9 套皮肤「晴空 BREEZE」交付截图 + 版式实测（浅/深 × 首页/学习卡）。
 *   Copy-Item D:\背单词\scripts\shots-breeze.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\shots-breeze.js '{"__shots":"1"}'
 *
 * 产出：out/breeze-{home,card}-{light,dark}-{390,1440}.png（out/ 被 gitignore）。
 * 同时回读关键计算样式（词头字号/字族、释义卡圆角与投影、页面底色），
 * 让「大圆角 / 无边框 / 清透」这些话有实物数字，而不是嘴上说。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_PREFS = 'cijian.v1';
  const KEY_SCH = 'cijian.scheduler.v1';
  const OUT = 'D:\\背单词\\out\\';
  const shots = [];

  const seedHome = async (theme) => {
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([kp, themeArg]) => {
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign(
          { name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' },
          prefs.profile,
          { skin: 'breeze', theme: themeArg },
        );
        localStorage.setItem(kp, JSON.stringify(prefs));
      },
      [KEY_PREFS, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.start', { timeout: 8000 });
    await page.waitForTimeout(260);
  };

  /** 造 3 张今日到期卡 → 首页点开始 → 落在复习三键的学习卡 */
  const seedDueCard = async (theme) => {
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([ks, kp, themeArg]) => {
        const d = new Date();
        if (d.getHours() < 4) d.setDate(d.getDate() - 1);
        const p = (n) => String(n).padStart(2, '0');
        const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        const s = JSON.parse(localStorage.getItem(ks) || '{}');
        const picked = (s.unlearned || []).slice(0, 3);
        if (picked.length < 3) throw new Error('未学池不足 3 个词');
        s.cards = {};
        for (const word of picked) {
          s.cards[word] = {
            word,
            phase: 'short',
            interval: 1,
            due: today,
            longInterval: null,
            longAnchor: null,
            reps: 0,
            lapses: 0,
            lastRating: null,
            lastReviewed: null,
            hard: false,
            relearned: false,
            inMistakes: false,
            skippedImmediate: false,
            learnedOn: today,
          };
        }
        delete s.days[today];
        localStorage.setItem(ks, JSON.stringify(s));
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign(
          { name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' },
          prefs.profile,
          { skin: 'breeze', theme: themeArg },
        );
        localStorage.setItem(kp, JSON.stringify(prefs));
      },
      [KEY_SCH, KEY_PREFS, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(280);
    await page.getByRole('button', { name: '开始背单词' }).click();
    await page.waitForSelector('.answer-dock--review', { timeout: 8000 });
    await page.waitForTimeout(200);
  };

  const cardStyles = () =>
    page.evaluate(() => {
      const pick = (sel, props) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const c = getComputedStyle(el);
        const out = {};
        for (const p of props) out[p] = c[p];
        return out;
      };
      return {
        bg: getComputedStyle(document.querySelector('.app')).backgroundColor,
        word: pick('.flash-card__word', ['fontFamily', 'fontSize', 'fontWeight', 'letterSpacing', 'color']),
        phon: pick('.flash-card__ph', ['fontSize', 'color', 'backgroundColor', 'borderRadius']),
        meaningCard: pick('.meaning', [
          'backgroundColor',
          'borderRadius',
          'padding',
          'fontSize',
          'lineHeight',
          'color',
          'boxShadow',
        ]),
        answerKnown: pick('.answer-btn--known', ['backgroundColor', 'color', 'borderRadius', 'borderTopWidth', 'minHeight']),
        answerFuzzy: pick('.answer-btn--fuzzy', ['backgroundColor', 'color', 'borderWidth']),
        answerUnknown: pick('.answer-btn--unknown', ['backgroundColor', 'color', 'borderWidth']),
        dockBorder: pick('.answer-dock', ['borderTopWidth', 'boxShadow', 'backgroundColor']),
      };
    });

  const homeStyles = () =>
    page.evaluate(() => {
      const pick = (sel, props) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const c = getComputedStyle(el);
        const out = {};
        for (const p of props) out[p] = c[p];
        return out;
      };
      const t = document.querySelector('.today-card');
      return {
        bg: getComputedStyle(document.querySelector('.app')).backgroundColor,
        topbarBorder: pick('.topbar', ['borderBottomWidth', 'backgroundColor']),
        eyebrow: pick('.start__eyebrow', ['backgroundColor', 'color', 'borderRadius', 'fontSize']),
        cta: pick('.btn--primary', ['backgroundColor', 'color', 'borderRadius', 'boxShadow']),
        today: t
          ? {
              borderRadius: getComputedStyle(t).borderRadius,
              borderWidth: getComputedStyle(t).borderTopWidth,
              boxShadow: getComputedStyle(t).boxShadow,
              bg: getComputedStyle(t).backgroundColor,
            }
          : null,
        figureNum: pick('.today-card__figure b', ['fontFamily', 'fontSize', 'fontWeight']),
        footSize: pick('.start__foot', ['fontSize']),
      };
    });

  const result = { shots, home: {}, card: {} };

  /* 词表（新词列表）：没有到期卡时点「开始背单词」直接落到 .word-list */
  const seedList = async (theme) => {
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(
      ([ks, kp, themeArg]) => {
        const s = JSON.parse(localStorage.getItem(ks) || '{}');
        s.cards = {};
        const p = (n) => String(n).padStart(2, '0');
        const d = new Date();
        if (d.getHours() < 4) d.setDate(d.getDate() - 1);
        delete s.days[`${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`];
        localStorage.setItem(ks, JSON.stringify(s));
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign(
          { name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' },
          prefs.profile,
          { skin: 'breeze', theme: themeArg },
        );
        localStorage.setItem(kp, JSON.stringify(prefs));
      },
      [KEY_SCH, KEY_PREFS, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(280);
    await page.getByRole('button', { name: '开始背单词' }).click();
    await page.waitForSelector('.word-list', { timeout: 8000 });
    await page.waitForTimeout(240);
  };

  await page.setViewportSize({ width: 390, height: 844 });
  await seedList('light');
  const listFile = `${OUT}breeze-list-light-390.png`;
  await page.screenshot({ path: listFile, scale: 'css' });
  shots.push(listFile);

  for (const theme of ['light', 'dark']) {
    for (const [w, h] of [
      [390, 844],
      [1440, 900],
    ]) {
      await page.setViewportSize({ width: w, height: h });
      await seedHome(theme);
      const file = `${OUT}breeze-home-${theme}-${w}.png`;
      await page.screenshot({ path: file, scale: 'css' });
      shots.push(file);
      if (w === 390) result.home[theme] = await homeStyles();
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await seedDueCard(theme);

    /* 默认是遮罩态（未揭示）：浅色档留一张，证明灰条不是灰字 */
    if (theme === 'light') {
      const f = `${OUT}breeze-card-masked-${theme}-390.png`;
      await page.screenshot({ path: f, scale: 'css' });
      shots.push(f);
    }

    /* 揭示后才是给人看的正文 */
    await page.evaluate(() => document.querySelector('.flash-card__reveal')?.click());
    await page.waitForTimeout(260);
    const file = `${OUT}breeze-card-${theme}-390.png`;
    await page.screenshot({ path: file, scale: 'css' });
    shots.push(file);
    result.card[theme] = await cardStyles();
  }

  return result;
}
