/**
 * 性能基准（`pnpm bench:scheduler`）：5000 词、模拟 365 天。
 *
 * 验收线：单次 `plan()` 与单次 `settle()` 都要 < 50ms（取 max，不是平均）。
 * 重点盯 cards.ts 的流转有没有退化成 O(n²)——5000 词下任何一次「对全量卡片再遍历一遍」
 * 都会被放大 365 次，所以这里逐日计时，超线直接非零退出。
 */

import {
  Scheduler,
  addDays,
  formatMonthDay,
  toStudyDay,
} from '../src/lib/scheduler/index.ts';
import type { Rating, StudyDay } from '../src/lib/scheduler/index.ts';

const WORD_COUNT = 5000;
const DAYS = 365;
const BUDGET_MS = 50;
const START: StudyDay = '2026-01-01';
/** 每 N 天断一次签，逼出逾期池与 catchUp 的真实开销。 */
const ABSENT_EVERY = 37;

function at(day: StudyDay): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 9, 0, 0);
}

function ratingFor(word: string, dayIndex: number): Rating {
  const index = Number(word.replace(/\D/g, '')) || 0;
  const roll = (index * 31 + dayIndex * 17) % 100;
  if (roll < 5) return 'unknown';
  if (roll < 13) return 'fuzzy';
  return 'known';
}

const pool = Array.from({ length: WORD_COUNT }, (_, index) => `w${String(index + 1).padStart(5, '0')}`);

let today: StudyDay = START;
const scheduler = Scheduler.create(20, { now: () => at(today) });

const seedStart = performance.now();
scheduler.seed(pool);
const seedMs = performance.now() - seedStart;

const planMs: number[] = [];
const settleMs: number[] = [];
const calendarMs: number[] = [];
const sessionMs: number[] = [];

type Stat = { mean: number; p95: number; max: number };
function stat(values: number[]): Stat {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = sorted.reduce((total, value) => total + value, 0);
  const p95 = sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] ?? 0;
  return { mean: sum / Math.max(1, sorted.length), p95, max: sorted[sorted.length - 1] ?? 0 };
}

function fmt(value: number): string {
  return `${value.toFixed(2)}ms`;
}

let reviewsDone = 0;
let newLearnedTotal = 0;
let overdueClearedTotal = 0;
const tail: string[] = [];
const rejected: string[] = [];

for (let dayIndex = 0; dayIndex < DAYS; dayIndex += 1) {
  today = addDays(START, dayIndex);
  const absent = dayIndex > 0 && dayIndex % ABSENT_EVERY === ABSENT_EVERY - 1;

  // 断签日：连启动都不启动，第二天靠 startOfSession 的 catchUp 补
  if (absent) continue;

  // 断签后的第一天：走一次「启动」路径（幂等结算 + 断档补结算）
  if (dayIndex > 0 && (dayIndex + 1) % ABSENT_EVERY === 1) {
    const t0 = performance.now();
    scheduler.startOfSession();
    sessionMs.push(performance.now() - t0);
  }

  // ---- plan()：当天第一次调用 = 拍快照 + 清扫逾期 + 全量批次装配
  const p0 = performance.now();
  const plan = scheduler.plan(today);
  planMs.push(performance.now() - p0);

  // ---- 作答：先把今日批次做完，再清最多 30 个逾期
  for (const batch of plan.shortTermBatches) {
    for (const word of batch.words) {
      const outcome = scheduler.submitReview(word, ratingFor(word, dayIndex), { day: today });
      if (!outcome.ok) rejected.push(`${today} ${word}：${outcome.reason ?? ''}`);
      reviewsDone += 1;
    }
  }
  let cleared = 0;
  for (const batch of plan.overduePool) {
    for (const word of batch.words) {
      if (cleared >= 30) break;
      const outcome = scheduler.reviewOverdue(word, ratingFor(word, dayIndex), today);
      if (!outcome.ok) rejected.push(`${today} ${word}（逾期）：${outcome.reason ?? ''}`);
      cleared += 1;
      reviewsDone += 1;
    }
    if (cleared >= 30) break;
  }
  overdueClearedTotal += cleared;

  // ---- 学新词（learnNewWord 内部过配额闸），凑够 10 个跑一次即时复习
  for (const word of scheduler.nextNewWords(undefined, today)) {
    if (!scheduler.learnNewWord(word, today).ok) break;
    newLearnedTotal += 1;
    if (scheduler.state.immediate.pendingCount >= 10) {
      const group = scheduler.startImmediate();
      if (!group) continue;
      let guard = 0;
      while (scheduler.state.immediate.active && guard < 400) {
        guard += 1;
        const queue = scheduler.state.immediate.active.queue;
        const word2 = queue[0];
        scheduler.answerImmediate(word2, ratingFor(word2, dayIndex) !== 'unknown');
      }
    }
  }

  // ---- settle()：当天结束结算（下班结算）
  const s0 = performance.now();
  const report = scheduler.settle(today);
  settleMs.push(performance.now() - s0);

  if (dayIndex >= DAYS - 10) {
    tail.push(
      `  ${formatMonthDay(today)} 到期 ${plan.totals.dueToday}（完成 ${plan.totals.doneToday}）` +
        ` 逾期 ${plan.totals.overdue}  新词 ${plan.totals.newLearned}/${plan.newWordLimit}` +
        `  完成率 ${report.result.metrics.completionRate}  次日 ${report.result.newWordLimit} ${report.result.action}` +
        `  acc ${report.result.metrics.recentAcc}`,
    );
  }

  // ---- calendar(8)：每 15 天抽一次，避免把基准拖成「日历测试」
  if (dayIndex % 15 === 0) {
    const c0 = performance.now();
    scheduler.calendarView(8, today);
    calendarMs.push(performance.now() - c0);
  }
}

