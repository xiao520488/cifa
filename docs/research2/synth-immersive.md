# synth-immersive · 沉浸版面族收敛稿：5 个首页骨架候选

> 输入：`docs/SKIN_BRIEF.md`（DOM/令牌/硬指标）× `07-game-menu.md`（极端不对称菜单）× `12-web3-brutal.md`（超大字+hairline 网格）× `03-music.md`（横向货架）× `04-reading.md`（书脊书架）× `00-data-inventory.md`（数据可见性）。
> 输出：5 个**版面骨架级**候选，供主设计者拍板。本族允许比另两族更激进，但全部纯 CSS、可过 360 零溢出与 AA。
> 对照红线：与现有 7 套（paper/foundry/instrument/broadsheet/bento/play/nocturne）骨架不得同型；play 已占「厚按钮+大字号」、nocturne 已占「零阴影排印文档」，下文逐一避开或明确超越。

## 0. 五案共享前提（所有候选默认执行）

1. `.start__title`、`.start__lede` 一律 `display:none`（用户铁律）。hero 焦点由 **数字 / 结构线 / 版面 / 文字行 CTA / 场地** 顶上，不由留白顶上。
2. 拆骨架统一入口：`[data-skin=x] .start__body { display:contents; margin-block:0 }`（`.start__body` 基线 `margin-block:auto` 必须先清零），使 eyebrow/meta/spec/actions/today-card 升为 `.start` 网格同层兄弟，可用 `order/grid-column/position` 重排。
3. 五个 skin-hook 块（`.topbar__meta` / `.readouts` / `.start__spec` / `.start__kicker` / `.start__masthead`）默认 `display:none`，每案显式声明开/关——**不开钩子的方案不可能换骨架**。
4. 首页独享三件（`00-data-inventory.md` §3）：**批数 S4、待复习合计句 T9、「先复习后新词」承诺**。CSS 不能跨 screen 搬 DOM，所以每案都必须给 S4/T9 留一个**非 aria-hidden 的 DOM 宿主**（首选 `.start__spec-row:nth-child(3)` 单行保留，T9 用 `.today-card__reason:last-of-type`——两条 reason 恒为 [T8, T9?]，取末条即「有承诺句显示承诺句，没有则退回原因句」，一规则两用）。
5. 功能入口不许丢：主 CTA（`.start__actions .btn--primary`）、`.today-card__links`（错词本/日历）、`.start__foot`（换个阶段）三件在五案全部保留，只换形态位置。
6. 硬指标逐案自检：360 零横溢（出血一律 `margin-inline:calc(-1*var(--page-x)) + padding-inline:var(--page-x)` 进 `overflow-x:auto` 容器，禁 `100vw`、禁 `translateX` 布局）；可点 ≥44×44；成句中文 ≥14px 且 ≥4.5:1；`--warning/--danger/--success` 明暗两档各写；红只给逾期/错误；装饰伪元素中文不承载信息、不复读现有文本。

---

## 1. 速览对照表

| | ① 装订边 | ② 脊架 | ③ 转盘 | ④ 平面图 | ⑤ 名册 |
|---|---|---|---|---|---|
| 首屏主角 | 26% 处一根 accent 竖线 + 线上巨型数 | 一排参差竖书脊 + 层板 | 一句问候大标题 + 圆盘横轮 | 一张场地：CTA 是可站的地板 | 一行超大文字链 CTA + 编号台账 |
| 阅读动线 | 沿线挂读（竖轴） | 架上浏览（横向物化） | 横滑一轮即止 | 空间环视（2D） | 一维名册直读 |
| 密度 | 极低（第二低） | 低 | 低-中 | 最低（元素≤8） | 中-高（全部吸收成行） |
| 导航位 | 顶栏原样 | 顶栏 + 层板前缘书签 | 顶栏 + 常驻底带 | 四角钉死 | 顶栏 + 名册行内 |
| CTA 物种 | 切角满宽块（线上挂） | 抽屉拉手（sticky 底） | 货架头内联药丸 | 地板件（absolute 场地） | 超大文字行（去壳） |
| hooks 开 | kicker, masthead-meta | kicker(铜牌), spec 第3行 | topbar__meta, readouts, spec 第3行 | masthead, kicker | masthead, spec, kicker |
| 主要族源 | 游戏×网页 | 阅读×游戏(Firewatch) | 音乐 | 游戏×网页 | 网页×阅读 |

---

## 2. 候选① 「装订边」 `bound-edge`

