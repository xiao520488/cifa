async (page) => {
  // 即时复习轮次模型（schema 2）端到端链，跑在 playwright 的**隔离 context** 里（run-audit-node.js）。
  // 链路：模糊 → 本轮再出现一次 → 跨轮 → 累计 3 次进错词本（仍不出队）→ 认识出队 → 收口 → 入库。
  // 数据纪律：跑前双键快照、跑后逐字节还原并比对 SHA256；隔离 context 本来就不碰真实 profile。
  // 自证伪：localStorage.__selfcheck === '1' 时故意把期望的累计次数写错，脚本必须抛错（runner 退出码 1）。
  const BASE = 'http://127.0.0.1:5173';
  const KEYS = ['cijian.v1', 'cijian.scheduler.v1'];
  const sleep = (ms) => page.waitForTimeout(ms);

  const sha = async (text) =>
    page.evaluate(async (value) => {
      const buf = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }, text);

  const readKeys = () => page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), KEYS);
  const selfcheck = await page.evaluate(() => localStorage.getItem('__selfcheck') === '1');

  // ---- 1. 双键快照 ----
  const before = await readKeys();
  const beforeHash = [await sha(before[0] ?? ''), await sha(before[1] ?? '')];

  const restore = async () => {
    await page.evaluate(({ keys, data }) => {
      keys.forEach((key, index) => {
        if (data[index] === null) localStorage.removeItem(key);
        else localStorage.setItem(key, data[index]);
      });
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('__bak_') || key.startsWith('__p_') || key === '__selfcheck') localStorage.removeItem(key);
      }
    }, { keys: KEYS, data: before });
  };

  try {
    // ---- 2. 首页 → 开始背单词 ----
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.start__actions .btn--primary', { timeout: 15000 });
    const seededUnlearned = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('cijian.scheduler.v1') || '{}');
      return (raw.unlearned || []).length;
    });
    await page.click('.start__actions .btn--primary');
    await page.waitForSelector('.dock', { timeout: 15000 });

    // ---- 3. 翻两批攒够 10 个 → 进入即时复习；之后一路推到总结页 ----
    const toasts = new Set();
    let target = null;
    let fuzzies = 0;
    let groups = 0;
    const trace = [];

    for (let step = 0; step < 60; step += 1) {
      const state = await page.evaluate(() => ({
        immediate: Boolean(document.querySelector('.answer-dock--immediate')),
        dock: Boolean(document.querySelector('.dock .dock__nav--primary')),
        done: Boolean(document.querySelector('.session-done')),
        word: document.querySelector('.flash-card__word')?.textContent?.trim() ?? null,
      }));
      trace.push({ ...state, fuzzies });

      if (state.done) break;

      if (state.immediate) {
        if (target === null) target = state.word;
        // 目标词点 4 次模糊，其余全认识；第二组（尾批 5 个）全认识
        const clickFuzzy = state.word === target && fuzzies < 4;
        await page.click(clickFuzzy ? '.answer-dock--immediate .answer-btn--fuzzy' : '.answer-dock--immediate .answer-btn--known');
        if (clickFuzzy) fuzzies += 1;
        await sleep(140);
        const toast = await page.evaluate(() => document.querySelector('.session-toast')?.textContent?.trim() ?? null);
        if (toast) toasts.add(toast);
        continue;
      }

      if (state.dock) {
        if (groups === 0) groups = 1; // 第一组已入库，回到列表
        await page.click('.dock .dock__nav--primary');
        await sleep(240);
        continue;
      }
      break;
    }

    // 写盘有 400ms 防抖：等够再读（v11 的老坑）
    await sleep(900);

    const doneText = await page.evaluate(() => document.querySelector('.session-done__title')?.textContent?.trim() ?? null);
    const after = await page.evaluate((keys) => {
      const prefs = JSON.parse(localStorage.getItem(keys[0]) || '{}');
      const sch = JSON.parse(localStorage.getItem(keys[1]) || '{}');
      return { prefs, sch };
    }, KEYS);

    const card = after.sch.cards?.[target] ?? null;
    const mistake = after.sch.mistakes?.[target] ?? null;
    const expected = selfcheck ? 3 : 4; // selfcheck：故意写错，断言必须红
    const toastText = [...toasts].join(' | ');

    const checks = {
      toasts: {
        enteredMistakes: toastText.includes('已记入错词本'),
        crossed: toastText.includes('本轮不再出现'),
        nextRound: toastText.includes('第 2 轮'),
        all: [...toasts],
      },
      mistakes: { count: mistake?.count ?? null, source: mistake?.source ?? null, expected },
      card: {
        inMistakes: card?.inMistakes ?? null,
        hard: card?.hard ?? null,
        lastRating: card?.lastRating ?? null,
        lapses: card?.lapses ?? null,
      },
      immediate: {
        active: after.sch.immediate ? (after.sch.immediate.active ?? null) : 'MISSING',
        groups: after.sch.immediate?.stats?.groups ?? null,
        loops: after.sch.immediate?.stats?.loops ?? null,
      },
      pool: { before: seededUnlearned, after: (after.sch.unlearned || []).length },
      summary: doneText,
      fuzzies,
      target,
    };

    const problems = [];
    if (!checks.toasts.enteredMistakes) problems.push('没看到「已记入错词本」toast');
    if (!checks.toasts.crossed) problems.push('没看到「本轮不再出现」toast');
    if (!checks.toasts.nextRound) problems.push('没看到「第 2 轮」toast');
    if (checks.mistakes.count !== checks.mistakes.expected) problems.push(`mistakes.count=${checks.mistakes.count}，期望 ${checks.mistakes.expected}`);
    if (checks.mistakes.source !== 'immediate') problems.push(`mistakes.source=${checks.mistakes.source}`);
    if (checks.card.inMistakes !== true) problems.push('card.inMistakes 不是 true（bug 1 没修好）');
    if (checks.card.hard !== false) problems.push('card.hard 应为 false（hard 只由强制收口设置）');
    if (checks.card.lastRating !== null) problems.push('lastRating 应为 null');
    if (checks.card.lapses !== 0) problems.push('lapses 应为 0');
    if (checks.immediate.active !== null) problems.push('immediate.active 未清空');
    if (checks.immediate.groups !== 2) problems.push(`stats.groups=${checks.immediate.groups}，期望 2（两组各 10 个）`);
    if (checks.immediate.loops !== checks.mistakes.expected) problems.push(`stats.loops=${checks.immediate.loops}，期望 ${checks.mistakes.expected}`);
    if (checks.pool.after !== checks.pool.before - 20) problems.push(`词池 ${checks.pool.before} → ${checks.pool.after}，期望减少 20（两组各 10 个）`);
    if (!checks.summary || !checks.summary.includes('入库')) problems.push(`总结页标题异常：${checks.summary}`);

    // ---- 4. 双键逐字节还原 + SHA256 校验 ----
    await restore();
    const restored = await readKeys();
    const afterRestoreHash = [await sha(restored[0] ?? ''), await sha(restored[1] ?? '')];
    const restoredOk = afterRestoreHash[1] === beforeHash[1] && afterRestoreHash[0] === beforeHash[0];
    if (!restoredOk) problems.push('双键还原后 SHA256 不一致');

    if (problems.length > 0) {
      const error = new Error('E2E 失败：' + problems.join(' | ') + ' ｜ trace=' + JSON.stringify(trace.slice(-6)));
      throw error;
    }

    return {
      ok: true,
      selfcheck,
      target,
      fuzzies,
      checks,
      sha: { beforeHash, afterRestoreHash, restoredOk },
    };
  } catch (error) {
    await restore();
    throw error;
  }
}
