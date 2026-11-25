# synth-action · 首页骨架收敛：行动优先 × 高密度 × 编号系统 × 侧栏仪表盘

> 输入：`SKIN_BRIEF.md`（DOM/令牌/硬指标）＋ `05-productivity.md`（Things/Linear/Fantastical/Notion/Todoist/Raycast/Superhuman）＋ `09-news.md`（Bloomberg/Feedly/Inoreader/FT/财新/Are.na）＋ `08-industrial.md`（TE/Nothing/Braun/Dyson/Aesop）＋ `11-travel.md`（Airbnb/Booking/Uber/点评/高德/携程）。
> 输出：5 个首页骨架候选，供主设计者拍板。**全部候选只动 CSS，不动 DOM；`.start__title` / `.start__lede` 一律 `display:none`。**
> 本文不含配色——配色/圆角/字体是候选定稿后的附属工序。

---

## 0. 公共红线（五候选共同遵守）

1. **首页独享数据不许丢**（00-data-inventory.md:57,73,82-84）：
   - 今日批数 `todayBatchCount`（readout S4 / spec 行 3 S13）——五候选全部以可见形态保留，并点名所在选择器；皮肤层无法把它补进日历/我的页（那是改 DOM 的独立决策）。
   - 待复习合计句 `pendingReviews`（`.today-card__reason` T9 第一句）与「先复习后新词」承诺句（T9 第二句）——全部保留，只做重排印。
2. **功能入口不许丢**：`.today-card__links`（错词本 N / 学习日历）、`.btn--primary`、`.start__foot` 换个阶段。允许变形（行/格/票联/chip），不允许消失。
3. **放心砍的重复项**：今日新词 ×4、已学 ×3、阶段 ×3 —— 砍副本不砍唯一源；日历 hero 与我的页有等价展示。
4. **伪元素只放静态短码**（`<GO>`、`⏎`、`01`、条码、撕痕），**禁止伪造动态数据**（假进度条固定宽度、假时间戳、假计数——09-news §三-2 已说破）。
5. `.app` 是 `100dvh/overflow:hidden` flex 列：`.topbar` `.readouts` 常驻滚动区外——候选里凡是「常驻带」的设想都利用这个事实，而不是对抗它；任何 `fixed/absolute` 钉件要按 topbar+readout 实际高度扣位。
6. 硬指标逐候选自查：360 零横向溢出（`minmax(0,1fr)`、`overflow-x:clip`、满幅用 `margin-inline:calc(50% - 50vw)` 不用 `width:100vw`）、可点 ≥44×44、中文正文 ≥14px、≤2 字体族、单强调色、红只给逾期/错误、浅深两档各写。
7. **与七套的查重底线**：bento 已占「等宽读数横条 + 不对称磁贴」，broadsheet 已占「衬线刊头 + 多栏文章流」，instrument 已占「竖向仪表分区面板」，foundry 已占「铸造块面 + 工单排印」。每个候选附「骨架差异声明」。

---

## 1. 候选一 ·「传票」Boarding Pass（行动优先族）

- **名字**：传票（自定义度量前缀 `--bd-*`）
- **一句话结构**：首屏焦点是一张**横贯全宽的登机牌**（占首屏高约 45–55%）：票身 = 巨型「今日新词」数字，虚线撕痕 + clip-path 圆缺口分出右联存根，存根里是主 CTA + 批数 + 错词本/日历两个入口；票面上缘是 masthead 改写的「票头」（AIR 词笺 · 2026-11-24），票以下才是 reason 承诺句、剩余 spec 的「行李须知」附录和第 2 屏 foot。
- **数据去留**：
  - 保留（票内）：新词巨数（figure#1 `<b>`）、到期/逾期/连续三小值（figure#2-4，存根竖排）、批数（spec 行 3 → 存根 mono 小字「BATCH」行的值）、错词本 N + 学习日历（`__links` → 存根两条「登机口」行）、T9 两句（`__reason` → 票底 2px 左边框批注行）、日期（`__masthead-meta` → 票头）。
  - 砍掉：title/lede（强制）；`.start__meta`、`.readouts`（今日/批数/已学均为票内数据的副本，批数唯一源转入 spec 保留）；spec 的阶段行与今日新词行（kicker/eyebrow 已有 → 变票面「航段」小字「CET4 → REVIEW」）。
