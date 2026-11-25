# synth-glance · 五套「一瞥即读」首页骨架候选（四族调研收敛）

- 收敛日期：2026-11-25
- 输入：`docs/SKIN_BRIEF.md`（DOM 清单 / 令牌 / 硬指标）+ `docs/research2/01-fitness.md`（Strava / Apple Fitness / Whoop / NRC / Keep / 悦跑圈）
  + `06-ambient.md`（Carrot / 彩云 / Nothing OS / 表盘 / Smart Stack）+ `10-habit.md`（Streaks / Forest / Habitica / Finch / Duolingo / Fabulous / Anki）
  + `02-finance.md`（Revolut / Monzo / Robinhood / Copilot / Moneytree / 支付宝 / 招行）
- 事实核对：`src/components/StudyScreen.tsx`、`src/components/TodayCard.tsx`、`src/components/CalendarScreen.tsx:155-216`、
  `src/components/ProfileScreen.tsx:96,242-245,333-339,352-359`、`src/styles/app.css:90-130,336-418,1471-1531`、`src/styles/skin-hooks.css`、现有 7 套 `src/styles/skins/*.css`。
- 输出用途：给主设计者拍板。**本文不写代码文件，只做结构收敛。**

---

## 0. 全局前提（所有候选共同遵守）

1. `.start__title`、`.start__lede` 一律 `display:none`（用户已定：功能介绍不长期住首页）。hero 焦点由**数字 / 刻度 / 日期 / CTA / 伪元素装饰**顶上。
2. 只写 CSS。素材就是 SKIN_BRIEF §1 那些类名。允许 `display:contents` 拆包装层、grid/flex 重排、`order`、sticky/absolute/fixed、伪元素装饰、`:has()`、SVG data-URI 背景、clip-path、mask、gradient、`writing-mode`、counter。
3. **消重是结构性任务**：`allowedNew` 首页 4 份（`.readouts` / `.start__meta` / `.start__spec` 第2行 / `.today-card__figure` 第1个）、`已学` 3 份、`阶段` 3 份、`批数` 2 份。
   每个候选都执行「一个数在首页最多出现一次」，多余副本 `display:none`。
4. **砍数据必须有承接**（照抄已盘点结论）：`已学/总词量` → 我的页 `ProfileScreen.tsx:96,333-339`；`到期/逾期/今日已学/连续优秀` → 日历 `CalendarScreen.tsx:168-189` 的 `cal-figures`；`阶段` → 顶栏 + 我的页。
   **只有首页有**的两项：`todayBatchCount`（今日批数）、`pendingReviews`（待复习合计，只活在「先复习后新词」承诺句里）。
   这两项**在日历页/我的页没有等价文本**；日历 `cal-figures` 是开放式 `dl`，补两行成本最低，但那是**改 DOM，要单独决策**。
   ⇒ 本文五个候选里有四个用「零 DOM 手段」把它们留住（只放开 `.start__spec-row:nth-child(3)` 一行），只有「浮岛」提供彻底空屏的选项并写明 DOM 代价。
5. **`.readouts` 是 `aria-hidden="true"` 且是 `.app` 外壳的兄弟节点**（`app.css:90-117`，不随 `.app__main` 滚动，开起来永久吃掉约 34px 视口高）。
   ⇒ 任何方案不许把某项数据**只**放进读数带；首页至少留一行非 hidden 等价文本（`.start__spec-v` 或 `.today-card__figure`）。凡开 `.readouts` 的候选，`.start{min-height}` 必须按 `顶栏56 + 读数带34 + env(safe-area-inset-top)` 实高扣，否则出幽灵滚动、钉底件卡在折线外。
6. 硬指标逐条照做：360 零横向溢出、所有可点目标 ≥44×44、正文对比 ≥4.5:1、含中文正文 ≥14px（10–12px 只给拉丁/数字刻印）、≤2 字体族（Newsreader / Space Grotesk / IBM Plex Mono / IBM Plex Sans / Instrument Serif 里挑）、单一强调色、**红只用于逾期/错误/危险**、浅深两档各写一遍（含 `--warning --danger --success`）。
7. `prefers-reduced-motion` 关位移；hover 包在 `@media (hover:hover)`；不用 `!important`、不写裸 `:root`、不引外链资源。

---

## 1. 未使用的手段清单（本轮判据的物证）

对 `src/styles/skins/*.css` 全量检索 `display:\s*contents`、`position:\s*(sticky|fixed)`、`writing-mode`、`conic-gradient`、`clip-path`、`mask-image`、`scroll-snap`：**0 命中**。
现有 7 套（paper / foundry / instrument / broadsheet / bento / play / nocturne）的首页全部是**同一条纵向文档流**，差别只在「删了哪几块、按钮多厚、数字多大、什么颜色」。
⇒ 下面 8 项手段是 7 套从未碰过的空白区；每个候选至少占用其中两项，并且占用组合互不相同。

| 手段 | 落在哪个候选 | 具体选择器写法（要点） |
|---|---|---|
| `display:contents` 拆包装层 | 全部 5 个（用法不同） | `.start__body{display:contents}` 把 7 个子项直接交给 `.start` grid；`ring`/`island` 再加 `.today-card{display:contents}` 把「卡片」这个概念从版面上抹掉；`ledger` 再加 `.today-card__figures{display:contents}` 让 4 个 figure 成为独立表格行 |
| `position:sticky`（外壳内层钉住） | `axis`（章首/带首）、`ledger`（底栏）、`stack`（叠卡主角）、`ring`（环脚日期） | `[data-skin='ledger'] .start__actions{position:sticky;bottom:0;z-index:15}`；`[data-skin='stack'] .today-card{position:sticky;top:calc(56px + env(safe-area-inset-top,0px))}` |
| `position:fixed`（视口层） | `island`（满屏动作面 + 四角）、`ring`（可选钉底横条） | `[data-skin='island'] .start__actions{position:fixed;left:50%;transform:translateX(-50%);top:calc(56px + env(safe-area-inset-top,0px));bottom:0;width:min(100%,var(--app-max));z-index:15}` |
| `scroll-snap-type` 横滑带 | `axis`（时间轴带）、`ledger`（未来队列副行） | `[data-skin='axis'] .today-card__figures{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none}` + `.today-card__figure{flex:0 0 46%;scroll-snap-align:center}` |
| `conic-gradient` + `mask`（环形刻度） | `ring`（唯一）、`stack`（顶卡章标可选） | `[data-skin='ring'] .today-card__figure:first-child::before{background:repeating-conic-gradient(var(--border-strong) 0 .4deg,transparent .4deg 6deg);-webkit-mask:radial-gradient(closest-side,transparent 68%,#000 69%);mask:同}` |
| `clip-path` | `stack`（露边卡）、`axis`（带端渐隐站）、`island`（山脊天际线） | `[data-skin='stack'] .today-card__figure:nth-child(2){clip-path:polygon(0 0,100% 0,100% 100%,0 100%)}` 用于压栈切边；`island` 用三层 `clip-path:polygon(...)` 叠天际线剪影（纯装饰） |
| `mask-image` 渐隐（提示可继续读） | `axis`（带两端）、`ledger`（底栏上沿）、`stack`（被压卡顶边） | `[data-skin='axis'] .today-card__figures{mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 34px),transparent)}` |
| `writing-mode` 竖排 + `counter` | `island`（四角竖刻日期）、`ledger`（表序号）、`stack`（章标）、`ring`（环侧竖排日期） | `[data-skin='island'] .start__masthead-meta{writing-mode:vertical-rl;letter-spacing:.2em}`；`[data-skin='ledger'] .start{counter-reset:row}` + `.today-card__figure::before{counter-increment:row;content:counter(row,decimal-leading-zero)}` |

