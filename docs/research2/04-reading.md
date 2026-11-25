# 调研报告 04 · 领域：阅读 / 书籍

> 对象：Kindle、Apple Books、微信读书、Readwise（Reader）、Instapaper、Audible
> 视角：**只看骨架**——焦点在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏进二级页。不谈配色情绪。
> 用途：给「词笺」第 8+ 套皮肤提供**结构上真正不同**的首页布局方向。词笺约束：只能改 CSS，不许动 DOM；`.start__title` / `.start__lede` 在新皮肤里一律删掉。
> 词笺首页实际 DOM 已核对源码（`src/components/StudyScreen.tsx` L108–172、`src/components/TodayCard.tsx` L56–77）：`.today-card__figures` 内是 **4 个** figure（新词 / 到期复习 / 逾期 / 连续优秀），`.readouts` 内是 3 个 readout（今日 / 批数 / 已学），`.start__body` 包着 eyebrow→title→lede→meta→spec→actions→today-card。

---

## 0. 一句话总纲：阅读类产品首页的共同信仰

这个领域几乎没有人把首页做成「数据仪表盘」。六款产品全部收敛到同一条 IA 公理：

**首页 = 回到你上次停下的那个对象（一本书 / 一条队列 / 一张卡），而不是看你的成绩。**

- 进度被**物化在对象上**（书封角标、封面下的细进度线、播放条），而不是抽成三个数字排在页顶；
- 统计（时长、连续天数、勋章、笔记数）**全部藏在「我的」/资料页**——微信读书把周阅读时长留在首页但压成一小条，Audible / Readwise 连这条都不留；
- CTA 通常是**没有按钮的**：卡片本身、行本身、封面本身就是按钮，「开始」这个动作通过直接点击对象完成。

这与词笺现状（大标语 + 三读数 + 工单表 + 摘要卡 + 按钮，全平铺一列）是两种信息观。下面逐产品拆。

---

## 1. Kindle（iOS App + 墨水屏设备）

### 骨架
- **导航**：底部只有 2 个 tab——Library / More。层级极浅，设置、会员全塞进 More。
- **首页焦点**：紧挨 Library tab 的位置永远放着**正在读的那本书**，点一下直接跳回上次那一页。它是「继续」物件，不是「开始」按钮。
- **布局**：单列纵向流 = 一行横向滚动书架 + 若干主题行。设备版手册把 Home 明确写成三段：*Recently Accessed Items → Your Reading Lists → Recommended for You*。App 版底部再叠「Recommended for you / Because you read…」的推荐行。
- **密度**：顶部低（一两本书），越往下越密（商店行、榜单行），本质是「书店首页」；设备版无商店，首页就只剩三层架子。
- **数据放不放首页**：不放百分比、不放时长。进度（%、剩几分钟、章节名）只在**书内**和 Page Flip 里出现；首页书封上最多一个角标。