- **主 CTA**：票面右联存根内的方角实心块，高 ≈48px、占票宽约 38%，**不满宽、不 sticky、不贴底**——它在首屏上半部的票里，像 Booking「填完就点」的表单尾钮。
- **CSS 手段**：`.start__body{display:contents}` 把 `.start__actions` 与 `.today-card` 提到 `.start` 网格同层；两者 `grid-area` 重叠（today-card 画票面：`border+background+clip-path`，actions 变透明定位层，`.btn--primary{justify-self:end;width:38%;align-self:end}` 落在存根区）；撕痕 = `.today-card::before` 的 `repeating-linear-gradient` 虚线 + 两端与中线三枚底色 `radial-gradient` 圆缺口；条码 = `.start__meta` 改 `display:none` 后由 `.today-card__head::after` 挂静态 repeating-gradient 条码带；`__links .btn--text` 满格高 44px；spec 行 `display:grid;grid-template-columns:auto 1fr` 排须知附录。
- **三档**：360 = 票联上下堆叠（数字联上、存根联下，撕痕转水平），巨数 `clamp(44px,14vw,72px)`，**禁 clip-path 裁到按钮**（改 mask 只裁底色）；768 = 票面定宽 680 居中，右侧第二栏放「须知」spec + foot，出现真双栏；1440 = 票居中 ≤840，两侧底色铺 1px hairline「停机坪网格」（`background-image:linear-gradient` 双向）。
- **风险**：clip-path 会连点击热区一起裁 → 存根钮必须验证不被缺口吃角；票的复合高度在 360 短屏可能把 reason 挤到折叠线外 → 票高 auto 不锁死；「条码/撕痕」纯装饰可能被读成可交互 → 光标与 hover 态一律不给它们；须知附录中文小字守 14px。
- **借鉴**：Booking「字段全摊平 + 大号通栏 CTA 在首屏上半部」https://goodui.org/blog/reverse-engineering-booking-coms-homepage-design-optimizations/ ；携程「订单/票据化卡片 + 首屏只留动作」https://m.163.com/dy/article/JSHUTCI30531RSPL.html ；Uber「内容收进可收起的层」https://www.reversebits.tech/blog/ubers-mobile-app-a-ui-ux-breakdown-no-one-talks-about/ （11-travel §2/3/6）。

---

## 2. 候选二 ·「左舷」Port Rail（侧栏仪表盘族）

- **名字**：左舷（前缀 `--pr-*`）
- **一句话结构**：把「单栏往下滚的纸」翻成「**左轨 + 右视图**」的双栏信息架构：360 起左缘一条 48px 竖排书脊（masthead 旋转而成，品牌 + 日期 + 编号），右列顶部是 eyebrow 升格的 26–30px「今日」章题（顶掉被删标语的焦点位），下面是拆卡的行清单，列底 sticky 一条动作条；768 起书脊升格为**真侧栏**——topbar+readouts 整体被 `.app` 网格推到左列常驻。
- **数据去留**：
  - 保留：readouts 三项（768 起进侧栏竖排读数列，360 起转为书脊旁的三条行内读数行）、figures 四行（右列清单主体）、批数（readout#2 原位保留，另见 spec 可选行）、T9 承诺句（首条动作行下的灰字注）、`__links`（右列顶两条导航行「› 错词本 N」「› 学习日历」，Things 侧栏项语法）、foot。
  - 砍掉：title/lede（强制）、`.start__meta`（readout 副本）、spec 全部 4 行（阶段=kicker、新词/批次/已学=readout+figure 的副本；「已学」明细去处：我的页 stat 行 ProfileScreen 已有）；kicker 保留作章题上方的 mono 章节标签。