`:has()` 状态换骨是**所有候选共用**的第三个杠杆（可用状态类只有：`b.is-warn` 逾期/被闸、`b.is-accent` 配额奖励、`.today-card__reason.is-increase|is-decrease|is-paused|is-ok`、`.today-card__tag` 存在与否、`blocked` 时多出的「计划 N」span）。
7 套里最多只把 `is-*` 用来换颜色；本文候选用它换**占位与顺序**（无事不出现、有事才上提），这也是结构差异。

---

## 2. 候选一 · 「合环」（RING）

**一句话结构**：首屏中央一枚 60 刻度环 + 环心一个巨型数字（今日新词），占屏高约 46–52%；环外只有四件：环脚一行日期、一行原因、一枚中心对称的大钮、页脚两枚功能入口。整页是「一台仪器」，不是文档。

**数据 / 砍留 / 去向**
- 保留（首页唯一一份）：`allowedNew`（环心，取 `.today-card__figure:first-child b`，未补零，可当 hero；**不用 `.readout__v`**，补零的 `05` 当 96px 大字会变装饰噪音）；承诺句 `pendingReviews`（环下第二行，原文本，首页独有 → 留住）；批数（环下第一行，用 `.start__spec-row:nth-child(3)` 单行放开，零 DOM）。
- 砍掉：`.readouts`（整条）、`.start__meta`、`.start__spec` 第1/2/4 行、`.today-card__figure` 第2/3/4（到期分数 / 逾期 / 连续）、`.start__eyebrow` 长串、`.start__masthead-brand`、`title/lede`。
- 去向：到期/逾期/连续 → 日历 `cal-figures` 已有等价；已学/阶段 → 我的页 + 顶栏已有。批数与待复习**没有被砍**（首页独有项，留在环脚两行）。
- 无障碍：`.readouts` 被整条关掉，读屏信息仍由环脚两行（非 hidden）承担 ⇒ 达标。

**主 CTA**：环正下方一枚正圆钮（首屏中心对称轴的组成部分），`width:min(58vw,210px);aspect-ratio:1`，非满宽、**不 sticky**（首页本就一屏读完，钉底反而割裂仪器感）；文案「开始背单词」5 字靠 `text-wrap:balance` 在圆内两行。44×44 自然远超。若主设计者嫌圆内换行不雅，退档为 `width:min(80vw,360px);height:68px;border-radius:var(--radius-full)` 胶囊（骨架不变）。

**具体 CSS 手段**
```css
[data-skin='ring'] .readouts,[data-skin='ring'] .start__meta,[data-skin='ring'] .start__masthead,
[data-skin='ring'] .start__kicker,[data-skin='ring'] .start__eyebrow,[data-skin='ring'] .start__title,
[data-skin='ring'] .start__lede{display:none}
[data-skin='ring'] .start{display:grid;grid-template-rows:auto auto 1fr auto auto auto;justify-items:center;
  align-content:center;gap:var(--space-3);padding-block:var(--space-4);
  min-height:calc(100dvh - 56px - env(safe-area-inset-top,0px))}
[data-skin='ring'] .start__body{display:contents}
[data-skin='ring'] .today-card{display:contents}          /* 卡片概念被抹掉，figure 直接成为版面元素 */
[data-skin='ring'] .today-card__figures{display:grid;place-items:center}
[data-skin='ring'] .today-card__figure:nth-child(n+2){display:none}
[data-skin='ring'] .today-card__figure:first-child{position:relative;width:min(76vw,320px);aspect-ratio:1;
  display:grid;place-content:center;text-align:center;border-radius:50%}
[data-skin='ring'] .today-card__figure:first-child::before{content:"";position:absolute;inset:0;border-radius:50%;
  background:repeating-conic-gradient(var(--border-strong) 0 .4deg,transparent .4deg 6deg);   /* 60 刻度环，不做实心百分比弧 ⇒ 不被读成实时进度 */
  -webkit-mask:radial-gradient(closest-side,transparent 68%,#000 69%);mask:radial-gradient(closest-side,transparent 68%,#000 69%)}
[data-skin='ring'] .today-card__figure:first-child::after{content:"";position:absolute;inset:4%;border-radius:50%;
  background:radial-gradient(circle at 50% 42%,var(--accent-weak),transparent 70%)}          /* 仪表玻璃心，深色档换内发光 */
[data-skin='ring'] .today-card__figure:first-child b{font-family:var(--rg-num);font-size:clamp(56px,18vw,104px);
  line-height:.86;font-variant-numeric:tabular-nums;letter-spacing:-.04em}
[data-skin='ring'] .start__spec{display:grid;gap:2px}
[data-skin='ring'] .start__spec-row:not(:nth-child(3)){display:none}
[data-skin='ring'] .today-card__head{order:-1;font-size:14px;letter-spacing:.06em}         /* 环脚日期，sticky 感由居中排印代替 */
[data-skin='ring'] .today-card__reason:last-of-type{font-size:14px;line-height:1.55;max-width:30ch;text-align:center}
[data-skin='ring'] .today-card__links .btn--compact{min-height:44px;min-width:44px}         /* 两个功能入口一个不挤 */
[data-skin='ring'] .start__foot{margin-top:auto}
```
`:has()` 分档（**诚实标注**：环是「今日状态徽章」，不是实时仪表）：
```css
[data-skin='ring'] .today-card__figure:first-child{--rg-arc:0}
[data-skin='ring'] .today-card:has(b.is-warn)::before{color:var(--warning)}        /* 被闸/逾期 ⇒ 刻度环整圈琥珀，非百分比 */
[data-skin='ring'] .today-card:has(.today-card__tag)::after{opacity:.85}           /* 有奖惩标签 ⇒ 玻璃心加亮 */
```
字体族 2：`--rg-num: 'IBM Plex Mono'`（数字/单位）+ IBM Plex Sans（含中文正文）。单一强调色。
**深色档单独设计**：`--bg` 深墨、环刻度用 `rgba` 亮刻印（不用阴影）、玻璃心换成 `radial-gradient` 内发光（`--rg-glow: rgba(强调色,.16)`）、`--warning/--danger/--success` 各写一档；刻度在深色上必须仍 ≥3:1 可感知。

**360 / 768 / 1440**
- 360：环 `min(76vw,320)=274px`，`b` 字号 18vw≈65px，两位数不溢出；整页元素 6 个，`min-height` 扣 56 后仍能一屏读完；圆钮 210px 居中，左右各留 75px ⇒ 零横向溢出。
- 768：环 `max-width:320px` 定死，左右各拉出一列——左侧 `.start__spec-row:nth-child(3)` 竖排批数、右侧承诺句；两枚功能入口移到钮下方成一行；`.start{grid-template-columns:minmax(0,150px) auto minmax(0,240px);justify-content:center}`。
- 1440：`.app{max-width:760px}` 已锁居中轴，环不再放大；只把留白从 `1fr` 改为 `--space-8`，并在 `.screen` 上加 `padding-inline:max(var(--page-x),calc((100% - var(--content-max))/2))`；绝不做多栏（仪器只有一个中心）。

