/**
 * 专注学习页：今日复习（三键）与学新词（看词 + 即时复习）。
 *
 * 作答口径**全部交给引擎**，页面只负责把结果画出来：
 * - 一切作答走 `engine.answer()`：同一天第二次及以后会自动降级成 isRetry（不计正确率、不动排程）；
 * - 完成率的分母是当天快照，页面不参与计算；
 * - 学新词走 `learnNewWord()`，配额/复习闸/逾期闸由它内部把关，`ok:false` 时把 `reason` 原样给用户看；
 * - 攒满 10 个触发即时复习（两键、最多 3 次、可跳过）。
 *
 * 队列在进入页面时拍一次（`plan()` 的结果），之后不再随引擎状态重建——
 * 不然每答一个词队列就少一个，进度条和「还剩几个」会乱跳。
 */

import { useCallback, useMemo, useState } from 'react';
import {
  formatMonthDay,
  RATING_LABEL,
  weekdayLabel,
} from '../lib/scheduler';
import type { DailyPlan, Rating, Scheduler } from '../lib/scheduler';
import { wordLookup } from '../lib/deck';
import type { Wordbook } from '../lib/types';
import { IconBack, IconCheck, IconClose } from './Icons';

type Phase = 'review' | 'newword' | 'immediate' | 'done';

interface QueueItem {
  word: string;
  kind: 'short' | 'overdue' | 'long';
  label: string;
  sourceDate: string;
}

interface SessionScreenProps {
  engine: Scheduler;
  book: Wordbook | null;
  initial: string;
  startMode: 'review' | 'newword';
  run: <T>(fn: (engine: Scheduler) => T) => T;
  onExit: () => void;
  onOpenCalendar: () => void;
  onOpenMe: () => void;
}

function buildReviewQueue(plan: DailyPlan): QueueItem[] {
  const items: QueueItem[] = [];
  for (const batch of plan.shortTermBatches) {
    for (const word of batch.words) {
      items.push({
        word,
        kind: 'short',
        label: `${batch.daysAgo} 天前 · ${formatMonthDay(batch.sourceDate)}`,
        sourceDate: batch.sourceDate,
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
      });
    }
  }
  for (const batch of plan.overduePool) {
    for (const word of batch.words) {
      items.push({
        word,
        kind: 'overdue',
        label: `逾期 ${batch.overdueDays} 天 · ${formatMonthDay(batch.sourceDate)}`,
        sourceDate: batch.sourceDate,
      });
    }
  }
  return items;
}

interface Tally {
  known: number;
  fuzzy: number;
  unknown: number;
  retried: number;
}

const EMPTY_TALLY: Tally = { known: 0, fuzzy: 0, unknown: 0, retried: 0 };

