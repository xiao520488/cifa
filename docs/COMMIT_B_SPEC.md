# COMMIT_B 规约 · desk / vinyl 日历与「我的」屏常驻读数带

> 范围：为 commit B 定规——只有 `desk`、`vinyl` 两套皮肤在「日历」「我的」两屏渲染一块
> `.readouts` 风格的常驻读数带；其余 6 套皮肤这两个界面 DOM 里不许出现该节点。
> 本规约所有关于现状的论断均带 `file:line` 证据（行号以当前工作区为准）。
>
> 现状锚点（直接采用，不再论证）：
> - CSS 加载顺序 `tokens → app → skin-fonts → skin-hooks → skins/*`：`src/main.tsx:6-16`。
> - `.readouts` 默认被隐藏：`src/styles/skin-hooks.css:11-18`（`.topbar__meta, .readouts, …` 全部 `display:none`）。
> - `.app` 是 `flex-direction: column; overflow: hidden` 的壳：`src/styles/app.css:90-100`；
>   `.app__main` 是全站唯一纵向滚动容器：`src/styles/app.css:108-117`；`.screen` 管内容左右衬：
>   `src/styles/app.css:128-130`；顶栏 sticky 高 56：`src/styles/app.css:134-144`。
> - 首页读数带现体：`src/components/StudyScreen.tsx:78-91`（`aria-hidden="true"` 在 :78，
>   补零格式在 :81/:85/:89）。
> - 数据源：`src/App.tsx:52-60`（`useMemo` 调 `engine.plan()/allowance()/stats()`）、
>   `src/App.tsx:65-68`（`allowedNew / todayBatchCount / learnedCount`）；引擎方法在
>   `src/lib/scheduler/engine.ts:317（plan）/ :336（allowance）/ :1033（stats）`；
>   React 外壳 `src/hooks/useScheduler.ts:36-50（boot）、:77-85（run）`。
> - 键位：`cijian.v1` = `src/lib/storage.ts:3`；`cijian.scheduler.v1` = `src/lib/scheduler/storage.ts:28`。

---

## 1. 开关形态

**结论：`persistentReadouts: true` 放 `src/lib/skins.ts` 的 `SkinMeta`，且声明为必填字段；
渲染与否由 `App.tsx` 查配置决定，任何屏组件都不许出现 `skin === 'desk'` 这类身份判断。**

### 1.1 为什么是皮肤配置而不是组件硬编码

| 维度 | 配置字段（推荐） | 组件里 `skin === 'desk' || skin === 'vinyl'` |
| --- | --- | --- |
| 新增皮肤默认值 | 必填字段 → TS 编译期强制作者表态，漏写直接编译失败；语义上仍是「显式 `false`＝关」 | 每加一套皮肤都要人肉记得去改 2～3 处 `if`，漏改=静默渲染 |
| 类型安全 | `SkinMeta` 是单一事实源，读一次 `skinMeta(key).persistentReadouts` | 字符串比较对 `Skin` 联合类型（`src/lib/types.ts:61-69`）没有穷尽性检查 |
| 可发现性 | 开关就长在皮肤清单旁边（`src/lib/skins.ts:25-90`），审计时一眼看全 8 套 | 判断散落在 `App.tsx` 渲染树里，CSS 与 DOM 的开关关系没人看得见 |
| 组件纯度 | 屏组件继续对皮肤零感知（现状即如此：`CalendarScreen.tsx:33-42`、`ProfileScreen.tsx:11-32` 的 props 里没有任何 skin 字段） | 把皮肤身份注入业务组件，破坏现有分层 |

注意与现状的一致性：本仓库已经有「皮肤知道结构差异」的先例全靠 CSS 选择器
（`[data-skin='vinyl'] .readouts` 等），但「DOM 里有没有节点」是 JS 层决定，JS 层的
唯一皮肤感知点应该收在 `App.tsx`——它本来就 `import { skinMeta }`（`src/App.tsx:25`）并已在
`src/App.tsx:77` 读 meta 做 theme-color。开关走同一条路，不新开感知点。

### 1.2 类型定义（目标代码）

```ts
// src/lib/skins.ts —— SkinMeta 追加一个必填字段
export interface SkinMeta {
  key: Skin;
  name: string;
  latin: string;
  tagline: string;
  swatch: { bg: string; ink: string; accent: string; line: string };
  darkBg: string;
  /**
   * 日历 / 「我的」两屏是否在 DOM 里常驻一块 .readouts 读数带。
   * true  = App 渲染 <Readouts screen="cal|me">，皮肤 CSS 负责显形；
   * false = 该节点根本不进 DOM（不是 display:none——审计按节点存在性断言）。
   * 首页不受此开关控制：首页节点始终渲染，显隐历来归皮肤 CSS 管
   * （skin-hooks.css:11-18 默认藏；vinyl.css:179 / desk.css:274 / bento.css:137 /
   *   instrument.css:251 各自开；nocturne.css:135 再显式藏一次）。
   */
  persistentReadouts: boolean;
}
```

配套读取口（同文件，供 App 用，避免各处裸摸字段）：

```ts
export function persistentReadoutsFor(key: Skin): boolean {
  return skinMeta(key).persistentReadouts; // skinMeta 现体在 skins.ts:92-94，兜底 SKINS[0]
}
```

### 1.3 八套皮肤取值表