- **主 CTA**：右列**底部** `position:sticky;bottom:0` 满宽 52px 动作条（选择器限定 `.start__actions`，只作用于首页，不污染其它页），Todoist 中央加钮的移动端等价物、Things Magic-Plus 的横条化。不是 fixed 坞，滚到页尾随列自然收走。
- **CSS 手段**：360：`.start{display:grid;grid-template-columns:48px minmax(0,1fr)}`；`.start__masthead{grid-row:1/-1;position:sticky;top:0;writing-mode:vertical-rl;text-orientation:mixed}`（书脊只放拉丁/数字/日期，成句中文不进竖排）；`.today-card{background:none;border-radius:0;padding:0}`＋`__head{position:sticky;top:0;z-index:2}` 分组头；`__figures{display:contents}`＋`__figure{min-height:44px;border-bottom:1px solid;display:flex;justify-content:space-between}`。768：`.app{display:grid;grid-template-columns:200px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}`，`.topbar{grid-column:1/-1}`，`.readouts{grid-column:1;grid-row:2;display:flex;flex-direction:column;border-inline-end:1px solid}`，`main.app__main{grid-column:2;grid-row:2}`；书脊此时隐藏，brand 靠 topbar。1440：侧栏 232px、右列内容限宽 720 左对齐，右缘留白墙（Feedly 第三栏=空白）。
- **三档**：360=48px 书脊 + 312px 内容列（零横向溢出：书脊永不横滚）；768=真侧栏（这是五候选中唯一在 768 出现**页面级双栏拓扑**的）；1440=侧栏加宽、右列不再拉宽。
- **风险**：`.app` 改网格会带到日历/我的/列表页——768 起四页同享左栏（一致性收益，但 `.screen` 居中、`--content-max`、`.dock` 宽度都要补偿，改动面最大）；书脊上若出现成句中文即违规；readouts 竖排后每条 44px 高 × 3 = 占侧栏 132px，1440 无碍、768 需 `--space` 收紧。
- **借鉴**：Notion「导航永远左侧栏、Home 只是入口 + 指挥中心」https://cloud.tencent.cn/developer/article/2392998 、https://smallwinstw.com/notion-home/ ；Things 3「Slim Mode 可收侧栏、无底部 tab bar」https://culturedcode.com/things/features/ ；Feedly「左树/中流/右预览三栏驾驶舱」https://developers.feedly.com/docs/personalization-reading-experience ；Linear「侧栏即全局 chrome」https://linear.app/now/how-we-redesigned-the-linear-ui （05 §1/2/4，09 §三-B）。

---

## 3. 候选三 ·「指令」Command Row（高密度 × 行动优先混血）

- **名字**：指令（前缀 `--cm-*`）
- **一句话结构**：删掉标语后首页第一格不是欢迎语而是**一枚长得像搜索框的主 CTA**（sticky 在滚动区顶缘，假光标 + `⏎` keycap + `<GO>` 尾注），其下是一整列**发丝线分隔的 44px 密行**：readouts 整组关闭，today-card/spec 全部拆壳摊平成同一张行表——标签居左、点线引导、tabular 值靠右，约 9 行「行情」加两条功能行加一条承诺句注，零卡片、零圆角容器、零阴影。
- **数据去留**：
  - 保留：spec 4 行（阶段/今日新词/**今日批次**/已学 → 行表前段，批数在此守住唯一源）、figures 的 到期(done/total)/逾期(带计划 N)/连续（行表后段）、`__links` 两链（「MENU」式功能行 1. 错词本 2. 日历，整行 44px 可点）、T9 承诺句（列尾 2px 左边框注行）、masthead 压成行表第一行 14px 灰字系统行 `词笺 · 2026-11-24`。
  - 砍掉：title/lede（强制）、`.start__meta`（readout 副本）、`.readouts` 整组（今日/批数/已学 = spec 行副本——注意与 bento「等宽读数条」的正面冲突就在这条上规避）、figure 新词行（spec 今日新词的副本）、kicker/eyebrow（阶段信息 spec 行已含；或 kicker 留作行表 section 头 mono 短码）。
