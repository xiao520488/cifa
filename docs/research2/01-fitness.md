# 01 · 健身/运动领域：首页布局骨架调研

> 对象产品：Strava、Nike Run Club、Apple Fitness、Whoop、Fitbit、Keep、悦跑圈
> 视角：**只看骨架**——首屏焦点是什么、几栏、信息密度、导航位置、CTA 形态、数据放不放首页、什么被藏进二级页。不谈配色情绪。
> 用途：为「词笺」新皮肤提供结构参照。词笺约束：固定 DOM、纯 CSS、390×844 主战场、360px 零横向溢出、WCAG AA、点击目标 ≥44px、首页删除 .start__title / .start__lede。

---

## 0. 本领域五条横向结构规律

1. **单 hero 数字，不是一排等权瓦片。** 头部 tracker 首页的共同点：恰好一个数字远大于其余（通常是"今天/本周 vs 目标"），其余支撑指标在视觉上明确降权（次级、灰色、小一号）。"两个 hero"或"四格等分"都被认为是不合格的仪表盘。
2. **没有目标参照的数字不算完成设计。** "12% vs 上周"式的裸数字回答不了"我练够了吗"；首页那个 hero 必须挂着目标框（环、进度弧、"x / y"），细节对比全部下沉。
3. **一瞥性（glanceability）优先：首页是低分辨率信号，点击才是数据。** Apple Watch/健身 App 的设计逻辑是"几秒读完、层级靠 tap 下钻"：首页一个环，点进去才有 90 天柱状、趋势、明细。首页密度刻意做低。
4. **CTA 要么钉在底部导航中央，要么整页就是 CTA。** Strava 把 Record 做成底部常驻按钮；NRC 干脆把 Run 做成一个 tab；Apple/Whoop 的首页"开始动作"入口反而弱。运动类 App 对"打开即开练"的结构投入远大于对"打开先看数"。
5. **时间轴视图（周热力/训练日志）永远不在首页。** Strava 的色块周训练日志、Fitbit 的月历、悦跑圈的周报/轨迹墙，全部推到"你的/数据/日历"二级页——首页只留今天。

---

## 1. 逐产品骨架拆解

### 1.1 Strava —— 社交流为家，数据全部后置

- **结构**：底部五 Tab（首页流 / 地图 / 中央 Record / 跑团 / 我的）。首页 = **单列活动 Feed**，顶部被运营位（Streak 横幅、功能推广卡）反复加码，Feed 本身无限滚动。周目标环、周统计、PR、装备、训练日志色块周历**全部在"我的"Tab**，不在首页。
- **surfaced（首页只有）**：好友/自己的活动卡（图 + 标题 + 一行指标）、streak 提示条、中央 Record 按钮。
- **hidden（推到二级）**：周量/总里程（2020 年起改成"设了周目标才显示"，且部分进付费墙，用户抱怨找不到）；训练日志的色块周视图；配速分析、分段、爬坡排名全部藏进活动详情页。
- **骨架本质**：首页是"内容流 + 常驻行动钮"，**数据密度刻意压在 1 行/卡**；把"努力度回顾"做成独立时间轴页。
- **对词笺**：词笺首页可以从"海报"改成"工单流"——每个既有区块降为一张全宽横卡，CTA 脱离内容流钉底。
- **css_only**：`.start__actions { position: fixed; inset: auto 0 0 0; padding: 12px 16px calc(12px + env(safe-area-inset-bottom)); background: var(--纸); border-top: 1px solid; }` 内层 `.btn--primary { width: 100%; min-height: 56px; }`——主 CTA 变底部常驻横条，Strava Record 位；`.start { padding-bottom: 96px; }` 防遮挡；`.today-card, .start__spec, .readouts { border-radius: 0; border-inline: 0; }` 去掉卡片容器感，块间用 border-top 分隔，形成单列 feed。360px 下 feed 单列天然无溢出；fixed 条内文字 16px 居中。

### 1.2 Nike Run Club —— "开跑"本身是一级导航

