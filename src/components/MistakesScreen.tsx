/**
 * 错词本：有数据就必须有入口。
 *
 * 数据来自 `engine.mistakes()` —— 正式复习点「不认识」、即时复习里累计模糊 3 次、
 * 归档抽查答错，都会进这本账；每条带累计次数与最后一次答错日期。
 *
 * 「单测」只回答「现在还记得吗」：答对移出错词本，答错留在这里并 +1。
 * 它**不动排程、不计正确率**（引擎里就是这么写的，页面别再自己算一遍）。
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { formatMonthDay } from '../lib/scheduler';
import type { CardState, MistakeRow, Scheduler } from '../lib/scheduler';
import { wordLookup } from '../lib/deck';
import type { Wordbook } from '../lib/types';
import { useAnswerFeedback } from '../hooks/useAnswerFeedback';
import { RollingNumber } from './RollingNumber';
import { IconBack, IconCheck, IconClose } from './Icons';
import { SessionToast } from './SessionToast';

interface MistakesScreenProps {
  engine: Scheduler;
  version: number;
  book: Wordbook | null;
  initial: string;
  run: <T>(fn: (engine: Scheduler) => T) => T;
  onBack: () => void;
  onOpenMe: () => void;
}

const SOURCE_LABEL: Record<MistakeRow['source'], string> = {
  review: '正式复习',
  immediate: '即时复习',
  archived: '归档抽查',
  quiz: '错词本单测',
};

/** 卡片还在哪一档、下次什么时候再见；卡片被清扫了就说清楚它去哪了。 */
function scheduleHint(card: CardState | null): string {
  if (!card) return '已回到新词池，重新学到时会再排';
  if (card.phase === 'archived') return '已归档，只在这里抽查';
  if (card.phase === 'long') return `${card.longInterval} 天长期节点`;
  return card.due ? `下次复习 ${formatMonthDay(card.due)}` : '暂无排程';
}

