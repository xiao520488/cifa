# 领域调研 09 · 新闻 / 高密度终端 —— 首页骨架拆解

- 调研日期：2026-11-25
- 负责领域：**新闻/高密度终端**（Bloomberg Terminal、Bloomberg Mobile、Feedly、Inoreader、Reuters、FT、财新、Are.na）
- 任务定位：**只谈版面骨架**——焦点放在哪、几栏、信息密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。不谈配色情绪。
- 领域立场：把「少即是美」反过来做——**密度即信任感**。首屏不是欢迎页，是仪表盘/头版/订阅流。
- 落地目标：给「词笺」首页（皮肤只能改 CSS，DOM 固定）提出 3 个**结构上真正不同**的布局方向，回应「三版基本是同一个 UI 换个色」的批评。

---

## 〇、词笺首页 DOM 素材速查（本笔记自包含）

```
.app（外壳）
├─ header.topbar：.brand(.brand__name=词笺 / .brand__dot / .topbar__meta 小字) + 2×.icon-btn(日历/外观) + .avatar-btn(我的)
├─ .readouts：3×.readout(.readout__k 标签 / .readout__v 值)   ← 今日 / 批数 / 已学
└─ main.app__main > .screen > .start
   ├─ .start__masthead（含 S6 日期 .start__masthead-meta）
   ├─ .start__kicker（阶段短码+DAILY LIST）/ .start__eyebrow（词库总量）
   ├─ .start__title（大标语）/ .start__lede（玩法段）   ← 新皮肤一律 display:none
   ├─ .start__meta（一行小字：今日N词/已学N词，与 readouts 重复）
   ├─ .start__spec：4 行 k/v 工单表（阶段/今日新词/批次/已学·总量）
   ├─ .start__actions > .btn--primary（「开始背单词」）
   ├─ section.today-card
   │   ├─ .today-card__head > .today-card__label（今日·M月D日 周X）+ .today-card__links（错词本N / 日历 两个文字链）
   │   ├─ .today-card__figures > 3×.today-card__figure(.today-card__tag + <b>数字，T6 逾期带 .is-warn，另有 .is-accent)
   │   └─ .today-card__reason.is-increase|is-decrease|is-paused（原因句/待复习句）
   └─ .start__foot > .start__rule
```

已验证的外壳事实（见 `02-finance.md` §1、`00-data-inventory.md`）：
- **`.readouts` 在 `.app` 外壳、不在 `.app__main` 滚动容器里**——它天生就是「常驻状态条/行情条」，不随正文滚走；代价是永久吃掉约 94px（顶栏 60 + 读数条 34），钉底元素必须按此扣高。
- 首页数字大量重复：今日新词出现 3 次（readout S3 / meta S10 / spec S12 / figure T4），已学同样重复——皮肤可放心砍副本，不丢唯一性。
- 首页**独享**数据仅两项：批数（S4/S13，页面级只此一处）、pendingReviews 合计句（T9）——动版式时这两项是「隐藏红线」。
- 可点目标共 7 个：2×`.icon-btn`、`.avatar-btn`、`.btn--primary`、`__links` 内 2 链、`.start__foot` 1 链。

---

## 一、速览表（8 个对象的首页骨架）

