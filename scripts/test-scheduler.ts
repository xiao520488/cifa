/**
 * 调度模块单元测试（`pnpm test:scheduler`）。
 *
 * 覆盖需求 §十.4 要求的 14 个必测点，并补上批次装配、完成率分母、重试、
 * 断签、持久化清洗等回归点。全部是纯内存测试，不依赖浏览器与真实时钟。
 */

import {
  Scheduler,
  IDLE_DAY_NOTE,
  MAX_LIMIT_ZERO_NOTE,
  addDays,
  answerImmediate,
  calendarDayLoad,
  calendarReviewNote,
  computeRecentAccuracy,
  createCard,
  describeLongForecast,
  diffDays,
  emptyState,
  explainCalendarNewWords,
  explainMaxLimitChange,
  idleDayNote,
  loadScheduler,
  makeGroup,
  newWordHeadline,
  nextWeekday,
  sanitizeScheduler,
  saveScheduler,
  toStudyDay,
  applyAdaptation,
  applyLongReview,
  applyShortReview,
} from '../src/lib/scheduler/index.ts';
import type {
  AdaptInput,
  CalendarDay,
  ImmediateGroup,
  LongBatch,
  SchedulerState,
  StudyDay,
} from '../src/lib/scheduler/index.ts';

let failures = 0;

function check(name: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    console.log(`✓ ${name}`);
  } else {
    failures += 1;
    console.log(`✗ ${name}`, detail === undefined ? '' : JSON.stringify(detail));
  }
}

function eq(name: string, actual: unknown, expected: unknown): void {
  check(name, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });
}

/** 固定某天早上 9 点（学习日内）。 */
function at(day: string, hour = 9, minute = 0): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, hour, minute);
}

function schedulerOn(day: string, goal = 20, pool: string[] = []): Scheduler {
  const scheduler = Scheduler.create(goal, { now: () => at(day) });
  scheduler.seed(pool);
  return scheduler;
}

function moveTo(scheduler: Scheduler, day: string): Scheduler {
  return new Scheduler(scheduler.snapshot(), { now: () => at(day) });
}

function adapt(overrides: Partial<AdaptInput>) {
  const base: AdaptInput = {
    currentLimit: 20,
    maxLimit: 40,
    recentAcc: 0.95,
    completionRate: 1,
    consecutiveGoodDays: 0,
    overdueBacklog: 0,
    dueTotal: 10,
    activity: { reviews: 10, newWords: 0, immediateCards: 0 },
    immediateGroups: 0,
    immediateAvgLoops: null,
  };
  return applyAdaptation({ ...base, ...overrides });
}

const words10 = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet'];

// ---------------------------------------------------------------- 一、自适应规则

// T1 正确率 < 70
{
  const out = adapt({ recentAcc: 0.62, consecutiveGoodDays: 2 });
  eq('T1 正确率 62% → 新词 0', out.newWordLimit, 0);
  eq('T1 动作是 pause', out.action, 'pause');
  eq('T1 基线不被清零', out.currentLimit, 20);
  eq('T1 连续优秀清零', out.consecutiveGoodDays, 0);
  check('T1 标记 → pauseByAccuracy', out.flags.pauseByAccuracy === true);
}

// T2 正确率 70~80
{
  const out = adapt({ recentAcc: 0.75 });
  eq('T2 正确率 75% → 20×0.75=15', out.newWordLimit, 15);
  eq('T2 动作是 decrease', out.action, 'decrease');
  eq('T2 基线降到 15', out.currentLimit, 15);
}

// T3 正确率 80~90
{
  const out = adapt({ recentAcc: 0.85, consecutiveGoodDays: 2 });
  eq('T3 正确率 85% → 维持 20', out.newWordLimit, 20);
  eq('T3 动作是 maintain', out.action, 'maintain');
  eq('T3 连续优秀清零', out.consecutiveGoodDays, 0);
}

// T4 正确率 ≥90 但未满 3 天
{
  const out = adapt({ recentAcc: 0.93, consecutiveGoodDays: 0 });
  eq('T4 优秀第 1 天 → 维持 20', out.newWordLimit, 20);
  eq('T4 连续优秀记 1 天', out.consecutiveGoodDays, 1);
  check('T4 不加量', out.flags.increased === false);
}

// T5 连续 3 天优秀 + 完成率达标 → +5
{
  const out = adapt({ recentAcc: 0.94, consecutiveGoodDays: 2, completionRate: 0.98 });
  eq('T5 连续第 3 天 → 20+5=25', out.newWordLimit, 25);
  eq('T5 动作是 increase', out.action, 'increase');
  eq('T5 增量后连续计数归零', out.consecutiveGoodDays, 0);
  eq('T5 基线抬到 25', out.currentLimit, 25);
}

// T6 完成率 < 90 → 不得加量
{
  const out = adapt({ recentAcc: 0.95, consecutiveGoodDays: 2, completionRate: 0.88 });
  eq('T6 完成率 88% → 不加量，维持 20', out.newWordLimit, 20);
  eq('T6 连续优秀清零', out.consecutiveGoodDays, 0);
  check('T6 标记 blockedIncrease', out.flags.blockedIncrease === true);
}

// T7 完成率 < 80 → 乘 0.8
{
  const out = adapt({ recentAcc: 0.95, completionRate: 0.75 });
  eq('T7 完成率 75% → 20×0.8=16', out.newWordLimit, 16);
  eq('T7 动作是 decrease', out.action, 'decrease');
}

// T8 达到 maxLimit 封顶
{
  const out = adapt({ currentLimit: 20, maxLimit: 22, recentAcc: 0.95, consecutiveGoodDays: 2 });
  eq('T8 22 封顶（不是 25）', out.newWordLimit, 22);
  eq('T8 结果不超过 maxLimit', out.currentLimit, 22);
}

// T9 逾期 ≥30 → 提醒但不减新词
{
  const out = adapt({ recentAcc: 0.92, overdueBacklog: 34 });
  eq('T9 逾期 34 个 → 新词仍 20', out.newWordLimit, 20);
  check('T9 打提醒标记', out.flags.overdueWarning === true);
  check('T9 没有硬停', out.flags.overduePause === false);
}

// T10 逾期 ≥50 → 强制暂停
{
  const out = adapt({ recentAcc: 0.95, completionRate: 1, overdueBacklog: 55 });
  eq('T10 逾期 55 个 → 新词 0', out.newWordLimit, 0);
  eq('T10 动作是 pause', out.action, 'pause');
  check('T10 标记 overduePause', out.flags.overduePause === true);
}

// T17 断签日不叠乘
{
  const out = adapt({
    recentAcc: 0.85,
    completionRate: 0,
    dueTotal: 40,
    activity: { reviews: 0, newWords: 0, immediateCards: 0 },
  });
  eq('T17 断签日基线不乘 0.8，维持 20', out.newWordLimit, 20);
  check('T17 标记 absentDay', out.flags.absentDay === true);
  eq('T17 连续优秀清零', out.consecutiveGoodDays, 0);
}

// 无数据日
{
  const out = adapt({ recentAcc: null, activity: { reviews: 0, newWords: 0, immediateCards: 0 }, dueTotal: 0 });
  eq('无正式复习数据 → 按基线起步', out.newWordLimit, 20);
  check('无数据标记', out.flags.noAccuracyData === true);
}

// recentAcc 计算：今天 0.5 / 昨天 0.3 / 前天 0.2 加权
{
  const result = computeRecentAccuracy(
    [
      { score: 10, count: 10 }, // 今天 100%
      { score: 0, count: 10 }, // 昨天 0%
      { score: 5, count: 10 }, // 前天 50%
    ],
    { score: 50, count: 100 },
  );
  const last3 = 0.5 * 1 + 0.3 * 0 + 0.2 * 0.5;
  check('近 3 天加权正确率 = 0.6', Math.abs((result.last3 ?? 0) - last3) < 1e-9, result);
  const expected = 0.7 * last3 + 0.3 * 0.5;
  check('recentAcc = 0.7×近3天 + 0.3×历史', Math.abs((result.recentAcc ?? 0) - expected) < 1e-9, result);
}

// ---------------------------------------------------------------- 二、学习日边界

// T13 凌晨 4 点
{
  eq('T13 03:59 仍算前一天', toStudyDay(new Date(2026, 10, 24, 3, 59)), '2026-11-23');
  eq('T13 04:00 算新一天', toStudyDay(new Date(2026, 10, 24, 4, 0)), '2026-11-24');
  eq('T13 跨月边界 12-01 01:30 → 11-30', toStudyDay(new Date(2026, 11, 1, 1, 30)), '2026-11-30');
}

// ---------------------------------------------------------------- 三、卡片流转

// T19 模糊回退
{
  const card = createCard('alpha', '2026-11-01');
  const sixDays = { ...card, interval: 6 as const, due: '2026-11-07' };
  const out = applyShortReview(sixDays, 'fuzzy', '2026-11-07');
  eq('T19 6 天批次模糊 → 打回 2 天', out.interval, 2);
  eq('T19 新到期日 = 复习日 + 2', out.due, '2026-11-09');
  const fifteen = applyShortReview({ ...card, interval: 15 as const }, 'fuzzy', '2026-11-20');
  eq('T19 15 天模糊 → 回 6 天', fifteen.interval, 6);
}

// T20 不认识 → 1 天 + 错词本
{
  const card = createCard('bravo', '2026-11-01');
  const out = applyShortReview({ ...card, interval: 6 as const }, 'unknown', '2026-11-10');
  eq('T20 不认识 → 1 天批次', out.interval, 1);
  eq('T20 明天再见', out.due, '2026-11-11');
  check('T20 进错词本', out.inMistakes === true);
  eq('T20 记一次遗忘', out.lapses, 1);
}

// 15 天答对 → 进长期 30 天
{
  const card = createCard('charlie', '2026-11-01');
  const out = applyShortReview({ ...card, interval: 15 as const }, 'known', '2026-11-20');
  eq('15 天答对 → 长期 30 天节点', out.longInterval, 30);
  eq('长期阶段', out.phase, 'long');
  eq('长期用 longAnchor 记日', out.longAnchor, '2026-11-20');
}

// T21 长期 30 答对 → 90
{
  const card = createCard('delta', '2026-01-01');
  const long30 = {
    ...card,
    phase: 'long' as const,
    interval: 15 as const,
    due: null,
    longInterval: 30 as const,
    longAnchor: '2026-10-01',
  };
  const out = applyLongReview(long30, 'known', '2026-11-01');
  eq('T21 长期 30 答对 → 90 天', out.longInterval, 90);
  eq('T21 90 天节点锚点', out.longAnchor, '2026-11-01');
}

