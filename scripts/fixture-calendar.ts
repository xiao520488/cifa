/**
 * 造两份日历样本，对应 `REFACTOR_PLAN.md` §6 的两类格子：
 *
 * 1. `__fixture-calendar.json`——**真机第一天**（用户报的场景）：今天学完 20 个新词、
 *    明天到期 20 词、26 日之后没排上复习。看「复习 / 新词 / 复习 —」三种槽。
 * 2. `__fixture-calendar-long.json`——**连续优秀 40 天**：基线涨到 25（↑ +5 角标）、
 *    有卡进长期档（长期 30 天批次）、今天有到期未做完（复习 12/20 这种带完成度的格子）。
 *
 * 用法：跑本脚本 → 浏览器先到同源非 App 页（`/icon.svg`）写 localStorage 再回 `/`
 * （App `pagehide` 会强制存盘，直接在 App 页写会被旧状态覆盖——NOTES 老坑）。
 * **看完必须删掉 public 下那两个 json**，否则会被打进 dist。
 */

import { Scheduler, addDays } from '../src/lib/scheduler/index.ts';
import type { StudyDay } from '../src/lib/scheduler/index.ts';
import { writeFileSync } from 'node:fs';

const TODAY = '2026-11-24';

function at(day: string): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 9, 0, 0);
}

function dump(name: string, scheduler: Scheduler): void {
  const target = new URL(`../public/__fixture-${name}.json`, import.meta.url);
  writeFileSync(target, JSON.stringify(scheduler.snapshot()));
  console.log(`--- ${name} → ${target.pathname}`);
  for (const day of scheduler.calendarView(8).days) {
    console.log(
      `${day.day} 复习${day.dueTotal}/${day.doneTotal} 新词${day.newWordPlan}(目标${day.newWordGoal}) 长期${day.longTermBatches.length} 预估${day.estimated}`,
    );
  }
}

/* 场景 1：第一天学完 20 个新词 */
const day1Words = Array.from({ length: 20 }, (_, index) => `cal${index}`);
const first = Scheduler.create(20, { now: () => at(TODAY) });
first.seed(day1Words.concat(Array.from({ length: 200 }, (_, index) => `pool${index}`)));
first.plan();
first.startImmediateWith(day1Words);
for (const word of day1Words) first.answerImmediate(word, true);
first.commitNewWords(day1Words);
dump('calendar', first);

/* 场景 2：连续优秀 40 天（长期批次 + ↑ +5 + 今天欠着几个复习） */
const START: StudyDay = '2026-10-16';
const pool = Array.from({ length: 900 }, (_, index) => `w${index}`);
// 时钟必须跟着剧本走：`settle(day)` 拒绝结算比 engine.today() 更晚的一天
let clockDay: StudyDay = START;
const veteran = Scheduler.create(20, { now: () => at(clockDay) });
veteran.seed(pool);
for (let index = 0; index < 39; index += 1) {
  const day = addDays(START, index);
  clockDay = day;
  const plan = veteran.plan(day);
  for (const batch of plan.shortTermBatches) {
    for (const word of batch.words) veteran.submitReview(word, 'known', { day });
  }
  for (const batch of plan.longTermBatches) {
    for (const word of batch.words) veteran.submitReview(word, 'known', { day });
  }
  for (const word of veteran.nextNewWords(undefined, day)) {
    if (!veteran.learnNewWord(word, day).ok) break;
    if (veteran.state.immediate.pendingCount >= 10) {
      veteran.startImmediate();
      let guard = 0;
      while (veteran.state.immediate.active && guard < 400) {
        const next = veteran.state.immediate.active.queue[0];
        veteran.answerImmediate(next, true);
      }
    }
  }
  veteran.settle(day);
}
// 今天故意只做一半，格子才带得上「复习 12/20」这种完成度
clockDay = TODAY;
const todayPlan = veteran.plan(TODAY);
let answered = 0;
for (const batch of todayPlan.shortTermBatches) {
  for (const word of batch.words) {
    if (answered >= 12) break;
    veteran.submitReview(word, 'known', { day: TODAY });
    answered += 1;
  }
}
// 故意把 12 张卡推进长期档，让格子里出现「长期 30 天 · 12 词」那个槽（周日批次日）
const longNames = Object.keys(veteran.state.cards).slice(0, 12);
for (const name of longNames) {
  const card = veteran.state.cards[name];
  card.phase = 'long';
  card.due = null;
  card.longInterval = 30;
  card.longAnchor = addDays('2026-11-29', -30);
}
// 再塞 8 张 90 天档，批次日 12 月 1 号（每月 1 号）
for (const name of Object.keys(veteran.state.cards).slice(12, 20)) {
  const card = veteran.state.cards[name];
  card.phase = 'long';
  card.due = null;
  card.longInterval = 90;
  card.longAnchor = addDays('2026-12-01', -90);
}
dump('calendar-long', veteran);

