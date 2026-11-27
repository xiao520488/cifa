/**
 * 底部 Tab 栏（v2 第一阶段，见 docs/UI_V2_PHASE1.md）。
 *
 * 只做三件事：渲染三个页面级入口、标出当前页、把点击交回 App 的状态机。
 * 自己不管「当前在哪个屏」——`active` 由 App 从唯一的 `screen` 派生，
 * 所以不存在「内容在设置页、高亮却在单词」这种不同步。
 *
 * 三条不能改的细节：
 * 1. 根是 `<nav aria-label="主导航">` + `aria-current="page"`，不用 role=tablist：
 *    三个入口是页面级导航（SPA 里没有 tabpanel 可绑），tab 语义会让读屏报「1/3 选项卡」，
 *    与「切了一整屏」不符。
 * 2. 顺序写死 单词 / 数据 / 设置，`data-tab` 是审计脚本与探针的定位锚，改名会同时弄坏两边。
 * 3. 点当前项不发事件：同一个 screen 重设会让 App 的转场 effect 空跑一次。
 */
import type { ReactElement } from 'react';
import { IconCalendar, IconSliders, IconWord } from './Icons';

export type TabKey = 'words' | 'data' | 'settings';

interface TabBarProps {
  active: TabKey;
  onSelect: (tab: TabKey) => void;
}

const TABS = [
  { key: 'words', label: '单词', Icon: IconWord },
  { key: 'data', label: '数据', Icon: IconCalendar },
  { key: 'settings', label: '设置', Icon: IconSliders },
] as const satisfies readonly { key: TabKey; label: string; Icon: (props: { size?: number }) => ReactElement }[];

export function TabBar({ active, onSelect }: TabBarProps) {
  return (
    <nav className="tabbar" aria-label="主导航">
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            type="button"
            className="tabbar__btn"
            data-tab={key}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => {
              if (!isActive) onSelect(key);
            }}
          >
            <Icon size={22} />
            <span className="tabbar__label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