export function MistakesScreen({
  engine,
  version,
  book,
  initial,
  run,
  onBack,
  onOpenMe,
}: MistakesScreenProps) {
  const rows = useMemo(() => {
    void version;
    return engine.mistakes();
  }, [engine, version]);
  const lookup = useMemo(() => wordLookup(book), [book]);

  const [quizWord, setQuizWord] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** 作答反馈（MOTION_SPEC §3）：与学习流同一套类名与时长，两处手感必须一致。 */
  const { ack, play: playAck } = useAnswerFeedback();

  const flash = useCallback((text: string) => {
    setToast(text);
  }, []);

  /* Esc 退出单测（不在单测里就退出页面） */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (quizWord) {
        setQuizWord(null);
        setRevealed(false);
      } else {
        onBack();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quizWord, onBack]);

  const openQuiz = (word: string) => {
    setQuizWord(word);
    setRevealed(false);
  };

  const answerQuiz = (known: boolean) => {
    if (!quizWord) return;
    const result = run((engineRef) => engineRef.quizMistake(quizWord, known));
    if (!result.ok) {
      // 不接受（词已不在错词本等）：不播反馈、不延迟，照旧提示后关掉单测
      flash(result.reason ?? '这个词现在不能单测');
      setQuizWord(null);
      setRevealed(false);
      return;
    }
    if (known) {
      flash('答对，已移出错词本；排程不变，到日子还会再复习一次。');
    } else {
      flash('记下了。它还在错词本里，累计错次 +1。');
    }
    /* 反馈跑完才关单测（MOTION_SPEC §3）—— 关早了卡片会带着动画一起消失。 */
    playAck(known ? 'known' : 'wrong', () => {
      setQuizWord(null);
      setRevealed(false);
    });
  };

  const quizDetail = quizWord ? lookup.get(quizWord) : undefined;
  const quizRow = quizWord ? rows.find((row) => row.word === quizWord) : undefined;

  return (
    <>
      <header className="topbar topbar--bordered">
        <button
          type="button"
          className="icon-btn"
          onClick={quizWord ? () => setQuizWord(null) : onBack}
          aria-label={quizWord ? '退出单测' : '返回'}
        >
          <IconBack size={22} />
        </button>
        <div className="study-bar__info">
          <div className="study-bar__title">{quizWord ? '错词单测' : '错词本'}</div>
          <div className="study-bar__sub">
            {quizWord ? (
              '答对移出 · 答错继续留着'
            ) : (
              <>
                <RollingNumber value={rows.length} memoKey="mistakes.count" digits={4} /> 个词 · 最后错的排在前面
              </>
            )}
          </div>
        </div>
        <button type="button" className="avatar-btn" onClick={onOpenMe} aria-label="打开我的">
          {initial}
        </button>
      </header>

      <main className="app__main">
        <div className="screen">
          <SessionToast text={toast} />

          {quizWord ? (
            <div className="flash">
              <article
                className={[
                  'flash-card',
                  revealed ? '' : 'flash-card--masked',
                  ack === 'known' ? 'is-ack-known' : ack === 'wrong' ? 'is-ack-wrong' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <div className="flash-card__head">
                  <span className="flash-card__word">{quizDetail?.w ?? quizWord}</span>
                  {quizDetail?.ph ? <span className="flash-card__ph">{quizDetail.ph}</span> : null}
                </div>
                <div className="flash-card__meanings">
                  {(quizDetail?.m ?? []).map((meaning, senseIndex) => (
                    <p
                      key={senseIndex}
                      className={senseIndex === 0 ? 'meaning meaning--main' : 'meaning meaning--extra'}
                    >
                      <span className={revealed ? undefined : 'masked'} aria-hidden={revealed || undefined}>
                        {meaning}
                      </span>
                    </p>
                  ))}
                  {!quizDetail ? <p className="meaning meaning--main">{quizWord}</p> : null}
                </div>
                {!revealed ? (
                  <button type="button" className="flash-card__reveal" onClick={() => setRevealed(true)}>
                    轻点看中文
                  </button>
                ) : null}
                {quizRow ? (
                  <p className="mistake-quiz__meta">
                    累计错 {quizRow.count} 次 · 最后一次 {formatMonthDay(quizRow.lastDay)} ·{' '}
                    {SOURCE_LABEL[quizRow.source]} · {scheduleHint(quizRow.card)}
                  </p>
                ) : null}
              </article>
            </div>
          ) : rows.length === 0 ? (
            <section className="mistakes-empty" aria-label="错词本为空">
              <p className="mistakes-empty__title">错词本是空的</p>
              <p className="mistakes-empty__text">
                复习时点「不认识」、即时复习里累计模糊 3 次，都会记到这里。
                每个词会留下累计答错次数和最后一次答错的日期，方便你集中清一遍。
              </p>
              <button type="button" className="btn btn--primary btn--block" onClick={onBack}>
                回去继续学
              </button>
            </section>
          ) : (
            <section className="mistakes" aria-label="错词列表">
              <ul className="mistakes__list">
                {rows.map((row) => {
                  const detail = lookup.get(row.word);
                  return (
                    <li key={row.word}>
                      <button
                        type="button"
                        className="mistake-row"
                        onClick={() => openQuiz(row.word)}
                        aria-label={`单测 ${row.word}，累计答错 ${row.count} 次`}
                      >
                        <span className="mistake-row__main">
                          <span className="mistake-row__word">
                            {detail?.w ?? row.word}
                            {detail?.ph ? <span className="mistake-row__ph">{detail.ph}</span> : null}
                          </span>
                          <span className="mistake-row__meaning">
                            {(detail?.m ?? [])[0] ?? '词条不在当前词库里'}
                          </span>
                        </span>
                        <span className="mistake-row__meta">
                          <span className="mistake-row__badge">错 {row.count} 次</span>
                          <span className="mistake-row__date">最后 {formatMonthDay(row.lastDay)}</span>
                          <span className="mistake-row__hint">{scheduleHint(row.card)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </main>

      {quizWord ? (
        <div className="answer-dock">
          <button type="button" className="answer-btn answer-btn--unknown" onClick={() => answerQuiz(false)}>
            <IconClose size={18} />
            <span>还是不认识</span>
          </button>
          <button type="button" className="answer-btn answer-btn--known" onClick={() => answerQuiz(true)}>
            <IconCheck size={18} />
            <span>记住了</span>
          </button>
        </div>
      ) : null}
    </>
  );
}
