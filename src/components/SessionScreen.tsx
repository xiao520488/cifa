/**
 * 统一学习流（REFACTOR_PLAN v1.1）：点「开始背单词」后的唯一流程。
 *
 * review（三键单卡）→ list（按今日额度切批的平铺列表）→ immediate（两键单卡）→ … → done（总结页）。
 *
 * 完成判定（本文件的核心口径）：
 * - 列表阶段**一个词都不落库**——翻列表不产生任何状态，中途退出下次从第 1 批重看；
 * - 只有即时复习组被清空（全部「认识」，或连错 3 次标 hard 放过）才 `commitNewWords` 入库；
 * - 组清空才解锁下一批；今日尾巴不足 10 个也弹一组（状态机无特例，尾巴同样要考）。
 *
 * 队列在进页面时拍快照，之后不随引擎状态重建（不然每答一个词进度条就乱跳）。
 * 复习清空后才重拍新词列表——复习闸 / 逾期闸在那一刻才真正打开。
 * 跨学习日硬守卫：任何动作前发现学习日翻转，直接退出回首页。
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import {
  formatMonthDay,
  IMMEDIATE_TRIGGER,
  RATING_LABEL,
  weekdayLabel,
} from '../lib/scheduler';
import type { DailyPlan, ImmediateGroup, Rating, Scheduler } from '../lib/scheduler';
import { wordLookup } from '../lib/deck';
import { chunk } from '../lib/words';
import type { Wordbook } from '../lib/types';
import { useAnswerFeedback } from '../hooks/useAnswerFeedback';
import { ControlDock } from './ControlDock';
import { IconBack, IconCheck, IconClose } from './Icons';
import { SessionToast } from './SessionToast';
import { WordRow } from './WordRow';

type Phase = 'review' | 'list' | 'immediate' | 'done';

interface QueueItem {
  word: string;
  kind: 'short' | 'overdue' | 'long';
  label: string;
  sourceDate: string;
  /** 该词在本次会话里第几次被问（1 = 首次）。首次唯一写调度，2/3 只推进队列。 */
  attempt: 1 | 2 | 3;
}

/** 复习队列 + 回看带右端（= 短期段 + 长期段 + 已插入回看词数）。 */
interface ReviewQueue {
  items: QueueItem[];
  /** 回看词插入点：短期 + 长期批次之后、逾期池之前 */
  end: number;
}

interface SessionScreenProps {
  engine: Scheduler;
  book: Wordbook | null;
  initial: string;
  /** 列表每批词数（profile.batchSize，默认 5） */
  batchSize: number;
  /** 释义详略（列表行用，与首页一致） */
  showAll: boolean;
  hideMeaning: boolean;
  hideWord: boolean;
  run: <T>(fn: (engine: Scheduler) => T) => T;
  onExit: () => void;
  onToggleMeaning: () => void;
  onToggleWord: () => void;
  onOpenCalendar: () => void;
  onOpenMe: () => void;
}

function buildReviewQueue(plan: DailyPlan): ReviewQueue {
  const items: QueueItem[] = [];
  for (const batch of plan.shortTermBatches) {
    for (const word of batch.words) {
      items.push({
        word,
        kind: 'short',
        label: `${batch.daysAgo} 天前 · ${formatMonthDay(batch.sourceDate)}`,
        sourceDate: batch.sourceDate,
        attempt: 1,
      });
    }
  }
  for (const batch of plan.longTermBatches) {
    for (const word of batch.words) {
      items.push({
        word,
        kind: 'long',
        label: `长期 ${batch.type.replace('d', ' 天')}`,
        sourceDate: batch.scheduledDate,
        attempt: 1,
      });
    }
  }
  // 回看带插在短期 + 长期之后、逾期池之前（见 REVIEW_REQUEUE_SPEC §5.2）
  const end = items.length;
  for (const batch of plan.overduePool) {
    for (const word of batch.words) {
      items.push({
        word,
        kind: 'overdue',
        label: `逾期 ${batch.overdueDays} 天 · ${formatMonthDay(batch.sourceDate)}`,
        sourceDate: batch.sourceDate,
        attempt: 1,
      });
    }
  }
  return { items, end };
}

