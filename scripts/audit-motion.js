/*
 * 作答手感实测（docs/MOTION_SPEC.md §8）。
 *
 * 跑法（必须先复制到 playwright-mcp 目录，那里才有 node_modules/playwright）：
 *   Copy-Item D:\背单词\scripts\audit-motion.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\audit-motion.js D:\背单词\scripts\cfg-motion.json
 *
 * 口径：
 *   - runner 给的是**全新隔离 context**，localStorage 为空，应用自行 seed；本脚本只在隔离
 *     context 里造 2 张卡，跑完整个 context 丢弃 —— 不碰任何真实档案。
 *   - 按压必须用真鼠标（page.mouse）：合成 PointerEvent 不会触发 CSS :active。
 *     按下后把指针移出再松开，这样不会额外触发一次作答。
 *   - 首帧不可信：无头 Chromium 里第一次 mouse.down 的 :active 可能晚十几毫秒才落地，
 *     所以按压用轮询采样（20ms 一次）而不是单点断言；toast 同理（取整段曲线）。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_SCH = 'cijian.scheduler.v1';
  const KEY_PREFS = 'cijian.v1';
  const KNOWN = '.answer-dock--review .answer-btn--known';
  const UNKNOWN = '.answer-dock--review .answer-btn--unknown';
  const fails = [];
  const fail = (name, detail) =>
    fails.push(detail === undefined ? name : `${name} :: ${JSON.stringify(detail)}`);

  const skinRows = [];
  const notes = {};

  const scaleOf = (tf) => {
    if (!tf || tf === 'none') return 1;
    const m = tf.match(/matrix\(([^)]+)\)/);
    return m ? Number(m[1].split(',')[0]) : NaN;
  };
  const txOf = (tf) => {
    if (!tf || tf === 'none') return 0;
    const m = tf.match(/matrix\(([^)]+)\)/);
    return m ? Number(m[1].split(',')[4]) : NaN;
  };

  /** 造 3 张今天到期的卡；already=true 时三张都带 lastReviewed=today（作答必被拒 → toast） */
  const seed = async (opts) => {
    const { skin = 'paper', already = false, theme = 'light' } = opts || {};
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    const info = await page.evaluate(
      ([ks, kp, skinArg, alreadyArg, themeArg]) => {
        const d = new Date();
        if (d.getHours() < 4) d.setDate(d.getDate() - 1);
        const p = (n) => String(n).padStart(2, '0');
        const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
        const s = JSON.parse(localStorage.getItem(ks) || '{}');
        const pool = s.unlearned || [];
        const picked = pool.slice(0, 3);
        if (picked.length < 3) throw new Error('未学池不足 3 个词');
        const mk = (word, lastReviewed) => ({
          word,
          phase: 'short',
          interval: 1,
          due: today,
          longInterval: null,
          longAnchor: null,
          reps: 0,
          lapses: 0,
          lastRating: null,
          lastReviewed,
          hard: false,
          relearned: false,
          inMistakes: false,
          skippedImmediate: false,
          learnedOn: today,
        });
        // 必须整表重建：上一轮留下的、同样 due=today 的卡会排在前面，队列就不是这几张了
        s.cards = {};
        // already=true：三张都标「今天已答过」——点哪一张都会被拒 -> 必有 toast，
        // 且队列里还剩两张，会话不会结束（结束分支不渲染 toast）。
        for (let i = 0; i < 3; i += 1) {
          s.cards[picked[i]] = mk(picked[i], alreadyArg ? today : null);
        }
        // warm-up 已给今天拍过空快照：不删则注入的卡进不了 dueSnapshot
        delete s.days[today];
        localStorage.setItem(ks, JSON.stringify(s));
        const prefs = JSON.parse(localStorage.getItem(kp) || '{}');
        prefs.profile = Object.assign(
          { stage: 'cet4', batchSize: 5, theme: 'light', skin: 'paper' },
          prefs.profile,
          { skin: skinArg, theme: themeArg },
        );
        localStorage.setItem(kp, JSON.stringify(prefs));
        return { words: picked, today };
      },
      [KEY_SCH, KEY_PREFS, skin, already, theme],
    );
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: '开始背单词' }).click();
    await page.waitForSelector('.answer-dock--review', { timeout: 8000 });
    await page.waitForTimeout(150);
    return info;
  };

  const wordOf = () =>
    page.evaluate(() => document.querySelector('.flash-card__word')?.textContent?.trim() ?? null);

  const cardState = () =>
    page.evaluate(() => {
      const card = document.querySelector('.flash-card');
      const word = document.querySelector('.flash-card__word');
      const masked = document.querySelector('.flash-card__meanings .masked');
      const r = card ? card.getBoundingClientRect() : null;
      return {
        cls: card ? card.className : null,
        anim: card ? getComputedStyle(card).animationName : null,
        tf: card ? getComputedStyle(card).transform : null,
        wordAnim: word ? getComputedStyle(word).animationName : null,
        word: word ? word.textContent.trim() : null,
        masked: masked ? getComputedStyle(masked).color : null,
        w: r ? Math.round(r.width * 10) / 10 : null,
        h: r ? Math.round(r.height * 10) / 10 : null,
      };
    });

  const btnState = (sel) =>
    page.evaluate((s) => {
      const b = document.querySelector(s);
      if (!b) return null;
      const cs = getComputedStyle(b);
      return { transform: cs.transform, duration: cs.transitionDuration, bg: cs.backgroundColor };
    }, sel);

  /** 按住，轮询到「连续两帧同值且已缩下去」才算稳定；再移出松开，等回弹结束 */
  const press = async (sel) => {
    const box = await page.locator(sel).boundingBox();
    if (!box) throw new Error('找不到按钮：' + sel);
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const t0 = Date.now();
    let pressed = null;
    let msDown = null;
    let prev = null;
    const trace = [];
    for (let i = 0; i < 25; i += 1) {
      const s = await btnState(sel);
      trace.push(s.transform);
      if (prev !== null && s.transform === prev && scaleOf(s.transform) < 0.995) {
        pressed = s;
        msDown = Date.now() - t0;
        break;
      }
      prev = s.transform;
      await page.waitForTimeout(16);
    }
    await page.mouse.move(2, 2); // 移出再松开：只测按压，不额外作答
    await page.mouse.up();
    await page.waitForTimeout(260);
    const up = await btnState(sel);
    return { pressed, up, msDown, trace };
  };

  /* ---------------- 1. 8 套皮肤：按压统一 + 答对变体 ---------------- */

  // cfg 里可以只跑某几套皮肤（改一套皮肤的 CSS 时省一轮全矩阵）：
  //   {"__audit_motion_skins":"[\"foundry\"]"}
  const only = await page.evaluate(() => {
    const raw = localStorage.getItem('__audit_motion_skins');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const skins =
    Array.isArray(only) && only.length > 0
      ? only
      : ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'vinyl', 'desk'];
  const expectKnown = {
    paper: 'ack-lift',
    foundry: 'ack-lift',
    instrument: 'ack-lift',
    broadsheet: 'ack-lift',
    bento: 'bt-ack-press',
    nocturne: 'none', // 卡片不动，词头闪墨
    vinyl: 'vy-ack-tilt',
    desk: 'ack-lift',
  };

  for (const skin of skins) {
    await seed({ skin });
    const p = await press(KNOWN);
    if (!p.pressed || !p.up) {
      fail(`[${skin}] 按下没有缩下去`, p.trace);
      continue;
    }
    if (Math.abs(scaleOf(p.pressed.transform) - 0.97) > 0.002) {
      fail(`[${skin}] 按下不是 scale(0.97)`, p.pressed.transform);
    }
    if (!p.pressed.duration.includes('0.05s')) fail(`[${skin}] 按下不是 50ms`, p.pressed.duration);
    if (p.up.transform !== 'none') fail(`[${skin}] 松开 260ms 后没归位`, p.up.transform);
    if (!p.up.duration.includes('0.18s')) fail(`[${skin}] 松开不是 180ms`, p.up.duration);

    const w0 = await wordOf();
    await page.click(KNOWN);
    await page.waitForTimeout(60);
    const during = await cardState();
    await page.waitForTimeout(240);
    const after = await cardState();

    if (!during.cls.includes('is-ack-known')) fail(`[${skin}] 作答后没挂 is-ack-known`, during.cls);
    if (during.anim !== expectKnown[skin]) {
      fail(`[${skin}] 答对动画应为 ${expectKnown[skin]}`, during.anim);
    }
    if (skin === 'nocturne' && during.wordAnim !== 'nc-ack-ink') {
      fail('[nocturne] 词头没闪墨色', during.wordAnim);
    }
    if (after.cls.includes('is-ack-')) fail(`[${skin}] 反馈类没摘掉`, after.cls);
    if (after.word === w0) fail(`[${skin}] 反馈结束后没换卡`, { before: w0, after: after.word });

    skinRows.push({
      skin,
      msDown: p.msDown,
      pressed: p.pressed,
      up: p.up,
      anim: during.anim,
      wordAnim: during.wordAnim,
      after: { cls: after.cls, word: after.word },
    });
  }

  /* ---------------- 2. 答错抖动 + 遮罩不泄露 + 布局不跳 ---------------- */

  await seed({ skin: 'paper' });
  const before = await cardState();
  await page.click(UNKNOWN);
  await page.waitForTimeout(70);
  const shakeA = await cardState();
  await page.waitForTimeout(40); // ≈110ms：抖动中段，方向应已反转
  const shakeB = await cardState();
  await page.waitForTimeout(170);
  const shakeEnd = await cardState();

  if (!(Math.abs(txOf(shakeA.tf)) > 1)) fail('答错 70ms 时卡片没有水平位移', shakeA.tf);
  if (txOf(shakeB.tf) !== 0 && Math.sign(txOf(shakeA.tf)) === Math.sign(txOf(shakeB.tf))) {
    fail('抖动的两个采样点方向相同（没有来回）', { a: shakeA.tf, b: shakeB.tf });
  }
  if (shakeEnd.tf !== 'none') fail('抖动结束后 transform 未归零', shakeEnd.tf);
  if (shakeA.masked !== 'rgba(0, 0, 0, 0)') fail('反馈窗口内遮罩释义泄露', shakeA.masked);
  if (before.w !== shakeA.w || before.h !== shakeA.h) {
    fail('反馈改变了卡片盒尺寸（布局跳了）', {
      before: [before.w, before.h],
      during: [shakeA.w, shakeA.h],
    });
  }
  notes.shake = { a: shakeA.tf, b: shakeB.tf, end: shakeEnd.tf, masked: shakeA.masked };

  /* ---------------- 3. toast：上移 12px 淡入 / 停留 2.5s / 淡出无位移 ---------------- */

  await seed({ skin: 'paper', already: true });
  await page.click(KNOWN); // 三张都已答过：必被拒 → toast，且会话继续（还剩两张）

  const t0 = Date.now();
  const samples = [];
  while (Date.now() - t0 < 3400) {
    const s = await page.evaluate(() => {
      const t = document.querySelector('.session-toast');
      if (!t) return null;
      const cs = getComputedStyle(t);
      return {
        o: Number(cs.opacity),
        tf: cs.transform,
        leaving: t.classList.contains('is-leaving'),
        text: t.textContent.trim(),
      };
    });
    samples.push({ at: Date.now() - t0, s });
    await page.waitForTimeout(40);
  }
  const seenT = samples.filter((x) => x.s);
  const fadeIn = seenT.some((x) => x.s.o > 0.02 && x.s.o < 0.98);
  const movedIn = seenT.some((x) => x.s.tf !== 'none');
  const settled = seenT.find((x) => x.at >= 260 && x.at <= 500);
  const hold = seenT.filter((x) => x.s.o === 1).pop();
  const lastSeen = seenT[seenT.length - 1];
  const goneAfter = samples[samples.length - 1].s === null;

  if (seenT.length === 0) {
    const dump = await page.evaluate(() => ({
      text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 260),
      btns: document.querySelectorAll('.answer-btn').length,
      dock: !!document.querySelector('.answer-dock--review'),
      cls: document.querySelector('.flash-card') ? document.querySelector('.flash-card').className : null,
    }));
    fail('答「今天已答过」时没出现 toast', dump);
  }
  if (!fadeIn) fail('toast 没有淡入过程（opacity 直接从 0 跳到 1）', seenT.map((x) => [x.at, x.s.o]).slice(0, 4));
  if (!movedIn) fail('toast 进入没有位移', seenT[0]);
  if (!settled || settled.s.o !== 1) fail('toast 300ms 后应完全不透明', settled);
  if (!hold || hold.at < 2000) fail('toast 没有停留到 2s', hold);
  if (!lastSeen || !(lastSeen.s.leaving || lastSeen.s.o < 1)) fail('toast 没有淡出', lastSeen);
  if (lastSeen && lastSeen.s.tf !== 'none') fail('toast 退出带了位移（规约要求退出不动）', lastSeen.s.tf);
  if (!goneAfter) fail('toast 3.4s 后应已卸载', samples[samples.length - 1]);

  notes.toast = {
    first: seenT[0],
    holdAt: hold ? hold.at : null,
    last: lastSeen,
    goneAfter,
    n: seenT.length,
  };

  /* ---------------- 4. 减弱动效：无位移、无延迟、toast 仍淡入淡出 ---------------- */

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await seed({ skin: 'paper', already: false });

  const box = await page.locator(KNOWN).boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(180);
  const reducePressed = await btnState(KNOWN);
  await page.mouse.move(2, 2);
  await page.mouse.up();
  await page.waitForTimeout(200);
  if (Math.abs(scaleOf(reducePressed.transform) - 1) > 0.001) {
    fail('减弱动效下按压仍有位移', reducePressed.transform);
  }

  const wordBefore = await wordOf();
  await page.click(KNOWN);
  await page.waitForTimeout(90);
  const wordFast = await wordOf();
  const duringReduce = await cardState();
  if (wordFast === wordBefore) fail('减弱动效下仍延迟换卡', { before: wordBefore, after: wordFast });
  if (duringReduce.cls.includes('is-ack-')) fail('减弱动效下仍挂了反馈类', duringReduce.cls);

  /* toast 单独起一次会话：三张都「今天已答过」，点一张必出提示且会话不结束 */
  await seed({ skin: 'paper', already: true });
  await page.click(KNOWN);
  const r0 = Date.now();
  const rSamples = [];
  while (Date.now() - r0 < 900) {
    const s = await page.evaluate(() => {
      const t = document.querySelector('.session-toast');
      if (!t) return null;
      const cs = getComputedStyle(t);
      return { o: Number(cs.opacity), tf: cs.transform };
    });
    rSamples.push(s);
    await page.waitForTimeout(40);
  }
  const rSeen = rSamples.filter(Boolean);
  const rFade = rSeen.some((x) => x.o > 0.02 && x.o < 0.98);
  const rMove = rSeen.some((x) => x.tf !== 'none');

  if (rSeen.length === 0) fail('减弱动效下 toast 没出现');
  if (!rFade) fail('减弱动效下 toast 没有淡入（规约要求只留 opacity）', rSeen.slice(0, 3));
  if (rMove) fail('减弱动效下 toast 仍有位移', rSeen.find((x) => x.tf !== 'none'));

  notes.reduce = {
    press: reducePressed.transform,
    word: { before: wordBefore, after: wordFast },
    toast: { n: rSeen.length, fade: rFade, move: rMove },
  };

  await page.emulateMedia({ reducedMotion: 'no-preference' });

  /* ---------------- 5. 按压底色可读性：8 皮肤 × 明暗 ---------------- */

  const contrastRows = [];
  const readContrast = () =>
    page.evaluate((sel) => {
      // 注意：color-mix() 的计算值在 Chromium 里序列化成 color(srgb r g b / a)，
      // 不是 rgb()/rgba()。只认 rgb() 会把「按压薄涂」这一层漏掉、拿底色顶替，
      // 测出来的对比度是假的（第一次跑 foundry 深色报 1.0 就是这个坑）。
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
      const btn = document.querySelector(sel);
      const cs = getComputedStyle(btn);
      const fg = parse(cs.color);
      const layers = [];
      for (let n = btn; n; n = n.parentElement) {
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
        ratio: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100,
        fg: cs.color,
        bg: `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`,
        tf: cs.transform,
      };
    }, KNOWN);

  for (const skin of skins) {
    for (const theme of ['light', 'dark']) {
      await seed({ skin, theme });
      const box = await page.locator(KNOWN).boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(95);
      const c = await readContrast();
      await page.mouse.move(2, 2);
      await page.mouse.up();
      await page.waitForTimeout(220);
      contrastRows.push({ skin, theme, ...c });
      // 按下只有 50ms，不按 WCAG 的 4.5 卡；但「字快看不见」= 缺陷
      if (!(c.ratio >= 3)) fail(`[${skin}/${theme}] 按下时「认识」字读不出来`, c);
    }
  }
  notes.pressContrast = contrastRows;

  if (fails.length > 0) {
    const err = new Error(`作答手感实测 ${fails.length} 项失败：${fails.slice(0, 8).join(' | ')}`);
    err.detail = { fails, skinRows, notes };
    throw err;
  }

  return { ok: true, skins: skinRows.length, fails, skinRows, notes };
};
