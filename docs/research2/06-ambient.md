# 06 · 天气 / 时钟 / 表盘领域调研 —— glanceable 骨架拆解

> 领域调研员笔记。视角只有一个：**一瞥即读（glanceable）的版面骨架**——焦点放在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。不谈配色情绪。
> 对象：Carrot Weather、彩云天气、Wildfire/Watch Duty 类火灾天气应用、Nothing OS、Fossil/Amazfit 表盘、Apple Watch Smart Stack。
> 每节后附「→ 词笺 css_only」：在词笺首页既有 DOM（见 `docs/SKIN_BRIEF.md` §1–2）上、**纯 CSS** 可复刻的骨架手段。词笺前提：`.start__title` 与 `.start__lede` 一律 `display:none`（用户要求删除大标语和玩法段），所有方案均以此为起点。

---

## 0. 领域总纲：这类产品的五条结构公理

1. **首页只回答一个问题。** 天气 app 回答「现在多少度 / 几点几分下雨」，表盘回答「现在几点」。这个答案被放到极端字号（84px+ 占首屏 1/3 高），其余一切降一级。Brainy 的重设计对照：温度 52→84px、明细磁贴 9→4、预报行 10→3，原则是「决定首页是干嘛的，把那一个答案放到一臂之外也能读的尺寸，其余数据发给第二屏」。
2. **用形状代替心算。** 多天温度差靠每行一根共享刻度的范围条，不用读者自己减；进度靠表盘外圈 60 个刻度、子盘的弧、智能手表的活动圆环。数字并列是草稿，数字折进形状才是成品。
3. **数据按「值得抬腕」出现，不是按存在出现。** Smart Stack 的 watchOS 26 用「高置信度」阈值决定哪张卡值得出现在表盘第一眼；Carrot 允许用户自己排序/固定卡片。首页密度 = 相关性排序的结果，不是数据集的全貌。
4. **CTA 在 glance 距离内只有一个。** 表盘的世界是「表冠 + 一块屏」：操作永远是单一主按钮（Watch Duty 类是底部表页、天气类是铺满宽度的动作条），没有并排二级按钮的余地。
5. **小标签是刻印，不是正文。** 表盘把 `SUN 24 / MON 2`、`UV 6` 这类拉丁/数字 micro-cap 当装饰性刻印用，9–12px 也成立。词笺硬约束（成句中文 ≥14px）意味着这条只能用在数字与拉丁标签上，中文小字必须留在 14px 档——抄结构，别抄字号。

---

## 1. Carrot Weather —— 可自排的单屏卡片流

**structure**：4.0 版重设计的目标被开发者明说为「把所有重要细节放在同一屏可见」：一屏纵向滚动的卡片流——顶部当前状况 hero（地点+巨温+天况），紧接小时预报（6.0 起改成**折线图卡**，temperature/precip 各一条线），再往下是逐日行、风/湿度/UV 明细卡。关键结构决策：**卡片顺序由用户在 Layout 编辑器里自己排**（可增删、重排、换设计，另有 Layout Gallery 预置布局），首页没有「设计师定的顺序」，只有「你今天关心什么什么在上」。iPad 版做双栏：左列预报右列地图，主栏永远是窄的那列。

**surfaced**：一张屏内聚合「现在 + 今天 + 接下来」全部核心读数；小时趋势用图形（线）而不是行。

**hidden**：数据源选择、单位开关、通知、雷达细节全部退到设置层；hero 卡上不放时间戳（「精确到秒的更新时间没人用来决定穿什么」）。

**→ 词笺 css_only**：卡片流密度的复刻——`.start__body { display: contents; }` 把 `.start__meta`、`.today-card`、`.start__spec` 提为 `.start` 的平级 grid 行（`grid-template-rows: auto`，gap 12px），每块 `border: 1px solid var(--border)` 成横卡；`.start__spec` 开成「Carrot 式趋势行」：`.start__spec-row { display: grid; grid-template-columns: 6.5em 1fr; align-items: baseline; }`，`.start__spec-v::after { content: ""; grid-row: 2; height: 6px; background: linear-gradient(90deg, var(--accent) var(--carrot-bar, 62%), var(--surface-sunken) 0); }`（静态装饰刻度即可，别试图映射真数据——无 JS）。360px 下 `.today-card__figures { display: grid; grid-template-columns: repeat(2, 1fr); }` 四 figure 走 2×2 而非 4 列，数字用 `font-variant-numeric: tabular-nums` 防跳宽。

