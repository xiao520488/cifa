/**
 * 出图：4 皮肤 × 关键视口的审查用截图。
 * 运行前页面要停在「学习中」（5 词列表）。
 */
async (page) => {
  const OUT = 'C:/Users/xiao/.dsh/mcp/out/v5';

  const shots = [
    { name: 'study-360-paper-light', w: 360, h: 800, skin: 'paper', theme: 'light' },
    { name: 'study-360-foundry-dark', w: 360, h: 800, skin: 'foundry', theme: 'dark' },
    { name: 'study-360-instrument-light', w: 360, h: 800, skin: 'instrument', theme: 'light' },
    { name: 'study-360-broadsheet-light', w: 360, h: 800, skin: 'broadsheet', theme: 'light' },
    { name: 'study-768-paper-light', w: 768, h: 1024, skin: 'paper', theme: 'light' },
    { name: 'study-1440-paper-light', w: 1440, h: 900, skin: 'paper', theme: 'light' },
  ];

  const saved = [];
  for (const shot of shots) {
    await page.setViewportSize({ width: shot.w, height: shot.h });
    await page.evaluate(
      ([s, t]) => {
        document.documentElement.dataset.skin = s;
        document.documentElement.dataset.theme = t;
      },
      [shot.skin, shot.theme],
    );
    await page.waitForTimeout(180);
    const path = `${OUT}/${shot.name}.png`;
    await page.screenshot({ path });
    saved.push(path);
  }

  await page.evaluate(() => {
    document.documentElement.dataset.skin = 'paper';
    document.documentElement.dataset.theme = 'light';
  });
  await page.setViewportSize({ width: 360, height: 800 });
  return saved;
}