| key | 名称 | tagline（现值，`src/lib/skins.ts` 行号） | `persistentReadouts` | 依据 |
| --- | --- | --- | --- | --- |
| `paper` | 词典纸页 | 暖纸 · 朱砂（:30） | **false** | 无 `.readouts` 规则，靠 hooks 隐藏（skin-hooks.css:13） |
| `foundry` | 铅字 | 纯白 · 硬边（:38） | **false** | 同上，foundry.css 无任何 `.readouts` 选择器（grep 证实） |
| `instrument` | 仪表 | 琥珀 · 等宽（:46） | **false** | 首页开带（instrument.css:251），但非首页明确不带 |
| `broadsheet` | 词表报 | 栏线 · 靛蓝（:54） | **false** | 无 `.readouts` 规则 |
| `bento` | 磁贴 | 冷灰 · 青瓷（:62） | **false** | 首页开带（bento.css:137），仅首页 |
| `nocturne` | 夜航 | 墨蓝 · 月光（:70） | **false** | nocturne.css:135 连首页都显式 `display:none` |
| `vinyl` | 唱盘 | 洋红 · 黑胶（:78） | **true** | 底部常驻带是本案支柱（vinyl.css:177-189、489-490） |
| `desk` | 案头 | 抽屉 · 侧栏（:86） | **true** | 抽屉读数条语法现成（desk.css:274-310，仅 ≥768 首页） |

⚠ 该表若与用户意图不符即停下问；目前与任务书「只有 desk/vinyl」一致。
`storage.ts:61` 的 `SKINS` 字符串白名单只管 skin 键合法性，不需要动（新增的是静态
meta 字段，不进 localStorage，`Profile` 结构不变，无需 schema 版本位）。

---

## 2. 渲染边界（数据从哪来、组件怎么复用）

**结论：抽一个共享组件 `src/components/Readouts.tsx`，三屏同源——所有数值一律由
`App.tsx` 现成的 `todayView` + 三个派生量喂给它的 `buildReadoutItems()`；
日历屏、我的屏禁止为读数带另调 `engine.plan()/stats()`，更禁止皮肤 CSS 造数。**

### 2.1 现状数据链（已核实）

- 首页三数的产地：`src/App.tsx:52-60`（`todayView = { plan, allowance, stats }`，依赖
  `scheduler.engine` + `scheduler.version`）→ `src/App.tsx:65`（`allowedNew =
  todayView.plan.allowedNewWords`）→ `:66`（`todayBatchCount =
  Math.ceil(allowedNew / Math.max(1, batchSize))`，`batchSize` 在 `:45`）→
  `:67-68`（`learnedCount = shortCards + longCards + archivedCards`；注意
  `stats.newCards` 是**未学池**，`src/App.tsx:62-64` 有言）。
- `StudyScreen` 只是把它们以 props 收进来（`src/App.tsx:212-234`；props 定义
  `StudyScreen.tsx:14-30`）后在 JSX 里格式化（`StudyScreen.tsx:78-91`）。
  **数据源不是某个页面内 hook，而是 App 顶层 `useScheduler` + `useMemo`**
  （`src/hooks/useScheduler.ts:36-50、:129`）。
- 日历屏自己另有一份只读计算：`CalendarScreen.tsx:112-119`（`engine.plan()`、
  `engine.calendarView(8)`、`engine.stats()`），props 只有 `engine/version/…`
  （`CalendarScreen.tsx:33-42`），**没有 `batchSize`**——若在屏内自算「批数」就得新开
  prop，这正是选「App 喂数」的理由：同一 memo 结果三屏共享，不出现两次 `plan()` 漂移。
- 我的屏：`learnedCount / schedulerStats / allowance` 已由 App 传入
  （`src/App.tsx:256-261`；props 定义 `ProfileScreen.tsx:11-17`）。

### 2.2 共享组件与 props 契约

```ts
// src/components/Readouts.tsx（新文件）
export type ReadoutsScreen = 'home' | 'cal' | 'me';

export interface ReadoutItem {
  /** 稳定 key，仅作 React key 与 CSS nth-child 之外的定位；不加中文 */
  key: 'today' | 'batch' | 'learned';
  /** 短标签，≤2 个汉字（'今日'|'批数'|'已学'）。>4 汉字必须 ≥14px 的红线（audit-screens.js:59）
   *  靠「标签只有 2 字」在结构上免疫，13px 标签才守得住 desk.css:302 的先例 */
  label: string;
  /** 已格式化数字串（含补零），必须 /^\d+$/。组件不算数、不判零、不查 NaN */
  value: string;
}

export interface ReadoutsProps {
  /** 渲染为 data-readouts-screen：皮肤 CSS 与审计脚本都按它定位，不许用作皮肤判断 */
  screen: ReadoutsScreen;
  /** 固定 3 项，数组顺序 = DOM 顺序（今日/批数/已学）；皮肤用 nth-child 关掉复读格
   *  （vinyl.css:190、desk.css:300 的既有手法） */
  items: ReadoutItem[];
}

/** 与首页现体补零逐字一致（StudyScreen.tsx:81/:85/:89），三屏同源 */
export function buildReadoutItems(
  allowedNew: number,
  batchCount: number,
  learned: number,
): ReadoutItem[] {
  return [
    { key: 'today',   label: '今日', value: String(allowedNew).padStart(2, '0') },
    { key: 'batch',   label: '批数', value: String(batchCount).padStart(2, '0') },
    { key: 'learned', label: '已学', value: String(learned).padStart(3, '0') },
  ];
}
```

渲染体（保持与 `StudyScreen.tsx:78-91` 完全相同的类名结构，皮肤 CSS 才能零改动命中）：

```tsx
export function Readouts({ screen, items }: ReadoutsProps) {
  return (
    <div className="readouts" data-readouts-screen={screen} aria-hidden="true">
      {items.map((it) => (
        <div className="readout" key={it.key}>
          <span className="readout__k">{it.label}</span>
          <span className="readout__v">{it.value}</span>
        </div>
      ))}
    </div>
  );
}
```