interface Tally {
  known: number;
  fuzzy: number;
  unknown: number;
  retried: number;
}

const EMPTY_TALLY: Tally = { known: 0, fuzzy: 0, unknown: 0, retried: 0 };

/** 点按揭示的位移阈值（px）：超过就当成滑动 —— 复习卡整屏可滚，手指一滑不该揭开中文。 */
const TAP_SLOP = 10;

/** 兜底：顶栏与底部按钮区在 DOM 上是 main 的兄弟节点，本来就命中不到；
    万一日后把它们包进可点区域，这层 stopPropagation 仍然挡住误触。 */
const stopPointer = (event: ReactPointerEvent<HTMLElement>) => event.stopPropagation();

export function SessionScreen({
  engine,
  book,
  initial,
  batchSize,
  showAll,
  hideMeaning,
  hideWord,
  run,
  onExit,
  onToggleMeaning,
  onToggleWord,
  onOpenCalendar,
  onOpenMe,
}: SessionScreenProps) {
  const lookup = useMemo(() => wordLookup(book), [book]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  /* 进入页面拍一次快照：复习队列 + 今日新词列表（无复习时直接可用）。 */
  const [plan] = useState<DailyPlan>(() => engine.plan());
  const [review, setReview] = useState<ReviewQueue>(() => buildReviewQueue(plan));
  const [newQueue, setNewQueue] = useState<string[]>(() =>
    review.items.length > 0 ? [] : engine.nextNewWords(undefined, plan.day),
  );
  const [phase, setPhase] = useState<Phase>(() => {
    if (review.items.length > 0) return 'review';
    return engine.nextNewWords(undefined, plan.day).length > 0 ? 'list' : 'done';
  });

  /* ---------------------------------------------------------------- 复习 */

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);
  const [toast, setToast] = useState<string | null>(null);

  const current = phase === 'review' ? review.items[index] : undefined;
  const detail = current ? lookup.get(current.word) : undefined;
  /** 连点保护：同一张卡只接受一次作答（否则会插两条回看项，违反「最多 3 次」）。 */
  const answering = useRef(-1);

  /* ------------------------------------------------------------ 作答手感 */

  /** 卡片反馈的瞬时状态：挂 180/200ms 的 CSS 动画，同时决定什么时候换卡。 */
  const { ack, play: playAck, busy: ackBusy } = useAnswerFeedback();

  /** 复习清空 → 重拍新词列表（复习闸此刻才真正开），无缝进列表。 */
  const finishReview = useCallback(() => {
    if (engine.today() !== plan.day) {
      onExit();
      return;
    }
    const queue = run((target) => target.nextNewWords(undefined, plan.day));
    if (queue.length > 0) {
      setNewQueue(queue);
      setPhase('list');
    } else {
      setPhase('done');
    }
  }, [engine, onExit, plan.day, run]);

  const submit = useCallback(
    (rating: Rating) => {
      if (!current) return;
      if (answering.current === index || ackBusy.current) return;
      answering.current = index;
      if (engine.today() !== plan.day) {
        onExit();
        return;
      }
      const outcome = run((target) => target.answer(current.word, rating));

      /** 出队 / 前进：先插入再判是否到头（否则最后一个词答错会直接收尾）。 */
      const step = () => {
        setRevealed(false);
        if (index + 1 >= review.items.length) finishReview();
        else setIndex((value) => value + 1);
      };

      if (!outcome.ok) {
        // 不接受（今天已答过 / 未到期）：不播反馈、不延迟，照旧提示后前进
        setToast(outcome.reason ?? '这个词现在不能作答');
        step();
        return;
      }

      const first = current.attempt === 1;
      // 回看全程静默（REVIEW_REQUEUE_SPEC §7）：只有「首次但今天已答过」（同日跨批次续答）才提示
      if (!outcome.counted && first) {
        setToast('今天已经答过这个词了，这次只记重试，不重复计分。');
      } else {
        setToast(null);
      }

      setTally((value) => {
        if (first && outcome.counted) {
          if (rating === 'known') return { ...value, known: value.known + 1 };
          if (rating === 'fuzzy') return { ...value, fuzzy: value.fuzzy + 1 };
          return { ...value, unknown: value.unknown + 1 };
        }
        return { ...value, retried: value.retried + 1 };
      });

      /* 推进（含 reveal 复位）要等反馈窗口结束 —— 否则遮罩的释义会在
         反馈的 180/200ms 里露出来（MOTION_SPEC §3）。 */
      const moveOn = () => {
        setRevealed(false);
        /* 回队尾：插在「短期 + 长期之后、逾期池之前」；游标已越过回看带时插到游标后一位
           （否则该词会被静默丢弃，见 REVIEW_REQUEUE_SPEC §5.2 / §8.10）。 */
        if (rating !== 'known' && current.attempt < 3) {
          const next = { ...current, attempt: (current.attempt + 1) as 2 | 3 };
          setReview((prev) => {
            const items = [...prev.items];
            items.splice(Math.max(prev.end, index + 1), 0, next);
            return { items, end: prev.end + 1 };
          });
          setIndex((value) => value + 1);
          return;
        }
        step();
      };

      ackBusy.current = true;
      playAck(rating === 'known' ? 'known' : 'wrong', moveOn);
    },
    [
      current,
      engine,
      finishReview,
      index,
      onExit,
      plan.day,
      playAck,
      review.items.length,
      run,
    ],
  );

  /* ---------------------------------------------------------------- 新词列表 */

  const size = Math.max(1, batchSize);
  const batches = useMemo(() => chunk(newQueue, size), [newQueue, size]);
  const batchCount = batches.length;
  const [batchIdx, setBatchIdx] = useState(0);
  /** 已入库的词数（= newQueue 前缀；pending 的起点） */
  const [committedCount, setCommittedCount] = useState(0);
  /** 总结页数字 */
  const [committedTotal, setCommittedTotal] = useState(0);
  const [hardTotal, setHardTotal] = useState(0);
  const [revealedRows, setRevealedRows] = useState<Set<number>>(() => new Set());

  const batch = batches[batchIdx] ?? [];
  const pending = useMemo(() => {
    const end = Math.min((batchIdx + 1) * size, newQueue.length);
    return newQueue.slice(committedCount, end);
  }, [batchIdx, committedCount, newQueue, size]);
  const isLastBatch = batchIdx + 1 >= batchCount;

  const goBatch = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(next, batchCount - 1));
      setBatchIdx(target);
      setRevealedRows(new Set());
      scrollRef.current?.scrollTo({ top: 0 });
    },
    [batchCount],
  );

  /**
   * 「下一批」= 状态机推进点：
   * 攒够 10 个（或末批还有没考的）→ 强制弹即时复习；否则翻页。
   * 「上一批」只回看不产生状态——pending 由 committed 和当前批尾决定，回看不会重复触发。
   */
  const handleNext = useCallback(() => {
    if (engine.today() !== plan.day) {
      onExit();
      return;
    }
    const shouldTrigger = pending.length >= IMMEDIATE_TRIGGER || (isLastBatch && pending.length > 0);
    if (shouldTrigger) {
      const group = run((target) => target.startImmediateWith(pending, plan.day));
      if (group) {
        setGroup(group);
        setPhase('immediate');
        setToast(null);
        return;
      }
      // 开组失败（词池被动过）：不卡死流程，按翻页处理
    }
    if (!isLastBatch) goBatch(batchIdx + 1);
    else setPhase('done');
  }, [batchIdx, engine, goBatch, isLastBatch, onExit, pending, plan.day, run]);

  /* ---------------------------------------------------------------- 即时复习 */

  const [group, setGroup] = useState<ImmediateGroup | null>(null);
  const immediateWord = group && group.queue.length > 0 ? group.queue[0] : null;
  const immediateDetail = immediateWord ? lookup.get(immediateWord) : undefined;
  const answerImmediateClick = useCallback(
    (known: boolean) => {
      if (!group || !immediateWord) return;
      if (ackBusy.current) return;
      if (engine.today() !== plan.day) {
        run((target) => target.abandonImmediate());
        onExit();
        return;
      }
      const result = run((target) => target.answerImmediate(immediateWord, known));
      if (!result) {
        setToast('这组即时复习已经结束了');
        setGroup(null);
        setPhase('done');
        return;
      }
      /* 一次作答可能同时发生三件事，合成一条 toast（复用 .session-toast，不新增样式）：
         记账 / 跨轮 / 本轮清空。谁都不发生就不动原来的提示。 */
      const parts: string[] = [];
      if (result.thresholdCrossed) parts.push('已记入错词本');
      if (result.crossed) parts.push('本轮不再出现');
      if (!result.finished && result.roundFinished) parts.push(`第 ${result.round} 轮 · 还有 ${result.remaining} 个词`);
      if (parts.length > 0) setToast(parts.join(' · '));

      /* 反馈跑完才换词 —— 与复习三键同一套（MOTION_SPEC §3）。 */
      const moveOn = () => {
        if (!result.finished) {
          setGroup(result.group);
          return;
        }
        /* 整组收口 = 这组词真正「背完」：唯一落库点。硬词以状态机给的 hardWords 为准
           （只在第 5 轮强制收口时非空），不再用组件内累积的集合——刷新后也不会丢。 */
        const hardWords = result.hardWords;
        const { committed, rejected } = run((target) =>
          target.commitNewWords(result.group.words, plan.day, hardWords),
        );
        setCommittedCount((value) => value + committed.length);
        setCommittedTotal((value) => value + committed.length);
        setHardTotal((value) => value + hardWords.length);
        setGroup(null);
        if (rejected.length > 0) {
          setToast(`有 ${rejected.length} 个词状态变了没能入库（可能已被清扫），其余都已背完。`);
        }
        if (batchIdx + 1 < batchCount) {
          goBatch(batchIdx + 1);
          setPhase('list');
        } else {
          setPhase('done');
        }
      };

      ackBusy.current = true;
      playAck(known ? 'known' : 'wrong', moveOn);
    },
    [
      batchCount,
      batchIdx,
      engine,
      goBatch,
      group,
      immediateWord,
      onExit,
      plan.day,
      playAck,
      run,
    ],
  );

  /** 退出：列表阶段本来就没落库；即时复习阶段整组作废，词留在池里。 */
  const handleExit = useCallback(() => {
    if (phase === 'immediate' && group) run((target) => target.abandonImmediate());
    onExit();
  }, [group, onExit, phase, run]);

  /* ---------------------------------------------------------------- 键盘（列表阶段） */

  useEffect(() => {
    if (phase !== 'list') return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'button')
      ) {
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goBatch(batchIdx - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        handleNext();
      } else if (event.key === ' ') {
        event.preventDefault();
        onToggleMeaning();
        setRevealedRows(new Set());
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [batchIdx, goBatch, handleNext, onToggleMeaning, phase]);

  /* ---------------------------------------------------------------- 揭示中文 */

  /** 切词必复位：揭示只属于当前这一张卡（复习换卡 / 即时换词 / 相位切换都算）。
      复习相的 step / moveOn 各自已经复位，这里是唯一兜底，漏一处也不会把上一张的揭示带过来。 */
  useEffect(() => {
    setRevealed(false);
  }, [phase, index, immediateWord]);

  /** 只有这两相有单卡、才有「遮住的中文」可揭示。 */
  const revealable = phase === 'review' || phase === 'immediate';
  const pressRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  /** 按下记坐标，抬起时位移 ≤ TAP_SLOP 才算「点了一下」；只揭示不隐藏（幂等）。 */
  const onStagePointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    if (!revealable || revealed || !event.isPrimary) return;
    pressRef.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const onStagePointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    const press = pressRef.current;
    pressRef.current = null;
    if (!press || press.pointerId !== event.pointerId || !revealable || revealed) return;
    if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > TAP_SLOP) return;
    setRevealed(true);
  };

  const clearPress = () => {
    pressRef.current = null;
  };

  /* ---------------------------------------------------------------- 视图 */

  const cardWord = phase === 'review' ? detail : immediateDetail;
  const progress =
    phase === 'review'
      ? { done: index, total: review.items.length, label: '今日复习' }
      : phase === 'list'
        ? {
            done: Math.min((batchIdx + 1) * size, newQueue.length),
            total: newQueue.length,
            label: '今日新词',
          }
        : phase === 'immediate'
          ? {
              done: group ? group.words.length - group.queue.length : 0,
              total: group ? group.words.length : 0,
              label: '即时复习',
            }
          : { done: 0, total: 0, label: '今日收尾' };

  const reviewAnswered = tally.known + tally.fuzzy + tally.unknown;

  return (
    <>
      <header className="topbar topbar--bordered" onPointerDown={stopPointer} onPointerUp={stopPointer}>
        <button
          type="button"
          className="icon-btn"
          onClick={handleExit}
          aria-label={phase === 'done' ? '返回首页' : '退出本次学习'}
        >
          <IconBack size={22} />
        </button>
        <div className="study-bar__info">
          <div className="study-bar__title">
            {progress.label}
            {phase === 'list' && batchCount > 0 ? (
              <span className="study-bar__title-total">
                {' '}
                · 第 {batchIdx + 1} / {batchCount} 批
              </span>
            ) : null}
          </div>
          <div className="study-bar__sub">
            {formatMonthDay(plan.day)} {weekdayLabel(plan.day)}
            {phase === 'immediate' && group
              ? ` · 还剩 ${group.queue.length} 个`
              : phase === 'list' && pending.length > 0
                ? ` · 待考 ${pending.length} 个`
                : ''}
          </div>
        </div>
        <button type="button" className="avatar-btn" onClick={onOpenMe} aria-label="打开我的">
          {initial}
        </button>
      </header>

      {phase !== 'done' ? (
        <div
          className="study-progress"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={Math.max(1, progress.total)}
          aria-valuenow={progress.done}
          aria-label="本次进度"
        >
          <span
            className="study-progress__bar"
            style={{ width: `${progress.total > 0 ? (progress.done / progress.total) * 100 : 0}%` }}
          />
        </div>
      ) : null}

      <main
        className="app__main"
        ref={scrollRef}
        onPointerDown={onStagePointerDown}
        onPointerUp={onStagePointerUp}
        onPointerCancel={clearPress}
        onPointerLeave={clearPress}
      >
        <div className="screen">
          {phase === 'done' ? (
            <div className="session-done">
              <p className="session-done__kicker">今日收尾</p>
              <h1 className="session-done__title">
                {committedTotal > 0 || reviewAnswered > 0
                  ? `复习 ${reviewAnswered} 个 · 入库 ${committedTotal} 个新词`
                  : '今天没有要学的了'}
              </h1>
              {reviewAnswered > 0 ? (
                <p className="session-done__text">
                  认识 {tally.known} · 模糊 {tally.fuzzy} · 不认识 {tally.unknown}
                  {tally.retried > 0 ? ` · 重试 ${tally.retried}` : ''}
                </p>
              ) : null}
              {committedTotal > 0 ? (
                <p className="session-done__text">
                  即时复习全部清空，这 {committedTotal} 个词才真正入库
                  {hardTotal > 0 ? ` · 其中硬词 ${hardTotal} 个` : ''}。
                </p>
              ) : null}
              <p className="session-done__note">
                {hardTotal > 0
                  ? '即时复习转满 5 轮仍没点「认识」的词已标成硬词；复习里不认识的词回到明天的 1 天批次，硬词和错词置顶。明天见。'
                  : '不认识的词会回到明天的 1 天批次，并进错词本。明天见。'}
              </p>
              <div className="session-done__actions">
                <button type="button" className="btn btn--primary btn--block" onClick={onOpenCalendar}>
                  看日历
                </button>
                <button type="button" className="btn btn--secondary btn--block" onClick={onExit}>
                  回到首页
                </button>
              </div>
            </div>
          ) : phase === 'list' ? (
            <div className="session">
              <ol
                className="word-list"
                key={`${plan.day}-${batchIdx}-${size}`}
                aria-label={`今日新词 第 ${batchIdx + 1} 批`}
              >
                {batch.map((word, rowIndex) => {
                  const detailRow = lookup.get(word);
                  return (
                    <WordRow
                      key={`${word}-${rowIndex}`}
                      word={detailRow ?? { w: word, ph: '', m: [] }}
                      index={rowIndex + 1}
                      showAll={showAll}
                      hideWord={hideWord}
                      hideMeaning={hideMeaning}
                      revealed={revealedRows.has(rowIndex)}
                      onReveal={() =>
                        setRevealedRows((prev) => {
                          const next = new Set(prev);
                          next.add(rowIndex);
                          return next;
                        })
                      }
                    />
                  );
                })}
              </ol>
              <SessionToast text={toast} />
            </div>
          ) : (
            <div className="flash">
              <article
                className={[
                  'flash-card',
                  phase === 'immediate' ? 'flash-card--centered' : '',
                  revealed ? '' : 'flash-card--masked',
                  ack === 'known' ? 'is-ack-known' : ack === 'wrong' ? 'is-ack-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flash-card__head">
                  <span className="flash-card__word">
                    {cardWord?.w ?? current?.word ?? immediateWord ?? ''}
                  </span>
                  {cardWord?.ph ? <span className="flash-card__ph">{cardWord.ph}</span> : null}
                </div>
                {phase === 'review' || phase === 'immediate' ? (
                  <div className="flash-card__meanings">
                    {(cardWord?.m ?? []).map((meaning, senseIndex) => (
                      <p
                        key={senseIndex}
                        className={senseIndex === 0 ? 'meaning meaning--main' : 'meaning meaning--extra'}
                      >
                        <span
                          className={revealed ? undefined : 'masked'}
                          aria-hidden={revealed || undefined}
                        >
                          {meaning}
                        </span>
                      </p>
                    ))}
                    {phase === 'review' && !cardWord ? <p className="meaning meaning--main">{current?.word}</p> : null}
                  </div>
                ) : null}
                {phase === 'review' && !revealed ? (
                  <button type="button" className="flash-card__reveal" onClick={() => setRevealed(true)}>
                    轻点看中文
                  </button>
                ) : null}
              </article>

              <SessionToast text={toast} />
            </div>
          )}
        </div>
      </main>

      {phase === 'review' ? (
        <div
          className="answer-dock answer-dock--review"
          onPointerDown={stopPointer}
          onPointerUp={stopPointer}
        >
          <button type="button" className="answer-btn answer-btn--unknown" onClick={() => submit('unknown')}>
            <IconClose size={18} />
            <span>{RATING_LABEL.unknown}</span>
          </button>
          <button type="button" className="answer-btn answer-btn--fuzzy" onClick={() => submit('fuzzy')}>
            <span>{RATING_LABEL.fuzzy}</span>
          </button>
          <button type="button" className="answer-btn answer-btn--known" onClick={() => submit('known')}>
            <IconCheck size={18} />
            <span>{RATING_LABEL.known}</span>
          </button>
        </div>
      ) : phase === 'list' ? (
        <ControlDock
          hideMeaning={hideMeaning}
          hideWord={hideWord}
          canPrev={batchIdx > 0}
          canNext={true}
          onToggleMeaning={() => {
            onToggleMeaning();
            setRevealedRows(new Set());
          }}
          onToggleWord={onToggleWord}
          onPrev={() => goBatch(batchIdx - 1)}
          onNext={handleNext}
          nextLabel={isLastBatch ? '看完收尾' : '下一批'}
        />
      ) : phase === 'immediate' ? (
        /* 即时复习两键：认识 / 模糊。点「模糊」→ 本轮内再出现一次；本轮第 2 次仍模糊 → 进下一轮；
           本会话累计模糊 3 次进错词本但仍要考到点「认识」；最多 5 轮，第 5 轮强制收口并标硬词。
           与复习三键（answer-dock--review）用修饰类隔离，样式与测试互不污染。 */
        <div
          className="answer-dock answer-dock--immediate"
          onPointerDown={stopPointer}
          onPointerUp={stopPointer}
        >
          <button
            type="button"
            className="answer-btn answer-btn--fuzzy"
            onClick={() => answerImmediateClick(false)}
          >
            <span>模糊</span>
          </button>
          <button
            type="button"
            className="answer-btn answer-btn--known"
            onClick={() => answerImmediateClick(true)}
          >
            <IconCheck size={18} />
            <span>认识</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