- **一句话结构**：首屏一根 2px 强调色竖线贯串内容全程高、偏左 26%，页面从此有了「装订边」；线左侧只挂标签与竖排日期书脊，线右侧顶格是一个 `clamp(72px,20vw,120px)` 的今日新词巨数（首屏 ≥40% 视觉重量），其下依次挂到期/逾期批注行、原因句、切角满宽 CTA；其余全部不在这一屏。
- **保留 / 砍掉 / 去哪**：
  - 留：`.today-card__figure:nth-child(1)`（新词巨数，含 `↑+5` tag）；figure 2/3（到期、逾期）压成线右两行 14px 批注（逾期行 `:has(b.is-warn)` 才满对比，平时 `opacity:.55`——P5 的「层级靠对比不靠字号」）；reason `:last-of-type`（T9 承诺句）；spec 只开第 3 行（S4 批数，mono 小台账）；`.start__masthead-meta` 竖排当书脊；kicker 当左上牌签；`.today-card__links` 两枚文字链沉到左栏底线旁；foot。
  - 砍：`.start__eyebrow` `.start__meta` `.readouts` `.start__spec` 1/2/4 行、figure 4（连续优秀→日历 hero `cal-figures` 已有，CalendarScreen.tsx:185-188）；阶段/已学/总词数→我的页（ProfileScreen.tsx:96,333-339）。
- **主 CTA**：`clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), 12px 100%, 0 100%)` 切角满宽块，高 ≥64px，贴线右侧、首屏下 1/3 处；非 sticky。按压态不是阴影加深，而是 `::before` 一块 accent 底板 `translateX(-8px)` 顶出（P5 色块顶出）。切角 ≤12px 且用伪元素画角、实体盒保持 ≥44×44 命中。
- **具体 CSS 手段**：`[data-skin='bound-edge'] .start { position:relative; display:grid; grid-template-columns:26% minmax(0,1fr); column-gap:var(--space-3) }`；`.start::after { content:""; position:absolute; top:0; bottom:0; left:26%; width:2px; background:var(--accent) }`；`.start__body { display:contents }`；`.today-card { display:grid; grid-column:2; grid-template-columns:1fr; }`（保留 section 盒子与 aria-label）；`.start__masthead { grid-column:1/-1 }` 内 `.start__masthead-meta { writing-mode:vertical-rl; letter-spacing:.2em; height:min(30vh,150px) }`；`.start__spec { grid-column:2 }` + 行级过滤 `nth-child(3)`；`.start__actions { grid-column:2 }`；`:has()` 条件提亮逾期行，缺省态两行均在场（`:has()` 不支持时不塌）。
- **360 / 768 / 1440**：360 线在 26%≈94px，左栏只放 2–4 字竖排/短标签（≥14px 可容），巨数 `clamp` 下限 64px 两位数不破栏；768 线移到 30%、行距放大、figure 批注恢复完整标点；1440 `.start { max-width:780px; margin-inline:auto }`，线随内容居中成为竖构图书脊，背景再叠 1px 灰 hairline 副轨（Stripe 导轨感）但不做真多栏。
- **风险**：左栏 94px 内中文换行（已把中文成句全放右栏规避）；切角吃掉命中区（用伪元素角规避，实体矩形）；竖排只给日期数字/拉丁，符合「成句中文保持水平」红线；深浅两档的 accent 线对比（深色档线色提亮一档）；`column-gap` 与线宽重叠需实测 `scrollWidth`。
- **借鉴**：Persona 5 系统菜单「中央一条白色引导线，选项沿线排列，层级靠对比度」——须藤正喜 CEDEC＋KYUSHU 2017 演讲：<https://www.chuapp.com/article/284630.html>、逐屏解析 <https://www.vgover.com/zh-tw/news/12008>；Stripe 贯穿全页的竖 hairline 导轨：<https://memocore.ai/memos/6ab62898af51aac421da88ae>；索引原型「编号左缘栏 + 贴边排版」：<https://vibld.com/templates/neon-harbor>。
- **与 7 套的差异**：broadsheet 用栏线**分隔**多栏报纸内容，本案一根线**定义**两栏不对称且线本身是主角；nocturne 是双栏排印文档，本案没有「栏内文章」只有「线上挂件」；bento 的秩序来自磁贴并列差，本案来自单一物理轴。

---

## 3. 候选② 「脊架」 `spine-shelf`