| 产品 | 首屏焦点 | 栏数 | 密度 | 导航位置 | CTA 形态 | 数据放首页？ | 什么被藏起来 |
|---|---|---|---|---|---|---|---|
| Bloomberg Terminal | 全屏面板矩阵：行情滚动条+几十行×几十列表格+菜单，**没有"第一焦点"**，密度本身是焦点 | 多面板平铺 | 极高（Tufte 式"数据墨水"） | **键位即导航**：功能键+命令行+`<GO>`，END MENU 逐级退回 | 无营销按钮——"输入代码→<GO>"就是动作 | 全部放；首页=MENU 目录本身 | 深层工作流藏进键序（CTO："We're hiding complexity"——藏复杂度，不藏数据） |
| Bloomberg Mobile | 市场数据条 + 混合了行情指标的头条 feed | 单列流 + 顶部 ticker 条 | 中高（新闻与数字同行混排） | 底部 tab + 常驻播放条 | 无主 CTA；点行即进入 | 行情/新闻全放首页 feed | 终端级功能(TOP 等)砍掉或进独立 tab |
| Feedly | 文章行流（打开即流，无欢迎层） | 经典三栏（订阅树/行流/预览），可折叠 | 高，且**密度是用户设定项**（Compact/Comfortable） | 左栏订阅树 + 三点菜单 | 无——读即动作；列表行本身是入口 | 未读数/栏目/时间全在行上 | 正文进右栏或点进；布局切换藏在三点菜单 |
| Inoreader | 内容流本身；布局可选 List/Expanded/Column/Card/Magazine 5+1 种，按 feed 记忆 | 视布局而定，Column=多栏并排看板 | 高（可选） | 左侧图标栏常驻 + 顶栏 | 弱；行/卡即入口 | 未读、标签、日期分组上屏 | 布局开关藏 Header 三点菜单（可发现性代价） |
| Reuters | 快讯条 + 左大头条 + 右标题列表（每行带栏目标签+时间）；右列可切 Latest/Most read | 桌面三栏响应式，白底黑字，顶部 9 大类固定导航 | 高（纯文字标题墙，图是例外） | 顶栏分类导航；首屏顶部留白色横条开隐藏菜单 | 无 CTA；标题即链接 | 头条+时间戳全放 | 次级版块全进导航/搜索后 |
| FT | Top stories 列表（10 条，按重要性排序，每条=标题+摘要+时间+分类+相关） | 严格印刷网格多栏，hairline 分题 | 高（报纸版面搬上网） | 顶栏 + 下拉里藏大量子导航 | 订阅按钮在顶部横带 | 头条层级+数据同屏 | 深层子栏目进 dropdown；"报纸是工具"哲学 |
| 财新（改版批评佐证） | 传统三栏：左中主内容+右辅助；**行情模块位置被批"太靠后"** | 三栏 | 极高（改版后 19 图/屏反被批冗余） | 顶部栏目条 | 订阅读者入口置顶 | 财经站第一眼就该有行情（批评者观点） | 长尾内容进频道页 |
| Are.na | **均匀方块网格，零层级**——所有 block 等大，caption 在下 | 单屏网格（接触印相/索引卡语法） | 高（整屏同权重的格子） | 几乎无导航 chrome，界面"退到材料后面" | 刻意没有；"poor fit for conversion-driven pages" | 全部材料直接上网格，无欢迎层 | 连品牌都藏起来；详情在点进后 |

**一句话总结本领域**：新闻/终端类产品从不做「首屏一个情绪标语 + 一个燃按钮」——它们的首页是**行情条 + 行式列表 + 栏目标签 + 发丝线**组成的可扫描表面；导航要么常驻（顶栏/左树/键位），要么干脆用"点行即进入"取消按钮。**被藏起来的永远是长尾操作，不是核心数字。**这与 `02-finance.md` 记录的金融 App 集体减法趋势正好互为反例。

---

## 二、领域公共语法（做骨架时直接引用的 8 条）

1. **常驻横条（ticker）**：屏顶一条不滚走的实时数据带。词笺的 `.readouts` 因为在外壳层，**物理上已经是这条**——本领域是把它的视觉语言做满（分隔线、tabular 数字、涨跌 chip），而不是像别的领域那样把它降级成小字。
2. **行是原子单位**：信息以"行"而非"卡片"呈现；分隔靠 1px hairline 而非 gap+阴影+圆角。`.start>*+*{border-top:1px solid}` 一条规则就能把纸感卡片页改写成表格页。
3. **label 左 · 数字右**：终端表格语法；数字一律 `font-variant-numeric:tabular-nums`，等宽对齐，配虚线引导线（dotted leader）。
4. **栏目标签（kicker）**：小字号大写 mono 的分区头。词笺的 `.start__kicker`（阶段短码+DAILY LIST）、`.today-card__tag` 是现成素材，别浪费。
5. **密度即信任**：首屏可见行数≈专业感。欢迎语、情绪标语、玩法说明全部删除（用户已要求删 title/lede，本领域正好提供了"删得理直气壮"的依据）。
6. **CTA 是命令不是营销**：命令行 `<GO>`、菜单行、feed 内联行——形态是"扁、宽、左对齐、等宽字体"，不是居中大圆角胶囊。
7. **导航在边缘**：顶条/底条/左树常驻，正文区完全让给数据。中栏永远是"读"，两翼永远是"走"。
8. **藏复杂度 ≠ 藏数据**：Bloomberg CTO 原话是 conceal complexity——把操作层级藏进键序/二级页，但**所有关键数字留在首屏**。词笺对应：入口链(错词本/日历)可以变形，数字不该从首页消失（批数、pendingReviews 句是首页独享红线）。

---

## 三、逐产品拆解 + 可迁移 CSS

### 1. Bloomberg Terminal（桌面终端原型）

**structure**
- 首页不是一个"页面"，是**面板矩阵**：滚动行情火花线、含几十行×几十列的交易量表格、滚动头条、指令牌同屏（InfoQ 对彭博终端的描述几乎是本领域的定义文本："在一页上……以及上述所有内容的 UI 指示牌"）。
- 导航=键盘：绿色动作键、黄色市场分区键、`Esc CANCEL`/`END MENU` 逐级退回 Home menu；输入代码+`<GO>`执行。屏幕被分成"四个面板/独立工作站"级单位。
- 留白趋近于零；层级靠线、底色块、颜色编码，不靠字号落差。