- **结构**：底部五 Tab：Home / Plans / **Run（正中央）** / Club / Activity。Home 是 tips + 文章的"发射台"，**不放跑量数据**；数据在 Activity Tab（日/周/月/年切换 + PR 列表）；训练计划在 Plans；社区在 Club。开跑入口 Run 是底部导航正中的跑者图标，进去即是大 START 按钮。
- **surfaced**：首页只有编辑推荐/课程内容卡。
- **hidden**：所有累计数字（跑量、连续、PR）离开首页；周/月/年视图是 Activity 页内的分段切换，不在首页。
- **骨架本质**：**动作、内容、数据三分离**——最核心动作（开始）不做成页面上的按钮，而是提升为导航层。首页可以"零数据"。
- **对词笺**：证明了"首页一个数字都不放"是成立的结构；「开始背单词」值得占据整屏，而不是内容流里的一颗按钮。
- **css_only**：`.start { display: grid; grid-template-rows: auto 1fr auto; min-height: 100dvh; }`，`.start__masthead, .today-card, .start__meta, .start__spec { display: none; }`，`.start__title, .start__lede { display: none; }`（用户本来就要求删）——`.start__actions { place-self: center; }`，`.btn--primary { min-height: min(42vh, 380px); width: 82vw; border-radius: 999px; font-size: clamp(22px, 7vw, 30px); display: grid; place-items: center; }`。首屏=一枚全屏胶囊 START，数据整体让位给列表页/我的页。360px 下 82vw≈295px 宽、文字 clamp 兜底不溢出；点击目标远超 44。

### 1.3 Apple Fitness —— 三环即首页，时间轴分段下钻

- **结构**：Summary 单页纵向流：**顶部三环**（Move/Exercise/Stand 同心环）+ 环下紧跟 Today/Week/Month/Year 分段器；iOS17 起环下补一行步数/距离；再往下是"锻炼数据"**可自定义顺序的小卡网格**；History、Trends、奖章逐级往下。点任一环 → 该指标独立页（90 天彩色柱 + 275 天灰柱 + 目标虚线）。
- **surfaced**：只有三环 + 今日数字。首页回答"今天合上环没有"，一个问题。
- **hidden**：每个指标的时序趋势（点环才见）、月度/年度对比、历史锻炼列表。
- **骨架本质**：**环形进度 = 唯一视觉焦点 + 唯一导航入口**（环即按钮）；用同心/分段结构把"3 个指标"压缩成"1 个图形"。首页密度全 App 最低，靠 tap-through 补偿。
- **对词笺**：3 个 readout 可以坍缩成 1 个环形 hero——环里只写一个数，环本身即"今日进度"语义；其余数字去日历页。
- **css_only**：`.readouts { display: grid; grid-template-columns: 1fr; justify-items: center; }`，`.readout:nth-child(1) { aspect-ratio: 1; width: min(68vw, 300px); border-radius: 50%; display: grid; place-content: center; position: relative; }`，环弧用伪元素：`.readout:nth-child(1)::before { content: ""; position: absolute; inset: 0; border-radius: 50%; background: conic-gradient(var(--强调色) calc(var(--环进度, 100%) * 3.6), var(--轨道色) 0); mask: radial-gradient(closest-side, transparent 74%, #000 76%); -webkit-mask: 同值; }`，`.readout:nth-child(1) .readout__v { font-size: clamp(44px, 15vw, 72px); }`，`.readout:nth-child(2), .readout:nth-child(3) { display: none; }`。**注意无 JS 限制**：`--环进度` 只能是皮肤内置静态值，或按 `.today-card__reason.is-*` / `:has()` 切换 2–3 档示意弧——环在此结构中是"完成态徽章"而非实时仪表，笔记诚实标注这一点。`[aria-hidden]` 装饰伪元素不影响读屏；数字本体仍是真文本。

### 1.4 Whoop —— 三表盘英雄排 + 单滚动分区，长期数据逐出首页

