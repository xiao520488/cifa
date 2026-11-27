/**
 * 数据页：真月历 + 当天详情（只读）。
 *
 * 这一层不接作答、不写库。数据只有两个来源：
 * - `engine.calendarRange()`：区间内每一天的 `CalendarDay`（过去读快照，今天/未来推算）；
 * - `engine.plan()` / `stats()`：今天的三道闸与连续优秀。
 *
 * 一个状态机：`month`（翻到哪个月）+ `selected`（点哪一天）。点格子只改 `selected`，
 * 不重新算范围——同一份 `CalendarDay` 同时喂格子和面板，两边数字才不可能打架。
 */

import { useEffect, useMemo, useState } from 'react';
import { formatMonthDay, weekdayLabel } from '../lib/scheduler';
import type { Scheduler, StudyDay } from '../lib/scheduler';
import { addMonths, monthGrid, monthOf } from '../lib/calendarState';
import { DayDetail } from './DayDetail';
import { MonthGrid } from './MonthGrid';

interface CalendarScreenProps {
  engine: Scheduler;
  version: number;
}

export function CalendarScreen({ engine, version }: CalendarScreenProps) {
  const { plan, stats } = useMemo(() => {
    void version;
    return { plan: engine.plan(), stats: engine.stats() };
  }, [engine, version]);

  const today = plan.day;
  const [month, setMonth] = useState<StudyDay>(() => monthOf(today));
  const [selected, setSelected] = useState<StudyDay>(today);

  const grid = useMemo(() => monthGrid(month), [month]);
  const days = useMemo(() => {
    void version;
    return engine.calendarRange(grid.start, grid.end, today);
  }, [engine, version, grid, today]);

  const byDay = useMemo(() => new Map(days.map((day) => [day.day, day])), [days]);

  // 选中的那一天必须能拿到数据：翻到没有数据的月份时退回当月 1 号，
  // 否则面板会停在上一页的日期上，看起来像「点了没反应」。
  useEffect(() => {
    if (byDay.has(selected)) return;
    setSelected(grid.cells.find((cell) => cell.inMonth)?.day ?? today);
  }, [byDay, grid, selected, today]);

  const current = byDay.get(selected);

  const goMonth = (delta: number) => {
    const next = monthOf(addMonths(month, delta));
    setMonth(next);
    // 本月含今天就选今天，否则选 1 号：翻月后总得有个合理的默认落点
    setSelected(next === monthOf(today) ? today : next);
  };

  return (
    <>
      <header className="topbar topbar--bordered">
        <div className="study-bar__info">
          <div className="study-bar__title">学习日历</div>
          <div className="study-bar__sub">
            {formatMonthDay(today)} {weekdayLabel(today)}
          </div>
        </div>
      </header>

      <main className="app__main">
        <div className="screen cal">
          <MonthGrid
            month={month}
            grid={grid}
            today={today}
            selected={selected}
            byDay={byDay}
            onSelect={(day, inMonth) => {
              if (inMonth) setSelected(day);
            }}
            onPrev={() => goMonth(-1)}
            onNext={() => goMonth(1)}
            onToday={() => {
              setMonth(monthOf(today));
              setSelected(today);
            }}
          />

          {current ? <DayDetail day={current} plan={plan} streak={stats.consecutiveGoodDays} /> : null}
        </div>
      </main>
    </>
  );
}
