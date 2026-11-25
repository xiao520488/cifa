# 00 数据可见性清单（首页皮肤改造 · 只盘点不改码）

- 盘点时间：2026-11-25。方法：grep 定位 + 按行区间读源码，未运行浏览器、未改任何 src 文件。
- 首页 = `src/components/StudyScreen.tsx` + 注入的 `src/components/TodayCard.tsx`（装配点 `src/App.tsx:212-234`）。
- 其它页面：`SessionScreen.tsx`（统一学习流，含即时复习与收尾）、`CalendarScreen.tsx`、`ProfileScreen.tsx`、`MistakesScreen.tsx`。
- 数据底座：所有数字来自调度引擎三接口 `plan()` / `stats()` / `allowance()`（`src/App.tsx:52-60`、`src/hooks/useScheduler.ts:43-50`）；持久化在 `cijian.v1`（`src/lib/storage.ts:3`）与 `cijian.scheduler.v1`（`src/lib/scheduler/storage.ts:28`）两个 localStorage key。**从界面移除任何数字都不会丢数据，丢的只是"可见性"。**

---

## 1. 首页当前展示的数据项

### 1.1 StudyScreen（骨架区）

| # | 数据项 | 来源字段 / 推导 | DOM 位置（类名） | 定义处 file:line | 渲染处 file:line |
|---|--------|----------------|------------------|------------------|------------------|
| S1 | 阶段名（如"四级"） | `levelMeta(stage).name` | `.topbar__meta > span` | App.tsx:47 | StudyScreen.tsx:61 |
| S2 | 「今日 N 词」/「今日新词已发完」 | `plan.allowedNewWords` | `.topbar__meta > span`（三元文案） | App.tsx:65 ← plan.ts:301 | StudyScreen.tsx:65 |
| S3 | 大字读数「今日」 | `allowedNewWords`（补零 2 位） | `.readouts .readout__v` | App.tsx:65 | StudyScreen.tsx:82 |
| S4 | 大字读数「批数」 | `todayBatchCount = ceil(allowedNew/batchSize)` | `.readouts .readout__v` | App.tsx:66 | StudyScreen.tsx:86 |
| S5 | 大字读数「已学」 | `shortCards+longCards+archivedCards` | `.readouts .readout__v` | App.tsx:67-68 ← engine.ts:1047-1049 | StudyScreen.tsx:90 |
| S6 | 日期 `YYYY · MM · DD` | `new Date()`（前端本地日期） | `.start__masthead-meta` | StudyScreen.tsx:49-52 | StudyScreen.tsx:112 |
| S7 | 阶段短码 + "DAILY LIST" | `stageMeta.short` | `.start__kicker` | App.tsx:47 | StudyScreen.tsx:114 |
| S8 | 词库总量 | `book.words.length` | `.start__eyebrow` | App.tsx:44 | StudyScreen.tsx:117 |
| S9 | 每批词数（汉字文案「一页X个词」） | `chineseCount(batchSize)` | `.start__title` | profile.batchSize（types.ts:73，默认 storage.ts:8） | StudyScreen.tsx:120（words.ts:101） |
| S10 | 今日 N 词 / 已学 N 词（小号） | allowedNew / learnedCount | `.start__meta > span > b` | App.tsx:65,67 | StudyScreen.tsx:130,133 |
| S11 | 规格行：阶段 | stageMeta.name | `.start__spec-row .start__spec-v` | App.tsx:47 | StudyScreen.tsx:138-139 |
| S12 | 规格行：今日新词 | allowedNewWords | `.start__spec-row` | App.tsx:65 | StudyScreen.tsx:142-143 |
| S13 | 规格行：今日批次（共 N 批 · 每批 M 词） | todayBatchCount + batchSize | `.start__spec-row` | App.tsx:66 | StudyScreen.tsx:146-149 |
| S14 | 规格行：已学 X / 总 N | learnedCount / totalCount | `.start__spec-row` | App.tsx:67,44 | StudyScreen.tsx:152-154 |
| S15 | 词库为空时的空态文案 + 导入/切阶段按钮 | `totalCount===0` | `.empty`（整个分支替换正文） | StudyScreen.tsx:48 | StudyScreen.tsx:96-106 |

