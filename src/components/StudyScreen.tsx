/**
 * 首页（v1.1）：品牌页 + 唯一学习入口。
 *
 * 旧的「整本词库按批浏览」分支已删——列表形态挪进了统一 Session，
 * 切分按今日发放额度走（REFACTOR_PLAN §1）。本页所有数字读调度引擎：
 * 今日新词 = `plan.allowedNewWords`，今日批数 = 额度按批大小取整，
 * 已学 = 卡库总数。旧 `progress.seen/batchIndex` 不再出现在界面上。
 */

import type { ReactNode } from 'react';
import type { LevelMeta } from '../lib/types';
import { Readouts, type ReadoutItem } from './Readouts';
import { IconCalendar, IconPalette } from './Icons';

interface StudyScreenProps {
  stageMeta: LevelMeta;
  totalCount: number;
  batchSize: number;
  /** 今日实际能学的发放量（复习闸 / 逾期闸 / 配额之后） */
  allowedNew: number;
  todayBatchCount: number;
  learnedCount: number;
  initial: string;
  /** 首页「今日」摘要（由调度引擎算好传进来，本组件不碰调度） */
  todayCard?: ReactNode;
  /** 读数带三项（今日/批数/已学）。由 App 顶层同一份 memo 生成，
   *  与日历 / 「我的」屏的常驻带同源——本组件不再自己格式化数字。 */
  readoutItems: ReadoutItem[];
  onStart: () => void;
  onOpenMe: () => void;
  onOpenSkin: () => void;
  onOpenCalendar: () => void;
  onImport: () => void;
}

export function StudyScreen({
  stageMeta,
  totalCount,
  batchSize,
  allowedNew,
  todayBatchCount,
  learnedCount,
  initial,
  todayCard,
  readoutItems,
  onStart,
  onOpenMe,
  onOpenSkin,
  onOpenCalendar,
  onImport,
}: StudyScreenProps) {
  const empty = totalCount === 0;
  const today = new Date();
  const dateLabel = `${today.getFullYear()} · ${String(today.getMonth() + 1).padStart(2, '0')} · ${String(
    today.getDate(),
  ).padStart(2, '0')}`;

  return (
    <>
      <header className="topbar">
        <div className="brand">
          <span className="brand__name">词笺</span>
          <span className="brand__dot" aria-hidden="true" />
          <span className="topbar__meta">
            <span>{stageMeta.name}</span>
            <span className="topbar__sep" aria-hidden="true">
              ·
            </span>
            <span>{allowedNew > 0 ? `今日 ${allowedNew} 词` : '今日新词已发完'}</span>
          </span>
        </div>
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

      <Readouts screen="home" items={readoutItems} />

      <main className="app__main">
        <div className="screen">
          {empty ? (
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
                <div className="start__meta">
                  <span>
                    今日 <b>{allowedNew}</b> 词
                  </span>
                  <span>
                    已学 <b>{learnedCount}</b> 词
                  </span>
                </div>
                <div className="start__spec">
                  <div className="start__spec-row">
                    <span className="start__spec-k">阶段</span>
                    <span className="start__spec-v">{stageMeta.name}</span>
                  </div>
                  <div className="start__spec-row">
                    <span className="start__spec-k">今日新词</span>
                    <span className="start__spec-v">{allowedNew} 词</span>
                  </div>
                  <div className="start__spec-row">
                    <span className="start__spec-k">今日批次</span>
                    <span className="start__spec-v">
                      共 {todayBatchCount} 批 · 每批 {batchSize} 词
                    </span>
                  </div>
                  <div className="start__spec-row">
                    <span className="start__spec-k">已学</span>
                    <span className="start__spec-v">
                      {learnedCount} / {totalCount} 词
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
          )}
        </div>
      </main>
    </>
  );
}