export function SessionScreen({
  engine,
  book,
  initial,
  startMode,
  run,
  onExit,
  onOpenCalendar,
  onOpenMe,
}: SessionScreenProps) {
  const lookup = useMemo(() => wordLookup(book), [book]);
  const [plan] = useState<DailyPlan>(() => engine.plan());
  const [queue] = useState<QueueItem[]>(() => buildReviewQueue(plan));
  const [phase, setPhase] = useState<Phase>(() => {
    if (startMode === 'review') return queue.length > 0 ? 'review' : 'done';
    return engine.nextNewWords(undefined, plan.day).length > 0 ? 'newword' : 'done';
  });
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [tally, setTally] = useState<Tally>(EMPTY_TALLY);
  const [learned, setLearned] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  /* ---------------------------------------------------------------- 复习 */

  const current = queue[index];
  const detail = current ? lookup.get(current.word) : undefined;

  const finishReview = useCallback(() => {
    setPhase(engine.nextNewWords(undefined, plan.day).length > 0 ? 'newword' : 'done');
    setIndex(queue.length);
  }, [engine, plan.day, queue.length]);

  const submit = useCallback(
    (rating: Rating) => {
      if (!current) return;
      const outcome = run((target) => target.answer(current.word, rating));
      if (!outcome.ok) {
        setToast(outcome.reason ?? '这个词现在不能作答');
        setIndex((value) => value + 1);
        setRevealed(false);
        return;
      }
      if (!outcome.counted) {
        setToast('今天已经答过这个词了，这次只记重试，不重复计分。');
      }
      setTally((value) => ({
        known: value.known + (rating === 'known' ? 1 : 0),
        fuzzy: value.fuzzy + (rating === 'fuzzy' ? 1 : 0),
        unknown: value.unknown + (rating === 'unknown' ? 1 : 0),
        retried: value.retried + (outcome.counted ? 0 : 1),
      }));
      setRevealed(false);
      if (index + 1 >= queue.length) finishReview();
      else setIndex((value) => value + 1);
    },
    [current, finishReview, index, queue.length, run],
  );

  /* ---------------------------------------------------------------- 新词 */

  const [newQueue] = useState<string[]>(() => engine.nextNewWords(undefined, plan.day));
  const newWord = phase === 'newword' ? newQueue[learned] : undefined;
  const newDetail = newWord ? lookup.get(newWord) : undefined;

  const nextNewWord = useCallback(() => {
    if (!newWord) return;
    const result = run((target) => target.learnNewWord(newWord, plan.day));
    if (!result.ok) {
      setToast(result.reason ?? '这个词现在学不了');
      return;
    }
    setLearned((value) => value + 1);
    if (result.triggerImmediate) {
      run((target) => target.startImmediate());
      setPhase('immediate');
      return;
    }
    if (learned + 1 >= newQueue.length) setPhase('done');
  }, [learned, newQueue.length, newWord, plan.day, run]);

  /* ---------------------------------------------------------------- 即时复习 */

  const active = engine.state.immediate.active;
  const immediateWord = phase === 'immediate' && active ? active.queue[0] : null;
  const immediateDetail = immediateWord ? lookup.get(immediateWord) : undefined;

  const answerImmediate = useCallback(
    (known: boolean) => {
      if (!immediateWord) return;
      run((target) => target.answerImmediate(immediateWord, known));
      // 组做完时引擎会把 active 置空
      if (engine.state.immediate.active === null) {
        setPhase(learned >= newQueue.length ? 'done' : 'newword');
      }
    },
    [engine, immediateWord, learned, newQueue.length, run],
  );

  const skipImmediate = useCallback(() => {
    run((target) => target.skipImmediate());
    setPhase(learned >= newQueue.length ? 'done' : 'newword');
  }, [learned, newQueue.length, run]);

  /* ---------------------------------------------------------------- 视图 */

  const cardWord = phase === 'review' ? detail : phase === 'newword' ? newDetail : immediateDetail;
  const showMeaning = phase !== 'review' || revealed;
  const progress =
    phase === 'review'
      ? { done: index, total: queue.length, label: current?.label ?? '' }
      : phase === 'newword'
        ? { done: learned, total: newQueue.length, label: '今日新词' }
        : phase === 'immediate'
          ? {
              done: active ? active.words.length - active.queue.length : 0,
              total: active ? active.words.length : 0,
              label: '即时复习',
            }
          : { done: 0, total: 0, label: '本次结束' };

  return (
    <>
      <header className="topbar topbar--bordered">
        <button type="button" className="icon-btn" onClick={onExit} aria-label="退出本次学习">
          <IconBack size={22} />
        </button>
        <div className="study-bar__info">
          <div className="study-bar__title">{progress.label}</div>
          <div className="study-bar__sub">
            {formatMonthDay(plan.day)} {weekdayLabel(plan.day)}
            {phase === 'immediate' ? ' · 即时复习' : ''}
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

      <main className="app__main">
        <div className="screen">
          {phase === 'done' ? (
            <div className="session-done">
              <p className="session-done__kicker">本次结束</p>
              <h1 className="session-done__title">
                复习 {tally.known + tally.fuzzy + tally.unknown} 个 · 学新词 {learned} 个
              </h1>
              <p className="session-done__text">
                认识 {tally.known} · 模糊 {tally.fuzzy} · 不认识 {tally.unknown}
                {tally.retried > 0 ? ` · 重试 ${tally.retried}` : ''}
              </p>
              <p className="session-done__note">
                不认识的词会回到明天的 1 天批次，并进错词本。模糊的退回上一档，认识的前进一档。
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
          ) : (
            <div className="flash">
              <article className={showMeaning ? 'flash-card' : 'flash-card flash-card--masked'}>
                <div className="flash-card__head">
                  <span className="flash-card__word">{cardWord?.w ?? current?.word ?? newWord ?? ''}</span>
                  {cardWord?.ph ? <span className="flash-card__ph">{cardWord.ph}</span> : null}
                </div>
                <div className="flash-card__meanings">
                  {(cardWord?.m ?? []).map((meaning, senseIndex) => (
                    <p key={senseIndex} className={senseIndex === 0 ? 'meaning meaning--main' : 'meaning meaning--extra'}>
                      <span className={showMeaning ? undefined : 'masked'} aria-hidden={showMeaning || undefined}>
                        {meaning}
                      </span>
                    </p>
                  ))}
                  {!cardWord ? <p className="meaning meaning--main">{current?.word ?? newWord}</p> : null}
                </div>
                {phase === 'review' && !revealed ? (
                  <button type="button" className="flash-card__reveal" onClick={() => setRevealed(true)}>
                    轻点看中文
                  </button>
                ) : null}
              </article>

              {toast ? (
                <p className="session-toast" role="status">
                  {toast}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </main>

      {phase === 'review' ? (
        <div className="answer-dock">
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
      ) : phase === 'newword' ? (
        <div className="answer-dock">
          <button type="button" className="answer-btn answer-btn--ghost" onClick={onExit}>
            先不学了
          </button>
          <button type="button" className="answer-btn answer-btn--known" onClick={nextNewWord}>
            <span>记住了，下一个</span>
          </button>
        </div>
      ) : (
        <div className="answer-dock">
          <button type="button" className="answer-btn answer-btn--unknown" onClick={() => answerImmediate(false)}>
            <span>不认识</span>
          </button>
          <button type="button" className="answer-btn answer-btn--ghost" onClick={skipImmediate}>
            跳过
          </button>
          <button type="button" className="answer-btn answer-btn--known" onClick={() => answerImmediate(true)}>
            <span>认识</span>
          </button>
        </div>
      )}
    </>
  );
}
