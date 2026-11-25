# 12 先锋网页 / 设计工具（Vercel · Stripe · Framer · Gross Collective · Lusion · Awwwards 年度站 · Linear）

- 调研时间：2026-11-25。领域视角：**只看骨架**——焦点在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏进二级页。配色情绪一律不谈。
- 本文可独立读懂；数据挪移的可行性均对照过 [00-data-inventory.md](./00-data-inventory.md)（首页独享数据只有「今日批数 S4」「待复习合计句 T9」「顺序承诺文案」三项，其余在日历页/我的页均有落点）。
- 方法限制（诚实声明）：
  - iter0 的 Stripe 首页拆解页抓取失败（fetch failed ×4），Stripe 结论取自其搜索摘要 + Memocore 的实测骨架记录（含 1440/390 两档量测）+ pagecritic 审计摘要，交叉印证。
  - 「Gross Collective」公开的结构拆解极少（搜索引擎无有效命中），本条改为它所属的**工作室索引页原型**（studio index / "the page IS a list of links"），来源为同原型的高质量实测记录（Framer 模板解剖、Neon Harbor 结构注记、Awwwards 248 站调研），不冒充对其官网的逐像素分析。
  - Lusion 为 WebGL 站，无 DOM 级拆解，结论来自 CommArts/DesignRush 评述 + Awwwards 调研中同族「固定舞台」页面的量化记录。

---

## 0. 结论速览（每产品一条 pattern）

| 产品 | 一句话骨架 | 首页放数据？ | 数据之外藏了什么 |
|---|---|---|---|
| Vercel 营销页 | mono 徽章 → 一句话大标题 → 导语 → 双胶囊 CTA，网格渐变只做大气层 | 不放（放代码 mockup） | 真实数据全在 dashboard，营销页零仪表盘 |
| Vercel 仪表盘 | 可收起侧栏 + 分页 tabs；移动端 = **悬浮底部条**（单手操作） | 放（状态置顶） | 19 项导航折叠进侧栏，项目级/团队级同页切换 |
| Stripe | 1264px 内容列 + **通栏竖 hairline 导轨**贯穿全页；hero 里嵌一个**实时计数 ticker** | 放（一个动态数字当主角） | 产品细节全部下放到 11 个 band |
| Framer | 单页滚动叙事：shader hero → marquee 横条分段 → tab 列表⇄预览互换 → 不规则 bento | 不放 | 案例细节藏在 tab 切换与滚动节拍里 |
| Gross Collective（工作室索引原型） | **页面即目录**：编号 + 一行行项目名 + 1px 分隔线，CTA 是纯文字链 | 不放（列表本身即数据） | 图片/详情 hover 才现身，导航缩成角落小字 |
| Lusion | **固定舞台**：一个主体驻场，内容在其后换景；chrome 钉死四角，一屏一景 | 不放 | 一切信息按场景逐屏给，无并置密度 |
| Awwwards 年度站（量化） | 超大字 + 极少字：hero 中位 72px、最强站最大字号 8.4vw；55% 首屏**没有按钮** | 倾向不放 | 藏导航（约 45/114 无顶栏）、藏装饰，留角落小链 |
| Linear | 暗色建筑学：层级 = 表面亮度差 1–3 个 RGB 值，ring-shadow 代边框，**零结构 padding** | 放（密集列表） | 深度全藏进近乎不可见的表面位移 |

---

## 1. Vercel —— 营销页与仪表盘是两套骨架

**结构拆解**
- 营销首页阅读顺序（实测记录）：`feature-grid → hero → sidebar → nav …→ cta → footer`；即 hero 不是文档流起点，页面本质是「产品橱窗」。
- hero-band 骨架：mono 小徽章（Introducing X 胶囊）→ 48px/600 句首大写标题（字距 -2.4px、句号结尾）→ 18px 导语 → **一行两个胶囊按钮**（黑墨实心 primary + 白底 secondary）→ 网格渐变背景占上半带。标题、导语、CTA 严格一栏居中堆叠，**不做分屏 hero**。
- 全站唯一转化件 = 黑墨胶囊（`border-radius:100px`，营销尺度 ~48px 高）；导航内的小按钮用 6px 圆角——两套尺度永不混用。
- 仪表盘（2026-02 全量的新导航）：横向 tabs **改回可拖拽、可隐藏的侧栏**；导航项按开发者高频工作流重排；「项目」降级为**筛选器**（同一页在团队级/项目级一键切换）；移动端 = **悬浮底部操作条**，为单手优化。侧栏曾塞 19 个平铺导航项，被拆成分组折叠。
- 数据观：营销页把真实运行数据做成**深色代码 mockup**（假终端），真数据只在登录后的仪表盘、按 tab 分面出现。首页（项目总览）只置顶两件事：production 状态 + 最近一次部署。

