# UI v2 第二阶段：真日历 + 数据联动（**方案，未开工**）

> 状态：待用户批准。批准前不动任何 `.tsx` / `.css` / `lib/scheduler/**`。
> 前置：第一阶段已落 `2c6b4d8`（底部三 Tab、三页清理），数据页当前是「接下来 7 天」列表。

## 0. 目标与非目标

**目标**：数据页 = 一个月历网格（7 列，可翻月）+ 点任意一天在下方出该日详情面板；今天/历史/未来三种日期各有正确的数字来源。

**非目标**：不改调度算法、不改 `DayRecord` / 存储结构、不做补结算、不做日历内打卡、不加新 Tab、不做手势滑动翻月。

---

## 1. 数据从哪来（已核对源码）

| 日期 | 唯一数据源 | 说明 |
|---|---|---|
| 历史日 | `state.days[day]: DayRecord`（types.ts:52–78） | `snapshotDone` 之后 `dueSnapshot` / `planSnapshot` **冻结**，历史不会再变。缺这条记录 = 那天没来过（`absent`），只能显示「未使用」 |
| 今天 | `engine.plan()` → `DailyPlan`（types.ts:203–230） | 唯一带「现在真的能学多少」`allowedNewWords` 与 `newWordBlocked`、`warning`、`reason` 的一天 |
| 未来日 | `plannedNewWordLimit(state, day)` + `shortBatches(state, day)` + `longBatchesFor(state, day)` + `computeWordBudget(state, day)`（plan.ts 内部） | **全部是实时推算**，不是存档；`CalendarDay.estimated = true` 就是这个意思 |

**关键事实（别再猜）**：

1. `buildCalendar(state, {today, days})`（plan.ts:322）**只从今天往后走**（`addDays(today, offset)`，offset ≥ 0）。→ 月历要显示本月 1 号到月底，**过去那几天它算不出来**，必须新增一个反向/区间入口。
2. 历史日 `newWordAllowed` 被刻意回填成 `newLearned.length`、`newWordBlocked = null`（plan.ts:349–350）——因为「现在的池子」拿去套历史日会自相矛盾。月历里历史格**不要显示「可学」**。
3. 未来日 `newWordAllowed = newWordPlan`、`estimated = true`，且注释写明「未来日只报计划值，不装作知道届时能学多少」。→ 未来详情面板里「新词 20」要标**预估**，不许出现「实际 0」。
4. 未来复习量 = `shortBatches(state, day)`：按卡片的 `due === day` 现算，按 `sourceDate` 分组。它给的是「**已排定**」的到期词，**不含**「届时做完前面的复习才会排进来」的那部分（列表里那句「还没排上复习」就是这个意思）。→ 未来日详情必须区分「已排定 N 词」与「还会随进度追加」。
5. `DayRecord.overdue` 字段不存在；逾期 = `dueTotal - doneTotal`，用 `completionOf(record)` 取（plan.ts:330）。
6. 长期批次日只在**周日 / 每月 1 号**（plan.ts:385 `weekday(day) !== 0 && !isMonthFirst(day)`）；`nextLongForecast` 只扫 40 天，月历**不要**复用它，直接对可见月份的 42 格各调一次 `longBatchesFor`。
7. 性能：`shortBatches` 是 O(cards)。5000 词 × 42 格 ≈ 21 万次比较，单帧能过；但**只算一次**（`useMemo` key = 月份 + today + `version`），翻月才重算。

### 1.1 需要的引擎新增（只加不改）

```ts
// plan.ts 新增，buildCalendar 内部拆出 buildOneDay(state, day, today)
export function buildCalendarRange(state, opts: { start: StudyDay; end: StudyDay; today: StudyDay }): CalendarDay[]
// engine.ts 新增薄壳
calendarRange(start: StudyDay, end: StudyDay, today?: StudyDay): CalendarDay[]
```

- `buildCalendar` 改成「循环调 `buildOneDay`」，输出与今天完全一致（有现成测试兜底：`test:scheduler`）。
- `buildOneDay` 对历史日的兜底：`record?.snapshotDone ? record.dueSnapshot.length : record?.planSnapshot 求和 : 0`，**不要**回落到实时 `shortBatches`（那会把今天的到期算到 11 月 3 号头上）。
- 严禁动 `plan()` 与 `settle()`。

---

## 2. 日历网格 UI

### 2.1 结构（新组件 `MonthGrid.tsx`，只读 props）

