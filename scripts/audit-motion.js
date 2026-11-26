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
  /** matrix 的第 6 个分量 = translateY */
  const tyOf = (tf) => {
    if (!tf || tf === 'none') return 0;
    const m = tf.match(/matrix\(([^)]+)\)/);
    return m ? Number(m[1].split(',')[5]) : NaN;
  };
  const alphaOf = (color) => {
    if (!color) return 1;
    if (color === 'transparent') return 0;
    const m = color.match(/^rgba?\(([^)]+)\)/);
    if (!m) return 1;
    const p = m[1].split(',').map((x) => Number(x.trim()));
    return p.length > 3 ? p[3] : 1;
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

  /* ================= 0. v2 页面转场（docs/MOTION_SPEC.md §13.7 G1）=================
     只动进入屏：四个屏是条件渲染，换屏 = 旧屏整棵卸载，所以「退出不动」是结构给的。
     断的是：DOM 里只有一个 .screen、进入屏在跑 screen-in / 0.35s、位移从 8px 收到 0、
     500ms 后连类带动画一起消失（这样才能证明 fill-mode 写的是 backwards 不是 both）、
     8px 缝隙露的是 .app 自己的底色（不同色就是一条会闪的横缝）。
     采样全程在页面内完成（点击 + rAF 采样放在同一次 evaluate），避免 CDP 往返把首帧吃掉。 */

  const gotoHome = async (skin, theme) => {
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
    await page.waitForTimeout(120);
  };

  /** 点一个导航键，并从同一帧开始录 500ms。kind: 'cal' | 'me' | 'mistakes' | 'back' */
  const goTo = (kind) =>
    page.evaluate(
      (k) =>
        new Promise((resolve) => {
          document.querySelectorAll('.app > .topbar, .app > main.app__main').forEach((el) => {
            el.dataset.old = '1';
          });
          const pick = () => {
            if (k === 'cal') return document.querySelector('.icon-btn[aria-label="打开学习日历"]');
            if (k === 'me') return document.querySelector('.avatar-btn[aria-label="打开我的"]');
            if (k === 'mistakes') {
              const row = [...document.querySelectorAll('.setting-row')].find((r) =>
                r.textContent.includes('错词本'),
              );
              return row ? row.querySelector('button') : null;
            }
            return document.querySelector(
              '.icon-btn[aria-label="返回"], .icon-btn[aria-label="返回背单词"]',
            );
          };
          const btn = pick();
          if (!btn) {
            resolve({ error: 'nav-not-found:' + k });
            return;
          }
          btn.click();
          const t0 = performance.now();
          const out = [];
          const cs = (s) => {
            const el = document.querySelector('.app > ' + s);
            return el ? getComputedStyle(el) : null;
          };
          const tick = () => {
            const tb = cs('.topbar');
            const mn = cs('main.app__main');
            const rd = cs('.readouts');
            out.push({
              at: Math.round(performance.now() - t0),
              nScreen: document.querySelectorAll('.screen').length,
              tbAnim: tb ? tb.animationName : null,
              tbDur: tb ? tb.animationDuration : null,
              tbTf: tb ? tb.transform : null,
              tbOp: tb ? Number(tb.opacity) : null,
              mnOp: mn ? Number(mn.opacity) : null,
              rdAnim: rd ? rd.animationName : null,
              oldLeft: document.querySelectorAll('[data-old]').length,
            });
            if (performance.now() - t0 < 500) requestAnimationFrame(tick);
            else resolve(out);
          };
          tick();
        }),
      kind,
    );

  const judgeEnter = (label, frames, opts) => {
    const reduced = !!(opts && opts.reduced);
    if (!frames || frames.error) {
      fail(`${label}：找不到入口（${frames && frames.error}）`);
      return null;
    }
    /* 点击是程序化的（不受信事件），React 会把这次更新排到微任务，DOM 可能晚一帧才提交。
       所以「提交前」的帧（旧节点还在）不能拿来判动画 —— 从「旧节点已消失」的第一帧开始算。
       反过来说，如果一直没消失，说明旧屏真的没被卸载，下面照样会红。 */
    const live = frames.filter((f) => f.oldLeft === 0);
    if (live.length === 0) {
      fail(`${label}：旧屏节点一直没被卸载（还有退出动画在跑）`, frames[frames.length - 1]);
      return null;
    }
    const first = live[0];
    const last = live[live.length - 1];
    const tys = live.map((f) => tyOf(f.tbTf));
    const ops = live.map((f) => f.tbOp);
    const maxTy = Math.max(...tys.map((v) => Math.abs(v)));

    if (live.some((f) => f.nScreen !== 1)) {
      fail(`${label}：换屏瞬间 DOM 里不止一个 .screen`, live.map((f) => f.nScreen));
    }
    if (first.tbAnim !== 'screen-in') fail(`${label}：进入屏没在跑 screen-in`, first.tbAnim);
    if (first.tbDur !== '0.35s') fail(`${label}：转场不是 350ms`, first.tbDur);
    if (!ops.some((o) => o !== null && o < 0.9)) {
      fail(`${label}：没采到淡入过程（首帧 opacity 就已经是 1？）`, ops.slice(0, 4));
    }
    if (reduced && maxTy > 0.6) fail(`${label}：减弱动效下仍有位移`, maxTy);
    if (!reduced && !(maxTy > 2)) fail(`${label}：没有位移（--screen-shift 没接上？）`, maxTy);
    const maxIdx = tys.findIndex((v) => Math.abs(v) === maxTy);
    if (!reduced && !(tys[maxIdx] > tys[tys.length - 1] + 0.5)) {
      fail(`${label}：位移没有随时间收敛`, tys.slice(0, 6));
    }
    if (last.tbTf !== 'none') {
      fail(`${label}：500ms 后 transform 还不是 none（fill-mode 写成 both 了？）`, last.tbTf);
    }
    return {
      maxTy: Math.round(maxTy * 100) / 100,
      preCommit: frames.length - live.length,
      firstAt: first.at,
      lastAt: last.at,
      n: live.length,
    };
  };

  const gapColor = () =>
    page.evaluate(() => {
      const app = document.querySelector('.app');
      const tb = document.querySelector('.app > .topbar');
      return {
        app: getComputedStyle(app).backgroundColor,
        topbar: tb ? getComputedStyle(tb).backgroundColor : null,
      };
    });

  await gotoHome('paper', 'light');
  const enterRows = [];
  enterRows.push({ to: 'calendar', ...judgeEnter('study→日历', await goTo('cal')) });
  enterRows.push({ to: 'me', ...judgeEnter('日历→我的', await goTo('me')) });
  enterRows.push({ to: 'mistakes', ...judgeEnter('我的→错词本', await goTo('mistakes')) });
  const backFrames = await goTo('back');
  enterRows.push({ to: 'study', ...judgeEnter('错词本→学习', backFrames) });
  if (!backFrames.some((f) => f.rdAnim === 'screen-in')) {
    fail('回到首页时 .readouts 没有参与转场', backFrames.map((f) => f.rdAnim).slice(0, 4));
  }

  /* 自证伪：把 --screen-shift 临时归零，同一个探针必须测到位移变 0 —— 红不了就是探针坏了 */
  await page.evaluate(() => document.documentElement.style.setProperty('--screen-shift', '0px'));
  const zeroFrames = await goTo('cal');
  const zeroTy = Math.max(...zeroFrames.map((f) => Math.abs(tyOf(f.tbTf))));
  await page.evaluate(() => document.documentElement.style.removeProperty('--screen-shift'));
  if (zeroTy > 0.6) {
    fail('自证伪失败：--screen-shift 归零后仍测到位移（探针读错了属性？）', zeroTy);
  }
  const restoreFrames = await goTo('back');
  const restoreTy = Math.max(...restoreFrames.map((f) => Math.abs(tyOf(f.tbTf))));
  if (!(restoreTy > 2)) fail('自证伪失败：移除归零后位移没回来', restoreTy);

  /* 减弱动效：只留 opacity，位移恒 0；时长仍必须 350ms（不能被全局 * 压成 0.01ms 硬切） */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHome('paper', 'light');
  const reduceFrames = await goTo('cal');
  const reduceJudge = judgeEnter('减弱动效 → 日历', reduceFrames, { reduced: true });
  const reduceLive = reduceFrames.filter((f) => f.oldLeft === 0);
  /* 只判「动画在跑的那些帧」：380ms 摘类之后的帧本来就没有 animation，时长是全局 `*` 的
     0.01ms，那是正确状态，不是缺陷（拿它当失败就是探针给自己造假阳性）。 */
  const reduceAnimated = reduceLive.filter((f) => f.tbAnim === 'screen-in');
  if (reduceAnimated.length === 0) fail('减弱动效下没跑 screen-in（淡入被整段杀掉了）', reduceLive[0]);
  const reduceDurSet = [...new Set(reduceAnimated.map((f) => f.tbDur))];
  if (reduceDurSet.length !== 1 || reduceDurSet[0] !== '0.35s') {
    fail('减弱动效下转场被压成硬切（动画帧的时长不是 0.35s）', { durs: reduceDurSet });
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  notes.screenEnter = { rows: enterRows, selfFalsify: { zeroTy, restoreTy }, reduce: reduceJudge };

  /* 8 皮肤 × 明暗：动画在跑、结束态干净、8px 缝隙露的是屏自己的底色 */
  const enterSkinRows = [];
  for (const skin of [
    'paper',
    'foundry',
    'instrument',
    'broadsheet',
    'bento',
    'nocturne',
    'vinyl',
    'desk',
  ]) {
    for (const theme of ['light', 'dark']) {
      await gotoHome(skin, theme);
      const gap = await gapColor();
      const j = judgeEnter(`[${skin}/${theme}] study→日历`, await goTo('cal'));
      const tbAlpha = alphaOf(gap.topbar);
      const gapOk = gap.topbar === gap.app || tbAlpha === 0;
      if (!gapOk) {
        fail(`[${skin}/${theme}] 8px 缝隙露出的不是屏自己的底色（会闪横缝）`, gap);
      }
      enterSkinRows.push({
        skin,
        theme,
        gap,
        gapOk,
        semi: tbAlpha > 0 && tbAlpha < 1,
        ...(j || {}),
      });
    }
  }
  notes.enterSkins = enterSkinRows;

  /* ================= 0b. v2 主题 / 皮肤切换过渡（docs/MOTION_SPEC.md §13.7 G2）=====
     四条判据：
     ① 切换那一下必须挂 is-theme-switching，且带类的帧里六节点是 0.2s + 三属性；
     ② 320ms 后类必须消失，且六节点的 transition-property / duration 与基线**逐字相等**
        （基线允许本来就含颜色过渡 —— 基座与皮肤本来就有 140ms 的 hover 颜色，判据是「回到基线」）；
     ③ 中间态真的存在：100ms 时 .app 的底色既不等于切换前也不等于切换后；
     ④ 减弱动效两条都测：JS 跳过（类一次都不出现 + 背景瞬切）、CSS 反制（强制加类后时长必须归零）。
     另加自证伪：人为挂一个 CSS 不认识的旧类名，320ms 后它必须还在（否则「类消失」这条是自欺）。 */

  const STYLE_SELS = ['.app', '.topbar', '.screen', '.readout', '.btn', '.start'];

  const styleSnap = () =>
    page.evaluate((sels) => {
      const nodes = {};
      for (const s of sels) {
        const el = document.querySelector(s);
        if (!el) continue;
        const cs = getComputedStyle(el);
        nodes[s] = { prop: cs.transitionProperty, dur: cs.transitionDuration };
      }
      return {
        cls: document.documentElement.className,
        nodes,
        appBg: getComputedStyle(document.querySelector('.app')).backgroundColor,
      };
    }, STYLE_SELS);

  /** 全站扫一遍 transition-property 里有没有 all **并且真的在跑**（duration > 0） */
  const scanAllTransition = () =>
    page.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        const p = cs.transitionProperty;
        if (!p.split(',').some((x) => x.trim() === 'all')) continue;
        // Chromium 里 transition-property 的初始值就是 all，duration 为 0 时什么都不会动；
        // 只认「all + 非零时长」才是真的违规。
        const running = cs.transitionDuration
          .split(',')
          .some((d) => parseFloat(d) > 0);
        if (running) {
          bad.push(el.tagName + '.' + String(el.className).slice(0, 24) + ' :: ' + cs.transitionDuration);
          if (bad.length > 5) break;
        }
      }
      return bad;
    });

  /** 点一个 CSS 选择器指向的元素，并从同一帧开始录 380ms（类 + 六节点样式 + .app 底色） */
  const clickAndRecord = (selector) =>
    page.evaluate(
      (sel) =>
        new Promise((resolve) => {
          const btn = document.querySelector(sel);
          if (!btn) {
            resolve({ error: 'no-element:' + sel });
            return;
          }
          btn.click();
          const t0 = performance.now();
          const frames = [];
          const tick = () => {
            const app = document.querySelector('.app');
            const nodes = {};
            for (const s of ['.app', '.topbar', '.screen', '.readout', '.btn', '.start']) {
              const el = document.querySelector(s);
              if (!el) continue;
              const cs = getComputedStyle(el);
              nodes[s] = { prop: cs.transitionProperty, dur: cs.transitionDuration };
            }
            /* 底色到底有没有在 200ms 里过渡：直接读 CSS Transition 对象，
               比「什么时候变成终色」可靠 —— 颜色差只有几个色阶时（paper→foundry 的白），
               量化的到达时刻会比真实过渡早 60–100ms，拿它当判据就是假阴性。 */
            const anims = document.getAnimations().filter(
              (a) =>
                a.transitionProperty === 'background-color' &&
                a.effect &&
                a.effect.target === app,
            );
            const a0 = anims[0];
            frames.push({
              at: Math.round(performance.now() - t0),
              cls: document.documentElement.className,
              appBg: getComputedStyle(app).backgroundColor,
              nodes,
              bgAnim: a0
                ? {
                    dur: a0.effect.getTiming().duration,
                    state: a0.playState,
                    elapsed: Math.round(performance.now() - (a0.startTime || performance.now())),
                  }
                : null,
            });
            if (performance.now() - t0 < 380) requestAnimationFrame(tick);
            else resolve(frames);
          };
          requestAnimationFrame(tick);
        }),
      selector,
    );

  const judgeThemeSwitch = (label, frames, before) => {
    if (!frames || frames.error) {
      fail(`${label}：找不到切换按钮（${frames && frames.error}）`);
      return null;
    }
    const withCls = frames.filter((f) => f.cls.includes('is-theme-switching'));
    if (withCls.length === 0) fail(`${label}：切换时没有挂 is-theme-switching`, frames[0]);
    else if (withCls[0].at > 80) fail(`${label}：过渡类挂得太晚（首帧已过 80ms）`, withCls[0].at);

    const badDur = [];
    const badProp = [];
    for (const f of withCls) {
      for (const [sel, v] of Object.entries(f.nodes)) {
        if (!v.dur.includes('0.2s')) badDur.push([f.at, sel, v.dur]);
        // transition-property 的计算值是逗号串；三个属性必须都在
        if (!(v.prop.includes('background-color') && v.prop.includes('color') && v.prop.includes('border-color'))) {
          badProp.push([f.at, sel, v.prop]);
        }
      }
    }
    if (badDur.length) fail(`${label}：带类的帧里有节点不是 200ms`, badDur.slice(0, 4));
    if (badProp.length) fail(`${label}：带类的帧里缺三属性之一`, badProp.slice(0, 3));

    const after = frames.filter((f) => f.at > 300);
    if (after.length === 0) fail(`${label}：没采到 300ms 之后的帧`);
    if (after.some((f) => f.cls.includes('is-theme-switching'))) {
      fail(`${label}：320ms 后过渡类还在（常驻了）`, after[after.length - 1].cls);
    }

    /* 中间态：不许瞬切。判据用 CSS Transition 对象自身的时长与状态 ——
       不用「色值到达终点的时刻」（色差小的时候量化会提前 60–100ms 到达，属假阴性）。 */
    const finalBg = frames[frames.length - 1].appBg;
    if (finalBg === before.appBg) {
      fail(`${label}：切换后底色没变（后面几条断言就是假的）`, { before: before.appBg, final: finalBg });
    }
    const seen = frames.filter((f) => f.bgAnim);
    if (seen.length === 0) {
      fail(`${label}：.app 上根本没有 background-color 过渡（瞬切）`, {
        before: before.appBg,
        final: finalBg,
      });
    }
    const badAnimDur = seen.filter((f) => f.bgAnim.dur !== 200);
    if (badAnimDur.length) fail(`${label}：底色过渡不是 200ms`, badAnimDur.slice(0, 2));
    const long = seen.filter((f) => f.bgAnim.state === 'running' && f.bgAnim.elapsed >= 120);
    if (long.length === 0) {
      fail(`${label}：底色过渡没有真正跑满 120ms 以上（像是瞬切）`, seen.slice(0, 3));
    }
    const tail = frames[frames.length - 1];
    if (tail.bgAnim && tail.bgAnim.state === 'running') {
      fail(`${label}：380ms 后底色过渡还在跑（时长不对）`, tail.bgAnim);
    }
    const midFrame = frames.find((f) => f.appBg !== before.appBg && f.appBg !== finalBg);
    return {
      firstClsAt: withCls.length ? withCls[0].at : null,
      clsFrames: withCls.length,
      totalFrames: frames.length,
      bgAnim: seen[0].bgAnim,
      runningPast120: long.length,
      mid: midFrame ? { at: midFrame.at, bg: midFrame.appBg } : null,
      finalBg,
    };
  };

  await gotoHome('paper', 'light');
  const themeBase = await styleSnap();
  const allAll = await scanAllTransition();
  if (allAll.length > 0) fail('有元素用了 transition: all（规约禁止）', allAll);

  await page.evaluate(() =>
    document.querySelector('.icon-btn[aria-label="切换外观风格"]').click(),
  );
  await page.waitForSelector('.segmented[aria-label="明暗"]', { timeout: 4000 });
  await page.waitForTimeout(360); // 等面板入场动画结束：否则长任务会把过渡起点推后（实测 175ms），判据会假阳性
  const themeFrames = await clickAndRecord('button[aria-label="深色"]');
  const themeJudge = judgeThemeSwitch('切深色', themeFrames, themeBase);

  // 320ms 之后：类必须消失，六节点样式必须逐字回到基线
  await page.waitForTimeout(360);
  const themeAfter = await styleSnap();
  const drift = Object.keys(themeBase.nodes)
    .filter((sel) => {
      const a = themeAfter.nodes[sel];
      const b = themeBase.nodes[sel];
      return !a || !b || a.prop !== b.prop || a.dur !== b.dur;
    })
    .map((sel) => ({
      sel,
      base: themeBase.nodes[sel],
      after: themeAfter.nodes[sel],
    }));
  if (drift.length > 0) fail('320ms 后过渡属性没回到基线（= 常驻了）', drift.slice(0, 3));
  if (themeAfter.cls.includes('is-theme-switching')) fail('320ms 后类还在', themeAfter.cls);

  // 切皮肤也要走同一条过渡（§13.4 触发条件包含 skin）
  const skinFrames = await clickAndRecord('.skin-grid .skin-card:nth-child(2)');
  const skinJudge = judgeThemeSwitch('切皮肤', skinFrames, themeAfter);

  /* 自证伪：挂一个 CSS 不认识的旧类名 —— 320ms 后它必须还在，否则「类消失」这条是自欺 */
  await page.evaluate(() => document.documentElement.classList.add('is-theme-fade'));
  await page.waitForTimeout(320);
  const stale = await page.evaluate(() => document.documentElement.className);
  await page.evaluate(() => document.documentElement.classList.remove('is-theme-fade'));
  if (!stale.includes('is-theme-fade')) {
    fail('自证伪失败：人为挂上的旧类竟然自己消失了（「类消失」这条断言不可信）', stale);
  }

  /* 减弱动效 · 第 1 条：JS 跳过（类一次都不出现 + 背景瞬切到终值） */
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await gotoHome('paper', 'light');
  await page.evaluate(() =>
    document.querySelector('.icon-btn[aria-label="切换外观风格"]').click(),
  );
  await page.waitForSelector('.segmented[aria-label="明暗"]', { timeout: 4000 });
  await page.waitForTimeout(360); // 等面板入场动画结束：否则长任务会把过渡起点推后（实测 175ms），判据会假阳性
  const reduceThemeFrames = await clickAndRecord('button[aria-label="深色"]');
  const reduceWithCls = reduceThemeFrames.filter((f) => f.cls.includes('is-theme-switching'));
  if (reduceWithCls.length > 0) {
    fail('减弱动效下仍挂了过渡类（JS 没跳过）', reduceWithCls[0].cls);
  }
  const rFirst = reduceThemeFrames[0];
  const rFinal = reduceThemeFrames[reduceThemeFrames.length - 1];
  if (rFirst.appBg === rFinal.appBg) {
    fail('减弱动效下底色没变（这次切换没生效，下面两条是假绿）', rFirst);
  }
  const rEarly = reduceThemeFrames.find((f) => f.at >= 50) || rFinal;
  if (rEarly.appBg !== rFinal.appBg) {
    fail('减弱动效下底色仍在渐变（应当在 ~1 帧内瞬切）', {
      at: rEarly.at,
      bg: rEarly.appBg,
      final: rFinal.appBg,
    });
  }

  /* 减弱动效 · 第 2 条：CSS 反制（手动强制加类，时长必须归零） */
  const counter = await page.evaluate(() => {
    const root = document.documentElement;
    root.classList.add('is-theme-switching');
    const out = {};
    for (const s of ['.app', '.topbar', '.screen', '.readout', '.btn', '.start']) {
      const el = document.querySelector(s);
      if (!el) continue;
      out[s] = getComputedStyle(el).transitionDuration;
    }
    root.classList.remove('is-theme-switching');
    return out;
  });
  const counterBad = Object.entries(counter).filter(
    ([, d]) => !(d.includes('0s') || d.includes('0.00001s') || d.includes('1e-05s')),
  );
  if (counterBad.length > 0) {
    fail('减弱动效下 CSS 反制没生效（强制加类后仍按 0.2s 过渡）', counterBad.slice(0, 3));
  }
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  notes.themeSwitch = {
    base: themeBase,
    judge: themeJudge,
    skin: skinJudge,
    drift: drift.length,
    reduce: { clsSeen: reduceWithCls.length, earlyBg: rEarly.appBg, finalBg: rFinal.appBg },
    counter,
    allAll,
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