- **一句话结构**：首页 = 一面书架。4 个 `.today-card__figure` 用 `writing-mode:vertical-rl` 立成参差书脊（高 92/78/86/80%，`<b>` 数字是脊面烫印、中文标签竖排成书脊题签），下方一条双层渐变「层板线」，层板前缘垂两枚书签色标（错词本/日历入口）；架上占首屏 44–50% 高，架下只留一句承诺批注 + 通栏抽屉拉手 CTA。
- **保留 / 砍掉 / 去哪**：
  - 留：4 脊（新词/到期/逾期/连续——今日关键账全在架上，逾期脊挂红缎带书签，红只此一处）；`.today-card__label` 当架上铜牌抬头；reason `:last-of-type`（T9）压成层板下 14px 手写批注；spec 只开第 3 行 → 脊架右上角「架签」mono 小条（S4 批数）；`.today-card__links` → 层板前缘两枚垂带书签（`::before` 画缎带尖，按钮本体 ≥44×44）；foot。
  - 砍：`.start__eyebrow` `.start__meta` `.readouts` `.start__spec` 其余行、第一条 reason（T8→日历 `.cal-hero__reason` 同源文案，CalendarScreen.tsx:123,165）；`.start__masthead`/`.start__kicker` 关，牌位由 `__label` 顶替。
- **主 CTA**：「抽屉拉手」——`.start__actions { position:sticky; bottom:0; margin-top:auto }`，`.btn--primary { min-height:56px; width:100%; border-radius:2px }`，上缘一道 `linear-gradient` 高光像金属把手；`min-height` 用 `100dvh - 架上内容高` 自然落在拇指区；不用 fixed（`.app` 有 `max-width:var(--app-max)`，fixed 桌面会脱列，音乐笔记 §1.1 的坑）。页面 `padding-bottom` 由 `.screen` 基线 `--space-6` 兜住。
- **具体 CSS 手段**：`[data-skin='spine-shelf'] .today-card { display:flex; flex-direction:column }`（保留盒子保 aria-label）；`.today-card__figures { display:flex; align-items:flex-end; gap:8px; height:min(44vh,320px); padding-bottom:14px; border-bottom:10px solid transparent; border-image:linear-gradient(180deg,var(--border-strong) 0 4px, transparent 4px 5px, var(--border) 5px 6px) 1 }`（层板线）；`.today-card__figure { writing-mode:vertical-rl; text-orientation:mixed; flex:1 1 0; min-width:0; height:88%; padding:14px 8px; background:var(--surface-raised); border:1px solid var(--border) }` + `nth-child` 四档高度与深浅微差；`.today-card__figure b { font-size:24px; font-variant-numeric:tabular-nums }` 烫印在脊顶；`.today-card__tag`、内嵌「计划 N」span `position:absolute` 外挂到脊肩（否则撑破竖排盒）；脊面纹理用 `repeating-linear-gradient` 布纹（SoundCloud 波形柱的手感转译）；逾期脊 `:has(b.is-warn)` 时 `::after` 垂一条 `--danger` 缎带。
- **360 / 768 / 1440**：360 内容宽 320，4 脊 ≈4×72+3×8=312，「到期复习」4 字竖排 56px < 脊高，成立；768 书架限宽 640、脊高升至 52vh、两侧加 8vw 收边墙（`linear-gradient` 阴影带，一处即止）；1440 书架居中、层板延伸满幅 hairline、右上架签（批数）移到左缘竖排。
- **风险**：竖排中文可读性弱于横排——所以脊面只放「两字标签+数字」级别的短词，成句中文全在层板下横排；`writing-mode` 不影响无障碍朗读顺序但视觉扫读变慢（书架语义自洽）；`border-image`+`gap` 在旧 WebView 的兼容需实测；sticky 拉手与 foot 行同屏时的互压（foot 放拉手上方一行）；参差高度若用 `translateY` 只允许 Y 轴（音乐笔记红线）。
- **借鉴**：书脊化本体出自阅读调研方向 B「把四个数字变成四本立着的书」：<https://www.woshipm.com/evaluating/5237152.html>（微信读书书架网格原型）+ Kindle Library 行式书架 <https://www.makeuseof.com/kindle-best-reading-app/>；「数字印在被统计物表面上」= Celeste 选关地图统计 <https://noctes.mathematicae.ca/peak-game-design-in-celeste.html>；批注句而非表格 = Firewatch「菜单是手里那张纸」<https://wnhub.io/zh/news/game-design/item-10979>；纹理柱借 SoundCloud 波形 <https://ixd.prattsi.org/2019/09/design-critique-soundcloud-ios-app/>。
- **与 7 套的差异**：没有任何一套把数据「立起来」——bento 是面、play 是币、foundry 是铭牌、broadsheet 是版面，本案是**实体书脊**：数据的容器几何从矩形格变成竖条，这是物件化版面，不是排印变体。

---

## 4. 候选③ 「转盘」 `disc-rail`

