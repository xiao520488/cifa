async (page) => {
  // 进度导出 / 导入 端到端（隔离 context，run-audit-node.js 起的 headless 浏览器）。
  // 覆盖三件事：① 导出能下载且内容可校验 ② 坏文件被拒且零写入 ③ 合法文件覆盖生效（含二次确认）
  const BASE = 'http://127.0.0.1:5173';
  const KEYS = ['cijian.v1', 'cijian.scheduler.v1'];
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const sleep = (ms) => page.waitForTimeout(ms);

  const sha = async (text) =>
    page.evaluate(async (value) => {
      const buf = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }, text);
  const readKeys = () => page.evaluate((keys) => keys.map((k) => localStorage.getItem(k)), KEYS);

  const before = await readKeys();
  const beforeHash = [await sha(before[0] ?? ''), await sha(before[1] ?? '')];
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cijian-backup-'));
  const problems = [];
  const cleanup = () => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch { /* 忽略 */ }
  };
  const restore = async () => {
    await page.evaluate(({ keys, data }) => {
      keys.forEach((key, i) => { if (data[i] === null) localStorage.removeItem(key); else localStorage.setItem(key, data[i]); });
      for (const key of Object.keys(localStorage)) if (key.startsWith('__bak_') || key.startsWith('__p_')) localStorage.removeItem(key);
    }, { keys: KEYS, data: before });
  };

  try {
    // ---- 1. 进「我的」 ----
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[aria-label="打开我的"]', { timeout: 15000 });
    await page.click('button[aria-label="打开我的"]');
    await page.waitForSelector('.section__title', { timeout: 10000 });
    await page.waitForTimeout(300);

    const hasSection = await page.evaluate(() => [...document.querySelectorAll('.section__title')].some((n) => n.textContent.trim() === '数据备份'));
    if (!hasSection) problems.push('「我的」页没有「数据备份」区块');

    // ---- 2. 导出并校验下载内容 ----
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.getByRole('button', { name: '导出', exact: true }).click(),
    ]);
    const exportedPath = path.join(tmpDir, 'exported.json');
    await download.saveAs(exportedPath);
    const exportedText = fs.readFileSync(exportedPath, 'utf8');
    const exported = JSON.parse(exportedText);
    const exportChecks = {
      version: exported.version,
      app: exported.app,
      hasScheduler: Boolean(exported.scheduler && exported.scheduler.cards),
      hasProfile: Boolean(exported.profile && typeof exported.profile.skin === 'string'),
      cards: Object.keys(exported.scheduler?.cards ?? {}).length,
      unlearned: (exported.scheduler?.unlearned ?? []).length,
      filename: download.suggestedFilename(),
    };
    if (exportChecks.version !== 1) problems.push(`导出 version=${exportChecks.version}`);
    if (exportChecks.app !== 'cijian') problems.push(`导出 app=${exportChecks.app}`);
    if (!exportChecks.hasScheduler) problems.push('导出里没有 scheduler');
    if (!exportChecks.hasProfile) problems.push('导出里没有 profile');
    if (!/^cijian-backup-\d{4}-\d{2}-\d{2}\.json$/.test(exportChecks.filename)) problems.push(`文件名异常：${exportChecks.filename}`);
    const noteText = await page.evaluate(() => document.querySelector('[role="status"]')?.textContent?.trim() ?? null);
    if (!noteText || !noteText.includes('已导出')) problems.push('导出后没有成功提示');

    // ---- 3. 改成本地另一份状态，为「覆盖是否真的发生」做对照 ----
    // 注意：unlearned 每次启动都会被 seed() 重置，不能当对照；用 immediate.stats.groups。
    // 必须先在**同源非 App 页**写 storage：App 页 pagehide 会拿内存态回写，直接写在刷新瞬间会被盖掉。
    await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
      raw.immediate = raw.immediate || { pendingCount: 0, pendingWords: [], active: null, stats: { groups: 0, cards: 0, loops: 0, skipped: 0 }, lastAvgLoops: null };
      raw.immediate.stats.groups = 7;
      localStorage.setItem('cijian.scheduler.v1', JSON.stringify(raw));
    });
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[aria-label="打开我的"]', { timeout: 15000 });
    const mutated = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
      return { groups: s.immediate?.stats?.groups ?? null };
    });
    if (mutated.groups !== 7) problems.push(`对照状态没改成功：groups=${mutated.groups}`);

    // ---- 4. 坏文件必须被拒，且零写入 ----
    const badPath = path.join(tmpDir, 'bad.json');
    fs.writeFileSync(badPath, JSON.stringify({ ...exported, version: 2 }), 'utf8');
    await page.click('button[aria-label="打开我的"]');
    await page.waitForSelector('.section__title', { timeout: 10000 });
    const schedulerBeforeBad = await page.evaluate(() => localStorage.getItem('cijian.scheduler.v1'));
    await page.setInputFiles('input[type="file"]', badPath);
    await page.waitForSelector('[role="alert"]', { timeout: 8000 });
    const alertText = await page.evaluate(() => document.querySelector('[role="alert"]')?.textContent?.trim() ?? '');
    const schedulerAfterBad = await page.evaluate(() => localStorage.getItem('cijian.scheduler.v1'));
    const hasDialogAfterBad = await page.evaluate(() => Boolean(document.querySelector('.dialog')));
    if (!alertText.includes('导入失败')) problems.push(`坏文件没有报错：${alertText}`);
    if (schedulerAfterBad !== schedulerBeforeBad) problems.push('坏文件竟然写入了学习数据');
    if (hasDialogAfterBad) problems.push('坏文件弹出了确认框');

    // ---- 5. 合法文件：先出确认框（此刻不能写），确认后才覆盖 ----
    const schedulerBeforeGood = await page.evaluate(() => localStorage.getItem('cijian.scheduler.v1'));
    await page.setInputFiles('input[type="file"]', exportedPath);
    await page.waitForSelector('.dialog', { timeout: 8000 });
    const dialogText = await page.evaluate(() => document.querySelector('.dialog')?.textContent ?? '');
    const schedulerWhileDialog = await page.evaluate(() => localStorage.getItem('cijian.scheduler.v1'));
    if (!dialogText.includes('覆盖')) problems.push('确认框没说要覆盖');
    if (schedulerWhileDialog !== schedulerBeforeGood) problems.push('确认前就写了数据（破坏性操作必须后写）');

    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null),
      page.getByRole('button', { name: '覆盖并导入' }).click(),
    ]);
    await page.waitForTimeout(600);
    const afterImport = await page.evaluate(() => {
      const s = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
      const p = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
      return { groups: s.immediate?.stats?.groups ?? null, skin: p.profile?.skin ?? null, importingFlag: localStorage.getItem('cijian.importing') };
    });
    if (afterImport.groups !== 0) problems.push(`导入后 stats.groups=${afterImport.groups}，期望 0（备份里的值）`);
    if (afterImport.importingFlag !== null) problems.push('导入闸门标记没被清掉（之后会一直不落盘）');

    // ---- 6. 还原 + 校验 ----
    await restore();
    const restored = await readKeys();
    const afterHash = [await sha(restored[0] ?? ''), await sha(restored[1] ?? '')];
    if (afterHash[0] !== beforeHash[0] || afterHash[1] !== beforeHash[1]) problems.push('双键还原后 SHA256 不一致');

    if (problems.length > 0) throw new Error('备份 E2E 失败：' + problems.join(' | '));
    return {
      ok: true,
      exportChecks,
      noteText,
      alertText,
      dialogHead: dialogText.slice(0, 60),
      mutated,
      afterImport,
      sha: { beforeHash, afterHash },
    };
  } catch (error) {
    await restore().catch(() => null);
    throw error;
  } finally {
    cleanup();
  }
}