// T21b 长期答错 → 打回短期 1 天
{
  const card = createCard('echo', '2026-01-01');
  const long90 = { ...card, phase: 'long' as const, due: null, longInterval: 90 as const, longAnchor: '2026-08-01' };
  const out = applyLongReview(long90, 'unknown', '2026-11-01');
  eq('T21b 长期答错 → short', out.phase, 'short');
  eq('T21b 重新从 1 天开始', out.interval, 1);
  eq('T21b 长期节点清空', out.longInterval, null);
}

// ---------------------------------------------------------------- 四、引擎：即时复习

// T11 即时复习轮次：模糊一次回队尾、第二次跨轮、第 2 轮只考它
{
  const s = schedulerOn('2026-11-24', 20, words10);
  for (const word of words10) s.learnNewWord(word);
  eq('T11 累计 10 个新词', s.state.immediate.pendingCount, 10);
  check('T11 触发即时复习', s.endNewWordBatch().shouldReviewImmediately === true);
  const group = s.startImmediate();
  eq('T11 组大小 = 整批 10', group?.words.length, 10);

  const first = words10[0];
  const once = s.answerImmediate(first, false);
  eq('T11 第一次模糊：回本轮队尾', once!.group.queue[once!.group.queue.length - 1], first);
  eq('T11 第一次模糊不记账', s.state.mistakes[first], undefined);
  const twice = s.answerImmediate(first, false);
  check('T11 第二次模糊：跨轮', twice!.crossed === true);
  eq('T11 跨轮后不在本轮队列', twice!.group.queue.includes(first), false);
  eq('T11 跨轮后进 crossRound', twice!.group.crossRound.join(','), first);
  eq('T11 不在队列里的词答不了', s.answerImmediate(first, false), null);

  while (s.state.immediate.active && s.state.immediate.active.round === 1) {
    s.answerImmediate(s.state.immediate.active.queue[0], true);
  }
  eq('T11 第 2 轮只考模糊过的词', s.state.immediate.active?.queue.join(','), first);
  s.answerImmediate(first, true);
  eq('T11 答认识后收口', s.state.immediate.active, null);

  eq('T11 即时复习不进正式正确率', s.state.days['2026-11-24'].accCount, 0);
  eq('T11 组统计 cards=10', s.state.immediate.stats.cards, 10);
  eq('T11 累计模糊 2 次', s.state.immediate.stats.loops, 2);
  check('T11 平均模糊 0.2 次', Math.abs((s.state.immediate.lastAvgLoops ?? 0) - 0.2) < 1e-9, s.state.immediate);

  const tomorrow = moveTo(s, '2026-11-25').plan('2026-11-25');
  const batch = tomorrow.shortTermBatches.find((item) => item.daysAgo === 1);
  check('T11 每个词都进明天 1 天批次', batch !== undefined && batch.words.includes(first));
}

// T16 跳过即时复习 → 次日 1 天批次优先
{
  const pool = [...words10, 'kilo', 'lima'];
  const s = schedulerOn('2026-11-24', 20, pool);
  for (const word of words10.slice(0, 8)) s.learnNewWord(word);
  const skipped = s.skipImmediate();
  eq('T16 跳过 8 个词的即时复习', skipped.length, 8);
  for (const word of words10.slice(8)) s.learnNewWord(word);
  s.learnNewWord('kilo');
  s.learnNewWord('lima');

  const plan = s.plan('2026-11-25');
  const batch = plan.shortTermBatches.find((item) => item.daysAgo === 1);
  eq('T16 次日 1 天批次共 12 个词', batch?.wordCount, 12);
  const head = (batch?.words ?? []).slice(0, 8).sort();
  eq('T16 跳过的词排在批次最前', head, [...words10.slice(0, 8)].sort());
}

// ---------------------------------------------------------------- 五、引擎：旧账与池子

// T12 逾期超过 7 天（第 8 天）→ 归入未学新词池
{
  const s = schedulerOn('2026-11-24', 20, ['alpha', 'bravo']);
  s.learnNewWord('alpha'); // 次日 11-25 到期
  const later = moveTo(s, '2026-12-03'); // 逾期 8 天
  const moved = later.sweepOverdue('2026-12-03');
  eq('T12 逾期 8 天 → 移出逾期池', moved, ['alpha']);
  check('T12 不再是学习中的卡', later.state.cards.alpha === undefined);
  check('T12 回到未学新词池', later.newWordPool().includes('alpha'));
  check('T12 保留 relearned 标记', later.state.relearned.alpha === true);
  later.learnNewWord('alpha');
  check('T12 重新学到时带 relearned', later.state.cards.alpha.relearned === true);
}

// 逾期池排序：从短到长
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  for (const word of ['a', 'b', 'c']) s.learnNewWord(word);
  s.state.cards.a.due = '2026-11-22';
  s.state.cards.b.due = '2026-11-18';
  s.state.cards.c.due = '2026-11-20';
  const plan = s.plan('2026-11-24');
  eq('逾期池按逾期天数从短到长', plan.overduePool.map((item) => item.overdueDays), [2, 4, 6]);
  eq('逾期池带来源日期', plan.overduePool.map((item) => item.sourceDate), ['2026-11-22', '2026-11-20', '2026-11-18']);
  eq('逾期不计入今日到期', plan.totals.dueToday, 0);
}

// T14 360 天归档
{
  const s = schedulerOn('2026-11-24', 20, ['omega']);
  s.learnNewWord('omega');
  const card = s.state.cards.omega;
  card.phase = 'long';
  card.longInterval = 360;
  card.longAnchor = '2025-11-01';
  card.due = null;

  const out = s.submitReview('omega', 'known');
  check('T14 360 天答对 → 归档', out.archived && s.state.cards.omega.phase === 'archived');
  const plan = s.plan('2026-11-24');
  const inBatches = [...plan.shortTermBatches, ...plan.longTermBatches].some((item) => item.words.includes('omega'));
  check('T14 归档后不进任何自动批次', !inBatches);
  check('T14 归档库可手动抽查', s.sampleArchived('omega'));
}

// T15 手动强制改量不动基线
{
  const s = schedulerOn('2026-11-24', 20, words10);
  s.setMaxLimit(60);
  eq('T15 改上限不改基线', s.state.currentLimit, 20);
  const applied = s.setManualNewWords(45);
  eq('T15 手动值生效', applied, 45);
  eq('T15 计划显示 45', s.plan('2026-11-24').newWordLimit, 45);
  eq('T15 基线仍是 20', s.state.currentLimit, 20);
  s.clearManualNewWords();
  eq('T15 清掉手动值回到基线', s.plan('2026-11-24').newWordLimit, 20);
}

// ---------------------------------------------------------------- 六、批次装配

// T18 四个滚动批次
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  for (const word of ['a', 'b', 'c', 'd']) s.learnNewWord(word);
  const intervals: Array<[string, 1 | 2 | 6 | 15]> = [
    ['a', 1],
    ['b', 2],
    ['c', 6],
    ['d', 15],
  ];
  for (const [word, interval] of intervals) {
    s.state.cards[word].interval = interval;
    s.state.cards[word].due = '2026-11-24';
  }

  const plan = s.plan('2026-11-24');
  eq('T18 今天到期 4 个词', plan.totals.dueToday, 4);
  eq('T18 批次按 1/2/6/15 排列', plan.shortTermBatches.map((item) => item.daysAgo), [1, 2, 6, 15]);
  eq('T18 每个批次带来源日期', plan.shortTermBatches.map((item) => item.sourceDate), [
    '2026-11-23',
    '2026-11-22',
    '2026-11-18',
    '2026-11-09',
  ]);
}

// T29 周日 30 天长期批次
{
  const sunday = nextWeekday('2026-11-24', 0);
  const s = schedulerOn('2026-11-24', 20, ['delta']);
  s.learnNewWord('delta');
  const card = s.state.cards.delta;
  card.phase = 'long';
  card.longInterval = 30;
  card.longAnchor = addDays(sunday, -32);
  card.due = null;

  const plan = s.plan(sunday);
  const batch = plan.longTermBatches.find((item) => item.type === '30d');
  check('T29 周日出现 30 天批次', batch !== undefined && batch.words.includes('delta'), plan.longTermBatches);
  eq('T29 长期批次不影响今日到期数', plan.totals.dueToday, 0);
  check('T29 长期批次不进短期待复习', plan.shortTermBatches.every((item) => !item.words.includes('delta')));
}

// T28 日历 8 天
{
  const s = schedulerOn('2026-11-24', 20, words10);
  s.learnNewWord('alpha');
  const calendar = s.calendar(8);
  eq('T28 日历覆盖今天 + 未来 7 天', calendar.length, 8);
  check('T28 第一天是今天', calendar[0].isToday === true);
  check('T28 未来日期标为预估', calendar[7].estimated === true);
  eq('T28 次日有 1 天前批次', calendar[1].shortTermBatches[0]?.daysAgo, 1);
}

// ---------------------------------------------------------------- 七、结算与完成率

// T22 重试不拉高正确率、不改排程
{
  const s = schedulerOn('2026-11-24', 20, ['romeo']);
  s.learnNewWord('romeo');
  const tomorrow = moveTo(s, '2026-11-25');
  tomorrow.plan('2026-11-25');

  const first = tomorrow.submitReview('romeo', 'unknown');
  eq('T22 不认识 → 打回明天', first.nextDue, '2026-11-26');
  const record = tomorrow.state.days['2026-11-25'];
  eq('T22 只记 1 次作答', record.accCount, 1);
  eq('T22 得 0 分', record.accScore, 0);

  const retry = tomorrow.submitReview('romeo', 'known', { isRetry: true });
  eq('T22 重试不计入正确率', retry.counted, false);
  eq('T22 正确率次数没变', record.accCount, 1);
  eq('T22 重试不覆盖排程', tomorrow.state.cards.romeo.due, '2026-11-26');
  eq('T22 只记一次重试', record.retried, 1);
}

// T25 完成率分母 = 当天到期快照
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  for (const word of ['a', 'b', 'c', 'd']) s.learnNewWord(word);
  for (const word of ['a', 'b', 'c', 'd']) {
    s.state.cards[word].interval = 1;
    s.state.cards[word].due = '2026-11-24';
  }
  s.plan('2026-11-24');
  s.submitReview('a', 'known');
  s.submitReview('b', 'known');

  const report = s.settle('2026-11-24');
  eq('T25 完成率 = 2/4 = 0.5', report.result.metrics.completionRate, 0.5);
  eq('T25 完成率 <80% → 20×0.8=16', report.result.newWordLimit, 16);
  eq('T25 结算给下一天', report.plannedDay, '2026-11-25');
  eq('T25 计划立刻生效', s.plan('2026-11-25').newWordLimit, 16);
}

