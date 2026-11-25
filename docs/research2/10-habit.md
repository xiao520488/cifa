# 10 · 习惯/打卡领域调研（第二轮）——只看骨架

> 领域视角：连续天数/streak 日历、种子/植物/宠物成长隐喻、把「今天做没做」做成唯一焦点。
> 本次核心命题：**结构差异**（焦点位置、信息密度、导航形态、CTA 形态、数据是否留在首页），配色不算数。
> 对象：Habitica、Streaks、Forest、Finch、Fabulous、Duolingo（非首页屏 + 首页骨架）、Anki 统计面板，外加两个佐证样本。

---

## 0. 本领域的总规律（先说结论）

1. **首页 = 一次动作，不是一块看板。** 头部习惯应用几乎无一例外把「今天那一下打卡/开始」做成首屏唯一主角，数字和图表全部二级化（Streaks、Forest、Finch、Duolingo 都是）。看板型布局只出现在**分析页**（Anki 统计、66streaks 的 Grid 视图），没人拿它当首页。
2. **streak 有两种骨架待遇**：a) 作为**inline 小指标**缩在顶栏/任务名旁（Duolingo 顶栏火焰、Habitica 任务后的小数字）；b) 作为**整页专章**（Duolingo streak 页 = 大数字 + 月历 + 社交榜）。**没有产品把 7×N 日历热力图直接铺在首页首屏**——热力图永远在「统计/我的」之后。
3. **成长隐喻改变的是版面而不是装饰**：Forest 的「种树」让首页变成一个**发射器**（选时长圆环 + 一个开始键，页面其余是空地）；Finch/Habitica 的「养角色」让首页顶部多出一条**常驻状态条**（HP/能量/进度），主内容区反而留白给角色。**隐喻 = 信息架构上给「状态」和「动作」各留一个固定槽位。**
4. **CTA 形态在本领域有四种**：全屏大tile（Streaks 长按格）、圆环中心键（Forest）、路径节点（Duolingo 的路就是按钮本身）、底部解锁按钮（Finch 的 Adventure，未完成前是锁定态）。**没有一种等价于「文档流里的一颗普通主按钮」**——这正是词笺现状。
5. **密度是用户可调的**（Fabulous 卡片可滑走/分区开关、66streaks 首页三布局 Compact/Progress/Grid、Streaks 4~24 格）——说明该领域公认「首页该放多少数据」没有唯一答案，但**共识下限是：今天没做的事必须一眼可见，历史数据必须离开首屏**。

---

## 1. Habitica —— 「分栏任务板 + 游戏 HUD 顶条」

**structure（首页骨架）**
- 主页面叫 Tasks，Web 端是**从左到右四栏看板**：Habits｜Dailies｜To-Dos｜Rewards；栏头固定，任务条目在栏内纵排。移动端把四栏降级为**底部标签 + 左右滑动切栏**，默认停在 Habits。
- 页面最顶是**常驻角色 HUD**：头像 + 血条/经验条/蓝条，全局跟着顶栏走；点头像跳角色页。顶栏之下是一排标签（tag）chips。
- 新建任务 = 右下角 **FAB（浮动 + 按钮）**，长按 FAB 直接建当前栏同类型任务。
- streak 的待遇：**每条 Daily 任务名后面的一个小火焰数字**，仅此而已；整页没有日历、没有趋势图。

**surfaced**：今天要勾的清单本体（按类型分栏）、角色状态条、每条任务的 inline streak 数。
**hidden**：一切统计——完成率、历史、备份，全部推到网站外的 Data Display Tool 和成就系统；官方文档自己说 Habitica「不做 analytics 面板」。
**design lesson**：把「分类」做成正交轴（四栏），把「连续记录」压缩成条目前缀符号。首页密度高，但高密的是**可操作项**，不是数字。