- **主 CTA**：**顶部 sticky 命令栏**（不是贴底）：`.start__actions{position:sticky;top:0;z-index:3;order:-1}`（借 `body{display:contents}` 成为 `.start` 直属网格子项），满宽、52px 高、1px 边框、面底色、左对齐文案、`::before` 闪烁光标、`::after` 固定 keycap「⏎」；按下态 inset 变色不做位移。
- **CSS 手段**：`.start__body,.today-card,.today-card__head,.today-card__figures,.start__spec{display:contents}`；`__figure,.start__spec-row{display:grid;grid-template-columns:7em minmax(0,1fr) auto;min-height:44px;border-top:1px solid var(--border)}`；引导点线 = 标签 `::after{content:"";flex:1;border-bottom:1px dotted}`；数字一律 `font-variant-numeric:tabular-nums` 右对齐；`__links .btn--text` 去按钮化铺满整行 + `::after{content:"›"}`；逾期行 `.today-card:has(.is-warn)` 才给红字；reason 保持文字行（**不做成进度条**——任何 `::before{width:60%}` 假填充一律禁止）。
- **三档**：360=单列行表（天然零溢出，行内 `min-width:0` + ellipsis）；768=**行表分双栏**（CTA 与系统行 `grid-column:1/-1` 通栏，左栏=数据行、右栏=功能行+附录，中缝 `border-inline-start`）——可上真双栏；1440=限宽 760 居中，两侧各一条通高 hairline「终端屏框」，topbar__meta 开成右对齐 mono 状态串。
- **风险**：首屏 9–10 行的密度会压小字 → 行高锁 44px、标签中文 14px、只有 keycap/短码允许 11px 拉丁；「输入框」外观的按钮没有真实光标位（`text-align:start` 后文案要留 caret 位）；与 foundry 的边界：foundry 是块面工单质感，本候选是**跨组件熔平成一张连续行表 + 输入框隐喻**，行原子来自四个不同 DOM 源——若 foundry 已占「行表」需再拉大 CTA 形态差。
- **借鉴**：Raycast「输入框即首页，40px 结果行 + 行尾 keycap」https://manual.raycast.com/search-bar.md 、https://typenorm.com/apps/raycast ；Linear「44pt 行、sticky 分组头、行尾计数 chip」https://github.com/feimacode/open-design-agent-kit/blob/f99b3caeb91b7410d54610f3a2e41744adfccff7/packages/content/assets/open-design/design-systems/linear-ios/DESIGN.md ；Bloomberg「WATCHED 行表 + 命令行 `<GO>`」https://datacenter.safe-frankfurt.de/documents/Bloomberg_help_page.pdf 、https://www.infoq.cn/article/ctihfrlcmehr7lnebbgu ；FT「hairline 列表而非卡片」https://www.poynter.org/reporting-editing/2014/financial-times-a-classic-redesign-for-the-digital-age/ （05 §2/6，09 §三-1/3/6）。

---

## 4. 候选四 ·「目录」Contact Sheet（编号系统族 × 高密度）

- **名字**：目录（前缀 `--ix-*`）
- **一句话结构**：首屏焦点是**一张全部等大的编号方格阵**（Are.na 接触印相语法 + Braun 价签编号）：数据、入口、批数拆成约 8 个同权格，每格 = 左上 `01/02…` 序号 + 居中 tabular 值 + 下方 14px caption，格间用 1px 缝线（`gap:1px;background:线色`）；主 CTA 是网格中**一行通栏的「票签格」**（`grid-column:1/-1`），网格上方一行刊头（masthead+kicker 小字）。没有主格、没有尺寸游戏、没有阴影。
- **数据去留**：
  - 保留（格内）：新词/到期/逾期/连续 4 个 figure 值、批数（spec 行 3 单独成格「05 批次」）、错词本 N 与学习日历（两链各成 2 格，整格可点 ≥44px）、阶段+总词数（eyebrow → 刊头行）、T9 两句（网格下方通栏注行，不进格）、foot。
  - 砍掉：title/lede（强制）、readouts（副本）、meta（副本）、spec 阶段/新词/已学 3 行（阶段=刊头、新词=格 01、已学→我的页 stat 已有）——**已学从首页消失**：日历 hero 与我的页均有等价，属安全砍。