> 注：S3/S10/S12 与 S5/S10/S14、S2/S12 是**同一数据在首页内部的三次重复**（readouts、start__meta、spec-row），挪皮肤时不必三份都保。

### 1.2 TodayCard（今日摘要区，App 以 `todayCard` prop 注入，App.tsx:221-228）

| # | 数据项 | 来源字段 | DOM 位置 | 定义处 | 渲染处 |
|---|--------|----------|----------|--------|--------|
| T1 | 「今日 · M月D日 周X」 | `plan.day` | `.today-card__label` | types.ts:185 | TodayCard.tsx:41-43 |
| T2 | 错词本入口按钮「错词本 N」 | `stats.mistakes` | `.today-card__links .btn--compact`（>0 才渲染） | engine.ts:1051 | TodayCard.tsx:45-49 |
| T3 | 日历入口按钮 | —（导航） | `.today-card__links` | — | TodayCard.tsx:50-52 |
| T4 | 新词大字 + `↑ +5`/`↓` 角标 + 「计划 N」 | `plan.allowedNewWords`、`newWordHeadline().tag`、`plan.newWordLimit`（被闸时） | `.today-card__figure > b` / `.today-card__tag` | types.ts:196-198；copy.ts:85-139 | TodayCard.tsx:57-62 |
| T5 | 到期复习 `done/total` | `plan.totals.doneToday/dueToday` | `.today-card__figure > b` | types.ts:203-204 | TodayCard.tsx:63-68 |
| T6 | 逾期数（>0 标 warn 色） | `plan.totals.overdue` | `.today-card__figure > b.is-warn` | types.ts:205 | TodayCard.tsx:69-72 |
| T7 | 连续优秀天数 | `stats.consecutiveGoodDays` | `.today-card__figure > b` | engine.ts:1045 | TodayCard.tsx:73-76 |
| T8 | 原因句（三态：奖励/减量/被闸解释） | `newWordHeadline().note`（内含 blockedBy/quota/pool/review/overdue 分支文案） | `.today-card__reason.is-{tone}` | copy.ts:85-139 | TodayCard.tsx:79 |
| T9 | 「点开始会先复习这 N 个到期词」句 | `pendingReviews = Σ short+overdue+long 批次词数` | `.today-card__reason`（>0 才渲染） | TodayCard.tsx:33-36 | TodayCard.tsx:81-85 |

---

## 2. 每项数据在其它页面的可见性

