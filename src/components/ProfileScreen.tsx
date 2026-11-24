import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { LevelKey, Profile, Store, Wordbook } from '../lib/types';
import type { NewWordAllowance, SchedulerStats } from '../lib/scheduler';
import { explainMaxLimitChange, MAX_LIMIT_EXPLAIN_BODY, MAX_LIMIT_EXPLAIN_TITLE } from '../lib/scheduler';
import { bookCount, bookStats, LEVELS, levelMeta, showAllMeanings } from '../lib/words';
import { IconBack } from './Icons';
import { Segmented } from './Segmented';
import { SkinPicker } from './SkinPicker';

/**
 * 「每日新词上限」旁边的小问号。
 *
 * 点开是一个贴着问号的气泡：外部点击 / Esc 关闭，按钮带 `aria-expanded` 与 `aria-controls`。
 * 文案在 `copy.ts` 里（`MAX_LIMIT_EXPLAIN_*`），设置页只负责摆位置。
 */
function LimitHint() {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const open = pos !== null;

  const close = () => setPos(null);

  const toggle = () => {
    if (pos) {
      close();
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 贴着问号往下展开，但左右/上下都夹在视口里（360 宽时 300px 会正好顶到边）
    const margin = 16;
    const width = Math.min(300, window.innerWidth - margin * 2);
    const left = Math.min(Math.max(margin, rect.left - 12), window.innerWidth - width - margin);
    setPos({ top: rect.bottom + 8, left, width });
  };

  /* 展开后再量一次高度：底部不够就翻到问号上方 */
  useLayoutEffect(() => {
    if (!pos || !popRef.current || !btnRef.current) return;
    const height = popRef.current.offsetHeight;
    const rect = btnRef.current.getBoundingClientRect();
    const overflow = pos.top + height > window.innerHeight - 12;
    if (overflow && rect.top - height - 8 >= 12) {
      setPos({ ...pos, top: rect.top - height - 8 });
    }
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || popRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // 固定定位的气泡会跟着页面滚动跑偏，滚一下就收起
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="hint">
      <button
        ref={btnRef}
        type="button"
        className="hint__btn"
        aria-expanded={open}
        aria-controls="max-limit-hint"
        aria-label="为什么要设置新词上限"
        onClick={toggle}
      >
        ?
      </button>
      {pos ? (
        <div
          ref={popRef}
          className="hint__pop"
          id="max-limit-hint"
          role="dialog"
          aria-label={MAX_LIMIT_EXPLAIN_TITLE}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <p className="hint__title">{MAX_LIMIT_EXPLAIN_TITLE}</p>
          {MAX_LIMIT_EXPLAIN_BODY.map((paragraph) => (
            <p key={paragraph} className="hint__text">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface ProfileScreenProps {
  store: Store;
  book: Wordbook | null;
  seenCount: number;
  schedulerStats: SchedulerStats;
  allowance: NewWordAllowance;
  onBack: () => void;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onStage: (stage: LevelKey) => void;
  onBatchSize: (size: number) => void;
  onOpenImport: () => void;
  onOpenReset: () => void;
  onDeleteCustom: () => void;
  onOpenSkin: () => void;
  onOpenCalendar: () => void;
  onOpenMistakes: () => void;
  onUserDailyGoal: (goal: number) => void;
  onMaxLimit: (limit: number) => void;
  onDefaultMeaning: (hide: boolean) => void;
}

const BATCH_OPTIONS = [5, 8, 10, 15, 20].map((value) => ({ value, label: String(value) }));

export function ProfileScreen({
  store,
  book,
  seenCount,
  schedulerStats,
  allowance,
  onBack,
  onUpdateProfile,
  onStage,
  onBatchSize,
  onOpenImport,
  onOpenReset,
  onDeleteCustom,
  onOpenSkin,
  onOpenCalendar,
  onOpenMistakes,
  onUserDailyGoal,
  onMaxLimit,
  onDefaultMeaning,
}: ProfileScreenProps) {
  const { profile, custom } = store;
  const meta = levelMeta(profile.stage);
  const total = book?.words.length ?? 0;
  const stats = useMemo(() => bookStats(book), [book]);
  const initial = profile.name.trim().slice(0, 1) || '词';
  const showAll = showAllMeanings(profile.meaningMode, profile.stage);
  const progressPercent = total > 0 ? Math.min(100, (seenCount / total) * 100) : 0;

  const stageWords = (key: LevelKey): number => bookCount(key, custom);

  return (
    <>
      <header className="topbar topbar--bordered">
        <button type="button" className="icon-btn" onClick={onBack} aria-label="返回背单词">
          <IconBack size={22} />
        </button>
        <h1 className="topbar__title">我的</h1>
        <span className="topbar__spacer" />
      </header>

      <main className="app__main">
        <div className="screen">
          <section className="profile">
            <div className="avatar" aria-hidden="true">
              {initial}
            </div>
            <div className="profile__body">
              <label className="sr-only" htmlFor="profile-name">
                昵称
              </label>
              <input
                id="profile-name"
                className="profile__name"
                value={profile.name}
                maxLength={12}
                placeholder="给自己起个名字"
                onChange={(event) => onUpdateProfile({ name: event.target.value })}
                autoComplete="off"
              />
              <p className="profile__meta">
                {meta.name} · 已学 {seenCount} / {total} 词
              </p>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">学习阶段</h2>
            </div>
            <div className="stage-grid">
              {LEVELS.map((level) => {
                const count = stageWords(level.key);
                const disabled = level.key === 'custom' && !custom;
                return (
                  <button
                    key={level.key}
                    type="button"
                    className={
                      level.key === 'custom' ? 'stage-option stage-option--wide' : 'stage-option'
                    }
                    aria-pressed={profile.stage === level.key}
                    disabled={disabled}
                    onClick={() => onStage(level.key)}
                  >
                    <span className="stage-option__short">
                      {level.short}
                      <span className="stage-option__count">{count} 词</span>
                    </span>
                    <span className="stage-option__desc">{level.desc}</span>
                  </button>
                );
              })}
            </div>
            <p className="section__hint">切换阶段会保留各自的进度。自定义词库需要先在下方导入。</p>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">每批单词数</h2>
            </div>
            <Segmented
              label="每批单词数"
              options={BATCH_OPTIONS}
              value={profile.batchSize}
              onChange={onBatchSize}
            />
            <p className="section__hint">一屏放不下时直接下滑，底部控制区不会挡住最后一行。</p>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">释义详略</h2>
            </div>
            <Segmented
              label="释义详略"
              options={[
                { value: 'auto', label: '自动' },
                { value: 'main', label: '主要义' },
                { value: 'all', label: '更多义' },
              ]}
              value={profile.meaningMode}
              onChange={(value) => onUpdateProfile({ meaningMode: value })}
            />
            <p className="section__hint">
              自动：高中只显示核心释义，四级、六级与考研展开更多义项。当前
              {showAll ? '显示全部义项' : '只显示主要释义'}。
            </p>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">外观风格</h2>
              <button type="button" className="btn btn--text btn--compact" onClick={onOpenSkin}>
                快速切换
              </button>
            </div>
            <SkinPicker
              value={profile.skin}
              onChange={(skin) => onUpdateProfile({ skin })}
            />
            <p className="section__hint">
              四套排印系统，各自有浅色与深色两档；切换不影响词库、进度和设置。
            </p>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">明暗</h2>
            </div>
            <Segmented
              label="明暗"
              options={[
                { value: 'system', label: '跟随系统' },
                { value: 'light', label: '浅色' },
                { value: 'dark', label: '深色' },
              ]}
              value={profile.theme}
              onChange={(value) => onUpdateProfile({ theme: value })}
            />
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">词库</h2>
              <span className="section__hint section__hint--inline">
                {meta.name} · {total} 词
              </span>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">导入词表</div>
                <div className="setting-row__value">CSV 或粘贴文本，一行一个词</div>
              </div>
              <button type="button" className="btn btn--secondary btn--compact" onClick={onOpenImport}>
                导入
              </button>
            </div>
            {custom ? (
              <div className="setting-row">
                <div>
                  <div className="setting-row__label">我的词库</div>
                  <div className="setting-row__value">{custom.words.length} 个词 · 导入后不会被内置词库覆盖</div>
                </div>
                <button type="button" className="btn btn--text btn--danger-text" onClick={onDeleteCustom}>
                  删除
                </button>
              </div>
            ) : null}
            <div className="setting-row">
              <div>
                <div className="setting-row__label">词库数据</div>
                <div className="setting-row__value">
                  {book?.source
                    ? `${book.source} · 音标 ${stats.phoneticPercent}% · 词频 ${stats.rankPercent}%`
                    : '自定义导入的词表，没有词频与考试标签'}
                </div>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">每日新词</h2>
            </div>
            <div className="stat">
              <span className="stat__num">{schedulerStats.currentLimit}</span>
              <span className="stat__unit">个 · 当前基线（今天计划 {allowance.planned}）</span>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">每日新词目标</div>
                <div className="setting-row__value">你希望每天学多少；实际数量由自适应规则决定</div>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper__btn"
                  aria-label="减少每日新词目标"
                  disabled={schedulerStats.userDailyGoal <= 5}
                  onClick={() => onUserDailyGoal(schedulerStats.userDailyGoal - 5)}
                >
                  −
                </button>
                <span className="stepper__value">{schedulerStats.userDailyGoal}</span>
                <button
                  type="button"
                  className="stepper__btn"
                  aria-label="增加每日新词目标"
                  onClick={() => onUserDailyGoal(schedulerStats.userDailyGoal + 5)}
                >
                  +
                </button>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">
                  每日新词上限
                  <LimitHint />
                </div>
                <div className="setting-row__value">
                  默认比目标高 5；只截断今天给多少，不改基线；设成 0 就是暂停新词
                </div>
              </div>
              <div className="stepper">
                <button
                  type="button"
                  className="stepper__btn"
                  aria-label="减少每日新词上限"
                  disabled={schedulerStats.maxLimit <= 0}
                  onClick={() => onMaxLimit(schedulerStats.maxLimit - 5)}
                >
                  −
                </button>
                <span className="stepper__value">{schedulerStats.maxLimit}</span>
                <button
                  type="button"
                  className="stepper__btn"
                  aria-label="增加每日新词上限"
                  onClick={() => onMaxLimit(schedulerStats.maxLimit + 5)}
                >
                  +
                </button>
              </div>
            </div>
            {(() => {
              const note = explainMaxLimitChange(schedulerStats.maxLimit, schedulerStats.currentLimit);
              return note ? <p className="section__hint">{note}</p> : null;
            })()}
            <div className="setting-row">
              <div>
                <div className="setting-row__label">默认显示中文</div>
                <div className="setting-row__value">背单词页一开始是否直接给释义</div>
              </div>
              <Segmented
                value={store.session.hideMeaning ? 'hide' : 'show'}
                options={[
                  { value: 'show', label: '显示' },
                  { value: 'hide', label: '遮蔽' },
                ]}
                onChange={(value) => onDefaultMeaning(value === 'hide')}
                label="默认显示中文"
              />
            </div>
          </section>

          <section className="section">
            <div className="section__head">
              <h2 className="section__title">学习进度</h2>
            </div>
            <div className="stat">
              <span className="stat__num">{seenCount}</span>
              <span className="stat__unit">/ {total} 个词已看过</span>
            </div>
            <div className="progress-track" aria-hidden="true">
              <span className="progress-track__bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">学习日历</div>
                <div className="setting-row__value">今日新词量、到期批次、逾期池与未来 7 天</div>
              </div>
              <button type="button" className="btn btn--text" onClick={onOpenCalendar}>
                打开
              </button>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">错词本</div>
                <div className="setting-row__value">
                  {schedulerStats.mistakes > 0
                    ? `${schedulerStats.mistakes} 个词待清，可逐条单测移出`
                    : '还没有错词，保持住'}
                </div>
              </div>
              <button type="button" className="btn btn--text" onClick={onOpenMistakes}>
                {schedulerStats.mistakes > 0 ? `打开 ${schedulerStats.mistakes}` : '打开'}
              </button>
            </div>
            <div className="setting-row">
              <div>
                <div className="setting-row__label">重置学习进度</div>
                <div className="setting-row__value">只清空已学和批次位置，词库与设置保留</div>
              </div>
              <button type="button" className="btn btn--text btn--danger-text" onClick={onOpenReset}>
                重置
              </button>
            </div>
          </section>

          <p className="section__hint">
            词笺 v0.1 · 离线可用 · 数据只存在这台设备，不上传任何服务器。桌面端可用 ← → 翻批、空格切换中文。
          </p>
        </div>
      </main>
    </>
  );
}