- **主 CTA**：网格通栏格，56px 高、直角（radius 0）、单强调色满铺、`::after` 静态 `<GO>` 小码；位置在数据格第一屏段之后（360 时约第 2 屏段首，保证「矩阵→票签」动线）；不 sticky。
- **CSS 手段**：`.start__body,.today-card,.today-card__head,.today-card__figures,.start__spec,.today-card__links{display:contents}`，`.start{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:var(--border-strong);counter-reset:cell}`；每个可见叶单元 `counter-increment:cell` + `::before{content:counter(cell,decimal-leading-zero);font:500 10px/1 var(--mono)}`（拉丁数字小码，合规）；格 `background:var(--surface);min-height:72px;display:grid;place-content:center;gap:4px`，`__tag` order 后置于 caption 位；序号格不锁 `aspect-ratio:1`（09 笔记的 360 教训：方形格吃掉半屏高）。
- **三档**：360=3 列 × 约 112px 格（caption「连续优秀」4 字 ×14px 放得下）、两行数据 + 票签在上半屏；768=4 列 + 网格外加双线外框（`box-shadow:0 0 0 1px,0 0 0 4px var(--bg),0 0 0 5px`，FT 数据框语法，配 `margin-inline:5px` 防溢出）；1440=6 列一行开完全部格（档案柜抽屉感），限宽 1200。768 可上真双栏吗——本候选立场是**不做双栏**，用「单张全宽索引表」与左舷/指令的栏语法拉开距离。
- **风险**：**五候选里离 bento 最近**，差异必须靠「严格等大 + 缝线网格 + 序号扫描 + 通栏票签」四件套同时成立，任何一格改大小就退化回 bento，需实现后对照截图验收；360 下 8 格+CTA+注行可能超出一屏 → 接受滚动但首两行必须在；缝线网格在深色档要重算线色对比；序号 `01` 装饰可能被误读为「第 1 批」——序号格内不再出现裸数字前缀歧义（批次格的 caption 明写「批次」）。
- **借鉴**：Are.na「等大 block 接触印相网格、caption 永远在下、hairline 代替盒子」https://designbycurio.com/learn/are-na-blocks-channels-2014 、https://ixd.prattsi.org/2026/02/design-critique-are-na-ios-app-2/ ；Braun「编号 + k/v + 一根细线的价签系统」https://onlyonceshop.com/blog/the-braun-grid-system ；Nothing「数据降为网格噪声、单一读数上浮」https://www.aiginer.com/labs/references/nothing/ ；大众点评「金刚区矩阵即首屏焦点」https://www.woshipm.com/pd/642375.html （08 §2/3，09 §三-8，11 §4）。

---

## 5. 候选五 ·「速报」Chyron Band（高密度族）

- **名字**：速报（前缀 `--ch-*`）
- **一句话结构**：首页是一屏**锁死不滚的电视字幕条（chyron）**，横向三带按「信息海拔」分层：上带=常驻 `.readouts` 直接化身的「频道台标 + 行情条」（3 格 k/v + 呼吸点）；中带=**唯一巨数**——到期复习 done/total（`clamp(64px,22vw,140px)`），左缘竖排阶段短码条、右下两条 48px 中数（逾期/连续）与主 CTA 分栏咬合；下带=spec 四行压成的 4 列小字格 + links 两钮 + reason 承诺句一行 + foot。全元素不删只降级为三档字号带，「滚是失败」。
- **数据去留**：
  - 保留：全部——readouts 上带（批数唯一源在此，另 spec 行 3 下带重复保留一份作冗余）、figures（到期=巨数、逾期/连续=中带小字；新词 figure 隐藏，下带 spec 行 2 承担）、spec 4 行（下带格）、links、T9 两句（下带尾行 + 巨数下注）、masthead 日期（上带台标位）。
  - 砍掉：title/lede（强制）、meta（副本）、kicker（转为中带左缘 `writing-mode:vertical-rl` 竖条）、eyebrow（阶段已在 spec）。
