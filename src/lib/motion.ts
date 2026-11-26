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