const lastDay = addDays(START, DAYS - 1);
today = lastDay;
const snapshotStart = performance.now();
const state = scheduler.snapshot();
const snapshotMs = performance.now() - snapshotStart;
const serializeStart = performance.now();
const json = JSON.stringify(state);
const serializeMs = performance.now() - serializeStart;
const hydrateStart = performance.now();
const restored = new Scheduler(JSON.parse(json) as typeof state, { now: () => at(today) });
restored.plan(lastDay);
const hydrateMs = performance.now() - hydrateStart;

const stats = scheduler.stats();
const p = stat(planMs);
const s = stat(settleMs);
const c = stat(calendarMs);
const sess = stat(sessionMs);
const statsLine = (label: string, value: Stat, budget: number | null, count: number): string => {
  const flag = budget === null ? '' : value.max <= budget ? ' ✓' : ' ✗ 超线';
  return `${label.padEnd(22)} 平均 ${fmt(value.mean).padStart(9)}  p95 ${fmt(value.p95).padStart(9)}  最大 ${fmt(value.max).padStart(9)}  （${count} 次）${flag}`;
};

console.log('══ 5000 词 / 365 天 性能基准 ══');
console.log(`种子池 ${WORD_COUNT} 词，${seedMs.toFixed(1)}ms`);
console.log(`模拟 ${DAYS} 天：复习 ${reviewsDone} 次、学新词 ${newLearnedTotal} 个、清逾期 ${overdueClearedTotal} 个`);
console.log(`被拒绝的作答 ${rejected.length} 次${rejected.length > 0 ? `（前 3 条：${rejected.slice(0, 3).join('；')}）` : ''}`);
console.log('');
console.log(statsLine('plan()', p, BUDGET_MS, planMs.length));
console.log(statsLine('settle()', s, BUDGET_MS, settleMs.length));
console.log(statsLine('calendarView(8)', c, BUDGET_MS * 2, calendarMs.length));
console.log(statsLine('startOfSession()', sess, BUDGET_MS * 2, sessionMs.length));
console.log('');
console.log(`状态规模：卡 ${Object.keys(state.cards).length} 张 / 天记录 ${Object.keys(state.days).length} 条 / 未学 ${state.unlearned.length} 个`);
console.log(`snapshot() 深拷贝 ${fmt(snapshotMs)}；JSON ${(json.length / 1024 / 1024).toFixed(2)}MB，stringify ${fmt(serializeMs)}`);
console.log(`冷启动（JSON.parse + new Scheduler + plan）${fmt(hydrateMs)}`);
console.log(`最终：基线 ${stats.currentLimit}，目标 ${stats.userDailyGoal}，连续优秀 ${stats.consecutiveGoodDays} 天，历史正确率 ${stats.lifetimeAcc === null ? '—' : `${(stats.lifetimeAcc * 100).toFixed(1)}%`}`);
console.log(`最后一天 ${formatMonthDay(lastDay)}（studyDay ${toStudyDay(at(lastDay))}）`);
console.log('');
console.log('最后 10 天：');
console.log(tail.join('\n'));

const failures: string[] = [];
if (p.max > BUDGET_MS) failures.push(`plan() 最大 ${fmt(p.max)} > ${BUDGET_MS}ms`);
if (s.max > BUDGET_MS) failures.push(`settle() 最大 ${fmt(s.max)} > ${BUDGET_MS}ms`);
if (c.max > BUDGET_MS * 2) failures.push(`calendarView(8) 最大 ${fmt(c.max)} > ${BUDGET_MS * 2}ms`);
if (sess.max > BUDGET_MS * 2) failures.push(`startOfSession() 最大 ${fmt(sess.max)} > ${BUDGET_MS * 2}ms`);

console.log('');
if (failures.length > 0) {
  for (const failure of failures) console.log(`✗ ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`✓ 全部在预算内（plan/settle < ${BUDGET_MS}ms）`);
}