| 数据项（编号见上） | 其它页面哪里能看到 | 形式 | file:line | 挪走后 |
|---|---|---|---|---|
| 今日新词 allowedNew (S2/S3/S12/T4) | 日历页 hero「现在可学 N」 | 大标题 | CalendarScreen.tsx:163 | 仍可见 |
| 同上 | 「我的」页每日新词区「今天计划 allowance.planned」+ `currentLimit`（注：是计划/基线，**不是**过闸后的 allowed） | stat 数字 | ProfileScreen.tsx:242-245 | 部分可见 |
| 同上 | Session 列表阶段进度条 total=当日新词队列 | 进度条 | SessionScreen.tsx:349-354, 402-413 | 会话内可见 |
| 批数 todayBatchCount (S4/S13) | Session 顶栏「第 i / N 批」 | 顶栏文字（仅会话进行中） | SessionScreen.tsx:379-384 | **首页独享**（页面级无静态展示） |
| 已学 learnedCount (S5/S10/S14) | 「我的」页 profile__meta 与学习进度 stat+进度条 | 文本 + 数字 + 进度条 | ProfileScreen.tsx:96, 333-339 | 仍可见 |
| 同上 | 日历页脚「短期/长期/归档」三数（拆分形态） | 页脚文本 | CalendarScreen.tsx:254-256 | 仍可见（拆分） |
| 词库总量 totalCount (S8/S14) | 「我的」页 4 处：profile__meta、stage-grid 每档词数、词库区、学习进度分母 | 列表徽标 + 文本 | ProfileScreen.tsx:96, 120-122, 202-204, 335 | 仍可见 |
| 每批词数 batchSize (S9/S13) | 「我的」页 Segmented 选择器 | 分段控件 | ProfileScreen.tsx:132-145 | 仍可见 |
| 阶段 (S1/S7/S11) | 「我的」页选中态 stage-grid + 词库区小字 | 网格按钮 | ProfileScreen.tsx:105-128, 203 | 仍可见 |
| 日期 (S6/T1) | 日历页顶栏副题、hero kicker、7 个 DayCard 日期格 | 文本 + 日历格 | CalendarScreen.tsx:141-143, 156, 67 | 仍可见 |
| 计划值 newWordLimit / 「计划 N」(T4) | 日历页 hero「新词 N」大字；「我的」页 allowance.planned | 大标题 / 文本 | CalendarScreen.tsx:158; ProfileScreen.tsx:244 | 仍可见 |
| `↑ +5` 角标 (T4) | 日历 hero 同款 tag；DayCard 负荷行 bonus chip | 角标 / chip | CalendarScreen.tsx:159; copy.ts:332-335 | 仍可见 |
| 原因句 headline.note (T8) | 日历 hero heroNote（同一个 `newWordHeadline()`） | 段落 | CalendarScreen.tsx:123,131,165 | 仍可见 |
| 到期复习 done/total (T5) | 日历 hero `cal-figures` dl；Session 复习阶段进度「今日复习 x/y」 | 统计块 / 进度条 | CalendarScreen.tsx:168-174; SessionScreen.tsx:346-348 | 仍可见 |
| 逾期 overdue (T6) | 日历 hero `cal-figures` dl（>0 标 warn）；Session 队列把逾期词混入复习（buildReviewQueue） | 统计块 / 队列 | CalendarScreen.tsx:175-180, 186; SessionScreen.tsx:80-90 | 仍可见 |
| 长期逾期 longOverdue | 日历 hero 警示句（**首页反而没有**） | 段落 | CalendarScreen.tsx:192-196 | 与首页无关 |
| 今日已学 newLearned | 日历 hero `cal-figures`（**首页没有**） | 统计块 | CalendarScreen.tsx:181-184 | 与首页无关 |
| 连续优秀 (T7) | 日历 hero `cal-figures`「连续优秀 N 天」 | 统计块 | CalendarScreen.tsx:185-188 | 仍可见 |
| 错词数 mistakes (T2) | 「我的」页错词本行「N 个词待清」；错词本页头「N 个词」 | setting-row / 顶栏 | ProfileScreen.tsx:349-361; MistakesScreen.tsx:127 | 仍可见 |
| pendingReviews 合计 (T9) | 日历页只有三段拆分（到期复习 dl、逾期 dl、长期 chip），**任何页面没有这个合计句** | — | 拆分来源 CalendarScreen.tsx:168-180 + copy.ts:337-346 | **首页独享** |
| 错词本/日历入口 (T2/T3) | 「我的」页同样有打开日历+错词本两行；日历页有开始按钮 | setting-row | ProfileScreen.tsx:340-361 | 入口有替代，但**首页是唯一常驻入口** |

---

## 3. 首页独享（挪走 = 该信息全站不可见）

| 数据 | 说明 | 补齐代价 |
|---|---|---|
| **今日批数** `todayBatchCount`（StudyScreen.tsx:86, 146-150） | 派生值 `ceil(allowedNew/batchSize)`（App.tsx:66）。Session 的「第 i/N 批」只在学习会话进行时存在（SessionScreen.tsx:382），不能替代静态展示。 | 低：输入两个字段各页都有（allowedNew 在日历 hero，batchSize 在我的页），在任何页面加一行文本即可，但**属于改 DOM，需单独决策**。 |
| **待复习合计句** `pendingReviews`（TodayCard.tsx:33-36, 81-85） | `Σ(shortTermBatches+overduePool+longTermBatches).wordCount`。日历只分别给三个拆分数字，无合计。 | 低：同一 reduce 逻辑直接可搬（数据在 `DailyPlan` 里现成，types.ts:187-192）。 |
| 「先复习完才轮到新词」的**顺序承诺文案** | T9 后半句，属于流程解释而非数据。 | 属文案决策，非数据丢失。 |

除以上三项外，**首页展示层没有任何"独有数据源字段"**——其余全部在日历页/我的页有可见落点。另外注意反向清单：`今日已学 newLearned`、`长期逾期 longOverdue`、`未学/短期/长期/归档拆分`（CalendarScreen.tsx:181-196, 254-257）和 `lifetimeAcc` 等引擎字段首页本来就没有。

