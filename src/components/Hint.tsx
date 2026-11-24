import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * 小问号 + 贴着问号的说明气泡。设置页的「新词上限」与日历的「接下来 7 天」共用这一份实现。
 *
 * 行为约定（design-review v4 修过的问题，别退回）：
 * - 18px 的圆点靠 `::after` 撑出 44×44 透明热区（移动端点击下限）；
 * - 气泡 `position: fixed` + 用 `getBoundingClientRect` 夹在视口里（360 宽下绝对定位会顶出屏幕）；
 * - 展开后再量一次高度，下方放不下就翻到上方；
 * - 外点 / Esc / 滚动 / resize 都收起；按钮带 `aria-expanded` + `aria-controls`，键盘可 Enter / Space 触发。
 */
interface HintProps {
  /** 气泡的 DOM id，与按钮的 `aria-controls` 配对 */
  id: string;
  /** 按钮的无障碍名字，触屏用户看不见问号也要知道它是干什么的 */
  label: string;
  title: string;
  body: readonly string[];
}

export function Hint({ id, label, title, body }: HintProps) {
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popRef = useRef<HTMLDivElement | null>(null);
  const open = pos !== null;

  const close = () => setPos(null);

  const toggle = () => {
    if (pos) {
      close();
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    // 贴着问号往下展开，但左右/上下都夹在视口里（360 宽时 300px 会正好顶到边）
    const margin = 16;
    const width = Math.min(300, window.innerWidth - margin * 2);
    const left = Math.min(Math.max(margin, rect.left - 12), window.innerWidth - width - margin);
    setPos({ top: rect.bottom + 8, left, width });
  };

  /* 展开后再量一次高度：底部不够就翻到问号上方 */
  useLayoutEffect(() => {
    if (!pos || !popRef.current || !btnRef.current) return;
    const height = popRef.current.offsetHeight;
    const rect = btnRef.current.getBoundingClientRect();
    const overflow = pos.top + height > window.innerHeight - 12;
    if (overflow && rect.top - height - 8 >= 12) {
      setPos({ ...pos, top: rect.top - height - 8 });
    }
  }, [pos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (btnRef.current?.contains(target) || popRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    // 固定定位的气泡会跟着页面滚动跑偏，滚一下就收起
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div className="hint">
      <button
        ref={btnRef}
        type="button"
        className="hint__btn"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="dialog"
        aria-label={label}
        onClick={toggle}
      >
        ?
      </button>
      {pos ? (
        <div
          ref={popRef}
          className="hint__pop"
          id={id}
          role="dialog"
          aria-label={title}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          <p className="hint__title">{title}</p>
          {body.map((paragraph) => (
            <p key={paragraph} className="hint__text">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
