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
 * 1. 组件不算数、不判零、不查 NaN——value 是数字，格式化由 pad/digits 交给 RollingNumber；
 * 2. 类名结构必须与 v10 首页现体逐字同构（.readouts > .readout > .readout__k/.readout__v），
 *    否则八套皮肤既有的 `.readout` 规则全部脱靶。滚动层是 .readout__v 内部的 .num-roll，
 *    .readout__v 的 textContent 仍然是那个数字串（::before 幽灵不吃文本），既有审计不受影响；
 * 3. aria-hidden 保留：带内数字在屏内别处都有非 hidden 的等价文本
 *    （首页 .start__spec、日历 .cal-figures/.cal-foot、我的 .stat__num），
 *    对读屏机不重复播报。这也是探针按 aria-hidden 跳过子树的原因——
 *    带子自身的溢出/对比/截断由 scripts/audit-readouts-band.js 显式量，不靠通用探针。
 */
import type { ReactElement } from 'react';
import { RollingNumber } from './RollingNumber';

export type ReadoutsScreen = 'home' | 'cal' | 'me';

export interface ReadoutItem {
  /** 稳定 key，只作 React key 与脚本定位用，不进文案；同时是滚动的 memoKey 后缀 */
  key: 'today' | 'batch' | 'learned';
  /** 短标签，≤2 个汉字：「>4 汉字必须 ≥14px」这条红线靠「标签只有 2 字」结构性免疫 */
  label: string;
  /** 原始数字（滚动从旧值到这个值） */
  value: number;
  /** 补零位数（显示用，如 2 / 3） */
  pad: number;
  /** 预留位数（撑宽用，必须 ≥ 该数字可能出现的最大位数） */
  digits: number;
}

export interface ReadoutsProps {
  /** 渲染成 data-readouts-screen，皮肤 CSS 与审计脚本按它定位；不许拿来判皮肤 */
  screen: ReadoutsScreen;
  /** 固定 3 项，数组顺序 = DOM 顺序（今日/批数/已学）；皮肤用 nth-child 关掉复读格 */
  items: ReadoutItem[];
}

/**
 * 补零宽度与 v10 首页现体逐字一致（StudyScreen 原 :81/:85/:89），三屏同源。
 *
 * 预留位数按「这个数字可能长到几位」定，不按当前值：
 * 今日 ≤ 3（上限可以调到 200+）、批数 ≤ 2、已学 ≤ 4（词库 3846 词，学到 1000 以上就会出现 4 位）。
 * `pad` 负责显示形态，`digits` 负责盒宽 —— 两件事分开，9→10 那一帧才不推布局。
 */
export function buildReadoutItems(
  allowedNew: number,
  batchCount: number,
  learned: number,
): ReadoutItem[] {
  return [
    { key: 'today', label: '今日', value: allowedNew, pad: 2, digits: 3 },
    { key: 'batch', label: '批数', value: batchCount, pad: 2, digits: 2 },
    { key: 'learned', label: '已学', value: learned, pad: 3, digits: 4 },
  ];
}

export function Readouts({ screen, items }: ReadoutsProps): ReactElement {
  return (
    <div className="readouts" data-readouts-screen={screen} aria-hidden="true">
      {items.map((item) => (
        <div className="readout" key={item.key} data-readout={item.key}>
          <span className="readout__k">{item.label}</span>
          <span className="readout__v">
            <RollingNumber
              value={item.value}
              memoKey={`home.${item.key}`}
              digits={item.digits}
              format={(n) => String(n).padStart(item.pad, '0')}
            />
          </span>
        </div>
      ))}
    </div>
  );
}