// 同一天重复结算不会把基线再压一次 / 连击再加一次
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b']);
  for (const word of ['a', 'b']) s.learnNewWord(word);
  for (const word of ['a', 'b']) {
    s.state.cards[word].interval = 1;
    s.state.cards[word].due = '2026-11-24';
  }
  s.plan('2026-11-24');
  s.submitReview('a', 'known');
  const first = s.settle('2026-11-24');
  const baseline = s.state.currentLimit;
  const second = s.settle('2026-11-24');
  eq('重复结算返回同一份结果', second.result.newWordLimit, first.result.newWordLimit);
  eq('重复结算不动基线', s.state.currentLimit, baseline);
  eq('重复结算不加连击', s.state.consecutiveGoodDays, 0);
}

// T24 结算 JSON 形状
{
  const s = schedulerOn('2026-11-24', 20, words10);
  for (const word of words10) s.learnNewWord(word);
  s.plan('2026-11-24');
  for (const word of words10) s.submitReview(word, 'known');
  const report = s.settle('2026-11-24');
  const keys = Object.keys(report.result).sort();
  eq('T24 JSON 只有规格要求的 5 个键', keys, ['action', 'dailyPlan', 'metrics', 'newWordLimit', 'reason']);
  check('T24 action 合法', ['pause', 'decrease', 'maintain', 'increase'].includes(report.result.action));
  check('T24 metrics 都是数字', Object.values(report.result.metrics).every((value) => typeof value === 'number'));
  check('T24 明日批次是数组', Array.isArray(report.result.dailyPlan.shortTermBatches));
  check('T24 reason 是中文解释', typeof report.result.reason === 'string' && report.result.reason.length > 4);
  eq('T24 全对 → 正确率 1', report.result.metrics.recentAcc, 1);
}

// 连续 3 天优秀后增量（走完整结算链路）
{
  const start = '2026-11-20';
  let nowDay = start;
  const s = Scheduler.create(20, { now: () => at(nowDay) });
  s.setMaxLimit(40);
  s.seed(['w0', 'w1', 'w2']);

  // 每天先复习完到期的词，再学当天的 1 个新词（复习优先闸会挡住反过来的顺序）
  for (let offset = 0; offset < 4; offset += 1) {
    nowDay = addDays(start, offset);
    const plan = s.plan(nowDay);
    for (const batch of plan.shortTermBatches) {
      for (const word of batch.words) s.submitReview(word, 'known', { day: nowDay });
    }
    const fresh = `w${offset}`;
    if (s.newWordPool().includes(fresh)) s.learnNewWord(fresh, nowDay);
    s.settle(nowDay);
  }

  eq('连续 3 天优秀 → 新词 20+5=25，第 4 天计划 25', s.plan('2026-11-24').newWordLimit, 25);
  eq('连续 3 天优秀 → 基线抬到 25', s.state.currentLimit, 25);
}

// 空转日（没有到期复习）不算优秀日，不会凭历史正确率白拿增量
{
  let nowDay = '2026-11-24';
  const s = Scheduler.create(20, { now: () => at(nowDay) });
  s.setMaxLimit(40);
  s.seed(['a', 'b']);
  s.learnNewWord('a', nowDay);
  s.state.cards.a.interval = 1;
  s.state.cards.a.due = nowDay;
  s.plan(nowDay);
  s.submitReview('a', 'known', { day: nowDay });
  s.settle(nowDay);
  eq('第 1 天全对 → 连击 1', s.state.consecutiveGoodDays, 1);

  for (const day of ['2026-11-25', '2026-11-26', '2026-11-27']) {
    nowDay = day;
    s.plan(day);
    s.settle(day);
  }
  eq('空转 3 天不攒连击', s.state.consecutiveGoodDays, 0);
  eq('空转 3 天不涨新词量', s.plan('2026-11-28').newWordLimit, 20);
  check('空转日被标 idleDay', s.state.days['2026-11-26']?.settlement !== null);
}

// 预览未来某天不该冻结那天的到期快照
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b']);
  s.plan('2026-11-25'); // 早上先看明天的日历
  s.learnNewWord('a');
  s.learnNewWord('b');
  const tomorrow = moveTo(s, '2026-11-25');
  const nextPlan = tomorrow.plan('2026-11-25');
  eq('未来预览不冻结快照：明天仍能看到 2 个 1 天前批次', nextPlan.totals.dueToday, 2);
  tomorrow.submitReview('a', 'known');
  tomorrow.submitReview('b', 'known');
  eq('明天完成率仍是 2/2', tomorrow.settle('2026-11-25').result.metrics.completionRate, 1);
}

// T17b 断签回来：基线不叠乘、逾期多了也不一次性堆
{
  const s = schedulerOn('2026-11-20', 20, words10);
  for (const word of words10.slice(0, 6)) s.learnNewWord(word, '2026-11-20');
  const back = moveTo(s, '2026-11-24');
  const plan = back.plan('2026-11-24');
  check('T17b 断签回来先看到逾期池', plan.overduePool.length > 0, plan.overduePool);
  check('T17b 逾期不滚进今日到期', plan.totals.dueToday === 0);
  const report = back.settle('2026-11-23');
  eq('T17b 缺席日基线不叠乘', back.state.currentLimit, 20);
  eq('T17b 缺席日连续优秀清零', back.state.consecutiveGoodDays, 0);
  check('T17b 缺席日 action 不是 increase', report.result.action !== 'increase');
}

// 新词没背完：不补、不进逾期池
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  s.setMaxLimit(20);
  const planned = s.nextNewWords();
  eq('计划抽出 4 个（池子只有 4 个）', planned.length, 4);
  s.learnNewWord('a'); // 只学了 1 个
  const nextDay = moveTo(s, '2026-11-25');
  eq('没学的新词留在池子里', nextDay.newWordPool().length, 3);
  eq('没学的新词不进逾期池', nextDay.plan('2026-11-25').overduePool.length, 0);
}

// 复习闸：到期复习没做完不给新词
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  for (const word of ['a', 'b']) s.learnNewWord(word);
  for (const word of ['a', 'b']) {
    s.state.cards[word].interval = 1;
    s.state.cards[word].due = '2026-11-24';
  }
  s.plan('2026-11-24');
  const before = s.allowance('2026-11-24');
  eq('复习没做完 → 新词 0', before.allowed, 0);
  s.submitReview('a', 'known');
  s.submitReview('b', 'known');
  eq('复习做完 → 新词恢复计划值（池里剩 2 个）', s.allowance('2026-11-24').allowed, 2);
}

// ---------------------------------------------------------------- 七点五、审查补测

// 同一个词同一天只能作答一次（否则能连续跳档、重复计分）
{
  const s = schedulerOn('2026-11-24', 20, ['solo']);
  s.learnNewWord('solo');
  const tomorrow = moveTo(s, '2026-11-25');
  tomorrow.plan('2026-11-25');
  const first = tomorrow.submitReview('solo', 'known');
  const again = tomorrow.submitReview('solo', 'known');
  check('同一词同一天第二次作答被拒', again.ok === false && (again.reason ?? '').includes('已经复习过'), again.reason);
  eq('只记 1 次作答', tomorrow.state.days['2026-11-25'].accCount, 1);
  eq('排程只前进一次', tomorrow.state.cards.solo.due, first.nextDue);

  const early = schedulerOn('2026-11-24', 20, ['wait']);
  early.learnNewWord('wait'); // 明天才到期
  const notYet = early.submitReview('wait', 'known');
  check('没到期就作答被拒', notYet.ok === false, notYet.reason);
}

// plan / 日历 / allowance 用同一份预算，逾期 ≥50 时不会出现「计划 20」又「先清逾期」
{
  const many = Array.from({ length: 60 }, (_, index) => `bulk${index}`);
  const s = schedulerOn('2026-11-24', 60, many);
  for (const word of many) s.learnNewWord(word, '2026-11-24', { force: true });
  for (const word of many) s.state.cards[word].due = '2026-11-22';

  const plan = s.plan('2026-11-24');
  eq('逾期 60 个 → 今日可学 0', plan.allowedNewWords, 0);
  eq('计划值仍是结算值 60', plan.newWordLimit, 60);
  eq('逾期闸生效', plan.newWordBlocked, 'overdue');
  eq('allowance 与 plan 一致', s.allowance('2026-11-24').allowed, 0);
  eq('日历今日可学值同步', s.calendar(8, '2026-11-24')[0].newWordAllowed, 0);
  check('提示里写了建议每天清多少', plan.reason.includes('每天清 30 个左右'), plan.reason);
}

// 新词配额在状态机层强制执行：目标 3 就只能学 3 个
{
  const s = schedulerOn('2026-11-24', 3, ['a', 'b', 'c', 'd']);
  eq('前三张学得进去', ['a', 'b', 'c'].map((word) => s.learnNewWord(word).ok), [true, true, true]);
  const fourth = s.learnNewWord('d');
  check('第 4 个被配额挡住', fourth.ok === false, fourth.reason);
  eq('今天只学了 3 个', s.state.days['2026-11-24'].newLearned.length, 3);
  check('force 可以补录', s.learnNewWord('d', '2026-11-24', { force: true }).ok === true);
}

// 长期批次当天不该同时出现在「长期逾期」里
{
  const s = schedulerOn('2027-02-01', 20, ['deep']);
  s.learnNewWord('deep', '2027-02-01');
  const card = s.state.cards.deep;
  card.phase = 'long';
  card.longInterval = 90;
  card.longAnchor = '2026-09-01';
  card.due = null;

  const plan = s.plan('2027-02-01');
  const inBatch = plan.longTermBatches.some((batch) => batch.words.includes('deep'));
  const inOverdue = plan.longTermOverdue.some((batch) => batch.words.includes('deep'));
  check('1 号收进当天 90 天批次', inBatch);
  check('不再重复列进长期逾期', inOverdue === false);
}

// 断签 5 天：补结算不叠乘、连击清零、卡片不凭空消失
{
  const s = schedulerOn('2026-11-10', 20, ['a', 'b']);
  s.learnNewWord('a', '2026-11-10'); // 11-11 到期
  const back = moveTo(s, '2026-11-16');
  back.plan('2026-11-16');
  const reports = back.catchUp('2026-11-11', '2026-11-16');
  eq('补结算 5 天', reports.length, 5);
  eq('断签不叠乘，基线仍是 20', back.state.currentLimit, 20);
  eq('断签连击清零', back.state.consecutiveGoodDays, 0);
  check('卡片还在，没被凭空吞掉', back.state.cards.a !== undefined);
  eq('逾期池能看到这笔账', back.plan('2026-11-16').totals.overdue, 1);
}