---

## 4. 我的页 / 日历页当前信息密度

### 4.1 ProfileScreen（10 个 section，密度已偏高，全文 385 行）

| 块 | 内容一句话 | file:line |
|---|---|---|
| profile 头 | 头像首字 + 昵称输入 + 「阶段 · 已学 X / N 词」一行字 | ProfileScreen.tsx:78-99 |
| 学习阶段 | 6 格 stage-grid，每格短码 + 词数徽标 + 描述 | :101-130 |
| 每批单词数 | Segmented 5/8/10/15/20 + 一句 hint | :132-145 |
| 释义详略 | Segmented 三态 + 生效说明 | :147-165 |
| 外观风格 | SkinPicker + 快速切换按钮 | :167-181 |
| 明暗 | Segmented 三态 | :183-197 |
| 词库 | 3 条 setting-row：导入 / 我的词库(词数+删除) / 词库数据(来源·音标覆盖%·词频覆盖%) | :199-236 |
| 每日新词 | stat「currentLimit · 今天计划 allowance.planned」+ 目标 stepper + 上限 stepper(+Hint 弹层) + 默认显示中文 Segmented | :238-327 |
| 学习进度 | stat「learnedCount / total 已入库」+ 进度条 + 日历入口行 + 错词本入口行(含计数) | :329-362 |
| 危险区 + 页脚 | 清空学习数据 setting-row + 版本/离线声明 | :364-380 |

**还能塞下什么**：① 「学习进度」section 的 stat(:333-336) 下方可扩成 2×2 小数字组（到期复习/逾期/连续优秀/批数），模式照抄日历页 `cal-figures`；② 「每日新词」区已用 allowance.planned，可无损换成同时显示 allowed（App.tsx:261 已把 allowance 整个传入）；③ setting-row 是高复用行组件，任何"一句话数据+入口"都能追加一行，不破坏结构。

### 4.2 CalendarScreen（4 块，hero 已较满，DayCard 有格式锁定）

| 块 | 内容一句话 | file:line |
|---|---|---|
| hero「今天」 | kicker(学习日+4点换天) → 大标题「新词 limit / 可学 allowed」+↑tag → 两句 reason → `cal-figures` dl 四项（到期复习 done/total、逾期、今日已学、连续优秀）→ idle/longOverdue 警示句 → planSummary 长句 → 开始按钮 | CalendarScreen.tsx:155-216 |
| 接下来 7 天 | 7 张 DayCard，每张三层固定顺序：负荷 chip 行（复习·逾期·新词·↑·长期，copy.ts:299-348）→ 批次来源列表（N 天前 · 那批 · X 词）→ 空态/原因小字；**注释明说顺序不许再调**（REFACTOR_PLAN §6） | :218-236, 51-101 |
| 长期复习 | 一句预告（describeLongForecast）+ 规则说明 | :238-251 |
| 页脚 | 一行 8 个数：基线/目标/上限 · 未学/短期/长期/归档 | :253-257 |

**还能塞下什么**：① `cal-figures` dl(:168-189) 是开放式 dt/dd 列表，追加「今日批数」「待复习合计」两项成本最低；② 页脚行可追加派生数；③ DayCard 三层结构有规约保护，**不宜**再往里加行。注意：日历把今天排除在 DayCard 列表外（`view.days.slice(1)`，:125），今天的数据全部集中在 hero。

---

## 5. 可直接复用的现成字段（无需动引擎）