`aria-hidden="true"` 保留（同 `StudyScreen.tsx:78`），合法性来自「数据在屏内别处都有非
hidden 等价文本」：首页 `.start__spec`（`StudyScreen.tsx:126-147`）、日历屏
`.cal-figures` + `.cal-foot`（`CalendarScreen.tsx:168-189、:253-257`，已学三卡在
foot :254-256）、我的屏 `.stat__num` 与进度行（`ProfileScreen.tsx:333-336、:243-244`）。
这条即 `docs/research2/02-finance.md:206` 的铁律。

### 2.3 App 接线（三屏各拿同一个节点实例）

```tsx
// src/App.tsx（示意，插在 :68 learnedCount 之后）
const readoutItems = useMemo(
  () => buildReadoutItems(allowedNew, todayBatchCount, learnedCount),
  [allowedNew, todayBatchCount, learnedCount],
);
const showBand =
  persistentReadoutsFor(store.profile.skin) &&
  !session && (screen === 'calendar' || screen === 'me');
```

首页把 `StudyScreen.tsx:78-91` 原段替换为 `<Readouts screen="home" items={…} />`
（items 由 App 传入，`StudyScreen` props 加一项 `readouts?: ReactNode`，走
`todayCard` 同款槽位模式，`src/App.tsx:221-228` 先例）。

### 2.4 禁止事项（CSS 造数红线）

- 皮肤 CSS 不得用 `content:`、计数器、`attr()` 在带子上写任何**数字**。先例边界：
  `desk.css:280-284` 的 `content: 'CIJIAN · DAILY'` 是纯装饰拉丁、不含数——允许存续；
  `vinyl.css:192-201` 伪元素圆盘是纯形状——允许。凡「读数」必须来自 DOM 文本节点，
  与 vinyl 自己的数据纪律同源（`vinyl.css:493-494`「盘里的数字全是 DOM 真值」）。
- 不得为造数给 `ReadoutsProps` 加第二数据通道（如 `engine` prop）——items 是唯一入口。

---

## 3. DOM 位置

**结论：节点放在布局层——`App.tsx` 渲染树的 `.app` 直接子级、各屏 fragment 之后、
浮层（sheet/dialog）之前。不改 `CalendarScreen.tsx`、不改 `ProfileScreen.tsx`。**

### 3.1 插入点

```tsx
// src/App.tsx —— 现 :278（screen 三元链收尾 `)}`）与 :280（`sheet === 'import'`）之间
{showBand ? <Readouts screen={screen === 'calendar' ? 'cal' : 'me'} items={readoutItems} /> : null}
```

即最终 DOM：`<div class="app"> · <header.topbar> · <main.app__main> · <div.readouts[data-readouts-screen]> · (浮层)`。
首页节点位置不动（`.app` 内 header 与 main 之间，`StudyScreen.tsx:78`），由皮肤 CSS
决定沉底——vinyl 用 `order` 交换（`vinyl.css:178、:180`），这不是 fixed。

否决过的两个位置：
- **`.app__main` 内部底部**：它在滚动容器里，随内容滚走，不是「常驻」。
- **各屏组件内部**：要动 `CalendarScreen.tsx:259`、`ProfileScreen.tsx:382` 两个文件加
  `readouts` prop 透传，皮肤判断向业务组件渗透，revert 面更大。布局层方案下这两屏
  **零 diff**。

### 3.2 不破坏 scroll-snap 内衬

- 全站 scroll-snap 容器只有三处，全在 vinyl、且全在 `.app__main` **内部**：
  今日卡轮 `vinyl.css:275-294`、日历读数轮 `vinyl.css:786-811`（`scroll-snap-type: x
  mandatory` + `scroll-padding-inline` 成对声明 :799-800）、胶囊轮
  `vinyl.css:1107-1136`（`x proximity`）。
- 带子是 scroller 的**兄弟**（`.app` flex 列最后一个非滚动子元素），与
  `.answer-dock / .dock` 同层同级——这正是 vinyl 自己的吸底定式：
  「常驻带 = `.app` flex 列最后一个非滚动子元素 → 天然吸底，绝不写 fixed」
  （`vinyl.css:489-490`）。兄弟节点改变不了轮内 padding/scroll-padding——**内衬归轮
  自己管**（负 margin 出血 + 长手式 `padding-inline-start/-end`，`vinyl.css:289-292`）。
- padding 归属核对：左右衬 = `.screen { padding: 0 var(--page-x) … }`（`app.css:128-130`）；
  带子左右衬用 `--page-x`（vinyl 现例 `vinyl.css:185`），纵向滚动余量归 `.app__main`
  （`app.css:108-117`）。带子占走的只有视口高度（见 §4 预算），不动任何一层 padding。
- 唯一联动：`.app__main` 可视高度变小 → 日历屏纵向更「有得滚」。检查项：滚动条出现
  与否只影响 `room` 指标（`audit-screens.js:96、:105`），非门禁。首页不受影响——
  desk 的 `min-height: calc(100dvh - …)` 只锚 `.start`（`desk.css:114`），cal/me 两屏
  没有该算式；vinyl 首页带本来就在（`vinyl.css:177-189`），本次只增 cal/me。

### 3.3 不触发新的出列裁切（390 / 360 宽度预算）

带子内容（vinyl，沿用首页带现规格 `vinyl.css:184-208`）：
`--page-x` 20×2（tokens.css:72）之外可用 390→350、360→320。占宽清单：

