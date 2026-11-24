/**
 * 40 天模拟（`pnpm demo:scheduler`）：把学习者的一天天压成一条时间线，
 * 打印每日结算、日历和「为什么今天新词少了」的实际解释。
 *
 * 模拟剧本：正常学 10 天 → 第 11–13 天断签 → 第 14 天回来清逾期 →
 * 第 25–27 天状态变差（正确率掉到 70% 上下）→ 之后恢复。
 */

import { Scheduler, addDays, formatMonthDay, weekdayLabel } from '../src/lib/scheduler/index.ts';
import type { Rating } from '../src/lib/scheduler/index.ts';

const START = '2026-11-01';
const TOTAL_DAYS = 40;
const VACATION_FROM = 11;
const VACATION_TO = 13;
const SLUMP_FROM = 25;
const SLUMP_TO = 27;

function at(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 9, 0, 0);
}

const pool = Array.from({ length: 1200 }, (_, index) => `word${String(index + 1).padStart(4, '0')}`);

let today = START;
const scheduler = Scheduler.create(20, { now: () => at(today) });
scheduler.seed(pool);

/** 模拟作答质量：滑落期更差，平时偶尔忘。 */
function ratingFor(word: string, dayIndex: number, seen: number): Rating {
  const index = Number(word.slice(4));
  const roll = (index * 37 + seen * 11 + dayIndex * 17) % 100;
  if (dayIndex >= SLUMP_FROM && dayIndex <= SLUMP_TO) {
    if (roll < 25) return 'unknown';
    if (roll < 55) return 'fuzzy';
    return 'known';
  }
  if (roll < 3) return 'unknown';
  if (roll < 11) return 'fuzzy';
  return 'known';
}

const lines: string[] = [];
const push = (text = '') => lines.push(text);
const timeline: string[] = [];

function reviewAll(day: string, dayIndex: number) {
  const plan = scheduler.plan(day);
  for (const batch of plan.shortTermBatches) {
    batch.words.forEach((word, index) => {
      scheduler.submitReview(word, ratingFor(word, dayIndex, index), { day });
    });
  }
  return plan;
}

/** 清逾期：每天最多按建议上限消化（需求 §七.5）。 */
function clearOverdue(day: string, dayIndex: number, limit = 30) {
  const plan = scheduler.plan(day);
  let cleared = 0;
  for (const batch of plan.overduePool) {
    for (const word of batch.words) {
      if (cleared >= limit) return cleared;
      scheduler.reviewOverdue(word, ratingFor(word, dayIndex, cleared), day);
      cleared += 1;
    }
  }
  return cleared;
}

function learnNew(day: string, dayIndex: number) {
  const words = scheduler.nextNewWords(undefined, day);
  for (const word of words) {
    scheduler.learnNewWord(word, day);
    if (scheduler.state.immediate.pendingCount < 10) continue;
    const group = scheduler.startImmediate();
    if (!group) continue;
    let guard = 0;
    while (scheduler.state.immediate.active && guard < 400) {
      guard += 1;
      const queue = scheduler.state.immediate.active.queue;
      const next = queue[0];
      scheduler.answerImmediate(next, ratingFor(next, dayIndex, guard) !== 'unknown');
    }
  }
  return words.length;
}

let learnedTotal = 0;
let lastSettled: string | null = addDays(START, -1);
const detail = new Map<string, { plan: ReturnType<typeof reviewAll>; report: ReturnType<typeof scheduler.settle>; learned: number; cleared: number }>();

for (let dayIndex = 0; dayIndex < TOTAL_DAYS; dayIndex += 1) {
  today = addDays(START, dayIndex);
  if (dayIndex >= VACATION_FROM && dayIndex <= VACATION_TO) {
    if (dayIndex === VACATION_FROM) {
      timeline.push(`（第 ${VACATION_FROM + 1}–${VACATION_TO + 1} 天断签，什么都没做）`);
    }
    continue;
  }

  // 回来那天补结算断掉的几天
  if (lastSettled && dayIndex > 0) {
    const gapStart = addDays(lastSettled, 1);
    if (gapStart < today) {
      const reports = scheduler.catchUp(gapStart, today);
      const last = reports[reports.length - 1];
      timeline.push(
        `（补结算 ${reports.length} 天 → 逾期 ${last ? last.result.metrics.overdueBacklog : 0} 个，新词上限 ${last ? last.result.newWordLimit : 0} 个）`,
      );
    }
  }

  const plan = reviewAll(today, dayIndex);
  const cleared = clearOverdue(today, dayIndex);
  const learned = learnNew(today, dayIndex);
  learnedTotal += learned;
  const report = scheduler.settle(today);
  lastSettled = today;
  const doneToday = scheduler.state.days[today]?.doneToday.length ?? 0;

  timeline.push(
    `${formatMonthDay(today)} ${weekdayLabel(today)}  复习 ${plan.totals.dueToday}（完成 ${doneToday}）` +
      `  新词 ${learned}/${plan.newWordLimit}  逾期 ${plan.totals.overdue}（清 ${cleared}）` +
      `  acc ${report.result.metrics.recentAcc}  limit ${report.result.newWordLimit} ${report.result.action}`,
  );
  detail.set(today, { plan, report, learned, cleared });
}

push('══ 40 天时间线 ══');
for (const line of timeline) push(line);

const recentDays = [...detail.keys()].slice(-3);
for (const day of recentDays) {
  const item = detail.get(day);
  if (!item) continue;
  const batchText =
    item.plan.plannedBatches
      .map((batch) => `${batch.daysAgo}天前(${formatMonthDay(batch.sourceDate)}):${batch.wordCount}`)
      .join(' ') || '无';
  push('');
  push(`── 明细 ${formatMonthDay(day)} ${weekdayLabel(day)} ──`);
  push(`当日批次  ${batchText}`);
  push(`新词      ${item.learned}/${item.plan.newWordLimit}（目标 ${item.plan.userDailyGoal}）`);
  push(`用户解释  ${item.plan.reason}`);
  push(`结算原因  ${item.report.result.reason}`);
}

push('');
push(`══ 未来 7 天日历（今天 = ${today}）══`);
for (const item of scheduler.calendar(8, today)) {
  const batches = item.shortTermBatches.map((batch) => `${batch.daysAgo}天前:${batch.wordCount}`).join(' ') || '—';
  const long = item.longTermBatches.map((batch) => `${batch.type}:${batch.wordCount}`).join(' ') || '—';
  push(
    `${item.isToday ? '▶' : ' '} ${formatMonthDay(item.day)} ${item.weekdayLabel} ` +
      `新词 ${item.newWordPlan}（已学 ${item.newWordDone}） 复习 ${batches} 长期 ${long}${item.estimated ? ' [预估]' : ''}`,
  );
}

push('');
const stats = scheduler.stats();
push('══ 40 天汇总 ══');
push(
  `新词 ${learnedTotal} 个 / 未学 ${stats.unlearned} 个 / 短期 ${stats.shortCards} 张 / 长期 ${stats.longCards} 张 ` +
    `/ 归档 ${stats.archivedCards} 条 / 历史正确率 ${stats.lifetimeAcc === null ? '—' : `${(stats.lifetimeAcc * 100).toFixed(1)}%`}`,
);
push(`基线 ${stats.currentLimit}（目标 ${stats.userDailyGoal}，上限 ${stats.maxLimit}），连续优秀 ${stats.consecutiveGoodDays} 天`);

push('');
push('══ 最后一次结算 JSON ══');
push(JSON.stringify(scheduler.state.lastSettlement, null, 2));

console.log(lines.join('\n'));
