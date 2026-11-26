import { useCallback, useEffect, useRef, useState } from 'react';
import { MOTION, prefersReducedMotion } from '../lib/motion';

export type AckKind = 'known' | 'wrong';

/**
 * 作答反馈的一次性状态机（docs/MOTION_SPEC.md §3）。
 *
 * 用法：点作答 → 引擎写入（同步）→ `play(kind, 推进UI)`。
 * 它负责：挂 `is-ack-*` 类、等 180/200ms、摘类、再执行推进。
 * 为什么必须等：反馈期间换卡 = 用户看不到反馈；同时这也是"新词出现"的那一帧。
 *
 * - 减弱动效：不挂类、不延迟，直接推进（CSS 归零挡不住"白等 200ms"）。
 * - 卸载：取消定时器，避免 200ms 后再动状态（引擎写入已在调用前完成）。
 * - `busy`：反馈窗口内的重复点击由调用方拦掉（复习流另有 index 去重，这里是第二道）。
 */
export function useAnswerFeedback() {
  const [ack, setAck] = useState<AckKind | null>(null);
  const timer = useRef<number | null>(null);
  const busy = useRef(false);

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  const play = useCallback((kind: AckKind, done: () => void) => {
    busy.current = true;
    if (prefersReducedMotion()) {
      busy.current = false;
      done();
      return;
    }
    setAck(kind);
    timer.current = window.setTimeout(
      () => {
        timer.current = null;
        busy.current = false;
        setAck(null);
        done();
      },
      kind === 'known' ? MOTION.ackKnown : MOTION.feedback,
    );
  }, []);

  return { ack, play, busy };
}
