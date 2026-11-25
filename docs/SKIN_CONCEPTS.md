# v9 首页再设计 · 三版皮肤规约（结构级重做，不是换色）

> 用户否掉了 v8 的三版：「基本上是一个 UI 换了色，本质没变」+「首页那个功能介绍必须删掉」+「首页不必展示全部数据」。
> **保留 `bento` 与 `nocturne`**，`play` 作废，本轮再出三版新方向（候选总数：paper/foundry/instrument/broadsheet/bento/nocturne + 新三版 = 9）。

## 0. 本轮硬规则（三条不可谈判）

1. **删掉功能介绍**：新皮肤一律 `.start__title, .start__lede { display: none }`。
   也不许用伪元素 `content` 把「一页五个词，看一遍就会」或玩法说明以别的形式补回来——
   伪元素大字只能是装饰性单词/序号/单位，不得承担信息职责，不得与现有文本重复。
   （现有四套皮肤与 `app.css` 仍不动，是否全局删除等用户拍板。）
2. **hero 焦点必须换对象**：焦点只能是 ① 主 CTA 本身 ② 一个数字 ③ 日期/时间 ④ 版面结构（网格、留白、形状）之一。
   「大标语 + 说明段」这个组合从此在新皮肤里不存在。
3. **数据可以不在首页**：每个数字首页最多出现一次；要砍就砍干净，但砍掉的数据必须在别的页面已经看得到
   （依据 `docs/research2/00-data-inventory.md`：日历 hero `CalendarScreen.tsx:155-216` 与「我的」`ProfileScreen.tsx:96,242-245,333-339,352-359` 有等价展示）。
   **只有首页有的三项**：今日批数 `todayBatchCount`、待复习合计 `pendingReviews`、「先复习后新词」承诺句——
   谁要砍，必须在方案里写明去处（最省事是日历页 `cal-figures` 追加两行，但那是改 DOM，单独决策）。

## 1. 「结构不同」的判据（至少命中 3 条，否则作废）

v8 的毛病是七套皮肤全都沿用了同一条竖排流：`masthead → kicker → eyebrow → title → lede → meta → spec → actions → today-card → foot`，
只在上面刷颜色。可用的骨架级杠杆（**v8 七套皮肤一次都没用过**，来自 `synth-glance` 的手段盘点）：

| 手段 | 能打开什么结构差异 |
|---|---|
| `order` + 改 `.app` 的 flex 方向 | `.topbar` / `.readouts` / `.app__main` 是 `.app` 的三个直接子项 → 读数条可以从顶部挪到**底部常驻状态栏** |
| `.app` 改 `display:grid` | ≥768 可以做**真侧栏仪表盘**（左栏放品牌+读数+脚注，右栏放今日计划） |
| `display:contents` | `.today-card` 外壳可以**消失**，四个 `__figure` 直接成为 `.start__body` 的网格格子；`.start__body` 的七个子元素本来就是同一层，可任意重排 |
| `position:sticky` / `fixed` | 主 CTA 变成**底部满宽常驻操作条**，或首屏顶部**行动优先**（Uber/Airbnb 式：先给按钮，数据在后面） |
| `scroll-snap` | 横向货架（音乐 App 的「继续听」式一行卡），首页从「滚动读」变成「横向拨」 |
| `clip-path` / `mask` / 对角线 | 游戏菜单式（Persona 5）的斜切版面、非矩形分区 |
| `conic-gradient` | 环形进度/仪表盘（Apple Fitness 式）——**但必须接真数据，否则就是假进度，直接作废** |
| `writing-mode` | 竖排书脊/侧边刊名（日式/工业风编号轨） |
| `counter` | 给 `.start__spec-row` / `.today-card__figure` 自动编号（Teenage Engineering / Nothing 的 01 02 03 编号系统） |
| 伪元素 + `attr()` 之外的静态文本 | 单位、序号、装饰词；注意不可与现有文本重复报数 |

## 2. 共同禁令（沿用 v8，仍然有效）

- 红色只用于逾期 / 错词 / 危险操作；`--warning` 只做提醒。
- 静态装饰**不许长得像进度**：实心 accent 段、填充刻度、点亮圆点都会被读成完成度。装饰一律走 `--border` / `--text-tertiary` 级灰。
- 装饰线不标状态；状态一律走填充色或 ≥3:1 的 `--border-strong`。
- 玻璃拟态 / 发光 / 渐变最多一处，且只能在常驻层。
- 语义色必须浅、深两档各写一遍（历史 bug 高发区）。
- 不许 `filter: invert()`；不许联网字体/图片；只用自托管五款字体。
- 硬指标：AA 正文 ≥4.5:1、大字 ≥3:1；点击目标 ≥44×44；360px 零横向溢出；含中文正文 ≥14px（>4 个汉字低于 13px 直接 FAIL）；≤2 字体族；≤1 强调色；≤3 档阴影。

## 3. 候选收敛