**css_only（词笺可行移植）**
- 用 `.today-card__figures{display:contents}` 把 3 个 `.today-card__figure` 变成 `.start` 的 grid 子项，配 `.start{display:grid;grid-template-columns:repeat(3,1fr)}` 做成**三栏看板头**；每栏 `::before` 用 `counter-increment` 补一个罗马编号栏标，360px 下退化为 `grid-template-columns:1fr` 单列（栏头用 `writing-mode:vertical-rl` 的 `::after` 侧标替代，防溢出）。
- 仿「角色 HUD 常驻」：`.topbar{position:sticky;top:0}` + `.readouts{display:grid;grid-template-columns:repeat(3,1fr);gap:2px}`，每个 `.readout` 底部加 `background:linear-gradient(90deg, var(--accent) 0 100%) no-repeat bottom/100% 3px` 画一条静态血条槽；`.readout__v` 缩成 15px 内嵌数字。数据宽度 CSS 拿不到，所以做**等分三段刻度**（HP/XP/mana 的观感）而不是真实比例条。
- FAB：`.start__actions{position:fixed;right:16px;bottom:calc(16px + env(safe-area-inset-bottom));z-index:9}`，`.btn--primary` 收成 56×56 圆（文字用 `font-size:0` + `::before{content:"背";font-size:15px}` 换成单字）；注意 360px 时 FAB 与 today-card 尾行留 `padding-bottom:96px` 防遮挡。

---

## 2. Streaks —— 「整屏只有可打卡的大格子」

**structure（首页骨架）**
- 首页 = **一排/一列大按钮**：默认 6 个任务格排成一圈/一列，最多扩到 24 格；Apple 官方介绍原话是「习惯以**大号按钮**形式显示，**长按即完成**」。全程手势，没有列表、没有表头、没有说明文案。
- 图标外圈的小环 = 当天进度指示；数字类信息（streak 天数、日历、柱状图）藏在**每格点进去之后的详情页**。
- iPhone 主屏 widget 是它的「首页前置」：一个圆环就是全部信息量。

**surfaced**：今天每件事「做/没做」这一个状态。
**hidden**：streak 数字本身、日历、趋势——全部二级；首页连文字标签都弱到几乎为零。
**design lesson**：这是「唯一焦点」的极限版——**首页 = 按钮矩阵，数据为 0**。如果词笺走这条路，三个 readout 和 today-card 数字都不该留在首屏。

**css_only（词笺可行移植）**
- `.start{min-height:calc(100svh - var(--header-h,56px));display:grid;grid-template-rows:1fr auto}`；`.start__actions` 落进 `1fr` 行，`.btn--primary{width:100%;min-height:min(56svh,420px);border-radius:28px;display:grid;place-items:center;font-size:clamp(22px,7vw,30px)}`——一颗吃掉大半屏的 tile，本身就是 Streaks 的格子。
- 其余素材降级为页脚细字：`.readouts{display:flex;gap:20px;order:99}` 里只留 `.readout:nth-child(2)`（连续天数）可见、另两条 `display:none`；`.start__masthead,.start__spec{display:none}`（title/lede 本就要删）。360px 无横溢：tile 走 100% 宽，数字行 `flex-wrap:wrap`。
- 按下反馈可借 play 的思路但换形态：`.btn--primary:active{transform:scale(.985);box-shadow:inset 0 2px 0 ...}` 用内凹表示「已按入格子」。

---

## 3. Forest —— 「发射器式全高海报：选-转-按」

**structure（首页骨架）**
- 中文产品拆解原话：种树「是打开 APP 后**占据首页最大位置**的内容」。首页三件东西竖排：**树种选择器 → 拖动圆环定时长（10–120min，5min 一档）→ 种植按钮**；页面没有数字看板，顶部只留极少的金币/标签信息。
- 所有「成果数据」推到「森林」页：森林页顶部是**画出来的今日森林**（树阵即数据），往下滑才有专注时长统计、趋势折线、标签饼图、最爱树种。历史藏在「时间历程」独立模块。
- 隐喻改变骨架的方式：种植中的 App 状态本身就是屏（树在长，人在外），**首页为「过程」留了一整屏，而不是为「结果」留一块表**。

**surfaced**：一个动作 + 一个时长。今天种了几棵这类数字**不在**首页，在森林页用**树的视觉密度**代替数字。
**hidden**：统计四件套（时长/趋势/分布/树种）全在森林页下半屏；成就、好友、商店各占 tab。
**design lesson**：成长隐喻的高级用法是「**用场景代替图表**」——词笺若无插画 DOM，可用纯 CSS 地形/天际线当「今日成果」的抽象替身，数字退到页面最底一行。

