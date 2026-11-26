import { useEffect, useRef, useState } from 'react';
import { MOTION } from '../lib/motion';

interface SessionToastProps {
  /** null = 没有提示；从有到无会走 150ms 淡出再卸载 */
  text: string | null;
}

/**
 * 学习流 / 错词本的提示条（docs/MOTION_SPEC.md §4）。
 *
 * 进入：上移 12px + 淡入 200ms；
 * 停留：2.5s（换文案只重置计时器，不重播进入动画）；
 * 退出：淡出 150ms，不位移，动画结束才卸载。
 *
 * 位移与时长都走 CSS 令牌（`--toast-shift` / `--motion-toast-*`），减弱动效时
 * 位移归零、只留 opacity —— 所以这里不判断 prefers-reduced-motion。
 */
export function SessionToast({ text }: SessionToastProps) {
  const [shown, setShown] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const timers = useRef<number[]>([]);
  /** 是否有一条正在显示（或正在退场）的提示 —— 退场时才需要走 150ms */
  const visible = useRef(false);

  useEffect(() => {
    const clear = () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
    const later = (ms: number, fn: () => void) => {
      timers.current.push(window.setTimeout(fn, ms));
    };
    const leave = () => {
      setLeaving(true);
      later(MOTION.toastOut, () => {
        visible.current = false;
        setShown(null);
        setLeaving(false);
      });
    };

    clear();

    if (text !== null) {
      visible.current = true;
      setShown(text);
      setLeaving(false);
      later(MOTION.toastHold, leave);
    } else if (visible.current) {
      // 父级主动清空（例如下一次作答成功）→ 立刻开始退场
      leave();
    }

    return clear;
  }, [text]);

  if (shown === null) return null;

  return (
    <p className={leaving ? 'session-toast is-leaving' : 'session-toast'} role="status">
      {shown}
    </p>
  );
}