三路收敛笔记：`docs/research2/synth-glance.md`（一瞥型：健身/天气表盘/习惯/金融）、
`docs/research2/synth-action.md`（行动型：效率/新闻终端/工业编号/出行）、
`docs/research2/synth-immersive.md`（沉浸型：游戏菜单/先锋网页/音乐货架/阅读书架）。
共 15 个候选。淘汰理由：目录（离 bento 最近）、速报（离 instrument 最近）、台账/名册/指令（三者同为「hairline 行表」，与保留中的 nocturne 撞型）、
脊架（参差书脊高度＝假柱状图）、合环（刻度环无真数据可填＝装饰性仪表盘）、平面图（360×640 角钉压字风险最高）、
浮岛（吞滚动）、装订边（单线版面与巨数焦点与本案 deck 争焦点）、传票（票据隐喻最讨喜但 clip-path 有点击死区风险，留作后备）。

**拍板三版 = `desk` 案头 / `deck` 叠章 / `vinyl` 唱盘**，分占三条互斥的骨架轴：**栏（拓扑）／栈（深度）／横（阅读轴）**。

### 实测背书（2026-11-25，390×844 与 768×900，临时注入样式，测完即删）

| 手段 | 实测结果 |
|---|---|
| `.app:has(.start){display:grid}` + `.readouts{grid-column:1;grid-row:2}` | 768 下读数条变 **200×840 左栏**，`main` 让到 `205,60 558x840`，topbar 通栏，零溢出，main 仍可滚 ✅ |
| `.readouts{order:3}` + `.app__main{order:2}` | 390 下读数条落到 **y=816 底部常驻**，main 自动缩到 756，零溢出，不用 `fixed` ✅ |
| `.start__body`/`.today-card`/`.today-card__figures` 三连 `display:contents` | 四个 `__figure` 从卡内 `59×34` 小字升为 `.start` 网格子项 `247×95`；主 CTA 从满宽 350 缩成 91 ✅ |
| 多块 `position:sticky` + 递增 `top` | 滚动 260px 后各块仍钉在各自 `top`（figures 306→270），压栈成立；**但必须给每块不透明底色 + z-index 递增**，且 `.today-card__figures` 基线是 `flex-wrap:wrap`，横轮要显式 `nowrap` ⚠️ |

---

## D. `desk` 案头 —— 首页是一台有抽屉的案

**气质**：专业工作台。左边一列永远在的「抽屉」，右边是今天要做的事。桌面级双栏是它最大的发明——现有七套在 768 以上全都只是「变宽的手机版」。

| token | 浅色 | 深色 |
|---|---|---|
| `--bg` | `#F4F1EA` 暖纸 | `#141613` 墨案 |
| `--rail`（侧栏/轨底色） | `#1F2420` **常驻深色抽屉**，浅深两档都是深色 | `#0D0F0D` |
| `--surface` | `#FFFFFF` | `#1B1E1B` |
| `--ink` | `#1B1F1C` | `#E8EAE6` |
| `--accent` | `#20623F` 松绿（白字 6.1:1） | `#63C48A`（对 `#0D0F0D` 9.8:1，`--on-accent #06230F`） |
| 字体 | IBM Plex Sans（界面）+ IBM Plex Mono（轨内读数/编号） | 同 |
| 圆角 | 2 / 4 / 6，轨内条目直角 | 同 |
| 阴影 | **0 档**（层级靠栏与线，不靠投影） | 同 |

**骨架（选择器级指令）**
1. 360–767：`.start{display:grid;grid-template-columns:44px minmax(0,1fr)}`。
   左 44px 是「轨」：`.start__masthead` 用 `writing-mode:vertical-rl` 竖排（**只放拉丁/数字/日期**，成句中文不许进竖排），
   `.readouts` 关（`display:none`），轨底用 `.start__foot` 收口。右列是内容。
2. ≥768：`.app:has(.start){display:grid;grid-template-columns:212px minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}`；
   `.topbar{grid-column:1/-1}`；`.readouts{display:flex;flex-direction:column;grid-column:1;grid-row:2;background:var(--rail);color:…}`；
   `main.app__main{grid-column:2;grid-row:2}`。**必须用 `.app:has(.start)` 限定**，否则日历/我的/列表页会多出一条空抽屉。
3. 内容列：`.start__body{display:contents}` + `.today-card{display:contents}` → 四个 `__figure` 与 spec 行成为同一列的行清单，
   每行 `min-height:44px`、左标签右 `tabular-nums` 值、行底 1px `--border`。
   `.today-card__head` 做 sticky 分组头（`top:0`，`--rail` 底色）。
4. **主 CTA**：右列**底部** `position:sticky;bottom:0` 满宽 52px 动作条（限定 `.start__actions`，不外溢到其它页的 `.btn--primary`）。
   锚点在「列底」——七套皮肤没有一版把 CTA 放在常驻底缘。
5. 焦点替代：删 `.start__title/.start__lede` 后，右列顶端由 `.start__eyebrow` 升格为 26px「今日」章题（真实 DOM 文本，非伪元素）。

**数据纪律**：首页保留 3 读数（进侧栏）+ 4 figure（进行清单）+ 批数（spec 第 3 行）+ 承诺句（`.today-card__reason:last-of-type`）+ links；
砍 `.start__meta`、spec 1/2/4 行（阶段=kicker 已有；今日新词/已学=读数副本，日历 hero 与我的页有等价）。每个数字首页只出现一次。

