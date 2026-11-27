/**
 * 「复习批次」卡片：每批一行可折叠的列表头，展开是这一批的具体词表。
 *
 * 为什么做成卡片：原来只有一行 13px 小字埋在长文案里，用户根本看不到「这批 12 词」是哪 12 个。
 * 现在批次有独立的卡片壳、明确的条数（`2 批 · 15 词`）、可点的行头，展开就是百词斩那种
 * 「英文加粗 + 释义浅色」的清单。
 *
 * 数据只读：词表由 `CalendarDay` / `LongBatch` 带进来（见 `CalendarBatch`），这里不查库、不重算。
 * 释义来自当前阶段的词库（`Map<string, Word>`）；换了阶段后旧词查不到释义，就只显示英文单词，
 * 不编造释义。
 */

import { useMemo, useState } from 'react';
import { formatMonthDay } from '../lib/scheduler';
import type { CalendarBatch, LongBatch } from '../lib/scheduler';
import type { Word } from '../lib/types';

interface ReviewBatchesProps {
  /** 短期批次（当天到期的那几批） */
  batches: CalendarBatch[];
  longBatches: LongBatch[];
  /** 这一天学完了没有：历史日按「已复习/未复习」给每行上色 */
  doneWords: ReadonlySet<string>;
  /** 今天/未来日不标单词语义（还没发生） */
  showDoneMarks: boolean;
  /** 英文单词 → 词库条目；查不到就只显示单词 */
  index: ReadonlyMap<string, Word> | null;
  /** 多义是否展开（跟设置里的释义详略走） */
  showAll: boolean;
  /** 未来日：批次是「已排定」而不是「已发生」 */
  estimated?: boolean;
}

/** 一批最多画这么多行，多的折成一句「还有 N 个」——360 天批次可能几十上百词 */
const MAX_ROWS = 60;

function batchKey(prefix: string, a: string | number, b: string | number): string {
  return `${prefix}:${a}:${b}`;
}

function meaningOf(word: Word | undefined, showAll: boolean): string {
  if (!word) return '';
  const list = word.m ?? [];
  if (list.length === 0) return '';
  return showAll && list.length > 1 ? `${list[0]}；${list[1]}` : list[0];
}

function WordList({
  words,
  doneWords,
  showDoneMarks,
  index,
  showAll,
}: {
  words: string[];
  doneWords: ReadonlySet<string>;
  showDoneMarks: boolean;
  index: ReadonlyMap<string, Word> | null;
  showAll: boolean;
}) {
  const shown = words.slice(0, MAX_ROWS);
  const rest = words.length - shown.length;
  return (
    <>
      <ul className="batch__words">
        {shown.map((word) => {
          const entry = index?.get(word);
          const meaning = meaningOf(entry, showAll);
          // 历史日：那天没答出来的词压暗，一眼看出「学了 3 个、还剩 9 个」
          const missed = showDoneMarks && !doneWords.has(word);
          return (
            <li key={word} className={missed ? 'batch-word is-missed' : 'batch-word'}>
              <span className="batch-word__w">{word}</span>
              <span className="batch-word__m">{meaning || '—'}</span>
            </li>
          );
        })}
      </ul>
      {rest > 0 ? (
        <p className="batch__more">
          还有 {rest} 个词
        </p>
      ) : null}
    </>
  );
}

export function ReviewBatches({
  batches,
  longBatches,
  doneWords,
  showDoneMarks,
  index,
  showAll,
  estimated = false,
}: ReviewBatchesProps) {
  const total = useMemo(
    () => batches.reduce((sum, batch) => sum + batch.words.length, 0) + longBatches.reduce((sum, b) => sum + b.words.length, 0),
    [batches, longBatches],
  );
  const count = batches.length + longBatches.length;

  // 默认展开第一批：用户要的「存在感」就在这里——点进来先看见词，而不是先看见一行小字。
  const [open, setOpen] = useState<Set<string>>(() => {
    const first = batches[0] ? batchKey('short', batches[0].sourceDate, batches[0].daysAgo) : null;
    const fallback = !first && longBatches[0] ? batchKey('long', longBatches[0].type, longBatches[0].scheduledDate) : null;
    const seed = first ?? fallback;
    return new Set(seed ? [seed] : []);
  });

  const toggle = (key: string) => {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const renderHead = (key: string, when: string, what: string, words: number) => {
    const expanded = open.has(key);
    return (
      <button
        type="button"
        className="batch__head"
        aria-expanded={expanded}
        aria-controls={`${key}-words`}
        onClick={() => toggle(key)}
      >
        <span className="batch__what">{what}</span>
        <span className="batch__when">{when}</span>
        <span className="batch__num">{words} 词</span>
        <span className="batch__chev" aria-hidden="true" data-open={expanded ? '' : undefined}>
          <svg viewBox="0 0 12 12" width="12" height="12" focusable="false">
            <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    );
  };

  return (
    <section className="batches" aria-label="复习批次">
      <header className="batches__head">
        <h3 className="batches__title">复习批次</h3>
        {estimated ? <span className="batches__tag">已排定</span> : null}
        <span className="batches__count">
          {count} 批 · {total} 词
        </span>
      </header>

      <div className="batches__list">
        {batches.map((batch) => {
          const key = batchKey('short', batch.sourceDate, batch.daysAgo);
          const expanded = open.has(key);
          return (
            <div className="batch" key={key} data-open={expanded ? '' : undefined}>
              {renderHead(
                key,
                batch.daysAgo > 0 ? `${batch.daysAgo} 天前` : '当天那批',
                `${formatMonthDay(batch.sourceDate)} 那批`,
                batch.words.length,
              )}
              {expanded ? (
                <div id={`${key}-words`}>
                  <WordList
                    words={batch.words}
                    doneWords={doneWords}
                    showDoneMarks={showDoneMarks}
                    index={index}
                    showAll={showAll}
                  />
                </div>
              ) : null}
            </div>
          );
        })}

        {longBatches.map((batch) => {
          const key = batchKey('long', batch.type, batch.scheduledDate);
          const expanded = open.has(key);
          return (
            <div className="batch" key={key} data-open={expanded ? '' : undefined}>
              {renderHead(
                key,
                '长期',
                `${batch.type.replace('d', ' 天')} 批次`,
                batch.words.length,
              )}
              {expanded ? (
                <div id={`${key}-words`}>
                  <WordList
                    words={batch.words}
                    doneWords={doneWords}
                    showDoneMarks={showDoneMarks}
                    index={index}
                    showAll={showAll}
                  />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