| 项 | 宽 | 出处 |
| --- | --- | --- |
| 左缘伪圆盘 | 26px + gap 16 | vinyl.css:192-201、:184 |
| 「批数」格（列向，k 14px×2字≈28 / v 18px mono×2位≈24） | ≈28 | vinyl.css:202-208、:80 |
| 分隔 border + padding-left | 1 + 16 | vinyl.css:203 |
| 「已学」格（3 位 ≈33；5 位极端 ≈55） | ≈33–55 | 同上 |
| 呼吸点 | 7（margin-left:auto 自吸右缘） | vinyl.css:210-219 |
| **合计** | **≈143（极端 ≈165）** | 360 档余量 ≥155 |

「今日」格被 vinyl nth-child 关掉（`vinyl.css:190`），desk 非首页带建议同法只留两格
（见 §4.3），三格全开时 desk 手机档合计 ≈120（值 20px、标签 13px，同表算法），仍富余。
出列判据复述：横/纵向被 `hidden/clip` 祖先永久裁掉且祖先不可滚才记 `out/outY`
（`audit-screens.js:33-45、:74-83`）；带子是定高 flex 行、`overflow` 一律
`visible`（**禁止**给带子或 `.readout` 写 `overflow:hidden`——desk 抽屉那条
`desk.css:277` 的 `overflow:hidden` 不外推到新带），故无新裁切面。
`vinyl.css:238-239` 那种「`overflow:hidden + ellipsis` 且文本不承载独有信息」的既有
豁免不在带子上使用——带子文本本就不换行也不截断。

---

## 4. 360 降级

**结论：降级写死在两套皮肤 CSS 里，断点用 `@media (max-width: 389px)`（与 vinyl 首页带
的既有档位 `vinyl.css:404` 对齐；另一先例 374px 见 `bento.css:736`、`instrument.css:1329`，
取哪个见「待拍板」）。降级形态 = 单行紧凑态（k/v 同排基线对齐，即 vinyl 矮屏定式
`vinyl.css:431-437` 的宽度版复刻），只收 gap 与 padding，**绝不靠
`overflow:hidden` 裁**。**

### 4.1 vinyl（`src/styles/skins/vinyl.css` 末尾追加）

```css
/* cal/me 常驻带（v11 开关 persistentReadouts）：宽档直接吃 §6 首页带语法
   （[data-skin='vinyl'] .readouts 本就不限屏，vinyl.css:179），此处只管 ≤389 降级：
   单行紧凑态，仿矮屏定式 vinyl.css:431-437，禁 overflow:hidden。 */
@media (max-width: 389px) {
  [data-skin='vinyl'] .readouts[data-readouts-screen='cal'],
  [data-skin='vinyl'] .readouts[data-readouts-screen='me'] {
    gap: var(--space-3);                 /* 12：tokens.css:65，首页带现 16→12 */
    padding: 7px var(--page-x) calc(7px + env(safe-area-inset-bottom)); /* 同 vinyl.css:435 */
  }
  [data-skin='vinyl'] .readouts[data-readouts-screen='cal'] .readout,
  [data-skin='vinyl'] .readouts[data-readouts-screen='me'] .readout {
    flex-direction: row;                 /* 两行柱 → 单行：k 与 v 基线齐 */
    align-items: baseline;
    gap: 6px;                            /* 照抄 vinyl.css:436 */
  }
}
```

降级档数值表（360 宽）：

| 属性 | 值 | 依据 |
| --- | --- | --- |
| 带总高 | ≈33px（7 + 18 + 7 + 1px 上缘线） | vinyl.css:185、:205-208、:435 同构 |
| 标签字号/行高 | 14px / 1（`--vy-label`） | vinyl.css:80「含中文文本硬下限」；2 字不触发 >4 汉字线（audit-screens.js:59） |
| 数值字号/行高 | 18px / 1，mono tabular | vinyl.css:205-208 不变 |
| 格间距 / 内距 | gap 12；padding-inline 20（`--page-x`） | tokens.css:65、:72 |
| 触控盒 | **不适用——豁免**：带内零交互元素。探针 44px 检查只圈 `button,a,input,select,[role=…],textarea`（`audit-screens.js:65-73`），纯 div/span 不在其列。带子本身可点跳转**本 commit 禁止**（见「待拍板 #5」） | |

### 4.2 desk 手机档说明

desk 现状首页手机屏本就无带（`.readouts` 显示规则只活在 ≥768 抽屉段
`desk.css:265-310`），本 commit 的 desk 带**只挂 cal/me**，由 `data-readouts-screen`
限定，首页 DOM 节点依旧被 `skin-hooks.css:13` 盖住——desk 首页观感零变化。

**已拍板（#4）并接受为已知代价**：desk 会出现「首页无带、日历 / 我的有带」的不对称。
本 commit 不开 desk 首页手机档的显示规则（那是对 desk 首页的改版，越界）；若要统一，另立 issue 单独做，
**不得夹带进 commit B**（§7.2）。

### 4.3 desk（`src/styles/skins/desk.css` 末尾追加，非首页段 §10 之后）

