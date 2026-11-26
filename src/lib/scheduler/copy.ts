/**
 * 给用户看的策略说明文案（单一来源）。
 *
 * UI 直接渲染这里的字符串；`STRATEGY_GUIDE.md` 是同一套话术的完整长文版。
 * 原则：先讲「和你有关的事」，再讲规则；不出现「算法」「权重」这类词。
 */

import type { CalendarDay, DailyPlan, LongForecast } from './types.ts';
import { formatMonthDay } from './studyDay.ts';
import { OVERDUE_PAUSE_THRESHOLD, OVERDUE_WARN_THRESHOLD } from './adaptation.ts';

export const WHY_FEWER_TITLE = '为什么今天的新词变少了';

export const WHY_FEWER_BODY: readonly string[] = [
  '每天能学多少新词，不是你一个人定的，也不是机器随便砍的。它看两件事：你最近三天复习时的正确率，和昨天的复习有没有做完。',
  '正确率低于 90%，就先不加量；低到 80% 以下，新词量乘 0.75；低于 70%，当天新词直接停掉，先把学过的补稳。往下调是立刻生效的，往上加要慢得多——连续三天正确率都在 90% 以上，并且复习完成率不低于 95%，才会一次加 5 个。',
  '复习没做完也一样：完成率低于 90%，今天就别加新词；低于 80%，当天新词量再打八折。原因很朴素——旧词没记牢的时候往里塞新词，只是把遗忘往后推。',
  '新词量变少是保护，不是惩罚。等你把到期的复习补齐、正确率回到 90% 以上，它会自己涨回来，一天最多涨 5 个。',
];

export const OVERDUE_TITLE = '逾期池怎么处理';

export const OVERDUE_BODY: readonly string[] = [
  '逾期池只装一种东西：到期了、但你还没复习的词。当天没背完的新词不会进来，它们会回到未学池，按原来的顺序等下一次。',
  '没做完就是没做完，不会自动滚到第二天把明天的量撑爆。日历上只会标一行「逾期 X 词」，你可以自己决定今天清几批。',
  '清逾期的顺序是从逾期最短的开始——昨天的、前天的、再往前的。每个词复习完，下一次间隔从「你实际复习的这一天」重新算，不会因为拖了几天就被判成学得差。',
  '逾期到 30 个，页面会提醒你「先清一部分」，但不拦着你学新词；到 50 个就直接暂停新词，直到清到 50 以下。一天建议清 30 个左右，这是提示不是硬卡。',
  '断签几天回来也一样：不会把几天的债一次性堆到你脸上，一天清一点就行。但连着的优秀天数会清零，重新攒。',
  '还有一条：一个词逾期超过 7 天你还没碰它，就不再算逾期了——它会回到未学池，当作新词重新走 1 天 → 2 天 → 6 天 → 15 天的流程。拖着不复习，等于白学一次。',
];

export const BATCHES_NOTE =
  '短期复习挂在四个滚动批次上：1 天前、2 天前、6 天前、15 天前。答对进下一档，模糊退回上一档（比如 6 天前的批次答模糊，就退回 2 天），不认识直接回到明天的 1 天批次。';

export const LONG_TERM_NOTE =
  '长期节点是 30 / 90 / 180 / 360 天，按周和按月批量过：30 天在每周日，90 / 180 / 360 在每月 1 号。长期批次只做快速筛查，答对进下一个节点，答错或犹豫就打回 1 天重新走短周期。360 天过了就归档，不再自动排，你想抽查再抽查。';

export const IMMEDIATE_NOTE =
  '即时复习是学新词时每攒够 10 个当场过一遍。第 1 轮把整组过一遍：点「认识」出队；点「模糊」的词本轮再出现一次，还模糊就等下一轮。下一轮只考上一轮模糊过的词，最多 5 轮。同一个词累计模糊 3 次会记进错词本，但仍要考到点「认识」才算过关。即时复习不算正式成绩，中途退出也不欠账。';