**css_only（词笺可行移植）**
- 全高海报：`.screen,.start{min-height:100svh;position:relative}`；`.btn--primary` 做成**圆环中心键**：`aspect-ratio:1;width:min(62vw,240px);border-radius:50%;display:grid;place-items:center`，外环用 `::before{content:"";position:absolute;inset:-14px;border-radius:50%;background:conic-gradient(var(--accent) 0 35%, transparent 35% 100%);mask:radial-gradient(circle at center, transparent 0 62%, #000 63%)}`——静态弧长即可表达「今日进度感」（词笺可后续用 `.is-*` 状态换弧长档位）。
- 底部 CSS 地形：`.start__foot{position:absolute;inset:auto 0 0 0;height:22svh}` 内用 `.start__rule` 加 `background:linear-gradient(...)` 三层 `clip-path:polygon(...)` 的 `::before/::after` 叠出丘陵剪影（SVG data-URI 亦可），纯装饰零数据。
- 数字搬家：`.readouts` 与 `.today-card__figures` 一起 `order` 到地形之上、排成**一行 6 个细字指标** `display:flex;gap:14px;font-size:13px`（正文若≥14px 则用 14px），360px `flex-wrap:wrap;row-gap:6px` 零溢出。文案区（masthead 除 kicker 外、spec、lede）`display:none`。

---

## 4. Finch —— 「角色 + 今日清单，奖励按解锁态渐次出现」

**structure（首页骨架）**
- 官方帮助页拆解首页：**左上角 Menu**（收纳一切设置/功能区）→ **Daily Goals 清单**（主内容，勾完给小鸟充能）→ **鸟本体**（可摸、显示心情）→ **Adventure 按钮（能量满才解锁）**→ **聊天（冒险后当日才出现）**。
- 底部 6 个 tab；**streak 天数不在首页**——藏在「Your Birb」个人档案里（和鸟的生日、进化阶段放一起）。
- 骨架逻辑：首页只有一个「今日充能进度」概念，其余动作按钮带**锁定/解锁两态**，页面结构随完成度生长。

**surfaced**：今日目标勾选清单、能量是否满、鸟的情绪。
**hidden**：streak、收集、社交、商店全部 tab 化；首页连一个数字统计表都没有。
**design lesson**：「把情感对象放首页、把数字赶出首页」是本领域的另一极；**CTA 可以是被锁住的**——未完成前置项时主按钮呈 disabled 轮廓，制造结构性的「先做后玩」。

**css_only（词笺可行移植）**
- 能量槽：`.today-card__figures{display:contents}` + `.start{counter-reset:slot}`；三个 `.today-card__figure` 各 `order` 排进一行 grid 槽，再用 `.today-card__figures::before/::after` 各造 2 个「空格子」（`content:"";border:2px dashed`），凑出 5 槽能量条观感；`.today-card:has(.today-card__reason.is-warn)` 时给槽行整体 `border-color` 降级——用 `:has()` 做状态联动，纯 CSS 实现「解锁感」。
- 首页情感位（词笺没有宠物 DOM）→ 用 `.start__kicker/.start__eyebrow` 放大成**一句居中状态语**（`display:block;font-size:20px;text-align:center`），下方接一个纯 CSS「蛋/苗」几何体：`.start__rule::before{content:"";width:88px;height:88px;margin:auto;border-radius:50% 50% 50% 8px;background:linear-gradient(...)}` 当角色替身装饰。
- CTA 变「解锁条」：`.start__actions{position:sticky;bottom:0}` 满宽贴底，`.btn--primary{width:100%;border-radius:0}` 全出血，44px 高度约束自然满足。360px 下 sticky 条与 topbar 双重占位，给 `.start{padding-bottom:env(safe-area-inset-bottom)}`。

---

## 5. Duolingo —— 「顶栏三 inline 指标 + 蜿蜒路径即 CTA；streak 是独立专页」

**structure（首页骨架）**
- 2022 路径改版官方博客：首页**整体重设计成一条自上而下蜿蜒的路**（pebble 圆点 = 课，圈间错开排布）；每段有 **unit header 横幅**（描述式标题如 "get directions"），guidebook 图标挪到 unit 横幅右上。
- 顶栏 = 三个 inline 小指标：**🔥streak｜💎gems｜❤️hearts**——首页对 streak 的全部呈现就是顶栏一个小数字。路太长时的补救：**右下角浮动箭头**一键回到当前进度位置。
- 底部 tab：Learn｜Quests（宝箱图标，月赛/日常任务搬去这里）｜Practice Hub（订阅功能单独成 tab）｜Profile（个人记录、最长连胜在 face 图标页里）。
- **Streak 专页**（非首页）：顶部大号连胜徽章阵列 → 中部**月度日历**（逐日 XP 点阵）→ 底部 Society 好友榜。结构上「今日该干嘛」(路径) 和「干得怎么样」(streak 页) 是两个 tab，互不侵占首屏。