### 对词笺的 pattern
- **structure**：单列「继续对象 + 横向行」瀑布；焦点是 1 个可点的物件，行与行之间用整行标题分隔；导航在底部、只有两个目的地。
- **surfaced**：正在读的书（封面/身份）+ 上次位置；其余全是可滑动的行。
- **hidden**：阅读进度细节、时长统计、设置——分别在书内、More、设备设置里。
- **css_only（词笺）**：把 `.readouts` 设 `display:contents`，只留第一个 `.readout`（今日数），`.readout__v` 放大到 `clamp(72px,22vw,110px)` 当「正在背的这本书」的大字号封面字；`.today-card__figures` 改成 `display:flex; overflow-x:auto; scroll-snap-type:x mandatory`，4 个 figure 各 `flex:0 0 78%; scroll-snap-align:start`，变成 Kindle 式横向书架行，360px 下天然不溢出（容器滚动不是页面溢出）。`section.today-card::before` 用 `content:"CONTINUE"` 做行标题。
- 来源：[MakeUseOf Kindle 评测](https://www.makeuseof.com/kindle-best-reading-app/)、[IXD@Pratt Kindle 设计批评](https://ixd.prattsi.org/2022/02/d/)、[Kindle 设备手册 Home 三段落](https://www.manualzz.com/doc/o/1j04gj/)、[推荐行的位置](https://everydaytech.org/streaming-entertainment/e-books-digital-reading/how-to-remove-book-recommendations-from-kindle-on-your-laptop)

---

## 2. Apple Books

### 骨架
- **导航**：底部 5 tab：Reading Now / Library / Store / Audiobooks / Search（iPadOS 18 后改新 tab bar）。默认落地页就叫 **Reading Now**——官方文案称其为「你的数字床头柜（digital nightstand）」。
- **首页焦点**：Reading Now 顶部是**正在读/正在听的书的大卡**，iOS 12 版甚至给「实时预览」——直接把上次读到的那段正文渲染出来当卡面；下面是一排「最近打开」的书封 + 每本封面带百分比。
- **布局**：单列；hero 大卡（1 个）→ 横向百分比书封行 → Want to Read / Complete the Series / You Might Like 各一行。**「一主多从」层级最分明**的一家。
- **数据**：首页唯一的数字是**每本书自己的进度 %**（贴在封面上），没有任何账户级统计。时长、记录在别处。

### 对词笺的 pattern
- **structure**：首屏 60%+ 给一张「继续」大卡，卡的内容物是**任务对象本身**而不是描述文字；其余内容一律降级成行。
- **surfaced**：一本书的「此刻位置」；行内小进度。
- **hidden**：全部账户统计、商店、音频——各占一个底部 tab。
- **css_only（词笺）**：「实时预览卡」可以借：`.start__actions` 用 `order:-1` 提到 `.start__body` 最顶，`.btn--primary` 撑成 `min-height:min(42vh,300px); width:100%` 的整屏大卡（按钮即卡，仍是一个可点元素）；卡内文案不够用，就用 `::before{content:"正在背 · 第 ___ 批"}`、`::after{content:"点按回到上次中断的那一页 →"}` 补出 Books 式的「位置描述」；`.start__spec` 的某一行文字是现成的批次信息，可整表 `position:absolute` 叠进卡底部当「页脚小字」（`.start__body` 需 `position:relative`，并给卡留出安全区）。360px：卡高用 vh 不用 px，按钮内文字 `font-size:18px` 保证 ≥44 触摸与 AA。
- 来源：[Apple Newsroom：Books 重设计（Reading Now / 数字床头柜）](https://www.apple.com/cf/newsroom/2018/06/apple-books-all-new-for-iphone-and-ipad-celebrates-reading/)、[MacObserver：Reading Now 的实时预览+百分比行](https://www.macobserver.com/news/apple-books-redesign-rebrand/)、[Apple Books 官网存档](https://web.archive.org/web/20230306045602/https://www.apple.com/apple-books/)、[iPadOS 18 tab bar 的批评（Books 退化案例）](https://www.macstories.net/linked/the-issues-of-ipados-18s-new-tab-bars/)

---

## 3. 微信读书

### 骨架
- **导航**：底部 4 tab：阅读（首页）/ 书架 / 发现 / 我。注意分工：**首页管「找书」，书架管「有书」，我页管「成绩」**。
- **首页（阅读页）结构**（据人人都是产品经理的逐模块拆解）：自上而下 = ① 搜索模块（搜索栏+书城入口+横滑分类栏，占比小）→ ② 阅读历史模块（本周阅读时长 + 近期阅读横滑封面，占比小）→ ③ **卡片信息流**：页面中心是一张**随机推荐大卡**，「占据页面最优位置、最大占比、最大字体」→ ④ 福利场（下拉才出现，藏极深）。
- **书架页**：真正的**封面网格墙**（3 列），书封角标标「读完 / 私密」，支持默认/更新/进度/购买/分类 5 种排序。这是「书架网格」的原型。
- **数据策略**：全 App 的数据（勋章、笔记、阅读记录、获赞）都归拢在「我」页的卡片分区里；首页只保留**一小条**「本周时长」作为轻钩子，且入口可点、点进独立时长页。
- **密度**：首页中高（信息流），书架中（网格），「我」低（大留白卡片分区）。

### 对词笺的 pattern
- **structure**：首页焦点不是数据也不是入口按钮，而是**一张「今日内容」大卡居中占最优位置**；数据压缩成顶部一小条横滑历史；「成绩」整体迁居我页；「库」独立成网格页。
- **surfaced**：一张推荐/在读大卡 + 一行近期历史（可横滑）。
- **hidden**：本周时长明细→时长页；勋章/笔记/记录→我页；排序管理→书架页；活动→下拉彩蛋层。
- **css_only（词笺）**：学「数据压成一小条」：`.readouts` 做成 `position:sticky; top:0` 的顶部窄条（`display:flex; gap:14px`，`.readout__k` 11px 上标、`.readout__v` `font-variant-numeric:tabular-nums` 16px），像微信读书的周时长条；真正的视觉焦点给 `section.today-card`——`order:-1` 提到最顶并占首屏 55%，`.today-card__figures` 用 `display:contents` 拆掉包装层，让 4 个 figure 直接成为 today-card 的 grid 子项排成 2×2；`.start__spec` 整块删（`display:none`），因为它的职责已被顶部窄条吸收。360px：`display:contents` 后注意给 figure 设 `min-width:0` 防长数字撑破。
- 来源：[人人都是产品经理：微信读书 App 产品拆解（首页四模块/书架网格/我页五模块）](https://www.woshipm.com/evaluating/5237152.html)、[微信读书产品分析报告](http://www.opp2.com/193220.html)、[转载版](https://www.163.com/dy/article/FC4CQT9R0511805E.html)

---

## 4. Readwise / Readwise Reader

### 骨架
- **导航**：Web 端是**左侧栏仪表盘**：Home / Library / Feed / Search 固定 + 可自定义排序的 section；移动端底部 tab，Home 是第一个。
- **首页焦点**：**一次只给你一张卡**。Reader 的 Daily Digest「位于 Home 段顶部」，是一张张可连续滚动的卡片流；Readwise 主 App 2.0 的 Daily Review 是**可滑动的卡片堆 + 完成页**——复习是「翻牌」，不是「看板」。
- **计数的克制**：app 图标角标永远最多是「1」，含义是「今天这份 digest 还没看」。它把一个连续天数/数量的概念压成了**布尔值**。
- **密度**：首页全 App 最低。没有统计块、没有图表上首页；streak 在账号层、出现在设置/资料附近而非首屏。
- **CTA**：没有「开始复习」按钮——打开 Home 就是在复习，动作 = 滑动卡片本身。

### 对词笺的 pattern
- **structure**：首页 = 一张（或一叠）内容卡，其余全部退到侧栏/二级 tab；用「今日份完成与否」代替「今日数字」；导航是固定的目的地清单而非流程按钮。
- **surfaced**：今天的 digest/review 单卡；一个布尔级角标。
- **hidden**：streak、全部高亮统计、Ghostreader/音频等工具各自有独立入口页。
- **css_only（词笺）**：偷「单卡聚焦」：`.start` 整页做成 `min-height:100dvh; display:grid; place-items:center` 的居中单卡舞台，只把 `section.today-card`（限宽 `width:min(92vw,380px)`）留在中心，其余 `.readouts/.start__spec/.start__meta` 全部 `display:none`；`.today-card__reason` 升格为卡内主文案（18px 行距 1.7）；`.today-card__head::after{content:"DAILY · 1"}` 模拟 digest 角标；`.btn--primary` 用 `position:fixed; bottom:0; inset-inline:0` 做成贴底通栏，等于 Readwise「翻这张卡」的手势位。360px：舞台 `place-items:center` 天然收缩；`@media (min-width:768px)` 时可把 `.topbar` 转 `position:fixed; inset-block:0; inline-size:72px` 侧栏化，接近 Web 端左栏形态（顶栏 4 个控件竖排，`.brand__name` 用 `writing-mode:vertical-rl` 转竖）。
- 来源：[Readwise Docs：Daily Digest（位于 Home 顶部、角标恒为 1）](https://docs.readwise.io/reader/docs/faqs/daily-digest)、[Readwise Docs：Navigation（左栏 section 可配置）](https://docs.readwise.io/reader/docs/faqs/navigation)、[App Store：Readwise 2.0 可滑动卡片堆+完成页](https://apps.apple.com/ua/app/readwise/id1476885528)、（旁证：开源阅读器 [liseur 把「每日一读」卡放上 Home 顶部](https://github.com/chmouel/liseur/blob/fda6b6b617f7928bc45d40d5af47d8c372a7d545/docs/release-notes/v0.30.0.md)）

---

## 5. Instapaper

### 骨架
- **导航**：Web = 侧栏四件套 Home / Liked / Archive / Notes（+文件夹/标签）；App 主菜单同构。**Home 的定义就是「未读队列」**：所有收藏先落这里，读完归档即清出。
- **首页焦点**：纯文字列表。标题 + 署名行，**没有封面图、没有 hero、没有统计**。Home 旁边挂一个**未读数**——首页唯一的数字。v10 还加了「紧凑列表模式」和「文章进行中」widget：密度是产品自觉调节的旋钮。
- **CTA 形态**：不存在。行本身就是入口，动作是「点开/划掉」。整个首页是 GTD 式的收件箱，不是展示墙。
- **数据**：零。Instapaper 十年没在首页放过统计图表。

### 对词笺的 pattern
- **structure**：首页 = 一条有计数徽标的**任务队列**（单列、行式、高扫读效率）；列表即导航、行即 CTA；密度可由「紧凑/舒展」两档切换。
- **surfaced**：未读数 1 个 + 队列表身。
- **hidden**：已读、喜欢、笔记——全是平级侧栏目的地，不占首页；没有任何聚合统计存在。
- **css_only（词笺）**：偷「队列行」：`.start__spec` 的 4 行 k/v 是现成的队列数据（阶段/今日新词/今日批次/已学），把 `.start__spec-row` 设 `display:flex; justify-content:space-between; align-items:baseline; min-height:56px; border-bottom:1px solid var(--border)`，`::before{counter-increment:q; content:counter(q,decimal-leading-zero)}` 加行号，`::after{content:"›"}` 加行尾符——`.start__spec` 加 `counter-reset:q`；`.start` 加 `display:flex;flex-direction:column` + `.start__body{display:contents}` 后把 `.btn--primary` `order` 到队列末尾并去掉按钮壳（`background:transparent; border:0; text-align:left; min-height:56px`），让 CTA 伪装成队列最后一行「开始背单词 ›」。360px：单列行式零溢出风险；行高 56 满足 44 目标；`b` 与 `spec-v` 用 `font-variant-numeric:tabular-nums`。
- 来源：[Instapaper 官方文档：Home=未读队列+计数](https://instapaper.com/docs/organize/overview)、[MacObserver：Instapaper 10 加 widget（显示在读文章）](https://www.macobserver.com/news/instapaper-10-adds-liquid-glass-and-home-screen-widgets-to-ios/)、[iGen：v10 紧凑列表模式](https://www.igen.fr/app-store/2026/07/instapaper-10-adopte-le-liquid-glass-et-modernise-son-site-web-157281)、[Reitz 评论：Home 即全部的老网页版](https://kennethreitz.org/essays/2009-01-instapaper_best_web_app_ever_created.pdf)

---

## 6. Audible

### 骨架
- **导航**：底部 Home / Library / (Profile)。播放器全局常驻——任何页面拖出，**回到播放的动作不经过首页**。
- **首页焦点**：**Continue Listening 通栏横条**（封面 + 当前章节 + 细进度线），置顶，无视设备来源。其后是 Recent Additions、卖 credits 的广告位，再往下全是商店行：Recommended for you / Best Sellers / New Releases / 场景主题行。
- **布局**：单列，1 个 hero 条 + N 个横向行；hero 是「状态」，下面全是「货架」。
- **数据**：收听时长、章节进度全在 **Profile / 播放器**里，首页只有 hero 上那条无数字的进度线。
- **CTA**：又是「对象即按钮」——点 hero 条直接续听，没有「继续播放」文字按钮。

### 对词笺的 pattern
- **structure**：首屏最顶一根「续听条」通栏横贯（甚至压住状态栏区域），是页面唯一的全宽元素；其余按「最近添加→推荐货架」纵向堆行；进度用线不用数。
- **surfaced**：上次中断的位置（哪本书、哪个章节）。
- **hidden**：时长统计在 Profile，库存在 Library，购买在商店行里随滑随买。
- **css_only（词笺）**：偷「续听条」：`.start__actions` 置 `order:-1` + `.btn--primary` 做成通栏横条（`height:96px; display:flex; align-items:center`），`.btn--primary::before` 造一段进度线：`content:""; position:absolute; inset:auto 0 0 0; height:4px; background:linear-gradient(90deg, var(--accent) 0 34%, var(--border) 34% 100%)`——注意 CSS 拿不到真实进度值，这条只能是**示意装饰**，不能宣称数据（写文档时要标明，避免误导）；`.btn--primary::after{content:"上次停在 · 今日批次"}` 补章节感。`.readouts` 整体 `display:none`（时长进「我的」），逾期信息留在下方 today-card 即可。360px：通栏条左右贴边出血用 `margin-inline:calc(50% - 50vw)`，父级需无 `overflow:hidden` 裁剪（`.screen` 有滚动裁剪时改用负 padding 方案）。
- 来源：[Beyond the Bookends：Audible 首页逐区块描述（Continue Listening→Recent Additions→商店行）](https://www.beyondthebookends.com/is-libro-fm-better-than-audible/)、[APKMirror 更新日志：Continue Listening 模块作为首页固定组件存在](https://www.apkmirror.com/apk/audible-inc/audiobooks-from-audible/audiobooks-from-audible-3-47-1-release/)、[Audible 播放器/时长设置藏于 Profile 的证据](https://macmyths.com/how-to-use-audibles-listening-features-to-get-more-out-of-audiobooks/)

---

## 7. 跨产品共性 → 词笺可借用的 6 条「结构定律」

| # | 定律 | 出处 | 词笺现状的违背点 |
|---|------|------|------------------|
| 1 | 首页是「继续」，不是「开始」：焦点=上次中断的**对象** | Kindle / Books / Audible | 词笺焦点是营销标语+一个开始按钮 |
| 2 | 进度物化在对象上（封面角标、进度线），不抽成页顶数字行 | Books / Audible | 词笺把数字摊成 `.readouts` 三读数 + `.spec` 四行 |
| 3 | 账户统计全部住「我的」，首页最多留一小条 | 微信读书 / Audible / Readwise | 词笺首页塞了两套统计（readouts 与 today-card 还互相重复） |
| 4 | 复习/消费是**一次一张卡**，不是看板 | Readwise / liseur | 词笺首页本身已经像个看板 |
| 5 | 队列即首页：行列表 + 一个未读数，无 hero 无按钮 | Instapaper | 词笺有显式大按钮而无列表感 |
| 6 | CTA 常「无按钮化」：点对象 = 执行动作 | 全部六家 | 词笺依赖孤立主按钮 |

---

## 8. 给词笺首页的 3 个结构方向（只换骨架，颜色只是附属）

> 三个方向共享的前提：`display:none` 掉 `.start__title`、`.start__lede`（用户要求）；`.start` 一律用
> `.start{display:flex;flex-direction:column} .start__body{display:contents}` 打平 masthead/kicker/body 三层包装，使所有孙元素（eyebrow、meta、spec、actions、today-card、foot）变成同层可 `order` 的兄弟——这是三个方案共同的「拆骨架」入口，之后差异发生在**焦点物件、版面分区、数据去留**层面，而不是皮肤色板层面。

### 方向 A「续读封底 · Resume Slab」——把首页变成一张正在读的书
- **信息架构**：首屏只有一个东西——一块占 45–55vh 的「今日在读」实体卡（书封/封底质感），卡即 CTA。数字层只保留 1 个：今日新词量（`.readout:nth-child(1) .readout__v` 放大到 8–10rem 压在卡顶，Kindle「永远 front and center」+ Books「数字床头柜」的合体）。
- **首页放**：大数字 ×1、通栏续读卡 ×1（`.start__actions` 里的按钮本体）、一行 kicker 状态（`.start__kicker` 改「今日 · 第 N 批」式小标签）。
- **首页砍**：`.readout` 2/3、`.start__meta`、`.start__spec` 全删（信息与大数字/卡重复）；`today-card` 用 `order` 降到续读卡之下、压成一行 ticker（`figures` 改 `overflow-x:auto` 横滑），完整台账去**列表页**与**我的页**。
- **CTA 形态**：非孤立按钮——`btn--primary` 撑成整块卡体（`min-height:min(40vh,280px); width:100%`），文案「开始背单词」沉在卡底部（Audible 续听条的竖版），`::after` 补「点按继续 →」。
- **360px**：卡高走 vh；横滑 ticker 容器内滚动不算页面溢出；`scroll-snap` 保证窄屏每次对齐一张。
- **与现有皮肤的本质差异**：bento 是多磁贴网格、play 是奶油页里的厚按钮、nocturne 是零阴影排版——三者首页都有「多块内容」。A 是**单一焦点**：删到只剩一个数字一张卡，密度为全场最低，这正是 Kindle/Books 的骨架。
- **可点性/AA**：整卡 ≥44px 天然满足；卡上文字若压深色底需 `#fff` 对 accent 实测 ≥4.5:1（中文按钮文字按正文算）。

### 方向 B「书脊书架 · Spine Shelf」——把四个数字变成四本立着的书
- **信息架构**：首页 = 一面书架。`today-card__figures` 的 4 个 figure 是现成的 4 个「条目」，用 `writing-mode:vertical-rl` 转成**竖排书脊**（`.today-card__figure{writing-mode:vertical-rl; height:88%; flex:1; padding:14px 8px}`，nth-child 各异高度 92/78/86/80% 模拟参差），`.today-card__figures` 设 `display:flex; align-items:flex-end; height:min(44vh,320px)` 并在下方用双层 `linear-gradient` 画一条「层板线」。数据被**物化**：数字是脊面烫印（`<b>` 字号 1.5rem，标签文字竖排），不再是读数行——对应定律 2 的极致版。
- **首页放**：书脊 ×4（新词/到期/逾期/连击）、层板线、`.today-card__head` 当书架铜牌（`::before{content:"SHELF · 今日"}`）、`.today-card__reason` 转 14px 说明压在层板下。
- **首页砍**：`.readouts` 与 `.start__spec`、`.start__meta` 全删（书脊已含全部关键数）；`.today-card__links` 两个文字链缩小进铜牌右侧。
- **CTA 形态**：**抽屉拉手**——`.start__actions{position:fixed; inset-inline:0; bottom:0}`，`btn--primary` 通栏 56px、上缘一道高光渐变，像把书架抽出来的把手；页面 `padding-bottom:80px` 防遮挡。
- **360px**：4 脊 × 约 74px + 间隙 ≈ 320px，可容纳；竖排中文在 74px 脊宽内正常换行；`@media(min-width:768px)` 脊高放大并给书架左右加 8vw 收边。
- **与现有皮肤的本质差异**：这是六套皮肤都没有的**物件化版面**——没有任何矩形卡片网格、没有横排读数、按钮脱离文档流。bento/play/nocturne 换的是质感，B 换的是「数据以什么形态存在」。
- **AA 注意**：深色脊面上竖排文字对比度按正文算（≥4.5）；`writing-mode` 不影响屏幕阅读器朗读顺序（文本仍是原 DOM）。

### 方向 C「今日队列 · The Queue」——Instapaper 式：列表本身就是首页
- **信息架构**：无 hero、无卡、无按钮壳。`.start__spec` 的 4 行 k/v 被扶正为页面主体——一条 GTD 队列：每行 56px+，左侧 `01–04` 行号（`counter`），中间任务名，右端 tabular-nums 数值，行间 1px 分隔线。`readouts`、`.today-card__figures` 里与队列重复的部分 `display:none`，`figures` 未重复的两行（到期/逾期）用 `display:block` 拆成**队列尾部的补充行**。整页只有：顶栏（3 icon 按钮保证 ≥44 点击：给 `icon-btn` 加 `min-width:44px;min-height:44px`）→ 一行铜牌标题（`.today-card__label`）→ 6 行左右的队列 → 末尾 CTA 行。
- **首页放**：队列行（阶段/今日新词/今日批次/已学 + 到期/逾期），1 个未读感计数放 `.today-card__head::before`（学 Instapaper 的 Home 计数）。
- **首页砍**：连续优秀、理由长文挪去**我的页**承接（我的页本就承载统计）；`reason` 若保留则 clamp 成 1 行小字。
- **CTA 形态**：**队列最后一行**——`btn--primary` 去壳（`background:none;border:0;border-bottom:1px solid; text-align:left; min-height:56px`），`::after{content:"›"}`，与队列行同构，Instapaper「行即动作」的翻版；若想保留一点重量，仅此一行加 2px 左竖线标记。
- **360px**：纯单列零溢出；行高与行号给扫读建立节奏；`@media(min-width:1440px)` 可把队列 `max-width:640px` 居中并在 `::before` 上挂一列侧边注。
- **与现有皮肤的本质差异**：broadsheet 是分栏报纸、foundry 是铭牌阵列，都仍有「展示块」；C 把首页降级为**一张可执行清单**——密度中、装饰零、焦点在扫读效率，六套皮肤没有任何一版是「无 hero 列表页」。
- **AA 注意**：分隔线 `--border` 需 ≥3:1 于背景才算有效行界；行号是纯装饰时加 `aria-hidden` 不可行（CSS 生成内容不入无障碍树，本身安全）。

---

## 9. 落地检查清单（三方向通用）
1. `.readouts` 是 `aria-hidden="true"` 的纯装饰区——把它扶正当数据主角时语义无障碍风险低；但 `today-card__figure` 内数字有 aria 语义，**B/C 里删文本前先确认不是唯一读数来源**。
2. 红色纪律：逾期 `<b class="is-warn">` 的警示红只在浅深两档各定义一次，书脊/队列行方案里保持 `is-*` 钩子不混用。
3. 所有伪元素文案（"点按继续 →"、"SHELF"等）不进屏幕阅读器朗读列表之外——CSS `content` 在部分读法下会被朗读，避免整句中文塞 `::before` 承载**独有**信息；关键信息必须仍在真实 DOM 里。
4. 360 窄屏回归：fixed CTA（B）与出血条（Audible 式负 margin）是唯二可能引入横向溢出的手段，用 `inset-inline:0` 而非 `width:100vw`。
5. 语义色两档：`@media (prefers-color-scheme: dark)` 与 `[data-theme='dark']` 各写一遍——沿用现有皮肤的双轨写法。

---

## 来源汇总
- Kindle：https://www.makeuseof.com/kindle-best-reading-app/ ｜ https://ixd.prattsi.org/2022/02/d/ ｜ https://www.manualzz.com/doc/o/1j04gj/ ｜ https://everydaytech.org/streaming-entertainment/e-books-digital-reading/how-to-remove-book-recommendations-from-kindle-on-your-laptop
- Apple Books：https://www.apple.com/cf/newsroom/2018/06/apple-books-all-new-for-iphone-and-ipad-celebrates-reading/ ｜ https://www.macobserver.com/news/apple-books-redesign-rebrand/ ｜ https://web.archive.org/web/20230306045602/https://www.apple.com/apple-books/ ｜ https://www.macstories.net/linked/the-issues-of-ipados-18s-new-tab-bars/
- 微信读书：https://www.woshipm.com/evaluating/5237152.html ｜ http://www.opp2.com/193220.html ｜ https://www.163.com/dy/article/FC4CQT9R0511805E.html
- Readwise：https://docs.readwise.io/reader/docs/faqs/daily-digest ｜ https://docs.readwise.io/reader/docs/faqs/navigation ｜ https://apps.apple.com/ua/app/readwise/id1476885528 ｜ https://github.com/chmouel/liseur/blob/fda6b6b617f7928bc45d40d5af47d8c372a7d545/docs/release-notes/v0.30.0.md
- Instapaper：https://instapaper.com/docs/organize/overview ｜ https://www.macobserver.com/news/instapaper-10-adds-liquid-glass-and-home-screen-widgets-to-ios/ ｜ https://www.igen.fr/app-store/2026/07/instapaper-10-adopte-le-liquid-glass-et-modernise-son-site-web-157281 ｜ https://kennethreitz.org/essays/2009-01-instapaper_best_web_app_ever_created.pdf
- Audible：https://www.beyondthebookends.com/is-libro-fm-better-than-audible/ ｜ https://www.apkmirror.com/apk/audible-inc/audiobooks-from-audible/audiobooks-from-audible-3-47-1-release/ ｜ https://macmyths.com/how-to-use-audibles-listening-features-to-get-more-out-of-audiobooks/