- **主 CTA**：中带**与巨数同排的分栏块**：约 38% 宽、`clamp(64px,10vh,96px)` 高实心色块、方角、与巨数共一条基线；不是贴底条、不是输入框、不在票里——「巨数是头条、CTA 是版面右侧的行动栏」，如通讯社头版大故事旁的板块钮。
- **CSS 手段**：`.start{display:grid;grid-template-rows:auto minmax(0,1fr) auto;min-height:calc(100dvh - var(--tb,56px) - var(--rd,34px))}`（topbar/readouts 实际高度以实测定 `--tb/--rd`）；`.readouts{display:flex}` 三格 `flex:1 1 33%` + `border-inline-start` 分格 + `.brand__dot::after` 呼吸点（`prefers-reduced-motion` 关）；figure#2 `<b>` 巨数化 `font-size:clamp(64px,22vw,140px);font-variant-numeric:tabular-nums`，其余 figure `display:none`/小字化；`.start__spec{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}`；`.today-card{display:contents}`、`__head{display:contents}`、label 并入上带、links 进下带格；中带 `overflow:hidden` 兜底防短屏撑破。
- **三档**：360=三带压缩 `auto 1fr auto`，巨数 20vw，下带允许 `overflow-y:auto` 微滚但巨数永驻；768=中带拆「巨数 50% / 小数值 25% / CTA 25%」三栏、下带 6 列——可上真多栏；1440=全带限宽 1400 居中 + 两侧竖规线，大屏塞得更满（终端哲学）。
- **风险**：**离 instrument（仪表分区）最近**——差异声明：instrument 是纵向可滚的功能分区面板，速报是横向海拔分带 + 屏幕锁定 + 巨数作头条；若评审仍觉近，可把上带行情条改为「台标一行」弱化表盘感；360 矮屏（<640）三带最危险，巨数行高 + 下带 4 列中文格（每格约 80px）可能挤爆 14px 底线 → 下带 caption 只留 2 字词 + line-clamp；红色只给逾期小值与 is-warn；呼吸点动效要 reduced-motion 关闭。
- **借鉴**：Bloomberg Mobile「顶部市场条常驻 + feed」https://www.businessinsider.com/bloombergs-new-app-2013-10 、https://screensdesign.com/showcase/bloomberg-business-news-daily ；财新「行情必须置顶 / 列表是默认原子」https://baoyoubin.blog.caixin.com/archives/24772 ；ENVY 头版语法 breaking bar→大故事→字幕索引 https://envydesign.jp/patterns/en/article-news-top/ ；Fantastical「先看今天长什么样」的刻度带前置思想 https://flexibits.com/fantastical-ios/help/calendar-views （09 §三-2/7，05 §3）。

---

## 6. 五候选对照

| | 焦点（首屏第一落点） | 版面轴 | CTA 锚点与形态 | 首页数据量 | 撞车对象与距离 |
|---|---|---|---|---|---|
| 传票 | 全宽登机牌复合单据 | 单据实体（非栏非带） | 票内右联存根，48px 实心方角 | 中（1 巨数+3 小值+票头） | foundry？远（foundry 无物理单据） |
| 左舷 | 右列章题 + 左缘常驻轨 | 纵向双栏拓扑 | 右列底部 sticky 动作条 | 中高（readouts 上轨） | bento 远；改动面最大 |
| 指令 | 顶部输入框式 CTA | 一维行表（线分隔） | 顶部 sticky 命令栏 | 最高（9–10 行全留） | bento（读数条）以关闭 readouts 规避；foundry 需盯 |
| 目录 | 等大编号格阵 | 零层级网格 | 通栏票签格（grid 内） | 中高（8 格） | **bento 最近**，靠等大+缝线+序号四件套自证 |
| 速报 | 中带唯一巨数 | 横向分带锁屏 | 中带分栏色块 | 中（全留但三档海拔） | **instrument 最近**，靠「海拔分带+禁滚+头条巨数」自证 |

推荐排序（供拍板参考）：**指令 > 左舷 > 传票 > 速报 > 目录**。

---

## 7. 反换色清单 ——「怎样才叫结构不同」的五条可操作判据

（从四族笔记互证提炼；每条给「判据」与「反例」）