export const SETTINGS_NOTE =
  '每日新词目标你自己定（默认 20）。「每日新词上限」默认比目标高 5，这样状态好时才有 +5 的奖励空间；把它调成和目标一样，就是「只发目标」。手动改「今天学多少个」只影响当天，不会把长期基线改掉。';

/* ------------------------------------------------------------------ 设置页 · 上限说明 */

export const MAX_LIMIT_EXPLAIN_TITLE = '为什么要设置「新词上限」？';

export const MAX_LIMIT_EXPLAIN_BODY: readonly string[] = [
  '系统会根据你近期的复习正确率自动调节每天的新词量：状态好时，会在你设定的目标基础上最多奖励 5 个新词；状态差时会自动减量。',
  '「上限」就是你每天能接受的最高数量，用来防止奖励过度（比如目标 20、上限 25）。如果你想暂停学新词，可以直接把上限设为 0。',
];

/* ------------------------------------------------------------------ 首页 / 日历 · 动态新词量 */

export type NewWordTone = 'increase' | 'decrease' | 'paused' | 'done' | 'pool' | 'normal';

export interface NewWordHeadline {
  /** 现在真正能学的新词数（三道闸之后） */
  amount: number;
  /** 结算给出的计划值 */
  planned: number;
  goal: number;
  /** 计划值 - 目标：正数是奖励、负数是减量 */
  delta: number;
  /** 主文案 */
  label: string;
  /** 角标，如 `↑ +5` / `↓ 5`；没有就是 null */
  tag: string | null;
  /** 一句解释（首页 reason 行、日历说明） */
  note: string;
  tone: NewWordTone;
}

export const NEW_WORD_PAUSED_NOTE = '今日新词已暂停（逾期复习过多或正确率偏低），请优先清理复习。';

export const NEW_WORD_INCREASE_NOTE = (delta: number): string =>
  `近期状态极佳，为你额外增加了 ${delta} 个新词 🎉`;

/**
 * 首页那句「今天新词多少、为什么」。三态：
 * - 奖励：计划高于目标 → 挂 `↑ +5` 角标 + 一句恭喜；
 * - 减量：计划低于目标 → 直接复用结算原因（`plan.reason` 里 `结算：` 之后那段）；
 * - 暂停：现在一个也发不出来 → 说清楚是闸挡住了，还是已经学完 / 词池空了。
 */
export function newWordHeadline(plan: DailyPlan): NewWordHeadline {
  const amount = plan.allowedNewWords;
  const planned = plan.newWordLimit;
  const goal = plan.userDailyGoal;
  const delta = planned - goal;
  const base = { amount, planned, goal, delta };

  if (amount === 0 || planned === 0) {
    if (plan.newWordBlocked === 'quota') {
      return {
        ...base,
        label: '今天的新词已学完',
        tag: null,
        note: `今天已经学了 ${plan.totals.newLearned} 个，明天继续。`,
        tone: 'done',
      };
    }
    if (plan.newWordBlocked === 'pool') {
      return {
        ...base,
        label: '词池暂时空了',
        tag: null,
        note: '当前词库的未学新词已经用完，换个词库或导入新词表就能继续。',
        tone: 'pool',
      };
    }
    if (plan.newWordBlocked === 'review') {
      // 计划值不为 0，只是复习没做完：别把「闸没开」说成「暂停」——用户会以为设置坏了
      const rate = plan.totals.dueToday > 0 ? Math.round((plan.totals.doneToday / plan.totals.dueToday) * 100) : 0;
      return {
        ...base,
        label: '先复习完再学新词',
        tag: null,
        note: `今天的到期复习只完成 ${rate}%，做完就能开始学新词。`,
        tone: 'paused',
      };
    }
    if (plan.newWordBlocked === 'overdue') {
      return {
        ...base,
        label: '逾期太多，新词暂停',
        tag: null,
        note: `逾期复习还有 ${plan.totals.overdue} 个，清到 50 个以下再学新词。`,
        tone: 'paused',
      };
    }
    return { ...base, label: '今日新词已暂停', tag: null, note: NEW_WORD_PAUSED_NOTE, tone: 'paused' };
  }

  if (delta > 0) {
    return {
      ...base,
      label: `今日新词 ${amount} 个`,
      tag: `↑ +${delta}`,
      note: NEW_WORD_INCREASE_NOTE(delta),
      tone: 'increase',
    };
  }

  if (delta < 0) {
    const cause = settlementCause(plan.reason);
    return {
      ...base,
      label: `今日新词 ${amount} 个`,
      tag: `↓ ${-delta}`,
      note: `因近期状态波动，今日新词调整为 ${amount} 个（目标 ${goal} 个）。${cause}`,
      tone: 'decrease',
    };
  }

  return {
    ...base,
    label: `今日新词 ${amount} 个`,
    tag: null,
    note: `按你的目标 ${goal} 个发放。`,
    tone: 'normal',
  };
}

