/**
 * 某一天的详情面板（只读）。
 *
 * 数字全部来自传进来的 `CalendarDay`，不再查库、不再重算——月历格和这里是同一份数据，
 * 所以不会出现「格子上写着 18、点开变 17」。
 *
 * 三种日期的文案差异是刻意的（见 `docs/UI_V2_PHASE2.md` §3）：
 * 历史日说「学到多少」，今天说「现在能做多少 + 为什么少」，未来日说「已排定多少 + 还会追加」。
 */

import { useMemo } from 'react';
import { explainCalendarNewWords, formatMonthDay, planSummary, weekdayLabel } from '../lib/scheduler';
import type { CalendarDay, DailyPlan } from '../lib/scheduler';
import { cellState } from '../lib/calendarState';
import type { Word } from '../lib/types';
import { ReviewBatches } from './ReviewBatches';

interface DayDetailProps {
  day: CalendarDay;
  /** 今天才算的逾期口径与总结句 */
  plan: DailyPlan;
  streak: number;
  /** 英文单词 → 词库条目（当前阶段那本）；查不到就只显示单词 */
  index: ReadonlyMap<string, Word> | null;
}

const STATE_TEXT: Record<string, string> = {
  done: '已完成',
  partial: '做了一部分',
  miss: '没做完',
  empty: '没有记录',
  future: '还没到',
  today: '今天',
};

export function DayDetail({ day, plan, streak, index }: DayDetailProps) {
  const state = cellState(day);
  const isToday = day.isToday;
  // 历史日：那天实际答出来的词（复习 + 收口前的已知），用来把没答出来的行压暗
  const doneWords = useMemo(() => new Set(day.doneWords), [day]);
  const hasBatches = day.shortTermBatches.length > 0 || day.longTermBatches.length > 0;

  // 四个读数：新词 / 到期复习 / 逾期 / 这天状态
  const newWordValue = day.estimated
    ? `${day.newWordPlan} 预估`
    : day.isPast
      ? `${day.newWordDone}/${day.newWordPlan}`
      : `${day.newWordPlan}`;
  // 只有「计划 ≠ 现在可学」才需要那行小字；相等时再写一遍就是噪音（今天那栏已经说了）
  const newWordHint =
    isToday && (day.newWordAllowed !== day.newWordPlan || day.newWordBlocked !== null)
      ? `现在可学 ${day.newWordAllowed}`
      : null;

  const reviewValue = day.estimated ? `${day.dueTotal} 已排定` : `${day.doneTotal}/${day.dueTotal}`;
  const overdueValue = isToday
    ? String(plan.totals.overdue)
    : day.isPast
      ? String(day.overdue)
      : '—';

  return (
    <section className="cal-detail" aria-live="polite" aria-label="这一天的详情">
      <header className="cal-detail__head">
        <h2 className="cal-detail__date">
          {formatMonthDay(day.day)}
          <span className="cal-detail__weekday">{weekdayLabel(day.day)}</span>
        </h2>
        {/* 状态只放在第 4 个读数里，标题旁不再重复一遍「已完成」 */}
        {isToday ? <span className="cal-detail__tag is-done">今天</span> : null}
        {day.estimated ? <span className="cal-detail__tag is-quiet">预估</span> : null}
      </header>

      <dl className="detail-figures">
        <div className="detail-figure">
          <dt>新词</dt>
          <dd>{newWordValue}</dd>
        </div>
        <div className="detail-figure">
          <dt>到期复习</dt>
          <dd>{reviewValue}</dd>
        </div>
        <div className="detail-figure">
          <dt>逾期</dt>
          <dd className={overdueValue !== '0' && overdueValue !== '—' ? 'is-warn' : undefined}>{overdueValue}</dd>
        </div>
        <div className="detail-figure">
          <dt>{isToday ? '连续优秀' : '状态'}</dt>
          <dd>{isToday ? `${streak} 天` : STATE_TEXT[state]}</dd>
        </div>
      </dl>

      {newWordHint ? <p className="cal-detail__hint">{newWordHint}</p> : null}
      {isToday && plan.totals.dueToday > 0 ? <p className="cal-detail__hint">{planSummary(plan)}</p> : null}

      {hasBatches ? (
        <ReviewBatches
          key={day.day}
          batches={day.shortTermBatches}
          longBatches={day.longTermBatches}
          doneWords={doneWords}
          showDoneMarks={day.isPast}
          index={index}
          estimated={day.estimated}
        />
      ) : day.estimated ? (
        <section className="batches is-empty" aria-label="复习批次">
          <header className="batches__head">
            <h3 className="batches__title">复习批次</h3>
            <span className="batches__tag">已排定</span>
          </header>
          <p className="batches__empty">暂无排定的复习</p>
        </section>
      ) : (
        <p className="cal-detail__note">
          {day.isPast ? '那天没有到期复习。' : '今天没有到期复习。'}
        </p>
      )}

      {day.estimated ? null : isToday ? null : <p className="cal-detail__note">{explainCalendarNewWords(day)}</p>}
      {day.estimated && day.shortTermBatches.length > 0 ? (
        <p className="cal-detail__note">
          未来的复习量只算「此刻已排定」的批次：做完前面几天，新的间隔才会把后面的日子排进来。
        </p>
      ) : null}
    </section>
  );
}

