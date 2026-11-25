async (page) => {
  // 附加要求 B：学习流「即时复习」与「总结」两相的 DOM 级回归（不截图，因为答卡会真的落库）。
  // 策略：整份 cijian.v1 快照 → 走完流程 → 逐字节回滚 → 校验回滚一致。
  // 用法：复制到 playwright-mcp/scripts 后 browser_run_code_unsafe({ filename: 'scripts/audit-phases.js' })。文件必须以 } 结尾。
  // 分批：__p_skins / __p_themes 可在 /icon.svg 的 localStorage 里覆盖。
  const PROBE = () => {
    const pc = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
    const ln = (v) => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; };
    const lu = (c) => .2126 * ln(c.r) + .7152 * ln(c.g) + .0722 * ln(c.b);
    const rt = (a, b) => { const x = [lu(a), lu(b)].sort((p, q) => q - p); return (x[0] + .05) / (x[1] + .05); };
    const ovr = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
    const bgo = (e) => { const st = []; let n = e; while (n) { const c = pc(getComputedStyle(n).backgroundColor); if (c && c.a > 0) { st.push(c); if (c.a >= 1) break; } n = n.parentElement; } let base = pc(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255, a: 1 }; for (let i = st.length - 1; i >= 0; i--) base = ovr(st[i], base); return base; };
    const vis = (e) => { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
    const box = (e) => {
      const o = e.getBoundingClientRect();
      let r = { left: o.left, top: o.top, right: o.right, bottom: o.bottom }, sx = false, sy = false, n = e.parentElement;
      while (n && n !== document.documentElement) {
        const c = getComputedStyle(n), b = n.getBoundingClientRect();
        if ((c.overflowX === 'auto' || c.overflowX === 'scroll') && n.scrollWidth > n.clientWidth + 1) sx = true;
        if ((c.overflowY === 'auto' || c.overflowY === 'scroll') && n.scrollHeight > n.clientHeight + 1) sy = true;
        if (c.overflowX === 'hidden' || c.overflowX === 'clip') { r.left = Math.max(r.left, b.left); r.right = Math.min(r.right, b.right); }
        if (c.overflowY === 'hidden' || c.overflowY === 'clip') { r.top = Math.max(r.top, b.top); r.bottom = Math.min(r.bottom, b.bottom); }
        n = n.parentElement;
      }
      return { ...r, w: r.right - r.left, h: r.bottom - r.top, sx, sy };
    };
    const app = document.querySelector('.app').getBoundingClientRect();
    const low = [], small = [], out = [], clip = [], tiny = [], seen = new Set();
    for (const e of document.querySelectorAll('.screen *, .topbar *, .answer-dock *, .session *, .dock *')) {
      if (e.closest('[aria-hidden="true"]') || !vis(e)) continue;
      const c = getComputedStyle(e);
      if ([...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())) {
        const f0 = pc(c.color), b = bgo(e);
        if (f0) {
          const f = f0.a < 1 ? ovr(f0, b) : f0;
          const sz = parseFloat(c.fontSize), big = sz >= 24 || (sz >= 18.66 && +c.fontWeight >= 700), need = big ? 3 : 4.5;
          const cjk = (e.textContent.match(/[一-鿿]/g) || []).length;
          if (cjk > 4 && sz < 14) tiny.push([String(e.className).slice(0, 20), e.textContent.trim().slice(0, 8), sz, cjk]);
          const ratio = rt(f, b), k = c.color + '|' + e.className;
          if (!seen.has(k) && ratio < need - .01) { seen.add(k); low.push([String(e.className).slice(0, 20), e.textContent.trim().slice(0, 8), sz, +ratio.toFixed(2), need]); }
          if (c.overflowX !== 'visible' && e.scrollWidth > e.clientWidth + 2 && c.textOverflow !== 'ellipsis') clip.push([String(e.className).slice(0, 20), e.textContent.trim().slice(0, 8), e.scrollWidth - e.clientWidth]);
        }
      }
      if (e.matches('button,a,input,select,[role="button"],[role="checkbox"],textarea')) {
        const r = e.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) continue;
        const cb = box(e);
        const wShort = Math.min(r.width, cb.w) < 43.5, hShort = Math.min(r.height, cb.h) < 43.5;
        if ((wShort && !(r.width >= 44 && cb.sx)) || (hShort && !(r.height >= 44 && cb.sy))) {
          small.push([String(e.className).slice(0, 20) || e.tagName, Math.round(Math.min(r.width, cb.w)) + '/' + Math.round(r.width), Math.round(Math.min(r.height, cb.h)) + '/' + Math.round(r.height), (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 8)]);
        }
      }
      {
        const r = e.getBoundingClientRect(), cb = box(e);
        if (r.width > 3 && (cb.right < r.right - 1.5 || cb.left > r.left + 1.5) && !cb.sx && (r.right > app.right + 1.5 || r.left < app.left - 1.5)) {
          out.push([String(e.className).slice(0, 20), Math.round(r.left) + '-' + Math.round(r.right), 'clip@' + Math.round(cb.right)]);
        }
      }
    }
    return { ovf: document.documentElement.scrollWidth > document.documentElement.clientWidth, nLow: low.length, low: low.slice(0, 4), nSmall: small.length, small: small.slice(0, 4), nOut: out.length, out: out.slice(0, 4), nClip: clip.length, clip: clip.slice(0, 4), nTiny: tiny.filter((t) => t[2] < 13).length, nWarn: tiny.length, tiny: [...new Map(tiny.map((t) => [t[0] + '|' + t[2], t])).values()].slice(0, 10) };
  };
  const rows = [];
  const KEYS = ['cijian.v1', 'cijian.scheduler.v1'];
  await page.goto('http://127.0.0.1:5173/icon.svg');
  const cfg = await page.evaluate(() => ({
    skins: JSON.parse(localStorage.getItem('__p_skins') || 'null') || ['paper', 'foundry', 'instrument', 'broadsheet', 'bento', 'nocturne', 'desk', 'vinyl'],
    themes: JSON.parse(localStorage.getItem('__p_themes') || 'null') || ['light', 'dark'],
  }));
  const { skins, themes } = cfg;
  // 自愈：上一轮如果被超时打断，状态里会留着「今天已学」的卡。备份前先按 learnedOn 退回 unlearned 队首，
  // 再把两个键存进兄弟键 —— 否则「还原成功」只是还原到了脏状态（本轮就踩过：restored:true 但 cards:10）。
  const scrub = await page.evaluate(() => {
    const K = 'cijian.scheduler.v1';
    const s = JSON.parse(localStorage.getItem(K) || '{}');
    const days = s.days || {};
    let moved = 0;
    for (const day of Object.keys(days)) {
      const learned = (days[day] && days[day].newLearned) || [];
      if (!learned.length) continue;
      s.unlearned = learned.concat(s.unlearned || []);
      for (const w of learned) { if (s.cards && s.cards[w] && s.cards[w].learnedOn === day) { delete s.cards[w]; moved++; } }
      days[day].newLearned = [];
      days[day].immediate = { groups: 0, cards: 0, loops: 0, skipped: 0 };
    }
    if (s.immediate) s.immediate = { pendingCount: 0, pendingWords: [], active: null, stats: { groups: 0, cards: 0, loops: 0, skipped: 0 }, lastAvgLoops: 0 };
    localStorage.setItem(K, JSON.stringify(s));
    return { moved, cards: Object.keys(s.cards || {}).length, unlearned: (s.unlearned || []).length };
  });
  // 关键事实：学习状态不在 cijian.v1，而在 cijian.scheduler.v1（cards / unlearned / days / mistakes）。
  // 只比对前者 = 没守住。这里一次性把两个键备份到兄弟键，每个组合跑完逐字节还原并校验。
  await page.evaluate((ks) => { for (const k of ks) localStorage.setItem('__bak_' + k, localStorage.getItem(k)); }, KEYS);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const skin of skins) {
    for (const theme of themes) {
      await page.goto('http://127.0.0.1:5173/icon.svg');
      await page.evaluate(([a, b]) => { const s = JSON.parse(localStorage.getItem('cijian.v1') || '{}'); s.profile = Object.assign({ stage: 'cet4', batchSize: 5, theme: 'light', skin: 'paper' }, s.profile, { skin: a, theme: b }); localStorage.setItem('cijian.v1', JSON.stringify(s)); }, [skin, theme]);
      await page.goto('http://127.0.0.1:5173/');
      await page.waitForTimeout(360);
      await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('开始背单词')); b && b.click(); });
      await page.waitForTimeout(420);
      const has = (sel) => page.evaluate((x) => !!document.querySelector(x), sel);
      // 读完所有批 → 即时复习（快速轮询，别拿 waitForSelector 的超时当延时用）
      let immOk = false;
      for (let i = 0; i < 12 && !immOk; i++) {
        await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /下一批|看完收尾/.test(x.textContent) && !x.disabled); b && b.click(); });
        await page.waitForTimeout(220);
        if (await has('.answer-dock--immediate')) immOk = true;
        else if (await has('.session-done')) break;
      }
      const imm = await page.evaluate(PROBE);
      // 走到总结。真实流程是「读 2 批 → 考 10 个 → 回 list 读下 2 批 → 再考 10 个 → 总结」，
      // 即时组清空会退回 list 相位，所以两种推进键都要戳：有「认识」就考词，没「认识」就点下一批/看完收尾。
      let doneOk = false;
      for (let i = 0; i < 80 && !doneOk; i++) {
        if (await has('.session-done')) { doneOk = true; break; }
        await page.evaluate(() => {
          const known = [...document.querySelectorAll('.answer-btn')].find((b) => b.textContent.includes('认识') && !b.disabled);
          if (known) { known.click(); return; }
          const next = [...document.querySelectorAll('button')].find((b) => /下一批|看完收尾/.test(b.textContent) && !b.disabled);
          if (next) next.click();
        });
        await page.waitForTimeout(200);
        if (await has('.session-done')) doneOk = true;
      }
      const done = await page.evaluate(PROBE);
      await page.evaluate(() => { const b = document.querySelector('[aria-label="返回首页"], [aria-label="退出本次学习"]'); b && b.click(); });
      await page.waitForTimeout(260);
      // 逐字节回滚两个键 + 校验
      await page.goto('http://127.0.0.1:5173/icon.svg');
      await page.evaluate((ks) => { for (const k of ks) localStorage.setItem(k, localStorage.getItem('__bak_' + k)); }, KEYS);
      await page.goto('http://127.0.0.1:5173/');
      await page.waitForTimeout(300);
      const same = await page.evaluate((ks) => ks.every((k) => localStorage.getItem(k) === localStorage.getItem('__bak_' + k)), KEYS);
      const live = await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}'); return { cards: Object.keys(s.cards || {}).length, unlearned: (s.unlearned || []).length, mistakes: Object.keys(s.mistakes || {}).length, learnedToday: ((s.days || {})['2026-11-25'] || {}).newLearned?.length ?? -1 }; });
      rows.push({ skin, theme, immOk, doneOk, restored: same, live, imm, done });
    }
  }
  const bad = (r) => !r.immOk || !r.doneOk || !r.restored || r.live.cards !== 0 || r.live.learnedToday !== 0 || ['imm', 'done'].some((k) => r[k].ovf || r[k].nLow || r[k].nSmall || r[k].nOut || r[k].nClip || r[k].nTiny);
  const fails = rows.filter(bad);
  return {
    n: rows.length,
    scrub,
    failCount: fails.length,
    warnTiny: rows.reduce((a, r) => a + r.imm.nWarn + r.done.nWarn, 0),
    restoredAll: rows.every((r) => r.restored),
    cleanAll: rows.every((r) => r.live.cards === 0 && r.live.learnedToday === 0 && r.live.unlearned === 3846),
    lastLive: rows[rows.length - 1].live,
    fail: fails.map((r) => ({ skin: r.skin, theme: r.theme, immOk: r.immOk, doneOk: r.doneOk, restored: r.restored, live: r.live, immLow: r.imm.low, immSmall: r.imm.small, immOut: r.imm.out, doneLow: r.done.low, doneSmall: r.done.small, doneOut: r.done.out, immClip: r.imm.clip, doneClip: r.done.clip })),
  };
}