**风险**
- **假进度**：这是本候选最大风险。规避手段是**不画实心百分比弧，只画 60 等分刻度环**（表盘语法：形状给数字提供语境，不声明完成度）；若主设计者要求弧长，必须承认弧长只能来自 `is-*` 三档示意，DOM 拿不到比例（无 JS、`attr()` 不参与计算）。
- 挤掉功能入口：`.today-card__links` 只剩两枚钮但必须 ≥44，圆钮 210px 与它们同屏时纵向余量紧张，360 实测可能把 links 顶到折线外（缓解：`grid-template-rows` 末两行改 `auto`，或 links 做成圆钮两侧的 44px 圆章）。
- 溢出：`repeating-conic-gradient` + `mask` 全在伪元素上、`inset` 不超出 320px 容器，`place-items:center` 保证不撑宽；旧 WebView 若 conic 不渲染，退化为「中心数 + 细线圆」，骨架不塌。
- 密度最低（读数=1），若用户当天关心「逾期几个」，首页不答——靠一行承诺句 + 日历承接，属于刻意取舍。

**借鉴**：Apple Fitness 三环即首页、环即唯一入口（https://support.apple.com/en-ca/guide/iphone/iph4c34a8a95/ios ；https://9to5mac.com/2023-11-29/iphone-fitness-app-whats-new-ios-17/ ）；Wear OS / Amazfit 表盘「中央一个数 + 外圈 60 刻度 + 固定 complication 槽」（https://developer.android.google.cn/training/wearables/design/watch-faces ；https://amazfitwatchfaces.com/active/view/3076 ）；Whoop 三表盘把「今天」压缩成一排圆（https://www.whoop.com/hk/en/thelocker/the-all-new-whoop-home-screen/ ）；Forest 圆环中心键（http://www.woshipm.com/evaluating/5769925.html ）；表盘「一臂之外也能读」的字号律（https://brainy.ink/paper/weather-app-design ）。

---

## 3. 候选二 · 「横轴」（AXIS）

**一句话结构**：阅读轴从纵向翻成横向。顶栏下一条答案横幅（彩云式），首屏 40% 高是一条**横滑刻度时间轴带**（4 个 figure = 4 个站），带两端 mask 渐隐、band 下方一根共享基线；往下依次是结论句、满宽钉底钮；文档流只剩这三层。

**数据 / 砍留 / 去向**
- 保留：4 个 figure 全在带上（新词 / 到期分数 / 逾期 / 连续）；`pendingReviews` 承诺句 = 带下方「下一站」结论行（首页独有，留）；批数 = 带正下方一条 24px 副刻度行（`.start__spec-row:nth-child(3)` 单行放开，零 DOM）。
- 砍掉：`.readouts`、`.start__meta`、`.start__spec` 第1/2/4 行、`.start__masthead`、`.start__eyebrow`、`title/lede`。
- 去向：阶段 → 顶栏 `topbar__meta` 打开一行；已学 → 我的页；到期/逾期/连续明细 → 日历 `cal-figures`（带上只给数，不给趋势）。
- 答案横幅文本来自 `.topbar__meta`（DOM 自带「今日 N 词 / 今日新词已发完」），打开后**横幅与带上第1站是同一个数的两份** ⇒ 用 `:has()` 二选一：横幅在场时把第1站数字降为标签（`font-size:14px`），或直接关横幅改用带上第1站当横幅（两档都写进候选，拍板选一）。

**主 CTA**：`position:sticky;bottom:0` 的**满宽行动条**（62px + `env(safe-area-inset-bottom)`），内容从其下滚过并加 `::after` 渐隐遮罩。非 fixed（避开与 `.dock` 的包含块叠加）、非浮岛、非圆钮：CTA 在版面里的地位是「轴的纵向锚点」。

**具体 CSS 手段**
```css
[data-skin='axis'] .start{display:grid;grid-template-rows:auto auto 1fr auto;gap:var(--space-3);
  min-height:calc(100dvh - 56px - env(safe-area-inset-top,0px))}
[data-skin='axis'] .start__body{display:contents}
[data-skin='axis'] .today-card{display:contents}
[data-skin='axis'] .today-card__head{display:flex;align-items:baseline;gap:var(--space-3)}        /* 日期 = 轴的标题行 */
[data-skin='axis'] .today-card__figures{display:flex;gap:0;overflow-x:auto;scroll-snap-type:x mandatory;
  scrollbar-width:none;padding-inline:var(--page-x);aspect-ratio:2.9/1;align-items:stretch;
  border-block:1px solid var(--border-strong);
  -webkit-mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 34px),transparent);
  mask-image:linear-gradient(90deg,transparent,#000 20px,#000 calc(100% - 34px),transparent)}
[data-skin='axis'] .today-card__figure{flex:0 0 46%;min-width:0;scroll-snap-align:center;display:grid;
  align-content:end;gap:2px;padding:var(--space-3) var(--space-3) 10px;border-inline-start:1px solid var(--border)}
[data-skin='axis'] .today-card__figure b{font-size:clamp(30px,9vw,46px);line-height:1;font-variant-numeric:tabular-nums}
[data-skin='axis'] .today-card__figure::after{content:"";position:absolute;bottom:0;left:0;right:0;height:3px;   /* 每站一根共享刻度条 */
  background:repeating-linear-gradient(90deg,var(--border-strong) 0 1px,transparent 1px 12.5%)}
[data-skin='axis'] .today-card__figure{position:relative}
[data-skin='axis'] .start__spec{display:grid}
[data-skin='axis'] .start__spec-row:not(:nth-child(3)){display:none}
[data-skin='axis'] .start__spec-row:nth-child(3){display:flex;gap:var(--space-2);font-size:14px;color:var(--text-secondary)}
[data-skin='axis'] .start__actions{position:sticky;bottom:0;z-index:15;padding:var(--space-2) var(--page-x)
  calc(var(--space-2) + env(safe-area-inset-bottom));background:var(--bg);border-top:1px solid var(--border-strong)}
[data-skin='axis'] .start__actions .btn--primary{width:100%;min-height:62px;border-radius:var(--radius-full)}
[data-skin='axis'] .screen{padding-bottom:96px}                                                    /* 防钉底遮挡 */
```
条件骨架（Moneytree「有事才出现」）：`[data-skin='axis'] .start:not(:has(b.is-warn)) .today-card__figure:nth-child(3){display:none}`（无逾期 ⇒ 该站不占位）；`b.is-warn` 在场 ⇒ `.today-card__figures{scroll-snap-align:none}` 并把第3站 `order:-1` 提到带首。
字体族 2：Newsreader（数字/站名拉丁刻印）+ IBM Plex Sans（中文正文，≥14px）。
**深色档单独设计**：刻度条与站分隔线在深色用 `rgba` 提升；带底加一条极淡 `linear-gradient` 内光表示「这是仪器」；`--danger` 只给逾期站，浅深各写。

**360 / 768 / 1440**
- 360：每站 `46%`（≈147px）露出下一站约 40px 作为「还能滑」的提示；页面级零溢出（溢出只发生在带内层，`.app__main{overflow-x:hidden}` 已兜）；带高 `aspect-ratio:2.9/1`≈110px；钉底条 62 + `screen` 底 96 ⇒ 无幽灵滚动。
- 768：站宽 `flex:0 0 30%`（4 站刚好一屏，横滑变成可选）；`.today-card__head` 与承诺句左右分栏（`grid-template-columns:1fr auto`）；带内基线升为 4px。
- 1440：带随 `--content-max 640` 锁宽不再变长；4 站 + 右侧固定一列「结论 + 批数」两行，`grid-template-columns:minmax(0,640px) 240px`；钉底条宽度仍 `min(100%,var(--app-max))` 居中轴，不飞出内容列。