1. **换容器语法，不是换容器皮肤。** 密度来自线与行，不来自 gap+阴影+圆角的缩放（Feedly「密 = 线，不是小字号」；FT/Linear 全部 hairline 行）。**判据**：数首屏「有边框/底色的容器」个数——七套旧版都是 3 个以上卡片块；结构级新骨架应当 ≤1 个（或全部退化为线）。若把卡片描边与底色删掉后版面塌回原样，说明没换结构。
2. **CTA 三要素至少两个换掉：锚点、形态、隐喻。** play 的居中厚按钮、bento 的磁贴内钮、nocturne 的排印尾钮都在「文档流中部/末尾的胶囊/块」语法里。本批候选把 CTA 分配到五个不同锚点：顶部输入框 / 票内右联 / 列底 sticky / 通栏票签 / 中带分栏。**判据**：画 120×260 缩略图，标 CTA 重心坐标（上/中/下 × 左/中/右）——与旧七套的落点格完全相同即作废；形态隐喻也要变（命令/开关/单据/索引卡，而非「一枚按钮」）。
3. **换阅读轴与拓扑，不换表皮。** 轴清单：纵向文档流（旧版全员）→ 一维行表（指令）、零层级格阵（目录）、横向海拔带+锁屏（速报）、双栏轨+流（左舷）、单实体复合单据（传票）。**判据**：回答「视线第一落点在哪、滚动轴是几根、把窗口拉宽到 1440 版面长什么样」——若三答与旧版一致（上 1/3、单轴、只是变宽居中），是换色。**768 起能长出旧版没有的栏/带行为**是强信号（左舷的页面级侧栏、指令的行列分栏）。
4. **让 DOM 顺序失效。** 版面必须由显式 `order` / `grid-area` / `display:contents` 重排决定，而不是顺着 DOM 文档流加 margin——Things/Notion 的「同内容不同骨架」证明顺序即结构。**判据**：心算「DOM 顺序打乱后版面是否变」；若答案是不变，版面只是纸皮；本批候选里传票（actions 与 today-card 叠进同一网格区）、目录（四个不同容器熔成一张格阵）、左舷（readouts 从横条翻成竖轨）都过不了「顺流测试」，这正是结构。
5. **数据换形态，且绝不换真假。** 同一个 `pendingReviews`：行表里是右对齐 tabular 值（指令）、票里是存根小字（传票）、轨上是点亮读数（左舷）、格里是居中巨值（目录）、屏上是 22vw 头条（速报）——数字的**呈现形态**换了才算骨架换。**判据**：逐项点名三项首页独享数据（批数 / 待复习合计 / 承诺句）在该候选中的选择器与形态；同时检查伪元素——凡出现固定宽度的假进度填充、写死的计数、假时间戳，一票否决（09 笔记红线：伪元素只许静态短码）。

---

## 8. 来源总索引

- 05-productivity.md：Things 3 https://www.ifanr.com/app/862042 、https://culturedcode.com/things/features/ ；Linear https://linear.app/now/how-we-redesigned-the-linear-ui ；Fantastical https://flexibits.com/fantastical-ios/help/calendar-views ；Notion https://cloud.tencent.cn/developer/article/2392998 、https://smallwinstw.com/notion-home/ ；Todoist https://ixd.prattsi.org/2024/01/design-critique-todoist-ios-app/ ；Raycast https://manual.raycast.com/search-bar.md 、https://typenorm.com/apps/raycast ；Superhuman https://designbycurio.com/learn/superhuman-keyboard-email-2017
- 09-news.md：Bloomberg https://www.bloomberg.com/company/stories/how-bloomberg-terminal-ux-designers-conceal-complexity/ 、https://www.infoq.cn/article/ctihfrlcmehr7lnebbgu 、https://screensdesign.com/showcase/bloomberg-business-news-daily ；Feedly https://developers.feedly.com/docs/personalization-reading-experience ；Inoreader https://www.inoreader.com/help/basic/article-view/what-layout-options-are-available ；FT https://www.poynter.org/reporting-editing/2014/financial-times-a-classic-redesign-for-the-digital-age/ ；财新 https://baoyoubin.blog.caixin.com/archives/24772 ；Are.na https://designbycurio.com/learn/are-na-blocks-channels-2014 ；头版语法 https://envydesign.jp/patterns/en/article-news-top/
- 08-industrial.md：TE https://pageproofer.com/inspiration/calm-minimal/teenage-engineering/ ；Nothing https://www.aiginer.com/labs/references/nothing/ ；Braun https://onlyonceshop.com/blog/the-braun-grid-system ；Dyson https://opendesign.cc/zh-CN/sites/dyson ；Aesop https://zeroheight.com/5d543d8ca/p/616884-layout ；Apple https://github.com/changeroa/stylegallery/blob/0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff/showcase/apple-iphone/brief.md
- 11-travel.md：Airbnb https://news.airbnb.com/product-releases/airbnb-2025-summer-release/ ；Booking https://goodui.org/blog/reverse-engineering-booking-coms-homepage-design-optimizations/ ；Uber https://github.com/xitu/gold-miner/blob/master/TODO/designing-the-new-uber-app.md ；大众点评 https://www.woshipm.com/pd/642375.html ；高德 https://www.uisdc.com/hunter/0221646250.html ；携程 https://m.163.com/dy/article/JSHUTCI30531RSPL.html
- 结构事实：`docs/research2/00-data-inventory.md`（S4/S13 批数、T2/T9 入口与承诺句、七项独享结论）、`docs/SKIN_BRIEF.md`（DOM 清单、钩子默认隐藏表、硬指标）。