**surfaced**：下一个节点（一个可点的圆）+ 顶栏三指标。
**hidden**：streak 日历整页化、练习系统 tab 化、任务系统 tab 化——首页对「历史」的容量是 0。
**design lesson**：**「路就是按钮」**：CTA 不必是矩形按钮，可以是纵向序列里的当前节点；同时它示范了顶栏 inline 三指标这种最低成本的数据呈现，以及「回到当前位置」浮钮这种长滚动页的导航补丁。

**css_only（词笺可行移植）**
- 顶栏三指标化：`.readouts{position:absolute;top:calc(100% + 4px);left:0;right:0;display:flex;justify-content:space-between}` 或随 `.topbar` grid 排到右侧；`.readout__k` 用 `font-size:0::before{content:"🔥"}` 式替换为伪元素符号（禁 emoji 时可画 `clip-path` 火苗/水滴形），`.readout__v{font-size:15px}`。顶栏因此变成纯 HUD 条，`position:sticky` 常驻。
- 路径页：`.start{display:flex;flex-direction:column;align-items:center}`；`.start::before` 造纵向虚线路 `width:14px;background:repeating-linear-gradient(180deg,var(--accent) 0 10px,transparent 10px 22px);position:absolute;top:80px;bottom:120px;left:50%;transform:translateX(-50%)`（低透明度）；`.btn--primary` 收成**当前大节点**：`aspect-ratio:1;width:min(56vw,208px);border-radius:50%;position:relative;z-index:2`，`.today-card__figures` 三个 figure 以 `position:absolute` 挂到路径两侧交错（`nth-child(2){align-self:flex-start}` 式错位），变成「途经点」小圆章。360px：节点 `width:52vw` 保证左右各留 ≥48px 给错位章，章体 `min-width:72px` 防挤压。
- unit 横幅感：`.today-card__head{position:sticky;top:var(--topbar-h)}` 滚动时钉住，充当路径分段标头。

---

## 6. Fabulous —— 「一天分三段的时间线 + 可删减卡片堆」

**structure（首页骨架）**
- 帮助文档确认首页（homepage）是**垂直卡片流**：任意卡片**左右滑动即从首页删除**、右上角三点菜单可「Reorder Routines」拖序、可「Show/hide homepage sections」整段开关——首页密度交给用户裁剪。
- 内容组织轴是**一天中的时段**：Morning routine → Afternoon → Evening 三组（App Store 截图叙事即按此三段展开），顶部 profile 图标进 Journey（课程）切换，底部 Coaching tab 承载挑战/教练内容。
- 骨架逻辑：**按时间而不是按任务类型分区**；每组内部是「下一步做什么」的清单 + 播音频/日记等富卡；「Big Win」当日达成概念贯穿头部。

**surfaced**：今天还剩哪些仪式、当前时段。
**hidden**：跨天历史、统计、Journey 管理——入口收在顶部图标和底部 tab；首页卡片可被用户自己删到只剩一条。
**design lesson**：**分组标题 = 页面节奏器**。词笺的 `.today-card__head/__label` 这类标头元素若 sticky 化，可以把单屏切成有呼吸感的章节，而不是磁贴墙。

**css_only（词笺可行移植）**
- 时段分节：`.start__spec`（4 行 k/v 工单）改造成**竖向时间线**：`.start__spec{display:grid;gap:0}`，每行 `grid-template-columns:34px 1fr`，`::before` 画节点圆点（`counter-increment:step` 生成 01/02 序号文本），行与行之间用 `border-left:2px dotted` 串成轨道；`.start__rule` 用 `position:sticky;top:...` + `::before{content:"今日";writing-mode:vertical-rl}` 当侧挂章节标。
- 「滑走即删」无法用 CSS 实现，但可**用 :has() 做假的折叠**：`.start:not(:has(.today-card__reason.is-ok)) .readout:nth-child(3){display:none}`——依据已有状态类条件隐藏次要数据（具体类名以词笺 DOM 为准）。
- CTA 保持文档流但改为**每节尾部的通栏条**：`.start__actions{position:sticky;bottom:-1px}` 让它滚动时常驻底部，形态是 44px+ 通栏，不是居中大按钮——与 A/B 方向的 CTA 骨架形成对照。360px 注意 sticky 底栏吃掉视口时给 `.start{scroll-padding-bottom}`。

