# 跨领域调研 03 · 音乐/音频：首页骨架怎么排

> 领域：音乐/音频流媒体（Spotify、Apple Music、网易云音乐、YouTube Music、SoundCloud、Apple Podcasts）
> 只谈**版面骨架**：焦点在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。
> 配色/情绪/字体气质一律不在此文范围（那是既有 7 套皮肤已经吵完的事）。
> 落地约束：只能在词笺既有 DOM 上写 CSS，不改 DOM、不加图片/图标、不联网字体、不写 JS。

---

## 0. 一句话结论：这个领域给词笺的最重要提醒

**六款产品没有一款把「统计数字」放在首页焦点上。** 它们首页的焦点永远是**「一条要继续听的东西」**——数字（播放次数、收听时长）全被赶到独立表面（Wrapped / Listening history / 资料库）。
音乐 App 的首页公式是：`一句问候（会随时间变的数据行）` + `一条续听货架` + `一个把「播放」内联在货架头的动作` + `一条常驻播放器条`。
词笺现在首页上摆的是：`一段营销文案（title/lede）` + `一张 4 行工单表` + `一排读数` + `页底满宽按钮`。四件东西里三件在音乐领域根本不存在于首页。

领域内反复出现的 6 个结构件（下文每条都会回指）：

| 结构件 | 是什么 | 词笺能借的形式 |
|---|---|---|
| S1 问候位 | 页顶最大字号是一行**会变的数据**（Good morning / Good evening + 名字），不是 slogan | `.topbar__meta`（阶段 · 今日 N 词）提升成主标 |
| S2 货架 rail | 一维横向滚动排，第三张切在屏边 | `.today-card__figures` 变横轮 |
| S3 货架头 | 区块标题 + 右侧一个批量动作（See All / Play all / ›） | `.today-card__head` + `.start__actions` 合并成一行 |
| S4 常驻播放器条 | 贴在 chrome 层的细条，状态在任何页面都可见 | `.readouts`（本就是 `.app` 级、在滚动区之外） |
| S5 圆盘 | 电台/推荐位用正圆容器（78pt disc + 内圈孔） | 圆形容器包数字，本应用首次出现 `border-radius:50%` 的内容容器 |
| S6 双 band 拆分 | 上新 / 续听 分成两块，各答一个问题 | 「欠的」（逾期+到期）/「今日」（新词+连续）两组 |

---

## 1. 逐产品 pattern

### 1.1 Spotify

**structure**
- 首页从上到下：① 时段问候行（Good morning/afternoon/evening，内容随时段变）② **顶部快捷区：最多 6 张 shortcut 卡，2 列 × 3 行的矩形网格**，每卡 = 小缩略图 + 一行名称 ③ 之后是一叠横向货架（Made for you / 最近播放 / 推荐），每排是「区块标题 + 右侧 See all」+ 横滚卡片 ④ 底部 3–5 格 tab bar ⑤ 常驻 mini player 贴在 tab bar 之上。
- 桌面版把导航做成**左侧常驻竖栏**，播放控制做成右下常驻区；移动端折叠成底部条。官方设计拆解明确写：「rails、shelves、stacked media modules 是主要构图手段」，「优先滚动内容货架，而不是拥挤的 masonry 或混排卡片」。
- 密度：中高。分层靠**深色面台阶**（#121212 → #181818 → #282828）而不是描边。卡片圆角小（4–8px），区块标题 24px/700，元信息一律压成 12–13px 灰字。
- 响应式铁律：**货架挤不下时横向滚动，不压扁卡片**。

**surfaced**：内容本体（你播过的、给你的）。播放动作不单独占版面，点卡片即播。
**hidden**：听歌统计（Wrapped/History 独立表面）、搜索与筛选类内容（一篇内容策略审计的核心批评就是「首页该用来听，推荐该搬去 Browse」）、设置。首页**没有任何数字**。

**css_only（可偷的纯 CSS 手段）**
- **S4 常驻条**：`.app` 本身就是 `display:flex; flex-direction:column; height:100dvh; overflow:hidden`，`.readouts` 是它的直接子元素且在 `.app__main` 之外 → 不需要 `position:fixed` 就能做常驻底部条：
  ```css
  [data-skin='x'] .app__main{ order:2 }
  [data-skin='x'] .readouts{ order:3; display:grid; grid-template-columns:1fr auto 1fr;
    align-items:center; border-block-start:1px solid var(--border-strong); }
  ```
  比 `position:fixed` 稳：fixed 会跑满视口宽（`.app` 有 `max-width:var(--app-max)`，桌面会脱列）。⚠️ `.readouts` 带 `aria-hidden="true"`，只能当「常驻刻度」，真数据必须仍留在 `.today-card` 里可读。
- **S2 顶部 6 卡 2×3 网格**：`.today-card__figures{ display:contents }` 把 4 个 `.today-card__figure` 直接变成 `.today-card` 的网格子项：
  ```css
  [data-skin='x'] .today-card{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px }
  [data-skin='x'] .today-card__figures{ display:contents }
  [data-skin='x'] .today-card__head,
  [data-skin='x'] .today-card__reason{ grid-column:1 / -1 }
  ```
  360px：`--page-x:20px` 时单卡 ≈152px，放 `44px 数字 + 14px 中文标签` 够。⚠️ 基线是 `.today-card__figure{ white-space:nowrap; font-size:var(--fs-small) }`（多数皮肤 `--fs-small:13px`，**中文不达 14px 下限**），必须显式 `white-space:normal; font-size:14px`。
- **S2 切第三张的横轮**（出血到屏幕边，靠 `.app__main{ overflow-x:hidden }` 兜住）：
  ```css
  [data-skin='x'] .today-card__figures{ display:flex; gap:8px; overflow-x:auto; scrollbar-width:none;
    margin-inline:calc(-1 * var(--page-x)); padding-inline:var(--page-x);
    scroll-snap-type:x mandatory; scroll-padding-left:var(--page-x) }
  [data-skin='x'] .today-card__figure{ flex:0 0 55%; scroll-snap-align:start }
  ```
  360 下第二张露头、第三张被切一半——用切割本身当「还有更多」的提示，不写箭头。
