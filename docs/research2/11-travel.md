# 跨领域 UI 调研 · 11 出行/生活（旅行预订 / 网约车 / 本地生活）

> 调研对象：Airbnb、Booking.com、Uber、大众点评、高德地图、携程
> 调研视角：**只聊骨架**——焦点在哪、几栏、信息密度、导航位置、CTA 形态、数据放不放首页、什么被藏进二级页。配色情绪一律不谈。
> 落点：为「词笺」首页皮肤提出 3 个结构上真正不同的布局方向。
> 日期：2026-11-25

---

## 0. 本领域的总规律（先说结论）

出行/生活类产品的首页是六个领域里**「行动优先」做得最狠**的一类，骨架上有五条共性：

1. **CTA 永远在首屏上半部，不在底部。** 这个领域没有一家把主按钮放在页面末尾——搜索框/目的地字段就是首页本体（Booking 首页最大的字就是 "Search"，Airbnb 首屏中央是搜索条，Uber 是 "Where to?" 大字段，点评/美团/携程是顶部通栏搜索框）。
2. **首页只有一个焦点动作，其余全是「入口」不是「内容」。** 金刚区（图标矩阵）、类目横滑条、tab 条，本质都是分流器，把用户尽快送出首页。
3. **数据（统计、进度、账单一律不上首屏）。** 六家首页没有一个放「你的历史统计仪表盘」——数据全在「我的 / 订单 / Activity Hub」二级页。首屏最多留 1 行状态（定位城市、会员等级、附近有什么）。
4. **导航收敛、藏得多。** Uber 把支付/行程/设置全塞进汉堡菜单；Airbnb 干脆删掉汉堡，底部 5 个 tab 解决一切；高德把「语音输入」藏进 tabbar 中间按钮的长按手势。敢藏是因为首页任务足够单一。
5. **密度两极分化，但排布方式不同：** Booking/携程/点评 = 高密度多区块（表单+金刚区+feed 三段式）；Airbnb/Uber = 低密度单焦点（大卡片大按钮大留白）。**同密度也长得不一样，区别在栏结构和区块顺序。**

对词笺的含义：现有 7 套皮肤里 paper/foundry/instrument/broadsheet/play/nocturne 基本都是「文档流：标语在上、CTA 居中下、数据在下」的编辑排布；bento 是唯一做过网格化的。**本领域给出的结构性武器是：CTA 置顶、金刚区网格、地图式分层、feed 化、单焦点极简**——全部是信息架构改动，不是配色改动。

---

## 1. Airbnb —— 单焦点 + 类目横滑的「灵感流」

### 骨架拆解
- **首屏结构（2022–2025 类目时代）**：顶栏几乎为空（无汉堡、无 logo，只有定位）→ 首屏中央大搜索条 → 搜索条下方紧贴一排**可横滑的「图标+文字」类目 chip**（树屋/海景/农场…，2022 年号称十年最大改版）→ 长页下方才铺目的地卡。GoodUI 的逐条对比指出：Airbnb 首页字段**只有一个**（destination），日期/人数全部推迟到点击后再问；滚动后搜索条**吸顶常驻**（sticky），整页长、搜索触发点极多。
- **2025 Summer Release**：全新 App，Explore tab 变成聚合首页（房源+体验+服务），Trips tab 改成按「小时+天」排布的行程时间线。导航=底部 5 tab（探索/收藏/行程/消息/账号），登录后 tabbar 本身就是个性化导航。
- **2025.9–2026**：类目 bar 整个删掉，换成自然语言 AI 搜索框——首页再次收缩成「一个框 + 推荐 feed」。
- **搜索结果页**：移动端列表/地图可切换，桌面端左列表右地图分栏——**卡片流和地图互为双生视图**。
- 密度：低。一屏一大卡。数据：首页零个人数据。