- **一句话结构**：把 `.topbar__meta`（阶段·今日 N 词，真实 DOM）从小 chrome 提升成 34px 时段问候式大标题，填 `.start__title` 删后的焦点位；其下一条**横滑黑胶轮**——4 个 figure 做成 Apple Music Stations 同款圆盘（首盘 96px/数字 34px，余三盘 68px/数字 22px，`radial-gradient` 内圈硬停当唱片孔），第三盘恒被切在屏边；「开始背单词」缩成货架头右侧一枚 YTM「Play all」式内联药丸；`.readouts` 经 `.app` flex `order` 沉底成常驻 mini-player 条。
- **保留 / 砍掉 / 去哪**：
  - 留：4 盘（新词/到期/逾期/连续，逾期盘右上角 `--danger` 红点贴纸）；`__label` 日期做轮上小题；reason `:last-of-type`（T9）做轮下「当前曲目」一行；spec 只开第 3 行做轮旁「N 批 · 每批 M 词」mono 条（S4 非 aria 宿主）；`.readouts` 三数常驻底带（S3/S4/S5 补零读数——正好是播放器条上的进度刻度语汇，`aria-hidden` 因此无害，真数在盘上另有一份）；links 留在 `__head` 内当「See all」位；foot。
  - 砍：eyebrow、meta、masthead、kicker、第一条 reason（T8→日历 hero 同源）；阶段名经 `.topbar__meta` 保留在问候大标题里（S1 不丢）。
- **主 CTA**：内联药丸 `border-radius:999px; min-height:44px; min-width:132px; width:auto`，贴在货架头行右侧（与 `__label` 同行），**不再满宽**——「播放」内联进货架头是这个族的核心发明（YTM 2024 改版的原话级做法）；360 下与标签挤不进时经 `@media (max-width:399px)` 回退为轮下方通栏 48px 条。非 sticky（常驻底带已提供「随时能按」感）。
- **具体 CSS 手段**：`[data-skin='disc-rail'] .topbar { }`（sticky 即定位锚）+ `.topbar__meta { display:block; position:absolute; top:calc(100% - 6px); left:var(--page-x); font-size:clamp(28px,7.4vw,34px); font-weight:700; letter-spacing:-.02em; color:var(--text) }`、`.topbar__sep { display:none }`、`.start { padding-top:84px }`；`.start__body { display:contents }`、`.today-card { display:grid; border:0; background:none; box-shadow:none; padding:0 }`（保盒子）、`.today-card__head` 与 `.start__actions` 同 row 分列；`.today-card__figures { display:flex; gap:14px; overflow-x:auto; scrollbar-width:none; margin-inline:calc(-1*var(--page-x)); padding-inline:var(--page-x); scroll-snap-type:x mandatory; padding-block:12px 18px }`；`.today-card__figure { flex:0 0 auto; width:68px; height:68px; border-radius:50%; display:grid; place-content:center; white-space:normal; font-size:14px; background:radial-gradient(circle, var(--surface-sunken) 0 5px, var(--surface) 5.5px 100%); border:1px solid var(--border-strong); scroll-snap-align:start }` + `:first-child { width:96px; height:96px }`；`.today-card__tag` 与「计划 N」`position:absolute; top:-2px; right:-6px` 外挂贴纸；常驻底带：`[data-skin='disc-rail'] .app:has(.start) { }` 内 `.app__main { order:2 } .readouts { order:3; display:grid; grid-template-columns:1fr auto 1fr; border-block-start:1px solid var(--border-strong); padding-block:8px }`（**用 order 不用 fixed**，音乐笔记 §1.1 已论证 fixed 在 `--app-max` 下脱列）。
- **360 / 768 / 1440**：360 轮宽 96+68×3+14×3=306，第三盘半切正好当「可滑」affordance（SoundCloud 露两张半的纪律）；药丸回退通栏；768 盘放大到 84/112、轮不再出血（全部露出）、`--page-x` 32 时第四盘仍露头一角即停；1440 底带按 Spotify Now Playing 三列格栅：左=品牌+日期、中=三读数居中、右=空（或设置角标），轮限宽 900 居中。
- **风险**：圆内 4 字中文 14px≈56px 贴 68px 盘边——必须 `white-space:normal; line-height:1.1` 实测；横滑容器若被父级 `overflow` 裁剪会断手感（`.app__main` 已 `overflow-x:hidden`，容器自身滚动不违反页面零溢出，但要实测 sticky 顶栏与轮的层叠）；底带吃掉 ~50px 屏高，矮安卓（≤640px）`@media (max-height:640px)` 时底带降为单行；`.app` 级 order 改动会波及所有页——`.app:has(.start)` 限定作用域，或接受全局常驻条并逐页验（复习页自带 dock，注意双条打架）；盘内 `8/14` 类值 22px 需 `letter-spacing:-.02em` 防撑圆。
- **借鉴**：Apple Music Stations 78pt 圆盘 + 内圈孔：<https://github.com/yzfly/awesome-design-html/blob/main/assets/ios/design.apple-music-ios.html>；SoundCloud「第 3 张切在屏边」诱导横滑：<https://ixd.prattsi.org/2019/09/design-critique-soundcloud-ios-app/>；YTM 区块头内联 Play all + 2024 删第二行描述：<https://9to5google.com/2024-08-12/youtube-music-home-feed-tweaks/>；Spotify mini-player 常驻条与 `.app` flex order 偷法：<https://dev.to/dev48v/spotifys-now-playing-bar-is-just-one-css-grid-a-ticking-width-5494>、<https://raw.githubusercontent.com/Khalidabdi1/design-ai/refs/heads/main/design-md/spotify/DESIGN.md>；问候大标题占 `.start__title` 空位出自音乐笔记方向 A（S1）。
- **与 7 套的差异**：首页主内容第一次是**横向**的（轮），其余 7 套全部纵向文档流；CTA 从页底控件变成货架头内联动作；`.readouts` 第一次被用作常驻 chrome 而非首页装饰排——这三件事同时发生才是骨架，单独发生任意一件都算换皮。

