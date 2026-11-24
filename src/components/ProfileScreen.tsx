import { useMemo } from 'react';
import type { LevelKey, Profile, Store, Wordbook } from '../lib/types';
import type { NewWordAllowance, SchedulerStats } from '../lib/scheduler';
import { explainMaxLimitChange, MAX_LIMIT_EXPLAIN_BODY, MAX_LIMIT_EXPLAIN_TITLE } from '../lib/scheduler';
import { bookCount, bookStats, LEVELS, levelMeta, showAllMeanings } from '../lib/words';
import { Hint } from './Hint';
import { IconBack } from './Icons';
import { Segmented } from './Segmented';
import { SkinPicker } from './SkinPicker';

interface ProfileScreenProps {
  store: Store;
  book: Wordbook | null;
  /** 已学 = 调度卡库总数（v1.1 起不再读旧浏览进度） */
  learnedCount: number;
  schedulerStats: SchedulerStats;
  allowance: NewWordAllowance;
  onBack: () => void;
  onUpdateProfile: (patch: Partial<Profile>) => void;
  onStage: (stage: LevelKey) => void;
  onBatchSize: (size: number) => void;
  onOpenImport: () => void;
  /** 危险操作：清空所有学习数据（引擎重置），二次确认在 App 的 ConfirmDialog */
  onOpenResetEngine: () => void;
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
  learnedCount,
  schedulerStats,
  allowance,
  onBack,
  onUpdateProfile,
  onStage,
  onBatchSize,
  onOpenImport,
  onOpenResetEngine,
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
  const progressPercent = total > 0 ? Math.min(100, (learnedCount / total) * 100) : 0;

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
                {meta.name} · 已学 {learnedCount} / {total} 词
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
            <p className="section__hint">
              今日发放的新词按这个数切批，看完两批会弹一次即时复习。一屏放不下时直接下滑，底部控制区不会挡住最后一行。
            </p>
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
                  <Hint
                    id="max-limit-hint"
                    label="为什么要设置新词上限"
                    title={MAX_LIMIT_EXPLAIN_TITLE}
                    body={MAX_LIMIT_EXPLAIN_BODY}
                  />
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
              <span className="stat__num">{learnedCount}</span>
              <span className="stat__unit">/ {total} 个词已入库</span>
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
          </section>

          <section className="section section--danger-zone">
            <div className="setting-row">
              <div>
                <div className="setting-row__label">清空所有学习数据</div>
                <div className="setting-row__value">
                  已学卡片、复习队列、错词本与统计全部归零，像新用户第一次打开；词库与设置保留
                </div>
              </div>
              <button type="button" className="btn btn--danger-text" onClick={onOpenResetEngine}>
                清空
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