- **结构**：2025 改版后 Home = **单条滚动视图**，自上而下固定分区：顶栏（Streak + 设备电量）→ **Sleep / Recovery / Strain 三个圆表盘横排**（点任一表盘下钻）→ My Day → My Plan → 可自定义的 My Dashboard；**长期健康指标整体搬去独立 Health Tab**，Insights、Journal 也在首页之外。
- **surfaced**：三个"今天"的圆表盘（且其中一个——Recovery——被社区实际当作唯一决策数：早上一开 App 读这一个数决定今天练不练）。
- **hidden**：一切跨周/跨月趋势、HRV 细节、血氧/体温等监控项（Health Tab）；周报类内容（Journal/Insights）。
- **骨架本质**：**"表盘横排"结构**：3 个指标各占一枚等尺寸圆，圆内一个大字，横排吃掉首屏一半；往下是动词分区（Day/Plan）而非名词数据区。
- **对词笺**：词笺的 3 个 .readout 与 Whoop 三表盘几乎一一对应（今日新词≈Strain、连续天数≈Streak、总词量≈长期）。把 .readouts 做成首屏英雄表盘排，today-card 的数字组就该降级或删掉。
- **css_only**：`.readouts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }`；`.readout { aspect-ratio: 1; border: 1.5px solid var(--线); border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; }`；`.readout__v { font-size: clamp(20px, 6.2vw, 30px); }`，`.readout__k { font-size: 10.5px; letter-spacing: .08em; }`（标签小字对照正文规则按 ≥大字豁免处理，若判 4.5:1 风险则升 11px+ 加深底色档位）；`.today-card__figures { display: none; }` 把重复数字砍掉，`section.today-card` 只留 `__reason.is-*` 那一行行动建议并整行铺满。360px：三圆各 ≈104px（(360−32−20)/3），圆内 clamp 字号安全。

### 1.5 Fitbit（2025 重设计）—— 「数据带 + 卡片流」双段式模板

- **结构**：底部四 Tab：Today / Fitness / Sleep / Health。**四个 Tab 共用同一版面模板**：顶部一条"数据可视化带"（条 + 环，指标可自定义）+ 下方可点入的卡片流（即将到来的锻炼、最近活动、进度报告）。首页回答"今天怎么样"，每个 Tab 回答对应域的"今天怎么样"。
- **surfaced**：顶部条/环组合（步数条、每周运动负荷环 + 右挂柱条）、卡片流首屏 1.5 张。
- **hidden**：每张卡点进去才是完整图表/日历；历史、报告不在首页展开。
- **骨架本质**：**sticky 数据带 + 无限卡流**的两段式；同一骨架跨 tab 复用，用户学一次结构走全 App。
- **对词笺**：词笺可以让 .readouts 变成钉顶的"状态带"（滚动时常驻），下方一切内容按卡流滚动——首页获得"设备仪表盘"而非"文章页"的骨架。
- **css_only**：`.readouts { position: sticky; top: 0; z-index: 5; display: grid; grid-template-columns: auto auto auto; justify-content: space-between; padding: 8px 16px; border-bottom: 1px solid var(--线); background: color-mix(in srgb, var(--纸) 92%, transparent); backdrop-filter: blur(6px); }`；`.readout__k` 与 `.readout__v` 各自 `display:inline` 拼成"k v"单行三组；`.start` 内每个直接子块补 `border-bottom + padding-block: 20px; border-radius: 0;` 让 today-card/spec 呈现为无容器卡流。360px：三组"k v"横排单行总宽 ≈328px 内收得下，`font-size: 12px/15px` 两档；`top: 0` 需与 topbar 高度核对（topbar 若也 sticky 则 readouts `top: var(--topbar高)`）。

### 1.6 Keep 9.0 —— 从"购物中心首页"退回"任务清单首页"

- **结构**：老版首页=典型互联网商场：顶部搜索 + 7 个营销入口一行，中部推荐位，下部双列瀑布流 + 广告，五 Tab（首页/今日/运动/商城/我的）。9.0 重构为 **课程 / 日程 / 运动 / 发现 / 我的**：课程升为第一 Tab（"开练"即首页），商城折叠进"发现"。新版课程页顶部只剩"课程/计划"两个一级项，下方 5 个**灰白一致的方形入口**，主次一眼分清——刻意去掉双层导航、去瀑布流。
- **surfaced**：首页（课程 Tab）= 方形入口格 + 单列课程列表，无社交流无广告。
- **hidden**：社区（发现 Tab）、数据（运动 Tab）、商城（折叠二级路径）。
- **骨架本质**：**入口网格化 + 单一动词首页**：首页只做"选一个课开练"这一件事，用规整方格入口替代花哨轮播；密度中低、层级压到 1 层。
- **对词笺**：today-card 里的两个文字链（__links）天然该升级为"方形大入口"；.start__spec 四行 k/v 工单可以被重释为"日程"列表。
- **css_only**：`.today-card__links { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }`，`a { min-height: 84px; border: 1px solid var(--线); display: grid; place-content: center; gap: 6px; text-align: center; }`——文字链变 Keep 式方形入口（84px≥44 达标）；`.start__spec { display: grid; gap: 0; }` 每行 k 左 v 右 + border-bottom，配 `.start__spec::before { content: "今日日程"; }` 作小节标题（中文伪元素文本，符合"造装饰与文本"允许手段）。360px：两列方格各 ≈156px，安全。

