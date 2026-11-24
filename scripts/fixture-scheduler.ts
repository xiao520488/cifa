/**
 * 生成一份「有历史」的调度状态样本，用来在浏览器里肉眼核对日历/复习页。
 *
 * 不是测试、也不进构建：跑完把 `public/__fixture-scheduler.json` 写出来，
 * 在页面里 `fetch` 一遍塞进 localStorage 再刷新即可看到真实的多日状态
 * （浏览器没法模拟跨天，只能这样造数据）。**看完必须删掉这个文件**，否则会被打进 dist。
 *
 * 灌数据有个坑：App 关闭时会 `pagehide` 强制存盘，直接在当前页写 localStorage 会被内存里的旧状态覆盖。
 * 正确姿势：先导航到同源的非 App 地址（例如 `/src/lib/types.ts`）再写，然后才回 `/`。
 *
 * 默认剧本：11-14…11-23 每天学满、全部按时复习 → 打开时「今天」有 16 个到期复习，
 * 一张都没做 → 复习闸生效（新词 0，提示「今天的到期复习只完成 0%」）。
 * 想看逾期闸 / relearned 归池，把 START 改成 2026-11-08、ACTIVE_DAYS 改成 2。
 */

import { Scheduler, addDays } from '../src/lib/scheduler/index.ts';
import type { Rating, StudyDay } from '../src/lib/scheduler/index.ts';
import cet4 from '../src/data/cet4.json' with { type: 'json' };
import { writeFileSync } from 'node:fs';

const START: StudyDay = '2026-11-14';
const ACTIVE_DAYS = 10;

const words = (cet4 as { words: Array<{ w: string }> }).words.map((word) => word.w);

function at(day: StudyDay): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date, 9, 0, 0);
}

function ratingFor(word: string, dayIndex: number): Rating {
  const index = word.length + word.charCodeAt(0);
  const roll = (index * 13 + dayIndex * 7) % 100;
  if (roll < 6) return 'unknown';
  if (roll < 14) return 'fuzzy';
  return 'known';
}

let today: StudyDay = START;
const scheduler = Scheduler.create(20, { now: () => at(today) });
scheduler.seed(words);

for (let dayIndex = 0; dayIndex < ACTIVE_DAYS; dayIndex += 1) {
  today = addDays(START, dayIndex);
  const plan = scheduler.plan(today);
  for (const batch of plan.shortTermBatches) {
    for (const word of batch.words) scheduler.submitReview(word, ratingFor(word, dayIndex), { day: today });
  }
  for (const batch of plan.longTermBatches) {
    for (const word of batch.words) scheduler.submitReview(word, ratingFor(word, dayIndex), { day: today });
  }
  for (const word of scheduler.nextNewWords(undefined, today)) {
    if (!scheduler.learnNewWord(word, today).ok) break;
    if (scheduler.state.immediate.pendingCount >= 10) {
      scheduler.startImmediate();
      let guard = 0;
      while (scheduler.state.immediate.active && guard < 400) {
        guard += 1;
        const next = scheduler.state.immediate.active.queue[0];
        scheduler.answerImmediate(next, ratingFor(next, dayIndex) !== 'unknown');
      }
    }
  }
  scheduler.settle(today);
}

const target = new URL('../public/__fixture-scheduler.json', import.meta.url);
writeFileSync(target, JSON.stringify(scheduler.snapshot()));
const stats = scheduler.stats();
console.log(
  `已写出 ${target.pathname}：卡 ${stats.shortCards + stats.longCards} 张 / 未学 ${stats.unlearned} / 基线 ${stats.currentLimit}`,
);
