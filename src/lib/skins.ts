import type { Skin } from './types';

export interface SkinMeta {
  key: Skin;
  /** 中文名，界面上显示 */
  name: string;
  /** 拉丁名，做小字注脚 */
  latin: string;
  /** 一句话气质，选择卡片上显示 */
  tagline: string;
  /** 预览用的色板（浅色档）：纸、墨、强调 */
  swatch: { bg: string; ink: string; accent: string; line: string };
  /** 深色档的页面底色，用于同步浏览器 chrome（theme-color） */
  darkBg: string;
}

/**
 * 四套外观。CSS 里由 [data-skin] 驱动，这里只放名字与预览色，
 * 不参与排版，改色请改 src/styles/skins/*.css 的令牌。
 */
export const SKINS: SkinMeta[] = [
  {
    key: 'paper',
    name: '词典纸页',
    latin: 'PAPER',
    tagline: '暖白纸、衬线、朱砂点睛',
    swatch: { bg: '#F6F3EC', ink: '#191817', accent: '#B23A2A', line: '#E2DCD0' },
    darkBg: '#12110E',
  },
  {
    key: 'foundry',
    name: '铅字',
    latin: 'FOUNDRY',
    tagline: '黑白硬边、印章红、无圆角',
    swatch: { bg: '#FFFFFF', ink: '#0B0B0B', accent: '#D93A16', line: '#0B0B0B' },
    darkBg: '#0B0B0B',
  },
  {
    key: 'instrument',
    name: '仪表',
    latin: 'INSTRUMENT',
    tagline: '深色原生、等宽数字、琥珀信号',
    swatch: { bg: '#0B0D0F', ink: '#E6E8EB', accent: '#FFB020', line: '#20252C' },
    darkBg: '#0B0D0F',
  },
  {
    key: 'broadsheet',
    name: '词表报',
    latin: 'BROADSHEET',
    tagline: '报纸栏线、衬线墨字、靛蓝',
    swatch: { bg: '#F4F4F1', ink: '#14140F', accent: '#1B2E6B', line: '#14140F' },
    darkBg: '#131311',
  },
];

export function skinMeta(key: Skin): SkinMeta {
  return SKINS.find((item) => item.key === key) ?? SKINS[0];
}
