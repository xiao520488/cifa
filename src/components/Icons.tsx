import type { ReactNode, SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps, children: ReactNode) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function IconBack(props: IconProps) {
  return base(props, <path d="M15 5 8 12l7 7" />);
}

export function IconChevronLeft(props: IconProps) {
  return base(props, <path d="M14.5 6 9 12l5.5 6" />);
}

export function IconChevronRight(props: IconProps) {
  return base(props, <path d="M9.5 6 15 12l-5.5 6" />);
}

export function IconUser(props: IconProps) {
  return base(props, <><circle cx="12" cy="8.5" r="3.5" /><path d="M5.5 20c.8-3.3 3.4-5 6.5-5s5.7 1.7 6.5 5" /></>);
}

export function IconUpload(props: IconProps) {
  return base(props, <><path d="M12 16V4" /><path d="m7.5 8.5 4.5-4.5 4.5 4.5" /><path d="M5 15v3.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V15" /></>);
}

export function IconClose(props: IconProps) {
  return base(props, <path d="M6 6l12 12M18 6 6 18" />);
}

export function IconCheck(props: IconProps) {
  return base(props, <path d="m5 12.5 4.5 4.5L19 7" />);
}

export function IconAlert(props: IconProps) {
  return base(props, <><path d="M12 8v5" /><path d="M12 16.5v.01" /><path d="M10.3 3.9 2.7 17.2A2 2 0 0 0 4.4 20h15.2a2 2 0 0 0 1.7-2.8L13.7 3.9a2 2 0 0 0-3.4 0Z" /></>);
}

export function IconArrowRight(props: IconProps) {
  return base(props, <><path d="M4 12h15" /><path d="m13.5 6.5 6 5.5-6 5.5" /></>);
}

export function IconEyeOff(props: IconProps) {
  return base(props, <><path d="M4 4l16 16" /><path d="M9.9 5.2A9.7 9.7 0 0 1 12 5c5.5 0 9 7 9 7a15 15 0 0 1-2.4 3.3" /><path d="M6.4 7.4A15.6 15.6 0 0 0 3 12s3.5 7 9 7c1.2 0 2.3-.3 3.3-.8" /><path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" /></>);
}

/** 外观 / 皮肤切换 */
export function IconPalette(props: IconProps) {
  return base(
    props,
    <>
      <path d="M12 3a9 9 0 1 0 0 18 2 2 0 0 0 1.6-3.2 2 2 0 0 1 1.6-3.2H18a3 3 0 0 0 3-3A9 9 0 0 0 12 3Z" />
      <path d="M7.5 10.5v.01" />
      <path d="M10 7.2v.01" />
      <path d="M14.2 7.4v.01" />
    </>,
  );
}

/** 学习日历 */
export function IconCalendar(props: IconProps) {
  return base(
    props,
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v3.5" />
      <path d="M16 3v3.5" />
    </>,
  );
}

/** 复习 / 到期 */
export function IconRepeat(props: IconProps) {
  return base(
    props,
    <>
      <path d="M4 9.5A4.5 4.5 0 0 1 8.5 5H18" />
      <path d="m15.5 2.5 3 2.5-3 2.5" />
      <path d="M20 14.5A4.5 4.5 0 0 1 15.5 19H6" />
      <path d="m8.5 21.5-3-2.5 3-2.5" />
    </>,
  );
}

/** 新词 / 加一 */
export function IconPlus(props: IconProps) {
  return base(props, <><path d="M12 5v14" /><path d="M5 12h14" /></>);
}