### pattern
- **structure**：顶栏清空 → 唯一大输入/动作件放首屏**垂直居中偏上** → 动作件下方紧贴一条横滑 chip 轨 → 其余全推到滚动后。单栏、低密度、大触控件。
- **surfaced**：只有「开始动作」的入口（搜索条 + 类目 chip）。
- **hidden**：人数/日期等次级参数推迟到二屏浮层；所有统计数据、账户、订单推到 tab 页；首页连 logo 和汉堡都不要。
- **css_only**：`.start__actions` 用 `order:-1` + `grid-row` 提到 `.start__masthead` 之上，`.btn--primary` 做成胶囊大搜索条（`width:min(100%-32px,520px); height:56px; border-radius:999px; box-shadow: inset 0 0 0 1px`，内部用 `::before` 画一个放大镜圆环+斜线代替图标）。`.start__spec` 4 行改横滑 chip 轨：`display:flex; overflow-x:auto; scroll-snap-type:x mandatory; gap:10px`，每行 `flex:0 0 auto; min-width:112px; scroll-snap-align:start`，行内 `.spec__k` 变 chip 文字、`::after` 用 content 造「›」后缀；360px 下靠 overflow-x 横向滚动消化宽度、零横向溢出（父级 `.start` 需 `overflow-x:clip` 防冒泡）；`.start__meta` 做 sticky 顶部的搜索提示条（`position:sticky; top:0`）。

## 2. Booking.com —— 表单即首页（form-first）

### 骨架拆解
- GoodUI & ScreensDesign 拆解：首页自上而下 = ①logo+汉堡（藏全部二级导航）②**常驻顶部品类 tab 条**（住宿/机票/租车/出租车，全程 sticky，切品类不丢上下文）③最大字号 = 功能性标题 "Search" ④**多字段表单一次摊开**：目的地 + 入住/退房日期 + 人数 + 「差旅」勾选框，直接跟**大号通栏 CTA** ⑤表单以下才是优惠、低价卡、Genius 权益、内容块。
- 与 Airbnb 的相反选择：字段不推迟、**全部前置摊平**，赌用户愿意一屏填完；首页不做梦、只办事。
- 密度：高。首屏之后是密集的价格/评分/紧迫提示卡。个人数据（优惠、订单、积分）**出现在首页但只在表单以下**。

### pattern
- **structure**：顶部 tab 分流条 + 中部「动作面板」（一组字段+一个满宽按钮，占首屏 60%）+ 下部推荐区。首页 = 一块可操作的面板，不是一篇文章。
- **surfaced**：动作所需的全部参数 + 权益数字（Genius 等级折扣）。
- **hidden**：全部导航收进汉堡；目的地类目、攻略推到 feed。
- **css_only**：把 `.readouts` 三个读数改造成「表单摘要字段条」——`.readouts{display:grid;grid-template-columns:1.4fr 1fr 1fr;border:1px solid;border-radius:12px;overflow:hidden}`，`.readout` 之间用 `border-inline-end` 分格，`.readout__k` 是小字 label、`.readout__v` 是「已填值」，整条紧贴 CTA 上方；`.start__actions` 提到 `.start__title` 位置（`order:-2`），`.btn--primary` 满宽 56px；`.start__meta` 用 `::after{content:"▾ 修改计划"}` 伪装成字段尾部的编辑提示。360px：三格改 `grid-template-columns:1fr 1fr 1fr` 并把 label 用 `writing-mode:vertical-rl`？——不，太怪；正确做法是 `<360` 时 `.readout__k` 缩到 11px 上排、`.readout__v` 下排的 stacked 单元格，保证零溢出。

## 3. Uber —— 地图底 + 悬浮控件层（「Where to?」单字段）

### 骨架拆解
- Uber Design 官方复盘（Designing the new Uber App）：整个产品**围绕一个「去哪儿」输入件打造**，一切流程从它出发；后续界面（车型选择）用 **bottom sheet 从底部滑入、地图保持可见**——定价决策要聚焦，空间语境要保持，两态共存。
- reverseBits 拆解：搜索条宽 80–90%、高约 56px，**是首页最大可点件**（菲茨定律）；地图占屏约 70%，同时承担定位/司机动点/等待预期/纠错四个职能；支付、行程、设置全藏汉堡。
- 2023 改版：首页简化 + Services tab 一站式 + Activity Hub（历史/未来行程收进独立枢纽）。
- 2026 GO–GET：首页改为「顶部一个统一搜索框 + 一列推荐 feed」，地图退居其次——社区反弹（"wait, where's my map"）。两版对照说明：**Uber 骨架的本质不是地图，是「一个巨型动作字段置顶，其余分层浮现」**。
- 结构关键词：**z 轴分层**（背景层/内容层/控件层/导航层），不是 y 轴文档流。

