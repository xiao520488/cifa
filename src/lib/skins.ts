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
  /**
   * 日历 / 「我的」两屏是否在 DOM 里常驻一块 .readouts 读数带（v11 commit B）。
   * true  = App 渲染 `<Readouts screen="cal|me">`，显隐与形态由皮肤 CSS 决定；
   * false = 该节点根本不进 DOM（不是 display:none——审计按「查无节点」断言）。
   * 首页不受此开关控制：首页的读数节点一直在 StudyScreen 里，显隐历来归皮肤 CSS 管
   * （skin-hooks.css:13 默认藏；vinyl / instrument / bento 各自开；nocturne 再显式藏一次）。
   * 设成必填而不是可选：新增皮肤必须在编译期表态，漏写直接 tsc 失败，
   * 不会出现「静默渲染了一条没设计过的带子」。
   */
  persistentReadouts: boolean;
}

/**
 * 外观皮肤。CSS 里由 [data-skin] 驱动，这里只放名字与预览色，
 * 不参与排版，改色请改 src/styles/skins/*.css 的令牌。
 *
 * bento / nocturne 是 v8 再设计保留下来的两版；
 * desk / vinyl 是 v9 两版（栏 / 横 两条互斥骨架轴），目前只重做首页；
 * breeze 是 v14 第 9 套（清透白卡），**已是新装默认**，所以排在第一位——
 * 兜底的 skinMeta() 取 SKINS[0]，默认与兜底必须是同一套。
 * 色板以各自 CSS 的令牌为准，这里的 swatch 只供选择卡片预览与 theme-color。
 */
export const SKINS: SkinMeta[] = [
  {
    key: 'breeze',
    name: '晴空',
    latin: 'BREEZE',
    tagline: '晴蓝 · 通透',
    swatch: { bg: '#F4F8FB', ink: '#0F172A', accent: '#2563EB', line: '#E6ECF3' },
    darkBg: '#121212',
    persistentReadouts: false,
  },
  {
    key: 'paper',
    name: '词典纸页',
    latin: 'PAPER',
    tagline: '暖纸 · 朱砂',
    swatch: { bg: '#F6F3EC', ink: '#191817', accent: '#B23A2A', line: '#E2DCD0' },
    darkBg: '#12110E',
    persistentReadouts: false,
  },
  {
    key: 'foundry',
    name: '铅字',
    latin: 'FOUNDRY',
    tagline: '纯白 · 硬边',
    swatch: { bg: '#FFFFFF', ink: '#0B0B0B', accent: '#D93A16', line: '#0B0B0B' },
    darkBg: '#0B0B0B',
    persistentReadouts: false,
  },
  {
    key: 'instrument',
    name: '仪表',
    latin: 'INSTRUMENT',
    tagline: '琥珀 · 等宽',
    swatch: { bg: '#0B0D0F', ink: '#E6E8EB', accent: '#FFB020', line: '#20252C' },
    darkBg: '#0B0D0F',
    persistentReadouts: false,
  },
  {
    key: 'broadsheet',
    name: '词表报',
    latin: 'BROADSHEET',
    tagline: '栏线 · 靛蓝',
    swatch: { bg: '#F4F4F1', ink: '#14140F', accent: '#1B2E6B', line: '#14140F' },
    darkBg: '#131311',
    persistentReadouts: false,
  },
  {
    key: 'bento',
    name: '磁贴',
    latin: 'BENTO',
    tagline: '冷灰 · 青瓷',
    swatch: { bg: '#F1F1EE', ink: '#15161A', accent: '#0E7C86', line: '#DEDED8' },
    darkBg: '#0D1013',
    persistentReadouts: false,
  },
  {
    key: 'nocturne',
    name: '夜航',
    latin: 'NOCTURNE',
    tagline: '墨蓝 · 月光',
    swatch: { bg: '#F4F5F7', ink: '#10141B', accent: '#1E4E8C', line: '#E2E5EA' },
    darkBg: '#0B0D12',
    persistentReadouts: false,
  },
  {
    key: 'vinyl',
    name: '唱盘',
    latin: 'VINYL',
    tagline: '洋红 · 黑胶',
    swatch: { bg: '#F7F5F2', ink: '#17141A', accent: '#A62A5E', line: '#E4DFD8' },
    darkBg: '#121113',
    persistentReadouts: true,
  },
  {
    key: 'desk',
    name: '案头',
    latin: 'DESK',
    tagline: '抽屉 · 侧栏',
    swatch: { bg: '#F4F1EA', ink: '#1B1F1C', accent: '#20623F', line: '#DCD4C2' },
    darkBg: '#141613',
    persistentReadouts: true,
  },
];

export function skinMeta(key: Skin): SkinMeta {
  return SKINS.find((item) => item.key === key) ?? SKINS[0];
}

/**
 * 该皮肤在日历 / 「我的」屏是否常驻读数带。全项目唯一的「JS 层皮肤感知」入口之一：
 * 屏组件（CalendarScreen / ProfileScreen）对皮肤零感知，开关只在 App 顶层查表。
 * 兜底走 skinMeta 的 SKINS[0]（breeze = false），未知键不会凭空冒出一条带子。
 */
export function persistentReadoutsFor(key: Skin): boolean {
  return skinMeta(key).persistentReadouts;
}