// 逾期 7 天不清、第 8 天才清（需求写的是「超过 7 天」）
{
  const seven = schedulerOn('2026-11-01', 20, ['edge']);
  seven.learnNewWord('edge', '2026-11-01'); // 11-02 到期
  eq('逾期 7 天仍留在逾期池', seven.sweepOverdue('2026-11-09').length, 0);
  eq('逾期 8 天才归新词池', seven.sweepOverdue('2026-11-10').length, 1);
}

// 归档库抽查：能记结果，但不回到自动调度
{
  const s = schedulerOn('2026-11-24', 20, ['old']);
  s.learnNewWord('old');
  const card = s.state.cards.old;
  card.phase = 'archived';
  card.due = null;
  s.state.archived.push('old');

  const ok = s.reviewArchived('old', 'known');
  check('归档词可以抽查', ok.ok === true);
  const bad = s.reviewArchived('old', 'unknown');
  check('抽查答错记进错词本', bad.card?.inMistakes === true);
  eq('抽查不改变归档状态', s.state.cards.old.phase, 'archived');
  eq('抽查不产生下一次到期', s.state.cards.old.due, null);
}

// 上限只做截断，不写回基线：调小再调回来要能恢复
{
  const s = schedulerOn('2026-11-24', 20, words10);
  s.setMaxLimit(0);
  eq('上限 0 → 今天学 0', s.plan('2026-11-24').newWordLimit, 0);
  check('上限 0 的拒绝原因是「已暂停」', (s.allowance('2026-11-24').reason ?? '').includes('上限是 0'));
  s.setMaxLimit(20);
  eq('上限调回来 → 计划恢复 20', s.plan('2026-11-24').newWordLimit, 20);
  eq('基线没被上限改写', s.state.currentLimit, 20);
  s.setMaxLimit(8);
  eq('上限压到 8 → 计划 8', s.plan('2026-11-24').newWordLimit, 8);
  s.setMaxLimit(50);
  eq('上限放开 → 计划回到 20', s.plan('2026-11-24').newWordLimit, 20);
  eq('基线始终是 20', s.state.currentLimit, 20);
}

// ---------------------------------------------------------------- 八、持久化

{
  const s = schedulerOn('2026-11-24', 20, words10);
  s.learnNewWord('alpha');
  const memory: Record<string, string> = {};
  const store = {
    getItem: (key: string) => memory[key] ?? null,
    setItem: (key: string, value: string) => {
      memory[key] = value;
    },
  };
  saveScheduler(s.snapshot(), store);
  const loaded = loadScheduler(store);
  check('持久化往返：卡片仍在', loaded.cards.alpha !== undefined);
  check('持久化往返：未学池仍在', loaded.unlearned.length === 9);
  eq('持久化往返：学习日快照仍在', loaded.days['2026-11-24']?.dueSnapshot, []);
}

{
  const garbage = sanitizeScheduler({ userDailyGoal: 'x', cards: { bad: 3 }, days: { 'nope': {} } });
  eq('坏数据回退默认目标', garbage.userDailyGoal, emptyState().userDailyGoal);
  eq('坏卡片被丢弃', Object.keys(garbage.cards).length, 0);
  eq('坏日期被丢弃', Object.keys(garbage.days).length, 0);
}

{
  const broken = sanitizeScheduler({ cards: { a: { phase: 'short', due: '2026-13-45' } } });
  check('坏日期卡被丢弃（不留僵尸卡）', broken.cards.a === undefined);
  check('坏日期卡回到未学池', broken.unlearned.includes('a'));
}

{
  const messy = sanitizeScheduler({
    cards: { b: { phase: 'archived', due: null } },
    archived: ['ghost'],
    lifetime: { score: -10, count: 5 },
  });
  eq('归档索引按卡片重建', messy.archived, ['b']);
  eq('没有卡片的归档词被丢掉', messy.archived.includes('ghost'), false);
  eq('负分被夹成 0', messy.lifetime, { score: 0, count: 5 });
}

{
  const negative = sanitizeScheduler({ lifetime: { score: 99, count: 5 } });
  eq('得分不超过次数', negative.lifetime.score, 5);
}

// ---------------------------------------------------------------- 九、接线前补的 8 点

// 9.1 逾期 >7 天归池的词必须优先出池（否则「归新词」= 冷藏）
{
  const s = schedulerOn('2026-11-01', 20, ['fresh1', 'fresh2', 'fresh3', 'old1', 'old2']);
  s.learnNewWord('old1', '2026-11-01');
  s.learnNewWord('old2', '2026-11-01');
  s.state.cards.old1.due = '2026-10-20';
  s.state.cards.old2.due = '2026-10-20';

  const later = moveTo(s, '2026-11-10');
  later.plan('2026-11-10'); // 今天才清扫逾期
  check('逾期 >7 天的词回到未学池', later.state.unlearned.includes('old1'));
  eq('归池词打上 relearned 标记', later.state.relearned.old1, true);
  eq('抽取时排在新词前面', later.nextNewWords(2, '2026-11-10'), ['old1', 'old2']);

  later.setNewWordOrder('freq', { fresh1: 1, fresh2: 2, fresh3: 3, old1: 999, old2: 998 });
  eq('词频序也不能把它们压到后面', later.nextNewWords(2, '2026-11-10'), ['old2', 'old1']);
  eq('组内仍按词频排（fresh 部分不变）', later.nextNewWords(5, '2026-11-10').slice(2), ['fresh1', 'fresh2', 'fresh3']);
}

// 9.2 同日第二次及以后作答一律 isRetry（覆盖「1 天批次答不认识 → 错词本当天再答」）
{
  const s = schedulerOn('2026-11-24', 20, ['cross']);
  s.plan('2026-11-24');
  s.learnNewWord('cross');
  const d2 = moveTo(s, '2026-11-25');
  d2.plan('2026-11-25');
  check('作答前 answeredToday 为假', d2.answeredToday('cross', '2026-11-25') === false);

  const first = d2.submitReview('cross', 'unknown');
  eq('1 天批次答不认识：进错词本', d2.state.cards.cross.inMistakes, true);
  eq('1 天批次答不认识：打回明天', d2.state.cards.cross.due, '2026-11-26');
  check('作答后 answeredToday 为真', d2.answeredToday('cross', '2026-11-25') === true);

  const again = d2.answer('cross', 'known');
  check('同日第二次仍受理（不报错）', again.ok === true, again.reason);
  eq('但不计入正确率', again.counted, false);
  eq('也不改排程：到期仍是明天', d2.state.cards.cross.due, '2026-11-26');
  eq('正确率只算 1 次', d2.state.days['2026-11-25'].accCount, 1);
  eq('得分只算 1 次', d2.state.days['2026-11-25'].accScore, 0);
  eq('重试单独记 1 次', d2.state.days['2026-11-25'].retried, 1);
  eq('直接调 submitReview 仍会被守卫拒绝', d2.submitReview('cross', 'known').ok, false);
  eq('完成率分母没被放大', d2.plan('2026-11-25').totals.dueToday, 1);
}

// 9.3 setMaxLimit(0) 的设置页提示
{
  check('设为 0 有专门提示', explainMaxLimitChange(0, 20) === MAX_LIMIT_ZERO_NOTE);
  check('提示写明「不会立刻回到原值」', MAX_LIMIT_ZERO_NOTE.includes('不会立刻回到原来的数量'));
  check('上限低于基线时说明基线不打折', (explainMaxLimitChange(5, 20) ?? '').includes('基线不打折'));
  eq('没变化时不必显示', explainMaxLimitChange(20, 20), null);
}

// 9.4 日历上计划值与原因短句必须成对出现
{
  const bulk = Array.from({ length: 60 }, (_, index) => `bulk${index}`);
  const s = schedulerOn('2026-11-24', 60, bulk);
  for (const word of bulk) s.learnNewWord(word, '2026-11-24', { force: true });
  for (const word of bulk) s.state.cards[word].due = '2026-11-22';

  const day = s.calendarView(8, '2026-11-24').days[0];
  eq('日历带上被哪道闸挡住', day.newWordBlocked, 'overdue');
  eq('计划值仍是结算值', day.newWordPlan, 60);
  eq('实际可学 0', day.newWordAllowed, 0);
  const line = explainCalendarNewWords(day);
  check('原因短句同时给出计划、闸名、实际', line === '计划 60，因逾期暂停，实际 0', line);
}

// 9.5 未来 7 天没有长期批次时给预告，不留空
{
  const s = schedulerOn('2026-11-26', 20, ['l1']);
  s.learnNewWord('l1', '2026-11-26');
  const card = s.state.cards.l1;
  card.phase = 'long';
  card.longInterval = 30;
  card.longAnchor = '2026-11-13'; // 到期 12-13，是个周日
  card.due = null;

  const view = s.calendarView(8, '2026-11-26');
  eq('8 天窗口内确实没有长期批次', view.days.some((item) => item.longTermBatches.length > 0), false);
  check('给出下个长期批次日', view.longForecast !== null && view.longForecast.date === '2026-12-13', view.longForecast);
  eq('预告标记为窗口外', view.longForecast?.withinWindow, false);
  const line = describeLongForecast(view.longForecast);
  check('文案给出批次日与预计词数', line.includes('12月13日') && line.includes('30 天批次') && line.includes('预计 1 词'), line);
  eq('没有长期卡时兜底文案', describeLongForecast(null), '近期无长期复习');
}

// 9.6 空转日（当天没有到期复习）不计入连续优秀，并且要说出来
{
  const s = schedulerOn('2026-11-24', 20, ['x1']);
  const idle = s.plan('2026-11-24');
  eq('没有到期复习 → 给出空转提示', idleDayNote(idle), IDLE_DAY_NOTE);
  s.learnNewWord('x1');
  const busy = moveTo(s, '2026-11-25').plan('2026-11-25');
  eq('有到期复习 → 不显示空转提示', idleDayNote(busy), null);
}

// 9.7 每次启动都结算，重复启动不重复移动基线 / 连击
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b']);
  const first = s.startOfSession();
  eq('启动时结算昨天', first.reports[0].settledDay, '2026-11-23');
  eq('今天的计划仍然可用', first.plan.day, '2026-11-24');
  const baseline = s.state.currentLimit;
  const streak = s.state.consecutiveGoodDays;
  const second = s.startOfSession();
  eq('再启动一次不改基线', s.state.currentLimit, baseline);
  eq('再启动一次不加连击', s.state.consecutiveGoodDays, streak);
  eq('再启动一次仍回放同一天', second.reports[0].settledDay, '2026-11-23');
}