**风险**：`.app` 改网格会连带 topbar 的 sticky 语义（实测 topbar 通栏正常）；44px 竖轨在 360 下与 `.screen` 的 `--page-x` 20px 冲突 → 轨要 `margin-inline:calc(-1*var(--page-x))` 出血贴屏边并自补 padding；深色抽屉在浅色模式下必须保证轨内文字 ≥4.5:1（`#F4F1EA` 文字对 `#1F2420` = 12.6:1 ✅）。

---

## E. `deck` 叠章 —— 层级不是并置，是遮挡

**气质**：一摞压在桌面上的卡片，后一张把前一张顶得只剩一条边。**它是七套里唯一用「深度/时序」表达层级的**——
bento 靠磁贴并列差、nocturne 靠字号差，本案靠「谁盖住谁」，滚动时上面的章一条条压住下面的。

| token | 浅色 | 深色 |
|---|---|---|
| `--bg` | `#EFEDE8` 灰纸台 | `#101010` |
| `--surface` | `#FFFFFF`（章面） | `#171717` → 逐层 `#1D1D1D`/`#232323` 抬亮 |
| `--ink` | `#17171A` | `#F2F2F0` |
| `--accent` | **`#17171A` 纯墨**（CTA 是墨块，白字 16.1:1） | **`#F2F2F0` 反墨**（CTA 白块黑字） |
| 字体 | Space Grotesk（标题/数字）+ 系统 CJK；正文 IBM Plex Sans | 同 |
| 圆角 | 章面 12，章内条目 4 | 同 |
| 阴影 | **3 档柔和投影**（`0 1px 2px`/`0 4px 12px`/`0 12px 28px`，低对比）——与 nocturne 的「零阴影」正面对立 | 同（深色档降不透明度） |

**骨架**
1. `.start{display:flex;flex-direction:column;gap:10px}`；`.start__body{display:contents}`；`.today-card{display:contents}`。
2. 六个章块各自 `position:sticky` + 递增 `top`（0 / 26 / 52 / 78 / 104 / 130）+ 递增 `z-index` + **不透明底色**（实测必须给底色，否则透穿）：
   ① `.start__masthead`（题章：词笺 + 日期）② `.today-card__head`（今日章：日期 + links）③ `.today-card__figures`（数据章）
   ④ `.today-card__reason`（批注章）⑤ `.start__actions`（行动章 = 主 CTA）⑥ `.start__foot`（页脚章）。
   `top` 偏移必须扣掉 `.topbar` 实际高度（实测 60px）：sticky 的参照是 `.app__main` 滚动口，所以 `top` 从 0 起算即可（实测有效）。
3. **首屏只有一个数**：顶章是「今日任务」——`.today-card__figure:first-child` 的新词数放大到 40px 作章面主角，
   其余三个数在后面的章里，滚动才露出。这是三版里最克制的一版（首页数据量最少）。
4. **主 CTA**：长在**行动章内部**的满宽墨块（56px，圆角 12），不是页底条、不是药丸——「CTA 是一张卡，卡就是按钮」。
   按压态：`translateY(2px)` + 阴影收浅（不是 play 那种厚底边回弹，play 已作废）。
5. 删 `.start__title/.start__lede/.start__meta/.start__spec`（整块关）；批数与待复习合计**不丢**：
   批数进 `.today-card__figure:first-child` 内的 `__tag` 同章小字（用 spec 第 3 行留在题章下方，`display:block` 单行）；
   承诺句用 `.today-card__reason:last-of-type` 做批注章正文。

**风险**：sticky 章块在矮屏（≤640）会互相压死 → `@media (max-height:700px)` 退化为「只钉题章 + 行动章」；
阴影三档在深色档必须重算（深色用抬亮底色代替投影，投影只留 1 档）；
`.today-card` 拆 contents 会丢 `aria-label="今日学习摘要"` → 用 `__label` 的可见文字补偿；
章块高度必须 ≥ 其 `top` 偏移，否则露不出「一条边」的层叠感（实测每章 min-height 64px）。

---

## F. `vinyl` 唱盘 —— 首页是横过来的

**气质**：一整套翻转过阅读轴的唱片架。**七套皮肤的主内容全是纵向文档流，本案的主内容是一条横向吸附的轮**，
外加底部一条常驻读数带（像播放条）。这是「本质不是同一个 UI 换色」最直白的回答。

| token | 浅色 | 深色 |
|---|---|---|
| `--bg` | `#F7F5F2` 温灰 | `#121113` |
| `--surface` | `#FFFFFF` | `#1A191C` |
| `--ink` | `#141215` | `#EDEAF0` |
| `--accent` | `#A62A5E` 洋红（白字 6.0:1） | `#F27DA8`（对 `#121113` 8.9:1，`--on-accent #2A0916`） |
| 字体 | Space Grotesk（盘上数字/标题）+ IBM Plex Mono（底带读数） | 同 |
| 圆角 | 盘 999，其余 6 / 10 | 同 |
| 阴影 | 1 档 `0 1px 0`（盘的厚度用 `box-shadow: 0 3px 0 --surface-sunken` 模拟唱片叠边，属同一档语义） | 同 |

