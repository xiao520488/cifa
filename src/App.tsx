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
import {
  emptyStageProgress,
  getStageProgress,
  loadStore,
  saveStore,
  todayKey,
} from './lib/storage';
import type { LevelKey, Profile, Store, Word } from './lib/types';
import { skinMeta } from './lib/skins';
import { chunk, getBook, levelMeta, showAllMeanings } from './lib/words';

type Screen = 'study' | 'calendar' | 'me' | 'mistakes';
type SheetKind = 'import' | 'reset' | 'delete-custom' | 'skin' | null;

export default function App() {
  const [store, setStore] = useState<Store>(loadStore);
  const [screen, setScreen] = useState<Screen>('study');
  const [session, setSession] = useState<'review' | 'newword' | null>(null);
  const [studying, setStudying] = useState(false);
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set());
  const [sheet, setSheet] = useState<SheetKind>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const stage = store.profile.stage;
  const book = getBook(stage, store.custom);
  const totalCount = book?.words.length ?? 0;
  const batches = useMemo(
    () => (book ? chunk(book.words, store.profile.batchSize) : []),
    [book, store.profile.batchSize],
  );
  const batchCount = batches.length;
  const storedBatchIndex = store.progress[stage]?.batchIndex ?? 0;
  const batchIndex = Math.min(storedBatchIndex, Math.max(0, batchCount - 1));
  const batch = batches[batchIndex] ?? [];
  const seenCount = store.progress[stage]?.seen.length ?? 0;
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

  /* 进入一批就记下「看过」 */
  useEffect(() => {
    if (!studying || batch.length === 0) return;
    const start = batchIndex * store.profile.batchSize;
    const indices = batch.map((_, offset) => start + offset);
    setStore((prev) => {
      const current = prev.progress[stage] ?? emptyStageProgress();
      const seen = new Set(current.seen);
      const before = seen.size;
      indices.forEach((index) => seen.add(index));
      if (seen.size === before) return prev;
      return {
        ...prev,
        progress: { ...prev.progress, [stage]: { ...current, seen: [...seen], day: todayKey() } },
      };
    });
  }, [studying, batch, batchIndex, stage, store.profile.batchSize]);

  /* 换批 / 进出学习态时回到顶部 */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [batchIndex, studying, screen, stage]);

  const goTo = useCallback(
    (next: number) => {
      const target = Math.max(0, Math.min(next, batchCount - 1));
      setStore((prev) => {
        const current = getStageProgress(prev, stage);
        if (current.batchIndex === target) return prev;
        return {
          ...prev,
          progress: { ...prev.progress, [stage]: { ...current, batchIndex: target } },
        };
      });
      setRevealed(new Set());
    },
    [batchCount, stage],
  );

  const toggleMeaning = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      session: { ...prev.session, hideMeaning: !prev.session.hideMeaning },
    }));
    setRevealed(new Set());
  }, []);

  const toggleWord = useCallback(() => {
    setStore((prev) => ({
      ...prev,
      session: { ...prev.session, hideWord: !prev.session.hideWord },
    }));
    setRevealed(new Set());
  }, []);

  /* 键盘：← / → 翻批，空格切换中文 */
  useEffect(() => {
    if (!studying) return;
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
        goTo(batchIndex - 1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(batchIndex + 1);
      } else if (event.key === ' ') {
        event.preventDefault();
        toggleMeaning();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [studying, batchIndex, goTo, toggleMeaning]);

  const handleStart = () => {
    setStudying(true);
    setRevealed(new Set());
  };

  const handleExit = () => {
    setStudying(false);
    setRevealed(new Set());
  };

  const updateProfile = (patch: Partial<Profile>) => {
    setStore((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  };

  /**
   * 换阶段：内置词库是按需加载的，必须等书到齐再切——否则调度引擎会拿空词池
   * 重新 seed，把当天的「新词计划」结算成 0（见 NOTES 的坑）。
   * `requestRef` 防连点：只认最后一次点选。
   */
  const stageRequest = useRef(0);
  const changeStage = (next: LevelKey) => {
    if (next === stage) return;
    const token = ++stageRequest.current;
    const apply = () => {
      if (stageRequest.current !== token) return;
      setStore((prev) => ({ ...prev, profile: { ...prev.profile, stage: next } }));
      setStudying(false);
      setRevealed(new Set());
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
    setStore((prev) => {
      const current = getStageProgress(prev, prev.profile.stage);
      const firstWord = current.batchIndex * prev.profile.batchSize;
      return {
        ...prev,
        profile: { ...prev.profile, batchSize: size },
        progress: {
          ...prev.progress,
          [prev.profile.stage]: { ...current, batchIndex: Math.max(0, Math.floor(firstWord / size)) },
        },
      };
    });
    setRevealed(new Set());
  };

  const importWords = (words: Word[]) => {
    setStore((prev) => ({
      ...prev,
      custom: { lvl: 'custom', label: '我的词库', words },
      profile: { ...prev.profile, stage: 'custom' },
      progress: { ...prev.progress, custom: emptyStageProgress() },
    }));
    setStudying(false);
    setRevealed(new Set());
    setSheet(null);
  };

  const resetProgress = () => {
    setStore((prev) => ({ ...prev, progress: {} }));
    setStudying(false);
    setRevealed(new Set());
    setSheet(null);
  };

  const deleteCustom = () => {
    const nextStage = store.profile.stage === 'custom' ? 'cet4' : store.profile.stage;
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
      setStudying(false);
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
          startMode={session}
          run={scheduler.run}
          onExit={() => setSession(null)}
          onOpenCalendar={() => {
            setSession(null);
            setScreen('calendar');
          }}
          onOpenMe={() => {
            setSession(null);
            setScreen('me');
          }}
        />
      ) : screen === 'study' ? (
        <StudyScreen
          stageMeta={stageMeta}
          batch={batch}
          batchIndex={batchIndex}
          batchCount={batchCount}
          batchSize={store.profile.batchSize}
          totalCount={totalCount}
          seenCount={seenCount}
          initial={initial}
          studying={studying}
          hideMeaning={store.session.hideMeaning}
          hideWord={store.session.hideWord}
          showAll={showAll}
          revealed={revealed}
          scrollRef={scrollRef}
          todayCard={
            <TodayCard
              plan={todayView.plan}
              stats={todayView.stats}
              onOpenCalendar={() => setScreen('calendar')}
              onOpenMistakes={() => setScreen('mistakes')}
              onStartReview={() => setSession('review')}
              onStartNewWords={() => setSession('newword')}
            />
          }
          onStart={handleStart}
          onExit={handleExit}
          onOpenMe={() => setScreen('me')}
          onOpenSkin={() => setSheet('skin')}
          onOpenCalendar={() => setScreen('calendar')}
          onToggleMeaning={toggleMeaning}
          onToggleWord={toggleWord}
          onPrev={() => goTo(batchIndex - 1)}
          onNext={() => goTo(batchIndex + 1)}
          onReveal={(index) =>
            setRevealed((prev) => {
              const next = new Set(prev);
              next.add(index);
              return next;
            })
          }
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
          onStartReview={() => setSession('review')}
          onStartNewWords={() => setSession('newword')}
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
          seenCount={seenCount}
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
          onOpenReset={() => setSheet('reset')}
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

      {sheet === 'reset' ? (
        <ConfirmDialog
          title="重置学习进度？"
          text="所有阶段「已学」记录和批次位置会清空，个人资料、设置和自定义词库都会保留。这个操作不能撤销。"
          confirmLabel="重置进度"
          onConfirm={resetProgress}
          onCancel={() => setSheet(null)}
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
