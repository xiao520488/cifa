async (page) => {
  // ② 专项扫描：所有「>4 个汉字但字号 <14px」的文本节点，按 类名|字号 聚合，附真实文案样本。
  // 用法：复制到 playwright-mcp/scripts 后 browser_run_code_unsafe({ filename: 'scripts/scan-tiny.js' })。文件必须以 } 结尾。
  const skins = ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'desk', 'vinyl', 'breeze'];
  const screens = ['home', 'cal', 'me', 'mistakes', 'sheet'];
  const SCAN = () => {
    const rows = [];
    for (const e of document.querySelectorAll('.screen *, .topbar *, .readouts *, .tabbar *, .sheet, .sheet *, .app__main *')) {
      if (e.closest('[aria-hidden="true"]')) continue;
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) continue;
      // 关键：祖先 display:none 时，后代自己的 computed display 仍是 inline/block，
      // 只有 getBoundingClientRect() 归零能证明它没被渲染 —— 漏了这行会把隐藏节点算成违规（假阳性）。
      const bx = e.getBoundingClientRect();
      if (bx.width < 1 || bx.height < 1) continue;
      if (![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      const t = e.textContent.trim();
      const cjk = (t.match(/[一-鿿]/g) || []).length;
      const sz = parseFloat(c.fontSize);
      if (cjk > 4 && sz < 14) rows.push([String(e.className).slice(0, 24) || e.tagName, sz, cjk, t.slice(0, 26)]);
    }
    return rows;
  };
  const go = async (kind) => {
    if (kind === 'home') return;
    // v2 第一阶段：导航全走底部 Tab（顶部三键与日历页开始按钮都已删）
    if (kind === 'cal') return page.evaluate(() => { const b = document.querySelector('.tabbar [data-tab="data"]'); if (b) b.click(); });
    if (kind === 'me') return page.evaluate(() => { const b = document.querySelector('.tabbar [data-tab="settings"]'); if (b) b.click(); });
    if (kind === 'mistakes') return page.evaluate(() => { const row = [...document.querySelectorAll('.setting-row')].find((r) => (r.querySelector('.setting-row__label') || {}).textContent?.includes('错词本')); const b = row && row.querySelector('button'); if (b) b.click(); });
    if (kind === 'sheet') return page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === '快速切换'); if (b) b.click(); });
  };
  const map = new Map();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const sk of skins) {
    for (const kind of screens) {
      await page.goto('http://127.0.0.1:5173/icon.svg');
      await page.evaluate((a) => { const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}'); s.profile = Object.assign({ name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'paper' }, s.profile, { skin: a }); localStorage.setItem('cijian.v1', JSON.stringify(s)); }, sk);
      await page.goto('http://127.0.0.1:5173/');
      await page.waitForTimeout(320);
      // 「错词本 / 外观面板」的入口都在设置页：先进 Tab，再点行内按钮
      if (kind === 'mistakes' || kind === 'sheet') { await go('me'); await page.waitForTimeout(240); }
      await go(kind);
      await page.waitForTimeout(kind === 'sheet' ? 300 : 260);
      const rows = await page.evaluate(SCAN);
      for (const [cls, sz, cjk, txt] of rows) {
        const k = cls + '|' + sz;
        if (!map.has(k)) map.set(k, { cls, sz, n: 0, skins: new Set(), maxCjk: 0, samples: new Set() });
        const v = map.get(k);
        v.n++; v.skins.add(sk); v.maxCjk = Math.max(v.maxCjk, cjk); v.samples.add(txt);
      }
      if (kind === 'sheet' || kind === 'mistakes') await page.keyboard.press('Escape');
    }
  }
  const list = [...map.values()].sort((a, b) => a.sz - b.sz || b.maxCjk - a.maxCjk);
  return {
    groups: list.length,
    hardFail: list.filter((v) => v.sz < 13).length,
    items: list.map((v) => ({ cls: v.cls, sz: v.sz, hits: v.n, skins: v.skins.size, maxCjk: v.maxCjk, sample: [...v.samples][0] })),
  };
}
