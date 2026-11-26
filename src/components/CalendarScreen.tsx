/**
 * 学习日历（只读）。
 *
 * 这一层不接作答：只把 `plan()` / `calendarView()` 算出来的东西摊开，
 * 用来核对「数字、批次来源日期、逾期池、学习日边界、快照」对不对。
 *
 * 显示的每一个数都有出处，没有前端自己拍脑袋的加减：
 * - 今日计划值 = `plan.newWordLimit`（结算写入），可学 = `plan.allowedNewWords`（三道闸之后）；
 * - 每格的负荷行 = `calendarDayLoad(day)`：复习取 `dueTotal`，新词取 `newWordPlan`；
 *   今天与过去带完成度（`12/20`），未来日只报计划总量（v1.2，见 `REFACTOR_PLAN.md` §6）；
 * - 批次行读的是当天快照（`planSnapshot`），不是实时重算，所以做完的批次不会消失。
 */

import { useMemo } from 'react';
import {
  CALENDAR_FORECAST_EXPLAIN_BODY,
  CALENDAR_FORECAST_EXPLAIN_TITLE,
  calendarDayLoad,
  calendarReviewNote,
  describeLongForecast,
  explainCalendarNewWords,
  formatMonthDay,
  idleDayNote,
  needsNewWordReason,
  newWordHeadline,
  planSummary,
  weekdayLabel,
} from '../lib/scheduler';
import type { CalendarDay, Scheduler } from '../lib/scheduler';
import { Hint } from './Hint';
import { RollingNumber } from './RollingNumber';
import { IconBack, IconPalette } from './Icons';

interface CalendarScreenProps {
  engine: Scheduler;
  version: number;
  initial: string;
  onBack: () => void;
  onOpenMe: () => void;
  onOpenSkin: () => void;
  /** 统一入口（v1.1）：进 Session 状态机，复习优先由流程内部保证 */
  onStartSession: () => void;
}

/**
 * 一个格子 = 三层，顺序不许再调（`REFACTOR_PLAN.md` §6）：
 * 1. 负荷行：`复习 → 逾期 → 新词 → ↑ → 长期`，复习是主任务所以最重；
 * 2. 来源小字：这批词是哪一天学的（只在真有复习时出现，不再充当复习量）；
 * 3. 短句：为零的复习 / 被闸挡住的新词，各解释一句。
 * 未来日没有「已完成」，负荷行只报计划总量——旧的 `0 / 20` 就是这么被读成「明天不用复习」的。
 */
