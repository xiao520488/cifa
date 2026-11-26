/**
 * 作答手感的时间常量（docs/MOTION_SPEC.md）。
 *
 * CSS 侧是令牌，JS 侧需要同一组数字：延迟换卡、toast 停留、减弱动效判断。
 * 两边必须一致 —— 改这里就要同时改 tokens.css 的同名令牌。
 */
export const MOTION = {
  /** 按下（CSS --motion-press） */
  press: 50,
  /** 松开（CSS --motion-release） */
  release: 180,
  /** 答对上浮（CSS --motion-ack-known） */
  ackKnown: 180,
  /** 答错抖动（CSS --motion-feedback） */
  feedback: 200,
  /** toast 进入（CSS --motion-toast-in） */
  toastIn: 200,
  /** toast 退出（CSS --motion-toast-out） */
  toastOut: 150,
  /** toast 停留：纯 JS，不落 CSS */
  toastHold: 2500,
  /** 主题 / 皮肤切换的颜色过渡（CSS --motion-theme = 200ms） */
  theme: 200,
  /** 读数数字滚动（CSS --motion-number；D5 唯一破例，只给数字用） */
  number: 250,
} as const;

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * 开了「减弱动效」就不播位移类反馈、也不延迟换卡。
 * 注意不能只看 CSS：延迟是 JS 造成的，CSS 归零挡不住「白等 200ms」。
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia(REDUCE_QUERY).matches;
}

/** 一次性类的名字；scripts/audit-motion.js 的 G2 按字面量断言，改名要同步改脚本。 */const THEME_CLASS = 'is-theme-switching';
/** 200ms + 40ms 缓冲：摘类必须晚于过渡结束，否则会在最后一帧把过渡掐断。 */
const THEME_CLASS_MS = MOTION.theme + 40;

let themeTimer: number | undefined;

/**
 * 给这一次「切主题 / 切皮肤」挂 200ms 颜色过渡（docs/MOTION_SPEC.md §13.4）。
 *
 * 必须在写 `data-theme` / `data-skin` **之前**调用。函数里加完类会强制一次样式重算：
 * 类与属性如果同一次任务里一起改，浏览器在两次重算之间从没观察过「带 transition 的旧颜色」，
 * 过渡根本不会触发 —— 看起来就是瞬切。这个 reflow 是「代码全对却不渐变」的唯一原因。
 *
 * 返回 false 表示这次没挂（减弱动效 / 无 document）：调用方照常改属性，正常瞬切。
 */
export function startThemeTransition(): boolean {
  if (typeof document === 'undefined') return false;
  if (prefersReducedMotion()) return false;
  const root = document.documentElement;
  root.classList.add(THEME_CLASS);
  void root.offsetHeight; // 强制样式重算：让「旧颜色 + transition 属性」先成为当前计算值
  if (themeTimer !== undefined) window.clearTimeout(themeTimer);
  themeTimer = window.setTimeout(() => {
    root.classList.remove(THEME_CLASS);
    themeTimer = undefined;
  }, THEME_CLASS_MS);
  return true;
}

/**
 * CSS `cubic-bezier(x1,y1,x2,y2)` 求值器：给时间进度 x（0–1）返回数值进度 y。
 *
 * 数字滚动必须在 JS 里跑**当前皮肤**那条曲线（bento / instrument / foundry / broadsheet
 * 都覆盖了 `--ease-out`），所以曲线由 readEaseOut() 每次起滚读一次，不能硬编码成 1-(1-p)^3。
 * 用二分求 t（20 次迭代，误差 < 1e-5）：比牛顿少一个「切线近水平时不收敛」的坑，
 * 每帧几十次浮点运算，对 250ms 的动画完全不构成开销。
 */
export function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): (x: number) => number {
  const A = (a: number, b: number) => 1 - 3 * b + 3 * a;
  const B = (a: number, b: number) => 3 * b - 6 * a;
  const C = (a: number) => 3 * a;
  const calc = (t: number, a: number, b: number) => ((A(a, b) * t + B(a, b)) * t + C(a)) * t;
  const solveT = (x: number) => {
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 20; i += 1) {
      t = (lo + hi) / 2;
      const v = calc(t, x1, x2);
      if (Math.abs(v - x) < 1e-5) break;
      if (v < x) lo = t;
      else hi = t;
    }
    return t;
  };
  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return calc(solveT(x), y1, y2);
  };
}

/**
 * 读当前生效的 `--ease-out` 并转成求值函数。**每次起滚读一次**，不是每帧：
 * 每帧读 getComputedStyle 会强制样式重算，250ms 里几十次就是白给的抖动源。
 */
export function readEaseOut(): (x: number) => number {
  const fallback = cubicBezier(0.2, 0.8, 0.2, 1);
  if (typeof window === 'undefined' || typeof document === 'undefined') return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
  const m = raw.match(/cubic-bezier\(([^)]+)\)/);
  if (!m) return fallback;
  const p = m[1].split(',').map((x) => Number(x.trim()));
  if (p.length !== 4 || p.some((n) => !Number.isFinite(n))) return fallback;
  return cubicBezier(p[0], p[1], p[2], p[3]);
}