### pattern
- **structure**：整屏是一块「场」（地图/画布），动作件悬浮其上置顶；次级界面用 bottom-sheet 从底部升起覆盖一半、底层透出不消失。首页只有一个可点件。
- **surfaced**：目的地输入 + 常用地点快捷行（saved places，就两个 chip）。
- **hidden**：钱、行程、设置、账户全部；连「选车型」都是临时浮现的层，不常驻首页。
- **css_only**：`.start` 改 `position:relative; min-height:100dvh`，用 SVG data-URI 等值线/路网网格 + `radial-gradient` 雾罩做「地图层」背景；`.btn--primary` `position:fixed; top:calc(env(safe-area-inset-top) + 64px); left:16px; right:16px; z-index:9` 变成悬浮的 "Where to?" 字段；`.today-card` `position:fixed; bottom:0; left:0; right:0; border-radius:20px 20px 0 0; z-index:8` 变 bottom-sheet（默认只露 head 一条把手，`::before` 画 32×4px 圆角横杠）；`.start__spec` 藏进 sheet 内展开区（`max-height:0`→`:has` 无关，皮肤静态即可：直接折叠进 `order` 排到 sheet 后）。360px：fixed 件全部用 `left/right` 撑开而非定宽，不溢出。

## 4. 大众点评 —— 金刚区网格 + 双列 feed 的「本地生活三段式」

### 骨架拆解
- 竞品分析（人人都是产品经理/Link，写于点评首页改版期）与美团&饿了么对比文给出的**行业标准骨架**：定位城市 → 通栏搜索框（热词轮播）→ **金刚区**（导航栏品类区：两行五列图标，分两页横滑；第一行视觉权重高于第二行）→ 瓷片区（运营卡）→ 双列 UGC 图文 feed / 附近商家列表。
- 点评的取舍：金刚区**分两页**而非持续滑动（操作确定性>炫技）；推荐 feed 双行图文、大图优先、文字只截 26 字符；搜索是**定向搜索**（限定城市内）。
- 密度：全领域最高。个人数据（钱包、订单、评价记录）**完全不上首页**，首页的「数据」全是供给数据（店、榜单、内容）。
- 值得偷的细节：tabbar 首页图标在滚动后变「返回顶部」；运营位藏第一屏以下给熟用户。

### pattern
- **structure**：顶部通栏搜索 + 2×5 金刚区矩阵 + 双列 feed，三段式；首屏焦点是「矩阵」而不是任何单一元素。多栏、高密集、格子化。
- **surfaced**：品类入口（矩阵）+ 内容卡片（feed）。
- **hidden**：个人一切数据（订单/钱包/等级）推到「我的」；长尾品类收进矩阵第二页和二级页；搜索参数（范围、排序）点击后才出现。
- **css_only**：**`display:contents` 合并异构节点造金刚区**——`.readouts{display:contents}` 把 3 个 `.readout` 提出来，配合 `.today-card__links{display:contents}` 把 2 个文字链提出来，在 `.start` 的 grid 里用 `order` 把它们排进同一 5 列行：`grid-template-columns:repeat(5,minmax(0,1fr))`，每格 `min-height:44px`，`.readout__k` 做格底小标签、`.readout__v` 做格内大数字、`::before` 用 radial-gradient 画「图标占位」圆点；360px 时 `repeat(5,...)` 仍成立（每列 64px≥44），但数字用 `font-size:clamp(15px,4.4vw,20px)` 防挤爆，`minmax(0,1fr)` 是关键。剩余 `.today-card__figure`×3 排不进 5 列，改做第二行「瓷片区」：`.today-card__figures{display:contents}` 后三张 `grid-column:span 2/2/1` 不等宽磁贴。