---

## 5. 候选④ 「平面图」 `floor-plan`

- **一句话结构**：首页不是一页文档，是一张**场地平面图**：`.start` 变成带同心轨道纹理的 2D 平面，主 CTA 是钉在平面下半部的一块「可站上去的地板」（inset 满宽、高 ≥88px、非圆角、压印边），四个角各钉一枚入口/读数（逾期盘、连续盘、错词本、学习日历），日期与阶段当图廓头；首屏元素 ≤8 个，中心留给空白与轨道线——学 Hades「冥王之家＝菜单」与 Outer Wilds 飞船双屏。
- **保留 / 砍掉 / 去哪**：
  - 留：`__label`+masthead-meta 当图廓抬头（日期）；kicker 当图例小字（`DAILY LIST`，拉丁，12px 合法）；figure 3（逾期）与 figure 4（连续）两枚角钉 + figure 1（新词）压印在 CTA 板面上当「站位牌」（Celeste 统计印在主体上）；reason `:last-of-type`（T9）落在地板正下方 14px 小字；spec 只开第 3 行（批数角标）；links 两枚即角钉本体（错词本、日历入口 = 平面图上的两个「物件」，功能入口未丢）；foot 当图幅下边一行。
  - 砍：eyebrow、meta、readouts、masthead 其余件、fig1 独立形态、T8 句、spec 1/2/4 行——按 Hades 三层预算全部属于「一键之外」，去处：日历 hero `cal-figures` 与我的页 stat（均已有等价展示，00-inventory §2）。
