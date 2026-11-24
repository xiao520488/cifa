interface Option<T extends string | number> {
  value: T;
  label: string;
  ariaLabel?: string;
}

interface SegmentedProps<T extends string | number> {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
}

/** 分段选择器：视觉上是单选组，语义上也是。 */
export function Segmented<T extends string | number>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className="segmented__item"
            aria-pressed={active}
            aria-label={option.ariaLabel ?? option.label}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