## 5. 高德地图 —— 全屏画布 + 四层空间系统（按人群换脸）

### 骨架拆解
- 高德 2026 焕新官方设计说明给出明确的**四层模型**：地图层（永远连续可见的基础层）/ 内容层（POI 标注、扫街榜卡片）/ 控制层（玻璃材质**只用于**底部 Bar、Widget 按钮、搜索条——是控件的材质不是页面的背景）/ 导航层（底部 tab 稳定可达）。同一材质按「探索/决策/行中」三种注意力状态改变表现。
- 首页按人群**重排功能优先级**：有车用户首屏是「驾车/上下班/车主服务」，无车用户是打车/公交——同一个 DOM，不同排序（对我们 = `:has()` 条件样式按 `.is-*` 状态类换布局的雏形）。
- tabbar 中间按钮**点击=切页、长按=弹语音条**：一个按钮两职，把高频非首要功能藏进时间维度手势（优设细节猎人）。
- 反面教训（扫街榜争议，齐鲁晚报报道）：商家/酒店价格等内容直接堆到地图画布上，导航用户抱怨「满屏饭店、找不到北」——**画布层被内容层污染，任务型用户流失**。结论：底图归底图，内容必须收进可收起的 sheet。

### pattern
- **structure**：z 轴分层而非 y 轴排布；控件悬浮、内容按需升起、导航常驻；首屏 80% 是「环境」本身，UI 只占边带（顶搜索条+底控件坞）。
- **surfaced**：环境（地图/状态）+ 一个搜索/坞。
- **hidden**：一切列表型、阅读型内容收进 bottom sheet 与二级页；第二功能藏进长按。
- **css_only**：`body` 级背景换成等高线 SVG data-URI（`background-image:url("data:image/svg+xml,...")` + `mask-image:linear-gradient()` 让线条向中心淡出）；`.topbar` `position:sticky;top:0` + 半透明 `backdrop-filter:blur` 玻璃坞；`.start__actions` `position:fixed;bottom:calc(env(safe-area-inset-bottom)+72px);left:50%;transform:translateX(-50%)` 做悬浮胶囊行动按钮；`.today-card` `position:fixed;bottom:0` 默认收起只露 `.today-card__head`（`translateY(calc(100% - 56px))`），配 `.start:has(.today-card:hover)`/`:focus-within` 抬起——纯 CSS 的「sheet 展开」。360px：fixed 件全部带 `max-width:min(92%,420px)`。

## 6. 携程 —— 三种需求三套入口（定向/模糊/探索）的密度收放

### 骨架拆解
- 163/公众号拆解 2025 首页改版，三个动作：**①搜索框从顶部移到页面中部**（视觉重心从「工具条」变成「面板」）；**②密集业务入口砍成两行共十个金刚格、第一行五个重点突出**；③首页底部整段换成小红书式双列内容 feed（攻略/种草卡内挂 SKU 转化链接）。
- 方法论：金刚区=接**定向需求**，搜索=接**模糊需求**，feed=接**探索需求**；一屏只服务一种心智的人。改版后首屏密度**降低**（「看起来没那么累」）。
- 数据观：订单、会员数据不在首屏；feed 卡片是他人内容而非个人统计。

