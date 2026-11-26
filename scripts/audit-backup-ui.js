async (page) => {
  // 「我的 → 数据备份」单档视觉/交互抽查（390×844，paper 浅色）+ 三张截图。
  // 判据：新按钮 ≥44×44、文案对比度 ≥4.5、无横向溢出、错误提示带图标（三重编码）。
  const BASE = 'http://127.0.0.1:5173';
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const OUT = 'D:\\背单词\\docs\\screenshots\\v12';
  fs.mkdirSync(OUT, { recursive: true });
  const KEYS = ['cijian.v1', 'cijian.scheduler.v1'];
  const sleep = (ms) => page.waitForTimeout(ms);
  const before = await page.evaluate((keys) => keys.map((k) => localStorage.getItem(k)), KEYS);
  const restore = () => page.evaluate(({ keys, data }) => {
    keys.forEach((key, i) => { if (data[i] === null) localStorage.removeItem(key); else localStorage.setItem(key, data[i]); });
    for (const key of Object.keys(localStorage)) if (key === 'cijian.importing' || key.startsWith('__bak_') || key.startsWith('__p_')) localStorage.removeItem(key);
  }, { keys: KEYS, data: before });

  const probe = () => page.evaluate(() => {
    const pc = (s) => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const ln = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lu = (c) => 0.2126 * ln(c.r) + 0.7152 * ln(c.g) + 0.0722 * ln(c.b);
    const ratio = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + 0.05) / (x[1] + 0.05); };
    const bg = (el) => { let n = el; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0.9) return c; n = n.parentElement; } return pc(getComputedStyle(document.body).backgroundColor); };
    const section = [...document.querySelectorAll('.section')].find((s) => s.querySelector('.section__title')?.textContent.trim() === '数据备份');
    if (!section) return { found: false };
    const buttons = [...section.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; });
    const texts = [...section.querySelectorAll('.setting-row__label, .setting-row__value, .section__hint, .section__title')].map((el) => {
      const c = pc(getComputedStyle(el).color); const b = bg(el);
      return { text: el.textContent.trim().slice(0, 12), size: parseFloat(getComputedStyle(el).fontSize), ratio: c && b ? +ratio(c, b).toFixed(2) : null };
    });
    return { found: true, buttons, texts, overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });

  const problems = [];
  try {
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('button[aria-label="打开我的"]', { timeout: 15000 });
    await page.click('button[aria-label="打开我的"]');
    await page.waitForSelector('.section__title', { timeout: 10000 });
    await page.waitForTimeout(300);
    // 滚到备份区块，截图要落在视口里
    await page.evaluate(() => {
      const section = [...document.querySelectorAll('.section')].find((s) => s.querySelector('.section__title')?.textContent.trim() === '数据备份');
      section?.scrollIntoView({ block: 'center' });
    });
    await sleep(250);
    const base = await probe();
    await page.screenshot({ path: path.join(OUT, 'backup-me-390.png') });
    if (!base.found) problems.push('没找到「数据备份」区块');
    for (const b of base.buttons ?? []) if (b.w < 44 || b.h < 44) problems.push(`按钮「${b.text}」触控盒 ${b.w}×${b.h}`);
    for (const t of base.texts ?? []) if (t.ratio !== null && t.ratio < 4.5) problems.push(`文字「${t.text}」对比度 ${t.ratio}`);
    for (const t of base.texts ?? []) if (t.size < 13) problems.push(`文字「${t.text}」字号 ${t.size}px`);
    if (base.overflowX) problems.push('出现横向滚动');

    // 错误态：导一个版本不对的文件
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cijian-ui-'));
    const badPath = path.join(tmp, 'bad.json');
    fs.writeFileSync(badPath, JSON.stringify({ version: 9 }), 'utf8');
    await page.setInputFiles('input[type="file"]', badPath);
    await page.waitForSelector('[role="alert"]', { timeout: 8000 });
    await sleep(200);
    const errProbe = await page.evaluate(() => {
      const el = document.querySelector('[role="alert"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { text: el.textContent.trim().slice(0, 20), hasIcon: Boolean(el.querySelector('svg')), color: getComputedStyle(el).color, visible: r.height > 0 };
    });
    await page.screenshot({ path: path.join(OUT, 'backup-me-390-error.png') });
    if (!errProbe?.visible) problems.push('错误提示不可见');
    if (!errProbe?.hasIcon) problems.push('错误提示没有图标（三重编码缺一）');

    // 二次确认浮层：用合法备份触发，然后取消（不写入）
    const good = await page.evaluate(() => {
      const scheduler = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
      const profile = JSON.parse(localStorage.getItem('cijian.v1') || '{}').profile ?? null;
      return JSON.stringify({ version: 1, app: 'cijian', exportedAt: new Date().toISOString(), profile, scheduler }, null, 2);
    });
    const goodPath = path.join(tmp, 'good.json');
    fs.writeFileSync(goodPath, good, 'utf8');
    await page.setInputFiles('input[type="file"]', goodPath);
    await page.waitForSelector('.dialog', { timeout: 8000 });
    await sleep(200);
    const dialog = await page.evaluate(() => {
      const d = document.querySelector('.dialog');
      if (!d) return null;
      const buttons = [...d.querySelectorAll('button')].map((b) => { const r = b.getBoundingClientRect(); return { text: b.textContent.trim(), w: Math.round(r.width), h: Math.round(r.height) }; });
      return { title: d.querySelector('.dialog__title')?.textContent.trim(), text: d.querySelector('.dialog__text')?.textContent.trim().slice(0, 40), buttons };
    });
    await page.screenshot({ path: path.join(OUT, 'backup-dialog-390.png') });
    if (!dialog) problems.push('确认浮层没出现');
    for (const b of dialog?.buttons ?? []) if (b.h < 44) problems.push(`浮层按钮「${b.text}」高 ${b.h}`);
    await page.keyboard.press('Escape');
    await sleep(200);

    if (problems.length > 0) throw new Error('UI 抽查失败：' + problems.join(' | '));
    return { ok: true, base, errProbe, dialog, shots: ['backup-me-390.png', 'backup-me-390-error.png', 'backup-dialog-390.png'] };
  } finally {
    await restore().catch(() => null);
  }
}