### 1.7 悦跑圈 —— 跑量 hero 置顶 + 首页切二级子页

- **结构**：改版思路明确点名旧病："页面上方信息展示少且缺乏重点"——卡通形象占大头，跑量只在左角、其余数据要点开累计跑量再左右滑才看到。改版后：**首屏上方=跑量/目标数据主角**（最快配速、最长时间等高频数据直接放出来，不再藏滑卡）；今日步数、悦圈周报、轨迹墙三个常用功能**单独抽成平级入口**；跑团/跑班/训练计划不再散落在别的页面，而是做成**首页的下级页面（子 tab）**。3.0 版首页即清晰展示"当前目标跑量 + 等级任务"。
- **surfaced**：目标跑量（带目标参照的 hero 数字）、一行高频 PR、三个功能入口、下级子页导航。
- **hidden**：社区/好友动态独立板块；深层统计（轨迹墙大图、周报正文）在二级页。
- **骨架本质**：**"hero 数据 + 平级入口排 + 首页内二级页签"**：在单页内用子 tab 再开一层 IA，避免功能散落到别的顶级 Tab。
- **对词笺**：`.today-card__figures` 三数字可做"1 大 2 小"的跑量式 hero 排（今日新词放大为主角，两个辅助降权）；`.start__masthead` 可改造成子页签条压在 topbar 之下。
- **css_only**：`.today-card__figures { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }`，`.today-card__figure:first-child { grid-column: 1 / -1; }` 其 `b { font-size: clamp(40px, 13vw, 64px); display: block; }` 独占整行做 hero，另两个各占半行、`b { font-size: 20px; }` 降权（一大两小非对称，规避"四格等分"反模式）；`.start__masthead { position: sticky; top: 56px; display: flex; gap: 18px; border-bottom: 1px solid var(--线); }` 内小字项用 `::after { content: ""; height: 2px; }` 画选中下划线，充当悦跑圈式子页签。360px：hero `13vw≈47px` 两位数不溢出；下划线纯装饰不入读屏流。

---

## 2. 基于本领域给词笺首页的 3 个结构方向

> 前提共识：`.start__title`、`.start__lede` 删除；三版必须骨架互斥，而非换色。

### 方向 A：「合环」—— 首屏只有一个数、一个环
- **参照**：Apple Fitness + Whoop。
- **首屏焦点**：一枚大环，环心一个数字（今日新词 x / 5，或"连续 N 天"）。首页只回答"今天背了没有"。
- **首页保留**：topbar、单个 hero 读数（其余 2 个隐藏或缩成环脚一行小字）、reason 行（今天该做什么的一句话）、CTA。
- **挪走**：today-card 三数字 → 复习会话结束页/日历页；.start__spec 工单表 → 我的页；kicker/eyebrow/meta 小字 → 全隐或并入环脚。
- **CTA 形态**：底部固定全宽横条（safe-area 兼容），非内容流中的色块。
- **骨架差异声明**：与 bento（多瓦片不对称网格）相反——这里**没有网格，只有一个圆**；与 play（内容流里厚按钮堆叠）相反——CTA 出流钉底；与 nocturne（暗色排印海报）相反——首页无大标语，只剩数字+弧。焦点数量从"多"降到"1"，是信息架构级变化。
- **无 JS 妥协**：环弧为静态/分档示意（见 1.3 注），环语义为"今日目标徽章"。