### pattern
- **structure**：垂直三带＝三种意图（动作带→矩阵带→探索带），从上到下「目的性递减、浏览性递增」；CTA 在**第一带中间**而非页尾；带与带之间用底色/材质硬切，不是留白渐次。
- **surfaced**：入口（金刚格）与供给（feed）。
- **hidden**：改版主动把 10+ 入口藏成 2×5；长尾类目、个人订单、消息全在二级。
- **css_only**：三带硬切——`.start` 改 `grid-template-rows:auto auto 1fr`，`.start__actions`+`.start__meta` 组成第一带（CTA `width:100%`、`font-size:17px`、`:active` 位移 2px）；`.readouts{display:contents}` 后三个 `.readout` 与 `.today-card__links`（同样拆 contents）的 2 链排进第二带 `grid-template-columns:repeat(5,minmax(0,1fr))`，第一行五格等高 `min-height:64px`；第三带把 `.start__spec` 变双列 feed：`display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px`，每行卡 `::before` 用两档 linear-gradient 画「封面图占位块」（`aspect-ratio:4/3`），`overflow:hidden + -webkit-line-clamp:2` 截断值文本；`.start__foot` 藏进第三带尾。360px：双列每列约 `(360-32-12)/2=158px`，卡内 k 值用 `clamp(13px,3.8vw,15px)` 且 `word-break:keep-all` 防中文断字丑陋——正文仍 ≥14px 达标。

---

## 7. 给词笺首页的 3 个结构方向（互不相同，且都不是换色）

前提共识：`.start__title`/`.start__lede` 按用户要求删除（`display:none`）；剩余素材只有 topbar（品牌+3 控件）、readouts×3、kicker/eyebrow、meta、spec×4 行、CTA、today-card（label/links/figures×3/reason）、foot。

### 布局 A 「打车面单」/ Destination Field（学 Uber + 高德四层）
- **focal**：首屏视觉焦点 = 一枚悬浮的、搜索框形状的满宽主 CTA（「开始背单词」渲染成 Uber 式「去哪儿？」字段），悬在**全高装饰画布**（SVG 词根路网/等值线底纹）上方约 1/4 屏处。页面不是文档流，是 z 轴三层：画布层 / 字段层（fixed）/ 底坞层。
- **on_home**：CTA + 一个 `.today-card__reason` 状态徽章（「今日待办 N 词」的 is-* 语义胶囊）+ topbar。三个 readout 数字**不做主角**，压成 topbar 下方一条 sticky 单行 ticker（k:v 用 `·` 分隔、`overflow-x:auto` 跑马）。
- **moved_away**：`.start__spec` 工单表与 today-card 明细整段沉到画布下方第 2 屏（`.start{min-height:100dvh}` + 第二屏起始处放），等于把数据推到滚动后；首页「不展示统计」。
- **cta**：`position:fixed` 满宽胶囊、56px 高、顶部安全区下 64px；按下 2px 下沉。它是首页唯一最大可点件。
- **differs**：与 bento（网格堆文档）、play（奶油文档流+厚按钮）、nocturne（排印文档流）本质区别：**放弃 y 轴叙事，改成地图式分层**；首屏元素数从 7+ 砍到 3。配色随意，骨架完全不同。
- **360 要点**：fixed 件一律 `left:16px;right:16px` 自适应；ticker 用 `overflow-x:auto` + `.start{overflow-x:clip}` 双保险零横向溢出。

### 布局 B 「登机牌行程单」/ Boarding Pass（学 Booking 表单前置 + 携程 ticket 化）
- **focal**：首屏焦点 = **一张横贯全宽的「登机牌」**：左联是巨型数字（今日新词，取 `.today-card__figure` 的 `<b>`），右联存根是 CTA + 三个小读数（连续/总词量/计划），中段用 `clip-path` 打孔 + 虚线撕痕（`::before` repeating-linear-gradient）分成两联。CTA 在首屏上半部、票面内。
- **on_home**：只留 1 个大数字 + 存根三小值 + CTA；`.start__eyebrow`/`.start__kicker` 变成票面「航段」小字（如「今日 → 复习」）；`.start__meta` 变条码装饰（repeating-linear-gradient 画 barcode）。
- **moved_away**：`.start__spec` 4 行工单与 `.today-card__links`、reason 推到票下方第 2 屏，作为「行李须知」附录（小号 mono 表格），首屏不可见。
- **cta**：票面右联的实心矩形按钮（非圆角胶囊），44×满格高，占票面宽度约 40%，文案由 `.btn--primary` 原生承担。
- **differs**：现有 7 套没有任何一版把**多个异源 DOM（readouts + today-card + actions）融合成一个带物理形态的复合单据**；信息架构从「列表文档」变为「一张可撕的票」，密度集中在票、留白集中在票外。与 foundry（工单排印）的区别：foundry 仍是自上而下的表单流，B 是左右联咬合的单实体。
- **360 要点**：票面两联在 `<390` 时改上下堆叠（`grid-template-rows:auto auto` + 撕痕改横向），数字 `clamp(44px,14vw,72px)` 保证不溢出；条码装饰随视口 `background-size:contain`。

