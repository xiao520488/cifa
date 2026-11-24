/**
 * 应用外壳（v1.1 统一学习流，见 REFACTOR_PLAN.md）。
 *
 * 学习入口只剩一个：首页大按钮「开始背单词」→ SessionScreen 统一流程
 * （复习优先 → 今日新词列表 → 即时复习穿插 → 总结页）。
 * 旧的「整本词库按批浏览」双轨已删——列表切分严格按今日发放额度走。
 * 首页所有数字都读调度引擎，和结算 JSON 说同一件事。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarScreen } from './components/CalendarScreen';
import { ImportSheet } from './components/ImportSheet';
import { MistakesScreen } from './components/MistakesScreen';
import { ConfirmDialog } from './components/Modal';
import { ProfileScreen } from './components/ProfileScreen';
import { SessionScreen } from './components/SessionScreen';
import { SkinSheet } from './components/SkinSheet';
import { StudyScreen } from './components/StudyScreen';
import { TodayCard } from './components/TodayCard';
import { useScheduler } from './hooks/useScheduler';
import { preloadBook } from './lib/books';
import { emptyStageProgress, loadStore, saveStore } from './lib/storage';
import type { LevelKey, Profile, Store, Word } from './lib/types';
import { skinMeta } from './lib/skins';
import { getBook, levelMeta, showAllMeanings } from './lib/words';

type Screen = 'study' | 'calendar' | 'me' | 'mistakes';
type SheetKind = 'import' | 'delete-custom' | 'skin' | null;

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [screen, setScreen] = useState<Screen>('study');
  /** 唯一学习入口：true = 统一 Session 在场 */
  const [session, setSession] = useState(false);
  const [sheet, setSheet] = useState<SheetKind>(null);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const stage = store.profile.stage;
  const book = getBook(stage, store.custom);
  const totalCount = book?.words.length ?? 0;
  const batchSize = store.profile.batchSize;
  const showAll = showAllMeanings(store.profile.meaningMode, stage);
  const stageMeta = levelMeta(stage);
  const initial = store.profile.name.trim().slice(0, 1) || '词';

  /* 学习调度：引擎实例常驻，每次变更走 run()（存盘 + 重渲染） */
  const scheduler = useScheduler(book);
  const todayView = useMemo(
    () => ({
      plan: scheduler.engine.plan(),
      allowance: scheduler.engine.allowance(),
      stats: scheduler.engine.stats(),
    }),
    // version 变化说明调度状态动过，必须重算；engine 是常驻实例
    [scheduler.engine, scheduler.version],
  );

  /* 首页数字全部来自调度：今日发放 / 今日批数 / 已学（不再读旧浏览进度）。
     注意 `stats.newCards` 是**未学池**数量（「我的」页语义），不是已学——
     已学 = 短期 + 长期 + 归档卡数。 */
  const allowedNew = todayView.plan.allowedNewWords;
  const todayBatchCount = Math.ceil(allowedNew / Math.max(1, batchSize));
  const learnedCount =
    todayView.stats.shortCards + todayView.stats.longCards + todayView.stats.archivedCards;

  /* 主题：跟随系统时监听系统变化 */
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        store.profile.theme === 'dark' || (store.profile.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = skinMeta(store.profile.skin);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? meta.darkBg : meta.swatch.bg);
    };
    apply();
    if (store.profile.theme !== 'system') return;
    media.addEventListener('change', apply);
    return () => media.removeEventListener('change', apply);
  }, [store.profile.theme, store.profile.skin]);

  /* 皮肤：四套排印系统，写在 <html data-skin>，CSS 按它切换 */
  useEffect(() => {
    document.documentElement.dataset.skin = store.profile.skin;
  }, [store.profile.skin]);

  const toggleMeaning = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      session: { ...prev.session, hideMeaning: !prev.session.hideMeaning },
    }));
  }, []);

  const toggleWord = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      session: { ...prev.session, hideWord: !prev.session.hideWord },
    }));
  }, []);

  const updateProfile = (patch: Partial<Profile>) => {
    setStore((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  };

  /**
   * 换阶段：内置词库是按需加载的，必须等书到齐再切——否则调度引擎会拿空词池
   * 重新 seed，把当天的「新词计划」结算成 0（见 NOTES 的坑）。
   * `stageRequest` 防连点：只认最后一次点选。Session 一律先退出（词池要换血）。
   */
  const stageRequest = useRef(0);
  const changeStage = (next: LevelKey) => {
    if (next === stage) return;
    setSession(false);
    const token = ++stageRequest.current;
    const apply = () => {
      if (stageRequest.current !== token) return;
      setStore((prev) => ({ ...prev, profile: { ...prev.profile, stage: next } }));
    };
    if (next === 'custom') {
      apply();
      return;
    }
    preloadBook(next)
      .then(apply)
      .catch(() => {
        /* 离线且没缓存：保持当前阶段，不加提示（不打断学习） */
      });
  };

  const changeBatchSize = (size: number) => {
    setStore((prev) => ({ ...prev, profile: { ...prev.profile, batchSize: size } }));
  };

  const importWords = (words: Word[]) => {
    setSession(false);
    setStore((prev) => ({
      ...prev,
      custom: { lvl: 'custom', label: '我的词库', words },
      profile: { ...prev.profile, stage: 'custom' },
      progress: { ...prev.progress, custom: emptyStageProgress() },
    }));
    setSheet(null);
  };

  const deleteCustom = () => {
    const nextStage = store.profile.stage === 'custom' ? 'cet4' : store.profile.stage;
    setSession(false);
    const commit = () => {
      setStore((prev) => {
        const progress = { ...prev.progress };
        delete progress.custom;
        return {
          ...prev,
          custom: null,
          progress,
          profile: { ...prev.profile, stage: prev.profile.stage === 'custom' ? nextStage : prev.profile.stage },
        };
      });
      setSheet(null);
    };
    preloadBook(nextStage)
      .then(commit)
      .catch(() => {
        /* 书没加载成功就先不删，避免落到空词库 */
      });
  };

  return (
    <div className="app">
      {session ? (
        <SessionScreen
          engine={scheduler.engine}
          book={book}
          initial={initial}
          batchSize={batchSize}
          showAll={showAll}
          hideMeaning={store.session.hideMeaning}
          hideWord={store.session.hideWord}
          run={scheduler.run}
          onExit={() => setSession(false)}
          onToggleMeaning={toggleMeaning}
          onToggleWord={toggleWord}
          onOpenCalendar={() => {
            setSession(false);
            setScreen('calendar');
          }}
          onOpenMe={() => {
            setSession(false);
            setScreen('me');
          }}
        />
      ) : screen === 'study' ? (
        <StudyScreen
          stageMeta={stageMeta}
          totalCount={totalCount}
          batchSize={batchSize}
          allowedNew={allowedNew}
          todayBatchCount={todayBatchCount}
          learnedCount={learnedCount}
          initial={initial}
          todayCard={
            <TodayCard
              plan={todayView.plan}
              stats={todayView.stats}
              onOpenCalendar={() => setScreen('calendar')}
              onOpenMistakes={() => setScreen('mistakes')}
            />
          }
          onStart={() => setSession(true)}
          onOpenMe={() => setScreen('me')}
          onOpenSkin={() => setSheet('skin')}
          onOpenCalendar={() => setScreen('calendar')}
          onImport={() => setSheet('import')}
        />
      ) : screen === 'calendar' ? (
        <CalendarScreen
          engine={scheduler.engine}
          version={scheduler.version}
          initial={initial}
          onBack={() => setScreen('study')}
          onOpenMe={() => setScreen('me')}
          onOpenSkin={() => setSheet('skin')}
          onStartSession={() => setSession(true)}
        />
      ) : screen === 'mistakes' ? (
        <MistakesScreen
          engine={scheduler.engine}
          version={scheduler.version}
          book={book}
          initial={initial}
          run={scheduler.run}
          onBack={() => setScreen('study')}
          onOpenMe={() => setScreen('me')}
        />
      ) : (
        <ProfileScreen
          store={store}
          book={book}
          learnedCount={learnedCount}
          schedulerStats={todayView.stats}
          allowance={todayView.allowance}
          onUserDailyGoal={(goal) => scheduler.run((engine) => engine.setUserDailyGoal(goal))}
          onMaxLimit={(limit) => scheduler.run((engine) => engine.setMaxLimit(limit))}
          onDefaultMeaning={(hide) =>
            setStore((prev) => ({ ...prev, session: { ...prev.session, hideMeaning: hide } }))
          }
          onBack={() => setScreen('study')}
          onUpdateProfile={updateProfile}
          onStage={changeStage}
          onBatchSize={changeBatchSize}
          onOpenImport={() => setSheet('import')}
          onDeleteCustom={() => setSheet('delete-custom')}
          onOpenSkin={() => setSheet('skin')}
          onOpenCalendar={() => setScreen('calendar')}
          onOpenMistakes={() => setScreen('mistakes')}
        />
      )}

      {sheet === 'import' ? (
        <ImportSheet onClose={() => setSheet(null)} onImport={importWords} />
      ) : null}

      {sheet === 'skin' ? (
        <SkinSheet
          skin={store.profile.skin}
          theme={store.profile.theme}
          onSkin={(skin) => updateProfile({ skin })}
          onTheme={(theme) => updateProfile({ theme })}
          onClose={() => setSheet(null)}
        />
      ) : null}

      {sheet === 'delete-custom' ? (
        <ConfirmDialog
          title="删除我的词库？"
          text="导入的词表和它在自定义阶段的进度会被删除，内置词库不受影响。这个操作不能撤销。"
          confirmLabel="删除词库"
          onConfirm={deleteCustom}
          onCancel={() => setSheet(null)}
        />
      ) : null}
    </div>
  );
}