**surfaced**：行情、表格、新闻、函数入口——全部第一眼。
**hidden**：功能的深层组合藏进键序与菜单层级；"hiding complexity"（Bloomberg UX 团队自述），用户旅程靠渐进披露而不是首页堆叠。

**css_only（词笺迁移）**
把首页摊平成 watchlist 行表：

```css
[data-skin='x'] .readouts,[data-skin='x'] .today-card__figures{display:contents}
/* 3 readout + 3 figure + 4 spec-row 全部成为 .start 网格的直属行 */
[data-skin='x'] .readout,[data-skin='x'] .today-card__figure{
  display:grid;grid-template-columns:5.5em minmax(0,1fr);align-items:baseline;
  min-height:44px;padding-block:7px;border-top:1px solid var(--line)}
[data-skin='x'] .readout__k,[data-skin='x'] .today-card__tag{font-size:14px}
[data-skin='x'] .readout__k{ /* 虚线引导线：文字后面拉一条点线到数字 */
  flex:1;text-align:left;position:relative}
[data-skin='x'] .readout__v,[data-skin='x'] .today-card__figure b{
  justify-self:end;font-variant-numeric:tabular-nums}
```

- `display:contents` 是本领域的核心杠杆：`.readouts`/`__figures`/`__head` 都是纯包装层，拆掉后叶子行才能跨容器排进同一张网格——这是"终端表格"和"三张卡片"的本质区别。
- 360：引导线在窄屏留 `5.5em` 标签位即截断（`overflow:hidden`），数字 `clamp(20px,5.4vw,28px)` 保证不撑破；表格全用 `minmax(0,1fr)` 防长值溢出。
- 1440：`.start{display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr)}`，左列行情、右列规格表，中间 `border-left:1px solid`——终端双面板。

### 2. Bloomberg Mobile

**structure**
- App 版把终端简化为：**顶部市场条 + 单列新闻 feed**，feed 里"头条与关键行情指标混排"（screensdesign 测评原话：seamlessly blends top headlines with key market indicators），底部 tab，另有一条**常驻** 的媒体播放条。
- 2013 大改版确立的原则：横竖屏都服务"边看行情边刷 feed"，portfolio 与市场数据内嵌 feed 流而非独立页。

**surfaced**：市场条、watchlist 行（symbol|价格|涨跌 chip）、时间戳、音频入口。
**hidden**：终端级函数；图表交互进独立视图。

**css_only**
`.readouts` 天生常驻 → 直接按"市场条"语法做：

```css
[data-skin='x'] .readouts{display:flex;gap:0;border-block:1px solid var(--border-strong)}
[data-skin='x'] .readout{flex:1 1 33%;display:flex;flex-direction:column;gap:2px;
  padding:6px 10px;border-inline-start:1px solid var(--line)}
[data-skin='x'] .brand__dot::after{ /* 伪元素做"实时"呼吸点，替代 ticker 动效 */
  content:'';position:absolute;inset:-4px;border-radius:50%;
  border:1px solid var(--accent);animation:pulse 2.4s infinite}
@keyframes pulse{50%{opacity:.25}}
@media (prefers-reduced-motion:reduce){[data-skin='x'] .brand__dot::after{animation:none}}
```

- **真·横向 marquee 跑马灯不可行**：DOM 只有一份内容，`translateX` 循环会出现空窗——本领域笔记先说破，免得别的皮肤踩坑。可用的降级是"呼吸点 + sticky 行情条"。
- 360：`flex:1 1 33%` 三项均分（360/3=120px，够放"今日·08"），标签 `font-size:14px`（中文小字下限）、数值 tabular 防抖。
- 语义色两档：`.is-warn` 的逾期项在浅色档用 `#8c1d18` 级深红字 + 5% 红底，深色档用浅红字 + 12% 红底，只写 `.readout:has(.is-warn)` 一类选择器，**红只给逾期**。

### 3. Feedly

**structure**
- 经典**三栏**：左订阅树（未读数贴项）/ 中文章行流 / 右预览；栏可折叠。iPad 版曾在 Featured 下半部用三栏网格（ux.stackexchange 老帖）。
- 密度是**产品功能**：View（Text-only/Magazine/Cards）× Density（Compact/Comfortable）两级开关在移动端导航栏三点里；未读数可整列隐藏（NetNewsWire 同类讨论："hide unread counts or replace them with a •"——**数字带来的焦虑也要可关**）。
- 打开即流：没有欢迎页、没有情绪标语，行=标题+来源+时间+hairline。