```css
/* cal/me 常驻读数带：手机与平板同一横条语法（≥768 不复制抽屉网格——
   那是 .app:has(.start) 专属，desk.css:268-271 注释言明）。
   深色 rail 条 + 1px 上线分界，沿用「线代影」纪律（desk.css:255、:324、:344-346）。 */
[data-skin='desk'] .readouts[data-readouts-screen='cal'],
[data-skin='desk'] .readouts[data-readouts-screen='me'] {
  display: flex; align-items: center; gap: var(--space-4);
  padding: var(--space-2) var(--page-x) calc(var(--space-2) + env(safe-area-inset-bottom));
  background: var(--rail); border-top: 1px solid var(--ds-rail-edge); /* desk.css:48-50 令牌 */
  flex: none;
}
/* 「今日」与日历 hero 大数（CalendarScreen.tsx:157-164）、我的页当前基线
   （ProfileScreen.tsx:243-244）复读，关格——与 vinyl.css:190、desk.css:300 同纪律 */
[data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout:first-child,
[data-skin='desk'] .readouts[data-readouts-screen='me'] .readout:first-child { display: none; }
[data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout,
[data-skin='desk'] .readouts[data-readouts-screen='me'] .readout {
  display: flex; flex-direction: column; gap: var(--space-1);
}
[data-skin='desk'] .readouts .readout__k {
  font-family: var(--font-mono); font-size: 13px; line-height: 1; /* 抽屉同律，desk.css:301-305 */
  letter-spacing: 0.1em; color: var(--ds-rail-muted);             /* 6.91–6.98:1 on --rail，desk.css:86 */
}
[data-skin='desk'] .readouts .readout__v {
  font-family: var(--font-mono); font-size: 20px; line-height: 1; /* 抽屉 34px 是大栏专属；带内收小 */
  font-variant-numeric: tabular-nums; color: var(--ds-rail-ink);  /* 13.98/15.89:1，desk.css:86、:308 */
}
@media (max-width: 389px) {
  [data-skin='desk'] .readouts[data-readouts-screen='cal'],
  [data-skin='desk'] .readouts[data-readouts-screen='me'] { gap: var(--space-3); }
  [data-skin='desk'] .readouts[data-readouts-screen='cal'] .readout,
  [data-skin='desk'] .readouts[data-readouts-screen='me'] .readout {
    flex-direction: row; align-items: baseline; gap: 6px;
  }
}
```

降级档（360）：带总高 ≈36px（8 + 20 + 8 + 1）；标签 13px（2 字，>4 汉字红线结构性
不触发）、数值 20px；触控盒豁免理由同 §4.1（带内无交互元素）。宽度预算见 §3.3 表，
余量 ≥180px。**强调色纪律**：desk 带只用 rail 中性色，不引 `--accent`（本案强调色 ≤1，
`desk.css:364-365` 已把 accent 花在头像上）；vinyl 带只复用既有 `--accent` 呼吸点
（`vinyl.css:210-218`），无新增色相。**字体族 ≤2**：两案带内均 mono + 既有正文族，
零新族（vinyl 现例 `vinyl.css:202-208`；desk 现例 `desk.css:303、:306`）。

---

## 5. 回归矩阵

**结论：日历 × 我的 × 8 皮肤 × 明暗 = 32 组 ×2 视口（390×844 / 360×740）= 64 个带断言
测点；外加首页对照组 8×2×2=32（验证「首页行为零变化」）；mistakes/session 各抽
desk+vinyl×明暗做「节点必须不存在」反例。合计 ≥96 测点。**

### 5.1 每测点必查项（对齐 audit-screens.js 指标语义）

| 检查 | 判据 | 出处 |
| --- | --- | --- |
| 横向溢出 | `document.scrollWidth <= clientWidth` | `audit-screens.js:105 ovf`、:159 |
| 真实叠色对比度 | 正文 ≥4.5，≥24px 或 ≥18.66px+700 ≥3；背景要沿祖先链叠色算 | `audit-screens.js:24、:57、:61` |
| 触控盒 | 任何 `button/a/input/[role]` min(w,h) ≥43.5；**带子应无此类元素**（出现即违规） | `audit-screens.js:65-73` |
| 出列裁切 | `nOut=0` **且 `nOutY=0`**；注意现脚本 `bad()`（:159）不含 `nOutY`，outY 只在汇总出现（:161）——本 commit 必须人工/新脚本把 `nOutY` 当门禁 | `audit-screens.js:74-83、:159-161` |
| 裁切豁免口径 | 只有 `(auto|scroll)` 且 `scrollWidth>clientWidth` 的真可滚祖先可豁免 | `audit-screens.js:33-45` |
| snap 内衬 | 三处 snap 轮 `scrollLeft` 复位后归 0、`scroll-padding` 未被改写 | `vinyl.css:275-294、786-811、1107-1136` |
| >4 汉字 ≥14px | 带内结构性免疫（标签 2 字），全页仍须 0 命中 | `audit-screens.js:58-59`；`scan-tiny.js:20` |
| 数据不变式 | 双键快照-还原（§6） | `audit-screens.js:148-153` |

⚠ **探针盲区必须补**：带子整棵子树是 `aria-hidden="true"`，`audit-screens.js:51` 对
`closest('[aria-hidden="true"]')` 直接 `continue`——对比度/字号/触控检查**根本不会看带子
内容**。所以带子的「今日/批数/已学」文本对比度必须用 §5.3 的专项断言（绕开该豁免）测，
不能拿 `audit-screens` 绿了当通过。`scan-tiny.js:8` 的 scope 虽含 `.readouts *`，但
:9 同样跳过 aria-hidden——同一盲区。

### 5.2 开关真值表（DOM 存在性，非 display）

期望节点存在 ⇔ `persistentReadouts(skin) === true && screen ∈ {cal, me}`：

| screen | paper | foundry | instrument | broadsheet | bento | nocturne | desk | vinyl |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 有(藏) | 有(藏) | 有(显) | 有(藏) | 有(显) | 有(藏) | 有(<768藏 / ≥768显) | 有(显沉底) |
| cal | **无** | **无** | **无** | **无** | **无** | **无** | **有(显)** | **有(显)** |
| me | **无** | **无** | **无** | **无** | **无** | **无** | **有(显)** | **有(显)** |
| mistakes / session / sheet | 恒无（本 commit 不在开关范围） ||||||||