- **S3 货架头**：`.today-card__head` 天生就是「左标签 + 右两个文字链」，直接当区块头用；给 `.btn--compact`（基线 `min-height:44px`，已达标）加 `::after{ content:' ›' }` 冒充 YTM 的右箭头。

---

### 1.2 Apple Music（iOS）

**structure**
- Listen Now 一屏顺序（第三方结构拆解给到具体尺寸）：**iOS 大标题 32pt/800 的时段问候 → Stations 横向轮（78pt 正圆盘，内圈 14pt 黑孔像唱片）→ Recently Played 2×3 网格 → 一张满宽渐变 hero 卡（图上叠三层字：New Release / 标题 / Curated by）→ 更多区块**。每个区块标题行右侧固定一个 "See All"。
- chrome：**mini-player 54pt 常驻**在 83pt 底部 tab bar 上方（40pt 封面 + 材质模糊）；页面侧 padding 18pt（Now Playing 26pt）；区块标题 18pt/800、-0.5px 字距；元信息 11pt。
- 骨架继承 iOS（大标题、分组列表），整个 app 里**唯一被"设计"过的面是 Now Playing 的封面渐变**。
- 行命名本身就是货架 IA：Top Picks / Recently Played / Made for You / Stations for You（tvOS 同款顺序）。

**surfaced**：「你昨晚听到的」+ 一张编辑精选。
**hidden**：资料库管理（独立 tab）、歌词/空间音频（下沉到 Now Playing 层）、任何统计。首页零数字。

**css_only**
- **S5 圆盘**（零图片、零 DOM 造唱片机）：
  ```css
  [data-skin='x'] .today-card__figure{ position:relative; flex:0 0 78px; height:78px;
    border-radius:50%; display:grid; place-content:center; text-align:center;
    background:radial-gradient(circle at 50% 50%, var(--surface-sunken) 0 6px, var(--surface) 6.5px 100%) }
  [data-skin='x'] .today-card__figure b{ display:block; font-size:24px; font-variant-numeric:tabular-nums }
  ```
  内圈硬停 = 唱片孔；`b` 24px 属大字（≥3:1 即可，不必 4.5:1）。⚠️ 中文标签在 78px 圆里最多 4 字一行（`到期复习` 4×14=56px < 78px，可行），但 `计划 8`、`.today-card__tag` 这类第二行会溢出圆 → 把它们 `position:absolute` 挂到圆盘右上角当贴纸：`.today-card__tag{ position:absolute; top:-2px; right:-4px }`，并给整条 `.today-card__figures{ padding-top:10px }` 留位。
- **满宽渐变 hero**：`.today-card{ border:0; border-radius:14px; background:linear-gradient(160deg,…), conic-gradient(…) }`，再用 `order` 把 `.today-card__head` 压到卡底（`display:grid; grid-template-rows:1fr auto auto`）→ 三层叠字观感；文字与底的对比按大字 3:1 现场核。
- **S1 问候大标题**（本领域最值钱的一招，词笺可白偷）：`.topbar` 是 `position:sticky`（即 positioned 元素），因此可以当绝对定位锚，把 `.topbar__meta` 从小 chrome 拽出来放大成页面主标，正好填 `.start__title` 被删后的空位：
  ```css
  [data-skin='x'] .topbar__meta{ position:absolute; top:calc(100% - 6px); left:var(--page-x);
    font-size:clamp(28px,7.4vw,34px); font-weight:800; letter-spacing:-.02em; color:var(--text) }
  [data-skin='x'] .topbar__sep{ display:none }
  [data-skin='x'] .start{ padding-top:76px }   /* 给常驻大字腾位 */
  ```
  代价：`z-index:20` 让这行大字**常驻不滚走**（与 iOS 大标题「滚动后收进顶栏」相反）。可接受，甚至更像播放器；但必须验 360 不溢出：`今日 12 词` 加阶段名最长约 12 字，`clamp` 到 28px 时约 190px，安全。
- **44×44**：`.icon-btn` / `.avatar-btn` 基线已达标，圆盘 78px 也达标；只有把圆盘缩到 <44px 时要在外层 `.today-card__figure` 上补 `min-width:44px; min-height:44px` 的点击区（伪元素造视觉、容器保点击区）。

---

### 1.3 网易云音乐

**structure**
- 2024 年改版主打**「双首页」**：`推荐` tab = 个性化首页，官方描述是「以卡片式设计**错落有致**地将歌单、歌曲类内容排布」；`发现` tab = 编辑精选（歌单/排行榜/播客），定位是「翻阅音乐杂志」。
- 首页内容是**卡片阵**（歌单卡、歌曲卡、日推卡），尺寸不齐、混排；`歌单`页是图片瀑布流。
- 一篇界面分析指出它的层级手法：三个核心入口（私人 FM、每日歌曲推荐、新歌榜）不靠放大色块，而是**换成极简线框 icon 的形式**，在一堆以图片为主的卡里靠「形式反差」跳出来。
- 一个第三方实现对网易云首页接口的归纳很能说明结构纪律：首页栏目只认「歌曲 / 歌单 / 专辑」三种条目，**一栏里一条能显示的都没有就整栏不要**，并且会主动删掉排行榜和自己已有过的栏目（去重）。
- 底部一级导航：`推荐 / 发现 / 我的(+播客/云村)`；社区、播客、直播全部拆成独立一级入口，不挤首页。

**surfaced**：今天该听什么（日推、心情/氛围歌单、风格日推、附近热门、个人歌单）。
**hidden**：统计、云村社区、播客、直播（各自一级 tab）。首页无数字位。

**css_only**
- **错落 mosaic（网易云的签名）**——只做纵向错位，绝不横向：
  ```css
  [data-skin='x'] .today-card__figures{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px }
  [data-skin='x'] .today-card__figure:nth-child(even){ transform:translateY(14px) }
  [data-skin='x'] .today-card__figure:nth-child(3){ grid-row:span 2 }
  ```
  `translateY` 不产生横向溢出；多出的 14px 用 `.today-card{ padding-bottom:calc(var(--space-4) + 14px) }` 吃掉。**不要用 `translateX`**——`.app__main` 虽然 `overflow-x:hidden`，但横向位移会让 sticky/圆角边缘出现被切一半的观感 bug。