**surfaced**：未读数、栏目名、时间戳、筛选 chip。
**hidden**：正文进右栏/点进；设置与布局切换藏三点菜单。

**css_only**
"左树右流"的驾驶舱骨架（详见布局 B）；单点技法：

```css
[data-skin='x'] .today-card__links .btn--compact{ /* 订阅 chip 行（Feedly filter bar） */
  min-height:44px;padding:10px 14px;border:1px solid var(--border-strong);
  border-radius:999px;font-size:14px}
[data-skin='x'] .today-card__links{display:flex;gap:8px;overflow-x:auto;
  scrollbar-width:none;padding-bottom:2px}
```

- 360：chip 行横向滚动是零溢出安全阀（内容再宽也不破版）；`scrollbar-width:none` 去掉滚动条毛刺。
- Compact 密度复刻：`.start{gap:0}` + 每个直属子项 `border-bottom:1px solid var(--line);padding-block:10px`——Feedly 的"密"来自线，不是来自缩小字号。

### 4. Inoreader

**structure**
- 布局选项之王：**List / Expanded / Column / Card / Magazine 五种全局布局** + 收藏/归档页追加 Reading list 第六种；按 feed/文件夹各自记忆，文件夹的选择下传给所有 feed（官方帮助文档原文）。
- 左侧图标栏常驻作工作区导航；Column 视图＝多栏并排的看板，是"同一 DOM、不同骨架"的现实范本。

**surfaced**：未读、tag、日期分组；行流为默认语法。
**hidden**：布局切换藏 Header 三点菜单顶部——功能在，可发现性差（改版评论的常见槽点）。

**css_only**
Inoreader 教给皮肤系统的是：**@media 断点即"布局选项"**——同一 DOM 在三档视口给三种骨架：

```css
[data-skin='x'] .start{display:grid;grid-template-columns:minmax(0,1fr)}      /* 360 = List */
@media (min-width:768px){
  [data-skin='x'] .start{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:0}
  [data-skin='x'] .start>*{border-inline:1px solid var(--line)}              /* 768 = Column 看板 */
}
@media (min-width:1440px){[data-skin='x'] .start{max-width:1200px;margin-inline:auto}}
```

- 2 栏时行高不齐的问题用 `align-content:start` + 行 `border` 接受错落——终端看板允许不齐。
- 360 单列永远是安全底；所有多栏语法都包在 `@media(min-width:768px)` 里，符合"360 零横向溢出"硬约束。

### 5. Reuters / 通讯社（含新闻头版通用语法）

**structure**
- 桌面端：白底黑字、**三栏响应式、顶部固定 9 大类导航**（World/Politics/Business/Markets/Tech/Legal/Sustainability/Investigations/Graphics）（szonline 拆解）。
- 头版研究（VSU 论文对 reuters.com 首屏的分析）：第一屏顶部一条**宽白带**——用来开隐藏菜单而不遮挡内容；主新闻从首屏下缘才开始，逼出滚动深度；这套与 WSJ 同构。
- 通用头版 wireframe（ENVY PATTERNS 收录的形态）：**顶部 breaking-news bar → 左侧最大故事 + 右侧纯标题列表（每条带分类标签+时间）→ 右列可切 Latest/Most read → 下方分栏目成排**；移动端大故事置顶、列表下排。
- Signed-out 结构（typenorm 拆解）：section fronts 高度模板化；文章页**先给 figures 再给正文**——数据前置是本领域共识。

**surfaced**：快讯、分类标签、时间戳。整站几乎无营销文案。
**hidden**：次级栏目全进导航条/搜索；breaking bar 只在有 breaking 时出现（条件式版面）。

**css_only**
- **栏目标签系统**：`.start__kicker`/`.start__eyebrow` 改成 mono 大写标签 + 前置色块：

```css
[data-skin='x'] .start__kicker{font:700 11px/1 var(--mono);letter-spacing:.14em;
  text-transform:uppercase;padding-inline-start:10px;border-inline-start:3px solid var(--accent)}
```

- **breaking bar**：外壳 `.readouts` 上 `background:var(--accent-soft)` + `border-inline-start:4px solid var(--accent)`，它就是快讯条。
- **条件式头版**（对应 Latest/Most read 切换、is-* 三态）：`:has()` 换整页首行——`.today-card:has(.is-warn){outline:1px solid var(--danger-border)}`，有逾期时"快讯条"高亮；无逾期时安静。
- 360 注意：**伪元素里的文字是写死的**，不能造"12 分钟前"这类假动态数据；中文伪元素文案必须 ≥14px，11px 只给拉丁短码（BREAKING→用现成 kicker 文本更稳）。

### 6. FT（Financial Times）