「有(藏)」= 节点在 DOM 但被 CSS 隐藏——这是**首页**的历史现状（所有皮肤首页都渲染节点，
`skin-hooks.css:13` 盖住），不在本次改动面；**cal/me 两列必须是「无」**，即 false 皮肤连
隐藏节点都不许有，这就是开关存在的意义，也是断言的抓手。

### 5.3 可直接实现的断言（新增 `scripts/audit-readouts-band.js`，写法沿用 audit 家族）

```js
async (page) => {
  // 用法同 audit-screens：__audit_prefix 等；键位纪律同 :148-153，双键快照-还原。
  const SKINS = ['paper','foundry','instrument','broadsheet','bento','nocturne','desk','vinyl'];
  const EXPECT = new Set(['desk','vinyl']);            // 与 skins.ts 的 true 集同步，改一处必改两处（见待拍板#3）
  const snaps = [];
  const snapOf = () => page.evaluate(() =>
    [localStorage.getItem('cijian.v1'), localStorage.getItem('cijian.scheduler.v1')].join('\u0000'));
  for (const screen of ['cal','me']) {
    for (const skin of SKINS) for (const theme of ['light','dark']) {
      for (const [w,h] of [[390,844],[360,740]]) {
        await setSkin(skin, theme, w, h);              // 同 audit-screens.js:107-113
        await goto(screen);                            // 同 :114-125：cal 点「学习日历」、me 点 .avatar-btn
        const before = await snapOf();
        const r = await page.evaluate(() => {
          const el = document.querySelector('.app > .readouts');
          if (!el) return { present: false };
          const cs = getComputedStyle(el), b = el.getBoundingClientRect();
          const m = document.querySelector('.app__main').getBoundingClientRect();
          // 绕开 aria-hidden 豁免的专项对比度：沿 bgo() 链（抄 audit-screens.js:19-24）
          return { present: true, screen: el.dataset.readoutsScreen,
            shown: cs.display !== 'none' && b.width > 1 && b.height > 1,
            belowMain: b.top >= m.bottom - 1, inX: b.left >= 0 && b.right <= innerWidth,
            vals: [...el.querySelectorAll('.readout__v')].map(v => v.textContent),
            inter: el.querySelectorAll('button,a,input,[role]').length };
        });
        const want = EXPECT.has(skin);
        snaps.push({ skin, theme, w, screen,
          nodeOk: r.present === want,                          // false 皮肤：DOM 里必须查无此节点
          shownOk: !want || (r.shown && r.belowMain && r.inX), // true 皮肤：可见、沉底、不出列
          valsOk: !want || r.vals.every(v => /^\d+$/.test(v)), // 无 NaN/undefined/空
          noInter: !want || r.inter === 0,                     // 带内零交互（§4 豁免成立的前提）
          dataKept: (await snapOf()) === before,               // 本矩阵全程不答卡，理应逐字节相等
        });
        await page.goto('http://127.0.0.1:5173/');             // 回首页再切皮肤
      }
    }
  }
  // 反例：mistakes / sheet 屏永无节点；首页节点 8 皮肤恒存在
  // 汇总 bad: any(!nodeOk || !shownOk || !valsOk || !noInter || !dataKept)
};
```

同时跑既有门禁（不改动脚本本体）：`audit-screens.js` 配置
`__audit_skins='[...全部8套]'`、`__audit_screens='["home","cal","me"]'`、
`__audit_vps='[[390,844],[360,740]]'`、`__audit_prefix='vB'`——
`nLow/nSmall/nOut/nClip/nTiny/maxGap/cta/snapped` 全 0 之外，**人工核 `outYTotal`（:161）
必须为 0**。`audit-phases.js`、`scan-tiny.js`、`diff-report.js` 照旧各跑一遍作旁证。

---

## 6. 数据隔离

**结论：本 commit 不答卡，但所有验证脚本仍按 `audit-screens.js:148-153` 的双键纪律
`cijian.v1` + `cijian.scheduler.v1` 快照-还原（键名出处：`src/lib/storage.ts:3`、
`src/lib/scheduler/storage.ts:28`）。带子必须是纯只读节点，让「点带子写库」这条路
在结构上不存在。**

可能意外写库的步骤（逐条排查）：

1. **引擎 boot 结算**：每次页面加载 `useScheduler` 都会 `seed → startOfSession →
   saveScheduler`（`src/hooks/useScheduler.ts:43-48`）——同学习日内幂等，但**审计跨过
   凌晨 4 点换日线**（`studyDay` 边界，见 `CalendarScreen.tsx:156` 文案「凌晨 4 点换天」）
   时 `startOfSession` 会真结算并落盘。对策：测前记录 `engine.today()`，若中途换天则
   重取基线快照再比。
2. **60 秒 / visibilitychange / focus 轮询**：`rollOver` 同理会写库
   （`useScheduler.ts:100-112`）；脚本切视口、切页都可能触发 visibility 事件——归入
   上一条同一对策。
3. **400ms 防抖落盘 + pagehide 强制 flush**：任何 `run()` 之后 400ms 内关页面都会把
   挂起状态写下去（`useScheduler.ts:61-75、:116`）。本矩阵不该有 `run()`，出现 diff
   即说明有步骤误触了交互件——按 FAIL 追凶，不许顺手 restore 掩盖。
4. **我的屏交互区**：步进器「每日目标 ±5 / 上限 ±5」（`ProfileScreen.tsx:252-267、
   :288-303` → `App.tsx:262-263` → `scheduler.run`）、危险区「清空」
   （`ProfileScreen.tsx:372` → `App.tsx:179-186` `resetLearning+seed`）。**探针只做
   DOM 查询，绝不做坐标点击**；带子恰好贴底，若将来给它加可点区，坐标类脚本最易
   误击下方的 372 清空钮——这是 §4「带内零交互」的第二条理由。
