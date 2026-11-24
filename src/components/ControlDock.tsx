import { IconChevronLeft, IconChevronRight } from './Icons';

interface ControlDockProps {
  hideMeaning: boolean;
  hideWord: boolean;
  canPrev: boolean;
  canNext: boolean;
  onToggleMeaning: () => void;
  onToggleWord: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export function ControlDock({
  hideMeaning,
  hideWord,
  canPrev,
  canNext,
  onToggleMeaning,
  onToggleWord,
  onPrev,
  onNext,
}: ControlDockProps) {
  return (
    <div className="dock" role="toolbar" aria-label="本批控制">
      <button
        type="button"
        className="dock__btn dock__toggle"
        aria-pressed={!hideMeaning}
        onClick={onToggleMeaning}
        aria-label={hideMeaning ? '显示中文释义' : '关闭中文释义'}
      >
        <span>中文</span>
        <span className="dock__state">{hideMeaning ? '已关' : '显示'}</span>
      </button>
      <button
        type="button"
        className="dock__btn dock__toggle"
        aria-pressed={!hideWord}
        onClick={onToggleWord}
        aria-label={hideWord ? '显示英文单词' : '关闭英文单词'}
      >
        <span>英文</span>
        <span className="dock__state">{hideWord ? '已关' : '显示'}</span>
      </button>
      <button
        type="button"
        className="dock__btn dock__nav"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="上一批单词"
      >
        <IconChevronLeft size={16} />
        <span>上一批</span>
      </button>
      <button
        type="button"
        className="dock__btn dock__nav dock__nav--primary"
        onClick={onNext}
        disabled={!canNext}
        aria-label="下一批单词"
      >
        <span>下一批</span>
        <IconChevronRight size={16} />
      </button>
    </div>
  );
}