- **主 CTA**：地板件——`.start__actions { position:absolute; inset:auto var(--page-x) 16% var(--page-x) }`，`.btn--primary { min-height:88px; width:100%; border-radius:2px; box-shadow: inset 0 2px 0 var(--surface-raised), 0 0 0 1px var(--border-strong) }`（压印边，不是 play 的 `0 6px 0` 厚底边）；按压态 = 板整体 `translateY(4px)` + 内阴影加深（「站上去的板」的下沉，与 play 的键帽回弹分种）；非 sticky（它本来就钉在视口下半，等效常驻）；reduced-motion 下位移关、位置不变。
- **具体 CSS 手段**：`[data-skin='floor-plan'] .start { position:relative; min-height:100%; display:block }`；轨道背景 `.start::before { content:""; position:absolute; inset:8% 12% 34% 12%; background:repeating-radial-gradient(circle at 50% 40%, var(--border) 0 1px, transparent 1px 30px); mask-image:radial-gradient(circle at 50% 40%, #000 0 60%, transparent 78%); pointer-events:none }`（被 mask 收在框内 → 360 零溢出）；`.start__body { display:contents }` + `.today-card { display:contents }`（**接受** aria-label 损失，由 `.today-card__label` 真实文字牌补可见标题——音乐笔记 §2 的替代条款）；角钉 `.today-card__figure:nth-child(3) { position:absolute; top:9%; left:6%; width:max-content; min-height:44px }`、`:nth-child(4) { top:9%; right:6% }`、`.today-card__links > .btn:nth-child(1) { position:absolute; bottom:26%; left:6% }`、`:nth-child(2) { bottom:26%; right:6% }`——全部含显式 `position:relative` 祖先核对；`:has(b.is-warn)` 时逾期角钉满对比 + `::before` 一条线绳连向地板（侦探板连线），缺省态等权呈现；spec 第 3 行绝对右上。
- **360 / 768 / 1440**：360×640 是死穴档——四钉会压字：`@media (max-height:700px), (max-width:389px)` 退化为「两钉（逾期、日历）+ 地板 + 单行图廓」，其余进文档流末尾；768 四钉全开、轨道半径放大、地板宽 74% 居中；1440 场地限宽 980px 居中，图幅外以 `--bg` 留白装裱，角落补 Awwwards 式「角落小字」日期/版本号（真实 DOM：masthead-meta、foot 的 span）。
- **风险**：本案是五案里**唯一动 `.app` 级视觉语义**的，`display:contents`+`position:absolute` 的参照系必须逐元素实测（游戏笔记 §9 已列坑）；地板与 iOS 安全区/未来 dock 叠加；角钉文本长（「错词本 12」）时 `width:max-content` 与 44 命中区平衡；2D 版面天然牺牲扫读效率——入口全为短标签可接受，任何成句中文只允许出现在地板下方一行；`:has()` 兜底（绳线只是装饰，无 `:has` 时场地仍读得通）；深色档轨道线 `--border` 需单独调亮一档，否则场地「熄屏」。
- **借鉴**：Hades 冥王之家「meta 层空间化，每个功能是可走到的物件」+ 三层信息预算：<https://teemo.dev/game-design/hades/systems/ux-ui-and-accessibility/>；主菜单「左列+底横条」异构导航：<http://blackscreengaming.com/hades/menus/>；Outer Wilds 飞船双屏/侦探板连线：<https://www.mobiusdigitalgames.com/news/archives/12-2017>、<https://www.eurogamer.net/outer-wilds-absolutely-nails-this-one-thing-about-exploration>；Monument Valley「一屏一幅画、上下对角两个动作点」：<https://www.polygon.com/2014/3/18/5522874/monument-valley-everyone-finish/>；Lusion 固定舞台四角钉 chrome：<https://www.commarts.com/project/36283/lusion>；Vercel 移动端悬浮底操作条：<https://vercel.com/changelog/dashboard-navigation-redesign-rollout>。
- **与 7 套的差异**：7 套首页全是**竖直文档**（顺序与尺寸表达层级）；本案层级由**位置**表达（角/心/边/底），是把版面从 1 栏变 2 维——research 里游戏族方向 C 与网页族方向 C 在此汇流，比任何一族的单独版本都更彻底（Lusion 舞台仍是一列，本案是真正的钉位平面）。

---

## 6. 候选⑤ 「名册」 `roster`

- **一句话结构**：页面即目录——拆掉一切卡片与磁贴，首屏第一行是**去壳的超大文字链 CTA**（`clamp(30px,9vw,56px)` 的「开始背单词」左对齐成钮，整行可点，尾随 `→`），它下面是一路编号到底的 hairline 台账：数据行、入口行、承诺行同构同列（左缘 01/02… mono 编号，中间标签，右缘 tabular 数字），行间只有 1px 线；页尾一行小字角落链收束。
- **保留 / 砍掉 / 去哪**：
  - 留：4 个 figure → 台账 4 行（新词/到期/逾期/连续，`<b>` 右缘大字，tag「↑+5」「计划 N」作行内右上小注）；spec 第 3 行 → 「批次构成」一行（S4）；links 两链 → 名册尾部两条编号行「→ 错词本 N / → 学习日历」（T2/T3 入口在名册里，位置从卡头降到行列——入口未丢，语义从"卡片附属"升为"目录条目"）；reason `:last-of-type`（T9）→ 名册末尾一条 `border-top:2px` 的批注行；foot 三件原样收底；masthead 打开当「书口线」：brand + hairline + 日期一行（S1/S6 的目录封面行）；kicker 当名册题头 mono 行。
  - 砍：eyebrow（阶段已由 topbar 与我的页承载）、meta、readouts（三数与名册行全重复）、T8 句、spec 其余行——去处同 inventory §2 表。