---

## 7. Anki 统计面板 —— 「左树右图的整屏仪表盘」

**structure（数据页骨架，非首页）**
- 官方手册：统计窗口 = **左侧牌组树侧栏**（选 Deck 或整个 Collection）+ **右侧纵向图表列**，带 Today／History／Cards／Data 分区：**Today** = 当日应学数 + 按 Again/Hard/Good/Easy 着色的**堆叠柱**；**History** = 按月柱状 + 正确率叠色；**Calendar** = GitHub 贡献图式**逐日热力格**；再往下是未来到期预测、响应时间等。
- 对照其**主界面**（牌组列表）：每行只有三个计数列（新/学/忘），**统计图表与主界面完全分离**——Anki 证明「数据密度可以极高，但必须集中供奉在专页」。
- 社区增强插件（anki-statis 等）沿用同一骨架并加交叉筛选：点饼块/柱条/热力格联动过滤。

**surfaced**：（在统计页内）全量——日历热力、堆叠正确率、预测曲线。
**hidden**：（在首页=牌组页）除今日计数外一切图表。
**design lesson**：**密度守恒**：习惯域产品不是没数据，是把数据整体搬到一个「档案室」页，首页只剩指向它的入口。词笺的日历页/统计正是这个档案室。

**css_only（词笺可行移植）**
- 首页「档案室入口化」：`.today-card__links` 两个文字链升级为**全宽双按钮**：`.today-card__links{display:grid;grid-template-columns:1fr 1fr;gap:8px}`，链上 `::after{content:"→"}`；`.today-card__figures` 用 `display:contents` 把 3 个数字搬进 `.readouts` 同一 grid，凑成**一行六格等宽读数带**（Anki 计数列味），每格 `<b>` 用 `font-variant-numeric:tabular-nums;font-size:clamp(18px,5.4vw,24px)`，label 12→14px 视 AA 正文要求取 14px。
- 768px+ 转双栏仪表盘（Anki 左树右图）：`@media(min-width:768px){.start{display:grid;grid-template-columns:240px 1fr;align-items:start}}`，左列 = `.start__masthead`+`.start__actions`（按钮竖排通栏），右列 = 读数带 + today-card；360px 单列时读数带 `grid-template-columns:repeat(3,1fr)` 两行折排，禁 `overflow:hidden` 截断。
- 伪热力条：`.start__foot::before{content:"";height:26px;background:repeating-linear-gradient(90deg, var(--accent) 0 6px, transparent 6px 12px);opacity:.25}` 装饰性点阵暗示「有档案可查」（不可造假数据语义，仅作入口纹理）。

---

## 8. 佐证样本（两条）

- **66streaks**（How to Customize Your Habit View）：首页内置 **Compact / Progress Bar / Grid 三种可切换布局**，且每条习惯的指标可单独隐藏/排序——证明习惯域「首页密度」是被当作产品级结构选项的，皮肤系统做「不同骨架方向」与该产品的自定义思路同构。
- **Streak ’86 概念案 + Streak 开源版 changelog**：都强调「Design around one daily loop（check-in → streak → reward）」，且「Today 页顶栏随滚动收起」——单一动作回路 + 可折叠 HUD 是当前习惯 app 的通用骨架语法。

---

## 9. 给词笺首页的 3 个结构方向（本领域结论）

> 前提统一执行：`.start__title`、`.start__lede` 一律 `display:none`（用户要求）。
> 三案的差异在**焦点、密度、CTA 形态、数据去留**四个轴上各占不同象限；均不依赖配色差异。