- **「三个特殊入口 ≠ 图片卡」的形式反差**（不是颜色）：让 `.start__spec-row` 走**描边空心**、`.today-card__figure` 走**实心面**：
  ```css
  [data-skin='x'] .start__spec-row{ background:transparent; border:1px solid var(--border-strong); border-radius:10px }
  [data-skin='x'] .today-card__figure{ background:var(--surface); border:0 }
  ```
  同一页里两套形态，靠 form language 分层级。这与 bento「全部磁贴同一形态、只改大小」是不同手法。
- **双首页的纯 CSS 近似**（无 JS 不可能真切换 tab，退而求其次做「两段带 + sticky 分栏条」）：
  `.start__body{ display:contents }` → `.start{ display:grid; grid-template-rows:auto auto }`，第一带 = 数据 + CTA，第二带 = 清单；`.today-card__head{ position:sticky; top:0; z-index:5; background:var(--bg) }`。
  注意 `.topbar` 是 `.app` 的直接子元素、**在滚动容器之外**，所以滚动区里的 `top:0` 不会被顶栏遮（若某皮肤把顶栏塞进流里才需要写 `top:56px`）。
- 360 下错落 mosaic 的纪律：两列时数字 `b` 上限 ≈34px，`26 词` 这种带单位的值要 `display:block` 换行，别让它在 152px 宽的格里撑破 `minmax(0,1fr)`。

---

### 1.4 YouTube Music

**structure**
- Home 是**上下文驱动的排（carousels）叠排**：`Quick picks` 在最上（**一次显示 4 个**，横排，区块头右侧保留 "Play all" 动作），往下是 `Listen again`（2022 年从轮改成**更密的网格**，只留歌名不要艺人）、`Mixed for you` / `Albums for you` / `New releases`。
- 2024 年的微调全是**减密度、加扫读速度**：区块标题缩小、"More" 药丸换成一个右箭头（少一处翻译与视觉噪音）、**删掉第二行描述文案**（例："Start radio from a song" 被砍成只剩 "Create a radio"）。
- 关键结构件是 **S3 区块头 = 标题 + 动作**：「全部播放」不是页面底部的大按钮，而是贴在排标题旁边的小控件。
- 底部 tab + mini player；播放队列（Up Next）是常驻可唤出的层。

**surfaced**：内容 + 每排一个批量动作。
**hidden**：解释性文案（第二行描述被系统性删掉）、订阅/下载管理。

**css_only**
- **CTA 从「页底满宽块」→「区块头内联药丸」**（YTM 的核心手法，也是最省事的结构级差异）：
  ```css
  [data-skin='x'] .start__body{ display:contents }
  [data-skin='x'] .start{ display:grid; grid-template-columns:minmax(0,1fr) auto;
    column-gap:12px; row-gap:12px; align-items:center }
  [data-skin='x'] .start__eyebrow{ grid-column:1; grid-row:1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis }
  [data-skin='x'] .start__actions{ grid-column:2; grid-row:1; margin:0 }
  [data-skin='x'] .start__actions .btn--block{ width:auto; min-width:132px; min-height:44px;
    border-radius:999px; padding-inline:18px }
  ```
  ⚠️ 360px 里「开始背单词」6 个中文字（≥14px）与 eyebrow 挤同一行会顶破：写一条窄屏回退 `@media (max-width:399px){ .start{ grid-template-columns:1fr } .start__actions{ grid-column:1 } }`，或让 eyebrow 走 12px 拉丁 + 省略号。
- **4-up 排**：`.today-card__figures{ display:grid; grid-template-columns:repeat(4,minmax(0,1fr)) }` → 360 每格约 70px。`8/14` 这种值要 `font-size:15px; letter-spacing:-.02em` 才塞得下；中文标签必须换行 → `.today-card__figure{ flex-direction:column; align-items:flex-start; line-height:1.15 }`。更稳：360 降两列（`@media (max-width:389px)`），1440 才用四列。
- **「没异常就不啰嗦」的条件文案**（用 `:has()` 顶替 JS 判断）：
  ```css
  [data-skin='x'] .today-card:not(:has(.is-warn)) .today-card__reason{ display:none }
  ```
  即：逾期为 0 时（基线不给 `b.is-warn`）把解释段整段藏掉，页顶只剩数据行——这就是 YTM 删第二行描述的做法。⚠️ CSS 读不到数字本身，只能读**基线已经打在 DOM 上的类名**（`b.is-warn` / `b.is-accent`、`.today-card__tag` 是否存在），所以所有条件样式必须有「缺省也能看」的兜底。
- `.start__body` 基线是 `margin-block:auto`（整块垂直居中）。做密排/仪表盘前**必须先 `margin-block:0`**，否则内容被撑到屏幕中间、上方出现无意义空白。

---

### 1.5 SoundCloud

**structure**
- 首页是**模块（modules）网格**：官方透明度报告把首页内容称作 "modules on the home screen"（编辑把 track 按流派/趋势打包成模块）。一篇 iOS 设计批评把版面写得更具体：首页是「简单极简的卡片网格」，模块如 `New Music Now`、`SoundCloud Charts`、`Top Playlists`，**每个模块只完整显示 2 张，第 3 张被切在界面外**——用切割本身暗示可横向滑动，而不是靠箭头或 "See all"。
- `Feed` 是纯纵向时间流（关注艺人的新歌），与首页的横向模块是两套流。
- 卡片本体以**波形**为主视觉，文字压在波形下面。

**surfaced**：模块化的内容行 + 波形。
**hidden**：上传/收益/歌单管理；账号设置。

**css_only**
- **零图片偷波形**（伪元素 + 渐变，注意波形只作装饰，不得承担信息）：
  ```css
  [data-skin='x'] .today-card__figure::before{ content:''; width:100%; height:22px; border-radius:2px;
    background:repeating-linear-gradient(90deg, var(--accent) 0 2px, transparent 2px 5px); opacity:.35 }
  [data-skin='x'] .today-card__figure:nth-child(2)::before{ height:30px }
  [data-skin='x'] .today-card__figure:nth-child(3)::before{ height:16px }
  [data-skin='x'] .today-card__figure:nth-child(4)::before{ height:26px }
  ```
  等距细条 + 四块四种高度，远看像波形柱；`repeating-linear-gradient` 随宽度自适应，不写死柱数（360 不溢出）。红色绝不进装饰（红只留给逾期）。