/** 从拼好的 `plan.reason` 里取出结算原因那段（`结算：` 之后），没有就返回空串。 */
function settlementCause(reason: string): string {
  const marker = '结算：';
  const index = reason.lastIndexOf(marker);
  return index >= 0 ? reason.slice(index + marker.length) : '';
}

/** 日历格子上的新词角标：奖励才有，减量交给原因短句说。 */
export function calendarNewWordTag(day: CalendarDay): string | null {
  if (day.isPast || day.newWordPlan <= 0) return null;
  const delta = day.newWordPlan - day.newWordGoal;
  return delta > 0 ? `↑ +${delta}` : null;
}

/** 日历/首页那句动态解释（旧接口，**已被 `newWordHeadline()` 取代**，保留给外部调用）。 */
export function explainNewWordDrop(plan: DailyPlan): string {
  const { newWordLimit, userDailyGoal } = plan;
  if (newWordLimit >= userDailyGoal) return `今天按计划学 ${newWordLimit} 个新词。`;
  if (newWordLimit === 0) return `今天先不学新词：${plan.reason}`;
  return `今天计划 ${newWordLimit} 个新词（你的目标是 ${userDailyGoal} 个）。${plan.reason}`;
}

/* ------------------------------------------------------------------ 设置页 */

/**
 * 把「算法上限」调成 0 时的提示。
 *
 * 上限只做截断、从不写回基线（SCHEDULER_SPEC §3）：所以改回 20 不会立刻学 20，
 * 而是要按自适应规则一天一天爬回去。这句话必须出现在设置页，否则用户会以为改坏了。
 */
export const MAX_LIMIT_ZERO_NOTE =
  '设为 0 会暂停新词，但你的基线会保留。改回来时不会立刻回到原来的数量——要按自适应规则一天一天恢复（正确率连续达标，每天最多 +5）。';

/** 上限变动时的一句话解释；没变化时返回 null（设置页不必显示空行）。 */
export function explainMaxLimitChange(next: number, baseline: number): string | null {
  if (next === 0) return MAX_LIMIT_ZERO_NOTE;
  if (next < baseline) return `上限 ${next} 低于当前基线 ${baseline}：今天最多只学 ${next} 个，基线不打折。`;
  if (next > baseline) return `上限提到 ${next} 也不会立刻学这么多，实际数量仍由自适应规则决定。`;
  return null;
}

/* ------------------------------------------------------------------ 日历 */

/** 新词被哪道闸挡住 → 原因短句（日历里紧跟在计划值后面，不能只给两个数）。 */
export const NEW_WORD_BLOCK_REASON: Record<NonNullable<CalendarDay['newWordBlocked']>, string> = {
  overdue: '因逾期暂停',
  review: '因复习未完成',
  pool: '因词池只剩这些',
  quota: '因今天已学满',
  paused: '因上限为 0 暂停',
};

/**
 * 日历格子里的「计划 / 实际」解释。
 *
 * 历史日说「学到多少」，今天与未来说「现在可学多少 + 为什么少」——
 * 两个数并排却不给原因，用户只会以为数字坏了。
 */