**风险**
- **假进度**：本候选没有进度条，只有**等分刻度基线**（12.5% 一格 = 8 格语义，若被读成「完成率」是误导）⇒ 缓解：每站基线只做 8 段细点、不填充，数字旁边用 `.today-card__tag` 真文本表涨跌。
- 横滑 = 藏数据：第3/4 站默认在折线外，重演 Monzo「零点击见流水」翻车面（https://community.monzo.com/t/app-evolution-feedback-megathread/141702/1197 ）。缓解：mask 渐隐 + 露边 40px + `:has()` 把有事的站提到带首。
- 溢出：带内 `overflow-x:auto` 是唯一的横向滚动源；`aspect-ratio` + `min-width:0` + `flex-basis:%` 三者齐用才能不撑破 360。
- sticky 底条与 iOS 工具栏、与 `.dock`（复习页）叠加需真机验证。
- 「错词本 / 学习日历」两枚入口被 `__head` 挤到日期行右侧：`min-width:44px;min-height:44px` + `flex-wrap` 兜底，窄屏可能折成两行。

**借鉴**：彩云天气「首屏一句话答案 + 全屏可视化 + 底部每格 6 分钟时间轴」（https://www.php.cn/faq/2483684.html ；https://www.appinn.com/caiyunapp ）；Copilot Money 的 `Upcoming` 横向滚动队列（https://help.copilot.money/en/articles/6045480-dashboard-tab-overview ）；Moneytree 左右三分屏 / 异常卡只在有事时出现（https://help.getmoneytree.com/en/articles/17765252-moneytree-insights-tab-frequently-asked-questions-faq ）；Fitbit 顶部数据带 + 卡流（https://www.engadget.com/ai/a-closer-look-at-googles-ai-health-coach-and-the-redesigned-fitbit-app-160041881.html ）；Revolut 读数横滑吸附（https://www.revolut.com/blog/post/revolut-10/ ）；悦跑圈 hero 数据上移（http://mp.weixin.qq.com/s?__biz=MzcwMjMzMTg2NQ==&mid=2247483677&idx=1&sn=c5db47d8216027fc9fa1d0a236a0d6ba ）。

---

## 4. 候选三 · 「台账」（LEDGER）

**一句话结构**：首屏焦点不是数字，是一张**账本**：一行 4 格右对齐大字读数带（`.readouts` 打开当总览条）+ 一张每行形态不同的台账表（`.start__spec` 4 行 + 4 个 figure 合并成 8 行，全部 `display:contents` 后重新入列）；CTA 是钉底「提交行」。高密度，但一行一件事。

**数据 / 砍留 / 去向**
- 保留：全部。读数带 3（今日/批数/已学，补零，`aria-hidden` 只做速览）+ 台账 5–6 行（非 hidden，承担朗读）：新词（大字）、到期复习（`x/y` 分数 + 8 段刻度尺）、逾期（**只在 `:has(b.is-warn)` 时出现的整行红块**）、连续（一行 delta 脚注）、批数（`.start__spec-row:nth-child(3)`，首页独有）、待复习（承诺句作为表末「合计行」，首页独有）。
- 砍掉：`.start__meta`（与读数带重复）、`.start__spec` 第1/2/4 行（阶段/新词/已学已由顶栏与读数带承担）、`title/lede`、`.start__masthead`、`.start__eyebrow`。
- 去向：被砍的三行都是**重复副本**，明细在日历 `cal-figures` 与我的页 `.stat` 都在；批数/待复习没被砍。
- 关键：`已学` 在台账里是 Stock（存量+时间戳小字），`新词` 是 Quota（额度+剩余），`到期` 是 Recurring（队列 + 刻度尺），`连续` 是 Flow（一行 delta）——**四口径四形态，绝不四格等大**。

**主 CTA**：`position:sticky;bottom:0` 全宽 52px「提交行」，左端带 `::before` 合计线刻印（`content:"合计"` 非中文正文风险：改拉丁 `TOTAL` 12px 或中文 14px 选一），与台账右对齐数字列共用一条竖直基线。按钮不占首屏焦点——与「合环」「浮岛」形成两极。

**具体 CSS 手段**
```css
[data-skin='ledger'] .start{display:grid;grid-template-rows:auto auto auto 1fr;gap:0;
  min-height:calc(100dvh - 56px - 34px - env(safe-area-inset-top,0px))}        /* 读数带在场，实高扣 */
[data-skin='ledger'] .readouts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
  border-block:1px solid var(--border-strong);padding-inline:var(--page-x)}
[data-skin='ledger'] .readout{display:flex;align-items:baseline;justify-content:space-between;gap:6px;padding:6px 0}
[data-skin='ledger'] .readout__v{font-family:var(--ld-num);font-size:clamp(20px,5.6vw,26px);font-variant-numeric:tabular-nums}
[data-skin='ledger'] .start__body{display:contents}
[data-skin='ledger'] .today-card{display:contents}
[data-skin='ledger'] .today-card__figures{display:contents}                     /* 4 个 figure 升格为表行 */
[data-skin='ledger'] .today-card__figure,[data-skin='ledger'] .start__spec-row{
  display:grid;grid-template-columns:1.2em 6.5em minmax(0,1fr) auto;align-items:baseline;gap:var(--space-2);
  padding:8px var(--page-x);border-top:1px solid var(--border)}
[data-skin='ledger'] .start{counter-reset:row}
[data-skin='ledger'] .today-card__figure::before{counter-increment:row;content:counter(row,decimal-leading-zero);
  font-family:var(--ld-num);font-size:11px;color:var(--text-tertiary)}          /* 行号刻印，拉丁/数字，允许 11px */
[data-skin='ledger'] .today-card__figure b{font-family:var(--ld-num);font-size:clamp(18px,5.2vw,24px);font-variant-numeric:tabular-nums}
[data-skin='ledger'] .today-card__figure:nth-child(2){position:relative}        /* 到期分数 + 刻度尺 */
[data-skin='ledger'] .today-card__figure:nth-child(2)::after{content:"";height:6px;grid-column:3 / -1;
  background:repeating-linear-gradient(90deg,var(--scale-line) 0 1px,transparent 1px 12.5%)}
[data-skin='ledger'] .start:not(:has(.today-card b.is-warn)) .today-card__figure:nth-child(3){display:none}
[data-skin='ledger'] .today-card__figure:nth-child(3){border-inline-start:3px solid var(--danger)} /* 红只给逾期 */
[data-skin='ledger'] .today-card__reason:last-of-type{padding:10px var(--page-x);border-top:2px solid var(--border-strong)} /* 合计行 */
[data-skin='ledger'] .start__spec{display:grid}
[data-skin='ledger'] .start__spec-row:not(:nth-child(3)){display:none}
[data-skin='ledger'] .start__actions{position:sticky;bottom:0;z-index:15;background:var(--bg);
  border-top:1px solid var(--border-strong);padding:var(--space-2) var(--page-x) calc(var(--space-2) + env(safe-area-inset-bottom))}
[data-skin='ledger'] .start__actions .btn--primary{width:100%;min-height:52px;border-radius:var(--radius-sm)}
[data-skin='ledger'] .screen{padding-bottom:84px}
[data-skin='ledger'] .start__masthead{display:flex;writing-mode:horizontal-tb}  /* 日期刻印当表头 */
```
`:has()` 还用于「逾期在场 ⇒ 台账整体上提为第一块」：`[data-skin='ledger'] .start:has(.today-card b.is-warn) .today-card__figures{order:-1}`——同 DOM 两套版面，这是真正的状态换骨。
字体族 2：IBM Plex Mono（数字/行号/刻度）+ IBM Plex Sans（中文）。单一强调色；`--warning` 只用于配额被闸，`--danger` 只用于逾期。
**深色档单独设计**：行分隔线降不透明度、`--shadow` 一律不用（靠明度阶分行）、表头与底栏用 1px 亮线代替阴影、`--danger` 深色档提亮到 ≥4.5:1 后才允许当文字。

