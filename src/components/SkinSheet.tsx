import type { Skin, ThemeMode } from '../lib/types';
import { Sheet } from './Modal';
import { Segmented } from './Segmented';
import { SkinPicker } from './SkinPicker';

interface SkinSheetProps {
  skin: Skin;
  theme: ThemeMode;
  onSkin: (skin: Skin) => void;
  onTheme: (theme: ThemeMode) => void;
  onClose: () => void;
}

/** 外观面板：四套皮肤 + 浅色 / 深色。选中即时生效，遮罩后面能直接看到效果。 */
export function SkinSheet({ skin, theme, onSkin, onTheme, onClose }: SkinSheetProps) {
  return (
    <Sheet
      title="外观"
      description="四套排印系统，选中立即生效。浅色 / 深色与皮肤相互独立。"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn--primary btn--block" onClick={onClose}>
          完成
        </button>
      }
    >
      <SkinPicker value={skin} onChange={onSkin} />

      <div className="skin-sheet__row">
        <span className="skin-sheet__label">明暗</span>
        <Segmented
          label="明暗"
          options={[
            { value: 'system', label: '跟随系统' },
            { value: 'light', label: '浅色' },
            { value: 'dark', label: '深色' },
          ]}
          value={theme}
          onChange={onTheme}
        />
      </div>
    </Sheet>
  );
}