## 2. 彩云天气 —— 首屏一句话答案 + 全屏雷达带 + 底部时间轴

**structure**：首页被明确切成「上下两屏」：第一屏人人能读——**顶部横幅就是答案本身**（「23 分钟后开始下雨」倒计时条，贴在状态栏正下方，是全页第一优先级），中部超大温度 + 降雨量随时间变化的可视化，第二屏才是专业雷达动图（过去 2 小时回波、降雨带移动方向）。滚动结构三段式：**答案句在最顶 → 可视化占据首屏视觉中心（全出血，非卡片）→ 底部时间轴滑块**（每格 6 分钟，横向拖动即换时刻）。点一下答案条才展开「起始/结束/峰值/可信度」明细——明细默认收着。

**surfaced**：只有一个数字问题（几点下雨）+ 一张动态图；小时级用曲线/色带表达。

**hidden**：未来几天、城市列表、湿度/气压等参数全部推到二级屏；专业图不解释就不给看。

**→ 词笺 css_only**：「答案条置顶」直接照搬：`.topbar__meta` 里 DOM 自带「今日 N 词」，`[data-skin] .topbar__meta { display: flex; position: fixed; top: calc(env(safe-area-inset-top) + 56px); left: 0; right: 0; z-index: 9; }` 做成彩云式横幅（accent-weak 底 + 单行大字），`.today-card__reason.is-* { display: block; }` 用 `:has()` 给 `is-ok/is-warn` 两档换条底色——这就是「首页第一优先级是一句话不是一个表」。「雷达带」用 `.today-card::before { content:""; position: absolute; inset: 0 auto auto 0; width: 100%; aspect-ratio: 2.4; background: repeating-radial-gradient(circle at 70% 120%, transparent 0 18px, color-mix(...) 18px 19px); mask-image: linear-gradient(...)}` 造同心回波纹。**底部时间轴**：`.today-card__figures { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; }`，每 figure `flex: 0 0 34%; scroll-snap-align: center;` + `::after` 刻度竖线（`repeating-linear-gradient(to right, var(--border) 0 1px, transparent 1px 25%)`）画共享基线。360px：横幅固定后给 `.screen` 补 `padding-top`，横向 overflow 只发生在 figures 内层，页面级零溢出。

## 3. Wildfire / Watch Duty 类火灾应用 —— 地图即首页，UI 全部悬浮

**structure**：这一族（Watch Duty、BC Wildfire Service、The Wildfire Tracker、WeatherAI 的火灾图改版）共享同一骨架：**首页 = 全屏地图画布，没有任何文档流**。信息以三个悬浮层出现：顶部警报 chip（按紧急度堆叠）、底部可上滑的列表页（每行同一模板：点+名+数值+时间，WeatherAI 明说「every data list on one consistent row layout」）、地图符号本身编码数据（标记大小=过火面积、颜色=状态，一眼分出 spot fire 和 megafire）。评论界总结其设计美德是「restraint and clarity」：不建仪表盘、不做装饰性数据大屏，密集地理信息只保留支持决策的那几层。**数据放首页，但以空间方式放**——你所在位置的火情第一优先，其余按距离/等级衰减。

**surfaced**：离我最近的危险 + 一个可直接行动的信号（疏散区/警报）。

**hidden**：统计、档案、图层管理、设置全部收进底部 sheet 的第二层；没有常驻侧栏。

**→ 词笺 css_only**：把首页做成「一张画布 + 悬浮层」：`.screen { position: relative; min-height: 100dvh; }`，背景用 SVG data-URI 等高线纹理（`background-image: url("data:image/svg+xml,...")`，纯装饰、无外链）；`.start__body { display: contents; }` + `.start { position: relative; }` 后，`.today-card { position: absolute; left: var(--page-x); right: var(--page-x); bottom: calc(var(--dock-height) + 12px); border-radius: var(--radius-lg); backdrop-filter: blur(8px); }` 变「底部上滑页」，`.start__actions { position: fixed; bottom: 0; left: 0; right: 0; z-index: 10; }` 内 `.btn--primary` 满宽 62px 高作行动条，`.start` 底部留 `padding-bottom: calc(var(--dock-height) + 24px)` 防遮挡。顶部警报 chip 用 `.start__kicker { display: inline-flex; position: sticky; top: 8px; }` 浮在画布上。360px 天然安全：全部悬浮层用左右 `var(--page-x)` 收边；注意 fixed 行动条与系统安全区、与既有 `.dock` 的让位关系要实测。