**360 / 768 / 1440**
- 360：4 列 `1.2em 6.5em 1fr auto` 合计最窄 ≈ 21 + 91 + 弹性 + 数字 ⇒ 必须给标签列 `white-space:nowrap` 且第2列文本 ≤5 字（阶段/今日批次行已砍，剩下的标签是「新词/到期/逾期/连续」，安全）；读数带 3 格 `minmax(0,1fr)` + `font-variant-numeric:tabular-nums` 不撑破；行号 11px 属数字刻印豁免。
- 768：**真双栏**——`@media(min-width:768px){.start{grid-template-columns:minmax(0,1fr) 300px}.today-card__figures{grid-column:1}.start__actions,.start__spec,.today-card__reason:last-of-type{grid-column:2}}`；右栏 = hero 配额 + 刻度 + CTA + 两枚入口（Anki 左树右图、招行财富页的分区感）。
- 1440：双栏保持，右栏宽 320px；台账行 `--ld-indent` 增大、表头加 `::after` 右上「截至」时间戳（来自 `.today-card__label` 真文本，不造假）；仍锁 `--content-max` 轴，不做三栏。

**风险**
- **假进度**：刻度尺只能是 8 段等分装饰 + `is-*` 三档填充（`clip-path:inset(0 calc(100% - var(--w)) 0 0)`，`--w` 写死在 `:has()` 里）。必须在文案/评审里写明「尺不表示精确比例」，否则违反「数字折进形状要是真形状」的诚实线。
- 密度过高：8 行 + 读数带 + 钉底，360 首屏可能只露 5 行 ⇒ 靠 `:has()` 折叠逾期行（无逾期不占位）压到 6 行；「一瞥即读」程度是五案里最低的。
- 挤掉功能入口：`.today-card__links` 必须留在读数带下方独立一行（Copilot「每 section 自带 > 锚」的做法），若被塞进表头 `__head` flex 会与日期争宽。
- `display:contents` 三层连用后 `.today-card` 的 `aria-label="今日学习摘要"` 仍在（DOM 未动），但读屏顺序变成「head → 4 figure → reason」——需实测朗读顺序。
- 溢出源：`grid-template-columns` 里任何 `em` 列在 360 都可能挤出 ⇒ 所有 `1fr` 改 `minmax(0,1fr)`，禁 `overflow:hidden` 截断中文。

**借鉴**：Anki 统计面板「左树右图 + 计数列」与主界面三计数列（https://docs.ankiweb.net/manual/stats ）；JVDS 财务看板四口径四形态（Stock/Flow/Quota/Recurring，禁止同一种环表达三件事）（https://jiedastudio.com/share/ui-design/personal-finance-dashboard-context-u132 ）；Copilot Money「每 section 只放摘要 + 一个 >，绝不重复详情页」（https://help.copilot.money/en/articles/6045480-dashboard-tab-overview ）；Robinhood「大数字下面紧跟一行 delta、tabular 数字、图先于一切」（https://code.jiangshu.ai/awesome-design-html/assets/ios/design.robinhood-ios.html ；https://ixd.prattsi.org/2025/02/design-critique-robinhood-ios-app/ ）；Habitica inline streak 小数字（https://habitica.fandom.com/zh/wiki/%E4%BB%BB%E5%8A%A1 ）；66streaks Grid 布局（https://66streaks.com/blog/how-to-customize-habit-view/ ）；FinyxFin「hero 用派生数、原始总数降右上角小字、Momentum 默认一行」（https://finyxfin.app/help/today-help ）。

---

## 5. 候选四 · 「叠章」（STACK）

**一句话结构**：层级不靠并置与尺寸差，靠**时序与遮挡**。首页是一摞满宽卡（`.start__body{display:contents}` 后 5 块升格成卡），每块 `position:sticky` 错 20px 叠放：滚动时后卡把前卡顶成只露上边一条；章首标题（伪元素 `writing-mode:vertical-rl` 侧标）常驻。首屏焦点 = 顶卡：今日任务卡（一个新词大数 + 一句原因 + 卡内满宽钮）。

**数据 / 砍留 / 去向**
- 顶卡（唯一完整呈现）：`allowedNew`（figure1）、一句原因（`.today-card__reason.is-*`）、批数（`.start__spec-row:nth-child(3)`）、两枚入口、卡内 CTA。
- 第二卡露边：到期分数 + 逾期 + 连续（figures 2–4，作为「明细卡」被压栈）。
- 第三卡露边：承诺句 `pendingReviews`（首页独有 ⇒ 留，成为「队列」章首句）。
- 第四卡：阶段 / 已学 / 总词（`.start__eyebrow` + `.start__meta`）——与其它页重复，压到堆底等于默认不可见。
- 砍掉：`title/lede`、`.start__masthead-brand`、`.readouts`（读数带与顶卡争焦点）。
- 去向：**不减数据，减同时性**（Smart Stack 本义）。批数/待复习仍在首页；只有真重复的副本进堆底。

**主 CTA**：**卡内满宽 56px**（不钉底、不悬浮、不成全屏），随顶卡一起被压栈——「被需要时才在场」。第二卡内不再放第二颗钮（`:has()` 保证只顶卡有钮视觉权重）。

**具体 CSS 手段**
```css
[data-skin='stack'] .start{display:grid;grid-auto-rows:min-content;gap:var(--space-4);padding-bottom:var(--space-7);
  min-height:calc(100dvh - 56px - env(safe-area-inset-top,0px))}
[data-skin='stack'] .start__body{display:contents}
[data-skin='stack'] .readouts,[data-skin='stack'] .start__title,[data-skin='stack'] .start__lede{display:none}
[data-skin='stack'] .today-card,[data-skin='stack'] .start__spec,[data-skin='stack'] .start__meta{
  position:sticky;background:var(--surface);border:1px solid var(--border-strong);border-radius:var(--radius-lg);
  box-shadow:var(--shadow-md);padding:var(--space-4) var(--space-4) var(--space-5)}
[data-skin='stack'] .today-card{top:calc(56px + env(safe-area-inset-top,0px));z-index:4}
[data-skin='stack'] .start__spec{top:calc(76px + env(safe-area-inset-top,0px));z-index:3}
[data-skin='stack'] .start__meta{top:calc(96px + env(safe-area-inset-top,0px));z-index:2}
[data-skin='stack'] .today-card__figures{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:var(--space-2) var(--space-4)}
[data-skin='stack'] .today-card__figure:first-child b{font-size:clamp(44px,13vw,72px);line-height:.9;font-variant-numeric:tabular-nums}
[data-skin='stack'] .today-card__figure:nth-child(n+2){font-size:14px;clip-path:inset(0 0 0 0)}      /* 被压栈的明细只露一行 */
[data-skin='stack'] .start__spec-row:not(:nth-child(3)){display:none}                                  /* 顶卡只留批数 */
[data-skin='stack'] .today-card__reason:last-of-type{position:sticky;top:calc(76px + env(safe-area-inset-top,0px));z-index:3}
[data-skin='stack'] .start__spec{counter-reset:ch}
[data-skin='stack'] .today-card::before{content:"TODAY";writing-mode:vertical-rl;position:absolute;left:-1px;top:0;
  padding:8px 3px;border-inline-start:2px solid var(--accent);font-size:11px;letter-spacing:.16em}     /* 侧挂章节标 */
[data-skin='stack'] .today-card__links{display:flex;gap:var(--space-2)}
[data-skin='stack'] .today-card__links .btn--compact{min-height:44px;min-width:44px;flex:1 1 0}         /* 两枚入口满宽成两块 */
[data-skin='stack'] .start__actions{margin-top:var(--space-4)}
[data-skin='stack'] .start__actions .btn--primary{width:100%;min-height:56px}
[data-skin='stack'] .start__foot{margin-top:auto}
```
`:has()` 决定「哪张卡当顶卡」：`[data-skin='stack'] .start:has(.today-card b.is-warn) .today-card__reason.is-paused{order:-1}`——有逾期/暂停时先给告警卡，`is-ok` 时给计划卡。
字体族 2：Instrument Serif（顶卡大数 + 章标拉丁）+ IBM Plex Sans（中文正文）。
**深色档单独设计**：叠层的深度**不能用阴影**（SKIN_BRIEF 明令深色重定义阴影）⇒ 改为「明度阶 + 1px 亮边」：顶卡 `--surface-raised`、下压卡 `--surface`、堆底 `--surface-sunken`，露出的上边给 1px `rgba(255,255,255,.06)` 高光；`prefers-reduced-motion` 下 sticky 保留（非动画）但 `scroll-behavior:smooth` 关。