// 9.7b 断签回来：启动就把中间的日子补结算完，且不叠乘
{
  const s = schedulerOn('2026-11-10', 20, ['a', 'b']);
  s.learnNewWord('a', '2026-11-10'); // 11-11 到期
  s.settle('2026-11-10');
  const back = moveTo(s, '2026-11-16');
  const session = back.startOfSession();
  eq('补结算 11-11…11-15（5 天）+ 昨天', session.reports.length, 6);
  eq('断签不叠乘：基线仍是 20', back.state.currentLimit, 20);
  eq('断签连击清零', back.state.consecutiveGoodDays, 0);
  eq('今天的计划落在 11-16', session.plan.day, '2026-11-16');
  eq('逾期的那张卡还在', back.state.cards.a !== undefined, true);
}

// 9.8 完成率的分母用快照算，作答后不缩小（Set 索引改造后的回归）
{
  const s = schedulerOn('2026-11-01', 20, words10);
  for (const word of words10) s.learnNewWord(word, '2026-11-01');
  const d2 = moveTo(s, '2026-11-02');
  const plan = d2.plan('2026-11-02');
  eq('到期 10 个', plan.totals.dueToday, 10);
  for (const word of words10.slice(0, 4)) d2.submitReview(word, 'known');
  eq('答 4 个后分母还是 10', d2.plan('2026-11-02').totals.dueToday, 10);
  eq('分子是 4', d2.plan('2026-11-02').totals.doneToday, 4);
  const report = d2.settle('2026-11-02');
  eq('结算完成率 0.4', report.result.metrics.completionRate, 0.4);
}

// ---------------------------------------------------------------- 十、错词本 / 上限默认 / 不丢词

// 10.1 正式复习答不认识：进错词本，带次数与日期
{
  const s = schedulerOn('2026-11-24', 20, ['m1', 'm2']);
  s.learnNewWord('m1');
  s.learnNewWord('m2');
  const d2 = moveTo(s, '2026-11-25');
  d2.plan('2026-11-25');
  d2.submitReview('m1', 'unknown');

  const rows = d2.mistakes();
  eq('错词本 1 条', rows.length, 1);
  eq('词是 m1', rows[0].word, 'm1');
  eq('累计答错 1 次', rows[0].count, 1);
  eq('最后一次答错日期是今天', rows[0].lastDay, '2026-11-25');
  eq('来源是正式复习', rows[0].source, 'review');
  eq('可以单测', rows[0].canQuiz, true);
  eq('老字段 inMistakes 同步', d2.state.cards.m1.inMistakes, true);
}

// 10.2 即时复习累计模糊 3 次：进错词本，但仍不出队（进本子 ≠ 出队）
{
  const s = schedulerOn('2026-11-24', 20, words10);
  s.plan(); // 建立当天记录（App 挂载时本来就会拍一次）
  const group = s.startImmediateWith(words10)!;
  const target = group.queue[0];

  s.answerImmediate(target, false); // 第 1 次：本轮回队尾
  s.answerImmediate(target, false); // 第 2 次：本轮跨轮
  while (s.state.immediate.active && s.state.immediate.active.round === 1) {
    s.answerImmediate(s.state.immediate.active.queue[0], true);
  }
  const third = s.answerImmediate(target, false); // 第 3 次：记账
  eq('第 3 次跨过阈值', third?.thresholdCrossed, true);
  eq('第 3 次一次记满 3', third?.mistakeIncrement, 3);
  eq('第 3 次不出队（回队尾）', third?.group.queue.includes(target), true);
  const row = s.mistakes().find((item) => item.word === target);
  check('模糊 3 次进错词本', row !== undefined, s.mistakes());
  eq('来源是即时复习', row?.source, 'immediate');
  eq('累计次数 = 3', row?.count, 3);
  eq('即时复习不计正确率', s.state.days['2026-11-24'].accCount, 0);

  const fourth = s.answerImmediate(target, false); // 第 4 次：每次 +1
  eq('第 4 次累计 4', fourth?.group.fuzzyCount[target], 4);
  eq('第 4 次账本 +1', s.mistakes().find((item) => item.word === target)?.count, 4);

  // 点到「认识」才收口；卡按 1 天批次入库
  const done = s.answerImmediate(target, true);
  eq('答认识才收口', done?.finished, true);
  const commit = s.commitNewWords(done!.group.words, '2026-11-24', done!.hardWords);
  check('全部入库', commit.committed.includes(target));
  eq('卡在明天 1 天批次（不丢词）', s.state.cards[target].due, '2026-11-25');
  eq('hard 不再由「模糊 3 次」设置', s.state.cards[target].hard, false);
  eq('inMistakes 镜像到卡上（账本唯一来源）', s.state.cards[target].inMistakes, true);
  eq('即时复习不写 lastRating', s.state.cards[target].lastRating, null);
}

// 10.3 错词本单测：答错累计、答对移出，都不动排程、不计正确率
{
  const s = schedulerOn('2026-11-24', 20, ['q1']);
  s.learnNewWord('q1');
  const d2 = moveTo(s, '2026-11-25');
  d2.plan('2026-11-25');
  d2.submitReview('q1', 'unknown'); // 打回 11-26
  const dueBefore = d2.state.cards.q1.due;

  const wrong = d2.quizMistake('q1', false);
  eq('单测答错：留在本子', wrong.removed, false);
  eq('累计变成 2 次', wrong.entry?.count, 2);
  eq('来源标成单测', wrong.entry?.source, 'quiz');
  eq('排程不动', d2.state.cards.q1.due, dueBefore);
  eq('正确率不跟着变', d2.state.days['2026-11-25'].accCount, 1);
  eq('完成率分子不变', d2.plan('2026-11-25').totals.doneToday, 1);

  const right = d2.quizMistake('q1', true);
  eq('单测答对：移出错词本', right.removed, true);
  eq('本子空了', d2.mistakeCount(), 0);
  check('卡片还在', d2.state.cards.q1 !== undefined);
  eq('inMistakes 清掉', d2.state.cards.q1.inMistakes, false);
  eq('排程仍按原到期日', d2.state.cards.q1.due, dueBefore);
  eq('重复单测会被拒绝', d2.quizMistake('q1', true).ok, false);
}

// 10.4 正式复习答对也移出错词本（排程照常前进）
{
  const s = schedulerOn('2026-11-24', 20, ['k1']);
  s.learnNewWord('k1');
  const d2 = moveTo(s, '2026-11-25');
  d2.plan('2026-11-25');
  d2.submitReview('k1', 'unknown');
  eq('先有 1 条', d2.mistakeCount(), 1);

  const d3 = moveTo(d2, '2026-11-26');
  d3.plan('2026-11-26');
  d3.submitReview('k1', 'known');
  eq('答对后移出', d3.mistakeCount(), 0);
  eq('卡片进 2 天档', d3.state.cards.k1.interval, 2);
}

// 10.5 上限默认 = 目标 + 5；老状态一次性迁移
{
  const fresh = emptyState();
  eq('空状态目标 20', fresh.userDailyGoal, 20);
  eq('空状态上限 = 目标 + 5', fresh.maxLimit, 25);

  const s = Scheduler.create(20);
  s.setUserDailyGoal(30);
  eq('改目标时未钉住的上限跟着 +5', s.state.maxLimit, 35);
  s.setMaxLimit(40);
  s.setUserDailyGoal(35);
  eq('钉住的上限不跟目标走', s.state.maxLimit, 40);

  const oldState = sanitizeScheduler({ userDailyGoal: 20, maxLimit: 20, maxLimitPinned: false, currentLimit: 20 });
  eq('老状态（上限=目标）迁移到 +5', oldState.maxLimit, 25);
  const pinned = sanitizeScheduler({ userDailyGoal: 20, maxLimit: 20, maxLimitPinned: true, currentLimit: 20 });
  eq('用户钉过的上限不动', pinned.maxLimit, 20);
  eq('上限 0（用户主动暂停）不会被迁移回来', sanitizeScheduler({ userDailyGoal: 20, maxLimit: 0, maxLimitPinned: false }).maxLimit, 0);
}

// 10.6 兜底：上限 = 目标时只发目标，且基线不被改写
{
  const base = emptyState(20);
  base.currentLimit = 25;
  base.pendingLimit = { day: '2026-11-24', value: 25 };
  base.unlearned = Array.from({ length: 40 }, (_, index) => `c${index}`);
  const s = new Scheduler(base, { now: () => at('2026-11-24') });

  s.setMaxLimit(20); // 用户手动把上限调到等于目标
  eq('基线仍是 25', s.state.currentLimit, 25);
  eq('今天只发 20（被上限截断）', s.plan('2026-11-24').newWordLimit, 20);
  eq('预算也按 20 算', s.allowance('2026-11-24').planned, 20);
  for (let index = 0; index < 20; index += 1) s.learnNewWord(`c${index}`);
  eq('学满 20 个之后配额用完', s.allowance('2026-11-24').allowed, 0);
  eq('第 21 个学不进去（配额）', s.learnNewWord('c20').ok, false);
  eq('基线依然 25', s.state.currentLimit, 25);

  s.setMaxLimit(30); // 当天改回来：结算值已被截断，不会立刻恢复
  eq('改回 30 后基线不动', s.state.currentLimit, 25);
  eq('当天仍是 20（等下一次结算）', s.plan('2026-11-24').newWordLimit, 20);

  s.settle('2026-11-24');
  eq('第二天按底层基线发放 25', s.plan('2026-11-25').newWordLimit, 25);
}

// 10.7 跳过即时复习：词不丢，明天 1 天批次照收
{
  const s = schedulerOn('2026-11-24', 20, words10);
  for (const word of words10) s.learnNewWord(word);
  s.startImmediate();
  const skipped = s.skipImmediate();
  eq('跳过 10 个', skipped.length, 10);
  eq('组被清空', s.state.immediate.active, null);
  eq('待复习也清了', s.state.immediate.pendingCount, 0);

  const d2 = moveTo(s, '2026-11-25');
  const plan = d2.plan('2026-11-25');
  eq('明天 1 天批次 10 个', plan.shortTermBatches[0].wordCount, 10);
  eq('10 个词全在', plan.shortTermBatches[0].words.slice().sort(), words10.slice().sort());
  check(
    '全部打了跳过标记（明天置顶）',
    words10.every((word) => d2.state.cards[word].skippedImmediate === true),
  );
}