export function explainCalendarNewWords(day: CalendarDay): string {
  if (day.isPast) return `计划 ${day.newWordPlan}，学到 ${day.newWordDone}`;
  const { newWordPlan: plan, newWordAllowed: allowed } = day;
  if (plan === 0) return '计划 0，新词暂停';
  // 未来日是估的，话术上就要留出余地，别说得像已经定了
  if (day.estimated) return `计划 ${plan}（预估）`;
  if (allowed >= plan) return `计划 ${plan}，现在可学 ${allowed}`;
  const cause = day.newWordBlocked ? NEW_WORD_BLOCK_REASON[day.newWordBlocked] : '因剩余配额';
  return `计划 ${plan}，${cause}，实际 ${allowed}`;
}

/** 日历首页的一句总结：只讲事实，不把整段结算原因抄上来。 */
export function planSummary(plan: DailyPlan): string {
  const parts: string[] = [];
  parts.push(
    plan.totals.dueToday > 0
      ? `到期复习 ${plan.totals.doneToday}/${plan.totals.dueToday}。`
      : '今天没有到期的短期复习。',
  );
  if (plan.totals.overdue >= OVERDUE_PAUSE_THRESHOLD) {
    parts.push(`逾期 ${plan.totals.overdue} 个，已超过 ${OVERDUE_PAUSE_THRESHOLD}，先暂停新词。`);
  } else if (plan.totals.overdue >= OVERDUE_WARN_THRESHOLD) {
    parts.push(`逾期 ${plan.totals.overdue} 个，建议先清一部分。`);
  } else if (plan.totals.overdue > 0) {
    parts.push(`逾期 ${plan.totals.overdue} 个，从最早的开始清。`);
  }
  if (plan.newWordLimit === 0) parts.push('今天不学新词。');
  else parts.push(`今天计划 ${plan.newWordLimit} 个新词，现在可学 ${plan.allowedNewWords} 个。`);
  return parts.join('');
}

/**
 * 这格要不要挂原因：被闸挡住、或「计划」与「现在可学」不一致时才需要。
 * 两个数相等又没被挡，说一句「计划 20，现在可学 20」只是噪音。
 */
export function needsNewWordReason(day: CalendarDay): boolean {
  return day.newWordBlocked !== null || day.newWordAllowed !== day.newWordPlan;
}

export const LONG_BATCH_LABEL: Record<LongForecast['type'], string> = {
  '30d': '30 天批次',
  '90d': '90 天批次',
  '180d': '180 天批次',
  '360d': '360 天批次',
};

/** 日历格子里长期批次角标的短写法（长写法见 `LONG_BATCH_LABEL`，格子里放不下「批次」二字）。 */
export const CALENDAR_LONG_LABEL: Record<LongForecast['type'], string> = {
  '30d': '30 天',
  '90d': '90 天',
  '180d': '180 天',
  '360d': '360 天',
};

/* ---------------------------------------------------------- 日历格子的负荷行 */

/**
 * 一格里「今天要干几件事」的那一行。
 *
 * 真机反馈：复习量原先只出现在灰色批次明细的小字里，同格的「新词」反而是显眼标签，
 * 加上头部无标签的 `0 / 20`，用户读成了「明天不用复习」。所以口径写死在这里：
 * - 槽位顺序恒定（复习 → 逾期 → 新词 → 奖励 → 长期），七格竖着扫时同一列对同一列；
 * - 完成度**只属于今天与过去**，未来日（`estimated`）没有「已做」可言，报分数就是假数据；
 * - 复习为零也占位（`复习 —`），不渲染成空格——缺格子会被读成漏排。
 * UI 层拿到的就是最终字符串，不再自己拼数字。
 */
export interface CalendarLoad {
  key: string;
  /** 为 null 时是纯角标（↑ +5），没有「标签 + 数字」结构 */
  label: string | null;
  value: string;
  unit: string | null;
  tone: 'primary' | 'neutral' | 'quiet' | 'warn' | 'up';
  /** 复习槽带实心圆点：去掉颜色也认得出哪个是主任务 */
  dot: boolean;
}