### 方向 B：「工单流」—— 单列 Feed + 底部常驻开练钮
- **参照**：Strava + Keep 9.0。
- **首屏焦点**：无单一焦点，焦点在**滚动序列**：streak 细条（.readouts 压成顶栏下一条横向 ticker）→ 今日工单（.start__spec 四行变 feed 第一卡）→ today-card 全宽横卡 → 方形双入口（__links 网格化）。
- **首页保留**：全部数据但全部**降为一行高**：readouts 不进首屏大块、ticker 单行可 `overflow-x: auto`；spec 是首卡主体；today-card 只留 figures+links。
- **挪走**：.start__masthead 的 editorial 小字与 .start__foot 装饰 → 隐藏；reason 长文案 → 复习会话页开头。
- **CTA 形态**：`position: fixed` 底部横条，仿 Strava Record 常驻；内容 `padding-bottom` 避让。
- **骨架差异声明**：bento 是二维网格一次排完，此版是**一维无限流 + 常驻行动条**——导航重心从"扫视瓦片"变成"顺序滚动"；play 的按钮在内容流内且首屏有 hero 文案，此版首屏即数据行；nocturne 是排印海报，此版是收据式清单。密度中-高，靠"每块只许一行"约束层级。
- **360 检查**：单列无溢出；ticker 横滚不撑破视口（`scrollbar-width: none`，两端留 16px 渐隐 mask 提示可滚动）。

### 方向 C：「控制台式」—— 钉顶数据带 + 动词分区，桌面侧栏化
- **参照**：Fitbit 两段式 + Whoop 分区 + NRC 的动作/数据分离。
- **首屏焦点**：粘顶的三表盘数据带（.readouts 圆形化，Whoop 式），滚动时常驻——首页身份是"仪表盘"而非"文章"。
- **首页保留**：数据带（3 表盘）→ `::before` 造「今日」节题 + today-card（figures 压缩为一行三读）→ 「计划」节题 + .start__spec（表格化，行行 border）→ 满宽 CTA 作为「计划」区的执行按钮紧接 spec 之下。
- **挪走**：masthead 标语区整体让位给数据带；.start__meta、__links、__foot → 我的页/列表页承接；长期总词量表盘点击语义由日历页承接（词笺导航栏已有入口，皮肤不改 DOM 只改视觉层级）。
- **CTA 形态**：嵌在「计划」节内的整行按钮（非钉底、非全屏胶囊），与 spec 表构成"任务清单→开练"的因果对。
- **@media 1440**：`.app` 变双栏——`header.topbar + .readouts` 组合 `position: fixed; inset: 0 auto 0 0; width: 300px; display: block;` 成左侧栏（品牌+竖排三表盘），`main.app__main { margin-left: 300px; }`。词笺七套现有皮肤从无侧栏结构，这是真正的 IA 变化。
- **骨架差异声明**：与 bento 的区别是**纵向节题驱动 + 粘顶带 + 桌面侧栏**，而非自由瓦片；与 play/nocturne 的区别是首页第一视觉元素从"文字/按钮堆"换成"钉顶仪表带"，滚动行为（sticky）本身成为骨架特征；三版中只有 C 改变桌面端栏数。

---

## 3. 落地前自查清单（三方向共用）

- [ ] 360px：`min()/clamp()/vw` 兜底大字号；fixed/sticky 条不遮挡末块内容（padding-bottom）。
- [ ] 44px：钉底 CTA ≥56px 高；方格入口 ≥84px；ticker 内链接补 `padding + min-height: 44px`（透明扩展点击区）。
- [ ] AA：表盘小标签（10–11px 级）若为正文语义需 ≥4.5:1；环上数字属大字（≥24px）走 3:1。语义色浅深两档各写。
- [ ] 隐藏 `.readout` / `.today-card__figures` 的方向需确认数据在承接页存在，否则违反"数据不缺位只挪位"。
- [ ] 伪元素中文节题（「今日」「计划」）不入读屏重复：真实文本未被删，aria 顺序正常即可。
- [ ] 无 JS：一切"进度/选中态"只能借既有类（`.today-card__reason.is-*`）或 `:has()` 分档，不得假装有实时动画进度。

---

## 4. 来源