- **主 CTA**：**第 00 行**——`.start__actions { order:-1 }` 提到名册最前；`.btn--primary { background:none; border:0; border-radius:0; color:var(--text); width:100%; text-align:left; min-height:44px; padding-block:18px; font:600 clamp(30px,9vw,56px)/1.05 'Space Grotesk', sans-serif; letter-spacing:-.02em }` + `::after { content:" →" }`；hover/active 只换下划线与 accent 字色（文字链 CTA 需 `text-decoration:underline` 或色对比自证，不靠纯色彩编码）；非满宽墨块、非 sticky——索引原型纲领：CTA 是名册的标题行，不是控件。**这是与 play 厚按钮的物种级对立**（网页族笔记 §8B 原话方向）。
- **具体 CSS 手段**：`[data-skin='roster'] .start { display:flex; flex-direction:column; counter-reset:row }`；`.start__body { display:contents }`、`.today-card { display:contents }`（同样以 `__label` 可见标题补偿）；行统一语法：`.today-card__figure, .start__spec-row, .today-card__links > .btn, .today-card__label { display:grid; grid-template-columns:3em minmax(0,1fr) auto; align-items:baseline; min-height:44px; padding-block:14px; border-bottom:1px solid var(--hairline, var(--border)) }`；编号 `.today-card__figure::before, .start__spec-row::before { counter-increment:row; content:counter(row, decimal-leading-zero); font:12px 'IBM Plex Mono'; color:var(--text-tertiary) }`（纯拉丁数字，12px 合法档）；数字列 `font-variant-numeric:tabular-nums; font-size:clamp(18px,4.5vw,26px)`；`__links` 用 `display:contents` 拆壳让两按钮各自成行（注意 links 内按钮 1–2 个不定，行语法对 1 个同样成立）；导轨（1440 专属）：`@media (min-width:1440px) { .app__main::before { content:""; position:fixed; inset:0; background:linear-gradient(90deg, transparent calc(50% - 361px), var(--border) calc(50% - 361px) calc(50% - 360px), transparent calc(50% - 360px) calc(50% + 360px), var(--border) calc(50% + 360px) calc(50% + 361px), transparent calc(50% + 361px)) ; pointer-events:none } }`——两根与 720px 内容列对齐的 Stripe 竖轨；**不用伪元素中文大字做页尾**（违反「不复读现有文本」），终幕由超大 CTA 行本身承担，`__label`「今日 · 11月24日」充当名册第一行的日期题头。
- **360 / 768 / 1440**：360 行三列 `3em+1fr+auto` 在 320px 内：编号 2.5em≈30px、标签 2 字 28px、数字列 8–12 字符 tabular 收敛——标签用 14px、数字 `b` 上限 22px，实测不溢出即过；CTA 超大行 30px 两字宽≈60px×2，安全；768 名册限宽 640（`--content-max`）左对齐不居中（贴边排版是索引派签名），`--page-x` 32；1440 名册 720 列偏左 12vw（不对称留白），双导轨现形，编号列与数字列之间补中列「类别」小字（复用行内文本节点，不新增）。
- **风险**：零卡片 + 零色块意味着**对比度与线色是唯一的层级工具**——`--border` 对底需 ≥3:1 才是有效行界（阅读笔记 §9 检查点）；「逾期」在名册里只有行尾红字，警示弱于磁贴——用 `:has()` 给 warn 行整行 `border-left:2px solid var(--danger)` 补救且浅深两档各写；超大文字链 CTA 的点击区是整行（≥44 天然满足），但用户可能不知道整行可点——尾随 `→` + 下划线是索引派标准暗示，需可用性实测；`.today-card` 拆 contents 丢 `aria-label`（补偿条款同前）；12px 编号是装饰档，若被审查判为正文需升 14px mono。
- **借鉴**：Gross Collective 所属「页面即目录」索引原型（编号左缘栏+hairline+纯文字 CTA）：<https://huggingface.co/spaces/build-small-hackathon/jawbreaker/commit/502016b8521a2d1c8caa391a48096d3e3386fb94.diff>、<https://vibld.com/templates/neon-harbor>、<https://www.framer.com/marketplace/templates/most/?via=framplates>；Instapaper「队列即首页、行即 CTA、首页唯一数字是未读数」：<https://instapaper.com/docs/organize/overview>；Awwwards 量化律（强站最大字 8.4vw、两级字阶吝啬、55% 首屏无按钮、贴边排版 45/114）：<https://github.com/leonxlnx/taste-skill/blob/12af471f627f866411b4bd785b19646d3672784c/skills/taste-skill/references/research.md>；Stripe 竖导轨：<https://memocore.ai/memos/6ab62898af51aac421da88ae>。
- **与 7 套的差异**：broadsheet 也是线分隔，但它是**多栏报纸面**（有标题块、刊号装饰、分栏）；foundry 是铭牌阵列（每块有底有框）；本案是**一维无底名单**——没有块、没有面、没有栏，只有行与列对齐，且 CTA 是名册的「第 00 行」。网页族「施工蓝图」与阅读族「今日队列」在两族笔记里本是两个方向，收敛后发现同型，合并为本案并补上 Awwwards 超大字级（第 00 行）以吃到「字阶两极分化」那条量化律。

---

## 7. 反换色清单：「结构不同」的 5 条可操作判据

> 给主设计者拍板用：任一候选若在某条上退化，就退回成第 8 套「换色皮肤」。