**360 / 768 / 1440**
- 360：`top` 偏移必须小于顶栏实高之和（56 + safe-area），露边量 20px 靠 76/96 的差得到 ⇒ 全部卡片 `margin-inline:0`、`.screen` 左右 20px，卡片满宽不溢出；卡内两枚入口各 `flex:1 1 0` 保证 44×44。
- 768：叠卡改「左右分栏 + 保留 sticky」——`.start{grid-template-columns:minmax(0,1fr) 320px}`，顶卡在左列 sticky，明细卡列在右列不再压栈（大屏不需要遮挡）；露边侧标 `writing-mode:vertical-rl` 移到卡外侧。
- 1440：两列 + 中轴 640/760 锁宽；堆栈语义只在窄屏出现，宽屏退化为「档案室式双栏」，但**顶卡唯一焦点**这条不变（靠尺寸与描边，不靠遮挡）。

**风险**
- sticky 叠卡依赖 `.app__main` 是唯一滚动容器（`app.css:108-117`）⇒ 若顶栏/读数带高度与 `56px` 常量不符，露边量不齐（**需实测**，写死值要按量得的顶栏高替换）。
- iOS Safari 上 `backdrop-filter` 若被用于卡片需降级为实底（笔记 §8 明示）；本候选默认实底，不冒险。
- 一屏只完整一张 ⇒ 「一瞥」得到的是**结论**不是全貌；被压栈的逾期数若不靠 `:has()` 上提，就有藏危险项的风险（已在 CSS 里用 `order:-1` 处理）。
- 挤掉功能入口：两枚入口被留在顶卡内，压栈后仍在顶卡里 ⇒ 安全；但 `start__foot`「换个阶段」被 `margin-top:auto` 推到堆底，需实测是否会卡在最后一张卡下面。
- 溢出：侧挂 `::before` 用 `position:absolute;left:-1px` 压在卡片边框上，不出 `.screen` 的 20px 安全边距 ⇒ 零横向溢出；`writing-mode` 竖排文本必须给 `max-height` 防超长。
- **假进度**：本候选没有任何进度图形，风险最低。

**借鉴**：Apple Watch Smart Stack「一次只看一张、顶卡即首页、High Confidence 才出现」（https://developer.apple.com/design/human-interface-guidelines/designing-for-watchos ；https://www.ifanr.com/1627189 ）；Siri Modular 表盘「行的宽度和形状本身就是层级」（https://9to5mac.com/2026-09-09/hands-on-with-siri-modular-watchos-27s-new-apple-watch-face/ ）；Fabulous 按早/午/晚分节的竖排卡流 + 章节可开关（https://help.thefabulous.co/en/support/solutions/articles/101000432070-how-to-organize-my-homepage- ）；Keep 9.0 方形入口与压平层级（https://www.woshipm.com/share/6385599.html ）；Carrot 卡片顺序由用户自排（https://www.macstories.net/reviews/carrot-weather-40-simply-delightful/ ）；Finch「首页只有一个今日概念，其余动作带解锁态」（https://help.finchcare.com/hc/en-us/articles/37780000231309-Exploring-the-Finch-Home-Page ）。

---

## 6. 候选五 · 「浮岛」（ISLAND）

**一句话结构**：首页**没有文档流**。`.screen` 是一整块画布（SVG data-URI 地形纹理 + CSS 天际线剪影），信息以四个悬浮件出现：顶部警报 chip（`.start__kicker`，sticky）、四角各一条小字（日期 / 唯一数字 / 承诺句 / 入口）、底部一枚**满幅行动面**。这是把「地图即首页」搬到背单词上。

**数据 / 砍留 / 去向**
- 保留（首页只有 1 个大数 + 3 条短句）：`allowedNew`（唯一数字）、承诺句 `pendingReviews`（首页独有 ⇒ 保留）、两枚入口（错词本 / 学习日历，浮在底部条上方）、`.start__foot`「换个阶段」贴左下角。
- 砍掉：`.readouts`、`.start__spec` 全部 4 行、`.start__meta`、`.today-card__figure` 2–4、`.today-card__reason` 第一句（可选保留为顶部 chip）、`title/lede`、卡框。
- **代价（必须单独决策）**：批数 `todayBatchCount` 唯一非 hidden 载体是 `.start__spec-row:nth-child(3)`，本候选把它砍了 ⇒ 首页不再有批数。两个去向：① 日历 `cal-figures` 补一行（开放式 `dl`，补两行成本最低，但**是 DOM 改动**）；② 保留该行为「行动面上方一条 24px 细字」——零 DOM，仍成立（本文推荐的默认档）。若主设计者要极致空屏，就选 ①，并把这条写进 DOM 决策清单。
- 其余（到期/逾期/连续/已学/阶段）在日历页 `cal-figures:168-189` 与我的页 `ProfileScreen:96,333-339` 都有等价展示 ⇒ 移出不丢。

**主 CTA**：**整屏即按钮**（极端检验：去掉所有数字后用户是否仍知道按哪里）。`.start__actions{position:fixed}` 撑满 `app__main` 可视区（顶栏之下到底），`.btn--primary{width:100%;height:100%;border-radius:0;font-size:clamp(22px,6vw,32px)}`。
退档（推荐先做）：`.start__actions` 不铺满，而是**底部满幅 68px 行动层**，画布与四角在它之上——保留悬浮骨架，去掉「整屏按钮吞点击」的风险。两档共用同一版面骨架。

