/**
 * 读数数字滚动（docs/MOTION_SPEC.md §13.5，D6-A / D7-A）。
 *
 * 三条硬要求，改之前先读：
 * 1. **宽度不靠 min-width: Nch**：::before 用当前字体渲染 digits 个 0（visibility:hidden）把盒宽定死，
 *    真正的数字绝对定位盖在上面。ch 只在「等宽数字 + 无字距 + 有 tnum」时才准；8 套皮肤里有加
 *    letter-spacing 的、有比例数字的，用 ch 一定偏小，999→1000 那一帧照样把布局撑开。
 * 2. **同 key 共享一个时钟**：同一屏同一数字有多个宿主（首页「已学」在读数带、.start__meta、
 *    .start__spec 各有一份）。每个宿主各自起一条 rAF 会差 1–2ms，数值大时（0→100 用 250ms）
 *    125ms 那一帧就能差出 2–3 个数 → 同屏自相矛盾。所以按 memoKey 只跑一条 rAF，
 *    所有宿主读同一个 current（这就是 D7-A 的落地方式）。
 * 3. **跨挂载记忆**：四个屏是条件渲染，答完题回首页等于重新挂载。只在组件里存 prev 的话
 *    mount 时 prev === value → 永远不滚（功能存在但永不触发）。lastShown 是模块级的。
 *
 * 每帧只写 textContent，不读 getBoundingClientRect / getComputedStyle：布局稳定由第 1 条保证，
 * 不是靠「每帧量一遍再修正」。
 */
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { cubicBezier, MOTION, prefersReducedMotion, readEaseOut } from '../lib/motion';

interface Entry {
  from: number;
  to: number;
  current: number;
  start: number | null;
  ease: (x: number) => number;
  raf: number | null;
  subs: Set<() => void>;
}

const entries = new Map<string, Entry>();
/** 跨挂载记忆：key → 上一次**用户真正看到**的值（冷启动为空 → 首帧不滚，这是规矩） */
const lastShown = new Map<string, number>();

const FALLBACK_EASE = cubicBezier(0.2, 0.8, 0.2, 1);

function notify(e: Entry) {
  for (const cb of e.subs) cb();
}

function entryFor(key: string, initial: number): Entry {
  let e = entries.get(key);
  if (!e) {
    const known = lastShown.get(key);
    e = {
      from: initial,
      to: initial,
      current: known === undefined ? initial : known,
      start: null,
      ease: FALLBACK_EASE,
      raf: null,
      subs: new Set(),
    };
    entries.set(key, e);
  }
  return e;
}

function step(key: string, e: Entry, startedAt: number) {
  const t = Math.min(1, Math.max(0, (performance.now() - startedAt) / MOTION.number));
  e.current = Math.round(e.from + (e.to - e.from) * e.ease(t));
  notify(e);
  if (t >= 1) {
    e.current = e.to;
    e.raf = null;
    lastShown.set(key, e.to);
    notify(e);
    return;
  }
  e.raf = requestAnimationFrame(() => step(key, e, startedAt));
}

function ensure(key: string, value: number) {
  const e = entryFor(key, value);
  if (e.raf !== null) cancelAnimationFrame(e.raf); // 打断：一律用当前显示值重新起一条
  if (e.current === value) {
    // 首帧 / 值没变：直接落定，不滚（冷启动首帧不滚靠这条）
    e.from = value;
    e.to = value;
    return;
  }
  if (prefersReducedMotion()) {
    // 减弱动效：直接给终值，不建 rAF、不延迟
    e.from = value;
    e.to = value;
    e.current = value;
    lastShown.set(key, value);
    notify(e);
    return;
  }
  e.from = e.current;
  e.to = value;
  e.ease = readEaseOut();
  /* 起点时间自己抓：不用 rAF 的时间戳。用时间戳会让「上一次没跑完的动画」把起点留在过去，
     一帧就算出 t>=1 → 数字直接跳终值（第一次实测就是这么「滚完了」而没人看见）。 */
  const startedAt = performance.now();
  e.raf = requestAnimationFrame(() => step(key, e, startedAt));
}

function subscribe(key: string, cb: () => void) {
  const e = entryFor(key, lastShown.get(key) ?? 0);
  e.subs.add(cb);
  return () => {
    e.subs.delete(cb);
    /* 最后一个宿主卸载（含 StrictMode 的挂载→卸载→再挂载）：只记住**用户最后看到的数**，
       绝不能写成 e.to。写成目标值 = 把起点抹掉，再挂载时 ensure 看到「已是终值」→ 不滚。
       第一次实测就是这么坏的：日志里 3966ms 出现 `set-unsub home.learned 10`，
       紧接着 3967ms 的 ensure 就是 cur=10 / last=10，动画一步没跑。 */
    if (e.subs.size === 0) {
      if (e.raf !== null) {
        cancelAnimationFrame(e.raf);
        e.raf = null;
      }
      lastShown.set(key, e.current);
    }
  };
}

export interface RollingNumberProps {
  /** 目标值（整数） */
  value: number;
  /** 同一数字的多个宿主必须用同一个 key —— 这是「同屏同源同帧」的唯一开关 */
  memoKey: string;
  /** 预留位数：::before 用 digits 个 0 撑宽，必须 ≥ 可能出现的最大位数 */
  digits: number;
  /** 显示格式（如补零）；默认 String */
  format?: (n: number) => string;
}

export function RollingNumber({ value, memoKey, digits, format }: RollingNumberProps) {
  const fmt = format ?? ((n: number) => String(n));
  const sub = useCallback((cb: () => void) => subscribe(memoKey, cb), [memoKey]);
  const snap = useCallback(() => entryFor(memoKey, value).current, [memoKey, value]);
  const current = useSyncExternalStore(sub, snap, snap);

  useEffect(() => {
    ensure(memoKey, value);
  }, [memoKey, value]);

  return (
    <span
      className="num-roll"
      data-num-key={memoKey}
      data-ghost={'0'.repeat(Math.max(1, digits))}
    >
      <span className="num-roll__live">{fmt(current)}</span>
    </span>
  );
}
