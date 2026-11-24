import { SKINS } from '../lib/skins';
import type { Skin } from '../lib/types';

interface SkinPickerProps {
  value: Skin;
  onChange: (skin: Skin) => void;
}

/** 四套外观的单选卡片。外观色板来自 SKINS 元数据，排版颜色仍由皮肤 CSS 决定。 */
export function SkinPicker({ value, onChange }: SkinPickerProps) {
  return (
    <div className="skin-grid" role="group" aria-label="外观风格">
      {SKINS.map((skin) => {
        const active = skin.key === value;
        return (
          <button
            key={skin.key}
            type="button"
            className="skin-card"
            aria-pressed={active}
            aria-label={`${skin.name}：${skin.tagline}`}
            onClick={() => onChange(skin.key)}
          >
            <span
              className="skin-card__swatch"
              style={{ background: skin.swatch.bg, borderColor: skin.swatch.line }}
              aria-hidden="true"
            >
              <span className="skin-card__ink" style={{ background: skin.swatch.ink }} />
              <span className="skin-card__accent" style={{ background: skin.swatch.accent }} />
            </span>
            <span className="skin-card__body">
              <span className="skin-card__name">
                {skin.name}
                <span className="skin-card__latin">{skin.latin}</span>
              </span>
              <span className="skin-card__tag">{skin.tagline}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