// 10.8 中途退出即时复习 + 跨天：旧的半组自动作废，新词能进新组
{
  const pool = [...words10, 'kilo', 'lima', 'mike', 'november', 'oscar', 'papa', 'quebec', 'romeo', 'sierra', 'tango'];
  const s = schedulerOn('2026-11-24', 20, pool);
  for (const word of words10) s.learnNewWord(word);
  const group = s.startImmediate();
  s.answerImmediate(group!.queue[0], true); // 做了 1 个就退出

  const d2 = moveTo(s, '2026-11-25');
  const session = d2.startOfSession();
  eq('昨天的半组被作废', d2.state.immediate.active, null);
  eq('启动正常', session.plan.day, '2026-11-25');
  eq(
    '没答的 9 个打上跳过标记（明天置顶）',
    words10.filter((word) => d2.state.cards[word].skippedImmediate === true).length,
    9,
  );

  // 第二天先把这 10 个到期复习做完（复习闸才会打开），再攒 10 个新词
  for (const word of words10) d2.answer(word, 'known', '2026-11-25');
  const learned = pool.slice(10).map((word) => d2.learnNewWord(word, '2026-11-25').ok);
  check('第二天的 10 个新词都学得进去', learned.every(Boolean), learned);

  const next = d2.startImmediate();
  check('新攒的 10 个能开新组', next !== null, next?.words.length);
  eq('新组不掺旧词', next?.words.slice().sort(), pool.slice(10).slice().sort());
}

// 10.9 首页动态新词量文案：奖励 / 减量 / 暂停
{
  const bonusBase = emptyState(20);
  bonusBase.currentLimit = 25;
  bonusBase.pendingLimit = { day: '2026-11-24', value: 25 };
  bonusBase.unlearned = Array.from({ length: 40 }, (_, index) => `n${index}`);
  const bonus = newWordHeadline(new Scheduler(bonusBase, { now: () => at('2026-11-24') }).plan('2026-11-24'));
  eq('奖励态数字', bonus.amount, 25);
  eq('奖励态角标 ↑ +5', bonus.tag, '↑ +5');
  check('奖励态文案', bonus.note.includes('额外增加了 5 个新词'), bonus.note);

  const cutBase = emptyState(20);
  cutBase.currentLimit = 15;
  cutBase.pendingLimit = { day: '2026-11-24', value: 15 };
  cutBase.unlearned = Array.from({ length: 40 }, (_, index) => `n${index}`);
  const cut = newWordHeadline(new Scheduler(cutBase, { now: () => at('2026-11-24') }).plan('2026-11-24'));
  eq('减量态数字', cut.amount, 15);
  eq('减量态角标 ↓ 5', cut.tag, '↓ 5');
  check('减量态复用结算原因', cut.note.includes('今日新词调整为 15 个'), cut.note);

  const pausedBase = emptyState(20);
  pausedBase.currentLimit = 0;
  pausedBase.pendingLimit = { day: '2026-11-24', value: 0 };
  pausedBase.unlearned = ['p1'];
  const paused = newWordHeadline(new Scheduler(pausedBase, { now: () => at('2026-11-24') }).plan('2026-11-24'));
  eq('暂停态', paused.tone, 'paused');
  eq('暂停态数字 0', paused.amount, 0);
  check('暂停文案说要清复习', paused.note.includes('请优先清理复习'), paused.note);
  eq('日历格子带目标值', new Scheduler(pausedBase, { now: () => at('2026-11-24') }).calendar(1, '2026-11-24')[0].newWordGoal, 20);
}

// ---------------------------------------------------------------- §11 统一学习流（v1.1 新 API）

const nineteen = Array.from({ length: 19 }, (_, index) => `t${index}`);

// 11.1 startImmediateWith：校验与去重
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  eq('空列表拒绝开组', s.startImmediateWith([]), null);
  s.learnNewWord('a'); // 旧 API：a 已入库
  eq('混入已入库词整组拒绝', s.startImmediateWith(['b', 'a']), null);
  eq('混入不在池的词也拒绝', s.startImmediateWith(['b', 'zzz']), null);
  eq('去重后开组成功', s.startImmediateWith(['b', 'c', 'b'])!.words.join(','), 'b,c');
  eq('同一天重复调用返回现有组', s.startImmediateWith(['b', 'c'])!.words.join(','), 'b,c');
  eq('组进了 active', s.state.immediate.active?.words.join(','), 'b,c');
  eq('未入库词不占 pendingWords', s.state.immediate.pendingCount, 1); // 只有旧 API 塞的 a
}

// 11.2 两键循环：模糊一次回队尾、第二次跨轮、下一轮只考它
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  s.startImmediateWith(['a', 'b', 'c']);
  s.answerImmediate('a', true);
  s.answerImmediate('b', false); // 第 1 次模糊：回队尾
  eq('错词回队尾', s.state.immediate.active!.queue.join(','), 'c,b');
  const second = s.answerImmediate('b', false); // 第 2 次模糊：跨轮
  check('第 2 次模糊 → 跨轮', second!.crossed === true);
  eq('本轮队列只剩 c', second!.group.queue.join(','), 'c');
  eq('待跨轮里有 b', second!.group.crossRound.join(','), 'b');
  eq('此时还没有任何卡', Object.keys(s.state.cards).length, 0);
  const last = s.answerImmediate('c', true);
  eq('本轮清空 → 进第 2 轮', last!.group.round, 2);
  eq('第 2 轮只考 b', last!.group.queue.join(','), 'b');
  check('本轮清空但整组未收口', last!.roundFinished === true && last!.finished === false);
  const done = s.answerImmediate('b', true);
  check('最后一个答对 → 收口', done!.finished === true);
}

// 11.3 commitNewWords：唯一落库点；非法词进 rejected，不整组失败
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'x']);
  s.learnNewWord('x'); // 旧 API：x 已入库（并占住 pendingWords 一格）
  const group = s.startImmediateWith(['a', 'b', 'c'])!;
  s.answerImmediate('a', true);
  s.answerImmediate('b', true);
  const done = s.answerImmediate('c', true);
  void done;
  const result = s.commitNewWords([...group.words, 'x', ''], '2026-11-24', ['b']);
  eq('合法词全部入库', result.committed.slice().sort(), ['a', 'b', 'c']);
  eq('已入库词被拒', result.rejected, ['x']);
  check('建卡即进 1 天短期档、明天到期', s.state.cards.a.phase === 'short' && s.state.cards.a.due === '2026-11-25');
  check('hardWords 打了 hard 标记', s.state.cards.b.hard === true && s.state.cards.a.hard === false);
  eq('记入当天 newLearned', s.state.days['2026-11-24'].newLearned.slice().sort(), ['a', 'b', 'c', 'x']);
  eq('从池里移除', s.newWordPool().includes('a'), false);
  eq('commit 不塞旧 pendingWords', s.state.immediate.pendingCount, 1); // 仍只有旧 API 的 x
}

// 11.4 abandonImmediate：中途退出零入库
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  s.plan(); // 建立当天记录（App 挂载时本来就会拍一次）
  s.startImmediateWith(['a', 'b', 'c']);
  s.answerImmediate('a', true); // 做掉 1 个再退出
  const abandoned = s.abandonImmediate();
  eq('丢弃整组', abandoned.length, 3);
  eq('active 清空', s.state.immediate.active, null);
  eq('一个词都没入库', Object.keys(s.state.cards).length, 0);
  eq('newLearned 为空', s.state.days['2026-11-24'].newLearned.length, 0);
  eq('词池原样', s.newWordPool().length, 3);
  eq('没组时 abandon 空转', s.abandonImmediate().length, 0);
}

// 11.5 19 词全流程：5/5/5/4 → 组 10 → 组 9（尾巴也弹）→ 全部入库
{
  const s = schedulerOn('2026-11-24', 20, nineteen);
  const list = s.nextNewWords();
  eq('今日发放 19', list.length, 19);
  const g1 = s.startImmediateWith(list.slice(0, 10))!;
  eq('第一组恰好 10 个', g1.words.length, 10);
  for (const word of list.slice(0, 9)) s.answerImmediate(word, true);
  const fuzzyWord = list[9];
  s.answerImmediate(fuzzyWord, false); // 本轮第 1 次
  const second = s.answerImmediate(fuzzyWord, false); // 本轮第 2 次 → 跨轮
  check('第 2 次模糊 → 跨轮并进第 2 轮', second!.crossed === true && second!.group.round === 2);
  eq('自动进第 2 轮', second!.group.round, 2);
  eq('第 2 轮只有它', second!.group.queue.join(','), fuzzyWord);
  const third = s.answerImmediate(fuzzyWord, false); // 第 3 次 → 记账，回队尾
  eq('第 3 次记满 3 次', third!.mistakeIncrement, 3);
  eq('第 3 次后仍在队列（进本子 ≠ 出队）', third!.group.queue.includes(fuzzyWord), true);
  const done1 = s.answerImmediate(fuzzyWord, true);
  check('答认识后收口', done1!.finished === true);
  const r1 = s.commitNewWords(done1!.group.words, '2026-11-24', done1!.hardWords);
  eq('第一组入库 10 个', r1.committed.length, 10);
  check('模糊过但不硬：hard=false', s.state.cards[fuzzyWord].hard === false);
  check('inMistakes 镜像到卡上', s.state.cards[fuzzyWord].inMistakes === true);
  const g2 = s.startImmediateWith(list.slice(10))!;
  eq('尾巴 9 个也开组', g2.words.length, 9);
  let lastResult: ReturnType<typeof s.answerImmediate> = null;
  for (const word of list.slice(10)) lastResult = s.answerImmediate(word, true);
  check('尾巴组清空', lastResult !== null && lastResult!.finished === true);
  const r2 = s.commitNewWords(lastResult!.group.words, '2026-11-24', []);
  eq('尾巴入库 9 个', r2.committed.length, 9);
  eq('当天 newLearned 共 19', s.state.days['2026-11-24'].newLearned.length, 19);
  eq('池子清空', s.newWordPool().length, 0);
  const plan = s.plan();
  eq('今天没有到期复习（明天才轮到）', plan.shortTermBatches.length + plan.overduePool.length, 0);
  eq('今日配额已用完', s.allowance().allowed, 0);
}

// 11.6 跨天：昨天的半组自动作废，今天的词能开新组
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  s.startImmediateWith(['a', 'b']);
  const d2 = moveTo(s, '2026-11-25');
  d2.startOfSession();
  eq('启动后旧半组作废', d2.state.immediate.active, null);
  const g = d2.startImmediateWith(['c', 'd']);
  eq('新组不掺旧词', g!.words.join(','), 'c,d');
  eq('新组记在今天', g!.startedOn, '2026-11-25');
}

// 11.7 列表阶段零状态：nextNewWords 预览不消费、不建卡
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  const first = s.nextNewWords();
  const second = s.nextNewWords();
  eq('预览可重复调用且结果稳定', first, second);
  eq('预览不消费池子', s.newWordPool().length, 3);
  eq('预览不建卡', Object.keys(s.state.cards).length, 0);
}