**骨架**
1. **横轮**：`.today-card{border:0;background:none;box-shadow:none;padding:0}`；
   `.today-card__figures{display:flex;flex-wrap:nowrap;gap:14px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;
   margin-inline:calc(-1*var(--page-x));padding-inline:var(--page-x);padding-block:12px 18px}`（**必须显式 `nowrap`**，基线是 wrap，实测会掉第二行）。
2. **盘**：`.today-card__figure{flex:0 0 auto;width:88px;height:88px;border-radius:50%;display:grid;place-content:center;
   white-space:normal;line-height:1.1;text-align:center;scroll-snap-align:start;background:radial-gradient(circle,var(--surface-sunken) 0 5px,var(--surface) 5.5px 100%)}`
   （内圈硬停＝唱片孔）。第一盘 104px（`--disc-lg`）作主角。360 下 104+88×2+14×3=338，第四盘半切在屏边＝「可滑」的暗示（SoundCloud 露两张半的纪律）。
   盘内标签只有两字（新词/到期/逾期/连续），14px，`min-width:0`，实测不溢出。
3. **底部常驻带**：`.app__main{order:2}` + `.readouts{order:3;display:flex}` → 实测落 `y=816`，零溢出，不用 `fixed`。
   带内 `.readout:nth-child(1)`（今日）**关**（与盘 1 重复），只留「批数」「已学」两格 + 右缘 `.brand__dot` 呼吸点（`prefers-reduced-motion` 关动效）。
4. **主 CTA**：**内联药丸**贴在货架头行（`.today-card__head` 与 `.start__actions` 同一 grid 行分列两端），
   `min-height:44px;min-width:132px;width:auto;border-radius:999px`——CTA 从「页底的控件」变成「货架头的动作」（YTM Play-all 的语法）。
   360 挤不进时 `@media (max-width:399px)` 回退为轮下方通栏 48px 条。
5. 删 `.start__title/.start__lede/.start__meta/.start__eyebrow/.start__masthead`；
   `.topbar__meta` 开成 30px 大标题位（真实 DOM：阶段名 + 今日 N 词）填焦点空位——**注意与盘 1 的「新词」重复**，
   故 `.topbar__meta` 只留阶段名（`:nth-child` 关数字位，bento 已有先例），总词数/已学进底带。
6. spec 只开第 3 行（批数）作轮下 mono 小条；承诺句 `.today-card__reason:last-of-type` 作轮下第二行。

**风险**：横向滚动容器在 `.app__main{overflow-x:hidden}` 内自滚是允许的（实测 `pageOvf:false`），但要实测 sticky topbar 与轮的层叠；
底带吃掉约 40px 屏高 → `@media (max-height:640px)` 底带降为单行；
盘内 `8/14` 类比值 22px 需 `letter-spacing:-.02em` 防撑圆；
洋红不许用在逾期上（红色专属），逾期盘用 `--warning` 只在 `:has(b.is-warn)` 时点亮。

---

## 4. 三版互斥性自检（评审时逐条对照）

| 轴 | desk | deck | vinyl | bento（保留） | nocturne（保留） |
|---|---|---|---|---|---|
| 阅读轴 | 纵向双栏（轨+流） | 纵向但**遮挡堆叠** | **横向**为主 | 纵向磁贴阵 | 纵向排印文档 |
| 首屏焦点 | 侧栏抽屉 + 章题 | 顶章（一个数） | 圆盘横轮 | 大磁贴 | 排印段 |
| CTA 锚点 | 列底 sticky 条 | 行动章内部 | 货架头内联药丸 | 磁贴内块 | 排印尾行 |
| chrome 移动 | 768 起真侧栏 | 无 | 读数带沉底常驻 | 无 | 无 |
| 首页数据量 | 高（7 项，各一次） | **最低**（首屏 1 项） | 中（4 盘 + 2 带） | 7 项 | 2 项 |
| 阴影语言 | 0 档 | **3 档柔和** | 1 档 | 1 档硬边 | 0 档 |
| 强调色 | 松绿 `#20623F` | **无彩（墨黑）** | 洋红 `#A62A5E` | teal `#0E7C86` | 蓝 `#1E4E8C` |

## 5. 实现分工与验收

- 每个 agent **只写自己那一个文件** `src/styles/skins/{desk,deck,vinyl}.css`，注册（`types.ts`/`storage.ts`/`skins.ts`/`main.tsx`）由主设计者统一做。
- 禁止：`!important`、裸 `:root`、联网字体/图片、改 DOM、动 `app.css`/`tokens.css`/`skin-hooks.css`/其它皮肤文件。
- 语义色（`--danger/--warning/--success`）必须浅、深两档各写一遍。
- 验收：`scripts/audit-skins.js` 跑 3 皮肤 × 明暗 × 360/768/1440 = 18 组，要求
  溢出 0 / 对比度不达标 0 / 点击目标 <44 0 / 中文小字 <13px 0 / 元素出列 0 / 主 CTA 在首屏 18/18。