**对词笺首页的 css_only 偷法**
1. `.readouts{display:contents}`，三个 `.readout` 直接成为 `.start` 的 grid 子项，做成一排 Vercel 式状态胶囊：`border:1px solid var(--hairline); border-radius:9999px; padding:6px 14px; min-height:44px`（用 padding 把 44×44 撑出来），数字走 `font-variant-numeric:tabular-nums` + IBM Plex Mono。
2. `.start__spec` 整块翻成「深色终端带」：`background:#171717; color:#fff; border-radius:8px; padding:16px`，`.start__spec-row .k` 用 IBM Plex Mono 12px 大写灰 `#888`，值右对齐白字——四行工单表立刻变成部署日志条。
3. 极性反转带：`section.today-card` 用与页面相反的底色（浅页→墨块，`background:var(--ink); color:var(--canvas)`），零阴影，色块本身即分区——这是 Vercel 的 band 深度法。

- 来源：[Vercel 仪表盘导航改版 changelog（2026-02）](https://vercel.com/changelog/dashboard-navigation-redesign-rollout)、[旧版改版公告](https://vercel.com/blog/dashboard-redesign)、[Vercel DESIGN.md 实测拆解（VoltAgent）](https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/vercel/DESIGN.md)、[vercel.com 结构排序检测（design-extract）](https://github.com/manavarya09/design-extract/blob/7d37734ef93c57daf358638322ffcb2c45118b3d/website/public/gallery/vercel-com/vercel-com-DESIGN.md)、[Analytics 侧栏 19 项问题的拆解（Dribbble shot）](https://dribbble.com/shots/27518893-Vercel-Analytics-Dashboard-UX-Redesign)

---

## 2. Stripe —— 竖 hairline 导轨 + 把「实时数字」放上首页

**结构拆解**
- 首页骨架（2026-09 实测记录）：**内容列固定 1264px，两侧各有贯穿全页的竖直 hairline**（11 个 section、页面总高 15112px @1440）——网格导轨本身是品牌家具，不是辅助线。
- hero：大号轻字重标题写在白场上，**超尺寸彩色艺术图「横穿」文字层**（图压字但标题区保净空可读）；hero 区内嵌一个**实时 GDP 计数 ticker**——全站唯一把动态数据放上首页营销版面的位置，数字即信任状。
- hero 之下：logo marquee（日本站变 5 列网格版）→ **不规则 bento**（面板尺寸各异，「让产品巡览不沦为均匀网格」）→ Sessions 横幅 → 统计带 → 按企业规模分栏 → 开发者带 → 新闻 → CTA → 页脚。
- 移动端行为（审计发现）：390px 下 hero **直接砍掉解释性副文案**、只留标题+CTA——首页做减法是被验证过的。仪表盘侧（官方 full-page app 规范）：tabbed navigation + list-to-detail 流 + 数据可视化独立区；KPI 用计数瓦片（count tiles），国家分布明确用**表格+比例条**而不是图。

**对词笺首页的 css_only 偷法**
1. 竖导轨：`.app__main{position:relative}` + `.app__main::before{content:"";position:fixed;inset:0;background:repeating-linear-gradient(90deg, transparent 0 calc(33.333% - 1px), var(--hairline) calc(33.333% - 1px), var(--hairline) 33.333%);pointer-events:none;z-index:0}`；内容 `z-index:1` 浮在导轨上。360px 改两栏（50%），导轨线宽恒定 1px。
2. 「实时数字当主角」：把 `.today-card__head::after` 用 `content:"LIVE · 今日"` 小 mono 徽章顶到标签旁，`.today-card__figure > b` 放大 + `font-variant-numeric:tabular-nums`，figure 之间用 `border-left:1px solid var(--hairline)` 连成一条**统计带**（stats band），而不是三个离散卡片。
3. 不规则 bento 替代均匀三列：`.start{display:grid}` 拆掉 `.readouts` 后给三个 readout 分配 `grid-column:span 2 / span 1 / span 3` 的非对称跨列——与现有 bento 皮肤「磁贴等距」不同，这里刻意打破列宽。

- 来源：[Stripe 首页结构拆解（iter0，摘要）](https://iter0.com/blog/stripe-homepage-decoded)、[Stripe 2026 首页骨架实测（Memocore）](https://memocore.ai/memos/6ab62898af51aac421da88ae)、[stripe.com 审计（pagecritic，移动端 hero 砍文案）](https://pagecritic.app/r/adc6c5d3e93feba45a88367f.pdf)、[Stripe 官方 full-page app 设计规范](https://docs.stripe.com/stripe-apps/patterns/full-page-apps)、[Stripe dashboard 设计规范（官方 AI repo）](https://github.com/stripe/ai/blob/2815b93e2c54a87bd9b146df62704a0e84930929/skills/stripe-bfcm-dashboard/references/dashboard-design.md)

---

## 3. Framer —— marquee 横条分段 + tab 列表⇄预览互换

**结构拆解**
- Framer 系（官网与其模板生态同源）首页骨架：加载器 → shader/渐变 hero（超大标题 + 内嵌产品预览）→ **连续横向 marquee 带**（logo/证言漂移，兼作分节符）→ tab 式作品陈列（「a work showcase swaps projects through a tabbed list」——左边列表行，右边预览区随选中更换）→ 不规则 bento → 分步 process 段 → CTA/页脚。
- 关键结构件不是卡片而是**横向带**：内容以「条」为单位横贯视口，滚动每进一节换一条带，密度低、节拍强。
- 导航：固定顶栏 + 下拉（甚至主题切换也在导航下拉里），移动端菜单为整屏 overlay。

**对词笺首页的 css_only 偷法**
1. 用伪元素造中文 marquee 带：`.start__rule::before{content:"今日新词 · 到期复习 · 逾期清账 · 连续优秀 · 一页五个词 · ";white-space:nowrap;font:12px/1 "IBM Plex Mono";animation:mq 22s linear infinite}@keyframes mq{to{transform:translateX(-50%)}}`——文案是静态装饰文本（不承载数据），加 `@media (prefers-reduced-motion:reduce){animation:none}`。
2. tab 列表⇄预览映射：`.today-card__links` 两个文字链做成 ghost 胶囊 tab（`border-radius:64px;padding:0 16px;min-height:44px`），`.today-card:has(.today-card__reason.is-warn) .today-card__links a:last-child{outline…}` 用 `:has()` 让「逾期态」点亮对应 tab——纯 CSS 的选中暗示。
3. 分节横条：`.start__kicker/.start__eyebrow` 各拉成通栏 `border-top+border-bottom:1px solid var(--hairline)` 的窄带（高 44px、mono 小字垂直居中），页面变成「一条一条」而非「一块一块」。

- 来源：[Framer 模板生态的通用首页结构（Xeeron：双主题+marquee+tabbed showcase）](https://www.framer.com/marketplace/templates/xeeron/?via=elliot-li)、[Fiber 模板解剖（hero marquee + loader）](https://www.framer.com/marketplace/templates/64046/)、[Elevon 模板解剖（shader hero、bento、三步 process）](https://www.framer.com/marketplace/templates/elevon-studio/?via=usemuzli&dub_id=IbyKmaFEOEsgXiY5&utm_source=mstore)

---

## 4. Gross Collective（以「工作室索引页」原型替代，公开资料缺失）

**结构拆解（原型共性，多源实测）**
- 「**The page IS a list of links**」——索引派工作室站的纲领：无卡片、无图墙，首页 = 一张项目名册。每行：左缘编号（01/02…）+ 项目名（超大展示字）+ 右侧 category / year / client 三列小字，行与行之间只有 1px 线；hover 才浮出预览图。
- 版式：编号左缘栏 + 超大衬线/怪诞标题 + **不对称跨栏** + hairline 规则线 + **纯文字 CTA**（「Open your studio →」——无底无框，靠箭头与下划线成钮）；页边距 ≤32px 的贴边排版是常态（Awwwards 高分 114 站里约 45 个外边距 ≤32px）。
- 导航反常：约 45/114 强站**没有常规顶部导航条**，代之以角落小字链（10 个站整页只有一个链接/按钮）。结尾常用「名字拉满全宽」或一行页脚。
- 密度观：首页不放统计数字——**名册本身就是数据**；一切「关于结果」的信息推到详情页。

**对词笺首页的 css_only 偷法**
1. 名册化：`section.today-card{display:contents}`（拆壳后其子元素直接落入 `.start` grid）；`.start{counter-reset:row;display:grid;grid-template-columns:auto 1fr auto}`；每个 `.today-card__figure` 一行：`grid-column:1/-1;border-bottom:1px solid var(--hairline);padding:14px 0;min-height:44px`，`.today-card__tag` 为左列，`<b>` 数字右对齐；行号用 `::before{content:counter(row,decimal-leading-zero)}`（figure 上 `counter-increment:row`）——「01 新词 5」式台账。
2. 纯文字 CTA：`.btn--primary{background:none;border:0;border-radius:0;color:inherit;font:600 clamp(28px,9vw,44px)/1.1 "Newsreader";width:100%;text-align:left;min-height:44px;padding:18px 0}` + `.btn--primary::after{content:" →";letter-spacing:0}`——按钮不再是控件，是一行大标题，点击区仍是整行。
3. 角落导航：`.topbar__meta{position:fixed;bottom:8px;right:12px;font-size:11px}` 把顶栏小字沉到右下角；`.brand` 保持左上——首屏中央完全留给文字版面。

- 来源：[编辑/索引派版面语法（编号左缘+大衬线+hairline+纯文字 CTA）](https://huggingface.co/spaces/build-small-hackathon/jawbreaker/commit/502016b8521a2d1c8caa391a48096d3e3386fb94.diff)、[Neon Harbor 模板结构注记（项目行 = 标题/类别/年份/客户，1px 分隔，hover 浮图）](https://vibld.com/templates/neon-harbor)、[Most：编号固定侧栏的 index 型作品集](https://www.framer.com/marketplace/templates/most/?via=framplates)、[Awwwards 高分站版面统计（边距/角落链/无顶栏占比）](https://github.com/leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/skills/taste-skill/references/research.md)

---

## 5. Lusion —— 固定舞台，一屏一景

**结构拆解**
- 第三代官网 = 「immersive, interactive storytelling」：WebGL 实时 3D 主体**驻场不换**，滚动换的是它周围的文案与机位；评委会评注「progressive content reveals」「Juicy graphics keep you scrolling」——推进力来自场景切换，不来自列表。
- 同族 Awwwards 站（OKTO/NIKI 复刻记录、Montage 模板）的可量化共性：**0–100 加载计数**、pinned 舞台（一个元素钉住，其余内容从其前后穿过）、逐词文字揭示、横向条带、每屏一个主角（「A signature snap-scroll keeps each project locked center stage」）。
- 导航：无顶栏目录，入口缩成角落符号/菜单钮；首屏往往只有品牌名 + 一个动作。
- 数据观：这类站点首页**绝并置多件事实**；信息以「幕」为单位串行释放——对应用户「超大字+极少字」的极端形态。

**对词笺首页的 css_only 偷法**
1. 舞台锁定：`.screen{height:100dvh;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}`；`.today-card{position:sticky;top:calc(50dvh - 3em)}` 让 reason 句 + 一个大数字成为中幕，`.start__spec` 四行做成底部换幕字幕条（`opacity` 分层）。
2. 幕布揭示（无 JS）：`.start__masthead::before{content:"";position:absolute;inset:0;background:var(--canvas);animation:wipe .8s ease-out forwards}@keyframes wipe{to{transform:scaleY(0);transform-origin:top}}` + `prefers-reduced-motion` 兜底——进场即一幕。
3. 四角钉 chrome：`.icon-btn:nth-of-type(1){position:fixed;top:10px;right:64px}`、`.avatar-btn{position:fixed;top:10px;right:12px}`（保持 ≥44px 命中区），中央留给舞台。

- 来源：[Lusion 官网获 CommArts 收录的评述（immersive storytelling / progressive reveals）](https://www.commarts.com/project/36283/lusion)、[DesignRush 对 Lusion 的结构拆解（动态 3D + 空间构成 + 渐进揭示）](https://www.designrush.com/best-designs/websites/lusion-website-design)、[OKTO：Awwwards 级站点的逐结构复刻（loader/钉住 3D 场景/逐词揭示）](https://contra.com/p/NAM2BBoZ-oktor-studio-an-awwwards-level)、[Montage：snap-scroll 每屏锁一个项目于舞台中央](https://craftwork.design/product/montage)

---

## 6. Awwwards 年度站 —— 248 站 + 100 SOTD 的量化骨架规律

**最值得抄的结构性数字**（两轮调研：248 站 + 最新 100 个 Site of the Day，1440/390 双档实测）
- **尺度**：hero 中位 72px（5.0vw）；强站页内最大字号中位 **8.4vw**、上四分位从 10.4vw 起步；手机端 hero 中位 40px；字距 -0.01em、行高 1.0 是主流。**强站把极端推向更大，弱站挤在中间**。
- **一屏一事**：约 20/114 强站明确「one thing per screen」；约 20 个每节换一块整底色。**首屏没有按钮的强站占 55%**——CTA 可以不是首屏控件。
- **导航**：中位只有 **3 个链接**；66% 固定/粘顶；但约 45/114 强站没有常规顶栏，22 个用角落小字链。
- **字阶吝啬**：约 30 个强站全页只有 **2–3 个字号、中间没有过渡级**；页面以中位 8 个独立字号计，强站更少。
- **形状**：强站按钮 52% 是方角（0–2px），弱站 59% 全圆角；94% 图片直角。**首屏即讲清「这是什么」失败的 15/97 个站全部扣可用性分**。
- **结尾即版面**：收尾 = 名字拉满全宽（18 次提及）/ 反色重放 hero（12）/ 无页脚或仅一行（22）——页尾是结构件，不是链接矩阵。
- **反面清单**：居中一句话+下面截图＝弱站签名版式（弱 24% vs 强 7%）；图标三件套卡片、药丸徽章堆、渐变字全是被判弱的信号。

**对词笺首页的 css_only 偷法**
1. 两级字阶：全页只留两档——`.start__kicker,.start__eyebrow,.start__meta,.today-card__tag{font-size:12px}` 与「焦点数字/文字链」一档 `clamp(56px,18vw,168px)`；删掉所有中间级（`.start__spec` 直接降为 12px mono 细目行）。
2. 满宽尾奏：`.start__foot .start__rule::after{content:"词笺";display:block;font:600 clamp(48px,16vw,200px)/0.9 "Instrument Serif";letter-spacing:-.02em}`——把页脚线换成年度站式「名字满幅」终幕（词笺自有 DOM 里 `.brand__name` 也可 `order` 挪到末尾放大，二选一）。
3. 方角+零装饰：`.btn--primary,.readout,.today-card{border-radius:2px;box-shadow:none;background:none}`，分隔只允许 `1px solid var(--hairline)`——强站证据支持「thin rules 通用、阴影是弱信号」（阴影≥5处：强 10% vs 弱 30%）。

- 来源：[248 站 + 100 SOTD 实测调研原始数据（taste-skill/research.md）](https://github.com/leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/skills/taste-skill/references/research.md)、[同研究的滚动叙事/SOTD 手法条目](https://cdn.jsdelivr.net/npm/@flitzrrr/frontend-design-skills@1.1.1/spec/domains/16-design-trends.md)、[Type-Driven Hero 词条（文字墙占据全部视觉负担的定义与案例）](https://brainy.ink/paper/glossary/type-driven-hero)、[Adcker：零图片、满屏巨型词的工作室站解剖（中文）](http://mp.weixin.qq.com/s?__biz=MzY5NDI0NjgwNw==&mid=2247485596&idx=1&sn=1dc456d2f2451e082a35af79e44a4fd5)

---

## 7. Linear —— 暗色建筑学与表面密度

**结构拆解**
- 营销页 = 产品截图的延伸：固定 ~72px 顶栏（`main{padding-top:72px}` 预留偏移）；**body/section/header/footer 全部零 padding**，间距全下放到组件——页面是一叠「面板」而不是一篇文章。
- 深度系统：底 `rgb(8,9,10)` → 框 `rgb(9,10,11)` → 卡 `rgb(15,16,17)` → 视图 `rgb(18,19,20)` → 输入 `rgb(22,23,24)`——**层级 = 亮度差 1–3 个 RGB 值**，配合 `0 0 0 1px rgba(255,255,255,.08)` 的 ring-shadow 当边框；「元素相属因为共享表面，不是因为留白」。
- 标题骨架：h1 64px/510/**行高 1.0**/字距 -1.408px；h2 40px/510；强调全靠字重 510/590 的「之间值」，最重不过 590。单强调色 indigo，另有一个 15% 透明度的 accent 光斑（pulse dot）当氛围光源。
- 仪表盘观（其产品本体）：高密度 issue 行列表——行 = ring-shadow 描出、状态点 50% 圆、元数据 13px 灰；信息密度靠「同表面成组」组织。
- 首屏叙事：短句宣言 + 一个发光的真实界面截图（不是插画）——**把产品 UI 本身当 hero 图像**。

**对词笺首页的 css_only 偷法**
1. 表面成组：`.readouts,.today-card{background:var(--surface-2);box-shadow:0 0 0 1px rgba(255,255,255,.08) inset;border:0;border-radius:8px}`，组内 `.readout{padding:10px 14px}` 之间不再留白——三个读数共享一张表面即成为一个部件（Linear 的「邻近即归属」）。
2. ring-shadow 代边框：所有分隔用 `box-shadow:0 0 0 1px rgba(255,255,255,.08)`（暗档）/ `rgba(0,0,0,.08)`（浅档），1px 不发虚、随底色自适应——两档语义色各写一遍正好满足项目约束。
3. 字重走「之间值」：中文标题可用 `font-weight:510`（IBM Plex Sans 有 500 档，Newsreader 510 最近可取 500；系统回退时 510 原样透传为 500 行为可接受），配合 `letter-spacing:-.02em;line-height:1` 的巨型焦点字。

- 来源：[Linear 营销页实测 DESIGN.md（表面栈/510-590 字重/ring-shadow/零结构 padding/72px 顶栏偏移）](https://github.com/educlopez/design-bites/blob/main/design-mds/linear.app/DESIGN.md)、[linear.com 结构排序与配色检测（design-extract）](https://github.com/manavarya09/design-extract/blob/7d37734ef93c57daf358638322ffcb2c45118b3d/website/public/gallery/linear-app/linear-app-DESIGN.md)、[Linear design language 全量抽取](https://github.com/manavarya09/design-extract/blob/189d5ea0aed63977f4e6d9495b9d9cf4524fae49/website/public/gallery/linear-app/linear-app-design-language.md)

---

## 8. 基于本领域给词笺首页的 3 个结构方向

> 判定标准：与 bento（不对称磁贴墙）、play（燃橙厚按钮+沉 6px）、nocturne（墨蓝排印文档）相比，**改的是信息架构与版面骨架**。以下三案首屏互斥，且 `title/lede` 一律 `display:none`（用户要求），全部只动 CSS。

### 布局 A「海报字墙」—— 首屏只有一个数字

- **焦点**：`今日新词` 一个数字，占视口高度的 40–55%，贴左缘、行高 0.85、字距收紧（Newsreader/Instrument Serif 巨号或 IBM Plex Mono 巨型数字均可）。它不是「读数之一」，它就是版面。
- **骨架**：`.screen{min-height:100dvh;display:grid;grid-template-rows:auto minmax(0,1fr) auto}`；`.start{display:grid;grid-template-rows:auto 1fr auto;row-gap:0}`——顶条（kicker+eyebrow 拉成 24px mono 细目行）→ 巨数字场 → 底部 CTA 满幅墨块。`.readouts{display:contents}`，只渲染第一个 `.readout`，其 `.readout__v{font-size:clamp(150px,48vw,420px)}`，另外两个 `.readout{display:none}`；`.start__masthead,.start__meta,section.today-card{display:none}`。
- **数据**：首页只留 1 个数。今日新词日历页 hero 有（大字「现在可学 N」），连续/总词量我的页有——挪走不丢。唯一注意：**批数 S4 与 T9 是首页独享**，若连巨数字也取自 today-card 则需把批数留给 `.start__spec` 单行兜底。
- **CTA 形态**：`.btn--primary` = 满幅、通栏、无边距的墨块横带（`border-radius:0;min-height:72px;position:sticky;bottom:0`），像电影片尾字幕卡上的一条 inverse 带——按钮是**版面构件**不是控件（manifesto 原型：oversized solid block）。
- **360/768/1440**：360 巨数字 `clamp` 下限 150px 仍溢出感可控（两位数 `tabular-nums` 宽 ≤2 字）；1440 改两栏：左巨数字，右 `.start__spec` 四行细目账（rail 网格 `border-left:1px solid var(--hairline)` 对齐）。
- **AA 风险**：巨数字 ≥24px 走 3:1 即可；底部带内白字 `开始背单词` ≥16px/600 走 4.5:1，对比度由墨底保证；sticky 带遮住页面时需给 `.start` 末行留 padding-bottom。
- **与现有三案的本质区别**：bento 是「多焦点拼贴」，play/nocturne 仍是「可滚动的多块文档」；本案把首页砍成**单焦点海报**，数据可见性 9→1，CTA 从控件升格为版面边界。

### 布局 B「施工蓝图」—— 首页 = 一张编号台账，网格线当布景

- **焦点**：不是任何单元素，而是**贯穿全页的 hairline 竖导轨 + 编号行**本身；视线从左上「01」开始逐行下读（Longbow/Stripe 的「网格即品牌家具」）。
- **骨架**：`.app__main::before` 画 2 根固定竖 hairline（360 为 33.3%/66.6%，768+ 为四栏）；`main .start{position:relative;z-index:1}`。所有区块拆壳成行：`.readouts{display:contents}`、`.today-card{display:contents}`，`.start` 变 `display:grid;grid-template-columns:auto 1fr auto`；`.readout`、`.today-card__figure`、`.start__spec-row` 统统成为**同一种台账行**：左缘 `counter` 编号（01–09，12px mono 灰）+ 标签 + 右缘 tabular 数字，行间 1px hairline，行高 ≥44px（`padding:12px 0`）。`.start__spec` 不再像工单表，混编进同一张名册（用户批评的「4 行工单」在此被吸收为行）。
- **数据**：全部数据留首页，但形态从「瓦片/卡片」换成「**一维名册**」——密度最高、装饰为零（索引原型）。`.today-card__links` 拆到页尾作两条「→ 错词本 / → 日历」文字链；`.today-card__reason.is-*` 变名册末尾一条 `border-top:2px` 的批注行。
- **CTA 形态**：纯文字链式 CTA——`.btn--primary{background:none;border:0;border-radius:0;color:var(--accent);font:600 32px/1.2 "Space Grotesk";text-align:left;width:100%;min-height:44px;padding:14px 0}`，`::after{content:" →"}`，hover/active 只换下划线；它是名册的「第 00 行」，与索引原型「typographic-only CTA」一致——**与 play 的厚按钮是物种级对立**。
- **360/768/1440**：360 行内三列（编号 16px / 标签弹性 / 数字 auto 宽）不溢出；1440 名册限宽 1264px 居中（Stripe 实测值），导轨延伸到全页高，页脚 `.start__rule::after` 满宽「词笺」大字终幕。
- **AA 风险**：12px 灰编号为装饰性可豁免正文标准，但标签/数字保持 ≥14px、≥4.5:1；文字链 CTA 需 `text-decoration:underline` 或足够色对比，避免纯色彩编码。
- **与现有三案的本质区别**：bento 靠二维拼贴组织数据，本案是一维台账——**把仪表盘读成一本书的目录**；play 用控件推行动，本案用排版层级推行动；首页第一次出现「网格是内容的一部分」。

### 布局 C「驾驶舱 / 固定舞台」—— 100dvh 零滚动，底部操作台

- **焦点**：屏幕中央的舞台件 = 今日状态句（`.today-card__reason`）+ 一个焦点数字；周围是仪表化的边条。参照 Lusion 固定舞台 + Vercel 移动悬浮底栏 + Linear 状态密度。
- **骨架**：`.screen{height:100dvh;display:grid;grid-template-rows:auto 1fr auto;overflow:hidden}`；顶 = `.topbar` 细轨（brand 左、icon-btn 右，`border-bottom:1px` hairline，高 ~52px）；**读数不上主舞台，收进顶轨**：`.readouts{display:contents}` 后 `order:-1` 把三个 `.readout` 拉进 header 行内（`.topbar{display:flex;flex-wrap:wrap}` 配合），渲染成 `今日 5 · 批 1 · 已学 312` 式 mono 状态微带（11–12px，`gap:10px`，用 `/` 分隔 `::after`）；中 = 舞台：`.today-card` 绝对居中，内部只显 `.today-card__figure:nth-child(1)`（或焦点态：`.today-card:has(.is-warn) .today-card__figure:nth-child(3){display:block}` 让**逾期数**在 warn 态自动顶替上台——`has()` 条件结构切换）+ `.today-card__reason` 一句 + `.today-card__label` 日期小字；底 = 操作台：`.btn--primary{position:fixed;inset:auto 12px calc(12px + env(safe-area-inset-bottom)) 12px;border-radius:9999px;min-height:52px}` 悬浮胶囊条，`.today-card__links` 两链拆到胶囊内两侧作次级钮（`display:contents` + order，次级钮 44×44）。
- **数据**：首页从「满页数据」变为「顶轨 3 微数 + 台上 1 大数 + 1 句 reason」。`.start__masthead/.start__meta/.start__spec/.start__foot` 全部 `display:none`（均有日历/我的落点）；**批数 S4** 靠顶轨微带保住，**T9 待复习句**因是首页独享——保留在 `.today-card` 内（`.today-card .today-card__reason:last-of-type` 以 13px 次级行显出，或随舞台 `order` 排到 reason 下）。
- **CTA 形态**：悬浮底栏（Vercel 移动模式）：fixed、圆环、带 safe-area，主钮占条内 60% 宽，两个次级链接为条尾 44×44 图标位文字链。按下去有 `transform:translateY(2px)` 的微反馈（不与 play 的 6px 下沉混淆——本案钮是** dock** 不是实体键帽）。
- **360/768/1440**：360 全案成立（本来就以 390 设计）；768+ 舞台件限宽 560px；1440 把 dock 收成居中草药丸（max-width:520px），左右下角补角落小字（Awwwards 角落链模式）显示日期与版本号，中央舞台留白加大——像 cockpit 熄屏待机。
- **AA 风险**：`overflow:hidden` + 100dvh 在矮安卓（<640px 可视高）可能裁切 → 用 `@media (max-height:640px){.screen{height:auto;overflow:visible}}` 退回文档流；11px 顶轨属非正文微文案，若按项目「中文正文 ≥14px」执行则顶轨数字提到 14px（mono 14px 仍是一行得下，360 下 2 行 wrap 可接受）。
- **与现有三案的本质区别**：七套旧皮肤首页全是**文档**（滚动、堆叠、多块并置）；本案是**壳层应用**：视口即座舱、零滚动、导航沉底、数据分「微带/舞台」两级——信息架构从「页」改成「屏」。

---

## 9. 跨产品骨架定律（本领域共识，供后续皮肤评审当尺子）

1. **焦点唯一性**：首屏只允许一个视觉主角（Awwwards：20 强站一屏一事；55% 强站首屏无按钮）。凡是「3 读数 + 4 数字 + 标语 + CTA 同权重」的首页都在被批评之列。
2. **字阶吝啬**：全页 2–3 个字号、两极分化（6–9vw 级 vs 11–14px 级），中间调是平庸信号（强站最大字 8.4vw vs 弱站 5.0vw）。
3. **hairline 是万能分隔**：1px 线在强站出现率 61%，但必须配合「表面成组」（Linear）或「导轨贯穿」（Stripe/Longbow）才成骨架，否则只是装饰。
4. **导航可以消失或沉底**：中位 3 链；强站约四成无顶栏（角落链）；移动端最严肃的替代 = 悬浮底栏（Vercel 官方结论）。首页文字链（错词本/日历入口）天然适合拆进角落或 dock。
5. **数据的两种放置法**：要么像 Stripe 把一个**活的数字**当 hero 信任状；要么像 Vercel 营销页/Lusion 干脆不放——**最怕的是平均撒**（现状：首页同一数据重复 3 份，S3/S10/S12 三重曝光）。
6. **CTA 三形态各有其骨架**：墨块胶囊（Vercel 控件式）、满幅横带（manifesto 构件式）、纯文字链+箭头（索引原型反控件式）——形态变化必须连带版面逻辑一起变，单换形状=又一层皮。

---

## 10. 来源清单

- Vercel 仪表盘导航改版（侧栏/悬浮底栏/项目筛选器）：https://vercel.com/changelog/dashboard-navigation-redesign-rollout ；https://vercel.com/changelog/new-dashboard-navigation-available ；https://vercel.com/blog/dashboard-redesign
- Vercel 营销页 DESIGN 实测：https://github.com/VoltAgent/awesome-design-md/blob/main/design-md/vercel/DESIGN.md ；结构排序检测：https://github.com/manavarya09/design-extract/blob/7d37734ef93c57daf358638322ffcb2c45118b3d/website/public/gallery/vercel-com/vercel-com-DESIGN.md ；Analytics 侧栏 19 项拆解：https://dribbble.com/shots/27518893-Vercel-Analytics-Dashboard-UX-Redesign
- Stripe 首页拆解：https://iter0.com/blog/stripe-homepage-decoded （仅摘要可得）；骨架实测：https://memocore.ai/memos/6ab62898af51aac421da88ae ；审计：https://pagecritic.app/r/adc6c5d3e93feba45a88367f.pdf ；官方规范：https://docs.stripe.com/stripe-apps/patterns/full-page-apps ；https://github.com/stripe/ai/blob/2815b93e2c54a87bd9b146df62704a0e84930929/skills/stripe-bfcm-dashboard/references/dashboard-design.md
- Framer 结构样本：https://www.framer.com/marketplace/templates/xeeron/?via=elliot-li ；https://www.framer.com/marketplace/templates/64046/ ；https://www.framer.com/marketplace/templates/elevon-studio/?via=usemuzli&dub_id=IbyKmaFEOEsgXiY5&utm_source=mstore
- 索引原型（Gross Collective 替代证据）：https://huggingface.co/spaces/build-small-hackathon/jawbreaker/commit/502016b8521a2d1c8caa391a48096d3e3386fb94.diff ；https://vibld.com/templates/neon-harbor ；https://www.framer.com/marketplace/templates/most/?via=framplates
- Lusion：https://www.commarts.com/project/36283/lusion ；https://www.designrush.com/best-designs/websites/lusion-website-design ；同族复刻 https://contra.com/p/NAM2BBoZ-oktor-studio-an-awwwards-level ；https://craftwork.design/product/montage
- Awwwards 量化调研（本领域数据主源）：https://github.com/leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/skills/taste-skill/references/research.md ；https://cdn.jsdelivr.net/npm/@flitzrrr/frontend-design-skills@1.1.1/spec/domains/16-design-trends.md ；https://cdn.jsdelivr.net/npm/@flitzrrr/frontend-design-skills@1.1.1/spec/domains/17-ui-patterns.md
- 超大字文字墙：https://brainy.ink/paper/glossary/type-driven-hero ；http://mp.weixin.qq.com/s?__biz=MzY5NDI0NjgwNw==&mid=2247485596&idx=1&sn=1dc456d2f2451e082a35af79e44a4fd5 ；https://webdesignerdepot.com/75-type-driven-sites/
- Linear：https://github.com/educlopez/design-bites/blob/main/design-mds/linear.app/DESIGN.md ；https://github.com/manavarya09/design-extract/blob/7d37734ef93c57daf358638322ffcb2c45118b3d/website/public/gallery/linear-app/linear-app-DESIGN.md
- 单 CTA 律：https://github.com/pproenca/dot-skills/blob/9c015c68df33adf461ea9fa7071c119ca0061a0a/skills/.curated/ui-design/references/layout-single-cta.md

> 未修改任何源码/既有文档；本文件为本任务唯一写入。