1. **焦点替换测试（一屏一事）**：删掉 title/lede 后，首屏视觉重心（≥35% 面积）必须由**新物种**顶上——一根线 / 一面脊架 / 一条横轮 / 一块地板 / 一行超大字，且与现有 7 套的重心类型（broadsheet 报头、foundry 铭牌墙、bento 磁贴阵、play 厚按钮、nocturne 排印段）比对不同型。判据动作：把新旧两版截图高斯模糊，看「黑块剪影」是否同形。同形 = 换色。（依据：Awwwards 20/114 强站一屏一事；须藤正喜「层级靠对比不靠字号」。）
2. **动线改型测试**：首页扫读动线必须换类型——F 型文档流 / 沿线挂读 / 单点凝视 / 横向轨 / 空间环视 / 一维名册，六选一且不同于所仿 skin 的原动线。如果拆完 DOM 包装后用户仍按「标题带→数据带→按钮→卡→页脚」纵读，只算排版微调。判据动作：画三档视口下的视线折线，折线**形状**（非长度）与 7 套逐一比对。
3. **数据载体测试**：每个首页数字的**容器几何**必须重新指定——圆盘/竖脊/行/角标/巨字/板面，六选一；且重复数据（今日新词 ×4、已学 ×3、阶段 ×3）砍到只剩 ≤2 处。若某数从「格子里的小字」变成「格子里的大字」，那是字号差不是结构差；从「格子」变成「脊/盘/行」才是骨架差。（依据：Celeste 统计印在主体上；阅读定律 2「进度物化在对象上」；00-inventory §1.1 注 的三重重复。）
4. **CTA 物种测试**：主 CTA 必须在五个物种里换一个新的——inline 药丸 / 满幅通栏墨带 / 抽屉拉手 / 去壳文字行 / 地板件——并且**位置变化要连带改变周边布局逻辑**（YTM 的 Play 长在货架头，是因为首屏主角就是那条货架；把药丸挪回页底则本案货架逻辑塌掉）。只改形状、圆角、厚度而不改「它为什么在那」，= 又一层皮。（网页族定律 6 原话：「形态变化必须连带版面逻辑一起变，单换形状=又一层皮」。）
5. **删失≠隐藏测试（镜头裁切 + 钩子台账）**：(a) 被砍的元素必须是「这一屏没拍到」（`display:none` / 移出一屏）而不是「缩小堆到下面」；每案必须列出砍掉项的**承接页与承接选择器**（日历 `cal-figures` / 我的 `stat` 等，对照 00-inventory §2 表），并说明首页独享三件（S4/T9/承诺句）的新宿主——答不出宿主即作废。(b) 每案必须声明 5 个 skin-hook 的开/关组合与 `.start__body` 拆/留：**完全不动钩子、不拆包装层的方案不可能长出不同骨架**；只动钩子而 figure/spec/readouts 的形态全不变的方案是换色。(依据：Hades 三层预算；Celeste 镜头裁切；SKIN_BRIEF §2「这是让皮肤长得不一样最主要的杠杆」。)

**附：两族已给出的方向在本稿中的去向**（防止评审时误判重复）——游戏 A→候选①、游戏 B+网页 A+音乐 C→收敛为「巨数海报」并入候选① 的焦点件与候选③ 的底带语言（单独立案会与④⑤争焦点，故拆食）；游戏 C+网页 C→候选④；音乐 A→候选③；音乐 B（全局侧栏）因要动 `.app` 波及全部页面且与 instrument 的仪表分栏语义撞型，**未立案**；阅读 A（续读封底）并入候选④ 的地板件（按钮即卡）；阅读 B→候选②；阅读 C+网页 B→候选⑤。

---

## 8. 实测移交清单（写 CSS 前需要主设计者拍板/实测的点）

1. 候选④ 的 `.today-card{display:contents}` 与角钉参照系（360×640 真机 `scrollWidth`）。
2. 候选③ 的 `.app:has(.start)` 作用域是否成立（不行则底带改 `.start` 内 sticky，常驻性降级但零外溢）。
3. 候选⑤ 的 `--border` 线色在两档下 ≥3:1 取值，及 12px 编号是否被判正文。
4. 全部候选：`prefers-reduced-motion` 关闭位移动效；hover 全包 `@media (hover:hover)`；语义色浅深两档 ×「四肤八档」审查脚本。
5. 伪元素文案自查：本稿所有 `content` 仅拉丁/数字/符号（`→` `›` `01`），无成句中文，无与 `.brand__name`/`.start__title` 复读——终审时再 grep 一遍 `content:` 全量核对。

*本文件为 synth-immersive 任务唯一写入；未改动任何 src/ 代码与其它文档。*
