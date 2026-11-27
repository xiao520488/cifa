# UI v2 · 第一阶段：骨架与清理

> 状态：**进行中（2026-11-27）**。本文件是本阶段唯一的规约，代码按它落。
> 第二阶段（真日历替换"接下来 7 天"）另起文件，不在本阶段的授权范围内。

## 0. 目标与非目标

**做**：底部常驻三 Tab（单词 / 数据 / 设置）；清掉首页三键与页脚、数据页的开始按钮、设置页的头像与昵称；顺带把三个 Tab 根页的顶栏统一成「标题 + 副标题」。

**不做（写死，不许自动扩）**：真日历、Tab 切换动效、URL / hash 路由、Android 返回键接管、清理无用 CSS、动 `lib/scheduler/**`、动存储键、动 `index.html`、改数据结构（`profile.name` 字段保留，只是不再渲染）。

## 1. 架构决定：不引路由，单一状态机

- `App.tsx` 的 `screen: 'study' | 'calendar' | 'me' | 'mistakes'` 继续是唯一真源，**不新增第二个状态**（两处状态必然不同步）。
- Tab 高亮由 `screen` 派生：`study→words`、`calendar→data`、`me→settings`、`mistakes→它的来源屏`。
- Tab 栏是 `.app` 的**最后一个非滚动子元素**（与读数带同级，在 `main` 之外、sheet 之前）：
  - `.app` 是 `height:100dvh` 的 flex 列，`main` 是唯一滚动层 → 栏天然贴底，**不写 `fixed`**（`.app` 有 `max-width`，fixed 在宽屏会脱列，vinyl 已踩过）。
  - `order: 4` 写进基线：vinyl 用 `order` 沉底（main=2 / readouts=3），没有这条会被默认 `order:0` 插到 topbar 下面。
  - desk ≥768 的首页把 `.app:has(.start)` 改成 2×2 grid，新子节点会被自动塞进第 3 行第 1 列 → 显式 `grid-column:1/-1; grid-row:3`，并补一行 `auto`。
- **Session 期间不渲染 Tab 栏**：学习流的 `.answer-dock` 已在抢底部，两层层叠会互压（NOTES 里读数带同款判断）。

## 2. 组件契约

```
<TabBar active="words|data|settings" onSelect={…} />
```

- 根节点 `<nav class="tabbar" aria-label="主导航">`，**不用** `role=tablist`（没有 tabpanel 可绑，`aria-current="page"` 才是页面级导航的语义）。
- 三项固定顺序：单词 / 数据 / 设置，各带 `data-tab="words|data|settings"`（审计脚本靠它导航）。
- 当前项 `aria-current="page"`；点击当前项不发事件（避免无意义重渲染）。
- 图标：`IconWord`（卡片）、`IconCalendar`（复用）、`IconSliders`（滑杆），24 viewBox / 1.6 stroke，与既有图标同语法。

## 3. 设计契约（token 驱动，禁止裸值）

| 项 | 取值 |
|---|---|
| 栏高 | `--tabbar-h: 57px`（4+48+4 内边距 + 1px 上边框，border-box 下写 56 会溢成 57）；`padding-bottom: calc(var(--space-1) + env(safe-area-inset-bottom))`，`index.html` 已是 `viewport-fit=cover` |
| 底色 / 分隔 | `background: var(--surface)`；`border-top: 1px solid var(--border)` |
| 每项 | `flex: 1`（实测 121–122×48）、`min-height: 48px`（审计 44px 闸）、图标 22 + 标签 12px、纵向 gap 3px |
| 当前项 | 文字与图标 `--accent` + 顶部 2px 指示条（`::before`，宽 20px，`--accent`） |
| 非当前项 | `var(--text-secondary)`（**不是** tertiary：foundry 亮档 tertiary 只有 4.37:1） |
| 例外 | foundry 的 `--accent #cf3714` 当 12px 文字只有 4.37:1、暗档 `--accent-press` 掉到 3.49 → 该皮肤当前项改用 `--accent-hover`（亮 **4.99** / 暗 **6.44**），指示条仍用纯 accent |

> 不能用 `color-mix()` 取文字色：它算出的值是 `color(srgb …)`，审计的对比度解析器只认 `rgb()/rgba()`，
> 读不到就静默跳过该项 —— 那是假绿。