- `play` 作废：从 `types.ts`/`storage.ts`/`skins.ts`/`main.tsx` 摘掉注册，`play.css` 移入 `docs/v8-variants/` 存档（用户若要留作参考可还原）。

---

# v8 首页再设计 · 三版皮肤规约（v2 · 已并入调研报告实测值）

**v2 变更**：`docs/UI_RESEARCH.md` §四 的三版提案（20 个 App 实测取证 + WCAG 逐条算过）与本文件 v1 的方向一致，
但**色板与骨架更严谨**，因此 v2 起以本文件的色值为准（已与调研报告对齐）；冲突处一律采信调研报告 §4.2 的实测比值。
技术前提与硬约束见 `docs/SKIN_BRIEF.md`。实现细节可再读 `docs/UI_RESEARCH.md` §4.A/B/C 对应小节。

**背景**：用户认为现有四套皮肤（paper / foundry / instrument / broadsheet）观感不够好，要求**不动现有 UI**、
以「叠加可切换」新增三版首页，看过再选。三版只重做首页（`.topbar` / `.readouts` / `.start` / `.today-card` / `.btn`），
其它页面靠令牌继承不崩即可。

| 代号 | 中文名 | 一句话 | 原生档 | 色族 | 字体（2 族） | 圆角 | 阴影 | 首屏指标数 |
|---|---|---|---|---|---|---|---|---|
| `bento` | 磁贴 | 今日是一台可核对的仪表盘 | 浅色 | 冷灰纸 + teal | Plex Mono（数字/读数）+ Plex Sans（标题正文） | 2 / 6 | 1 档 | 7 |
| `play` | 燃点 | 打卡有物理手感，想按下去 | 浅色 | 奶油 + 燃橙 | Space Grotesk 700（display/数字）+ Plex Sans（正文/按钮） | 18 / 28 / 999 | 3 档全硬底边 | 3 |
| `nocturne` | 夜航 | 深夜的一页词，安静长读 | **深色** | 墨蓝 + 月光蓝 | Newsreader（display/单词，400–600）+ Plex Sans（UI/正文） | 2（几乎方角） | **0 档** | 2 |

## 三版共同的取证结论（来自调研报告 §二/§三，别违背）

1. **红色不用于首页常态信息**（Anki 26.10 被社区回滚的点）：红 / `--danger` 只给「逾期 / 错词 / 危险操作」。
2. **同一个读数标签不重复出现**（Anki 另一骂点）：靠字号与位置分层，别每格都印「新词 / 复习 / 逾期」。
3. **不做倒计时、不塞 AI 配图、不做全屏庆祝动画、不做吉祥物**（无插画资产）。
4. **错词本 / 学习日历保持一级可见**（`.today-card__links` 不许藏进二级）。
5. **品牌亮色不许直接铺白字**（Duolingo `#58CC02` 白字只有 2.09:1、Drops `#D9EB3F` 对白 1.32:1）：
   亮色只做装饰或 ≥24px 大字，文字级一律压深一档。
6. **装饰线不许承担状态边界**：1.19:1 级别的线只能做分隔，状态边界要 ≥3:1。
7. 毛玻璃 / 渐变光晕只允许出现在吸底栏或暗色档顶部一层，不许上阅读面。

---

## A. `bento` 磁贴 —— 今日是一台仪表盘

**主张**：首页不是广告位。slogan（`.start__title`）降级成小标题，数字升级为读数与磁贴；
冷静但不冷：等宽数字 + 分格磁贴 + 一张工单表。

**令牌 · 浅色（原生档）**

```
--bg #F1F1EE          --surface #FFFFFF      --surface-raised #FFFFFF     --surface-sunken #E7E7E2
--border #DEDED8      --border-strong #B9B9B1        /* 装饰线 1.19:1 不许当状态边界，状态边界用 border-strong ≥3:1 */
--text #15161A        --text-secondary #56585F       --text-tertiary #6A6C73   /* 4.63:1 on --bg，最低档 */
--accent #0E7C86      --accent-hover #0B646C   --accent-press #09555C   --accent-weak #DCEDEE   --on-accent #FFFFFF
                      /* 实心面白字 4.95:1；teal 作文字色用 --accent-hover #0B646C（6.08:1） */
--success #14684A     --warning #94500A        --danger #A8332A
--mask #DDDAD2        --scrim rgba(18,20,24,.5)  --row-hover rgba(21,22,26,.04)  --toggle-on #DCEDEE
--font-mono 'IBM Plex Mono', <系统中文>, ui-monospace, monospace
--font-sans 'IBM Plex Sans', <系统中文>, system-ui, sans-serif      /* --font-serif 也指向 Plex Sans，杜绝衬线 */
--fs-display 20px     --fs-h1 18px   --fs-h2 16px   --fs-body 15px   --fs-small 13px
--radius-sm 2px  --radius-md 6px  --radius-lg 8px  --radius-full 999px   /* 只有读数条分隔用方角 */
--shadow-sm 0 1px 0 rgba(21,22,26,.06)   /* 只此一档；--shadow-md/--shadow-lg 同值或极淡，不许三档齐上 */
```

**令牌 · 深色**