## 4. Nothing OS —— 单色网格 + 「At a Glance」大时钟

**structure**：首页网格纪律极强：等宽等距的图标格、few widgets / high-contrast text 的官方建议；「At a Glance」小部件是锁屏/首页的第一块——**超大时钟数字 + 一行日期 + 至多一条「下一事件/电量」**，纯文字当主视觉，没有插画的余地。点阵（glyph/dot-matrix）作为装饰语法只出现在刻印级细节。长按菜单行、文件夹面板都是**整屏宽的行**——一切容器要么满宽要么满格，没有第三种宽度。CMF/NotCustom 等模仿者总结其首页 =「big clock with the date, your next calendar event, battery or next alarm」，仅此四行。

**surfaced**：时间（绝对主角）+ 下一条日程 + 电量。三行字。

**hidden**：其它一切应用进抽屉；小部件默认克制到一两个，宁可没有也不要满屏卡片。

**→ 词笺 css_only**：读数三兄弟放大成首页主角：`.readouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border-block: 1px solid var(--border-strong); }`，`.readout__v { font: 700 clamp(40px, 15.6vw, 68px)/0.9 'IBM Plex Mono', monospace; letter-spacing: -0.03em; }`，`.readout__k { font-size: 11px; text-transform: uppercase; }`（键是「今日/批数/已学」两字中文，11px 违例——所以改成用 `::before` 写拉丁缩写刻印 `content: "TODAY"`，中文 `readout__k` 保持 `display:none`，正文级中文另给 14px 行）。标语删除后 `.start__kicker { display: block; }` 做「四级 · DAILY LIST」单行刻印头，`.start__actions` 满宽、按钮方角满格（`border-radius: 0`）呼应满宽行哲学。360px：15.6vw 单字约 56px，三列 6 字节（补零两位）恰好放下；若「已学 3846」四位则 `font-size: clamp(32px, 12vw, 68px)` 兜底。≤2 字体族：Mono 只给数字，中文继续系统字。

## 5. Fossil / Amazfit 表盘 —— 中央一个数，周边固定槽位

**structure**：Google Wear OS 设计原则把话说死：表盘是智能表第一层，人平均一天看表 150 次，**所以「时刻」必须是高度可见的第一元素**；Fossil/Amazfit 实操为：中央巨大时间（占表盘 50–60% 高，秒针/秒数降级为灰），外圈 60 个刻度环给「时间」提供形状语境，四周**固定数量的 complication 槽位**（nortow 式 Modular 面 = 6 槽，每槽 22 种数据选一或留空）——每个槽只允许一个「微标签+一个数」。混合表（Fossil Q Tailor/Grant）更极端：整块表盘就是机械针 + **一个子盘**，子盘用弧同时编码「步数进度」和「当前模式」。Amazfit 面的中间块可切「时间叠在 5 日预报上 / 时间单独超大」——即同一个槽位，密度由用户在一档里选择。

**surfaced**：每槽一个数；中央一个数。首页读数上限 = 槽位数（6）。

**hidden**：没进槽的数据等于不存在；换数据要进编辑器（第二层动作）。