### 布局 C 「生活服务三段式」/ Grid+Feed（学 大众点评 + 携程，密度反转）
- **focal**：首屏焦点 = **2×3 宫格「背词金刚区」**（见下）；没有标语、没有单一大图，焦点是矩阵本身。顶栏 `.topbar` 重绘成点评式通栏「地址+搜索」假想条（品牌名居左、两个 icon-btn 化身边距控件）。
- **on_home**：**全数据前置**——`display:contents` 拆 `.readouts` 和 `.today-card__figures` 的包装，3 读数 + 3 figure 合并成 6 格宫格（3 列 ×2 行，`grid-template-columns:repeat(3,minmax(0,1fr))`），每格 = 大数字 + 小 tag，`min-height:72px`；`.start__actions` CTA 排在宫格正上方一行满宽（点评把搜索放最顶的等价物）；宫格下方立刻接「feed」：`.start__spec` 4 行拆成双列内容卡（`::before` 渐变占位块 + line-clamp 两行），today-card 的 links/reason 并入 feed 尾部。
- **moved_away**：反而是不挪——本方向的立场是「首页=操作台，密度即诚意」（Booking/点评路线），代价是彻底放弃 Airbnb/Uber 式极简；若嫌满，砍 `.start__meta` 与 eyebrow 即得轻量版。
- **cta**：满宽 48px 实心条，吸顶可选（`position:sticky;top:0` 常驻，学 Airbnb 搜索条吸顶）。
- **differs**：bento 是「不对称磁贴 + 读数」但仍保留顶部标语叙事；C **删光叙事件、用 display:contents 把三个互不相干的组件焊成统一宫格 + 双列 feed**，栏数（3 列宫格/2 列 feed）和阅读顺序（先矩阵后清单）都与现有 7 套不同。这是六家里密度最高的一派，与 A 的密度极简形成两极对照。
- **360 要点**：3 列宫格每列 `360/3≈112px` 足够放 2 位数；feed 双列 158px/卡；所有 k/v 用 `minmax(0,1fr)` + `overflow:hidden` 防撑破。

### 三方向对照表

| 维度 | A 打车面单 | B 登机牌 | C 三段式 |
|---|---|---|---|
| 首屏焦点 | 悬浮 CTA 字段 | 票面大数字+存根 | 6 格宫格矩阵 |
| 版面模型 | z 轴分层（画布/控件/坞） | 单实体复合单据 | 多栏网格+feed |
| 密度 | 最低（3 件） | 中（1 票） | 最高（矩阵+feed） |
| 数据位置 | 推到第 2 屏 | 1 大数+3 小值进票 | 全部进宫格 |
| CTA 形态 | fixed 胶囊字段 | 票内实心矩形 | 满宽吸顶条 |
| 导航位置 | topbar+fixed 坞 | 不变 | topbar 化搜索条 |

---

## 8. 自检（对照硬约束）

- 三版均删 `.start__title`/`.start__lede`（`display:none`，不动 DOM）。
- 均不改 DOM、无图片/字体外链；装饰只用 SVG data-URI 背景、伪元素、gradient、clip-path。
- 点击目标：CTA≥48px、宫格/chip≥44px；360px 全部给出溢出对策（`minmax(0,1fr)`、`overflow-x:clip`、clamp 字号、fixed 件左右撑开）。
- 正文≥14px 的 k/v 与小标签在 A 的 ticker 与 C 的 feed 中需注意：ticker 内小字属非正文装饰仍需 ≥12px 且对比度达标；语义色浅深两档各写一遍（reason.is-* 的 overdue 用红仅指逾期，其余语义另配）。
- 单一强调色不受影响：三版骨架均不依赖多色。