**structure**
- 2014 改版（Kevin Wilson 主持）：把**印刷报纸的严格网格与单栏色体系**整体搬上网——"a run of pages and graphic formats that were more standardised"；报纸定位明言是"职业生活的工具"（the paper as a tool），读者从 Companies 倒着读也行——**版面按任务组织，不按情绪组织**。
- 早期改版评论（Puffbox）即点出其骨架："约十篇 top stories **排成列表**，按重要性排序；标题+极短摘要+**时间戳、分类、相关报道**"；导航大量收进 dropdown——头版=列表，chrome 压到最小。
- 分隔语法：**发丝横线**（hairline rules）而非卡片；层级靠栏位宽度和规则线。

**surfaced**：头条层级、分类、时间、摘要。
**hidden**：子栏目进 dropdown；订阅墙在顶部横带。

**css_only**
- hairline 列表化改造：

```css
[data-skin='x'] .start__spec{border:1px solid var(--border-strong);border-radius:0}
[data-skin='x'] .start__spec-row + .start__spec-row{border-top:1px solid var(--line)}
[data-skin='x'] .start__spec-v{justify-self:end;font-family:var(--mono);font-variant-numeric:tabular-nums}
```

- 把 `.start__spec` 从"工单"升级成 FT 式"数据框"：容器双线 `box-shadow:0 0 0 1px var(--line),0 0 0 4px var(--bg),0 0 0 5px var(--border-strong)`（纯 CSS 造报纸套框）。
- 360：双线框外扩 5px，须配 `margin-inline:5px` 或改 `outline`（outline 不吃布局宽度）。
- **与既有 broadsheet 皮肤的边界**：broadsheet 已占"大字报纸头+多栏正文"；本领域的增量是**表格线+行情框+右对齐数字**，是版面的"数据角"，不是"文章流"。

### 7. 财新网（国内财经门户佐证）

**structure**
- 2011 改版实测（主编鲍有斌）：传统三栏，左中放内容、右栏辅助；火线评论进焦点图下，**新增热词与行情版块**。
- 最有价值的是一组批评，等于本领域的验收标准：
  - "如果还认为在做财经网站，用户第一眼看不到市场行情信息，何谈财经"——**行情必须置顶**；
  - 改版后一屏 19 张图反被批"找不到聚焦点、绝对冗余"——**密≠堆图，密=高密度可扫描的文本行**；
  - "为什么不用一条标题+作者+摘要，其他都用列表呢"——**列表是财经门户的默认原子**。

**surfaced**：行情、热词、焦点评论。
**hidden**：正文进文章页；长尾频道进栏目条。

**css_only**
- "行情置顶"直接翻译为：**`.readouts` 之后第一个可读单位必须是数字而不是标语**——`.start__title,.start__lede{display:none}` 之后把 `.start__masthead` 的日期行压成 14px 灰字上缘，第一行版面留给 `:has(.is-warn)` 的逾期行。
- "列表为默认原子"：`.today-card__figures{display:contents}` 后三个 figure 各自成行，`.start__meta` 的重复数字 `display:none`（00 清单已确认是 readouts 的副本）。
- 360：财新教训反向适用——**窄屏禁一切横排大元素**，行内数值 `max-width:100%;overflow-wrap:anywhere`。

### 8. Are.na

**structure**
- 首页=**均匀方块网格**：不管内容是图是文，block 一律等大 footprint（"democratizes the collection and makes scanning easy"），caption 永远在格下小字、绝不叠在格上；灰 hairline 代替盒子/阴影/填充；无 likes、无 follower 数、无算法流。
- 频道状态仅用三色标题编码（public 绿/private 红/closed 灰）——**全站唯一用色处，色必须携带信息而非装饰**。
- 设计自述：这是"档案馆/图书馆目录"而不是社交网络；且明言 **"works poorly for conversion-driven pages"**——弱 CTA 是它的语法，也是它不适合直接照搬到转化型首页的原因。

**surfaced**：全部材料，零欢迎层，打开即网格。
**hidden**：连品牌 chrome 都撤——"界面在你看材料时应该被忘记"。

**css_only**
- 方块网格化 today-card：

```css
[data-skin='x'] .today-card__figures{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  gap:1px;background:var(--line)}                          /* 内嵌发丝网格：缝即线 */
[data-skin='x'] .today-card__figure{aspect-ratio:1;display:grid;place-content:center;
  gap:4px;background:var(--bg);text-align:center}
[data-skin='x'] .today-card__figure b{font-size:clamp(26px,8vw,40px);order:0}
[data-skin='x'] .today-card__tag{font-size:14px;color:var(--ink-3);order:1} /* caption 在下 */
```