**→ 词笺 css_only**：径向表盘骨架：`.today-card { position: relative; }` + `.today-card::after { content: ""; position: absolute; inset: 12%; border-radius: 50%; background: conic-gradient(var(--accent) calc(var(--am-arc, 62) * 1%), var(--surface-sunken) 0); mask: radial-gradient(circle, transparent 0 78%, #000 78.5%); pointer-events: none; }` 做进度环（环宽靠 mask 调），环心放第一个 figure：`.today-card__figures { display: grid; place-items: center; }`，`.today-card__figure:nth-child(1) { grid-area: 1/1; font-size: min(26vw, 110px); }` 居中，其余三个 `nth-child(2..4) { grid-area: 1/1; }` 再用 `transform: translate(±40%, ...)` 或四个 `align/justify-self` 推到 12/3/6/9 点位当 complication，`<b>` 22px + 标签 11px（数字/拉丁刻印）。刻度环装饰：`repeating-conic-gradient(var(--border-strong) 0 0.5deg, transparent 0.5deg 6deg)` + 同款 mask 细环。**360px 关键**：环形布局整体给 `.today-card` 定 `aspect-ratio: 1; max-width: min(88vw, 340px); margin-inline: auto;`，点位 transform 用 `%`（相对自身）而非 px，环随卡缩放不溢出；被推到点位的 figure 文案若换行需 `width: 4.5em; text-align: center` 锁形。

## 6. Apple Watch Smart Stack —— 堆叠：一次只看一张，出现才值得

**structure**：表盘 complication 是「静态槽位」，Smart Stack 是它的动态版：**一竖摞卡片，任何瞬间只有顶卡完整可见**，下面的卡只露边缘（上滑翻卡）。顺序由系统按情境+习惯预测决定（watchOS 26 的 High Confidence 阈值：没网时自动把 Backtrack 提前、落地日本就弹翻译卡——**在合适的时机出现，而不是全部在场**；出现频率极低但准）。每张卡按 4 秒内读完设计：一个数字 + 一行语。Siri Modular 表盘把这个结构固化成版式：顶部一行线状 complication、中央大号时间、一条宽 suggestion 卡、底部三个圆形 complication——**行的宽度和形状本身就是层级**（线状=状态，宽卡=建议，圆点=快捷）。

**surfaced**：一次一张「此刻最相关」；顶卡即首页。

**hidden**：其余卡片在堆里，滑过才算看过；不相关时整摞都不出现（反注意力设计）。

**→ 词笺 css_only**：纯 CSS 的「卡片堆叠滚动」用 sticky 实现：`.start__body { display: contents; }`，`.start { display: grid; }`，把 `.start__meta`、`.today-card`、`.start__spec` 各设为满宽卡（`grid-row: 1;` 不行——用顺序 sticky）：`.today-card { position: sticky; top: calc(env(safe-area-inset-top) + 64px); z-index: 3; }`，`.start__spec { position: sticky; top: calc(env(safe-area-inset-top) + 84px); z-index: 2; }` 依次错位 20px 叠放，滚动时后卡把前卡顶成「只露一条边」；每张卡 `border-radius: var(--radius-lg); box-shadow: var(--shadow-md);`（深色档重定义阴影为描边+内发光）。顶卡内容压到「一数字一行话」：`.today-card__figures { display: flex; gap: var(--space-5); }` 只显示 `:nth-child(1)`（其余 `display:none`），`<b>` 48px + `.today-card__tag` 做 trend 小箭头位（`content: "▲"` 由 tag 已有文本承担）。360px：sticky 顶部偏移必须小于 topbar 高度之和，卡左右 `margin-inline: var(--page-x)` 保证零横向溢出；`@media (prefers-reduced-motion)` 下 sticky 可保留（非动画），但 `scroll-behavior: smooth` 要关。

---

## 7. 对词笺的三个结构方向（不是配色，是骨架 + IA）

> 三个方向各自改变了「焦点在哪 / 数据放不放首页 / CTA 形态 / 版面轴线」中至少三轴，且与 bento（不对称磁贴并列）、play（纵文档流+厚按钮）、nocturne（零阴影排印长文）互不重叠。共同前提：`.start__title`、`.start__lede` 删除；`.start__masthead` 的日期刻印按需用。

