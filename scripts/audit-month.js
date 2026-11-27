async (page) => {
  // 月历（v2 第二阶段）门禁：7 列结构 / 点击联动 / 翻月 / 与 TabBar 不相压 / 对比度。
  // 配置键（写在 /icon.svg 的 localStorage）：__m_skins __m_themes __m_vps __m_only __m_shots __m_prefix
  // __m_only 是单组开关：只跑一套皮肤（调试用），组名不认识就当场抛错——不许「一组没跑 → 零失败 → 绿灯」。
  await page.goto('http://127.0.0.1:5173/icon.svg');
  const cfg = await page.evaluate(() => ({
    skins: JSON.parse(localStorage.getItem('__m_skins') || '["breeze"]'),
    themes: JSON.parse(localStorage.getItem('__m_themes') || '["light"]'),
    vps: JSON.parse(localStorage.getItem('__m_vps') || '[[390,844]]'),
    only: localStorage.getItem('__m_only') || '',
    shots: localStorage.getItem('__m_shots') === '1',
    seed: localStorage.getItem('__m_seed') === '1',
    prefix: localStorage.getItem('__m_prefix') || 'vm',
  }));
  const ALL = ['paper', 'breeze', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'desk', 'vinyl'];
  if (cfg.only && !ALL.includes(cfg.only)) throw new Error('__m_only 不认识的组：' + cfg.only);
  const skins = cfg.only ? [cfg.only] : cfg.skins;

  const goCal = () => page.evaluate(() => {
    const b = document.querySelector('.tabbar [data-tab="data"]');
    if (b) b.click();
    return !!b;
  });
  const setSkin = async (skin, theme, w, h) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto('http://127.0.0.1:5173/icon.svg');
    await page.evaluate(([sk, th]) => {
      const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}');
      s.profile = Object.assign(
        { name: '', stage: 'cet4', batchSize: 5, meaningMode: 'auto', theme: 'light', skin: 'breeze' },
        s.profile,
        { skin: sk, theme: th },
      );
      localStorage.setItem('cijian.v1', JSON.stringify(s));
    }, [skin, theme]);
    if (cfg.seed) {
      // 隔离 context 没有历史，日历永远是「全灰」——点亮状态就测不到了。
      // 这里造两条**合法**的 DayRecord（sanitizeScheduler 会照常校验）：
      // 前天 3/3 全做完 → done，四天前 1/2 → partial。
      await page.evaluate(() => {
        const pad = (n) => String(n).padStart(2, '0');
        const key = (offset) => {
          const d = new Date();
          d.setDate(d.getDate() + offset);
          return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
        };
        const raw = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
        raw.v = 1;
        raw.days = Object.assign({}, raw.days, {
          [key(-2)]: {
            dueSnapshot: ['exist', 'manage', 'harm'],
            snapshotDone: true,
            planSnapshot: [{ sourceDate: key(-4), daysAgo: 2, wordCount: 3 }],
            doneToday: ['exist', 'manage', 'harm'],
            newWordLimit: 5,
            newLearned: ['exist', 'manage', 'harm', 'part', 'might'],
            accScore: 3,
            accCount: 3,
            retried: 0,
            immediate: { groups: 1, cards: 5, loops: 1.2, skipped: 0 },
            settled: true,
            action: 'maintain',
            absent: false,
            settlement: null,
          },
          [key(-4)]: {
            dueSnapshot: ['site', 'track'],
            snapshotDone: true,
            planSnapshot: [{ sourceDate: key(-6), daysAgo: 2, wordCount: 2 }],
            doneToday: ['site'],
            newWordLimit: 5,
            newLearned: [],
            accScore: 1,
            accCount: 2,
            retried: 0,
            immediate: { groups: 0, cards: 0, loops: 0, skipped: 0 },
            settled: true,
            action: 'maintain',
            absent: false,
            settlement: null,
          },
        });
        localStorage.setItem('cijian.scheduler.v1', JSON.stringify(raw));
      });
    }
    await page.goto('http://127.0.0.1:5173/');
    await page.waitForTimeout(320);
    await goCal();
    await page.waitForTimeout(320);
  };

  // 页面内量具：几何 + 对比度 + 详情文本
  const probe = () => page.evaluate(() => {
    const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const ln = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    const lu = (c) => 0.2126 * ln(c.r) + 0.7152 * ln(c.g) + 0.0722 * ln(c.b);
    const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + 0.05) / (x[1] + 0.05); };
    const bgOf = (e) => { let n = e; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a >= 0.99) return c; n = n.parentElement; } return { r: 255, g: 255, b: 255, a: 1 }; };
    const grid = document.querySelector('.month__grid');
    if (!grid) return { missing: true };
    const cells = [...grid.querySelectorAll('.cell')];
    const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean);
    const app = document.querySelector('.app').getBoundingClientRect();
    const bar = document.querySelector('.tabbar').getBoundingClientRect();
    const main = document.querySelector('.app__main');
    const nums = cells.map((c) => c.querySelector('.cell__n'));
    const doneCell = cells.find((c) => c.dataset.state === 'done');
    const title = document.querySelector('.month__title');
    return {
      cols: cols.length,
      colW: cols.map((x) => Math.round(parseFloat(x))).join(','),
      n: cells.length,
      inMonth: cells.filter((c) => !c.dataset.out).length,
      outCells: cells.filter((c) => c.dataset.out === '1').length,
      todayCells: document.querySelectorAll('.cell[aria-current="date"]').length,
      doneCells: cells.filter((c) => c.dataset.state === 'done').length,
      futureCells: cells.filter((c) => c.dataset.state === 'future').length,
      minCellH: Math.min(...cells.map((c) => Math.round(c.getBoundingClientRect().height))),
      minCellW: Math.min(...cells.map((c) => Math.round(c.getBoundingClientRect().width))),
      font: parseFloat(getComputedStyle(nums[0]).fontSize),
      gridRight: Math.round(grid.getBoundingClientRect().right),
      appRight: Math.round(app.right),
      ovf: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      barTop: Math.round(bar.top),
      room: main ? main.scrollHeight - main.clientHeight : 0,
      detailTitle: (document.querySelector('.cal-detail__date') || {}).textContent?.trim() || null,
      detailTags: [...document.querySelectorAll('.cal-detail__tag')].map((t) => t.textContent.trim()),
      hasFigures: document.querySelectorAll('.cal-detail .detail-figure').length,
      contrast: nums.map((n) => +rt(pc(getComputedStyle(n).color), bgOf(n)).toFixed(2)),
      doneContrast: doneCell ? +rt(pc(getComputedStyle(doneCell.querySelector('.cell__n')).color), bgOf(doneCell.querySelector('.cell__n'))).toFixed(2) : null,
      titleContrast: title ? +rt(pc(getComputedStyle(title).color), bgOf(title)).toFixed(2) : null,
      label: (cells.find((c) => !c.dataset.out) || {}).getAttribute ? cells.find((c) => !c.dataset.out).getAttribute('aria-label') : null,
      // 「复习批次」卡片：条数、默认展开、点击折叠、词表字号与对比度
      batches: (() => {
        const card = document.querySelector('.batches');
        if (!card) return null;
        const heads = [...card.querySelectorAll('.batch__head')];
        const rows = [...card.querySelectorAll('.batch-word')];
        const nums = [...card.querySelectorAll('.batch__num')].map((n) => parseInt(n.textContent, 10) || 0);
        const w = card.querySelector('.batch-word__w');
        const mEl = card.querySelector('.batch-word__m');
        return {
          count: (card.querySelector('.batches__count') || {}).textContent?.trim() || null,
          tag: (card.querySelector('.batches__tag') || {}).textContent?.trim() || null,
          heads: heads.length,
          expanded: card.querySelectorAll('.batch[data-open]').length,
          aria: heads.map((h) => h.getAttribute('aria-expanded')).join(','),
          rows: rows.length,
          sumNums: nums.reduce((a, b) => a + b, 0),
          headH: heads.length ? Math.round(heads[0].getBoundingClientRect().height) : 0,
          wordFont: w ? parseFloat(getComputedStyle(w).fontSize) : 0,
          wordWeight: w ? parseInt(getComputedStyle(w).fontWeight, 10) : 0,
          wordCt: w ? +rt(pc(getComputedStyle(w).color), bgOf(w)).toFixed(2) : null,
          meaningCt: mEl ? +rt(pc(getComputedStyle(mEl).color), bgOf(mEl)).toFixed(2) : null,
          meaningText: mEl ? (mEl.textContent || '').trim() : '',
          empty: (card.querySelector('.batches__empty') || {}).textContent?.trim() || null,
          ovf: card.scrollWidth > card.clientWidth + 1,
        };
      })(),
    };
  });

  const clickCell = (selector) => page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (el) el.click();
    return !!el;
  }, selector);
  const wait = () => page.waitForTimeout(220);

  const results = [];
  for (const skin of skins) {
    for (const theme of cfg.themes) {
      for (const [w, h] of cfg.vps) {
        const fails = [];
        const rec = { skin, theme, vp: w + 'x' + h };
        await setSkin(skin, theme, w, h);
        let m = await probe();
        if (m.missing) {
          fails.push('no-grid');
          results.push({ ...rec, fails });
          continue;
        }
        if (m.cols !== 7) fails.push('cols=' + m.cols);
        if (m.n % 7 !== 0) fails.push('cells=' + m.n);
        if (m.inMonth < 28 || m.inMonth > 31) fails.push('inMonth=' + m.inMonth);
        if (m.todayCells > 1) fails.push('today=' + m.todayCells);
        if (m.minCellH < 44) fails.push('cellH=' + m.minCellH);
        if (m.minCellW < 40) fails.push('cellW=' + m.minCellW);
        if (m.ovf) fails.push('ovfX');
        if (m.font < 12) fails.push('font=' + m.font);
        if (m.gridRight > m.appRight + 1) fails.push('gridOut');
        if (m.hasFigures !== 4) fails.push('figures=' + m.hasFigures);
        if (m.contrast.some((c) => c < 4.5)) fails.push('ct=' + Math.min(...m.contrast));
        if (m.titleContrast !== null && m.titleContrast < 4.5) fails.push('titleCt=' + m.titleContrast);
        if (m.doneCells > 0 && m.doneContrast !== null && m.doneContrast < 4.5) fails.push('doneCt=' + m.doneContrast);

        // 今天：详情必须标「今天」
        const todayOk = await clickCell('.cell[aria-current="date"]');
        await wait();
        const t = await probe();
        if (!todayOk) fails.push('no-today-cell');
        else if (!t.detailTags.includes('今天')) fails.push('todayTag=' + t.detailTags.join('/'));

        // 未来日：详情必须标「预估」
        const futureOk = await clickCell('.cell[data-state="future"]:not([data-out])');
        await wait();
        const f = await probe();
        if (futureOk) {
          if (!f.detailTags.includes('预估')) fails.push('futureTag=' + f.detailTags.join('/'));
          if (f.detailTitle === t.detailTitle) fails.push('futureNoRefresh');
          // 未来日没有已排定的批次时，卡片必须是「暂无排定的复习」而不是空白
          if (!f.batches) fails.push('futureNoBatchCard');
          else {
            if (f.batches.empty !== '暂无排定的复习') fails.push('futureEmpty=' + f.batches.empty);
            if (f.batches.tag !== '已排定') fails.push('futureBatchTag=' + f.batches.tag);
          }
        }

        // 历史日：点完详情日期必须等于那格的日期
        // 注意用「有记录」的格子（done/partial）：逗号选择器按文档顺序取第一个，
        // 月初那些 empty 格会先被选中，测到的就不是有批次的那天了。
        const pastSel = '.cell[data-state="done"]:not([data-out]), .cell[data-state="partial"]:not([data-out])';
        const pastLabel = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          return el ? el.getAttribute('aria-label') : null;
        }, pastSel);
        if (pastLabel) {
          await clickCell(pastSel);
          await wait();
          const p = await probe();
          const dayPart = pastLabel.split(' ')[0];
          if (!p.detailTitle || !p.detailTitle.startsWith(dayPart)) fails.push('pastTitle=' + p.detailTitle + '≠' + dayPart);
          if (p.detailTags.includes('预估')) fails.push('pastShowsEstimate');

          // 「复习批次」：历史日必须给出具体词表，默认展开第一批，行头可点、能折回去
          const b = p.batches;
          if (!b || b.heads === 0) fails.push('pastNoBatches');
          else {
            if (b.rows === 0) fails.push('batchRows=0');
            if (b.expanded !== 1) fails.push('batchExpanded=' + b.expanded);
            if (b.sumNums !== b.rows) fails.push('batchNum=' + b.sumNums + '≠' + b.rows);
            if (!b.count || !/^\d+ 批 · \d+ 词$/.test(b.count)) fails.push('batchCount=' + b.count);
            if (b.headH < 44) fails.push('batchHeadH=' + b.headH);
            if (b.wordFont < 15) fails.push('batchFont=' + b.wordFont);
            if (b.wordWeight < 500) fails.push('batchWeight=' + b.wordWeight);
            if (b.wordCt !== null && b.wordCt < 4.5) fails.push('batchCt=' + b.wordCt);
            if (b.meaningCt !== null && b.meaningCt < 4.5) fails.push('meaningCt=' + b.meaningCt);
            if (!b.meaningText || b.meaningText === '—') fails.push('meaningMissing');
            if (b.ovf) fails.push('batchOvf');

            await page.evaluate(() => document.querySelector('.batch__head').click());
            await wait();
            const c1 = await probe();
            if (!c1.batches || c1.batches.rows !== 0) fails.push('collapse=' + (c1.batches && c1.batches.rows));
            if (!c1.batches || !c1.batches.aria.split(',').every((v) => v === 'false')) fails.push('ariaCollapse=' + (c1.batches && c1.batches.aria));
            await page.evaluate(() => document.querySelector('.batch__head').click());
            await wait();
            const c2 = await probe();
            if (!c2.batches || c2.batches.rows !== b.rows) fails.push('reexpand=' + (c2.batches && c2.batches.rows));
          }
        }

        // 没记录的那天：不给自己编一个批次卡片，只留一句说明
        const emptyOk = await clickCell('.cell[data-state="empty"]:not([data-out])');
        if (emptyOk) {
          await wait();
          const e = await probe();
          if (e.batches) fails.push('emptyDayHasBatches');
          else {
            const note = await page.evaluate(() => {
              const n = [...document.querySelectorAll('.cal-detail__note')].map((x) => x.textContent.trim());
              return n.find((x) => x.startsWith('那天没有到期复习')) || null;
            });
            if (!note) fails.push('emptyDayNoNote');
          }
        }

        // 翻月：上个月 → 今天格为 0；点「今天」回来 → 今天格恰好 1
        await page.evaluate(() => document.querySelector('.month__nav[aria-label="上个月"]').click());
        await wait();
        const prev = await probe();
        if (prev.n % 7 !== 0 || prev.cols !== 7) fails.push('prevGrid=' + prev.n + '/' + prev.cols);
        if (prev.detailTitle === null) fails.push('prevNoDetail');
        await page.evaluate(() => document.querySelector('.month__today').click());
        await wait();
        const back = await probe();
        if (back.todayCells !== 1) fails.push('backToday=' + back.todayCells);

        // 滚到底：详情不能被 Tab 栏压住
        await page.evaluate(() => {
          const main = document.querySelector('.app__main');
          if (main) main.scrollTop = main.scrollHeight;
        });
        await page.waitForTimeout(160);
        const cover = await page.evaluate(() => {
          const bar = document.querySelector('.tabbar');
          const detail = document.querySelector('.cal-detail');
          if (!bar || !detail) return null;
          const d = detail.getBoundingClientRect();
          const r = bar.getBoundingClientRect();
          const main = document.querySelector('.app__main');
          const atBottom = main.scrollTop + main.clientHeight >= main.scrollHeight - 2;
          return { covered: d.bottom > r.top + 1.5, atBottom };
        });
        if (cover && cover.covered) fails.push('detailUnderBar');

        rec.room = m.room;
        rec.doneCells = m.doneCells;
        rec.futureCells = m.futureCells;
        rec.ct = m.contrast.length ? Math.min(...m.contrast) : null;
        rec.doneCt = m.doneContrast;
        if (cfg.shots) {
          await page.evaluate(() => { const main = document.querySelector('.app__main'); if (main) main.scrollTop = 0; });
          await page.waitForTimeout(120);
          await page.screenshot({ path: `out/${cfg.prefix}-${skin}-${theme}-${w}.png`, scale: 'css' });
        }
        rec.fails = fails;
        results.push(rec);
      }
    }
  }

  const failCount = results.reduce((n, r) => n + r.fails.length, 0);
  const summary = {};
  for (const r of results) for (const f of r.fails) summary[f.split('=')[0]] = (summary[f.split('=')[0]] || 0) + 1;
  return { n: results.length, failCount, summary, results };
}