- 360：`gap:1px + background:var(--line)` 的"缝线网格"三列各得 119px，`aspect-ratio:1` 在窄屏会吃掉半屏高——360 下改 `aspect-ratio:1/0.72` 或直接取消宽高比回归行式。
- **合规警报**：Are.na 三色编码里 red=private；词笺红线是"红只给逾期/错误/危险"。迁移时只允许 `is-warn` 用红，其余状态一律强调色或中性色，且浅深两档各写一遍。

---

## 四、三个结构上真正不同的首页方向

> 设计检验：每个方向先回答「焦点在哪、几栏、CTA 长什么样、数据放不放首页」四问，答案必须和 bento（不对称磁贴网格+等宽读数）、play（奶油居中大燃按钮、按下沉 6px）、nocturne（墨蓝夜纸排印海报）、broadsheet（大报多栏衬线头版）都不同。配色一律"沿用 tokens 另议"，本节只谈骨架。

### 方向 A ——「行情终端 · Watchlist」：全屏零卡片行表 + 钉底命令行

- **focal**：没有"一张主视觉"。焦点是**第一屏可见的行数**——拆平后 3 条 readout + 3 条 figure + 4 条 spec = 最多 10 行"标签左·数字右"的行情行，顶缘就是外壳 `.readouts` 常驻条。像 Bloomberg 打开即 WATCHED。
- **on_home**：全部数字留首页（本领域立场：密度即信任）；`.start__title/.start__lede` 删除（用户要求，且本领域天然无标语）；`.start__meta` 隐藏（readouts 的重复副本）。批数、pendingReviews 句两个首页独享项**必须保留可见**。
- **moved_away**：被挪走的不是数据是"装饰与说明"——玩法说明进复习会话页开场，词库总量留在「我的」页 stage-grid；`.today-card__links` 两链并入行表首部的"功能行"（MENU 目录语法：1. 错词本  2. 日历）。
- **cta**：**钉底满宽命令行**。`.start__actions{position:fixed;inset:auto 0 0 0}` + 顶部分隔线 + safe-area padding；按钮满宽、高 52px、左对齐等宽字体文案「开始背单词」，`::after{content:'▮ <GO>'}` 呼应终端执行键；`.start` 底部预留 88px 防遮挡。
- **骨架差异声明**：bento 是二维磁贴（块状、gap 分隔、有主次格）；A 是一维行列表（线分隔、无主次、可扫读）——`display:contents` 拆掉一切容器后，首页 DOM 里"块"的语法被物理消灭。与 play 的居中燃按钮相反，CTA 扁、满宽、贴底、左对齐；与 nocturne 的海报式大留白相反，首屏行密度拉满。
- **断点**：360 单列行表（天然零溢出）；768 双列行（左行情/右规格，`border-inline` 中缝）；1440 行表居中限宽 900px，两侧露底色，像终端的屏幕边框。

### 方向 B ——「订阅驾驶舱 · Split Rail」：桌面左轨右流，移动筛选 chip + 内联动作行

- **focal**：焦点是**内容流本身**（Feedly 打开即流）：右列（360 时即主体）是 today-card 行流；左轨（≥768）由固定后的 `.topbar`+`.readouts` 组成"订阅树/状态树"，读数竖排成带分隔线的指标列表。
- **on_home**：三个 figure 全部进流；spec 四行改作"栏目定义"竖排在左轨底部（`阶段/CET4-6 · 今日新词/12 · …`）；reason 句限 2 行 `-webkit-line-clamp:2` 作流内"编辑按语"。
- **moved_away**：`.start__masthead` 日期与 eyebrow 上移进左轨顶（Feedly 左树放账号/计数的位置）；错词本、日历两链变成左轨的"订阅项"（各占一竖行，未读数样式贴 `N`）；说明性文字进「我的」。数据零流失——只是从"横条+卡片"迁到"轨+流"。
- **cta**：**流内动作行**，不钉底。`.start__actions` 排进行流第二行（order 控制），做成一条满宽、带上下 hairline、左侧「▶」伪元素、右侧数字角标的"未读条目"——点它像点开一篇头条，而不是点一枚按钮。
- **骨架差异声明**：三方向里唯一改**页面拓扑**（横→纵）的：≥768 出现常驻左轨，正文被推去右半屏——bento/play/nocturne 全是"单栏从上滚到下"，没有任何一版动过"导航与内容分柱而治"。实现前提已验证路径：`topbar/.readouts/.app__main` 若为 `.app` 直接子元素则 `.app{display:grid;grid-template-columns:236px minmax(0,1fr);grid-template-areas:"rail rail" "read main"?}`，否则降级为 `.topbar{position:fixed;inset:0 auto 0 0;width:236px}` + `main.app__main{padding-left:236px}`（后者只依赖 `.app__main` 可加内边距，更稳）。**360 全部回退**：轨取消，`__links` 变横向滚动 chip 行，readouts 回横条——移动端仍是单列，但 chip+内联 CTA 的骨架仍与三版旧皮肤不同。
- **断点**：360=单列+chip 行；768=236px 轨+流；1440=轨 280px、流限宽 720px、右留白墙（Feedly 三栏的"第三栏"用空白而非内容）。