**具体 CSS 手段**
```css
[data-skin='island'] .screen{position:relative;min-height:calc(100dvh - 56px - env(safe-area-inset-top,0px));padding:0}
[data-skin='island'] .screen::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cpath d='M0 40 Q30 26 60 40 T120 40 M0 84 Q30 70 60 84 T120 84' fill='none' stroke='%23c9c6bd' stroke-width='.6'/%3E%3Ccircle cx='10' cy='10' r='1' fill='%23c9c6bd'/%3E%3C/svg%3E");
  background-size:120px 120px;opacity:.5}                                        /* 等高线 + 点阵，纯装饰；stroke/fill 色值浅深两档各写一遍（无外链） */
[data-skin='island'] .start{position:static;display:block}
[data-skin='island'] .start__body{display:contents}
[data-skin='island'] .today-card{display:contents}                                /* 卡框彻底消失 */
[data-skin='island'] .readouts,[data-skin='island'] .start__spec,[data-skin='island'] .start__meta,
[data-skin='island'] .start__title,[data-skin='island'] .start__lede,[data-skin='island'] .start__masthead,
[data-skin='island'] .today-card__figure:nth-child(n+2){display:none}
[data-skin='island'] .start__kicker{position:fixed;top:calc(56px + env(safe-area-inset-top,0px));left:var(--page-x);
  z-index:16;font-size:12px;letter-spacing:.12em;padding:6px 10px;border:1px solid var(--border-strong);border-radius:var(--radius-full)}
[data-skin='island'] .today-card__figure:first-child{position:fixed;top:22%;left:50%;transform:translateX(-50%);z-index:14;
  text-align:center;white-space:normal}
[data-skin='island'] .today-card__figure:first-child b{display:block;font-family:var(--is-num);
  font-size:clamp(72px,26vw,140px);line-height:.84;font-variant-numeric:tabular-nums;letter-spacing:-.04em}
[data-skin='island'] .today-card__head{position:fixed;bottom:calc(var(--is-bar) + 16px);left:var(--page-x);right:var(--page-x);z-index:14}
[data-skin='island'] .today-card__links{display:flex;gap:var(--space-2);margin-top:8px}
[data-skin='island'] .today-card__links .btn--compact{min-height:44px;min-width:44px}
[data-skin='island'] .today-card__reason:last-of-type{position:fixed;bottom:calc(var(--is-bar) + 84px);left:50%;
  transform:translateX(-50%);width:min(92%,420px);font-size:14px;text-align:center;z-index:14}
[data-skin='island'] .start__foot{position:fixed;bottom:calc(var(--is-bar) + 152px);left:0;right:0;z-index:14;
  justify-content:center;gap:var(--space-4);font-size:14px}
[data-skin='island'] .start__masthead-meta{writing-mode:vertical-rl}              /* 退档：日期竖排钉在右上 */
[data-skin='island'] .start__actions{position:fixed;inset:auto 0 0 0;z-index:15;--is-bar:68px;
  padding-bottom:env(safe-area-inset-bottom,0px);border-top:1px solid var(--border-strong);background:var(--surface-raised)}
[data-skin='island'] .start__actions .btn--primary{width:100%;min-height:var(--is-bar);border-radius:0;
  display:grid;place-items:center;font-size:clamp(18px,5.2vw,24px)}
```
整屏档（更极端）：`.start__actions{top:calc(56px + env(safe-area-inset-top,0px));bottom:0}` + `.btn--primary{height:100%}`，按下态只用 `transform:scale(.995)` 与背景加深，**不要 translateY**（会露出底下空层）。
纹理与天际线：`.screen::after` 三层 `clip-path:polygon(...)` 叠出山脊剪影（纯装饰、零数据语义，绝不表示进度）；`mask-image` 给天际线渐隐上沿。
`:has()`：`[data-skin='island'] .start:has(.today-card b.is-warn) .start__kicker{border-color:var(--danger);color:var(--danger)}`（chip 转红 = 唯一合法红）；`is-ok` 时 chip 用 accent 描边。
字体族 2：Space Grotesk（大数 + chip 拉丁刻印）+ IBM Plex Sans（中文）。
**深色档单独设计**：纹理 `opacity` 降到 .28 且改用 `rgba` 亮线；天际线用比 `--bg` 更亮的两层（不是更暗）；行动面加 1px 上亮边代替 `--shadow-lg`；`--surface-raised` 在深色必须与 `--bg` 拉开 ≥6 个 L*。

**360 / 768 / 1440**
- 360：所有悬浮层左右用 `var(--page-x)` 收边 ⇒ 天然零横向溢出；大数 `26vw≈94px` 两位数安全；风险在**纵向堆叠**：chip / 大数 / 承诺句 / foot / links / 行动层共 6 层，360×640 可能重叠 ⇒ 必须按实测把 `bottom` 偏移写成一组 `--is-*` 度量集中调。
- 768：画布分成左右两岛——大数钉在左 40%、links + 承诺句 + foot 钉在右列；行动层仍满幅但左右内收到 640 轴。
- 1440：`--app-max 760` 锁住 fixed 层（`left:50%;transform:translateX(-50%);width:min(100%,var(--app-max))`），否则满幅按钮在大屏上飞出内容列（笔记 §4.8 明确点过这个坑）；画布纹理在宽屏降透明度并加居中径向外光，避免大片空。

**风险**
- **最高**：大面积 `fixed` 层与 `.app__main` 滚动冲突——若首屏之下还有可滚内容就会不可达，本候选要求**首页真的没有内容流**（验收：`.app__main.scrollHeight === clientHeight`）。
- 被隐藏元素必须用 `display:none`，不能用 clip / sr-only，否则朗读顺序里出现大片空白。
- 整屏按钮 + 44px 目标重叠 ⇒ 顶栏 3 个按钮与 links 的点击不能被打断（退档可完全规避）。
- 假进度：本候选无任何进度图形；风险反而是**四角小字被读成「没有信息」**（NN/g 对过度极简的可发现性警告）⇒ 保留承诺句与批数细字是底线。
- `backdrop-filter` 禁用：`.app/.app__main/.screen/.start` 目前无 transform/filter（笔记 §4.9 抽查），本候选若加毛玻璃会把它们变成 fixed 后代的包含块 ⇒ 明确不用。

**借鉴**：Watch Duty / BC Wildfire / WeatherAI 的「地图即首页、UI 全部悬浮、列表统一行模板、restraint and clarity」（https://on.theverge.com/2025/1/11/24340913/watch-duty-wildfire-tracking-app-los-angeles-nonprofit ；https://weatherai.world/blog/weatherai-2026-08-1-release ；https://refs.gallery/apps/watch-duty ）；彩云雷达带全出血 + 底部时间轴滑块（https://m.163.com/tech/article/9RTKIR8400094ODU.html ）；Nike Run Club「Run 本身是一个 tab，整页就是 START」（https://www.makeuseof.com/beginners-guide-using-nike-run-club-iphone/ ；https://www.makeuseof.com/make-the-most-of-nike-run-club-app/ ）；Streaks「首页 = 大号按钮，长按即完成」（https://apps.apple.com/th/story/id1272004658?l=th ；https://www.macstories.net/reviews/streaks-6-brings-habit-tracking-to-your-home-screen-with-extensively-customizable-widgets/ ）；支付宝阿宝「首页只剩两页、九宫格整块删除、但底部仍留高频快捷键」（http://mp.weixin.qq.com/s?__biz=MzYzNDg5NDE4MQ==&mid=2247484629&idx=2&sn=655afc8102bc4055837c95f626a88443 ）；Monzo「可点对象即入口」（https://monzo.com/blog/the-new-and-improved-home-screen ）；Robinhood「CTA 里带数据」（https://ixd.prattsi.org/2025/02/design-critique-robinhood-ios-app/ ）。

---

## 7. 反换色清单：什么才叫「结构不同」（5 条可操作判据）

> 这五条是从四族调研里抽出来的**判废标准**，不是风格建议。任何一条不满足，就按「换色方案」退回。

