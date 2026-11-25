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
 * 外观皮肤。CSS 里由 [data-skin] 驱动，这里只放名字与预览色，
 * 不参与排版，改色请改 src/styles/skins/*.css 的令牌。
 *
 * bento / nocturne 是 v8 再设计保留下来的两版；
 * desk / deck / vinyl 是 v9 三版（栏 / 栈 / 横 三条互斥骨架轴），目前只重做首页；
 * 色板以各自 CSS 的令牌为准，这里的 swatch 只供选择卡片预览与 theme-color。
 */
export const SKINS: SkinMeta[] = [
  {
    key: 'paper',
    name: '词典纸页',
    latin: 'PAPER',
    tagline: '暖纸 · 朱砂',
    swatch: { bg: '#F6F3EC', ink: '#191817', accent: '#B23A2A', line: '#E2DCD0' },
    darkBg: '#12110E',
  },
  {
    key: 'foundry',
    name: '铅字',
    latin: 'FOUNDRY',
    tagline: '硬边 · 印章',
    swatch: { bg: '#FFFFFF', ink: '#0B0B0B', accent: '#D93A16', line: '#0B0B0B' },
    darkBg: '#0B0B0B',
  },
  {
    key: 'instrument',
    name: '仪表',
    latin: 'INSTRUMENT',
    tagline: '琥珀 · 等宽',
    swatch: { bg: '#0B0D0F', ink: '#E6E8EB', accent: '#FFB020', line: '#20252C' },
    darkBg: '#0B0D0F',
  },
  {
    key: 'broadsheet',
    name: '词表报',
    latin: 'BROADSHEET',
    tagline: '栏线 · 靛蓝',
    swatch: { bg: '#F4F4F1', ink: '#14140F', accent: '#1B2E6B', line: '#14140F' },
    darkBg: '#131311',
  },
  {
    key: 'bento',
    name: '磁贴',
    latin: 'BENTO',
    tagline: '冷灰 · 磁贴',
    swatch: { bg: '#F1F1EE', ink: '#15161A', accent: '#0E7C86', line: '#DEDED8' },
    darkBg: '#0D1013',
  },
  {
    key: 'nocturne',
    name: '夜航',
    latin: 'NOCTURNE',
    tagline: '墨蓝 · 月光',
    swatch: { bg: '#F4F5F7', ink: '#10141B', accent: '#1E4E8C', line: '#E2E5EA' },
    darkBg: '#0B0D12',
  },
  {
    key: 'vinyl',
    name: '唱盘',
    latin: 'VINYL',
    tagline: '洋红 · 唱片',
    swatch: { bg: '#F7F5F2', ink: '#17141A', accent: '#A62A5E', line: '#E4DFD8' },
    darkBg: '#121113',
  },
  {
    key: 'desk',
    name: '案头',
    latin: 'DESK',
    tagline: '抽屉 · 侧栏',
    swatch: { bg: '#F4F1EA', ink: '#1B1F1C', accent: '#20623F', line: '#DCD4C2' },
    darkBg: '#141613',
  },
];

export function skinMeta(key: Skin): SkinMeta {
  return SKINS.find((item) => item.key === key) ?? SKINS[0];
}