**状态矩阵**（emil-design-eng 要求全定义）：

| 状态 | 表现 |
|---|---|
| default | 图标 + 标签，`text-tertiary` |
| hover（`@media (hover:hover)`） | 底色 `var(--row-hover)`，字色 `--text-secondary`，**位移 0** |
| active | `transform: scale(0.97)` + 底色 `var(--surface-sunken)`，140ms |
| focus-visible | `outline: 2px solid var(--accent)`，`outline-offset: -2px`（内缩防被栏边裁） |
| current | accent 色 + 顶部指示条（同时是 `aria-current` 的视觉编码，不只靠颜色） |
| disabled | 不适用（Tab 永远可点） |
| loading / error | 不适用 |

动效只用 `color` / `background-color` / `transform`，140ms `--ease-out`；`prefers-reduced-motion` 下由既有全局降级规则覆盖。

## 4. 高度预算（本阶段最大风险）

栏吃掉 57px 后，首页 `.start` 的 `min-height: calc(100dvh - 顶栏)` 会比容器高出一个栏的高度 → **每台手机首页都多出一段空滚**。处理：

- tokens.css 新增 `--tabbar-h: 57px`。
- 9 套皮肤各自的 `.start` min-height 公式各减 `var(--tabbar-h)` **和 `var(--space-6)`**（后者是 `.screen` 的下留白：不减的话首页仍会多出 32px 空滚）。
- **实测（390×844，首页 `room = scrollHeight − clientHeight`）**：paper / breeze / instrument / bento / nocturne / desk / vinyl = **0**，foundry = 1；**broadsheet = 37**（它的首页内容本身就 762px 高，压 min-height 无效，见「已知限制」）。
- 兜底顺序：栏高 57 → 52 → 最后才动 `.start__body{margin-block:auto}`（会碰皮肤，最后手段）。本轮 57 够了，没降档。

## 5. 删除清单

| 位置 | 删什么 |
|---|---|
| 首页 `.topbar` | 日历 / 外观 / 「词」三个按钮 → 只剩 `.brand` |
| 首页 `.start__foot` | 「进度只存在这台设备」+「换个阶段」整块 |
| 数据页 | `.cal-hero__actions`（开始背单词）整块 + 顶栏返回/调色板/头像；**「接下来 7 天」「长期复习」「cal-foot」一字不动** |
| 设置页 | `section.profile`（头像 + 昵称输入）→ 换成 `.me-head`（阶段名 + 已学 n / 总数）；顶栏「我的」→「设置」，去掉返回 |

外观切换（`SkinPicker` 9 宫格 + 「快速切换」打开 SkinSheet）与学习阶段切换本来就在设置页，**不新造入口**，只保证删除头图后两块仍在原位。

## 6. 验证

1. `pnpm build`：tsc 0 错 + vite 构建通过。
2. `pnpm test:scheduler`：引擎一行没碰，必须全绿。
3. 截图：breeze / desk / vinyl × 390 × 浅色 + 深色（6 张）+ 360×640 高度核对。
4. 门禁：`scan-tiny`（9 皮肤 × home/cal/me）、`audit-screens`（同三屏 390，9 皮肤 × 2 主题）`failCount 0`。
5. 审计脚本导航改到 `[data-tab]`，`scan-tiny` 扫描选择器加 `.tabbar *` —— 不改就是假绿（旧脚本靠 `.avatar-btn` 与"外观"icon-btn 导航，删了直接 `nav:'FAIL'`）。

## 7. 已知限制（本阶段不修，写进 NOTES）

- **broadsheet 首页现在要滚 37px**：它的 `.start` 内容本身 762px（CTA + 今日卡），减 min-height 没用；真修要动该皮肤的垂直节奏，属下一阶段。
- Tab 切换只有既有的 `screen-in` 淡入，没有指示条滑动动画。
- 无 URL / hash，刷新回到「单词」；Android 返回键仍是退出 App（既有行为）。
- 首页今日卡里的「学习日历」「错词本」两个文字入口保留（上下文入口，与 Tab 不冲突）。
- `.profile*`、`.start__foot`、`.cal-hero__actions` 等 CSS 规则成为死代码，按纪律本轮不清理。
- 错词本仍没有自己的 Tab：从设置进 → 返回设置，从首页进 → 返回首页（`mistakesFrom`）。