- **切第三张**（同 Spotify，但比例更狠）：`.today-card__figure{ flex:0 0 62% }`——SoundCloud 是「露两张半」，比 Spotify 更明确地诱导横滑。
- **纯纵向 Feed**：`.start__body{ display:flex; flex-direction:column; gap:10px; margin-block:0 }` + `.start{ min-height:0 }`（基线 `min-height:calc(100dvh - 56px)` 会把一屏内容顶开，做纯流必须清零）。
- 装饰性 `::before` 要能被 `prefers-reduced-motion` 关掉动效版本（`animation` 类波形滚动）。

---

### 1.6 Apple Podcasts

**structure**
- iOS 27.2 把被骂多年的 `Up Next` **拆成上下两个 band**：`New Episodes`（有什么新的）在上，`Continue Playing`（我刚听到哪）在下——**两个不同的收听习惯各占一块**，而不是混成一个队列。单集行用**从封面取色**的背景。
- 首页形态：**没有横向轮**，是单列纵向清单；每行 = 封面 + 节目名 + 单集名 + 剩余时间。
- iOS 17 起「播放中」整屏化（动态封面背景 + Queue 区块），Queue 里可重排/清除，章节显示长度与剩余时间——**进度与剩余量永远跟在内容旁边，而不是被抽成首页仪表**。
- 底部 tab：立即聆听 / 浏览 / 资料库；收听历史在资料库，不在首页。

**surfaced**：「续听」被抬成一级结构（不是首页角落的一个小卡）。
**hidden**：统计、订阅管理、浏览。

**css_only**
- **S6 两 band 拆分**（词笺天然对应：欠的 vs 今日）：
  ```css
  [data-skin='x'] .today-card__figures{ display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); row-gap:12px }
  [data-skin='x'] .today-card__figure:nth-child(3){ order:-2 }  /* 逾期 */
  [data-skin='x'] .today-card__figure:nth-child(2){ order:-1 }  /* 到期复习 */
  [data-skin='x'] .today-card:has(.is-warn){ /* 欠的这块存在时才有的 band 分隔 */ }
  ```
  两块之间插一条分隔：`.today-card__figures` 的第 2、3 子项之间加 `border-block-start`（CSS 数不出「前两个/后两个」的语义，只能按 nth-child 硬分组，**前提是顺序稳定**——已核对基线：①新词 ②到期复习 ③逾期 ④连续优秀，语义是稳的）。
- **单列清单行 + 右侧剩余量**（顶替「工单表」观感）：
  ```css
  [data-skin='x'] .start__spec{ display:flex; flex-direction:column; counter-reset:spec }
  [data-skin='x'] .start__spec-row{ position:relative; display:grid; grid-template-columns:44px minmax(0,1fr) auto;
    align-items:center; gap:12px; min-height:56px; padding-block:10px; border-block-end:1px solid var(--border) }
  [data-skin='x'] .start__spec-row::before{ counter-increment:spec; content:counter(spec,decimal-leading-zero);
    width:44px; height:44px; display:grid; place-content:center; border-radius:8px;
    background:var(--surface-sunken); font-size:12px }   /* 零 DOM 造「封面缩略图位」 */
  [data-skin='x'] .start__spec-v{ text-align:end; font-variant-numeric:tabular-nums; color:var(--text-secondary) }
  ```
  `::before` 占的是**封面位**（44×44 视觉锚），`.start__spec-k` 是节目名，`.start__spec-v` 是右侧的时长/进度——三层一一对应 Podcasts 的行结构。
- 「取封面色」的 CSS 近似：按 `nth-child` 给行配不同的 `linear-gradient` 弱底（四档深浅，浅深两套各写一遍），不依赖任何数值判断。

---

## 2. 词笺首页 DOM 事实核对（写皮肤前必读）

真实结构（读自 `src/components/StudyScreen.tsx` + `TodayCard.tsx` + `src/styles/app.css` + `skin-hooks.css`）：

```
.app                 flex column / height:100dvh / overflow:hidden / max-width:var(--app-max)
├ header.topbar      sticky top:0 z-index:20 / flex / min-height:56px
│ └ .brand > .brand__name · .brand__dot · .topbar__meta(span · span · span)
│   2× .icon-btn · .avatar-btn
├ .readouts          基线 display:none；★在 .app__main 之外（= 天然 chrome 层）；★带 aria-hidden="true"
│ └ .readout ×3 > .readout__k(今日|批数|已学) + .readout__v(补零数字)
└ main.app__main     flex:1 / overflow-y:auto / overflow-x:hidden  ← sticky 的滚动容器
  └ .screen          padding:0 var(--page-x) var(--space-6)
    └ .start         flex column / min-height:calc(100dvh - 56px) / padding-top:var(--space-5)
      ├ .start__masthead（基线 display:none）> __brand · __rule · __meta(日期)
      ├ .start__kicker（基线 display:none）
      ├ .start__body   ★margin-block:auto（默认整块垂直居中）
      │ ├ .start__eyebrow   阶段名 · N 词
      │ ├ .start__title     ← 本轮要求全部皮肤删掉
      │ ├ .start__lede      ← 本轮要求全部皮肤删掉
      │ ├ .start__meta      今日 N / 已学 M
      │ ├ .start__spec      （基线 display:none）.start__spec-row ×4 > __k + __v
      │ ├ .start__actions   > .btn.btn--primary.btn--block「开始背单词」
      │ └ section.today-card[aria-label="今日学习摘要"]
      │   ├ .today-card__head > .today-card__label + .today-card__links(button ×1–2 ★条数不固定)
      │   ├ .today-card__figures > span.today-card__figure ×4   ★是 4 个，不是任务书说的 3 个
      │   │     每个 figure = <b class="is-accent|is-warn"> + 中文文本节点 (+ .today-card__tag) (+ 可选 <span>计划 N</span>)
      │   └ p.today-card__reason.is-{tone} ×1–2
      └ .start__foot > span · .start__rule · .btn--text
```

