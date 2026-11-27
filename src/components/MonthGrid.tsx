/**
 * 月历网格（7 列，周一起头）。
 *
 * 结构写死在 `app.css` 基线里（`grid-template-columns: repeat(7, …)`），
 * 皮肤只准改格子的外观，不许改列数——这条在 `audit-month.js` 里有闸。
 *
 * 格子内容只有三样：日号、状态点、今天的描边。390 下格宽 ~49px，
 * 任何数字都塞不进去，所以「18 词」全部进下面的详情面板。
 */

import { formatMonthDay, weekdayLabel } from '../lib/scheduler';
import type { CalendarDay } from '../lib/scheduler';
import type { StudyDay } from '../lib/scheduler';
import { WEEKDAY_LABELS, cellAriaLabel, cellState, monthLabel, monthOf } from '../lib/calendarState';
import type { MonthGrid as MonthGridData } from '../lib/calendarState';

interface MonthGridProps {
  /** 本格月份锚点（当月 1 号），与 `selected` 分开：选中日可能跨月 */
  month: StudyDay;
  grid: MonthGridData;
  today: StudyDay;
  selected: StudyDay;
  byDay: Map<StudyDay, CalendarDay>;
  onSelect: (day: StudyDay, inMonth: boolean) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export function MonthGrid({ month, grid, today, selected, byDay, onSelect, onPrev, onNext, onToday }: MonthGridProps) {
  const label = monthLabel(month);
  const atCurrentMonth = monthOf(today) === monthOf(month);

  return (
    <section className="month" aria-label={`${label.year} 年 ${label.name}的月历`}>
      <header className="month__head">
        <h1 className="month__title">
          {label.name}
          <span className="month__year">{label.year}</span>
        </h1>
        <button type="button" className="month__nav" aria-label="上个月" onClick={onPrev}>
          ‹
        </button>
        <button type="button" className="month__nav" aria-label="下个月" onClick={onNext}>
          ›
        </button>
        <button type="button" className="month__today" onClick={onToday} disabled={atCurrentMonth}>
          今天
        </button>
      </header>

      <div className="month__weekdays" aria-hidden="true">
        {WEEKDAY_LABELS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="month__grid">
        {grid.cells.map(({ day, inMonth }) => {
          const data = byDay.get(day);
          const state = data ? cellState(data) : 'empty';
          const isToday = day === today;
          const isSelected = day === selected;
          return (
            <button
              key={day}
              type="button"
              className="cell"
              data-state={state}
              data-out={inMonth ? undefined : '1'}
              aria-current={isToday ? 'date' : undefined}
              aria-selected={isSelected}
              aria-label={data ? cellAriaLabel(data) : formatMonthDay(day)}
              title={data ? `${formatMonthDay(day)} ${weekdayLabel(day)}` : undefined}
              onClick={() => onSelect(day, inMonth)}
              tabIndex={inMonth ? 0 : -1}
            >
              <span className="cell__n">{Number(day.slice(8, 10))}</span>
              {state !== 'empty' && state !== 'future' ? <span className="cell__dot" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