```
--bg #0D1013  --surface #14181D  --surface-raised #1B2027  --surface-sunken #10151A
--border #272D34  --border-strong #3C444E
--text #E9EDF1  --text-secondary #9AA2AC  --text-tertiary #7C858F      /* 4.76:1 */
--accent #4FD1C5  --accent-hover #6FE0D5  --accent-press #35B3A8  --accent-weak #123236  --on-accent #052225
--success #6FD39F  --warning #E0A955  --danger #F08177
--mask #1B2228  --scrim rgba(0,0,0,.62)  --row-hover rgba(233,237,241,.05)  --toggle-on #123236
```

**首页版式**

- `.topbar`：`--bg` + 1px `--border` 下边线；`.brand__name` 15px/600 Plex Sans 字距 `.02em`（**不做衬线**）；
  `.brand__dot` 4px 方角点 accent；`.topbar__meta` **打开**（11px Plex Mono 大写 `+0.1em` tertiary）。
- `.readouts` **打开成三格读数条**：紧接顶栏下方，三等分 + 1px 竖分隔 + 上下各 1px 线；
  `.readout__k` 11px Mono 大写 tertiary，`.readout__v` 17px Mono 600 `--text` + `tabular-nums`。
- `.start__masthead` **关闭**；`.start__kicker` **关闭**；`.start__eyebrow` 打开（12px Mono 大写 tertiary，去掉自带 `::before` 横线）。
- `.start__title` **降级**：18px/600 `--text`，行高 1.35，不许当 hero。`.start__lede` 14px `--text-secondary` `max-width: 46ch`。
- **磁贴组**（`.today-card`）：`display: grid`，`--bt-gap: 8px`，1 大 + 2 小 + 1 长的不对称栅格：
  - 大磁贴 = 「到期复习」`doneToday/dueToday`（跨 2 列，底部一条 10 段刻度尺：`repeating-linear-gradient` 表示完成比例，纯装饰、不读数据）；
  - 两枚小磁贴 = 「逾期」（`--warning`，红只给错词/危险）与「新词」（teal 文字级 `#0B646C`）；
  - 长磁贴 = 「连续优秀」+ 7 点链（7 个 6px 方点，`--surface-sunken` 底 + 已过位 accent）。
  数字一律 Plex Mono 600，大磁贴 26px、小磁贴 20px；标签 11px 大写。**tile 底用 `--surface`，分隔用 1px `--border`，只有大磁贴允许 `--shadow-sm`。**
- `.start__meta` **关闭**；`.start__spec` **打开成工单表 4 行**：左 11px Mono 大写 tertiary，右 15px Mono 600 tabular，行间 1px `--border`，首末行 1px `--border-strong`。
- `.btn--primary`：52px 高、`--radius-md`(6px)、teal 实心、白字 15px/600 字距 `.02em`、**左侧 4px 色条**（`::before`，用 `--on-accent` 半透明或 `--accent-weak`），
  `--shadow-sm`；active 只下沉 1px。
- `.start__foot`：11px Mono 大写 tertiary，`.start__rule` 用 1px `--border`。
- 断点：768+ 读数条与工单表对齐 `--content-max`，磁贴 2 列 → 4 列；1440 内容列居中不铺满。

**风险自查**：① 与现有 `instrument` 撞脸——必须靠「浅色原生 + 圆角 2/6 + teal 而非琥珀 + 无刻度网格」拉开；
② 360px 密度：磁贴必须大小两级，不许四格等大；③ 装饰线 `#DEDED8` 不许画状态边界。

---

## B. `play` 燃点 —— 打卡有物理手感

**主张**：所有能按的东西都要看起来能按：厚底边、圆角、按下去沉 6px 再回弹。三版里唯一做情绪推力的。

**令牌 · 浅色（原生档）**

```
--bg #FFFBF2          --surface #FFFFFF      --surface-raised #FFFFFF     --surface-sunken #F6EEDF   /* 键帽槽 */
--border #EBE1CC      --border-strong #D8C7A6
--text #1B1524        --text-secondary #57506A       --text-tertiary #6E6780
--accent #C74A08      --accent-hover #B44207   --accent-press #A33C06   --accent-weak #FFE9D2   --on-accent #FFFFFF
                      /* 可点面白字 4.76:1、teal 位文字 4.61:1；亮橙 #E0590B 只允许 ≥24px 大字或纯图形色（3.63:1） */
--success #0F7A45     --warning #A15C00        --danger #B92A22
--streak #FFB84D      --on-streak #2A1D00      /* 连击币：深墨字压上去 10.36:1 */
--mask #F1E4CC        --scrim rgba(27,21,36,.45)  --row-hover rgba(27,21,36,.04)  --toggle-on #FFE9D2
--font-grot 'Space Grotesk', <系统中文>, system-ui, sans-serif
--font-sans 'IBM Plex Sans', <系统中文>, system-ui, sans-serif
--font-serif → --font-grot（杜绝衬线）；--font-mono → --font-grot
--fs-display 38px     --fs-h1 24px   --fs-h2 19px   --fs-body 16px   --fs-small 13px
--radius-sm 14px  --radius-md 18px  --radius-lg 28px  --radius-full 999px
--shadow-sm 0 2px 0 rgba(27,21,36,.10)
--shadow-md 0 4px 0 rgba(27,21,36,.12)
--shadow-lg 0 6px 0 rgba(27,21,36,.14)      /* 三档全「硬底边」，零模糊 */
```

