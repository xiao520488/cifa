/**
 * 学习日（study day）工具。
 *
 * 全模块只认「学习日」字符串 `YYYY-MM-DD`：本地时间凌晨 4 点前算前一天，
 * 4 点及之后算新一天（需求 §一.5）。日期加减一律走 UTC 日序号，
 * 避免夏令时 / 月末 / 时区偏移把批次算歪。
 */

export const STUDY_DAY_START_HOUR = 4;

export type StudyDay = string;

const MS_PER_DAY = 86_400_000;

const pad2 = (n: number): string => String(n).padStart(2, '0');

const WEEKDAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

function formatCalendarDate(year: number, month: number, day: number): StudyDay {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

/** 真实时刻 → 所属学习日。 */
export function toStudyDay(date: Date = new Date()): StudyDay {
  const calendar = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (date.getHours() < STUDY_DAY_START_HOUR) calendar.setDate(calendar.getDate() - 1);
  return formatCalendarDate(calendar.getFullYear(), calendar.getMonth(), calendar.getDate());
}

/** 学习日 → 该日历日 00:00 的本地时间对象（仅用于取年月日，不用于比较时间）。 */
export function fromStudyDay(day: StudyDay): Date {
  const [year, month, date] = day.split('-').map(Number);
  return new Date(year, month - 1, date);
}

export function isValidStudyDay(value: unknown): value is StudyDay {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, date] = value.split('-').map(Number);
  if (month < 1 || month > 12 || date < 1 || date > 31) return false;
  const probe = new Date(Date.UTC(year, month - 1, date));
  return probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === date;
}

/** 学习日 → 连续日序号（整数），用于加减与比较。 */
export function dayNumber(day: StudyDay): number {
  const [year, month, date] = day.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, date) / MS_PER_DAY);
}

function fromDayNumber(value: number): StudyDay {
  const probe = new Date(value * MS_PER_DAY);
  return formatCalendarDate(probe.getUTCFullYear(), probe.getUTCMonth(), probe.getUTCDate());
}

export function addDays(day: StudyDay, delta: number): StudyDay {
  return fromDayNumber(dayNumber(day) + Math.trunc(delta));
}

/** to - from 的天数差（可为负）。 */
export function diffDays(from: StudyDay, to: StudyDay): number {
  return dayNumber(to) - dayNumber(from);
}

export function compareDays(a: StudyDay, b: StudyDay): number {
  return dayNumber(a) - dayNumber(b);
}

/** 0 = 周日 … 6 = 周六。 */
export function weekday(day: StudyDay): number {
  return new Date(dayNumber(day) * MS_PER_DAY).getUTCDay();
}

export function weekdayLabel(day: StudyDay): string {
  return WEEKDAY_LABELS[weekday(day)];
}

/** 不早于 day 的下一个目标星期（includeSelf 时 day 本身可命中）。 */
export function nextWeekday(day: StudyDay, target: number, includeSelf = true): StudyDay {
  const current = weekday(day);
  let delta = (target - current + 7) % 7;
  if (delta === 0 && !includeSelf) delta = 7;
  return addDays(day, delta);
}

/** 严格早于 day 的最近一个目标星期。 */
export function previousWeekday(day: StudyDay, target: number): StudyDay {
  let delta = (weekday(day) - target + 7) % 7;
  if (delta === 0) delta = 7;
  return addDays(day, -delta);
}

export function isMonthFirst(day: StudyDay): boolean {
  return day.slice(8) === '01';
}

/** 不早于 day 的下一个 1 号（includeSelf 时 day 本身可命中）。 */
export function nextMonthFirst(day: StudyDay, includeSelf = true): StudyDay {
  if (isMonthFirst(day) && includeSelf) return day;
  const [year, month] = day.split('-').map(Number);
  return month === 12 ? `${year + 1}-01-01` : `${year}-${pad2(month + 1)}-01`;
}

/** 严格早于 day 的最近一个 1 号。 */
export function previousMonthFirst(day: StudyDay): StudyDay {
  const [year, month] = day.split('-').map(Number);
  return month === 1 ? `${year - 1}-12-01` : `${year}-${pad2(month - 1)}-01`;
}

/** `11月23日`，用于日历与文案。 */
export function formatMonthDay(day: StudyDay): string {
  const [, month, date] = day.split('-').map(Number);
  return `${month}月${date}日`;
}

/** 从 from 起连续 count 个学习日。 */
export function studyDayRange(from: StudyDay, count: number): StudyDay[] {
  const out: StudyDay[] = [];
  for (let i = 0; i < count; i += 1) out.push(addDays(from, i));
  return out;
}

/** 以 day 为最新一天，向前取 count 天（含 day），[0] 是最早的一天。 */
export function lastDays(day: StudyDay, count: number): StudyDay[] {
  return studyDayRange(addDays(day, -(count - 1)), count);
}