1. **令牌还原测试**（判废闸门）。把新皮肤 CSS 里的颜色、圆角、字体族、阴影全部还原成 `bento` 的令牌值，版面读起来是否仍与 bento 不同？不同 ⇒ 通过；只是「bento 换了个数字大小」⇒ 作废。
   来自 `02-finance` 的判废标准，也是 `01-fitness` 方向 C 的自证方式（"三版中只有 C 改变桌面端栏数"）。
2. **首屏焦点必须换成另一类物体，而不是同类物体的放大版**。合格焦点：一枚环 / 一条横滑刻度带 / 一张每行形态不同的表 / 一摞压栈的卡 / 一块动作面。
   不合格：把 `.start__spec` 字号从 16 提到 44、把 `.readouts` 从 3 格改成 4 格、把卡片阴影换成描边。检验法：数首屏前 40% 高的「形态种类数」——7 套现有皮肤都是 1（文字块 + 按钮），新皮肤必须 ≥2 且其中至少一个是 `01-fitness` 说的**带目标参照的形状**或 `06-ambient` 说的**替代心算的刻度**。
3. **删手段塌陷测试**。把新皮肤里的 `display:contents` / `position:sticky|fixed` / `scroll-snap` / `conic|mask` / `writing-mode` / `clip-path` / `counter` 这七类结构手段删光，版面是否塌回 paper 的纵向文档流？塌回 = 只换了皮；**不塌回**（比如横滑带的存在本身改变了阅读轴、叠卡的存在本身改变了 z 轴）= 结构差异。
   对应 `06-ambient` 方向 C 的「层级靠时序与遮挡，不靠并置与尺寸差」与 `01-fitness` 方向 C 的「只有它改变桌面栏数」。
4. **一个数只出现一次 + 每个数一种形态（口径决定形态）**。`allowedNew` 首页 4 份必须收敛到 ≤1；并且 Stock / Quota / Recurring / Flow 四类口径不能共用同一种容器（`02-finance` JVDS 判据：「不要用同一种环形图同时表达构成比、健康度、预算消耗」）。
   合格写法举例：配额 = 大字 + 刻度尺；到期 = `x/y` 分数 + 队列行；逾期 = 只在 `:has(b.is-warn)` 时出现的红块；连续 = 一行 delta 脚注（不是卡）。
   **同时给诚实红线**：无 JS 拿不到比例，形状只能分档（`is-*` 三档）或纯装饰；凡可能被读成完成度的填充，必须在评审里写明是示意，否则判「假进度」。
5. **CTA 的导航层级必须变，而不只是变厚**。7 套全部是「文档流里一颗矩形按钮」。合格形态（各占一轴，互不重复）：中心对称圆钮（`ring`）/ sticky 满宽提交行（`axis`、`ledger`）/ 卡内件随顶卡压栈（`stack`）/ 满幅行动面即页面本身（`island`）/ 底部常驻横条 + 单列 feed（`01-fitness` 方向 B）。
   检验法（`01-fitness` + `10-habit` 共识）：**首页回答的问题数**必须变（1 个 / 0 个 / 6–8 个），且「什么被推到二级页」的清单要写得出、逐项有承接页；只把按钮从 48px 加到 60px 不算。

附加自检（写进验收脚本之外）：
- 首屏可点目标集合是否变了（数量 / 位置 / 是否常驻），而不是同 7 个目标换个形状；
- 360 / 768 / 1440 三档的**栏数**是否有至少一档不同（现有 7 套全是单栏 + 大屏居中）；
- 深色档是否单独定义了分层方式（明度阶 / 亮边 / 内发光），而不是浅档调暗。

---

## 8. 五案对照速查

| | 合环 RING | 横轴 AXIS | 台账 LEDGER | 叠章 STACK | 浮岛 ISLAND |
|---|---|---|---|---|---|
| 焦点物体 | 一枚刻度环 + 1 个数字 | 一条横向刻度带 | 一张每行不同形态的表 | 一摞压栈的卡（顶卡即首页） | 一块动作面 + 1 个悬浮大数 |
| 首屏数据量 | 1 | 4（横滑）+1 行批数 | 8 行（高密度） | 4（但一屏只完整 1 张） | 1（+ 3 条短句） |
| 阅读轴 | 径向 | **横向** | 纵向基线 | **z 轴 + 时序** | 无流（悬浮层） |
| CTA 地位 | 环下圆钮（流内） | sticky 满宽 62px | sticky 52px 提交行 | 卡内 56px，随卡压栈 | fixed 满幅（退档 68px 层） |
| 768+ 栏数 | 1（三列居中） | 1 | **2** | **2** | 1→2 |
| 首页独有两项 | 都留（零 DOM） | 都留（零 DOM） | 都留（零 DOM） | 都留（零 DOM） | 待复习留，**批数需 DOM 决策或留细字** |
| 假进度风险 | 中（用刻度环不用百分比弧） | 低（基线仅装饰） | 中（刻度尺分档） | **最低（无进度图形）** | 低（无进度图形） |
| 溢出/遮挡风险 | 低 | 中（横滑藏数据） | 中（360 密度） | 中（sticky 偏移靠实测） | **高（fixed 吞滚动）** |
| 一句话本质 | 首页=一台仪器 | 首页=一条时间轴 | 首页=一本账 | 首页=一摞卡片 | 首页=一张地图 |

**推荐顺序（供拍板参考）**：**叠章 ≥ 横轴 > 合环 > 台账 > 浮岛**。
- 首推「叠章」：它把层级从「并置 + 尺寸差」换成「时序 + 遮挡」，是现有 7 套完全没碰的维度；数据一项不减、两个首页独有数都留、无假进度、不依赖 fixed；代价只有 sticky 偏移需要实测。
- 「横轴」最像「一瞥即读」的第二选择：阅读轴真的翻转，但横滑会把逾期推到折线外，需要 `:has()` 上提来补。
- 「浮岛」视觉强度最高、可发现性风险也最高，建议作为「退档版」（底部满幅行动层 + 四角悬浮件）先落地验证。

---

## 9. 本会话无法验证、需主设计者实测的点

1. 开 `.readouts` 的候选（台账）里 `100dvh - 56 - 34 - safe-area` 是否与实际顶栏/读数带高度相符（幽灵滚动 / 钉底件卡在折线外）。
2. sticky 系列的 `top` 常量（`axis` 底条、`stack` 三级 76/96、`island` chip）在 iOS Safari 与刘海机的实际数值；`bottom` 与 `env(safe-area-inset-bottom)` 叠加。
3. `island` 整屏档：`.app__main.scrollHeight === clientHeight` 是否成立；顶栏 3 个按钮与 links 的点击是否被 fixed 层吞掉。
4. `ring` 的 `repeating-conic-gradient + mask` 在目标 WebView 是否渲染；不渲染时是否退化为「中心数 + 细线圆」而不塌版。
5. `ledger` 三层 `display:contents` 后读屏朗读顺序（head → figures → reason）与 360 台账列宽（`em` 列换行）；中文 14px 下限与 11px 数字刻印豁免的边界。
6. `:has()` 在 iOS 15.4+/Chrome 105+ 的可用性；不支持时是否只降级为「无条件样式」（逾期行常显、叠卡退化为普通顺序）而不破骨架。
7. 明暗两档各跑一遍对比度：`--warning/--danger/--success` 深色档是否写齐（历史上栽过两次）；`is-accent` 大数字在浅档是否只走 3:1 大字。