### 方向 C ——「三带头版 · 一屏全显」：100dvh 横幅式，中带一个巨数，无滚动

- **focal**：**中带的唯一巨大数字**——到期复习 `done/total`（T5，行动相关度最高），字号 `clamp(64px,22vw,140px)`，像新闻 App 头版的 lead story 只留一个"头条数据"。但注意：这不是海报留白——**巨数同屏两侧/下方塞满小字带**，是"电视字幕条（chyron）"语法：一条大 + 一排小，全在一屏。
- **骨架结构**：`.screen` 改 `display:grid;grid-template-rows:auto minmax(0,1fr) auto;height:100dvh`（或 `.start` 承担，视外壳而定），三等分**横带**：
  - 上带：`.readouts`（外壳常驻，天然是带）+ masthead 日期压成 14px 边行——"频道台标+时间"；
  - 中带：巨数 + 阶段短码 kicker（左缘竖排 `writing-mode:vertical-rl` 的栏目条）+ 逾期/连续两项以 48px 中数贴巨数右下——新闻大标题+副题关系；
  - 下带：spec 四行改 4 列小字网格 + reason 单行 clamp(1)——"滚动字幕/页脚索引"，密度全在这条。
- **on_home**：全部数字都在首屏——本方向的"密度"主张是**零滚动全显**（终端哲学：一屏装下所有关键行情，滚是失败），与"少即是美"针锋相对：元素不删，但降级为三档字号带。
- **moved_away**：真正推走的只有 `.start__foot` 规则装饰行与重复的 `.start__meta`；批数（首页独享）进下带第 2 格。若 360 高度不够 100dvh 三带，下带允许 `overflow-y:auto` 微滚——但中带巨数必须永驻首屏。
- **cta**：**与巨数同排的分栏按钮**——中带内 `.btn--primary` 与巨数左右分栏（数 62% + 按钮 38%），按钮做成 64px 高的实心色块、文案两行（主「开始背单词」+ mono 小字「先复习 N 词」——T9 文本上 CTA 的唯一合法去处，用既有 DOM 文案还是伪元素需谨慎：T9 在 `.today-card__reason`，所以按钮伪元素只写静态「<GO>」，动态句留在中带右下小字）。
- **骨架差异声明**：与 nocturne（纵向排印海报、鼓励滚动、留白呼吸）相反，C 是**横向分带、锁视口、禁滚动**；与 bento（磁贴有尺寸游戏）相反，C 的尺寸梯度是"一带一物"而非"一宫一格"；与 play（CTA 居中且唯一主角）相反，C 的主角是数字、CTA 是配角分栏。三个方向 A/B/C 分别对应终端行表、三栏 feed、字幕条头版——**没有两个共享同一条中轴线**。
- **断点**：360 三带压缩为 `auto 1fr auto`，巨数 22vw 恰好一行；768 中带变"左巨数右两项"双列；1440 全带限宽 1400px 并给下带加 6 列（spec 拆双行 3 列），仍保持一屏零滚动——大屏正是要塞得更满的终端。

---

## 五、硬约束自查表（写 CSS 前逐条过）

| 约束 | 本笔记各方向的落点 |
|---|---|
| 正文 ≥4.5:1 / 大字 ≥3:1 | 11px mono 只用于拉丁短码（kicker/`<GO>`）；**一切中文 ≥14px**；巨数属大字档，中灰底上按 3:1 校验 |
| 点击目标 ≥44×44 | A 的每行 `min-height:44px`、CTA 52px；B 的 chip `padding:10px 14px` 凑高；C 的按钮 64px。`__links` 两链在 A/B 中都是整行可点区 |
| 360 零横向溢出 | 所有网格列用 `minmax(0,1fr)`；`display:contents` 后行内长值加 `overflow-wrap:anywhere`；B 的左轨、C 的 100dvh 三带只写进 `@media(min-width:768px)` / 带 360 回退 |
| ≤2 字体族 | 每方向均为「正文族 + IBM Plex Mono」两族；数字一律 `tabular-nums`（行情语法的底线） |
| 单一强调色；红只给逾期/错误/危险 | Are.na 三色状态迁移必须裁剪：只有 `.is-warn` 可用红；`.is-increase/.is-paused` 走强调色/中性色 |
| 语义色浅深两档各写一遍 | `:has(.is-warn)`、accent-soft 底色等在 `[data-theme]` 两档各定义 border/bg/fg 三值 |
| 伪元素文案 | 只能放静态装饰字（`<GO>`、`▸`、`BREAKING` 类短码），**不得伪造动态数据**（时间、条数一律来自真实 DOM 文本） |
| 动效 | ticker 呼吸点/闪烁一律包 `@media (prefers-reduced-motion:reduce)` 关闭 |