// 11.8 resetLearning：学习数据彻底归零，设置保留；重新 seed 后像新用户
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd', 'e']);
  s.plan();
  s.learnNewWord('a');
  s.learnNewWord('b');
  s.answerImmediate('b', false); // 旧 API 学两个词；此时没有开组，这次作答应当空转（返回 null）
  s.setUserDailyGoal(12);
  s.setMaxLimit(30);
  s.resetLearning();
  eq('卡片清空', Object.keys(s.state.cards).length, 0);
  eq('历史记录清空', Object.keys(s.state.days).length, 0);
  eq('错词本清空', Object.keys(s.state.mistakes).length, 0);
  eq('即时复习归零', s.state.immediate.stats.groups, 0);
  eq('结算归零', s.state.lastSettlement, null);
  eq('连续优秀归零', s.state.consecutiveGoodDays, 0);
  eq('每日目标保留', s.state.userDailyGoal, 12);
  eq('钉住的上限保留', [s.state.maxLimit, s.state.maxLimitPinned], [30, true]);
  eq('基线回到目标值', s.state.currentLimit, 12);
  eq('重置后池子为空（还没 seed）', s.newWordPool().length, 0);
  s.seed(['a', 'b', 'c', 'd', 'e']);
  eq('重新 seed 后像新用户', [s.newWordPool().length, s.state.days['2026-11-24'] ? 1 : 0], [5, 0]);
  eq('发放按目标来', s.plan().allowedNewWords, 5); // min(12, 池 5)
}

// ---------------------------------------------------------------- §12 日历格子的负荷行（v1.2 视觉误导修复）

/** 造一格日历数据：默认「未来的预估格」，只覆盖要断言的字段。 */
function loadDay(overrides: Partial<CalendarDay> & { day: StudyDay }): CalendarDay {
  const base: CalendarDay = {
    day: overrides.day,
    weekdayLabel: '三',
    shortTermBatches: [],
    longTermBatches: [],
    newWordPlan: 20,
    newWordAllowed: 20,
    newWordBlocked: null,
    newWordDone: 0,
    newWordGoal: 20,
    dueTotal: 0,
    doneTotal: 0,
    overdue: 0,
    isToday: false,
    isPast: false,
    estimated: true,
  };
  return { ...base, ...overrides };
}

function slot(day: CalendarDay, key: string) {
  return calendarDayLoad(day).find((item) => item.key === key) ?? null;
}

// 12.1 真机报的场景：今天学完 20 个新词 → 明天那格必须一眼看到「复习 20 词」
{
  const w20 = Array.from({ length: 20 }, (_, index) => `c${index}`);
  const s = schedulerOn('2026-11-24', 20, w20);
  s.plan();
  s.startImmediateWith(w20);
  for (const word of w20) s.answerImmediate(word, true);
  s.commitNewWords(w20);
  const tomorrow = s.calendar(8)[1];
  eq('次日到期 20 词', tomorrow.dueTotal, 20);
  const review = slot(tomorrow, 'review');
  eq('复习槽是这格的主任务', [review?.tone, review?.dot], ['primary', true]);
  eq('未来日只报计划总量', [review?.value, review?.unit], ['20', '词']);
  check('复习槽里没有假分数 0 /', !review!.value.includes('/'));
  eq(
    '复习量与批次明细同数',
    review?.value,
    String(tomorrow.shortTermBatches.reduce((sum, batch) => sum + batch.wordCount, 0)),
  );
  const fresh = slot(tomorrow, 'new');
  check('新词槽不抢主任务的位', fresh?.tone !== 'primary');
  eq('新词槽取当天计划值', fresh?.value, String(tomorrow.newWordPlan));
  eq('未来日没有逾期槽', slot(tomorrow, 'overdue'), null);
}

// 12.2 没排上复习的格子：显式零 + 一句人话，不能留空白让人以为漏排
{
  const gap = loadDay({ day: '2026-11-26', dueTotal: 0 });
  eq('复习为零也占位', [slot(gap, 'review')?.value, slot(gap, 'review')?.tone], ['—', 'quiet']);
  check('说明句点出「随前面的复习动态生成」', calendarReviewNote(gap).includes('前面'));
  eq('有复习时不再重复解释', calendarReviewNote(loadDay({ day: '2026-11-25', dueTotal: 20 })), '');
  eq('今天的零说的是今天', calendarReviewNote(loadDay({ day: '2026-11-25', estimated: false, isToday: true })), '今天没有到期复习。');
  eq('历史日的零说的是那天', calendarReviewNote(loadDay({ day: '2026-11-22', estimated: false, isPast: true })), '那天没有到期复习。');
}

// 12.3 完成度只属于今天与过去；「逾期」槽只在历史日出现
{
  const today = loadDay({
    day: '2026-11-25',
    estimated: false,
    isToday: true,
    dueTotal: 20,
    doneTotal: 3,
    overdue: 17,
  });
  eq('今天带完成度', [slot(today, 'review')?.value, slot(today, 'review')?.unit], ['3/20', null]);
  eq('今天剩下的 17 个不叫逾期', slot(today, 'overdue'), null);
  const past = loadDay({
    day: '2026-11-23',
    estimated: false,
    isPast: true,
    dueTotal: 20,
    doneTotal: 18,
    overdue: 2,
    newWordDone: 8,
  });
  eq('历史日欠的才是逾期', [slot(past, 'overdue')?.value, slot(past, 'overdue')?.tone], ['2', 'warn']);
  eq('历史日新词也带完成度', slot(past, 'new')?.value, '8/20');
  eq('槽位顺序恒定', calendarDayLoad(past).map((item) => item.key).join(','), 'review,overdue,new');
}

// 12.4 长期批次与奖励角标都进负荷行，不再散到第二行
{
  const full = loadDay({
    day: '2026-11-29',
    dueTotal: 5,
    newWordPlan: 25,
    longTermBatches: [{ type: '30d', scheduledDate: '2026-11-29', wordCount: 12, words: [] }],
  });
  eq('长期批次带节点短标', [slot(full, 'long-30d')?.label, slot(full, 'long-30d')?.value, slot(full, 'long-30d')?.tone], ['长期 30 天', '12', 'quiet']);
  eq('奖励角标紧跟新词槽', calendarDayLoad(full).map((item) => item.key).join(','), 'review,new,bonus,long-30d');
  eq('零新词也占位', [slot(loadDay({ day: '2026-11-30', newWordPlan: 0 }), 'new')?.value, slot(loadDay({ day: '2026-11-30', newWordPlan: 0 }), 'new')?.tone], ['—', 'quiet']);
}

// ---------------------------------------------------------------- §13 即时复习轮次模型（2026-11-26）

/**
 * §2.4 不变量检查器。`appearances` 的键是 `词@轮次`，用于证明「每轮每词最多出现 2 次」。
 * 返回违规描述，空数组 = 全对。
 */
function invariantViolations(
  group: ImmediateGroup,
  mistakes: Record<string, { count: number }>,
  appearances: Map<string, number>,
): string[] {
  const bad: string[] = [];
  for (const word of group.queue) if (group.crossRound.includes(word)) bad.push(`queue∩crossRound:${word}`);
  for (const word of group.fuzzyThisRound) if (!group.queue.includes(word)) bad.push(`fuzzyThisRound⊄queue:${word}`);
  for (const [key, times] of appearances) if (times > 2) bad.push(`单轮出现>2:${key}`);
  for (const [word, count] of Object.entries(group.fuzzyCount)) {
    if (count >= 3 && !mistakes[word]) bad.push(`模糊≥3 无账本:${word}`);
  }
  return bad;
}

// 13.1 首轮模糊一次 → 回队尾，本轮内再出现一次
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  s.startImmediateWith(['a', 'b', 'c']);
  const r = s.answerImmediate('a', false)!;
  eq('13.1 模糊一次仍在本轮队列', r.group.queue, ['b', 'c', 'a']);
  eq('13.1 标记进 fuzzyThisRound', r.group.fuzzyThisRound, ['a']);
  eq('13.1 累计 1 次', r.group.fuzzyCount.a, 1);
  eq('13.1 本轮还剩 3 个', r.remaining, 3);
}

// 13.2 本轮第 2 次模糊 → 不回队尾、进 crossRound
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  s.startImmediateWith(['a', 'b', 'c']);
  s.answerImmediate('a', false);
  const r = s.answerImmediate('a', false)!;
  check('13.2 第二次模糊标记 crossed', r.crossed === true && r.thresholdCrossed === false);
  eq('13.2 不回队尾（本轮只剩 b,c）', r.group.queue, ['b', 'c']);
  eq('13.2 进 crossRound', r.group.crossRound, ['a']);
  eq('13.2 累计 2 次但不记账', [r.group.fuzzyCount.a, s.state.mistakes.a], [2, undefined]);
}

// 13.3 本轮无模糊 → 自然收口
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c']);
  s.startImmediateWith(['a', 'b', 'c']);
  s.answerImmediate('a', true);
  s.answerImmediate('b', true);
  const last = s.answerImmediate('c', true)!;
  eq('13.3 自然收口', last.finished, true);
  eq('13.3 没有硬词', last.hardWords, []);
  eq('13.3 组统计 groups=1（按会话不按轮）', s.state.immediate.stats.groups, 1);
}

// 13.4 跨轮：round=2、queue === 上轮 crossRound（保序）、fuzzyThisRound 清空
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  s.startImmediateWith(['a', 'b', 'c', 'd']);
  s.answerImmediate('b', false);
  s.answerImmediate('b', false); // b 先跨轮
  s.answerImmediate('a', false);
  s.answerImmediate('a', false); // a 后跨轮
  s.answerImmediate('c', true);
  const r = s.answerImmediate('d', true)!;
  eq('13.4 进第 2 轮', r.group.round, 2);
  eq('13.4 第 2 轮队列按首次跨轮顺序', r.group.queue, ['b', 'a']);
  eq('13.4 fuzzyThisRound 清空', r.group.fuzzyThisRound, []);
  eq('13.4 crossRound 清空', r.group.crossRound, []);
  check('13.4 本轮清空未收口', r.roundFinished === true && r.finished === false);
}

// 13.5 累计 1、2 次模糊 → 账本无条目、thresholdCrossed=false
{
  const s = schedulerOn('2026-11-24', 20, ['a']);
  s.startImmediateWith(['a']);
  const first = s.answerImmediate('a', false)!;
  const second = s.answerImmediate('a', false)!;
  eq('13.5 第 1、2 次都不记账', [first.mistakeIncrement, second.mistakeIncrement], [0, 0]);
  eq('13.5 第 1、2 次都不跨阈值', [first.thresholdCrossed, second.thresholdCrossed], [false, false]);
  eq('13.5 账本仍为空', s.state.mistakes, {});
}