**任务书与代码的三处偏差**（会影响布局数学，按代码为准）：
1. `.today-card__figures` 里是 **4** 个 figure（新词 / 到期复习 / 逾期 / 连续优秀），不是 3 个 → 2×2 或 4 列一排都排得满，3 列会剩 1 个孤块。
2. `.start__body` 这一层**存在**且 `margin-block:auto` → `display:contents` 拆掉它是把 8 个区块平铺进 `.start` 网格的开关；不拆的话 `.start` 里只有 4 个可排单元（masthead / kicker / body / foot）。
3. `.today-card__links` 的按钮是 **1 或 2 个**（错词本 >0 才存在）→ 任何 `nth-child(2)`、`justify-content:space-between` 的假设都要能容忍只剩一个。

**四个跨页硬事实**（决定「数据推到二级页」到底能不能做）：
- CSS **不能跨 screen 移动 DOM**：词笺是 `screen` 状态机（`study|calendar|me|mistakes` + session），首页与二级页不同时存在。所谓「推到二级页」= **首页 `display:none` 隐藏 + 二级页把它自己已有的同构元素放大成承接位**，不是搬过去。
- 现成承接位（已在代码里核对）：
  | 首页被挪走的东西 | 承接页面 | 承接选择器 |
  |---|---|---|
  | `.start__spec` 工单表（阶段/今日新词/今日批次/已学） | 日历页 | `.cal-figures > .cal-figure`、`.cal-load__k/__v/__u`、`.cal-kicker` |
  | `.today-card__reason` 解释段 | 日历页 / 我的页 | `.cal-hero__reason`、`.cal-note`、`.section__hint` |
  | `.start__meta`（已学 N）、`.readouts` 的「已学/批数」 | 我的页 | `.stat > .stat__num + .stat__unit`、`.setting-row__label/__value`、`.progress-track__bar` |
  | 「到期复习」的过程信息 | 复习会话页 | `.study-bar__title/__sub`、`.study-progress__bar`（本就是播放器进度条形态） |
  | 「逾期 / 错词」 | 即时复习页 | `.mistakes__list`、`.mistake-row__badge/__date/__hint`、`.answer-dock` |
- `.readouts` 带 `aria-hidden="true"`：把它做成常驻播放器条时，读屏器读不到里面的数——**主数据必须在 `.today-card` 里仍有一份可访问的文本**。
- `display:contents` 的语义代价：拆 `.today-card` 会让 `aria-label="今日学习摘要"` 这个 section 语义消失（`.today-card__figures` 是无障碍语义的空 div，拆它安全）。**优先只拆 `__figures` 和 `.start__body`，尽量保留 `.today-card` 这个 section 盒子**；非要拆 `.today-card` 时，用 `.today-card__head` 补一行可见标题文字。

---

## 3. 三个结构上真正不同的布局方向

三个方向在**五个轴上两两不同**（焦点/密度/导航位置/CTA 形态/数据在不在首页），不是换色：

| | A 今日一排（Station Rail） | B 侧栏仪表盘（Rail Dashboard） | C 正在播放整屏（Now-Playing Poster） |
|---|---|---|---|
| 首屏焦点 | 4 个圆盘里最大的那颗数字 | 2×2 读数阵 + 左竖栏 | 一个 96px 级巨数（海报） |
| 滚动方向 | 首页主内容是**横向** | 纵向两栏 | 纵向，且**不满一屏**（零滚动） |
| 导航位置 | 顶部 chrome | **左侧竖栏**（390 也保留） | 顶部 + **常驻底部条** |
| CTA | 区块头内联圆药丸 | 滚动区顶部 sticky 满宽条 | 贴屏边满宽控制条（拇指区） |
| 数据在首页 | 4 个数字，零文案零表格 | 全留（4 figures + 3 readouts + 4 行清单） | **只留 1 个数**，其余压成 ticker 弱呈现 |
| 密度 | 低 | 最高 | 最低 |
| 主要来源 | Apple Music S5 + YTM S3 | Spotify 桌面左栏 + 网易云双首页 | Spotify mini-player + Apple Podcasts 整屏 |

---

### 方向 A「今日一排 / Station Rail」——首页 = 一句问候 + 一条圆盘横轮

- **focal**：首屏唯一的视觉重量是一条**横向圆盘轮**（Apple Music Stations 的 78pt 圆盘形态）。四张盘里 `今日新词` 那张直径 96px、数字 34px，其余三张直径 68px、数字 22px——一屏内只有一个大数、一条轮、一个按钮，其他什么都不放。`.start__title/.start__lede/.start__spec/.start__meta` 全部 `display:none`。
- **on_home**（首页只展示）：4 个数字（新词 / 到期复习 / 逾期 / 连续优秀，圆盘承载）+ 日期标签（`.today-card__label`，14px 小字）+ 问候主标（`.topbar__meta` 提升，S1）。
- **moved_away**：`.start__spec`（阶段名、批次数、每批几词）、`.start__meta`、两条 `.today-card__reason` 全隐；阶段/批次构成由**我的页** `.stat__num` + `.setting-row__value` 与**日历页** `.cal-figures` 承接（那两个页面本就写着同一批数），解释性文字由日历页 `.cal-hero__reason` 承接。理由：音乐 App 从不把「曲库元数据表」摆在首页，首页只负责按下播放。
- **cta**：`.start__actions` 用 `order` 提到圆盘轮**上方同一区块头行**，形状改成圆药丸（`border-radius:999px; min-height:44px; width:auto`），与 `.today-card__label` 同行、右对齐 = YTM 的 "Play all"。不再是页底满宽块。
- **骨架实现**（关键三步）：
  ```css
  [data-skin='A'] .start__body{ display:contents; margin-block:0 }
  [data-skin='A'] .start{ display:grid; grid-template-columns:1fr; align-content:start; row-gap:14px; padding-top:76px }
  [data-skin='A'] .today-card{ display:grid; grid-template-columns:1fr; border:0; padding:0; background:none; box-shadow:none }
  [data-skin='A'] .today-card__figures{ display:flex; gap:14px; overflow-x:auto; padding:10px var(--page-x) 18px;
    margin-inline:calc(-1 * var(--page-x)); scrollbar-width:none; align-items:flex-start }
  [data-skin='A'] .today-card__figure{ flex:0 0 auto; width:68px; height:68px; border-radius:50%;
    display:grid; place-content:center; white-space:normal; font-size:14px; text-align:center;
    background:radial-gradient(circle,var(--surface-sunken) 0 5px,var(--surface) 5.5px) }
  [data-skin='A'] .today-card__figure:first-child{ width:96px; height:96px }
  [data-skin='A'] .today-card__figure b{ display:block; font-size:22px }
  [data-skin='A'] .today-card__figure:first-child b{ font-size:34px }
  ```
