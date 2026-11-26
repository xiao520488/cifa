/**
 * 调度引擎的 React 外壳。
 *
 * 引擎本身是纯 TS、不依赖 React（见 SCHEDULER_SPEC §12），这一层只做四件事：
 * 1. 启动：`loadScheduler()` → `seed(当前词库)` → `startOfSession()`（每次启动都结算，幂等）；
 * 2. 变更：`run(fn)` 跑完落盘并重渲染；
 * 3. 落盘：400ms 防抖 + `pagehide` 强制 flush（5000 词状态 2MB+，每答一词就 stringify 会卡）；
 * 4. 跨天：`visibilitychange` / `focus` / 每 60 秒一次，发现学习日变了就再走一次 `startOfSession()`。
 *
 * 界面**不要**直接改 `engine.state`，一律通过 `run()`，否则存盘与重渲染都会漏。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Scheduler, loadScheduler, saveScheduler } from '../lib/scheduler';
import type { SessionStart } from '../lib/scheduler';
import { clearImporting, isImporting } from '../lib/backup';
import { deckSignature, deckWords } from '../lib/deck';
import type { Wordbook } from '../lib/types';

/** 存盘防抖：答题很密，每个词都 stringify 一次整份状态会明显掉帧。 */
const SAVE_DELAY = 400;
/** 跨天兜底检查（真正准的是 visibilitychange，这里只防「页面一直开着」）。 */
const CLOCK_CHECK = 60_000;

export interface SchedulerHandle {
  engine: Scheduler;
  /** 每次 `run()` 自增，页面用它做 useMemo 依赖 */
  version: number;
  /** 本次启动的结算报告（断签补结算 / 昨天结算） */
  session: SessionStart | null;
  /** 执行一次状态变更：存盘 + 重渲染 */
  run: <T>(fn: (engine: Scheduler) => T) => T;
  /** 只是重算视图（不改状态） */
  refresh: () => void;
}

export function useScheduler(book: Wordbook | null): SchedulerHandle {
  const signature = deckSignature(book);

  /**
   * 启动只跑一次：读盘 → 灌词池 → 结算（幂等）。
   * 放在 useMemo 里而不是 render 里裸跑，是为了不给 StrictMode 造出两套引擎。
   */
  const boot = useMemo(() => {
    const engine = new Scheduler(loadScheduler());
    engine.seed(deckWords(book));
    const start = engine.startOfSession();
    saveScheduler(engine.state);
    // 上一页刚做完导入：这次启动读到的是导入后的数据，落盘无害；把闸门标记清掉
    clearImporting();
    return { engine, start };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const engineRef = useRef<Scheduler>(boot.engine);
  const [version, setVersion] = useState(0);
  const [session, setSession] = useState<SessionStart | null>(boot.start);
  const saveTimer = useRef<number | null>(null);
  const seededSignature = useRef<string | null>(signature);
  const dayRef = useRef<string>(boot.start.today);

  /* ---------------------------------------------------------------- 落盘 */

  const flush = useCallback(() => {
    // 导入后正在刷新：内存里还是旧状态，别把刚写进去的备份盖回去
    if (isImporting()) return;
    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    saveScheduler(engineRef.current.state);
  }, []);

  const scheduleSave = useCallback(() => {
    if (isImporting()) return;
    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;
      if (isImporting()) return;
      saveScheduler(engineRef.current.state);
    }, SAVE_DELAY);
  }, []);

  const run = useCallback(
    <T,>(fn: (engine: Scheduler) => T): T => {
      const result = fn(engineRef.current);
      scheduleSave();
      setVersion((value) => value + 1);
      return result;
    },
    [scheduleSave],
  );

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  /* ---------------------------------------------------------------- 换词库 */

  useEffect(() => {
    if (seededSignature.current === signature) return;
    seededSignature.current = signature;
    run((engine) => engine.seed(deckWords(book)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  /* ---------------------------------------------------------------- 跨天 / 落盘兜底 */

  useEffect(() => {
    const rollOver = () => {
      const engine = engineRef.current;
      const today = engine.today();
      if (today === dayRef.current) return;
      dayRef.current = today;
      setSession(engine.startOfSession());
      flush();
      setVersion((value) => value + 1);
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') rollOver();
    };
    const timer = window.setInterval(rollOver, CLOCK_CHECK);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('pagehide', flush);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('pagehide', flush);
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [flush]);

  return { engine: engineRef.current, version, session, run, refresh };
}