// 13.6a 第 3 次模糊发生在「本轮第 1 次」→ 回队尾，queue 含 w、crossRound 不含
{
  const s = schedulerOn('2026-11-24', 20, ['w']);
  s.startImmediateWith(['w']);
  s.answerImmediate('w', false); // 轮 1 第 1 次
  s.answerImmediate('w', false); // 轮 1 第 2 次 → 跨轮 → 轮 2
  const third = s.answerImmediate('w', false)!; // 轮 2 第 1 次 = 累计第 3 次
  eq('13.6a 前置：本轮第 1 次模糊', third.thresholdCrossed, true);
  eq('13.6a 一次记满 3', third.mistakeIncrement, 3);
  eq('13.6a 回队尾（queue 含 w）', third.group.queue.includes('w'), true);
  eq('13.6a 不在 crossRound', third.group.crossRound.includes('w'), false);
  eq('13.6a 账本 count=3', s.state.mistakes.w?.count, 3);
  eq('13.6a 来源是即时复习', s.state.mistakes.w?.source, 'immediate');
}

// 13.6b 第 3 次模糊发生在「本轮第 2 次」→ 进 crossRound，queue 不含 w
//       注意：正常流程不可达——词能进下一轮说明上一轮已模糊两次（累计 ≥2），
//       第 3 次必然落在某轮的「第 1 次」上。这里直接构造状态，测纯函数分支。
{
  const group = makeGroup(['w', 'v'], '2026-11-24');
  group.round = 2;
  group.queue = ['w', 'v']; // 留一个 v 在本轮，避免跨轮后立刻开下一轮
  group.fuzzyThisRound = ['w'];
  group.fuzzyCount = { w: 2 };
  const r = answerImmediate(group, 'w', false)!;
  eq('13.6b 前置：本轮第 2 次模糊', r.thresholdCrossed, true);
  eq('13.6b 一次记满 3', r.mistakeIncrement, 3);
  eq('13.6b 不留在本轮队列', r.group.queue.includes('w'), false);
  eq('13.6b 进 crossRound', r.group.crossRound.includes('w'), true);
  check('13.6b 本轮未清空（还有 v）', r.roundFinished === false && r.group.round === 2);
}

// 13.7 第 4、5… 次模糊：每次 +1，不再重复记 3
{
  const s = schedulerOn('2026-11-24', 20, ['w']);
  s.startImmediateWith(['w']);
  for (let i = 0; i < 3; i += 1) s.answerImmediate('w', false);
  eq('13.7 第 3 次后账本 3', s.state.mistakes.w?.count, 3);
  const fourth = s.answerImmediate('w', false)!;
  eq('13.7 第 4 次增量是 1', fourth.mistakeIncrement, 1);
  eq('13.7 第 4 次后账本 4', s.state.mistakes.w?.count, 4);
  eq('13.7 累计模糊次数 4', fourth.group.fuzzyCount.w, 4);
}

// 13.8 即时复习点「认识」只出队，不清错词本账本
{
  const s = schedulerOn('2026-11-24', 20, ['w']);
  s.startImmediateWith(['w']);
  for (let i = 0; i < 3; i += 1) s.answerImmediate('w', false);
  const done = s.answerImmediate('w', true)!;
  eq('13.8 认识后出队重开下一轮或收口', done.group.queue.includes('w'), false);
  eq('13.8 账本仍留着', s.state.mistakes.w?.count, 3);
}

// 13.9 5 轮硬上限：每轮都模糊 → 第 5 轮强制收口，残留词进 hardWords
{
  const s = schedulerOn('2026-11-24', 20, ['w']);
  s.startImmediateWith(['w']);
  let last = s.answerImmediate('w', false)!;
  let clicks = 1;
  while (!last.finished && clicks < 20) {
    last = s.answerImmediate('w', false)!;
    clicks += 1;
  }
  eq('13.9 每轮两次 → 10 次后强制收口', [clicks, last.finished], [10, true]);
  eq('13.9 停在第 5 轮', last.group.round, 5);
  eq('13.9 残留词进 hardWords', last.hardWords, ['w']);
  eq('13.9 累计模糊 10 次', last.group.fuzzyCount.w, 10);
  eq('13.9 账本累计 10 次', s.state.mistakes.w?.count, 10);
  eq('13.9 收口后 active 清空', s.state.immediate.active, null);
}

// 13.10 入库：hard 按 hardWords、inMistakes 按账本镜像、lastRating 不变
{
  const s = schedulerOn('2026-11-24', 20, ['w', 'x']);
  s.plan();
  s.startImmediateWith(['w', 'x']);
  let last = s.answerImmediate('w', false)!;
  s.answerImmediate('x', true);
  let clicks = 1;
  while (!last.finished && clicks < 20) {
    last = s.answerImmediate(s.state.immediate.active!.queue[0], false)!;
    clicks += 1;
  }
  const words = last.group.words;
  const r = s.commitNewWords(words, '2026-11-24', last.hardWords);
  eq('13.10 两个词都入库', r.committed.slice().sort(), ['w', 'x']);
  eq('13.10 硬词打 hard', s.state.cards.w.hard, true);
  eq('13.10 硬词 inMistakes 镜像为真（bug 1）', s.state.cards.w.inMistakes, true);
  eq('13.10 没模糊的词不硬', [s.state.cards.x.hard, s.state.cards.x.inMistakes], [false, false]);
  eq('13.10 即时复习不写 lastRating', [s.state.cards.w.lastRating, s.state.cards.x.lastRating], [null, null]);
  eq('13.10 即时复习不加 lapse', [s.state.cards.w.lapses, s.state.cards.x.lapses], [0, 0]);
}

// 13.11 旧数据兼容：v1 旧组（无 schema）整组丢弃，词回未学池，丢弃数进 skipped
{
  const raw = {
    v: 1,
    unlearned: ['a', 'b', 'c'],
    cards: {},
    days: {},
    immediate: {
      pendingWords: [],
      pendingCount: 0,
      active: { words: ['a', 'b'], queue: ['b'], loopCount: { b: 2 }, startedOn: '2026-11-24' },
      stats: { groups: 1, cards: 2, loops: 2, skipped: 0 },
      lastAvgLoops: 0.5,
    },
  };
  const state = sanitizeScheduler(raw);
  eq('13.11 旧组被丢弃', state.immediate.active, null);
  eq('13.11 丢弃词数记进 skipped', state.immediate.stats.skipped, 2);
  eq('13.11 词仍在未学池（零数据损失）', state.unlearned.slice().sort(), ['a', 'b', 'c']);
}

// 13.12 跨学习日作废：不继承轮次与模糊计数
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b']);
  s.startImmediateWith(['a', 'b']);
  s.answerImmediate('a', false);
  const d2 = moveTo(s, '2026-11-25');
  const expired = d2.expireStaleImmediate('2026-11-25');
  eq('13.12 旧组被丢弃', expired.slice().sort(), ['a', 'b']);
  const g = d2.startImmediateWith(['a', 'b'])!;
  eq('13.12 新组从第 1 轮开始', g.round, 1);
  eq('13.12 新组模糊计数为空', g.fuzzyCount, {});
}

// 13.13 统计口径：loops = Σ fuzzyCount，groups 不按轮重复计数
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b']);
  s.plan();
  s.startImmediateWith(['a', 'b']);
  s.answerImmediate('a', false); // 1
  s.answerImmediate('a', false); // 2 → 跨轮
  s.answerImmediate('b', true);
  s.answerImmediate('a', false); // 3 → 记账
  s.answerImmediate('a', true); // 收口
  eq('13.13 loops = 累计模糊次数', s.state.immediate.stats.loops, 3);
  eq('13.13 groups 只记 1 次', s.state.immediate.stats.groups, 1);
  eq('13.13 平均模糊次数', s.state.immediate.lastAvgLoops, 1.5);
}

// 13.14 第 3 次只记一次 3：3 → 4 的增量必须是 1
{
  const s = schedulerOn('2026-11-24', 20, ['w']);
  s.startImmediateWith(['w']);
  const steps = [0, 1, 2, 3].map(() => s.answerImmediate('w', false)!);
  eq('13.14 增量序列', steps.map((r) => r.mistakeIncrement), [0, 0, 3, 1]);
  eq('13.14 账本 count 连续', s.state.mistakes.w?.count, 4);
}

// 13.15 长期档模糊：不进错词本；不认识才进
{
  const base = createCard('L', '2026-01-01');
  const long = { ...base, phase: 'long' as const, interval: 1 as const, due: null, longInterval: 30 as const, longAnchor: '2026-10-27' as const };
  const fuzzy = applyLongReview(long, 'fuzzy', '2026-11-26');
  eq('13.15 长期档模糊保留原 flag', fuzzy.inMistakes, false);
  eq('13.15 长期档模糊不加 lapse', fuzzy.lapses, 0);
  const unknown = applyLongReview(long, 'unknown', '2026-11-26');
  eq('13.15 长期档不认识加 lapse', unknown.lapses, 1);

  const st = emptyState(20);
  st.cards.L = long;
  const s = new Scheduler(st, { now: () => at('2026-11-26') });
  s.submitReview('L', 'fuzzy');
  eq('13.15 账本不记模糊', s.state.mistakes, {});
  eq('13.15 卡 flag 不被翻真', s.state.cards.L.inMistakes, false);
}

// 13.16 不变量 1–8：走一条混合链路，每步都查
{
  const s = schedulerOn('2026-11-24', 20, ['a', 'b', 'c', 'd']);
  s.plan();
  s.startImmediateWith(['a', 'b', 'c', 'd']);
  const appearances = new Map<string, number>();
  const violations: string[] = [];
  const script: Array<[string, boolean]> = [
    ['a', false], ['b', true], ['c', false], ['d', true],
    ['a', false], ['c', false], ['c', true], ['c', true],
    ['a', true], ['b', true],
  ];
  for (const [word, known] of script) {
    const before = s.state.immediate.active;
    if (!before) break;
    const key = `${word}@${before.round}`;
    appearances.set(key, (appearances.get(key) ?? 0) + 1);
    const r = s.answerImmediate(word, known);
    if (!r) continue;
    violations.push(...invariantViolations(r.group, s.state.mistakes, appearances));
  }
  eq('13.16 不变量全过', violations, []);
  const active = s.state.immediate.active;
  if (active) {
    eq('13.16 收口前 queue/crossRound 只在其中一处', active.queue.some((w) => active.crossRound.includes(w)), false);
  }
}

// ---------------------------------------------------------------- 汇总

const state: SchedulerState = emptyState();
eq('空状态默认 20', state.userDailyGoal, 20);
eq('日期差工具', diffDays('2026-11-01', '2026-11-24'), 23);

console.log(failures === 0 ? '\n全部通过' : `\n${failures} 项失败`);
process.exit(failures === 0 ? 0 : 1);