```
<header class="cal-head">        ← 十一月 ‹ ›  + 「今天」回跳
<section class="month">
  <div class="month__weekdays">  一二三四五六日（7 个）
  <div class="month__grid" role="grid">  42 格（含首尾补位，`--muted`）
     <button class="cell" role="gridcell"
             data-state="done|partial|miss|today|future|empty|absent"
             aria-selected aria-current="date">20<i class="cell__dot"/></button>
</section>
<DayDetail day={selected}/>      ← 下方详情面板（复用现有 .cal-* 排版语言）
```

- **从左到右 7 列写死**：`grid-template-columns: repeat(7, minmax(0, 1fr))`，只有 `app.css` 能定，皮肤不许改列数（见 §4）。
- 星期一开头（图 1 是星期日开头，中文习惯用周一；`weekday()` 已经是 0=周日，算首列偏移时 `(weekday(day) + 6) % 7`）。
- 格内**只允许三样东西**：日号、一个状态点（≤4px）、今天的描边。390 下格宽 ≈ 46px，塞不下「18 词」这种标签——所有数字进详情面板。
- 完成态「点亮」= `done`：`background: var(--accent)` + 反白数字（图 1 的实心圆）；`partial` = 描边 accent + 数字 accent；`miss` = 数字 warning；`future` = `--text-tertiary` + 虚线点；`empty`（无计划无记录）= 只有灰数字；`absent` = 数字加删除线。

### 2.2 状态判定（一处实现，`lib/calendarState.ts`，纯函数，可单测）

```ts
type CellState = 'done' | 'partial' | 'miss' | 'today' | 'future' | 'empty' | 'absent';
function cellState(d: CalendarDay): CellState
```

| 条件 | 状态 |
|---|---|
| `d.isFuture` | `future`（有无批次都一样，详情里区分） |
| `d.isToday` | `today`（描边 accent；若今天已有完成词，数字填实） |
| `d.estimated === false && d.dueTotal === 0 && d.newWordDone === 0` | `empty` |
| `d.dueTotal > 0 && d.doneTotal >= d.dueTotal` | `done` |
| `d.doneTotal > 0` | `partial` |
| `d.dueTotal > 0 && d.doneTotal === 0` | `miss` |
| `record.absent` | `absent`（优先级最高，仅次于 future） |

> `done` 的门槛用「到期全做完」，**不看新词**：新词是预算不是任务（`allowedNewWords` 可能为 0），拿它当完成条件会把「复习做完但新词被闸挡住」的日子误标成未完成。

---

## 3. 点击联动 + 详情面板

- 点击格子 → `setSelected(day)`，**同一份 `CalendarDay` 直接渲染详情**，不再查库（避免两套数字打架）。
- 默认选中：今天；翻月后若本月含今天则选今天，否则选 1 号。
- 详情面板字段（对齐你图 2 的粒度）：

| 行 | 历史日 | 今天 | 未来日 |
|---|---|---|---|
| 日期头 | `11月20日 周五` + 完成/缺勤印章 | 同左 + 「今天」 | 同左 + 「预估」 |
| 新词 | 计划 `newWordLimit` / 实学 `newWordDone` | `plan.newWordLimit` / `allowedNewWords`（含「因复习未完成，实际 N」） | 计划 `newWordPlan`（预估）+ 「届时可能随进度调整」 |
| 到期复习 | `dueTotal` / 已做 `doneTotal` / 逾期 `overdue` | 同左（来自 `plan.totals`） | 已排定 `dueTotal` + 「做完前面的复习才会追加」 |
| 批次明细 | `planSnapshot` 逐条：`2 天前（11月26日）：18 词` | 同左（`plannedBatches`） | `shortTermBatches`，标题加「预估」 |
| 长期 | `longTermBatches`（30/90/180/360） | 同左 | 同左 |
| 正确率 | `accScore / accCount`（0 次则「当天没做复习」） | `plan.warning` + `reason` | 不显示（没有意义） |
| 即时复习 | `immediate {groups, cards, loops, skipped}`（有才显示） | 同左 | 不显示 |
| 词表 | 「看这一天学过的 N 个词」折叠列表 | 同左 | 「看已排定的 N 个词」折叠 |

- 空日文案：`这一天没有安排`（当前没有记录、dueTotal 0、newWordPlan 0）。
- 面板 `.cal-detail` 复用现有 `.cal-day` / `.cal-batch` / `.cal-figure` 的排版语言（**不删 CSS**，正好复用）。

