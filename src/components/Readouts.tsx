/**
 * 读数带（.readouts）——三屏同源的只读组件。
 *
 * 为什么存在：v10 之前这块 DOM 内联在 StudyScreen 里（首页专用）。commit B 要让
 * desk / vinyl 在「日历」「我的」也常驻一条读数带，靠皮肤 CSS 造数（content: 写数字）
 * 等于伪造数据，所以把节点抽成组件，由 App 顶层同一份 memo 结果喂三屏——
 * 今日发放 / 今日批数 / 已学 在首页和别的屏永远不可能显示成两个值。
 *
 * 开关在哪：`SkinMeta.persistentReadouts`（src/lib/skins.ts）。false 的皮肤这个节点
 * 根本不进 DOM（不是 display:none）；首页不受该开关影响，一直在。
 *
 * 三条纪律：
 * 1. 组件不算数、不判零、不查 NaN——value 是已经格式化好的数字串；
 * 2. 类名结构必须与 v10 首页现体逐字同构（.readouts > .readout > .readout__k/.readout__v），
 *    否则八套皮肤既有的 `.readout` 规则全部脱靶；
 * 3. aria-hidden 保留：带内数字在屏内别处都有非 hidden 的等价文本
 *    （首页 .start__spec、日历 .cal-figures/.cal-foot、我的 .stat__num），
 *    对读屏机不重复播报。这也是探针按 aria-hidden 跳过子树的原因——
 *    带子自身的溢出/对比/截断由 scripts/audit-readouts-band.js 显式量，不靠通用探针。
 */
import type { ReactElement } from 'react';

export type ReadoutsScreen = 'home' | 'cal' | 'me';

export interface ReadoutItem {
  /** 稳定 key，只作 React key 与脚本定位用，不进文案 */
  key: 'today' | 'batch' | 'learned';
  /** 短标签，≤2 个汉字：「>4 汉字必须 ≥14px」这条红线靠「标签只有 2 字」结构性免疫 */
  label: string;
  /** 已格式化的纯数字串（含补零），必须 /^\d+$/ */
  value: string;
}

export interface ReadoutsProps {
  /** 渲染成 data-readouts-screen，皮肤 CSS 与审计脚本按它定位；不许拿来判皮肤 */
  screen: ReadoutsScreen;
  /** 固定 3 项，数组顺序 = DOM 顺序（今日/批数/已学）；皮肤用 nth-child 关掉复读格 */
  items: ReadoutItem[];
}

/** 补零宽度与 v10 首页现体逐字一致（StudyScreen 原 :81/:85/:89），三屏同源 */
export function buildReadoutItems(
  allowedNew: number,
  batchCount: number,
  learned: number,
): ReadoutItem[] {
  return [
    { key: 'today', label: '今日', value: String(allowedNew).padStart(2, '0') },
    { key: 'batch', label: '批数', value: String(batchCount).padStart(2, '0') },
    { key: 'learned', label: '已学', value: String(learned).padStart(3, '0') },
  ];
}

export function Readouts({ screen, items }: ReadoutsProps): ReactElement {
  return (
    <div className="readouts" data-readouts-screen={screen} aria-hidden="true">
      {items.map((item) => (
        <div className="readout" key={item.key} data-readout={item.key}>
          <span className="readout__k">{item.label}</span>
          <span className="readout__v">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
