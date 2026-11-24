/**
 * 出图：开始页（foundry 深色）+ 我的 → 词库（paper 浅色）。
 */
async (page) => {
  const OUT = 'C:/Users/xiao/.dsh/mcp/out/v5';
  const saved = [];
  await page.setViewportSize({ width: 360, height: 800 });

  // 退出本批，回到开始页
  await page.evaluate(() => {
    const back = [...document.querySelectorAll('button')].find(
      (b) => b.getAttribute('aria-label') === '退出本批，回到开始页',
    );
    back?.click();
  });
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    document.documentElement.dataset.skin = 'foundry';
    document.documentElement.dataset.theme = 'dark';
  });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${OUT}/start-360-foundry-dark.png` });
  saved.push(`${OUT}/start-360-foundry-dark.png`);

  // 我的 → 词库
  await page.evaluate(() => {
    document.documentElement.dataset.skin = 'paper';
    document.documentElement.dataset.theme = 'light';
    const me = [...document.querySelectorAll('button')].find((b) => b.getAttribute('aria-label') === '打开我的');
    me?.click();
  });
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    const section = [...document.querySelectorAll('.section')].find(
      (s) => s.querySelector('.section__title')?.textContent === '词库',
    );
    section?.scrollIntoView({ block: 'center' });
  });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${OUT}/profile-360-paper-light.png` });
  saved.push(`${OUT}/profile-360-paper-light.png`);

  return saved;
}