function DayCard({ day }: { day: CalendarDay }) {
  const load = calendarDayLoad(day);
  const note = calendarReviewNote(day);
  const reason = needsNewWordReason(day) ? explainCalendarNewWords(day) : null;

  return (
    <article
      className={[
        'cal-day',
        day.isToday ? 'cal-day--today' : '',
        day.isPast ? 'cal-day--past' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <header className="cal-day__head">
        <span className="cal-day__date">{formatMonthDay(day.day)}</span>
        <span className="cal-day__weekday">{day.weekdayLabel}</span>
        {day.isToday ? <span className="cal-day__badge">今天</span> : null}
        {day.estimated ? <span className="cal-day__badge cal-day__badge--quiet">预估</span> : null}
      </header>

      <div className="cal-day__load">
        {load.map((item) => (
          <span key={item.key} className={`cal-load cal-load--${item.tone}`}>
            {item.dot ? <span className="cal-load__dot" aria-hidden="true" /> : null}
            {item.label ? <span className="cal-load__k">{item.label}</span> : null}
            <b className="cal-load__v">{item.value}</b>
            {item.unit ? <span className="cal-load__u">{item.unit}</span> : null}
          </span>
        ))}
      </div>

      {day.shortTermBatches.length > 0 ? (
        <ul className="cal-day__batches">
          {day.shortTermBatches.map((batch) => (
            <li key={`${day.day}-${batch.daysAgo}`} className="cal-batch">
              <span className="cal-batch__k">{batch.daysAgo} 天前</span>
              <span className="cal-batch__v">
                {formatMonthDay(batch.sourceDate)} 那批 · {batch.wordCount} 词
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {note ? <p className="cal-day__empty">{note}</p> : null}
      {reason ? <p className="cal-day__reason">{reason}</p> : null}
    </article>
  );
}

export function CalendarScreen({
  engine,
  version,
  initial,
  onBack,
  onOpenMe,
  onOpenSkin,
  onStartSession,
}: CalendarScreenProps) {
  const { plan, view, stats } = useMemo(() => {
    void version;
    return {
      plan: engine.plan(),
      view: engine.calendarView(8),
      stats: engine.stats(),
    };
  }, [engine, version]);

  const today = plan.day;
  const idle = idleDayNote(plan);
  const headline = newWordHeadline(plan);
  const nextWeekLong = view.days.some((day) => day.longTermBatches.length > 0);
  const upcoming = view.days.slice(1);

  const numbersNote =
    plan.allowedNewWords === plan.newWordLimit && plan.newWordBlocked === null
      ? null
      : explainCalendarNewWords(view.days[0]);
  const heroNote = headline.tone === 'normal' ? null : headline.note;

  return (
    <>
      <header className="topbar topbar--bordered">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="返回">
          <IconBack size={22} />
        </button>
        <div className="study-bar__info">
          <div className="study-bar__title">学习日历</div>
          <div className="study-bar__sub">
            {formatMonthDay(today)} {weekdayLabel(today)}
          </div>
        </div>
        <button type="button" className="icon-btn" onClick={onOpenSkin} aria-label="切换外观风格">
          <IconPalette size={20} />
        </button>
        <button type="button" className="avatar-btn" onClick={onOpenMe} aria-label="打开我的">
          {initial}
        </button>
      </header>

      <main className="app__main">
        <div className="screen cal">
          <section className="cal-hero" aria-labelledby="cal-today-title">
            <p className="cal-kicker">今天 · 学习日 {today} · 凌晨 4 点换天</p>
            <h1 className="cal-title" id="cal-today-title">
              新词{' '}
              <b>
                <RollingNumber value={plan.newWordLimit} memoKey="cal.newLimit" digits={3} />
              </b>
              {headline.tag ? <span className={`cal-title__tag is-${headline.tone}`}>{headline.tag}</span> : null}
              <span className="cal-title__sep" aria-hidden="true">
                /
              </span>
              <span className="cal-title__sub">现在可学 {plan.allowedNewWords}</span>
            </h1>
            {heroNote ? <p className={`cal-hero__reason is-${headline.tone}`}>{heroNote}</p> : null}
            {numbersNote ? <p className="cal-hero__reason">{numbersNote}</p> : null}

            <dl className="cal-figures">
              <div className="cal-figure">
                <dt>到期复习</dt>
                <dd>
                  <RollingNumber value={plan.totals.doneToday} memoKey="cal.review.done" digits={3} />{' '}
                  /{' '}
                  <RollingNumber value={plan.totals.dueToday} memoKey="cal.review.due" digits={3} />
                </dd>
              </div>
              <div className="cal-figure">
                <dt>逾期</dt>
                <dd className={plan.totals.overdue > 0 ? 'is-warn' : undefined}>
                  <RollingNumber value={plan.totals.overdue} memoKey="cal.overdue" digits={4} />
                </dd>
              </div>
              <div className="cal-figure">
                <dt>今日已学</dt>
                <dd>
                  <RollingNumber value={plan.totals.newLearned} memoKey="cal.newLearned" digits={4} />
                </dd>
              </div>
              <div className="cal-figure">
                <dt>连续优秀</dt>
                <dd>
                  <RollingNumber value={stats.consecutiveGoodDays} memoKey="cal.streak" digits={3} /> 天
                </dd>
              </div>
            </dl>

            {idle ? <p className="cal-note">{idle}</p> : null}
            {plan.totals.longOverdue > 0 ? (
              <p className="cal-note cal-note--warn">
                长期批次还欠 {plan.totals.longOverdue} 个，下次批次日一起收。
              </p>
            ) : null}
            <p className="cal-hero__lede">{planSummary(plan)}</p>

            <div className="cal-hero__actions">
              <button
                type="button"
                className="btn btn--primary btn--block btn--compact"
                onClick={onStartSession}
                disabled={
                  plan.allowedNewWords === 0 &&
                  plan.totals.dueToday === 0 &&
                  plan.totals.overdue === 0 &&
                  plan.longTermBatches.length === 0
                }
              >
                {plan.allowedNewWords > 0 || plan.totals.dueToday > 0 || plan.totals.overdue > 0
                  ? '开始背单词'
                  : '今天没有要学的了'}
              </button>
            </div>
          </section>

          <section className="cal-section" aria-labelledby="cal-next-title">
            <div className="cal-section__head">
              <h2 id="cal-next-title">
                接下来 7 天
                <Hint
                  id="cal-forecast-hint"
                  label="为什么后面的日期还没排上复习"
                  title={CALENDAR_FORECAST_EXPLAIN_TITLE}
                  body={CALENDAR_FORECAST_EXPLAIN_BODY}
                />
              </h2>
              <span className="cal-section__hint">批次按「来源日期」排，不是按今天</span>
            </div>
            <div className="cal-days">
              {upcoming.map((day) => (
                <DayCard key={day.day} day={day} />
              ))}
            </div>
          </section>

          <section className="cal-section" aria-labelledby="cal-long-title">
            <div className="cal-section__head">
              <h2 id="cal-long-title">长期复习</h2>
              <span className="cal-section__hint">30 天看周日，90 / 180 / 360 看 1 号</span>
            </div>
            {nextWeekLong ? (
              <p className="cal-long__value">本周窗口里已有长期批次，见上面标了「长期」的格子。</p>
            ) : (
              <p className="cal-long__value">{describeLongForecast(view.longForecast)}</p>
            )}
            <p className="cal-long__note">
              长期批次只做筛查：答对进下一节点，答错或犹豫打回 1 天重新走短周期。360 天过了就归档。
            </p>
          </section>

          <p className="cal-foot">
            <RollingNumber value={stats.currentLimit} memoKey="cal.limit" digits={3} /> / 目标{' '}
            <RollingNumber value={stats.userDailyGoal} memoKey="cal.goal" digits={3} /> / 上限{' '}
            <RollingNumber value={stats.maxLimit} memoKey="cal.max" digits={3} /> · 未学{' '}
            <RollingNumber value={stats.unlearned} memoKey="cal.unlearned" digits={4} /> · 短期{' '}
            <RollingNumber value={stats.shortCards} memoKey="cal.short" digits={4} /> · 长期{' '}
            <RollingNumber value={stats.longCards} memoKey="cal.long" digits={4} /> · 归档{' '}
            <RollingNumber value={stats.archivedCards} memoKey="cal.archived" digits={4} />
          </p>
        </div>
      </main>
    </>
  );
}