### Layout A · 「发射器」——首屏只剩一颗巨大的开始键（学 Streaks / Forest）
- **焦点**：一颗占 50%+ 屏高的大 tile/圆键，语义上等于 Forest 的「种下」、Streaks 的「长按完成」。信息架构从「展示面板」倒转为「启动器」。
- **on_home（保留）**：CTA 一个 + 连续天数一个中等数字（`.readout:nth-child(2)` 留下、另两条隐藏）+ 顶栏原样。
- **moved_away（挪走）**：今日新词/总词量、4 行工单表 `.start__spec`、`.today-card__figures` 三个数、`.start__meta`——全部 `display:none` 出首页，数字在「我的页/日历页」本就有对应承接；`.today-card__links` 两个文字链降到页面最底作档案入口。
- **CTA 形态**：整屏级大 tile（`min-height:56svh`、圆角矩形或正圆+conic 进度环），文字居中放大；按下微缩。
- **与 bento/play/nocturne 的本质区别**：bento 是「多磁贴共享焦点」、play 是「按钮列+厚按钮」、nocturne 是「夜纸排印」；A 把首页元素砍到 3 个以内，**密度归零**，这是信息架构删减而非换肤。
- **360px**：天然无横溢（单元素纵排），唯一注意点是 CTA 内文 ≥24px 才可按 3:1 对比，否则按正文 4.5:1 执行。

### Layout B · 「打卡台账」——数字满版、CTA 退居贴底细条（学 Anki / 66streaks Grid / Habitica inline streak）
- **焦点**：首屏第一视觉 = 一行 `tabular-nums` 大字读数带（readouts×3 + figures×3 经 `display:contents` 合并成一排六格），`.start__spec` 改造成带序号节点的时间线/台账表，整页是**高密度数据前台**。
- **on_home（保留）**：全部数字 + 工单表（重组为台账）+ 双文字链（升格为二级入口按钮）。
- **moved_away（挪走）**：`.start__masthead` 的标语/说明、`.start__eyebrow` 小字、`.today-card__reason` 的长句改到 `::after` 只留短状态词或直接隐藏；情感文案整体退场。
- **CTA 形态**：`position:sticky;bottom:0` 的**全宽贴底细条**（44–52px 高），像打卡表的「提交行」——按钮在结构上不占首屏焦点，与 A 的巨键形成两极。
- **与 bento/play/nocturne 的本质区别**：bento 磁贴是**不等权重拼块 + 每块一主题**；B 是**同权重读数矩阵 + 表格化正文 + 底部操作轨**，导航主轴从「逛卡片」变为「对账」。
- **360px**：六格读数带按 `repeat(3,1fr)` 折两行，字距收紧用 `clamp()`；台账行 `grid-template-columns:30px 1fr auto`，最窄列固定，永不产生横向溢出。

### Layout C · 「游戏 HUD + 场景留白」——顶栏状态条常驻、CTA 浮动右下角、首屏主体是空场景（学 Habitica / Finch / Duolingo 浮动箭头）
- **焦点**：首屏没有中心元素——视觉重心是**顶部 sticky 的三格 HUD 状态条**（readouts 改造成 HP/XP/能量观感的等分刻度条）和**右下角 FAB**；页面中段刻意留白，底部用 CSS 地形/点阵剪影封底，模拟「角色站在世界里」的 Habitica/Finch 结构。
- **on_home（保留）**：HUD 三读数（缩为 15px 内嵌数字 + 刻度条）、FAB 形态 CTA、`.today-card__figures` 三枚挂在中段虚线「路」上的小圆章（Duolingo 路径途经点）。
- **moved_away（挪走）**：`.start__masthead`、`.start__spec`、`.start__meta`、`.today-card__head/__label` 文本（figures 只留数字章）；`__links` 并入 FAB 长按层不可行（禁 JS），则做成顶栏两个 icon-btn 旁的第三文字入口样式降级项。
- **CTA 形态**：**`position:fixed` 右下 FAB**（56×56，单字伪元素文本），文档流里没有主按钮——这是三案中最强的 CTA 结构差异。
- **与 bento/play/nocturne 的本质区别**：C 改的是**导航层**（sticky HUD + fixed FAB + 场景化中段），首屏内容量与元素权重都变了，不是排印/配色层的差异。
- **360px**：FAB 距边 16px + `env(safe-area-inset-bottom)`；中段路章改单列交错；HUD 三条等分 `1fr 1fr 1fr`，`.readout__k` 用 14px 缩写词防换行。

---

## 10. 落地红线（对照硬约束自查）

