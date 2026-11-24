/**
 * 首页的「今日」摘要条（纯展示）。
 *
 * 只回答三个问题：今天能学几个新词、有多少到期复习、欠了多少逾期。
 * 数字全部来自 `plan()` / `allowance()`，一个都不在页面里重算——
 * 首页与结算 JSON 必须说同一件事（TODO P0-1 的验收条件）。
 *
 * v1.1 起**没有任何动作按钮**：学习入口只有首页大按钮「开始背单词」一个，
 * 复习优先的顺序由 Session 状态机保证（REFACTOR_PLAN §1），这里只报数。
 *
 * 新词量的三态文案统一走 `copy.ts` 的 `newWordHeadline()`：
 * 奖励挂 `↑ +5`、减量复用结算原因、发不出来就说清楚是哪道闸。
 */

import { formatMonthDay, newWordHeadline, weekdayLabel } from '../lib/scheduler';
import type { DailyPlan, SchedulerStats } from '../lib/scheduler';

interface TodayCardProps {
  plan: DailyPlan;
  stats: SchedulerStats;
  onOpenCalendar: () => void;
  onOpenMistakes: () => void;
}

export function TodayCard({
  plan,
  stats,
  onOpenCalendar,
  onOpenMistakes,
}: TodayCardProps) {
  const headline = newWordHeadline(plan);
  const blocked = plan.allowedNewWords < plan.newWordLimit;
  const pendingReviews =
    plan.shortTermBatches.reduce((total, batch) => total + batch.wordCount, 0) +
    plan.overduePool.reduce((total, batch) => total + batch.wordCount, 0) +
    plan.longTermBatches.reduce((total, batch) => total + batch.wordCount, 0);

  return (
    <section className="today-card" aria-label="今日学习摘要">
      <div className="today-card__head">
        <span className="today-card__label">
          今日 · {formatMonthDay(plan.day)} {weekdayLabel(plan.day)}
        </span>
        <span className="today-card__links">
          {stats.mistakes > 0 ? (
            <button type="button" className="btn btn--text btn--compact" onClick={onOpenMistakes}>
              错词本 {stats.mistakes}
            </button>
          ) : null}
          <button type="button" className="btn btn--text btn--compact" onClick={onOpenCalendar}>
            学习日历
          </button>
        </span>
      </div>

      <div className="today-card__figures">
        <span className="today-card__figure">
          <b className={blocked || headline.tone === 'paused' ? 'is-warn' : 'is-accent'}>{plan.allowedNewWords}</b>
          新词
          {headline.tag ? <span className="today-card__tag">{headline.tag}</span> : null}
          {blocked ? <span>计划 {plan.newWordLimit}</span> : null}
        </span>
        <span className="today-card__figure">
          <b>
            {plan.totals.doneToday}/{plan.totals.dueToday}
          </b>
          到期复习
        </span>
        <span className="today-card__figure">
          <b className={plan.totals.overdue > 0 ? 'is-warn' : undefined}>{plan.totals.overdue}</b>
          逾期
        </span>
        <span className="today-card__figure">
          <b>{stats.consecutiveGoodDays}</b>
          连续优秀
        </span>
      </div>

      <p className={`today-card__reason is-${headline.tone}`}>{headline.note}</p>

      {pendingReviews > 0 ? (
        <p className="today-card__reason">
          点「开始背单词」后会先复习这 {pendingReviews} 个到期词，复习清空才轮到新词。
        </p>
      ) : null}
    </section>
  );
}
