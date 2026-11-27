/**
 * 月历的纯函数：月份运算、42 格排布、格子状态。
 *
 * 刻意放在 `lib/` 而不是组件里：`cellState()` 是「哪天算完成」的唯一口径，
 * 必须能被单测直接调，不能藏在 JSX 三元里。
 */

import {
  addDays,
  compareDays,
  dayNumber,
  diffDays,
  formatMonthDay,
  fromStudyDay,
  weekday,
  weekdayLabel,
} from './scheduler/studyDay.ts';
import type { StudyDay } from './scheduler/studyDay.ts';
import type { CalendarDay } from './scheduler/types.ts';

/** 周一起头（用户 2026-11-27 拍板；图 1 的周日起头不采用）。 */
const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'] as const;
export { WEEKDAY_LABELS };

const MONTH_NAMES = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'] as const;

export function monthLabel(day: StudyDay): { name: string; year: string } {
  const date = fromStudyDay(day);
  return { name: `${MONTH_NAMES[date.getMonth()]}月`, year: String(date.getFullYear()) };
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function monthOf(day: StudyDay): StudyDay {
  const date = fromStudyDay(day);
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-01`;
}

export function daysInMonth(day: StudyDay): number {
  const date = fromStudyDay(day);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** 平移月份；目标月没有这一天时夹到月末（1/31 加一个月 → 2/28）。 */
export function addMonths(day: StudyDay, delta: number): StudyDay {
  const date = fromStudyDay(day);
  const target = new Date(date.getFullYear(), date.getMonth() + delta, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  const stamp = new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), last));
  return `${stamp.getFullYear()}-${pad2(stamp.getMonth() + 1)}-${pad2(stamp.getDate())}`;
}

export interface MonthCell {
  day: StudyDay;
  /** false = 上月末 / 下月初的补位格，只显示灰数字、不可点 */
  inMonth: boolean;
}

export interface MonthGrid {
  /** 含首尾，给 `calendarRange()` 用 */
  start: StudyDay;
  end: StudyDay;
  /** 5 行（35）或 6 行（42），永远 7 的倍数 */
  cells: MonthCell[];
}

/**
 * 排布一个月的格子。周一为第 0 列，所以月初要回退到当周周一；
 * 行数按「补位 + 当月天数」向上取整，并保底 5 行——否则 2 月只有 4 行时
 * 日历高度会在翻月时跳一下。
 */
export function monthGrid(anchor: StudyDay): MonthGrid {
  const first = monthOf(anchor);
  const total = daysInMonth(anchor);
  const offset = (weekday(first) + 6) % 7;
  const weeks = Math.max(5, Math.ceil((offset + total) / 7));
  const start = addDays(first, -offset);
  const cells: MonthCell[] = [];
  for (let i = 0; i < weeks * 7; i += 1) {
    const day = addDays(start, i);
    cells.push({ day, inMonth: compareDays(day, first) >= 0 && diffDays(first, day) < total });
  }
  return { start, end: cells[cells.length - 1].day, cells };
}

/**
 * 格子的视觉状态。**「完成」只看到期复习，不看新词**（用户 2026-11-27 拍板）：
 * 新词是预算不是任务，被闸挡住的日子不该显示成没完成。
 *
 * `empty` 同时覆盖「那天没打开 App」和「打开了但无事可做」——数据里没有别的区分，
 * 写死成「没记录」比编一个状态诚实。
 */
export type CellState = 'done' | 'partial' | 'miss' | 'empty' | 'future' | 'today';

export function cellState(day: CalendarDay): CellState {
  if (day.estimated) return 'future';
  if (day.isToday) return 'today';
  if (day.dueTotal === 0 && day.newWordDone === 0) return 'empty';
  if (day.doneTotal >= day.dueTotal) return 'done';
  if (day.doneTotal > 0) return 'partial';
  return 'miss';
}

/** 读屏用的整格描述：日期 + 状态 + 关键数字（视觉上格子只有日号）。 */
export function cellAriaLabel(day: CalendarDay): string {
  const head = `${formatMonthDay(day.day)} ${weekdayLabel(day.day)}`;
  if (day.estimated) {
    return `${head}，还没到：计划新词 ${day.newWordPlan}，已排定复习 ${day.dueTotal} 词`;
  }
  if (day.isToday) {
    return `${head}，今天：到期复习 ${day.doneTotal}/${day.dueTotal}，新词计划 ${day.newWordPlan}`;
  }
  if (day.dueTotal === 0 && day.newWordDone === 0) return `${head}，这天没有记录`;
  const tail = day.overdue > 0 ? `，还差 ${day.overdue} 词未做` : '';
  return `${head}，到期复习 ${day.doneTotal}/${day.dueTotal}，新词 ${day.newWordDone}/${day.newWordPlan}${tail}`;
}

/** 日历格子里那个「几号」的文本，月底补位格也用同一个函数。 */
export function cellNumber(day: StudyDay): string {
  return String(dayNumber(day));
}
