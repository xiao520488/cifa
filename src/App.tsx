/**
 * 应用外壳（v1.1 统一学习流，见 REFACTOR_PLAN.md）。
 *
 * 学习入口只剩一个：首页大按钮「开始背单词」→ SessionScreen 统一流程
 * （复习优先 → 今日新词列表 → 即时复习穿插 → 总结页）。
 * 旧的「整本词库按批浏览」双轨已删——列表切分严格按今日发放额度走。
 * 首页所有数字都读调度引擎，和结算 JSON 说同一件事。
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CalendarScreen } from './components/CalendarScreen';
import { ImportSheet } from './components/ImportSheet';
import { MistakesScreen } from './components/MistakesScreen';
import { ConfirmDialog } from './components/Modal';
import { ProfileScreen } from './components/ProfileScreen';
import { buildReadoutItems, Readouts } from './components/Readouts';
import { SessionScreen } from './components/SessionScreen';
import { SkinSheet } from './components/SkinSheet';
import { StudyScreen } from './components/StudyScreen';
import { TodayCard } from './components/TodayCard';
import { useScheduler } from './hooks/useScheduler';
import { preloadBook } from './lib/books';
import { deckWords } from './lib/deck';
import { startThemeTransition } from './lib/motion';
import { syncNativeChrome } from './lib/native';
import { emptyStageProgress, loadStore, saveStore } from './lib/storage';
import type { LevelKey, Profile, Store, Word } from './lib/types';
import { persistentReadoutsFor, skinMeta } from './lib/skins';
import { getBook, levelMeta, showAllMeanings } from './lib/words';

type Screen = 'study' | 'calendar' | 'me' | 'mistakes';
type SheetKind = 'import' | 'delete-custom' | 'reset-engine' | 'skin' | null;

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

  /* 读数带三值在 App 顶层算一次，首页 / 常驻带共用同一个数组引用派生结果：
     同一屏不可能出现「今日 20 / 今日 21」这种自相矛盾。 */
  const readoutItems = useMemo(
    () => buildReadoutItems(allowedNew, todayBatchCount, learnedCount),
    [allowedNew, todayBatchCount, learnedCount],
  );

  /* 常驻读数带只在 desk / vinyl 的日历与「我的」进 DOM（SkinMeta.persistentReadouts）。
     判「节点在不在」而不是「显不显示」：false 的皮肤压根不渲染，审计按 querySelector 为 null 断言。
     学习中（session）不带——即时复习的 dock 已经占住底部，两条带叠放会互压。 */
  const showBand =
    persistentReadoutsFor(store.profile.skin) &&
    !session &&
    (screen === 'calendar' || screen === 'me');

  /**
   * 主题 + 皮肤：两者都写在 `<html>` 上（`data-theme` / `data-skin`），CSS 按它们切换。
   * 合并成一个 effect 的原因：切皮肤时 theme-color meta 也要跟着换，拆成两个会重复写 DOM；
   * 而且「切的那一下」必须挂**一次**颜色过渡（docs/MOTION_SPEC.md §13.4）。
   *
   * 首轮不挂过渡：开 App 不该先演一遍 200ms 的颜色渐变（与「首帧不播转场」同一条原则）。
   * 用「上一次的 key」而不是布尔量判断，是为了扛住 StrictMode 开发模式下挂载时 effect 跑两遍
   * —— 布尔量会被第二遍翻成「不是首轮」，于是冷启动照样渐变一次。
   */
  const appliedColorKey = useRef<string | null>(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark =
        store.profile.theme === 'dark' || (store.profile.theme === 'system' && media.matches);
      document.documentElement.dataset.theme = dark ? 'dark' : 'light';
      const meta = skinMeta(store.profile.skin);
      const bg = dark ? meta.darkBg : meta.swatch.bg;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg);
      /* 同一条颜色也交给安卓壳：WebView 不认 theme-color meta，状态栏只能原生设色
         （src/lib/native.ts 里有完整原因）。浏览器里是空操作。 */
      syncNativeChrome(bg);
    };

    const key = `${store.profile.theme}/${store.profile.skin}`;
    const isSwitch = appliedColorKey.current !== null && appliedColorKey.current !== key;
    appliedColorKey.current = key;
    if (isSwitch) startThemeTransition(); // 必须在写 dataset 之前：类要先落到「旧颜色」上

    document.documentElement.dataset.skin = store.profile.skin;
    apply();

    if (store.profile.theme !== 'system') return;
    const onSystemChange = () => {
      startThemeTransition();
      apply();
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, [store.profile.theme, store.profile.skin]);

  /**
   * v2 页面转场（docs/MOTION_SPEC.md §13.3）：`screen` 变化时给 .app 挂一次性类，
   * 让新屏的 topbar / 读数带 / 主区跑 `screen-in`（淡入 + 上移 8px，350ms）。
   *
   * 三条不能改的细节：
   * 1. 必须是 useLayoutEffect —— useEffect 在 paint 之后才跑，用户会先看到一帧终态
   *    再跳回 8px，比不做动画还难看；
   * 2. 首帧不挂：冷启动不该先演一遍转场（与「切主题首轮不触发」同一条原则）；
   * 3. 380ms 后摘类（350 + 30 缓冲）—— 否则在转场窗口内点「开始背单词」，
   *    学习流首屏会继承一次淡入。`session` 变化本身不挂这个类（§13.3 明确不做）。
   */
  const appRef = useRef<HTMLDivElement | null>(null);
  /* 上一次播过转场的屏。初值就是初始屏 → 首帧不动画；同时天然吃掉 StrictMode
     开发模式下「挂载时 effect 跑两遍」的第二次调用（否则冷启动会演一遍转场）。 */
  const lastAnimated = useRef<Screen>('study');
  useLayoutEffect(() => {
    const el = appRef.current;
    if (!el) return;
    if (lastAnimated.current === screen) return;
    lastAnimated.current = screen;
    el.classList.add('is-screen-entering');
    const timer = window.setTimeout(() => el.classList.remove('is-screen-entering'), 380);
    return () => {
      window.clearTimeout(timer);
      el.classList.remove('is-screen-entering');
    };
  }, [screen]);

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

  /**
   * 清空所有学习数据（引擎重置）：卡片 / 复习队列 / 错词本 / 历史 / 结算全部归零，
   * 词库、阶段、每日目标、上限这些设置保留（见 engine.resetLearning 的注释）。
   * 重置完必须重新 seed 当前词库，否则今天没有新词可发。
   */
  const resetEngine = () => {
    setSession(false);
    scheduler.run((engine) => {
      engine.resetLearning();
      engine.seed(deckWords(book));
    });
    setSheet(null);
  };

  return (
    <div className="app" ref={appRef}>
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
          readoutItems={readoutItems}
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
          onOpenResetEngine={() => setSheet('reset-engine')}
          onDeleteCustom={() => setSheet('delete-custom')}
          onOpenSkin={() => setSheet('skin')}
          onOpenCalendar={() => setScreen('calendar')}
          onOpenMistakes={() => setScreen('mistakes')}
        />
      )}

      {/* 常驻读数带：插在布局层（.app 的直接子级、各屏之后、浮层之前），
          于是 CalendarScreen / ProfileScreen 两个文件零改动。它是滚动容器的兄弟，
          按 vinyl 自己的吸底定式（.app flex 列最后一个非滚动子元素）天然贴底，不写 fixed。 */}
      {showBand ? (
        <Readouts screen={screen === 'calendar' ? 'cal' : 'me'} items={readoutItems} />
      ) : null}

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

      {sheet === 'reset-engine' ? (
        <ConfirmDialog
          title="清空所有学习数据？"
          text="所有已学的卡片、复习队列、逾期、错词本和学习统计都会被删除，进度彻底归零，像新用户第一次打开。词库、阶段、每日目标与上限会保留。这个操作不能撤销。"
          confirmLabel="确认清空"
          onConfirm={resetEngine}
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
