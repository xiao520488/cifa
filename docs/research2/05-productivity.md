# 05 · 效率/任务领域调研（Things 3 / Fantastical / Linear / Notion / Todoist / Raycast / Superhuman）

> 领域视角：今日清单列、侧栏导航、键盘优先、极小 chrome 极大内容、状态用点/条而非卡片。
> 本文只谈**版面骨架**：焦点在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。配色情绪一律不谈。
> 前提回顾：词笺首页 DOM 固定（topbar / 3×readout / .start 内 masthead·spec·actions / today-card），本皮肤任务已确认 **删掉 .start__title 与 .start__lede**；一切手段仅限 CSS（order、display:contents、sticky/fixed、伪元素、:has()、clip-path、mask、gradient、writing-mode、counter）。390×844 主战场，360 宽零横向溢出，点击目标 ≥44px。

---

## 一、七个产品的结构拆解与可落地 pattern

### 1. Things 3 —— 「大标题 + 单列清单 + 隐形浮层」

**骨架事实**
- 层级被刻意压扁：主要功能只有 **Dashboard 和二级 List 两层**，其余全部走浮层/「隐形浮层」，体感不复杂（[ifanr·5Key 设计解析](https://www.ifanr.com/app/862042)）。
- 首屏焦点是**一个 28pt 超大列表标题**（「Today」）坐在滚动内容里而非导航栏里，任务行在标题下铺开；标题本身就是页面焦点（[Gadgets360 评测](https://www.gadgets360.com/apps/reviews/things-3-app-review-1727275#1)、[Things iOS DESIGN.md](https://github.com/feimacode/open-design-agent-kit/blob/f99b3caeb91b7410d54610f3a2e41744adfccff7/packages/content/assets/open-design/design-systems/things-3-ios/DESIGN.md)）。
- 任务行 ≈44pt 最小高 + 12pt 行间呼吸，行间用发丝线/留白分隔，**没有卡片**；项目内部用「加粗小标题 + 发丝线」切段（同上 DESIGN.md；[Blake Crosley 设计研究](https://blakecrosley.com/zh-Hans/guides/design/things)）。
- 导航 = 侧栏（Inbox/Today/Upcoming/Anytime/Someday），**明确不用底部标签栏**；iPad 侧栏可两指滑动收起（Slim Mode）（[Cultured Code 官方 features](https://culturedcode.com/things/features/)）。
- CTA 形态 = **Magic-Plus**：右下角悬浮 56pt 圆钮，是唯一带阴影的元素；创建动作永远浮在列表之上（DESIGN.md 同上）。
- 数据观：Today 里日历事件分组置顶、「This Evening」单独小节；完成态是「变淡删除线留在原地」而不是弹统计卡。移动端 Dashboard 顶部是搜索条 + 带角标计数的导航列（[Mozaika 截图拆解](https://mozaika.design/inspiration/things-3-mobile-things-3-dashboard-task-lists-inbox)）。
- 状态语言：颜色只占 5%，[*]=今天、[!]=逾期这类**符号徽章**承载语义，绝大多数文字中性（Blake Crosley 同上）。

**→ 词笺 pattern**
- surfaced：一个「今天」级的超大章节标题、一列 44px 行的清单感、CTA。
- hidden：三个大数字读数、spec 工单表——全部离开首屏，只留行内小徽章。
- css_only：
  ```css
  /* 把 masthead 让位给「章节标题」：eyebrow 升为 28px 大标题 */
  .start__eyebrow{font-size:clamp(24px,7vw,30px);font-weight:700}
  /* CTA 伪装成清单第一行：整行 52px、左侧圆环勾选框、发丝下边框 */
  .btn--primary{display:flex;align-items:center;height:52px;border-radius:0;
    border-bottom:1px solid var(--rule)}
  .btn--primary::before{content:"";width:22px;height:22px;border:1.5px solid currentColor;
    border-radius:50%;margin-inline-end:12px;flex:none}
  /* 数字降级：readouts 拆壳后变行尾徽章 */
  .readouts{display:contents}
  .readout{min-height:44px;display:flex;justify-content:space-between;
    align-items:center;border-bottom:1px solid var(--rule)}
  ```
  360px 安全：全部单列，无横向元素。

### 2. Linear —— 「侧栏指挥 + 44px 密行 + Cmd+K 面板」

**骨架事实**
- 全局 chrome 只有侧栏与顶栏，侧栏控制主视图内容；重设计时反复试验「极紧凑 vs 较宽松」的侧栏档位（[Linear 官方：How we redesigned the Linear UI Ⅱ](https://linear.app/now/how-we-redesigned-the-linear-ui)）。
- iOS 版**没有底部 tab bar，导航是滑出侧栏**；列表行 44pt：状态图标→编号→标题→优先级条→头像，行距 0，靠 hover 底色与分组头分隔（[Linear iOS DESIGN.md](https://github.com/feimacode/open-design-agent-kit/blob/f99b3caeb91b7410d54610f3a2e41744adfccff7/packages/content/assets/open-design/design-systems/linear-ios/DESIGN.md)）。
- 「密度即产品」：没有展示型大标题，issue 标题就是页面上最大的字；一行能看见就是少滚一次（同上；[linear-design-patterns](https://askill.sh/skills/gh/marcus/marcus-skills/@linear-design-patterns)）。
- 状态用**画出来的图标语言**（空心圈/半圆/勾）和三条优先级竖杠，不用彩色填充徽章；分组头 sticky、带计数 chip 与折叠 chevron（DESIGN.md 同上）。
- 进度是一条 **6pt 高的横向 cycle bar** + 一行小注「14 of 23 completed · 4 days left」——数据是条和字，不是卡。
- 灵魂界面是 **Cmd+K 命令面板**：居中 sheet、顶部一行输入、下面 40pt 结果行、行尾等宽字快捷键；键盘提示只在 hover/focus 时显形（[Blake Crosley 文内 CSS 模式](https://blakecrosley.com/zh-Hans/guides/design/things)、DESIGN.md）。
- 深色侧栏 + 键盘优先 + 克制到近乎攻击性的极简，被整代 B2B 产品抄成模板（[925 Studios 拆解](https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026)）。

**→ 词笺 pattern**
- surfaced：一行「命令输入框」形态的 CTA、44px 密行、一条进度条。
- hidden：卡片式容器、大数字；一切改为行 + 发丝线。
- css_only：
  ```css
  .today-card{background:none;border-radius:0;padding:0}      /* 拆卡 */
  .today-card__head{position:sticky;top:0;display:flex;gap:8px;align-items:baseline}
  .today-card__head::after{content:"5";margin-inline-start:auto;  /* 计数 chip */
    font:500 12px/1 var(--mono);padding:3px 8px;border-radius:6px;background:var(--surface-2)}
  /* cycle bar：用 reason 行偷一条 6px 进度轨 */
  .today-card__reason{height:6px;border-radius:3px;overflow:hidden;
    background:var(--track);font-size:0}
  .today-card__reason::before{content:"";display:block;height:100%;width:60%;
    background:var(--accent)}
  ```

### 3. Fantastical —— 「DayTicker 横带 + 三视图联动 + 下拉开合」

**骨架事实**
- iPhone 首屏被切成两段：**顶部 DayTicker 横滚日期瓦片带 + 下方当日事件列表**，两段联动：滑 DayTicker，下面日程跟着换天（[9to5Mac 评测](https://9to5mac.com/2012/11/29/review-fantastical-for-iphone-the-calendar-upgrade-ios-6-is-missing/)、[Flexibits 官方帮助](https://flexibits.com/fantastical-ios/help/calendar-views)）。
- 每格日期里事件是**按时间落位的彩色药丸**——一天density 压缩成一条可视刻度，而不是数字。
- 纵向手势切换信息粒度：下拉露出月历、上滑进任务视图、再下拉进全屏日/周/月/季/年视图；**年视图是热度图**，密度靠「一页色块」表达（帮助页同上；[MacObserver](https://www.macobserver.com/iphone/fantastical-event-entry/)）。
- iPad 版是三联联动窗格：上午周条、左 agenda、右月历，任一窗格滑动其余跟随（[ZDNet 评测](https://www.zdnet.com/article/review-fantastical-2-for-the-ipad-to-organize-your-busy-schedule/#1)、[MacStories](https://www.macstories.net/reviews/fantastical-for-ipad-review/)）。
- 数据观：一切「量」都画成时间轴上的占位（pill 宽度/位置、heat 深浅），首页不放汇总大数字；具体日程细节藏在点开后。

**→ 词笺 pattern**
- surfaced：一条横向可滚的「今日刻度带」，格子里是点/条，不是大数。
- hidden：读数与统计整块移去日历页/我的页，首屏只留这条带。
- css_only：
  ```css
  /* readouts 拆壳，和 today-card__figures 合并成一条 sticky ticker */
  .readouts{display:contents}
  .start{display:grid;grid-template-rows:auto auto 1fr}
  .today-card__figures{position:sticky;top:0;z-index:2;display:flex;gap:8px;
    overflow-x:auto;scrollbar-width:none;padding:8px 16px}  /* 横滚只发生在带内 */
  .readout{flex:none;width:104px;border-radius:10px;padding:8px}
  .today-card__figure{flex:none;width:104px}
  .today-card__figure b{display:block;height:6px;border-radius:3px;   /* 药丸化 */
    background:linear-gradient(90deg,var(--accent) 0 60%,var(--track) 60%)}
  ```
  360px：`overflow-x:auto` 限于带内，页面零横向溢出；`scroll-snap-type:x mandatory` 增强瓦片感。

### 4. Notion —— 「侧栏常驻 + Home 即小组件拼盘」

**骨架事实**
- 导航永远在左侧栏，Home 只是侧栏顶部的一个入口（可用快捷键直达）；页面本体是文档流（[腾讯云·Notion Home 介绍](https://cloud.tencent.cn/developer/article/2392998)）。
- Notion Home 不是自由排版，而是**固定 widget 集合**：问候语 → 最近浏览（20 条，横向滑动）→ Upcoming Events → My Tasks（跨库汇总）→ Suggested / Trending（[小勝利教学](https://smallwinstw.com/notion-home/)、[Notion 官方帮助](https://www.notion.so/pt-br/help/home-and-my-tasks)）。
- 信息架构取舍：首页只放**「下一步能点的东西」**（任务行、日程、页面链接），数据库的真实体量（总页数、统计）全部在二级视图；问候语承担情绪位而不是数据位（同上）。
- Dashboard 教程的共同结论：Notion 式首页 = 一个「指挥中心」页，把各库的**筛选视图**嵌进来，而不是把数字摆上来（[The Bricks 教程](https://www.thebricks.com/resources/how-to-create-a-dashboard-in-notion)）。

**→ 词笺 pattern**
- surfaced：问候/状态一行 + 两组「快捷入口列表」（今天要做的事、待复习）。
- hidden：所有总量数据（总词量、累计）挪去「我的」页；首页只留动词。
- css_only：
  ```css
  /* 用 eyebrow/kicker 做时间感问候位，spec 四行变「快捷入口」双列 */
  .start__spec{display:grid;grid-template-columns:1fr 1fr;gap:0 12px}
  .start__spec>div{min-height:44px;display:flex;align-items:center;
    border-bottom:1px solid var(--rule)}
  .start__spec::before{content:"快速访问";grid-column:1/-1;font-size:12px;
    letter-spacing:.08em;opacity:.6;padding:16px 0 4px}
  /* .start__meta 当问候语：writing 用伪元素替换成「早上好」 */
  .start__meta{font-size:18px}
  ```
  360px：双列每格 ≥164px 仍容 14px 中文两字标签，需 `overflow-wrap:anywhere` 防溢出。

### 5. Todoist —— 「默认落在今天 + 分区标题 + 中央 + 钮」

**骨架事实**
- App 图标点开**默认就是 Today 视图**（无需导航一步到位）；Today 只列带日期任务，**优先级 P1 置顶且只有 P1 用红**，过期任务单独成「已过期」分区并配「重新安排」行内批量动作（[Pratt IXD 评析](https://ixd.prattsi.org/2024/01/design-critique-todoist-ios-app/)、[Todoist 官方：今天视图](https://www.todoist.com/zh-CN/help/todoist/get-started/plan-your-day-with-the-today-view-UVUXaiSs)）。
- 项目/标签/筛选都在**左滑侧栏树**里；首页不放项目全览，只放「今天该做的事」这一个横截面。
- iOS 底部中央是**全局 + 快速添加**，键盘快捷键（⌘F/⌘N）覆盖搜索与新建（[Todoist 快捷键表](https://defkey.com/uz/todoist-klaviatura-yorliqlari)）。
- 同一数据支持列表/看板/表格/日历六种布局互切，入口收在**右上角「查看」图标**里——布局是视图属性，不是首页结构（[布局帮助文档](https://www.todoist.com/zh-CN/help/todoist/features/use-the-board-layout-in-todoist-AiAVsyEI)、[自定义视图](https://www.todoist.com/zh-CN/help/todoist/features/customize-views-in-todoist-AoHhBxFdZ)）。
- 未完成任务数放在**应用图标角标**里——统计被推到系统层，首页角标化、行内 chip 化，不做仪表盘。

**→ 词笺 pattern**
- surfaced：只有「今天 + 已逾期」两个分区，每区 ≤5 行；行尾放最小状态件。
- hidden：总量/连续天数交给角标级的小 chip 或「我的」页；spec 工单表整块移列表页。
- css_only：
  ```css
  /* 分区头化：label 变 sticky 分区标题，links 变右侧批量动作 */
  .today-card__label::before{content:"今天 · ";font-weight:600}
  .today-card__head{display:flex;position:sticky;top:0;background:var(--bg)}
  .today-card__links{margin-inline-start:auto}
  /* 逾期分区用 reason.is-overdue 的 :has 触发红色行轨 */
  .today-card:has(.today-card__reason.is-overdue) .today-card__head::before{
    content:"";position:absolute;inset-inline-start:-4px;top:0;bottom:0;
    width:3px;background:var(--danger)}   /* 红色仅此一处，符合语义约束 */
  ```

### 6. Raycast —— 「输入框即首页：零 chrome，列表即一切」

**骨架事实**
- 启动器本体只有一个窗口：**顶部一行搜索输入 + 下方 44px 结果行**，行尾是快捷键/别名提示；没输入时列表就是全部（[manual.raycast.com](https://manual.raycast.com/search-bar.md)、[TYPENORM 拆解](https://typenorm.com/apps/raycast)）。
- 二级操作不占版面：选中行按 ⌘K 弹 **Action Panel 嵌套面板**，「次级命令保持可发现，但不把行弄乱」；子面板是「列表在上、输入在下」的倒置结构（cmdk Raycast 实现注记，[mintlify](https://mintlify.wiki/dip/cmdk/examples/raycast)）。
- 官网/品牌直接复用这套 in-product chrome：command-palette 卡片、keycap 字形、发丝边框、单一白色胶囊 CTA——**窗口本身被当成海报**（[Raycast DESIGN.md](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md)、[百智云 Design Prompt](https://www.baizhi.cloud/landing/design-prompt/detail/raycast)）。
- 数据观：几乎无统计展示；「状态」表现为每行右侧的一个 chip/别名，层级全靠堆叠面板推进。

**→ 词笺 pattern**
- surfaced：一个看起来像输入框的主 CTA（带假光标与 ⏎ keycap），下挂一个结果感列表。
- hidden：数字、说明、规格——全被「列表行尾的小 chip」吸收或推走。
- css_only：
  ```css
  .start__actions{order:-1;position:sticky;top:0;z-index:3;padding:8px 0}
  .btn--primary{width:100%;height:48px;border-radius:10px;border:1px solid var(--rule);
    background:var(--surface-1);color:var(--text-2);text-align:start;
    padding-inline:14px;display:flex;align-items:center}
  .btn--primary::after{content:"⏎";margin-inline-start:auto;font:500 13px/1 var(--mono);
    border:1px solid var(--rule);border-radius:4px;padding:4px 7px;background:var(--surface-2)}
  .btn--primary::before{content:"▍";margin-inline-end:10px;animation:blink 1.2s steps(2) infinite}
  @keyframes blink{50%{opacity:0}}
  ```
  44px 点击高度达标；窄屏无溢出；keycap 装饰在 360 仍留足标签文字空间。

### 7. Superhuman —— 「顶部分栏页签带计数 + 一行一条 + 键盘提示随行」

**骨架事实**
- 收件箱被 **Split Inbox 顶部页签**切成几栏，页签名旁直接标会话计数（Important 8 / Team 15…），Tab/Shift+Tab 横向跳栏；官方建议分栏 ≤7——导航密度用页签而非侧栏（[Superhuman 帮助：Split Inbox](http://help.superhuman.com/article/581-split-inbox-basics)、[Default Split Inbox](https://help.superhuman.com/hc/en-us/articles/46005619081101-Default-Split-Inbox)）。
- 列表本体是「**炭灰底上的一列单行行**：无头像、无标签树、无红点」；每个动作旁边挂一个小 key chip 教你快捷键（[designbycurio 风格拆解](https://designbycurio.com/learn/superhuman-keyboard-email-2017)）。
- 全局入口 = 两指点按/Cmd+K 唤出命令条，鼠标是回退方案；「为速度而设计的分诊模式」——先清计数，再看内容（[dezzayn 界面拆解](https://dezzayn.com/apps/superhuman)）。
- 数据观：数字只出现在页签计数与（速度条/目标进度）这类**一条横向分段轨**上，绝不做成卡片矩阵。

**→ 词笺 pattern**
- surfaced：页签化的一行状态带（今天/待复习/逾期 + 计数），下面单行列表。
- hidden：所有独立统计读数被压进页签计数；说明性文字删除。
- css_only：
  ```css
  /* readouts 变 Superhuman 式分栏页签 */
  .readouts{display:flex;gap:0;border-bottom:1px solid var(--rule);overflow-x:auto}
  .readout{flex:none;min-height:44px;padding:0 14px;display:flex;align-items:baseline;gap:6px;
    position:relative}
  .readout:first-child{color:var(--accent)}
  .readout:first-child::after{content:"";position:absolute;left:12px;right:12px;bottom:-1px;
    height:2px;background:var(--accent)}      /* 活动页签下划线 */
  .readout__v::before{content:"(";} .readout__v::after{content:")"}  /* 数字变计数 chip */
  ```
  360px：页签带自身可横滚，容器 `scrollbar-width:none`，不引发整页溢出。

---

## 二、跨产品结构规律（给词笺的结论）

1. **首页 = 今日横截面，不是统计年报。** 七个产品里没有一个把「总量大数字」当首屏焦点；数字要么进角标（Todoist）、要么进页签计数（Superhuman）、要么画成条/点（Linear cycle bar、Fantastical pill/heat）。→ 词笺的 3 个大 readout 必须**降级为行内 chip / 条 / 计数**，或整带推走。
2. **导航靠常驻侧栏或滑出侧栏，移动端甚至不要底部 tab bar**（Things、Linear 明确如此）→ 词笺首页可以把「导航感」做在左缘 rail 或顶部分区头，而不是磁贴。
3. **密度 = 行 + 发丝线 + sticky 分组头，不是卡片。** 卡片（today-card）在这批产品里几乎只用于浮层（命令面板、sheet），首页本体都是 flat 行列表。→ 纯 CSS 拆卡是本轮最划算的一刀。
4. **CTA 要么像输入框（Raycast/Linear/Superhuman 的 ⌘K 隐喻），要么悬浮成唯一带阴影的创建钮（Things/Todoist）。** 二者都不是「页面中部一颗胶囊按钮」。→ 词笺 `.btn--primary` 应改形：命令栏 or 底部悬浮动作条。
5. **状态用符号语言**：圈/半圆/勾/点/星，加一行等宽字注记，不用彩色徽章文字。→ 伪元素 `content` 就是词笺的「图标系统」。

---

## 三、给词笺首页的 3 个结构方向（骨架级不同，配色只是附属）

> 共同前提：`.start__title` / `.start__lede` 删除；`display:contents` 可拆 `.readouts`、`.today-card__figures`、`.start__masthead` 的壳。三个方向的**版面骨架互不重叠**，也不同于 bento（不对称磁贴网）、play（奶油+厚按钮纵向堆）、nocturne（暗色排印海报）。

### 布局 A 「命令面板首页」（Raycast × Linear）
- **骨架**：`topbar` 压成一条发丝细栏；`.start__actions` 用 order:-1 + sticky 提到**首屏第一格**，`.btn--primary` 重画成 48–52px 全宽「输入框」：左侧假光标 `▍`、右侧 `⏎` keycap。其下是一整列 44px 高、发丝线分隔的**结果行**：`display:contents` 把 3 个 readout、3 个 today-card__figure、spec 4 行全部摊平成同一个 list 容器的子项（`.start{display:grid}` + contents），每行 = 标签居左、值/计数靠右等宽字。today-card__reason 变成列尾一条 6px 进度轨。无卡片、无圆角容器、零阴影。
- **首屏焦点**：那条「输入框 CTA」；视线动线是 输入框→列表，和启动器同构。
- **数据**：只以「行尾 chip」出现（如 `今日新词 · 5`），总量/连续挪去「我的」页做完整仪表，spec 工单表挪去列表页页眉。
- **CTA**：顶部 sticky 满宽命令栏，滚不丢；按下态做 inset 底色而非位移。
- **与 bento/play/nocturne 的区别**：三者都是「块状容器 + 中部按钮」；本方向是「一条输入框 + 一列 flat 行」，容器感归零，且 CTA 从页面中部移到顶端并改变形态（按钮→输入框隐喻）。
- **360 校核**：单列无横向元素；行内 `min-width:0 + ellipsis`；keycap 固定 24px 不参与挤压。

### 布局 B 「侧栏仪表盘」（Notion × Todoist × Things Slim Mode）
- **骨架**：`.start` 改 `grid-template-columns:48px 1fr`，左缘一条**全高固定 rail**：`.brand` 竖排（`writing-mode:vertical-rl` 的伪元素或旋转文本），rail 上依次钉 3 个 readout 的**点状状态**（10px 圆点 + `counter`/伪元素数字）与两个文字链（`.today-card__links` 移到 rail 底部当「导航树」）。右列才是内容：章节大标题（eyebrow 升 26–30px）+ 今日清单行。rail 用 `position:sticky`/`fixed` + 列宽实现，topbar 的 icon-btn 视觉上并入 rail 顶端。
- **首屏焦点**：右列顶部的大标题与第一行动作；左 rail 提供「我在一台带导航的仪表里」的结构感——这是词笺从未有过的**双栏骨架**。
- **数据**：连续天数、总词量等「存量」整体推去「我的」页；rail 只留今日待办的**在/不在**信号（点亮的点）。数字细节收进日历页。
- **CTA**：右列底部 `position:sticky` 的满宽动作条（Todoist 中央 + 钮的移动端等价物），拇指热区。
- **与 bento/play/nocturne 的区别**：首次引入常驻导航栏概念（bento 是磁贴网、play/nocturne 是单列流）；信息架构从「一张纸往下读」变成「左导航 + 右视图」。
- **360 校核**：48px rail + 312px 内容列，rail 项 44×44；`@media (max-width:374px)` 下 rail 收窄到 44px、点状数字用 `font-size:10px` 伪元素保证对比度；rail 永不横滚。

### 布局 C 「DayTicker 议程」（Fantastical × Superhuman）
- **骨架**：页面三段式：**顶部 sticky 横滚刻度带**（`display:contents` 合并 readouts + today-card__figures 成 6 格瓦片带，每格上小标签下**药丸/条**——`b` 数字压成 `linear-gradient` 刻度条）；中段是 spec 四行充当「今日议程」单行列（Superhuman 式一行一条 + 行尾 key chip）；底部 `fixed` 一条 56px 动作坞承载 `.btn--primary`（Things Magic-Plus 的横条变体，全站唯一阴影位）。`.start__foot/.start__rule` 垫在坞上方防遮挡。
- **首屏焦点**：顶部那条带——像 Fantastical 一样「先看今天长什么样」，而不是「先看今天有多少」。
- **数据**：带内只留比例与点状密度；绝对值（总词量、连续天数）从首页消失，进「我的」页表格与日历页 heat 格（年视图热度图可用 `conic/linear-gradient` 在日历页重绘，本页不做）。
- **CTA**：底部悬浮动作坞，满宽 56px 高，永远在拇指位；与 A（顶栏输入框）、B（右列底部条但页面结构不同）形态与锚点都不同。
- **与 bento/play/nocturne 的区别**：唯一使用**横向滚动带 + 底部坞**的骨架；数据可视化是「条/药丸占位」而非「数字磁贴」；纵向阅读被替换为「带→议程→坞」的操作动线。
- **360 校核**：横滚只发生在带容器内部（`overflow-x:auto` + 容器本身 `width:100%; margin-inline:0`，瓦片 `flex:none; width:96px`），页面零横向溢出；坞 `inset-inline:0 + padding-bottom:env(safe-area-inset-bottom)`。

---

## 四、来源清单

**Things 3**
- https://www.ifanr.com/app/862042 （5Key：Dashboard+二级List 两层框架、隐形浮层）
- https://www.gadgets360.com/apps/reviews/things-3-app-review-1727275#1 （大标题置顶、单列任务）
- https://culturedcode.com/things/features/ （Slim Mode、可收侧栏、Quick Actions）
- https://mozaika.design/inspiration/things-3-mobile-things-3-dashboard-task-lists-inbox （移动 Dashboard：搜索条+带角标导航列）
- https://blakecrosley.com/zh-Hans/guides/design/things （符号化状态、键盘模式、快捷键 CSS 注记）
- https://github.com/feimacode/open-design-agent-kit/blob/f99b3caeb91b7410d54610f3a2e41744adfccff7/packages/content/assets/open-design/design-systems/things-3-ios/DESIGN.md （28pt 标题、44pt 行、Magic-Plus 56pt、无底部 tab bar、pie-progress）
- https://www.trustradius.com/products/things/details （Today 内日历事件分组置顶、This Evening）

**Linear**
- https://linear.app/now/how-we-redesigned-the-linear-ui （侧栏=全局 chrome、紧凑/宽松档位试验）
- https://github.com/feimacode/open-design-agent-kit/blob/f99b3caeb91b7410d54610f3a2e41744adfccff7/packages/content/assets/open-design/design-systems/linear-ios/DESIGN.md （44pt 行、无 tab bar 的滑出侧栏、Cmd+K 面板、6pt cycle bar、sticky 分组头、图标化状态）
- https://www.925studios.co/blog/linear-design-breakdown-saas-ui-2026 （深色侧栏+键盘优先的结构性影响）
- https://askill.sh/skills/gh/marcus/marcus-skills/@linear-design-patterns （keyboard-first、高密度、dark-first 模式归纳）

**Fantastical**
- https://flexibits.com/fantastical-ios/help/calendar-views （DayTicker 定义、下拉月历/上滑任务/全屏视图、年视图热度图）
- https://9to5mac.com/2012/11/29/review-fantastical-for-iphone-the-calendar-upgrade-ios-6-is-missing/ （上带下列的两段式结构）
- https://www.macobserver.com/iphone/fantastical-event-entry/ （横滚瓦片带+滑动联动列表）
- https://www.zdnet.com/article/review-fantastical-2-for-the-ipad-to-organize-your-busy-schedule/#1 （iPad 三窗格联动）
- https://www.macstories.net/reviews/fantastical-for-ipad-review/ （Dashboard 窗格关联、DayTicker 下拉半周视图）

**Notion**
- https://cloud.tencent.cn/developer/article/2392998 （Notion Home：侧栏入口+快捷键+问候/最近/任务）
- https://smallwinstw.com/notion-home/ （widget 清单：问候/最近浏览/Upcoming/My Tasks/Suggested/Trending）
- https://www.notion.so/pt-br/help/home-and-my-tasks （最近 20 页横滑、官方 Home 帮助）
- https://www.thebricks.com/resources/how-to-create-a-dashboard-in-notion （Dashboard=嵌入筛选视图的指挥中心）

**Todoist**
- https://ixd.prattsi.org/2024/01/design-critique-todoist-ios-app/ （默认落 Today、图标角标计数、Quick Actions）
- https://www.todoist.com/zh-CN/help/todoist/get-started/plan-your-day-with-the-today-view-UVUXaiSs （P1 红色置顶、过期分区+重新安排）
- https://www.todoist.com/zh-CN/help/todoist/features/use-the-board-layout-in-todoist-AiAVsyEI （布局切换入口在右上角查看图标）
- https://www.todoist.com/zh-CN/help/todoist/features/customize-views-in-todoist-AoHhBxFdZ （六种布局=视图属性）
- https://defkey.com/uz/todoist-klaviatura-yorliqlari （⌘N/⌘F 全局快捷键）

**Raycast**
- https://manual.raycast.com/search-bar.md （Root Search 与 Action Panel：⌘K 嵌套次级命令）
- https://typenorm.com/apps/raycast （输入即导航、行选中→下钻视图、Esc 弹栈）
- https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/raycast/DESIGN.md （command-palette chrome 被当作品牌本体、发丝边框、单白胶囊 CTA）
- https://www.baizhi.cloud/landing/design-prompt/detail/raycast （palette 卡片/行/keycap 簇的组件级结构描述）
- https://mintlify.wiki/dip/cmdk/examples/raycast （子面板「列表在上、输入在下」的倒置结构）

**Superhuman**
- http://help.superhuman.com/article/581-split-inbox-basics （顶部页签带计数、Tab 跳栏）
- https://help.superhuman.com/hc/en-us/articles/46005619081101-Default-Split-Inbox （分栏 ≤7、计数服务于 Inbox Zero）
- https://designbycurio.com/learn/superhuman-keyboard-email-2017 （单列单行、无头像/树/红点、动作旁 key chip）
- https://dezzayn.com/apps/superhuman （键盘优先反转为默认、命令面板、分诊流）