export function calendarDayLoad(day: CalendarDay): CalendarLoad[] {
  const hasReview = day.dueTotal > 0;
  const out: CalendarLoad[] = [
    {
      key: 'review',
      label: '复习',
      value: hasReview
        ? day.estimated
          ? String(day.dueTotal)
          : `${day.doneTotal}/${day.dueTotal}`
        : '—',
      unit: hasReview && day.estimated ? '词' : null,
      tone: hasReview ? 'primary' : 'quiet',
      dot: hasReview,
    },
  ];

  // `CalendarDay.overdue` 是「这天到期却没做完的词」，不是跨日欠账（跨日欠账在 plan.totals.overdue，
  // 由 hero 区那行说）。今天做完之前它恒等于剩余量，标成「逾期」会跟分数里的分母打架——只在历史日显示。
  if (day.isPast && day.overdue > 0) {
    out.push({ key: 'overdue', label: '逾期', value: String(day.overdue), unit: '词', tone: 'warn', dot: false });
  }

  const hasNew = day.newWordPlan > 0;
  out.push({
    key: 'new',
    label: '新词',
    value: hasNew ? (day.estimated ? String(day.newWordPlan) : `${day.newWordDone}/${day.newWordPlan}`) : '—',
    unit: hasNew && day.estimated ? '词' : null,
    tone: hasNew ? 'neutral' : 'quiet',
    dot: false,
  });

  const bonus = calendarNewWordTag(day);
  if (bonus) {
    out.push({ key: 'bonus', label: null, value: bonus, unit: null, tone: 'up', dot: false });
  }

  for (const batch of day.longTermBatches) {
    out.push({
      key: `long-${batch.type}`,
      label: `长期 ${CALENDAR_LONG_LABEL[batch.type] ?? batch.type}`,
      value: String(batch.wordCount),
      unit: '词',
      tone: 'quiet',
      dot: false,
    });
  }

  return out;
}

/**
 * 复习为零时那一行小字。**不能留空**——用户看到空白格子只会以为系统没排。
 * 有复习时返回 null：数字已经在负荷行里了，不必再抄一遍。
 */
export function calendarReviewNote(day: CalendarDay): string {
  if (day.dueTotal > 0) return '';
  if (day.estimated) return '还没排上复习：做完前面的复习才会排进来。';
  if (day.isPast) return '那天没有到期复习。';
  return '今天没有到期复习。';
}

/** 「接下来 7 天」标题旁那个问号的文案（真机反馈：未来的格子看着像 Bug）。 */
export const CALENDAR_FORECAST_EXPLAIN_TITLE = '日历上的未来，只是「此刻已确定」的那部分';

export const CALENDAR_FORECAST_EXPLAIN_BODY: readonly string[] = [
  '复习间隔由你每天的作答决定：答对的往后挪，答错或选「模糊」的会提前回到 1 天批次。所以还没做到的那几天，此刻无法精确推演——离今天越近的数字越准。',
  '某格显示「复习 —」不是漏排：那批词要等你把前面的复习做完，才会按新的间隔排到后面几天。',
  '新词量按每日目标与自适应基线预估，往后可能因连续优秀（+5）或状态波动（减量、暂停）而变化。',
];

/** 未来 7 天没有长期批次时那一栏的文案：不留空、不隐藏。 */
export function describeLongForecast(forecast: LongForecast | null): string {
  if (!forecast) return '近期无长期复习';
  const when =
    forecast.daysAhead === 1
      ? `明天（${forecast.weekdayLabel}）`
      : forecast.daysAhead <= 7
        ? `${forecast.weekdayLabel}（${formatMonthDay(forecast.date)}）`
        : `${formatMonthDay(forecast.date)} ${forecast.weekdayLabel}`;
  return `${when}：${LONG_BATCH_LABEL[forecast.type]}，预计 ${forecast.wordCount} 词`;
}

/* ------------------------------------------------------------------ 连续优秀 */

/** 空转日（当天一张正式复习都没有）不计入连续优秀，这句要说出来。 */
export const IDLE_DAY_NOTE = '今天没有复习任务，不计入连续优秀。';

export function idleDayNote(plan: DailyPlan): string | null {
  return plan.totals.dueToday === 0 ? IDLE_DAY_NOTE : null;
}