---

## 4. 9 套皮肤兼容性（结论：能，但有 3 个硬条件）

现状：`.cal-days` 被皮肤改过列数（bento 2 列、≥768 三列），`.cal-day` 是「卡片行」而不是格子。**所以新网格必须换类名**（`.month` / `.month__grid` / `.cell`），不能沿用 `.cal-days`，否则 7 列会被皮肤改成 2 列。

| 皮肤 | 兼容做法 | 风险 |
|---|---|---|
| paper / breeze | 零覆盖，用基线 | 无 |
| instrument | 等宽数字 + 细分隔线 | 无 |
| broadsheet | 报纸表格：去圆角、只留横线、`done` 用粗黑底反白 | 低（它的首页已超 37px，与本页无关） |
| bento | 磁贴：圆角 + `--bt-tile-r`，格内只留数字 + 状态点 | **中**：390 下 46px 格 + 10px 内边距会挤，格内 padding 必须 ≤6px |
| nocturne | 暗底发光点：`done` 用 accent 实心 + 微弱 glow | 无 |
| desk | 方格纸：`1px` 网格线用 `--border`，`done` 填 accent | 无 |
| vinyl | **最需要设计**：格子做成小唱片（圆形 + 中心孔），`done` = 实心唱片 + 中心点反白 | 中：圆形格 46px 里日号要居中且 ≥12px |
| foundry | 工业：方角、粗描边，`done` 用 accent + 反白 | 低（注意 12px 文字对比度，复用第一阶段结论：`--accent-hover`） |

**三个硬条件**：

1. `grid-template-columns: repeat(7, …)` 写进 `app.css` 基线，皮肤规则**只准改 `.cell` 的外观**；审计里加一条闸：计算样式列数必须 = 7。
2. 格内元素锁死 3 个（日号 / 点 / 选中描边），任何皮肤想加文字都必须走详情面板。
3. 360px 宽下 7 列每格 ≈ 43px，`padding` + 数字 + 点必须放得下：`cell` 用 `min-height: 44px`（点击目标闸），数字 13–14px。

---

## 5. 清理清单（删干净，但不动调度）

- 数据页：`01 接下来 7 天`（`.cal-title` + 说明行）、7 天 `.cal-day` 列表、`02 长期复习` 段落、`.cal-foot`、`?` 解释浮层里「接下来 7 天」那段文案。
- `CalendarScreen` 里所有 `days.map(...)` 的渲染与「预估」标签逻辑 → 迁进 `MonthGrid` / `DayDetail`。
- 保留：Tab 栏、页面标题栏（标题 + 副标题）、`engine` / `version` props。
- 死 CSS（`.cal-days`、`.cal-day*`、`.cal-title*`、`.cal-hero*` 的一部分）**本轮不删**，但要在笔记里列清单，第三阶段统一清。

---

## 6. 验收（批准后按这个交）

1. `tsc` 0；`test:scheduler` 全绿；**新增** `calendarRange` 单测：过去日冻结、今天、未来 estimated、`absent`、无快照老数据兜底。
2. 新审计 `scripts/audit-month.js`（单组开关 `__audit_only`）：
   - 42 格、7 列（`getComputedStyle(grid).gridTemplateColumns.split(' ').length === 7`）；
   - 每格 ≥44px 高、点击后详情面板日期文本 === 该格日期；
   - 翻月 3 次后月份标题与格数仍对；今天格恰好 1 个；
   - 与 TabBar 无重叠（`cell.bottom < tabbar.top`）。
3. 截图：9 皮肤 × 浅深 × 390（数据页默认态 + 点过去日 + 点未来日），360 窄档抽查 breeze/bento/vinyl。
4. 手工回归：学习流不受影响（TabBar 仍隐藏）、设置页仍可切皮肤/阶段。

## 7. 已知取舍（先写下来，别到时候改口）

- 未来日的复习量是「已排定」，不是「最终会做多少」——文案必须写清，否则用户会以为系统算错。
- 历史日只有「那天来过」才有数据；`absent` 日子显示「未使用」，不做补算。
- 月历不做横向滑动，只做 ‹ › 按钮（与现有 `.cal-*` 交互一致，且 TabBar 上滑手势会打架）。
- 本月之外的补位格（上月尾/下月头）只显示灰数字，不可点。