- **360 检查**：96 + 68×3 + 14×3 = 306px，加上出血与第三张半切正好；横滚容器靠 `.app__main{ overflow-x:hidden }` 不产生页面横向溢出。圆盘里 4 字中文标签（到期复习）14px ≈ 56px < 68px，可容纳单行；`8/14` 值 22px 占 44px 宽，OK。
- **风险**：① 圆形容器里的 `计划 8` 与 `.today-card__tag` 必须 `position:absolute` 外挂，否则溢出圆；② `display:contents` 拆 `.start__body` 后 `.today-card` 的 `margin-top:var(--space-5)` 变成网格行距，需清零；③ 若把 `.today-card` 也拆成 contents 会丢 `aria-label`——本方向**保留 `.today-card` 盒子**（只清它的面/边/阴影），不动它的 display。

---

### 方向 B「侧栏仪表盘 / Rail Dashboard」——导航第一次离开顶部横条

- **focal**：首屏焦点 = 右侧内容区顶部的 **2×2 数据阵**（4 个 figure 各自成格，大格放新词，小格放其余），左侧是一条**常驻竖栏**（品牌竖排 + 3 个 readout 竖排堆 + 头像沉底）。这是 7 套既有皮肤都没有的**两栏结构**。
- **on_home**：数据全留（4 figures + `.readouts` 3 条 + `.start__spec` 4 行），密度最高。文案（title/lede/reason）照删——`S6`：把「数字」和「道理」分开，道理给二级页。
- **moved_away**：只挪走**解释性内容**——`.today-card__reason` ×2 与 `.start__foot` 的「进度只存在这台设备」，沉到日历页 `.cal-note` / `.cal-hero__reason` 与我的页 `.section__hint`。首页有数没道理。
- **cta**：**sticky 在右侧滚动区顶部的满宽条**（S3 区块头 + Spotify 桌面 toolbar 的混合）：`.today-card__head` 与 `.start__actions` 合并成一行——`.start__actions{ position:sticky; top:0; z-index:6; }` + `.btn--primary{ width:100%; min-height:52px; border-radius:0 }`，内容滚到它下面时被条遮住。这是三版里唯一「滚动中始终可点」的 CTA。
- **骨架实现**：
  ```css
  /* ≥768：真侧栏 */
  @media (min-width:768px){
    [data-skin='B'] .app{ display:grid; grid-template-columns:96px minmax(0,1fr);
      grid-template-rows:auto auto minmax(0,1fr) }
    [data-skin='B'] .topbar{ grid-column:1; grid-row:1; flex-direction:column; align-items:flex-start;
      gap:16px; min-height:auto; border-block-end:1px solid var(--border) }
    [data-skin='B'] .readouts{ grid-column:1; grid-row:2; display:flex; flex-direction:column; gap:10px }
    [data-skin='B'] .app__main{ grid-column:2; grid-row:1 / span 3 }
  }
  /* 390 / 360：窄竖栏（导航仍然在左侧，形态差异保留到主战场） */
  @media (min-width:0px){
    [data-skin='B'] .app{ display:grid; grid-template-columns:56px minmax(0,1fr); grid-template-rows:auto minmax(0,1fr) }
    [data-skin='B'] .topbar{ grid-column:1; grid-row:1 / span 2; flex-direction:column; align-items:center; min-height:auto }
    [data-skin='B'] .brand{ writing-mode:vertical-rl; text-orientation:mixed }
    [data-skin='B'] .brand__dot{ width:1px; height:20px }
    [data-skin='B'] .readouts{ grid-column:1; grid-row:1 / span 2; margin-top:120px;
      display:flex; flex-direction:column; gap:10px }
    [data-skin='B'] .app__main{ grid-column:2; grid-row:1 / span 2 }
    [data-skin='B'] .screen{ --page-x:14px }
  }
  ```
  注意 `.avatar-btn` 用 `margin-top:auto` 沉到竖栏底部，等于把「我的」入口挪到 Android 返回键那一侧——单手可达。
- **360 检查**：56px 栏 + 304px 内容，`--page-x` 必须降到 14px；`.icon-btn`（44px）在 56px 栏内左右各 6px，不碰边；竖排 `.brand__name`（词笺 2 字）在 56px 栏内高度约 44px，安全；`.readouts` 竖排 3 项各约 34px 高，合计约 102px + 120px 上距 = 222px，不会压到 `.app__main`（它们分属不同 grid 区域，但同列重叠要避开：把 readouts 放 `grid-row:2` 且给 `.topbar` 固定 `height:210px`）。**这条是本方向最容易翻车的地方，必须实测 360。**
- **风险**：① 改 `.app` 为 grid 会影响**所有页面**（`.app` 是所有 screen 共用的壳），其他页的 sticky 顶栏会跟着变竖栏——要么接受全局侧栏（更像仪表盘），要么用 `.app:has(.start)` 只在首页生效（`:has()` 条件作用域是这里唯一的救命手段，值得优先验证）。② 两栏下 `100dvh` 固定高度 + `overflow:hidden` 意味着页面不能整体滚，只有右列滚——桌面 1440 下左侧留白需要内容兜住，否则空。

---

### 方向 C「正在播放整屏 / Now-Playing Poster」——首页 = 一张海报 + 一个数，数据几乎全走