- 伪元素 `content` 造的文本属于**界面文本**，同样吃 ≥14px 中文与 AA 对比；刻度条/装饰环不计入正文但需 3:1 可感知。
- `display:none` 移除的若是**唯一**承载某数据的节点（如 .readout），需确认该数据在其它页面 DOM 存在，否则等于删功能——B 案合并六格读数、A 案隐藏 readout 时逐条核对。
- FAB/sticky 元素一律 ≥44×44；`position:fixed` 的 CTA 必须在 360×640 与横屏下都验证不与 today-card 重叠。
- 红色仅用于 `.today-card__reason.is-*` 的逾期/危险态；streak 断签提示可借 Habitica 掉血逻辑但语义色浅深两档各写一遍。
- 禁 JS ⇒ 三案全部只动既有 class；`:has()` 条件样式需在 iOS 15.4+/Chrome 105+ 范围确认可用，不可用时降级为无条件样式（不影响骨架成立）。

---

## 11. 来源 URL

- Habitica 任务页四栏结构（wiki 中文）: https://habitica.fandom.com/zh/wiki/%E4%BB%BB%E5%8A%A1
- Habitica 安卓端底部标签/FAB（wiki）: https://habitica.fandom.com/zh/wiki/%E5%AE%89%E5%8D%93%E5%AE%A2%E6%88%B7%E7%AB%AF
- Habitica streak 与统计缺失（分析文）: https://www.consultantsinabox.com/guides/habitica-progress-tracking
- Habitica 三栏用法（教学）: https://habitrewards.me/blog/habitica-habits-vs-dailies.html
- Streaks 官方介绍「大按钮、长按打卡」（App Store Editorial）: https://apps.apple.com/th/story/id1272004658?l=th
- Streaks 6 widgets 与圆环进度（MacStories）: https://www.macstories.net/reviews/streaks-6-brings-habit-tracking-to-your-home-screen-with-extensively-customizable-widgets/
- Streaks 6 格/24 格首页结构（中文评测）: https://jikefan.com/zh/app/streaks/11.3.3
- Forest 首页「占最大位置」+ 森林页统计四件套（产品拆解）: http://www.woshipm.com/evaluating/5769925.html
- Forest 圆环定时/标签统计（功能说明）: https://www.xiaomitong123.com/app/13987607.html
- Forest 首页即种植（PRD 倒推）: https://m.163.com/dy/article/EGCQ0GAB0511805E.html
- Finch 首页分区 + 底部 tab + streak 藏在 Birb 档案（官方帮助）: https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page
- Finch 首页→冒险解锁流（屏幕地图）: https://revyl.com/atlas/finch/
- Duolingo 路径化首页官方博文（node/unit header/浮动回位箭头/Quests tab 化）: https://blog.duolingo.com/new-duolingo-home-screen-design/
- Duolingo 顶栏三指标含义: https://techwiser.com/all-duolingo-icons-and-symbols-meaning-including-status-icons/
- Duolingo streak 页=日历+社交（屏幕地图）: https://revyl.com/atlas/duolingo/
- Duolingo 底部导航与顶栏状态（设计分析）: https://app.designlab.com/course/submissions/view/e4f0f29f/ （原文: https://app.designlab.com/course/submissions/view/e4d0f29f/）
- Fabulous 首页卡片滑走/重排/分区开关（官方帮助）: https://help.thefabulous.co/en/support/solutions/articles/101000432070-how-to-organize-my-homepage-
- Fabulous 早/午/晚三段叙事（App Store 截图拆解）: https://www.screenspo.com/apps/fabulous
- Fabulous 首页格式固定、内容按 Journey 组织（评测）: https://www.choosingtherapy.com/fabulous-app-review/
- Anki 统计窗口结构：左树右图、Today 堆叠柱、Calendar 热力（官方手册）: https://docs.ankiweb.net/manual/stats
- Anki 统计页交互增强（社区插件，交叉筛选）: https://github.com/leonid-vasilev-ocl/anki-statis
- 66streaks 首页三布局 Compact/Progress/Grid（帮助文）: https://66streaks.com/blog/how-to-customize-habit-view/
- 习惯类 app 通用骨架：「一个动作重复」「进度页回答一个问题」（设计模式文）: https://www.mobileappdesign.io/blog/habit-tracker-ui
- Streak 日历 GitHub 热力 + 大数字置顶设计样例: https://github.com/FlineDev/PlanKit/blob/main/examples/A-DesignStreakCalendar.md
- 单一每日回路概念案: https://vipinsao.github.io/contra-profile-page/work/streak86/