**令牌 · 深色**

```
--bg #14121A  --surface #1F1B28  --surface-raised #292334  --surface-sunken #1A1622
--border #322B41  --border-strong #463C59
--text #F3F1F7  --text-secondary #ADA6B8  --text-tertiary #9A95A6
--accent #FFA24D  --accent-hover #FFB36F  --accent-press #E0832F  --accent-weak #33231A  --on-accent #1B1206
--success #4ED18A  --warning #E6B877  --danger #FF7A70
--streak #FFB84D  --on-streak #2A1D00
--mask #2A2436  --scrim rgba(0,0,0,.62)  --row-hover rgba(243,241,247,.05)  --toggle-on #33231A
```

**首页版式**

- `.topbar`：**色带顶栏**——`--accent-weak` 底 + 底部 2px `--accent`；`.brand__name` 22px/700 Space Grotesk 字距 `-0.02em`；
  `.brand__dot` 8px 圆 accent；`.topbar__meta` **关闭**；`.icon-btn` 44 圆底 `--surface` + 2px `--border` + `--shadow-sm`；
  `.avatar-btn` 44 圆、accent 底白字 700。
- `.readouts` **关闭**；`.start__masthead` **关闭**；`.start__eyebrow` **关闭**；`.start__lede` **关闭**（保低密度）。
- `.start__kicker` **打开**成实心小胶囊（accent 底 / `--on-accent` 字 12px/700）。
- `.start__title` = **hero**：38px/700 Space Grotesk、行高 1.08、字距 `-0.025em`，`--text`。
- **额度点阵**：`.start__meta` 用 `display: grid` 改造成 10 格点阵（每格 1 个「今日额度」位），
  点阵本身用 `--surface-sunken` 圆角块 + 已过位填 accent；旁边只留 3 个数字（今日新词 / 待复习 / 逾期）。
- **三枚币**：`.today-card__figures` 改 3 枚圆形币（`--radius-full`、48px+、`--surface` 底 + 2px `--border-strong` + `--shadow-md`）：
  连击币用 `--streak` 底 + `--on-streak` 字；复习币、逾期币各自描边。数字 22px/700。
  `.today-card` 本体去掉卡片盒，只留币 + 一行说明；`.today-card__reason` 14px `--text-secondary` 放进 `--accent-weak` 圆角条。
- `.start__spec` **关闭**。
- `.btn--primary`：**厚按钮**——56px 高、`--radius-full`、accent 底、`--on-accent` 字 19px/700、
  `box-shadow: 0 6px 0 var(--accent-press)`；`:active` → `translateY(6px)` + `box-shadow: 0 0 0`（底边归零）。
  `.btn--secondary/.btn--text/.icon-btn/.dock__btn/.answer-btn` 用同一套按压语言（位移 3–4px，别抖）。
- `.start__foot`：报尾胶囊链接（12px，`--surface-sunken` 底 + 圆角 full）。
- 背景允许一层极淡暖光 `radial-gradient`（`--accent-weak` → transparent，透明度 ≤0.5），**禁蓝紫渐变**。

**风险自查**：① 最容易撞「AI 默认审美」——靠 700 字重 + 紧字距 + 非对称栅格 + 只用一个强调色自保；
② **亮橙上放白字必挂**（2.36 / 3.58:1），文字级一律 `#C74A08`；③ 大圆角吃纵向空间，必须关掉 lede 与 readouts。

---

## C. `nocturne` 夜航 —— 深色原生的安静长读

**主张**：零阴影、零卡片感，只靠排印与一根细线分层。深色是原生档，浅色是「白天复刻」，两套独立 token。

**令牌 · 深色（原生档）**

```
--bg #0B0D12          --surface #12151C      --surface-raised #191E27     --surface-sunken #0E1117
--border #242A36      --border-strong #39424F      /* 1.91:1，只能当装饰线：卡片边界靠明度阶 + 留白，不靠描边 */
--text #E8EDF5        --text-secondary #A2ACBB      --text-tertiary #7C8796      /* 5.33:1 */
--accent #A9C7F0      --accent-hover #C2D8F5   --accent-press #8FB4E4   --accent-weak #161F2E   --on-accent #0B1A2E
                      /* 月光蓝作文字 11.21:1；按钮反字 10.81:1 */
--success #79D3A5     --warning #E6B877        --danger #F1897E
--mask #1A1F28        --scrim rgba(6,8,12,.68)  --row-hover rgba(232,237,245,.045)  --toggle-on #161F2E
--font-serif 'Newsreader', <系统中文衬线可选>, Georgia, serif      /* 可变 400–600，同族两档字重分层 */
--font-sans 'IBM Plex Sans', <系统中文>, system-ui, sans-serif
--font-mono → --font-sans
--fs-display 34px     --fs-h1 22px   --fs-h2 17px   --fs-body 16px   --fs-small 13px
--radius-sm 2px  --radius-md 3px  --radius-lg 4px  --radius-full 999px
--shadow-sm/md/lg: none（全 0 档；浮层靠 --surface 与 --scrim 分层）
```