- **focal**：**首屏只有一个数**。`.start` 被压成一格满高海报（`min-height:100%`，不滚动），`.today-card__label`（今日 · 11 月 25 日 周三）放大成 30px 海报主标（S1 的替代：把「时间 + 数据」当标题），`第一个 figure 的 <b>`（今日新词）放大成 `clamp(84px, 26vw, 132px)` 的唯一主角——这是 Spotify「Now Playing 整屏」的骨架：一张满屏面、一句标题、一个巨大的当下状态。
- **on_home**：1 个巨数 + 日期 + 一个 CTA。另外 3 个数字被压成**海报底边一条 ticker**（横向、14px 小字 + 18px 数字、半透明、可滑但不可扫读）——它们从「信息」降级成「氛围」，等价于播放器条上的进度刻度。
- **moved_away**：`.start__spec` 工单表、`.start__meta`、两条 `.today-card__reason`、`.start__masthead` 全部隐藏。**首屏零段落文字**（音乐 App 首页没有解释文案）。承接位：日历页 `.cal-figures > .cal-figure ×4`（本就有四格同构数据）+ `.cal-day__load` 负荷行 + `.cal-kicker`；我的页 `.stat__num`（已学/每日新词）、`.progress-track__bar`（总进度，天然的播放器进度条）。
- **cta**：**贴屏底的满宽控制条**（mini-player 位）。做法不用 `fixed`，用 `.app` 的 flex order：
  ```css
  [data-skin='C'] .app{ }                                  /* 保持 flex column */
  [data-skin='C'] .topbar{ order:1 }
  [data-skin='C'] .app__main{ order:2 }
  [data-skin='C'] .readouts{ order:3; display:grid; grid-template-columns:repeat(3,1fr);
    border-block-start:1px solid var(--border-strong); padding-block:8px }
  [data-skin='C'] .start__actions{ position:sticky; bottom:0; margin-top:auto; padding-bottom:env(safe-area-inset-bottom) }
  [data-skin='C'] .start__actions .btn--primary{ min-height:64px; border-radius:0; width:100% }
  [data-skin='C'] .start{ display:grid; grid-template-rows:auto 1fr auto; min-height:100% }
  [data-skin='C'] .start__body{ display:contents }
  [data-skin='C'] .today-card__figures{ display:contents }
  [data-skin='C'] .today-card{ display:grid; grid-template-rows:auto auto auto; }
  [data-skin='C'] .today-card__figure:first-child{ grid-row:1 / span 2 }
  [data-skin='C'] .today-card__figure:not(:first-child){ font-size:14px }  /* ticker 行，压成一行小字 */
  ```
  海报巨数：`.today-card__figure:first-child b{ font-size:clamp(84px,26vw,132px); line-height:.86; font-variant-numeric:tabular-nums }`（360 下 26vw≈94px，`12` 两字宽约 105px，加 label 换行不会溢出）。
- **360 检查**：ticker 用 `display:flex; overflow-x:auto; gap:18px` 出血到边，第三项被切——**S2** 的 affordance 直接搬到海报底；`.btn` 满宽 64px 高在拇指区；`.readouts` 3 格各 112px 放「今日 05」这类 2 字符值 + 14px 标签，不溢出。⚠️ 唯一必须实测的是 `clamp(84px,…)` 与 `.today-card__tag`（`↑ +5` 贴纸）在小屏上的碰撞：给 tag 用 `position:absolute; inset-block-start:0; inset-inline-end:0` 挂到数字右上角，别挤在正文流里。
- **风险**：① 拆了 `.today-card` 的 display 后它的面/边/阴影盒子仍在（只改 grid，不改 contents），`aria-label` 保住；海报底纹靠 `.today-card` 自己的 `background:linear-gradient/conic-gradient` + `::before` 纹理层，不引入图片。② 「首屏只有一个数」意味着**到期复习 / 逾期被藏**——必须用 `:has()` 把逾期拉回来：`[data-skin='C'] .today-card:has(b.is-warn) .today-card__figure:nth-child(3){ /* 从 ticker 提升为海报副标，红只在这 */ }`，否则用户会漏掉欠的债。这条是本方向唯一需要条件样式兜底的地方。

---

## 4. 硬约束自检（三个方向共用的验收清单）

1. **`.start__title` / `.start__lede` 在 A/B/C 全部 `display:none`**，且空出来的首屏焦点位由**数据**（问候行、圆盘数字、海报巨数）顶上，不是由留白顶上。
2. **中文 ≥14px**：基线 `.today-card__figure{ font-size:var(--fs-small) }` 常为 13px → 每个方向都显式写 14px。`12px` 只给纯拉丁（`DAILY LIST`、`::before` 编号）。
3. **对比度**：圆盘里的数字、海报巨数属大字（≥3:1）；ticker 小字、`.readout__k` 属正文（≥4.5:1）。语义色（success/warning/danger/accent）**浅深两档各写一遍**，深色档不得只反色。
4. **红色只用在一处**：`b.is-warn`（逾期 / 新词被闸住）。装饰（波形柱、圆盘内圈、海报底纹）禁止用红。
5. **44×44**：圆盘 ≥68px、`.icon-btn`/`.avatar-btn` 基线达标、`.btn--compact` 基线 `min-height:44px`；改成圆形 CTA 或内联药丸时显式补 `min-height:44px; min-width:44px`。
6. **360 零横向溢出**：横向内容一律走 `overflow-x:auto` 的滚动容器 + 负 `margin-inline` 出血，**禁止** `100vw`、禁止正 `margin-right` 把元素推出列；`transform:translateX` 不用于布局位移。
7. **≤2 字体族**：数字用 mono 或 sans 一档、中文正文用 sans 一档；圆盘/海报不许引入第三族。`Instrument Serif` 若用，只当展示字，且不与 Newsreader 同时出现。
8. **`:has()` 只能探测 DOM 上已有的类名**（`b.is-warn` / `b.is-accent` / `.today-card__tag` 是否存在 / `__links` 里按钮个数），**不能读数字**。所有条件形态必须有「缺省也不塌」的兜底；每条 `:has()` 规则旁边注明它探测的是哪个类。
9. **不写 JS、不改 DOM、不加图片/图标**：装饰一律 `::before/::after` + 渐变/mask/clip-path；「封面缩略图位」用 `counter()` + `::before` 的数字或色块顶替。
10. **`.app` 是全局壳**：任何把 `.app` 改 grid / 把 `.readouts` 移到底部的规则都会溢出到其他页面。用 `.app:has(.start)` 限定作用域，或明确接受全局侧栏/全局底部条并在 review 时逐页验一遍（列表页、复习会话页、即时复习页、日历页、我的页）。

---

## 5. 这个领域最值钱的三条「结构级」判断