5. **导航本身**：进 cal 点的是今日卡文字链（`TodayCard.tsx:50-52`，`go('cal')` 匹配
   「学习日历」文本，`audit-screens.js:116`），进 me 点 `.avatar-btn`
   （`audit-screens.js:117`）——均为纯 setState（`App.tsx:240-244、:267`），不写库。
   注意：带子文案若含「学习日历」四字会污染 `go('cal')` 的按钮查找——现标签只有
   「今日/批数/已学」，无冲突，但改标签文案时必须复查 :116-123 的选择器。
6. **日历屏 CTA「开始背单词」**（`CalendarScreen.tsx:200-214`）：进 Session 会 boot 结算，
   本矩阵不点它；如需 session 屏反例，套用 `audit-screens.js:147-154` 的 session 档
   铁律（进入→截图→退出，不答卡）。
7. **`setSkin` 写 `cijian.v1`**（`audit-screens.js:110-113`）是**有意写入** profile；
   校验口径 = `cijian.v1` 除 `profile.skin/theme` 外逐字节不变 +
   `cijian.scheduler.v1` 全程逐字节不变。
8. `saveStore(store)` 每次 store 变化都落盘（`App.tsx:38-40`）——本 commit 无新增
   store 写入点（`showBand` 是纯派生值，不进 store），审查 diff 时确认没人把它
   `useEffect` 化。

---

## 7. 回滚粒度

**结论：commit B = 单一原子提交，允许文件 8 个；`git revert <sha>` 一键回全（新文件随
revert 删除，CSS/TSX 改动互不依赖 commit 外未提交内容）；revert 后首页行为逐字节不变
（首页 DOM 类名结构未动，只是搬进同构组件）。**

### 7.1 允许包含的文件（逐条）

| # | path | 改动 |
| --- | --- | --- |
| 1 | `src/lib/skins.ts` | `SkinMeta` 加 `persistentReadouts: boolean`（必填）+ 8 条取值 + `persistentReadoutsFor()` |
| 2 | `src/components/Readouts.tsx` | 新文件：`ReadoutItem/ReadoutsProps/buildReadoutItems/Readouts`（§2.2 契约） |
| 3 | `src/components/StudyScreen.tsx` | `:78-91` 内联段 → `<Readouts screen="home">`；props 增 `readouts?: ReactNode` 或 items 直传（二选一，见待拍板#2 附注） |
| 4 | `src/App.tsx` | 计算 `readoutItems/showBand`（`:68` 后）、`Readouts` import、在 `:278` 后插入带节点、首页传 items |
| 5 | `src/styles/skins/desk.css` | 末尾追加 §4.3 两块（cal/me 带 + ≤389） |
| 6 | `src/styles/skins/vinyl.css` | 末尾追加 §4.1 ≤389 块（宽档白吃 `vinyl.css:179` 既有规则，首页段一字不改） |
| 7 | `scripts/audit-readouts-band.js` | 新文件：§5.3 断言脚本（只读验证，不改既有脚本） |
| 8 | `docs/COMMIT_B_SPEC.md` | 本文件（与实现同 commit，revert 连规约一起回） |

**明确不改**：`CalendarScreen.tsx`、`ProfileScreen.tsx`、`src/lib/types.ts`、
`src/lib/storage.ts`、`src/lib/scheduler/**`、`app.css`、`skin-hooks.css`、
`tokens.css`、其余 6 套 skin CSS、`main.tsx`、`scripts/audit-screens.js`、
`audit-phases.js`、`scan-tiny.js`、`diff-report.js`。

### 7.2 不许夹带（清单即纪律）

- 排印提档：任何 `--vy-label` / `--ds-*` / tokens.css 字号档位调整、其他皮肤的小字提档。
- `skins.ts` 的 `tagline`/`swatch` 文案改动（哪怕顺手改「抽屉 · 侧栏」措辞）。
- `audit-screens.js` 的既有缺陷修复（最典型：`bad()` 不含 `nOutY`，:159——留作独立
  commit；本 commit 用 outYTotal 人工核 + 新脚本门禁代替）。
- `aria-hidden` 探针豁免（audit-screens.js:51）的改造——新脚本单独绕，不动共享件。
- nocturne「首页其实也藏带」（nocturne.css:135）之类的行为纠偏。
- 任何 scheduler / 数据模型改动（`cijian.scheduler.v1` 结构零变化是本 commit 的前提）。
- SessionScreen / MistakesScreen 带子扩展、带子可点化、desk 首页手机档开带——全部推后。

自证独立：commit B 的 diff 里 `git revert` 后 `pnpm build` 通过 + 首页审计与 B 之前
`diff-report.js` 逐字节一致（首页/其他皮肤 DOM 未动），即「不依赖未提交改动」。

---

## 待用户拍板汇总（2026-11-25 已全部拍板：**六项全按推荐**）

> **拍板记录**：① cal/me 用首页同三项「今日/批数/已学」，不为备选新开两屏 props；② 首页走 App 传 `items` 数组，
> `ReactNode` 槽位因「不可审计」否掉；③ 360 断点取 `max-width:389px`（vinyl 本尊档位），374px 太窄；
> ④ **desk 首页手机档本次不动，接受「首页无带、日历有带」的不对称**——作为已知代价记录在下，要改另立 issue，不混进 B；
> ⑤ 带子禁止可点；⑥ 真值表走新独立脚本 + 手抄常量 + `SKINS.length===8` 兜底断言。

**两条完成硬条件（用户原话：不做不算完成）**：

