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
  /** 主题 / 皮肤切换的颜色过渡（CSS --motion-theme = --duration-base） */
  theme: 200,
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

/** 一次性类的名字；scripts/audit-motion.js 的 G2 按字面量断言，改名要同步改脚本。 */
const THEME_CLASS = 'is-theme-switching';
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