1. **把「播放」内联进内容行，而不是摆在页面尽头。** YTM/Apple Music 的 Play 在区块标题旁或卡片上；词笺的「开始背单词」目前在文案之后——A/B 两个方向分别用「区块头药丸」和「sticky 顶条」把它接走。
2. **首页不需要解释自己。** 六款产品首页零段落文案，网易云甚至在改接口层面「整栏没内容就删栏」。词笺的 `.start__lede` 与两条 `.today-card__reason` 属于同类赘肉。
3. **状态常驻，而不是首页限定。** Spotify/Apple Music 的 mini-player 让「正在做的事」在任何页面都可见。`.readouts` 恰好长在 `.app__main` 之外（天然 chrome 层）——把它做成底部常驻条，是**唯一一处词笺结构本来就比别的皮肤更有优势的地方**，C 方向吃透了它。

---

## 6. 来源

**结构拆解 / 设计系统**
- Spotify 设计系统拆解（rails·shelves·stacked media modules、密度、sticky playback bar、响应式「宁可横滚不压卡片」）：https://raw.githubusercontent.com/Khalidabdi1/design-ai/refs/heads/main/design-md/spotify/DESIGN.md
- Apple Music iOS 结构拆解（Stations 78pt 圆盘、2×3 Recently Played、渐变 hero、mini-player 54pt、tab bar 83pt、区块标题 18/800、侧 padding 18pt）：https://code.jiangshu.ai/awesome-design-html/assets/ios/design.apple-music-ios.html （源码：https://github.com/yzfly/awesome-design-html/blob/main/assets/ios/design.apple-music-ios.html）
- Spotify Now-Playing bar = 一个 3 列 grid（左轨 / 中控 / 右音量）常驻底部：https://dev.to/dev48v/spotifys-now-playing-bar-is-just-one-css-grid-a-ticking-width-5494
- 移动端横向 rail 的普及度（30 个高收入 App 里 14 个用横滚排）：https://www.mobileappdesign.io/blog/carousel-ui

**官方说法 / 改版记录**
- Spotify 首页改版：时段问候 + 内容随时间变 + 「首页顶部专属区域放最多 6 个快捷项」：https://techcrunch.com/2020-03-09/spotify-rolls-out-a-more-personalized-home-screen-to-users-worldwide/ · https://newsroom.spotify.com/tag/good-morning/ · https://geeks.fyi/printthread.php?tid=10658
- Spotify Shortcuts 的工程故事（顶部「回到熟悉的内容」占位逻辑）：https://techreport.ngo/career-teams/reach-for-the-top-how-spotify-built-shortcuts-in-just-six-months/
- Apple Music（tvOS）首页行命名即货架 IA：Top Picks / Recently Played / Made for You / Stations for You：https://support.apple.com/et-ee/guide/tv/atvbb2412fc9/tvos
- Apple Music iOS 14 起 Listen Now 的区块顺序（Top Picks → genre → Recently Played → Made for You）：https://appleinsider.com/articles/20/09/19/how-to-get-the-most-out-of-apple-musics-updates-in-ios-14/amp
- YouTube Music 2024 首页微调（标题缩小、More 换右箭头、删第二行描述、Quick picks 保留 Play all）：https://9to5google.com/2024-08-12/youtube-music-home-feed-tweaks/
- YouTube Music：Quick picks 一次 4 条、Listen again 从轮改成更密网格：https://www.androidcentral.com/streaming-tv/youtube-music-update-makes-its-listen-again-shelf-a-lot-more-interesting · https://9to5google.com/2022-05-01/youtube-music-listen-again/
- Apple Podcasts iOS 27.2 把 Up Next 拆成 New Episodes / Continue Playing 两栏（两种收听习惯各一块）+ 行背景取封面色：https://www.macobserver.com/news/ios-27-2-apple-podcasts-new-episodes/ · https://apple.gadgethacks.com/news/where-did-up-next-go-in-apple-podcasts-ios272-full-guide/ · https://www.toutiao.com/article/7692226482541691402/
- Apple Podcasts iOS 17：整屏 Now Playing + Queue 区块 + 章节剩余长度（进度贴着内容走）：https://podcasters.apple.com/zh-tw/5303-ios-17-whats-new-apple-podcasts
- SoundCloud 官方透明度报告：首页内容以 "modules" 组织：https://pages.soundcloud.com/en/transparency-reports/resources/Recommendations_on_SoundCloud_Report_2024.06.25_English.pdf
- 网易云音乐 2024 改版官宣：「双首页」（个性化推荐 + 编辑发现）、卡片式错落排布、每日推荐/风格日推/心情歌单入口：https://cn.chinadaily.com.cn/a/202401/09/WS659d1531a310af3247ffb5d1.html

**批评 / 旁证（含用户视角的版面观察）**
- Spotify 内容策略审计：「首页该用来听，推荐该搬去 Browse」——首页承载内容而非导航/统计：https://bootcamp.uxdesign.cc/ux-content-strategy-audit-spotify-aeabcfa10f4d
- YouTube Music 批评：首页 carousel 顺序随上下文抖动、Quick picks 在首位：https://9to5google.com/2022-05-30/youtube-music-pin-carousels/ · https://ixd.prattsi.org/2026/09/design-critique-youtube-music-app/
- SoundCloud iOS 批评：首页极简卡网格、每模块只完整露 2 张、第 3 张切在屏外以诱导横滑：https://ixd.prattsi.org/2019/09/design-critique-soundcloud-ios-app/
- 网易云界面分析：三个核心入口（私人 FM / 每日推荐 / 新歌榜）靠**线框 icon 的形式反差**从图片卡里跳出；歌单页是图片瀑布流：https://blog.csdn.net/weixin_39605347/article/details/117810461
- 第三方实现对网易云首页栏目的归纳（只认歌曲/歌单/专辑三类条目，整栏无有效条目即删栏；主动去掉与自己重复的栏目）：https://github.com/chthollyphile/folia-major/blob/main/src/services/onlineMusic/README.md

> 注：标注为「设计系统拆解 / 界面分析」的几处（Spotify DESIGN.md、Apple Music iOS spec、两篇 Pratt 批评、CSDN 分析）是第三方对公开产品的观察与 token 归纳，不是厂商规范；具体 px 数值当**量级参考**，不当规范引用。改版记录（TechCrunch、Newsroom、9to5Google、Apple 官方页、ChinaDaily 官宣）为可信事实来源。