### 方向 A「腕上表盘」—— 首屏只剩一个数
- **焦点**：屏幕垂直居中一只进度环，环心一个巨型数字（连续天数或今日到期），占首屏 ≥45% 高。整页无标题、无列表、无表格。
- **首页保留**：环 + 心数 + 环下 14px 一句原因（`.today-card__reason`，唯一中文）+ 顶栏。其余 `.readouts`、`.start__meta`、`.start__spec`、`.today-card__figures` 的另外三个、`.today-card__links` 全部 `display:none`——**首页读数=1，信息密度是词笺全部皮肤里最低、视觉强度最高的一档**（抄的是 Amazfit 中央时间+Smart Stack 阈值哲学：其余数据不配抬腕）。
- **被挪走**：总词量/批次/已学 → 我的页既有 `.stat`；到期/逾期明细 → 列表页与复习会话页首屏；日期 → `.start__masthead-meta` 留顶栏刻印。
- **CTA**：环正下方一枚圆形大按钮（`.btn--primary` 重塑为 `border-radius: 50%; width: min(36vw, 92px); aspect-ratio: 1;`，文字压成「开始」两行或靠 `::after` 换文案——文案不能造，则保持原文但 16px 居中；44×44 轻松达标），位置即表冠隐喻：看数→按钮，两步完成。
- **本质区别**：其它六套是「多数据并列的版面」，A 是「一数据居中的仪器」；阅读路径从 F 型扫描变成单点凝视；CTA 从文档流里的矩形条变成中心对称轴的组成部分。360px 反而最舒服（一切以 `min(vw)` 缩放）。

### 方向 B「预报带」—— 首页是一条时间轴，不是一个文档
- **焦点**：顶栏下一条满宽「答案横幅」（`.topbar__meta` 改写：今日 N 词像彩云倒计时一样先声夺人），随后首屏 40% 高是一条**横滑时间轴带**：四个 `.today-card__figure` 成为带上的刻度站（新词/到期/逾期/连续），基线、站标、snap 停位全用 CSS（§2 手段）；阅读轴线从纵向改成横向。
- **首页保留**：答案横幅 + 时间轴带 + 带下方一句总结（reason 升为 20px 大字，学 Brainy「每行数据要有告诉读者结论的标题」）+ 底部固定行动条。`.start__spec`、`.start__meta`、`.readouts`、`.today-card__links` 关；`.start__foot` 并入行动条上方细字。
- **被挪走**：批次/计划/进度类数据全部退到日历页与我的页；「错词本/学习日历」两个文字链 → 列表页顶部（它们本来就是导航，放首页是层级错位）。
- **CTA**：`position: fixed; bottom: 0` 满宽 64px 行动条（`.btn--primary` 撑满），内容从其下滚过并加 `::after` 渐隐遮罩——学 Watch Duty/天气 app 的「底部 sheet 行动层」，CTA 不再随页面滚动消失，永远在拇指位。
- **本质区别**：bento 是二维磁贴、play 是纵向文档，B 是「一横一竖」的坐标式版面：数据活在横向刻度轴上，动作活在纵向底部锚点上；首页第一次有了「现在几点」式的指针感。

### 方向 C「智能叠放」—— 首页是一摞卡，一次只摊开一张
- **焦点**：满屏等宽卡片堆。首屏顶卡 = 今日任务卡（新词大数 + 内嵌满宽开始按钮），下一张卡（数据明细/阶段 spec/连续记录）滚动时被 sticky 顶到同一位置、把前一张压成露出上边 20px 的卡片边——学 Smart Stack「顶卡即首页」+ Siri Modular「线的宽度本身就是层级」。
- **首页保留**：所有数据都还在，但**一屏只完整呈现一张**；每张卡内部被压到「一个数字 + 一行中文 + 至多两个拉丁刻印」。`.start__title/lede` 删；`.readouts` 开成第一张速览卡（三数一排）。
- **被挪走**：不减数据，减**同时性**——堆底卡（spec 工单表、meta）滑到即弃，等于默认不可见；真正出首页的是 `.start__foot` 与重复的 links。
- **CTA**：嵌在第一张卡底部的一条满宽按钮（卡片内 CTA，非悬浮条非圆钮），随顶卡一起被压栈——「被需要时才在场」是 Smart Stack 的本义。
- **本质区别**：现有六套的层级都靠**并置与尺寸差**（磁贴大小/字阶/留白），C 的层级靠**时序与遮挡**：z 轴与滚动本身成为信息架构，这是表盘/叠放领域独有的版面语法，纯 CSS（sticky + grid + 阴影两档）即可成立，明暗两档各自定义叠层投影。

---