---

## 六、与既有七套皮肤的查重结论

- **paper/foundry/instrument**：非流式界面语法，无冲突。
- **bento**：磁贴=二维块状、gap 分隔；本笔记 A=一维行、线分隔；B=轨+流拓扑；C=横带锁屏。三者均不产出"可漂移的块状网格"，不会撞型。
- **play**：主 CTA 居中燃按钮 vs A 贴底命令行 / B 流内动作行 / C 分栏配角——CTA 形态全部不同构。
- **broadsheet**：大报占"衬线刊头+多栏正文"；本笔记借的是 FT/财新的**行情表线、右对齐 tabular 数字、快讯条**，属数据角语法，不碰文章栏。若未来某方向要做"多栏文字版"，需先与 broadsheet 作者协调。
- **nocturne**：纵向排印海报、鼓励滚动；C 明确禁滚动锁视口，轴不同。

---

## 七、来源列表

- Bloomberg Terminal UX（藏复杂度/渐进披露）：https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/
- 信息密度/Tufte 数据墨水与彭博终端描述（中文）：https://www.infoq.cn/article/ctihfrlcmehr7lnebbgu
- Bloomberg Terminal 键位与四面板（官方入门 PDF）：https://smf.business.uconn.edu/wp-content/uploads/sites/818/2015/03/Getting-Started-on-Bloomberg-Key-Functions-and-Navigation-1.pdf
- Bloomberg Terminal HELP \<GO\> 帮助页 PDF：https://datacenter.safe-frankfurt.de/documents/Bloomberg_help_page.pdf
- Bloomberg Mobile 2013 改版（feed+行情）：https://www.businessinsider.com/bloombergs-new-app-2013-10
- Bloomberg App 测评（头条与市场指标混排、常驻媒体条）：https://screensdesign.com/showcase/bloomberg-business-news-daily
- Feedly 个性化/阅读体验（View×Density、未读逻辑、快捷键）：https://developers.feedly.com/docs/personalization-reading-experience
- Feedly iPad 三栏旧证：https://ux.stackexchange.com/posts/9073/revisions
- NetNewsWire 7.2（可隐藏的未读数焦虑，同类参照）：https://feedly.com/beta/discover?query=leo%2Ffeed%2Fhttp:%2F%2Fwww.marco.org%2Frss
- Inoreader 布局选项（List/Expanded/Column/Card/Magazine 五种）：https://www.inoreader.com/help/basic/article-view/what-layout-options-are-available
- Reuters 首页形态研究（白带+首屏下缘起头，俄文论文）：http://www.vestnik.vsu.ru/pdf/phylolog/2021/04/2021-04-35.pdf
- Reuters 站点结构速评（白底三栏、9 大类顶导）：http://m.szonline.cn/ent/rd/2026/0901/760546.html
- Reuters UX Teardown（section fronts、figures 前置、按时间排序）：https://typenorm.com/articles/reuters-ux-teardown
- 新闻头版 wireframe 语法（breaking bar/大故事+标题列表/Latest-Most read）：https://envydesign.jp/patterns/en/article-news-top/
- FT 2014 改版设计访谈（报纸为工具、标准化版面）：https://www.poynter.org/reporting-editing/2014/financial-times-a-classic-redesign-for-the-digital-age/
- FT 改版案例（Klim/印刷感强化）：https://designersinstitute.nz/case-study/the-financial-times-redesign/
- FT 新首页早期评论（top stories 列表+dropdown 藏导航）：https://puffbox.com/tag/blogging/page/2/
- 财新网改版批评（行情置顶论、19 图冗余论、列表默认论）：https://baoyoubin.blog.caixin.com/archives/24772
- Are.na 设计风格志（方块网格、hairline、caption 在下、反转化语法）：https://designbycurio.com/learn/are-na-blocks-channels-2014
- Are.na iOS 设计评（"空白笔记本"式界面）：https://ixd.prattsi.org/2026/02/design-critique-are-na-ios-app-2/
- 金融数据高密度设计（中文，信息效率/数据聚合）：https://www.uisdc.com/data-dense-design
- 反面教材：The Atlantic 改版（顶部导航 200-300px 无人点、首页品牌化 vs 导航之争）：https://www.theatlantic.com/international/archive/2015/04/your-reaction-to-the-atlantic-redesign/391568/