**令牌 · 浅色（白天复刻）**

```
--bg #F4F5F7  --surface #FFFFFF  --surface-raised #FFFFFF  --surface-sunken #E2E5EA
--border #E2E5EA  --border-strong #C2C8D0
--text #10141B  --text-secondary #4E5661  --text-tertiary #697079      /* 4.59:1 */
--accent #1E4E8C  --accent-hover #17416F  --accent-press #12355C  --accent-weak #E1E9F4  --on-accent #FFFFFF
--success #14603F  --warning #7A4F0B  --danger #9B2C22
--mask #E4E7EC  --scrim rgba(16,20,27,.4)  --row-hover rgba(16,20,27,.04)  --toggle-on #E1E9F4
```

**首页版式**

- **刊号行**：`.start__masthead` **打开**成通栏刊号（`Newsreader` 品牌字 + 1px 通栏 `--border-strong` 线 + 日期小字）；
  `.topbar__meta` **打开**（12px、字距 `.14em`、大写、tertiary）；`.topbar` 透明底 + 1px `--border` 下边线，**不吸底不加毛玻璃**。
- `.brand__name` 用 `Newsreader` 20px/500；`.brand__dot` **关掉**；`.icon-btn` 44 无边框 tertiary，hover 才出现 1px `--border-strong`；
  `.avatar-btn` 44 圆、透明底 + 1px `--border-strong` + `--text` 字。
- `.readouts` **关闭**（信息在下面的两栏读数里）；`.start__kicker` **打开**：13px 大写、字距 `.18em`、tertiary，前面 10px 短横线用 `--accent`。
- `.start__eyebrow` 打开（12px 大写 tertiary，去掉 `::before` 横线）。
- `.start__title` = **hero**：`IBM Plex Sans` 600 / 34px / 行高 1.2 / 字距 `-0.02em`、`--text`、左对齐。
  **中文大标题不许用衬线**：`Newsreader` 没有 CJK 字形，34px 中文会掉到 Windows 宋体 / 各家不一的 `serif`，跨设备不可控。
  `Newsreader` 在这版只服务**纯拉丁与数字**位（masthead 日期、两栏读数数字、today 带大数字、日历数字）。
- `.start__lede`：16px/1.75 `--text-secondary`，`max-width: 42ch`；左侧 1px `--border-strong` 竖线 + 16px padding（引文）。
- **两栏排印读数**：`.start__meta` **打开**成两栏（今日新词 / 到期复习），无盒、无底、无阴影；
  数字 `Newsreader` 30px/500 tabular，标签 12px 大写 tertiary。`.start__spec` **打开**成四行细线表（左标签右数字）。
- **虚线引导 + 一行文字链**：`.today-card` **去掉卡片盒**，改「上 1px `--border-strong` + 下 1px `--border`」的数据带；
  `.today-card__figures` 里「连续优秀 / 逾期 / 错词本」三项排成一行文字链（leader dots 用 `radial-gradient` repeat-x），
  `.is-accent` → `--accent`、`.is-warn` → `--warning`（这版唯一的微暖信号，别去掉，否则全页太冷）；
  `.today-card__tag` 描边 chip（1px `--accent` + `--accent` 字 + 透明底）；`.today-card__reason` 14px `--text-secondary`。
- `.btn--primary`：**描边按钮**——52px 高、`--radius-md`(3px)、1px `--accent` 描边、`--accent` 字 15px/600 字距 `.06em`、
  `background: var(--accent-weak)`（深色档弱底 14.07:1 对比正文）、`box-shadow: none`；hover 才填 `--accent` + `--on-accent` 字。
  **不许发光晕**（调研报告把 glow 划到「吸底层最多一次」）。
- `.start__foot`：12px tertiary + `.start__rule` 用 1px `--border`。
- 深色档顶部允许一层极淡冷光 `radial-gradient`（`--accent` ≤8% → transparent），浅色档不用。

**风险自查**：① 深色下描边只有 1.3–1.9:1，**卡片边界看不见**——层级只能靠明度阶 + 留白，别指望线；
② **中文小字号禁用衬线**（`--font-serif` 只给 display 与英文单词，14–15px 中文一律走 `--font-sans`）；
③ 与 `instrument` 同为深色，靠「零阴影 / 零刻度 / 衬线 display / 无磁贴」区隔。

---

## 三版共同禁令

1. 不许改 DOM 结构、文案、组件 props；不许新增 React 组件。
2. 不许 `!important`、裸 `:root`、`filter: invert()`、在线字体、外链图片、新下载字体。
3. 不许把 `.answer-dock` 改回 `position: fixed` / `100vw`（应用列正常流是铁律）。
4. 语义色 `--success/--warning/--danger` 必须浅色 + 深色各写一遍（老坑：漏深色档 → 1.01:1 看不见）。
5. 每版 CSS ≤ ~450 行，分区注释编号化（1 令牌 / 2 深色 / 3 基底 / 4 顶栏 / 5 首页 / 6 today 带 / 7 按钮 / 8 断点 / 9 hover / 10 reduced-motion）。
