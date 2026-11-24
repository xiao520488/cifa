/**
 * 启动失败回归：词库 chunk 拉不下来时，必须停在「词库没有加载出来」，
 * 且**不能**写任何调度状态（否则当天的「新词计划」会被结算成 0）。
 */
async (page) => {
  const base = 'http://127.0.0.1:5173';
  const out = {};

  await page.goto(`${base}/manifest.webmanifest`);
  await page.evaluate(() => {
    localStorage.removeItem('cijian.scheduler.v1');
    const store = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
    store.profile = { ...(store.profile || {}), stage: 'cet4', skin: 'paper', theme: 'light' };
    localStorage.setItem('cijian.v1', JSON.stringify(store));
  });

  await page.route('**/src/data/cet4.json*', (route) => route.abort());
  await page.goto(`${base}/`);
  await page.waitForTimeout(1200);

  out.title = await page.evaluate(() => document.querySelector('.boot-error__title')?.textContent ?? null);
  out.hasApp = await page.evaluate(() => !!document.querySelector('.app'));
  out.schedulerWritten = await page.evaluate(() => localStorage.getItem('cijian.scheduler.v1') !== null);

  await page.unroute('**/src/data/cet4.json*');
  await page.reload();
  await page.waitForTimeout(1500);
  out.recoveredTitle = await page.evaluate(() => document.querySelector('.boot-error__title')?.textContent ?? null);
  out.appMounted = await page.evaluate(() => !!document.querySelector('.word-list, .start'));
  out.pool = await page.evaluate(() => {
    const raw = localStorage.getItem('cijian.scheduler.v1');
    return raw ? JSON.parse(raw).unlearned?.length : null;
  });

  return out;
}