## 8. 落地前必须实测的坑（本域共性）
- `display: contents` 提层后，`.start__body` 原 gap/边距失效，全部间距要在 `.start` grid 上重建；`.today-card::before/after` 若被本方案征用作环/纹，不能再依赖基类默认装饰。
- `position: fixed` 行动条（B）与 `.dock`、iOS 安全区、`.start__foot` 的遮挡叠加只能真机验证；sticky 叠卡（C）在 iOS Safari 上对 `backdrop-filter` 支持要降级为实底。
- 环形/刻度类装饰全在伪元素上，`overflow` 必须留在容器内（360 零溢出的硬线）；conic/repeating-conic 在旧 WebView 的表现需 PNG-free 兜底（直接不渲染环，退化为中心数+四角点）。
- micro-cap 小字一律限拉丁/数字；中文最小 14px，AA 校验按浅深两档各跑一遍。

## 9. 来源
- Carrot Weather 4.0 重设计（单屏可见全部重点）与 6.0 折线图/花园布局：https://www.macstories.net/reviews/carrot-weather-40-simply-delightful/ 、https://9to5mac.com/2024-05-29/carrot-weather-gets-major-update-with-line-charts/
- CARROT 官方「Layout 编辑器/预置布局」文档：http://support.meetcarrot.com/weather/
- CARROT 可自由排布卡片（德语评测，含小时预报左右布局）：https://www.dsfo.de/fo/pdf.php?p=1531435
- 彩云天气「上下两屏」结构与首屏要素：https://www.appinn.com/caiyunapp 、https://m.163.com/tech/article/9RTKIR8400094ODU.html
- 彩云首页顶部降水倒计时横幅 + 雷达动图 + 6 分钟步长时间轴：https://www.php.cn/faq/2483684.html
- 火灾应用读法（标记大小=面积、颜色=状态、列表统一行模板）：https://weatherai.world/blog/weatherai-2026-08-1-release
- Watch Duty 地图优先/克制裁决（The Verge、refs.gallery、screensdesign）：https://on.theverge.com/2025/1/11/24340913/watch-duty-wildfire-tracking-app-los-angeles-nonprofit 、https://refs.gallery/apps/watch-duty 、https://screensdesign.com/showcase/watch-duty-wildfire-maps
- BC Wildfire Service 官方 app（地图首页/多图层/推送）：https://fortstjames.civicweb.net/document/79100
- Nothing OS 单色极简、少部件高对比首页法则：https://drfone.wondershare.com/nothing-phone/nothing-phone-home-lock-screen-setup.html
- NotCustom（Nothing 风）At a Glance：大时钟+日期+下一事件+电量：https://github.com/ddddaaaattttoooo/notcustom
- Wear OS 表盘设计原则（看表 150 次/天、时刻第一层）：https://developer.android.google.cn/training/wearables/design/watch-faces
- Amazfit 表盘槽位制（6 complication × 22 数据 + 中央时间叠预报）：https://amazfitwatchfaces.com/active/view/3076
- Fossil 混合表子盘编码进度/模式：https://au.pcmag.com/smartwatches/46735/fossil-q-tailor 、https://geardiary.com/2017-11-14/fossil-q-grant-watch/2/amp/
- Apple「Designing for watchOS」（glanceable 单屏交互）：https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos （镜像：https://github.com/raintree-technology/hig-doctor/blob/main/skills/hig-platforms/references/designing-for-watchos.md）
- WWDC23「Designing widgets for the Smart Stack」：https://developer-rno.apple.com/videos/play/wwdc2023/10309
- watchOS 26 Smart Stack High Confidence 阈值（爱范儿专访）：https://www.ifanr.com/1627189
- Siri Modular 表盘版式（线状/宽卡/三圆 complication）：https://9to5mac.com/2026-09-09/hands-on-with-siri-modular-watchos-27s-new-apple-watch-face/
- 45 款天气 app 共性结构研究：https://www.mobileappdesign.io/blog/weather-app-ui
- 天气首页重设计逐段拆解（84px 大数、4 明细、3 行范围条、一条左边线）：https://brainy.ink/paper/weather-app-design
- 天气 app 版式模式中文综述（hero 大温度+横滑小时+竖列多日）：https://zj.zx.zbj.com/baike/26165.html