- mobileappdesign.io — Dashboard UI design on mobile: the tracker's progress screen（单 hero 数字、目标参照、非等分瓦片等规律总结）https://www.mobileappdesign.io/blog/dashboard-ui-design
- GitHub 重设计笔记 — My Fitness redesign: goals first, then history（"无目标的数字网格"反例分析）https://github.com/vitorpamplona/amethyst/blob/6dad75b7401b217851dc42908f3ef32bc97a46b9/commons/plans/2026-10-06-my-fitness-redesign.md
- WHOOP — The All-New WHOOP Home Screen（Sleep/Recovery/Strain 三表盘置顶、单滚动、Health Tab 分离）https://www.whoop.com/hk/en/thelocker/the-all-new-whoop-home-screen/
- WHOOP Community — Where did my previous Home screen metrics go?（改版前后指标去向）https://www.community.whoop.com/t/where-did-my-previous-home-screen-metrics-go/569/4
- Engadget — A closer look at Google's AI health coach and the redesigned Fitbit app（Today 顶部条/环 + 卡流、四 Tab 同模板）https://www.engadget.com/ai/a-closer-look-at-googles-ai-health-coach-and-the-redesigned-fitbit-app-160041881.html
- TechWiser — What Icons and Symbols Mean on Apple Fitness App（环下方柱状：90 天彩色 + 275 天灰 + 目标虚线）https://techwiser.com/what-icons-and-symbols-mean-on-apple-fitness-app-complete-guide/
- 9to5Mac — iPhone Fitness app, iOS 17（环 + 环下步数距离 + 可自定义锻炼数据卡）https://9to5mac.com/2023-11-29/iphone-fitness-app-whats-new-ios-17/
- Apple Support — See your activity summary in Fitness on iPhone（Summary 页结构与指标可增删排序）https://support.apple.com/en-ca/guide/iphone/iph4c34a8a95/ios
- SAGE Journals — Glanceability and voyeuristic distance: Apple Watch Activity Rings（一瞥性、低分辨率信号、tap 下钻的设计逻辑）https://journals.sagepub.com/doi/full/10.1177/13548565261442032
- Sapphire Running Zone — Getting To Know Strava（首页=活动流主导，进度/统计在 You Tab）https://www.sapphirerunningzone.com/post/strava-getting-to-know-its-features
- Strava Community Hub — New Strava UI layout on top of the feed in the Home tab（streak 横幅挤占首页、用户抱怨，数据后置）https://communityhub.strava.com/archived-strava-features-chat-5/new-strava-ui-layout-on-to-of-the-feed-in-the-home-tab-10870
- caloriesfit — How Do I Use Strava（四大区域：Home 流 / Record / You 周统计 / Training Log 色块周）https://caloriesfit.com/how-do-i-use-strava/
- My Healthy Apple — Strava weekly totals 位置变迁（周统计须设目标才显示）https://www.myhealthyapple.com/how-to-check-your-strava-weekly-totals/
- MakeUseOf — Beginner's Guide to Nike Run Club（五 Tab：Home launchpad / Plans / Run / Club / Activity，数据在 Activity）https://www.makeuseof.com/beginners-guide-using-nike-run-club-iphone/
- MakeUseOf — How to Make the Most of NRC（底部中央跑者图标=开跑入口）https://www.makeuseof.com/make-the-most-of-nike-run-club-app/
- Apple App Store 官方编辑推荐 — Nike Run Club（Activity 页承载全部历史/PR，Run 页承载训练内容）https://apps.apple.com/jp/story/id1444931010?l=en-US
- 人人都是产品经理 — Keep 更新了，不，是更旧了（Keep 9.0 Tab 重构、老首页商场式双层导航、新版方形入口网格）https://www.woshipm.com/share/6385599.html
- 微信公众号 — 悦跑圈 app 首页改版思路（跑量 hero 上移、最快配速/最长时间直接放出、步数/周报/轨迹墙独立入口、首页下级页签化）http://mp.weixin.qq.com/s?__biz=MzcwMjMzMTg2NQ==&mid=2247483677&idx=1&sn=c5db47d8216027fc9fa1d0a236a0d6ba
- 千龙体育 — 悦跑圈 3.0 版本全新上线（首页凸显目标跑量 + 等级任务、社交独立板块）https://sports.qianlong.com/2017/1204/2222964.shtml
- Mobbin — Strava 屏幕库（Home/Feed 结构截图佐证）https://mobbin.com