- **H1 · 带内必须显式探针**。首页 `.readouts` 带 `aria-hidden="true"`（`StudyScreen.tsx:78`），
  而 `audit-screens.js:51` 对 `closest('[aria-hidden="true"]')` 的节点整棵跳过 → 既有探针**看不见带子里任何东西**。
  `scripts/audit-readouts-band.js` 必须自己把带子子树逐个节点量一遍（横向/纵向溢出、真实叠色对比、截断、字号），
  不能靠复用 `audit-screens.js` 的结果蒙过。
- **H2 · 44px 豁免必须写明理由**。带内零交互元素是豁免依据，不是沉默放过：断言脚本里必须显式产出
  `interactiveInBand === 0`（实测值）与注释形式的豁免理由，一旦带内出现任何 `button / a / input / [onclick] /
  cursor:pointer`，脚本立即 fail，而不是继续走豁免分支。

| # | 事项 | 推荐 | 备选 |

| --- | --- | --- | --- |
| 1 | cal/me 带内三项取什么 | **与首页同三项「今日/批数/已学」**（App 现成值，零新布线，desk/vinyl 各藏一格已有 nth-child 先例） | 日历换「到期/逾期/连续」、我 的换「错词/未学」——需新开 props（`engine.calendarView` 字段 / `batchSize` 透传），文件面扩大到 §7.1 之 5、6 两屏组件 |
| 2 | 首页 `StudyScreen` 接法 | **App 传 items 数组**（`readouts?: ReactNode` 槽位模式见 App.tsx:221 先例，但 items 更利于审计直查） | 传 `readouts` 节点（与 todayCard 同构，DOM 相同，仅 props 形异） |
| 3 | 360 断点数值 | **`max-width: 389px`**（vinyl 本尊档位，vinyl.css:404/:1210） | `374px`（bento.css:736 / instrument.css:1329 先例）；360 视口两者同效，389 顺带覆盖 375–389 机型 |
| 4 | desk 首页手机档要不要也显形读数带 | **本次不动**（首页 DOM 节点一直在，只欠一条非 `:has(.start)` 的显示规则——但那是对 desk 首页的改版，越出 commit B 边界；副作用是 desk「首页手机无带、日历有带」的不对称，需产品确认接受） | 同 commit 顺带开——违反 §7.2 不夹带纪律，应另立 commit |
| 5 | 带子要不要可点（点带跳首页） | **禁止**（一旦引入 `<button>`，44px 触控门禁、误击 372 清空钮、`go()` 文本查找污染三连至，§6.4/§6.5；留作后续 commit） | 加，同时把高度提至 ≥44px 并重跑全部触控矩阵 |
| 6 | 真值表同步方式 | **新独立脚本 + 常量表**（`EXPECT` 手抄 skins.ts；两处在 CI 外，改皮肤时人工同步并靠 `SKINS.length===8` 断言兜底） | 改 `audit-screens.js` 让 PROBE 顺手返回 `band` 字段——被 §7.2 禁（那是审计脚本改造，独立 commit 做） |

---

## 实现清单（按序；每步一文件）

1. `src/lib/skins.ts` — `SkinMeta` 加必填 `persistentReadouts: boolean`；8 条目按 §1.3
   取值表补齐（此时 `tsc` 应立刻在 6 个漏写项上报错——这正是必填而非可选的理由）；
   文件尾加 `persistentReadoutsFor()`。
2. `src/components/Readouts.tsx` — 新文件，§2.2 全文（类型 + `buildReadoutItems` +
   渲染体；渲染体类名必须与 `StudyScreen.tsx:78-91` 逐字同构）。
3. `src/components/StudyScreen.tsx` — 删 `:78-91` 内联块，换成
   `<Readouts screen="home" items={…} />`（items 经新 prop 传入）；其余行零动。
4. `src/App.tsx` — import `Readouts/buildReadoutItems/persistentReadoutsFor`；
   `:68` 后加 `readoutItems`（useMemo）与 `showBand`；`:278` 后插带节点；给
   StudyScreen 传 items。**自查**：`git diff` 里 CalendarScreen/ProfileScreen 不存在。
5. `src/styles/skins/vinyl.css` — 只在文件末尾追加 §4.1 的 ≤389 块；首页段
   （177-219）一字不改。
6. `src/styles/skins/desk.css` — 末尾追加 §4.3 两块；≥768 抽屉段（265-321）一字不改。
7. `scripts/audit-readouts-band.js` — §5.3 断言脚本（含双键快照-还原与
   `SKINS.length===8` 防漂移断言）。
8. `docs/COMMIT_B_SPEC.md` — 本文件定稿（若拍板项有改，先改规约再改码）。
9. 验证顺序（全部通过才算完）：
   a. `pnpm tsc --noEmit`（或仓库现有 typecheck）——开关字段穷尽性；
   b. `scripts/audit-readouts-band.js`：64 测点 `nodeOk/shownOk/valsOk/noInter/dataKept` 全真；
   c. `audit-screens.js`（8 皮肤×明暗×[home,cal,me]×[390,360]，`__audit_prefix='vB'`）：
      既有 bad() 全 0 且 `outYTotal===0`、`dataKept` 全真；
   d. `scan-tiny.js`、`audit-phases.js`、`diff-report.js` 对照跑，无新增命中；
   e. 人工抽查截图 `vB-desk-cal-dark-360.png`、`vB-vinyl-me-light-360.png`
      各明暗两张，核对带子贴底、safe-area 不压字。
10. **完成判定**：§5.2 真值表逐格命中（false 皮肤 cal/me `querySelector` 为 null——
    注意是「查无节点」不是「不可见」）；带内三项与首页同屏数值一致（同源断言）；
    首页与其余 6 皮肤任何界面截图与 commit A 基线逐像素域无 diff（带子未引入时）；
    `git revert` 演练一次后重跑 c 通过。
