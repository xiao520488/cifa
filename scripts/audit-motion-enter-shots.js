/*
 * v2 页面转场 · 交付截图（MOTION_SPEC §13.8 commit 1 的实物证据）。
 *   Copy-Item D:\背单词\scripts\audit-motion-enter-shots.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\audit-motion-enter-shots.js D:\背单词\scripts\cfg-motion.json
 *
 * 8 皮肤 × 明暗 × 3 帧（起手 / 收束 / 结束），390 档，共 48 张。
 *
 * 为什么是「一次转场只截一张」而不是「一次转场连截三张」：截图本身要 60–120ms，
 * 连截三张必然把第三张挤出 350ms 的窗口；而且 380ms 摘类的定时器是真实时间，慢放/暂停
 * 都会被它打断。改成三趟独立转场，每趟只截一张，窗口干净。
 * 每张截图前后各读一次 screen-in 的 currentTime，报告里那一帧「是第几毫秒」是量出来的，
 * 不是估的 —— 这也是「截图即证据」能自证伪的前提。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_PREFS = 'cijian.v1';
  const OUT = 'D:\\背单词\\docs\\screenshots\\motion\\v2-enter\\';
  const shots = [];
  const rows = [];
  const fails = [];

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
    await page.waitForTimeout(200);
  };

  /** 点日历，并等到动画真的存在（提交晚一帧，不轮询会截到旧屏） */
  const clickCalendar = () =>
    page.evaluate(
      () =>
        new Promise((resolve) => {
          document.querySelector('.icon-btn[aria-label="打开学习日历"]').click();
          const t0 = performance.now();
          const tick = () => {
            const on = document
              .getAnimations()
              .some((a) => a.animationName === 'screen-in');
            if (on || performance.now() - t0 > 1500) resolve(on);
            else requestAnimationFrame(tick);
          };
          tick();
        }),
    );

  const animTimes = () =>
    page.evaluate(() =>
      document
        .getAnimations()
        .filter((a) => a.animationName === 'screen-in')
        .map((a) => Math.round(a.currentTime || 0)),
    );

  const shot = async (file) => {
    const before = await animTimes();
    await page.screenshot({ path: file });
    const after = await animTimes();
    shots.push(file);
    return { before, after };
  };

  const skins = ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'vinyl', 'desk'];
  const passes = [
    { tag: '1', label: '起手', delay: 0, wantAnim: true },
    { tag: '2', label: '收束', delay: 130, wantAnim: true },
    { tag: '3', label: '结束', delay: 520, wantAnim: false },
  ];

  for (const skin of skins) {
    for (const theme of ['light', 'dark']) {
      for (const pass of passes) {
        await gotoHome(skin, theme);
        const started = await clickCalendar();
        if (!started) {
          fails.push(`${skin}/${theme}/${pass.tag}: 点击后没有 screen-in 动画`);
        }
        if (pass.delay) await page.waitForTimeout(pass.delay);
        const file = `${OUT}enter-390-${skin}-${theme}-${pass.tag}.png`;
        const t = await shot(file);
        const running = t.before.length > 0;
        rows.push({ skin, theme, pass: pass.label, running, at: t.before, after: t.after });
        if (pass.wantAnim && !running) {
          fails.push(`${skin}/${theme}/${pass.label}：截图时动画已结束（没截到过程帧）`);
        }
        if (!pass.wantAnim && running) {
          fails.push(`${skin}/${theme}/${pass.label}：520ms 后动画还在跑`);
        }
      }
    }
  }

  return { shots: shots.length, rows, fails };
};