| 需求关键词 | 现成字段 | 类型定义 | 引擎出口 | 当前 UI 使用处 |
|---|---|---|---|---|
| 今日额度 | `NewWordAllowance{planned,allowed,reason}` | engine.ts:122-126 | `allowance()` engine.ts:336-354 | 仅我的页 :244 用了 planned |
| 今日新词（过闸值） | `DailyPlan.allowedNewWords` / `newWordLimit` / `newWordBlocked` | types.ts:196-200 | `plan()` | 首页四处 + 日历 hero |
| 到期复习 | `plan.totals.dueToday / doneToday` | types.ts:203-204 | `plan()`（plan.ts:262-263,304-306） | 首页 T5 + 日历 hero |
| 到期复习明细 | `plan.shortTermBatches / overduePool / longTermBatches`（各带 words） | types.ts:187-192 | `plan()`（plan.ts:256-261） | 首页 T9、Session 队列、日历 DayCard |
| 逾期 | `plan.totals.overdue`；长期版 `totals.longOverdue` | types.ts:205-206 | `plan()` | 首页 T6 + 日历 hero |
| 连续优秀 | `stats.consecutiveGoodDays` | engine.ts:168 | `stats()` engine.ts:1045 | 首页 T7 + 日历 hero |
| 词库总量 | `book.words.length`；任意阶段 `bookCount()` | — / words.ts:27 | App.tsx:44 | 首页 S8/S14、我的页 4 处 |
| 已学/库存拆分 | `stats.shortCards/longCards/archivedCards/unlearned` | engine.ts:170-173 | `stats()` 1047-1050 | App.tsx:67 求和；日历页脚 |
| 错词数 | `stats.mistakes` | engine.ts:175 | `stats()` 1051 | 首页 T2、我的页、错词本页头 |
| 基线/目标/上限 | `stats.currentLimit/userDailyGoal/maxLimit` | engine.ts:165-167 | `stats()` 1042-1044 | 我的页 steppers、日历页脚 |
| **尚未在任何页面使用**（想加就加） | `stats.lifetimeAcc`（终身正确率）、`stats.pendingImmediate`（待即时复习数）、`stats.lastAvgLoops`、`engine.longDueCount()` | engine.ts:176-178, 1058-1065 | `stats()` / 方法 | 无——纯闲置字段 |

结论：第 3 节两个"首页独享"值都是上述现成字段的**一行派生**（取整 / reduce 求和），给别的页面补展示不需要碰引擎、不需要新存储字段，只需要改那个页面的 DOM。

---

## 6. 结论：安全移除 / 必须保留 / 先补再挪

**A. 可以安全地从首页移除**（其它页面至少一处已有等价展示，移除不损失可见性）：
- 今日新词/计划值/`↑+5` 角标/原因句（S2、S3、S10、S12、T4、T8 → 日历 hero CalendarScreen.tsx:157-166）
- 到期复习、逾期、连续优秀（T5-T7 → 日历 cal-figures :168-188）
- 已学、词库总量、每批词数、阶段、日期（S1/S5/S6/S7/S8/S9/S10/S11/S13/S14 → 我的页 ProfileScreen.tsx:96,120-122,203,242-245,333-339 + 日历 hero/页脚）
- 错词计数（T2 的数字 → 我的页 :352-359、错词本页头 :127）
- 内部重复项（S3/S10/S12 三处同源、S5/S10/S14 三处同源）——皮肤里最多留一处。

**B. 必须保留在首页**：
- 主行动入口「开始背单词」（S 区 start__actions，StudyScreen.tsx:158-162）——Session 唯一入口（App.tsx:34-35）；日历页按钮是替代品但入口层级不同。
- 空态分支（S15）——词库为空时首页只剩导入引导。
- 导航入口（日历/皮肤/头像按钮 StudyScreen.tsx:68-76）——属交互不属数据，但新皮肤必须保留等价通道。

**C. 先给别的页面补、才能从首页挪走**（当前全站独享）：
1. **今日批数**（StudyScreen.tsx:86, 146-150）→ 建议补到日历 hero `cal-figures`（CalendarScreen.tsx:168-189）或我的页「学习进度」stat 下（ProfileScreen.tsx:333-339），一行派生。
2. **待复习合计 pendingReviews**（TodayCard.tsx:33-36, 81-85）→ 同上，dl 加一项即可。
3. 「复习清空才轮到新词」的顺序承诺（TodayCard.tsx:83）→ 若移除，日历页或 Session 内需有等价说明，属文案决策。
- 以上补展示 = 改 DOM，按任务约定需要单独决策；数据侧零成本（第 5 节字段全部现成）。

**D. 底线**：所有首页数字都是 `cijian.scheduler.v1` 持久化状态的只读投影（scheduler/storage.ts:28、useScheduler.ts:61-75），从首页移除**永远不会丢数据**，只影响"在哪还能看到"；真正的功能损失只有 B/C 两类（入口与独享派生值）。
