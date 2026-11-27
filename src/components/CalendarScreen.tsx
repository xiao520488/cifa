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

import { useEffect, useMemo, useRef, useState } from 'react';
import { formatMonthDay, weekdayLabel } from '../lib/scheduler';
import type { Scheduler, StudyDay } from '../lib/scheduler';
import { addMonths, monthGrid, monthOf } from '../lib/calendarState';
import type { Word, Wordbook } from '../lib/types';
import { DayDetail } from './DayDetail';
import { MonthGrid } from './MonthGrid';

interface CalendarScreenProps {
  engine: Scheduler;
  version: number;
  /** 当前阶段的词库：给批次清单查释义（查不到就只显示英文） */
  book: Wordbook | null;
}

/** 面板顶部离滚动容器上沿留一点呼吸，别贴着 topbar */
const DETAIL_OFFSET = 8;

export function CalendarScreen({ engine, version, book }: CalendarScreenProps) {
  const { plan, stats } = useMemo(() => {
    void version;
    return { plan: engine.plan(), stats: engine.stats() };
  }, [engine, version]);

  // 单词 → 词库条目。换阶段换书时重建；同一本书不重复建 Map。
  const index = useMemo<ReadonlyMap<string, Word> | null>(() => {
    if (!book) return null;
    return new Map(book.words.map((word) => [word.w, word]));
  }, [book]);

  const today = plan.day;
  const [month, setMonth] = useState<StudyDay>(() => monthOf(today));
  const [selected, setSelected] = useState<StudyDay>(today);
  /** 只有「点了日期」才滚：翻月/首次进入不滚，否则会把人从月历上拽走 */
  const wantsScroll = useRef(false);

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

  /**
   * 点日期后把详情面板滚进视野（用户 2026-11-27 拍板：只在「没完全在可视区」时滚）。
   *
   * 判据是字面意义的「整块可见」：顶部在容器内、底部也在容器内才不动。
   * 面板比一屏还高时永远算不上完全可见，但滚到顶之后 `scrollTop` 再算一遍是同一个值，
   * 所以连续点日期不会抖（幂等）。尊重 `prefers-reduced-motion`：开启时直接跳。
   */
  useEffect(() => {
    if (!wantsScroll.current) return;
    wantsScroll.current = false;
    const id = window.requestAnimationFrame(() => {
      const main = document.querySelector('.app__main');
      const detail = document.querySelector('.cal-detail');
      if (!main || !detail) return;
      const box = main.getBoundingClientRect();
      const rect = detail.getBoundingClientRect();
      if (rect.top >= box.top - 1 && rect.top <= box.bottom && rect.bottom <= box.bottom) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      main.scrollTo({
        top: main.scrollTop + (rect.top - box.top) - DETAIL_OFFSET,
        behavior: reduce ? 'auto' : 'smooth',
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [selected]);

  const current = byDay.get(selected);

  const goMonth = (delta: number) => {
    const next = monthOf(addMonths(month, delta));
    setMonth(next);
    // 本月含今天就选今天，否则选 1 号：翻月后总得有个合理的默认落点
    setSelected(next === monthOf(today) ? today : next);
  };

  const pickDay = (day: StudyDay) => {
    if (day === selected) return;
    wantsScroll.current = true;
    setSelected(day);
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
              if (inMonth) pickDay(day);
            }}
            onPrev={() => goMonth(-1)}
            onNext={() => goMonth(1)}
            onToday={() => {
              setMonth(monthOf(today));
              setSelected(today);
            }}
          />

          {current ? (
            <DayDetail
              day={current}
              plan={plan}
              streak={stats.consecutiveGoodDays}
              index={index}
            />
          ) : null}
        </div>
      </main>
    </>
  );
}
