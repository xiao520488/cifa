import type { ReactNode, RefObject } from 'react';
import { chineseCount } from '../lib/words';
import type { LevelMeta, Word } from '../lib/types';
import { ControlDock } from './ControlDock';
import { IconBack, IconCalendar, IconPalette } from './Icons';
import { WordRow } from './WordRow';

interface StudyScreenProps {
  stageMeta: LevelMeta;
  batch: Word[];
  batchIndex: number;
  batchCount: number;
  batchSize: number;
  totalCount: number;
  seenCount: number;
  initial: string;
  studying: boolean;
  hideMeaning: boolean;
  hideWord: boolean;
  showAll: boolean;
  revealed: Set<number>;
  scrollRef: RefObject<HTMLDivElement | null>;
  /** 首页「今日」摘要（由调度引擎算好传进来，本组件不碰调度） */
  todayCard?: ReactNode;
  onStart: () => void;
  onExit: () => void;
  onOpenMe: () => void;
  onOpenSkin: () => void;
  onOpenCalendar: () => void;
  onToggleMeaning: () => void;
  onToggleWord: () => void;
  onPrev: () => void;
  onNext: () => void;
  onReveal: (index: number) => void;
  onImport: () => void;
}

export function StudyScreen({
  stageMeta,
  batch,
  batchIndex,
  batchCount,
  batchSize,
  totalCount,
  seenCount,
  initial,
  studying,
  hideMeaning,
  hideWord,
  showAll,
  revealed,
  scrollRef,
  todayCard,
  onStart,
  onExit,
  onOpenMe,
  onOpenSkin,
  onOpenCalendar,
  onToggleMeaning,
  onToggleWord,
  onPrev,
  onNext,
  onReveal,
  onImport,
}: StudyScreenProps) {
  const progressPercent = batchCount > 0 ? ((batchIndex + 1) / batchCount) * 100 : 0;
  const empty = totalCount === 0;
  const today = new Date();
  const dateLabel = `${today.getFullYear()} · ${String(today.getMonth() + 1).padStart(2, '0')} · ${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  return (
    <>
      <header className={studying ? 'topbar topbar--bordered' : 'topbar'}>
        {studying ? (
          <>
            <button type="button" className="icon-btn" onClick={onExit} aria-label="退出本批，回到开始页">
              <IconBack size={22} />
            </button>
            <div className="study-bar__info">
              <div className="study-bar__title">
                第 {batchIndex + 1}
                <span className="study-bar__title-total"> / {batchCount} 批</span>
              </div>
              <div className="study-bar__sub">
                {stageMeta.short} · {batch.length} 词
              </div>
            </div>
          </>
        ) : (
          <div className="brand">
            <span className="brand__name">词笺</span>
            <span className="brand__dot" aria-hidden="true" />
            <span className="topbar__meta">
              <span>{stageMeta.name}</span>
              <span className="topbar__sep" aria-hidden="true">
                ·
              </span>
              <span>
                第 {batchIndex + 1} / {batchCount} 批
              </span>
              <span className="topbar__sep" aria-hidden="true">
                ·
              </span>
              <span>{batch.length} 词</span>
            </span>
          </div>
        )}
        <button type="button" className="icon-btn" onClick={onOpenCalendar} aria-label="打开学习日历">
          <IconCalendar size={20} />
        </button>
        <button type="button" className="icon-btn" onClick={onOpenSkin} aria-label="切换外观风格">
          <IconPalette size={20} />
        </button>
        <button type="button" className="avatar-btn" onClick={onOpenMe} aria-label="打开我的">
          {initial}
        </button>
      </header>

      <div className="readouts" aria-hidden="true">
        <div className="readout">
          <span className="readout__k">批</span>
          <span className="readout__v">
            {String(batchIndex + 1).padStart(2, '0')}/{String(batchCount).padStart(2, '0')}
          </span>
        </div>
        <div className="readout">
          <span className="readout__k">本批</span>
          <span className="readout__v">{String(batch.length).padStart(3, '0')}</span>
        </div>
        <div className="readout">
          <span className="readout__k">已学</span>
          <span className="readout__v">{String(seenCount).padStart(3, '0')}</span>
        </div>
      </div>

      {studying ? (
        <div
          className="study-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={batchCount}
          aria-valuenow={batchIndex + 1}
          aria-label="批次进度"
        >
          <span className="study-progress__bar" style={{ width: `${progressPercent}%` }} />
        </div>
      ) : null}

      <main className="app__main" ref={scrollRef}>
        <div className="screen">
          {!studying ? (
            empty ? (
              <div className="empty">
                <p className="empty__title">还没有词可以背</p>
                <p className="empty__text">导入一份自己的词表，或者先切到内置的四六级词库。</p>
                <button type="button" className="btn btn--primary" onClick={onImport}>
                  导入词表
                </button>
                <button type="button" className="btn btn--text" onClick={onOpenMe}>
                  去「我的」切换阶段
                </button>
              </div>
            ) : (
              <div className="start">
                <div className="start__masthead">
                  <span className="start__masthead-brand">词笺</span>
                  <span className="start__masthead-rule" aria-hidden="true" />
                  <span className="start__masthead-meta">{dateLabel}</span>
                </div>
                <p className="start__kicker">{stageMeta.short} · DAILY LIST</p>
                <div className="start__body">
                  <p className="start__eyebrow">
                    {stageMeta.name} · {totalCount} 词
                  </p>
                  <h1 className="start__title">
                    一页{chineseCount(batchSize)}个词，
                    <br />
                    看一遍就会。
                  </h1>
                  <p className="start__lede">
                    先顺着看一遍，再关掉中文考自己。翻过去就是下一批，进度自己记着。
                  </p>
                  <div className="start__meta">
                    <span>
                      第 <b>{batchIndex + 1}</b> / {batchCount} 批
                    </span>
                    <span>
                      已学 <b>{seenCount}</b> 词
                    </span>
                  </div>
                  <div className="start__spec">
                    <div className="start__spec-row">
                      <span className="start__spec-k">阶段</span>
                      <span className="start__spec-v">{stageMeta.name}</span>
                    </div>
                    <div className="start__spec-row">
                      <span className="start__spec-k">本批</span>
                      <span className="start__spec-v">{batch.length} 词</span>
                    </div>
                    <div className="start__spec-row">
                      <span className="start__spec-k">批次</span>
                      <span className="start__spec-v">
                        第 {batchIndex + 1} / 共 {batchCount} 批
                      </span>
                    </div>
                    <div className="start__spec-row">
                      <span className="start__spec-k">已学</span>
                      <span className="start__spec-v">
                        {seenCount} / {totalCount} 词
                      </span>
                    </div>
                  </div>
                  <div className="start__actions">
                    <button type="button" className="btn btn--primary btn--block" onClick={onStart}>
                      开始背单词
                    </button>
                  </div>
                  {todayCard}
                </div>
                <div className="start__foot">
                  <span>进度只存在这台设备</span>
                  <span className="start__rule" aria-hidden="true" />
                  <button type="button" className="btn btn--text" onClick={onOpenMe}>
                    换个阶段
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="session">
              <ol
                className="word-list"
                key={`${stageMeta.key}-${batchIndex}-${batchSize}`}
                aria-label={`第 ${batchIndex + 1} 批单词`}
              >
                {batch.map((word, index) => (
                  <WordRow
                    key={`${word.w}-${index}`}
                    word={word}
                    index={index + 1}
                    showAll={showAll}
                    hideWord={hideWord}
                    hideMeaning={hideMeaning}
                    revealed={revealed.has(index)}
                    onReveal={() => onReveal(index)}
                  />
                ))}
              </ol>
            </div>
          )}
        </div>
      </main>

      {studying ? (
        <ControlDock
          hideMeaning={hideMeaning}
          hideWord={hideWord}
          canPrev={batchIndex > 0}
          canNext={batchIndex < batchCount - 1}
          onToggleMeaning={onToggleMeaning}
          onToggleWord={onToggleWord}
          onPrev={onPrev}
          onNext={onNext}
        />
      ) : null}
    </>
  );
}
