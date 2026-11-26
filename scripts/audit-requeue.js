/*
 * 正式复习「回队尾」E2E（REVIEW_REQUEUE_SPEC §9.2）。
 *
 * 跑法（必须先复制到 playwright-mcp 目录，那里才有 node_modules/playwright）：
 *   Copy-Item D:\背单词\scripts\audit-requeue.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
 *   node run-audit-node.js D:\背单词\scripts\audit-requeue.js D:\背单词\scripts\cfg-requeue.json
 *
 * 口径（与以往审计脚本不同，见规约 §9.3）：
 *   回看会合法地改 DayRecord.retried，所以「跑前跑后双键 SHA256 相同」做不到。
 *   本脚本改为：跑前留字节 → 跑完断言 → 逐字节写回 → 再算哈希，要求 restored == before。
 *   三个哈希全部进返回值，由 runner 原样打印并落 evidence。
 *
 * 自证伪：
 *   cfg 里传 {"__audit_selfcheck":"1"} 时故意把期望值写错（w1 lapses 期望 0），必须非 0 退出。
 */
async (page) => {
  const BASE = 'http://127.0.0.1:5173';
  const KEY_PREFS = 'cijian.v1';
  const KEY_SCH = 'cijian.scheduler.v1';
  const failures = [];
  const notes = [];
  const badResponses = [];
  page.on('response', (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });
  const fail = (name, detail) => failures.push(detail === undefined ? name : `${name} :: ${JSON.stringify(detail)}`);

  const sha256 = async (text) => {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const studyDay = (offsetDays) => {
    const d = new Date();
    if (d.getHours() < 4) d.setDate(d.getDate() - 1);
    d.setDate(d.getDate() + offsetDays);
    const p = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const readState = () => JSON.parse(localStorage.getItem(KEY_SCH) || '{}');

  /* ---------------------------------------------------------------- 1. 备份 + 造数据 */

  await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
  const beforePrefs = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_PREFS);
  const beforeSch = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_SCH);
  if (!beforeSch) throw new Error('隔离 context 未完成 warm-up，cijian.scheduler.v1 为空');

  const selfcheck = await page.evaluate(() => localStorage.getItem('__audit_selfcheck') === '1');
  const today = studyDay(0);
  const state = JSON.parse(beforeSch);
  const pool = Array.isArray(state.unlearned) ? state.unlearned : [];
  const picked = pool.slice(0, 3);
  if (picked.length < 3) throw new Error('未学池不足 3 个词，无法布置回队尾场景');
  const [w1, w2, w3] = picked;

  const card = (word, interval, due) => ({
    word,
    phase: 'short',
    interval,
    due,
    longInterval: null,
    longAnchor: null,
    reps: 0,
    lapses: 0,
    lastRating: null,
    lastReviewed: null,
    hard: false,
    relearned: false,
    inMistakes: false,
    skippedImmediate: false,
    learnedOn: due,
  });
  state.cards = state.cards || {};
  state.cards[w1] = card(w1, 1, today);
  state.cards[w2] = card(w2, 6, today);
  state.cards[w3] = card(w3, 1, studyDay(-3));
  // warm-up 时应用已经给「今天」拍过到期快照（那时没有卡，snapshotDone 已置真）。
  // 不删掉今天的记录，注入的卡永远不会进 dueSnapshot → 完成率分母恒为 0。
  delete state.days[today];
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [KEY_SCH, JSON.stringify(state)]);

  /* ---------------------------------------------------------------- 2. 进复习 */

  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '开始背单词' }).click();
  await page.waitForSelector('.answer-dock--review', { timeout: 8000 });

  const wordOf = () => page.evaluate(() => (document.querySelector('.flash-card__word') || {}).textContent || '');
  const toastOn = () => page.evaluate(() => document.querySelector('.session-toast') !== null);
  const clickKey = async (kind) => {
    await page.click(`.answer-dock--review .answer-btn--${kind}`);
    // 作答反馈会延迟 180/200ms 才换卡（MOTION_SPEC §3），必须等过这个窗口再读词
    await page.waitForTimeout(260);
  };
  const seen = [];
  const snapshotCard = () => page.evaluate(() => (document.querySelector('.flash-card') || {}).outerHTML || '');

  seen.push(await wordOf());
  const firstCardHtml = await snapshotCard();
  if (seen[0] !== w1) fail('初始队列第一项应是 w1', { got: seen[0], w1 });
  if (await toastOn()) fail('首次作答前不该有 toast');

  // w1 首次：不认识 → 插回看带（w2 之后、逾期 w3 之前）
  await clickKey('unknown');
  if (await toastOn()) fail('首次「不认识」不该弹 toast（不提示）');
  seen.push(await wordOf());
  if (seen[1] !== w2) fail('w1 回看应排在 w2 之后（先走完短期段）', { got: seen[1], w2 });

  // w2 首次：模糊 → 也进回看带
  await clickKey('fuzzy');
  if (await toastOn()) fail('首次「模糊」不该弹 toast');
  seen.push(await wordOf());
  if (seen[2] !== w1) fail('w2 回看后应轮到 w1 第 2 次', { got: seen[2], w1 });

  // w1 第 2 次：认识 → 出队，不改排程
  const repeatCardHtml = await snapshotCard();
  if (repeatCardHtml !== firstCardHtml) {
    fail('回看词 DOM 与首次不一致（D4 要求逐字节相同）', {
      first: firstCardHtml.slice(0, 240),
      repeat: repeatCardHtml.slice(0, 240),
    });
  }
  await clickKey('known');
  if (await toastOn()) fail('回看「认识」不该弹 toast');
  seen.push(await wordOf());

  // w2 第 2 次：不认识 → 进第 3 次
  await clickKey('unknown');
  if (await toastOn()) fail('回看第 2 次不该弹 toast');
  seen.push(await wordOf());
  if (seen[4] !== w2) fail('w2 第 2 次作答后应立刻第 3 次出现', { got: seen[4], w2 });

  // w2 第 3 次：不认识 → 上限，静默出队
  await clickKey('unknown');
  if (await toastOn()) fail('第 3 次（上限）不该弹 toast');
  seen.push(await wordOf());
  if (seen[5] !== w3) fail('w2 到上限后应轮到逾期词 w3', { got: seen[5], w3 });

  // w3（逾期）首次：不认识 → 游标已在逾期段，回看插到 index+1（马上再问）
  await clickKey('unknown');
  if (await toastOn()) fail('逾期词首次「不认识」不该弹 toast');
  seen.push(await wordOf());
  if (seen[6] !== w3) fail('逾期词答错后应马上再问（§8.10）', { got: seen[6], w3 });

  // w3 第 2 次：认识 → 出队
  await clickKey('known');
  const stillReview = await page.evaluate(() => document.querySelector('.answer-dock--review') !== null);
  if (stillReview) fail('队列应已走空，复习 dock 不该还在', { seen });

  notes.push({ seen, expect: [w1, w2, w1, w2, w2, w3, w3] });
  if (JSON.stringify(seen) !== JSON.stringify([w1, w2, w1, w2, w2, w3, w3])) {
    fail('作答顺序不符', { seen });
  }

  /* ---------------------------------------------------------------- 3. 断言数据（localStorage） */

  await page.waitForTimeout(900); // 等 400ms 防抖落盘
  const afterRunSch = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_SCH);
  const afterRunPrefs = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_PREFS);
  const final = JSON.parse(afterRunSch);
  const day = (final.days || {})[today] || {};
  const c1 = (final.cards || {})[w1] || {};
  const c2 = (final.cards || {})[w2] || {};
  const c3 = (final.cards || {})[w3] || {};
  const mk = final.mistakes || {};

  const expectLapses = selfcheck ? 0 : 1; // 自证伪：selfcheck 时故意期望错
  if (c1.interval !== 1 || c1.due !== studyDay(1) || c1.lapses !== expectLapses) {
    fail('w1 应停在首次「不认识」的排程', { interval: c1.interval, due: c1.due, lapses: c1.lapses, expectLapses });
  }
  if (c1.lastRating !== 'unknown' || c1.reps !== 1 || c1.inMistakes !== true) {
    fail('w1 的 lastRating/reps/inMistakes 不对', { lastRating: c1.lastRating, reps: c1.reps, inMistakes: c1.inMistakes });
  }
  if (c2.interval !== 2 || c2.due !== studyDay(2) || c2.lapses !== 0 || c2.lastRating !== 'fuzzy') {
    fail('w2 应停在首次「模糊」的排程（6→2）', { interval: c2.interval, due: c2.due, lapses: c2.lapses, lastRating: c2.lastRating });
  }
  if (c3.interval !== 1 || c3.due !== studyDay(1) || c3.lapses !== 1) {
    fail('w3（逾期）应停在首次「不认识」', { interval: c3.interval, due: c3.due, lapses: c3.lapses });
  }
  if (day.accCount !== 3) fail('准确率次数应只记 3 次（首次）', { accCount: day.accCount });
  if (Math.abs((day.accScore ?? -1) - 0.5) > 1e-9) fail('准确率应 = 0 + 0.5 + 0', { accScore: day.accScore });
  if (day.retried !== 4) fail('重试应记 4 次（w1r2/w2r2/w2r3/w3r2）', { retried: day.retried });
  if ((day.dueSnapshot || []).length !== 2) fail('到期快照只含今天到期的 2 个词', { dueSnapshot: day.dueSnapshot });
  if ((day.doneToday || []).length !== 2) fail('已完成只记 snapshot 内的 2 个词', { doneToday: day.doneToday });
  if (!mk[w1] || mk[w1].count !== 1 || mk[w1].source !== 'review') fail('w1 应进错题本 1 次', mk[w1]);
  if (mk[w2]) fail('w2（模糊）不该进错题本', mk[w2]);
  if (!mk[w3] || mk[w3].count !== 1) fail('w3 应进错题本 1 次', mk[w3]);
  if (afterRunPrefs !== beforePrefs) fail('cijian.v1 不该变');

  const afterRunSha = await sha256(afterRunSch);

  /* ---------------------------------------------------------------- 4. 还原 + 三哈希 */

  await page.goto(BASE + '/icon.svg', { waitUntil: 'domcontentloaded' });
  await page.evaluate(
    ([kp, ks, vp, vs]) => {
      localStorage.setItem(kp, vp);
      localStorage.setItem(ks, vs);
    },
    [KEY_PREFS, KEY_SCH, beforePrefs, beforeSch],
  );
  const restoredSch = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_SCH);
  const restoredPrefs = await page.evaluate((k) => localStorage.getItem(k) || '', KEY_PREFS);

  const beforeSha = await sha256(beforeSch);
  const restoredSha = await sha256(restoredSch);
  if (restoredSha !== beforeSha) fail('还原后调度键哈希不等于跑前', { beforeSha, restoredSha });
  if (restoredPrefs !== beforePrefs) fail('还原后偏好键字节不等于跑前');

  const residual = await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('__bak_') || k.startsWith('__p_')));
  if (residual.length > 0) fail('残留临时键', residual);

  if (failures.length > 0) {
    const err = new Error(`回队尾 E2E ${failures.length} 项失败：${failures.slice(0, 6).join(' | ')}`);
    err.detail = { failures, notes };
    throw err;
  }

  return {
    ok: true,
    words: { w1, w2, w3 },
    today,
    seen,
    badResponses,
    hashes: { before: beforeSha, afterRun: afterRunSha, restored: restoredSha },
    data: {
      w1: { interval: c1.interval, due: c1.due, lapses: c1.lapses, lastRating: c1.lastRating, inMistakes: c1.inMistakes },
      w2: { interval: c2.interval, due: c2.due, lapses: c2.lapses, lastRating: c2.lastRating },
      w3: { interval: c3.interval, due: c3.due, lapses: c3.lapses },
      acc: { score: day.accScore, count: day.accCount, retried: day.retried },
      dueSnapshot: (day.dueSnapshot || []).length,
      doneToday: (day.doneToday || []).length,
      mistakes: Object.fromEntries(Object.entries(mk).map(([k, v]) => [k, { count: v.count, source: v.source }])),
    },
  };
}