---

## 9. 来源 URL

- Design Week — Teo Connor 谈新版 Airbnb App 设计：https://www.designweek.co.uk/it-was-a-bit-nuts-teo-connor-on-designing-the-new-airbnb-app/
- Airbnb Newsroom — 2025 Summer Release（Explore/Trips tab）：https://news.airbnb.com/product-releases/airbnb-2025-summer-release/
- Otamiser — Airbnb categories 上线与下线始末（2026 AI 搜索）：https://www.otamiser.com/blog/airbnb-categories
- Skift（西语版）— Airbnb 类目搜索框的退场：https://skift.com/es/2025-09-25/airbnbs-categories-were-meant-to-reinvent-the-search-box-now-theyre-gone/
- GoodUI — Booking's vs. Airbnb's Mobile Homepage UI（逐条结构对比）：https://goodui.org/blog/comparing-bookings-vs-airbnbs-mobile-homepage-ui/
- GoodUI — Reverse Engineering Booking.com's Homepage Design Optimizations：https://goodui.org/blog/reverse-engineering-booking-coms-homepage-design-optimizations/
- ScreensDesign — Booking.com App 结构拆解（persistent top navigation）：https://screensdesign.com/showcase/bookingcom-hotels-travel
- Uber Design（掘金译文）— Designing the new Uber App（Where to 单字段/bottom sheet）：https://github.com/xitu/gold-miner/blob/master/TODO/designing-the-new-uber-app.md （原文 https://medium.com/uber-design/designing-the-new-uber-app-16afcc1d3c2e ）
- Uber Newsroom — We're redesigning the Uber App（新首页/Services/Activity Hub）：https://www.uber.com/newsroom/were-redesigning-the-uber-app-just-for-you/
- reverseBits — Uber's Mobile App: A UI/UX Breakdown（搜索条 56px/地图 70%/bottom sheet 六因）：https://www.reversebits.tech/blog/ubers-mobile-app-a-ui-ux-breakdown-no-one-talks-about/
- App Comrade — Uber GO–GET 2026（首页改搜索条+推荐 feed 的争议）：https://appcomrade.com/apple/uber-request-a-ride-368677368/
- 人人都是产品经理 — 结合大众点评的首页产品，总结首页高转化率的设计窍门：https://www.woshipm.com/pd/642375.html
- 人人都是产品经理 — 美团&饿了么：差异化产品设计（地址-搜索-banner-金刚区-瓷片区-列表 五段式）：https://www.woshipm.com/pd/4187089.html
- 网易 — 大众点评首页推荐模块竞品分析（双行图文/26 字符截断）：https://www.163.com/dy/article/FHDNEQLB0511805E.html
- 优设网细节猎人 — 只有 1 个 Tabbar 按钮，高德如何优雅塞下 2 种功能：https://www.uisdc.com/hunter/0221646250.html
- 微信公众号 — 高德地图 2026 液态玻璃：地图层/内容层/控制层/导航层四层模型：http://mp.weixin.qq.com/s?__biz=MzE5ODQ3MDM4Mw==&mid=2247492150&idx=1&sn=b7102cbed230873fcd8e649365b6064d
- 网易/齐鲁壹点 — 「扫街榜」上线后高德首页内容化争议（画布被内容污染的教训）：https://www.163.com/dy/article/K9945BNU0530WJIN.html
- 网易/公众号 — 携程怎么了？（搜索居中、2×5 金刚区、底部内容 feed 三动作）：https://m.163.com/dy/article/JSHUTCI30531RSPL.html
- 优设网 — 探索类目的引导式灵感设计：Airbnb 如何激发浏览欲望：https://www.uisdc.com/hunter/0221622482.html
- Design Lab 课程拆解 — Airbnb homepage（搜索条首屏居中、汉堡收纳、CTA 拇指热区）：https://app.designlab.com/course/submissions/view/213e6557/
