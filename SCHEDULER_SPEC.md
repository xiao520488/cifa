# SCHEDULER_SPEC · 学习调度模块技术契约

> 需求原文：`docs/SCHEDULER_BRIEF.md`（唯一需求来源）。
> 本文是把需求翻成可执行规则时做的**判定与取舍**；代码严格按本文实现，测试逐条对应。
> 用户可见文案：`STRATEGY_GUIDE.md`。落点：`src/lib/scheduler/`（纯 TS，无 React 依赖）。

## 0. 文件地图

| 文件 | 职责 |
| --- | --- |
| `src/lib/scheduler/studyDay.ts` | 4 点学习日边界、日期加减/星期/月初/格式 |
| `src/lib/scheduler/types.ts` | 全部状态字段与对外类型 |
| `src/lib/scheduler/adaptation.ts` | 加权正确率 + §三 自适应规则（纯函数） |
| `src/lib/scheduler/cards.ts` | 单张卡的流转：1→2→6→15→30→90→180→360→归档 |
| `src/lib/scheduler/immediate.ts` | 即时复习队列状态机（10 词触发、3 次上限、跳过） |
| `src/lib/scheduler/plan.ts` | 今日批次 / 逾期池 / 长期批次 / 日历 / 长期预告（纯函数） |
| `src/lib/scheduler/engine.ts` | `Scheduler` 门面：启动结算、结算、新词配额、正式复习、逾期清扫、归档、JSON 输出 |
| `src/lib/scheduler/storage.ts` | 独立 key `cijian.scheduler.v1` 的读写与清洗 |
| `src/lib/scheduler/copy.ts` | 全部用户可见文案（含日历原因短句、上限提示、长期预告） |
| `scripts/test-scheduler.ts` | 单元测试（`pnpm test:scheduler`） |
| `scripts/demo-scheduler.ts` | 40 天模拟，打印每日 JSON 与日历（`pnpm demo:scheduler`） |
| `scripts/bench-scheduler.ts` | 5000 词 × 365 天性能基准（`pnpm bench:scheduler`） |

## 1. 学习日（§一.5）

- `toStudyDay(date)`：本地时间 `hour < 4` 时回退一天，返回 `YYYY-MM-DD`。
- 内部日期运算一律用 `Date.UTC(y,m,d)/86400000` 得到的「日序号」做整数加减，避免夏令时/月末抖动。
- 所有批次、完成率、连续优秀天数、逾期天数只认学习日字符串，不认时间戳。

## 2. 一张卡的完整生命周期

```
new ──学──▶ short(1d) ─1▶ 2 ─▶ 6 ─▶ 15 ─▶ long(30d) ─▶ 90 ─▶ 180 ─▶ 360 ─▶ archived
              ▲    │                                                        │
              └────┘  不认识 → 打回 1d；模糊 → 回退一档（1→1, 2→1, 6→2, 15→6）
```

- 认识：进入下一档；15d 档答对 → 进入 long，`longInterval=30`，到期日 = 当天 + 30。
- 模糊：回退一档（15→6、6→2、2→1、1→1），新到期日 = 当天 + 新档位。
- 不认识：回 1d，`lapses+1`，进错词本（`inMistakes`）。
- 长期批次（30/90/180/360）答对 → 下一节点；360 答对 → `phase='archived'`，`due=null`，不再自动调度。
- 长期批次模糊或不认识 → **打回短期 1d**（`longInterval=null`），重建 1→2→6→15 循环；不认识同时进错词本。
- 逾期词复习后，新到期日 = **实际复习日 + 档位**（不是原计划日 + 档位）。
- **一个词、一个批次只作答一次**：`submitReview` 在 `lastReviewed === day`（今天已经答过）或 `due > day`（还没到期）时直接拒绝；
  唯一例外是 `{ isRetry: true }`——它只记「重试次数」，不调排程、不进正确率。
  没有这道守卫，同一个词能一天内连点三次「认识」直接跳到 15 天档。
- **界面层一律走 `answer(word, rating)`**：它内部先看 `answeredToday(word)`，同一天第二次及以后**自动**降级成 `isRetry`。
  这条专门覆盖「跨批次同日重复」——最典型的是 1 天批次答不认识（打回错词本、到期日已推到明天），
  当天在错词本里又答了一次。这不是新的一次回忆，不能进正确率、不能把排程往前推。
  不要自己在 UI 里判断 `isRetry`，判断错一次就会污染正确率或让排程跳档。
- 归档库抽查走 `reviewArchived(word, rating)`：只记录这次回忆结果（答错进错词本），**不改调度**、不进任何批次。

## 3. 自适应新词量（§三）

纯函数 `applyAdaptation(input) → { newWordLimit, action, currentLimit, consecutiveGoodDays, reasons[], flags }`。

**判定顺序**（与需求一致，且完成率拥有否决权）：

1. `recentAcc` 分支定出候选值 `limit` 与 `cgd`（<0.70→0；0.70~0.80→`round(cl×0.75)`；0.80~0.90→`cl`；≥0.90→`cgd+1`，满 3 天且 `completionRate≥0.95` 才 `min(max, cl+5)` 并清零 `cgd`，否则 `cl`）。
2. 完成率否决：正常日 `completionRate<0.80` → `limit=min(limit, round(cl×0.8))`；`<0.90` → `limit=min(limit, cl)`；两者都清零 `cgd`。
3. 即时复习轻微下调：当天有即时复习且 `avgLoops ≥ 2` → `limit = round(limit × 0.9)`。
4. 逾期硬闸：`overdueBacklog ≥ 50` → `limit = 0`；`≥ 30` 只在提示位。
5. `limit` 限制到 `[0, maxLimit]`。
6. `action`：`limit===0 && cl>0` → `pause`；否则与 `cl` 比较得 `increase/decrease/maintain`。
7. 基线更新：`increase/decrease` → `currentLimit = limit`；`maintain/pause` → 基线**不变**（暂停期间保住基线，恢复期才有台阶可回）。
   上限 `maxLimit` 只负责截断「今天给多少」：`newWordLimit = min(limit, maxLimit)`，**从不写回基线**——
   否则把上限从 20 调到 0 再调回来，基线会永久停在 0。增量仍按需求写成 `min(maxLimit, currentLimit + 5)`：
   上限低于基线时不做增量（标 `maintain`），不会因为截断被记成「下降」。

**必须写明的四条判定**（需求没写、但不定义就会死锁或误伤）：

- **无数据日不判罚**：`recentAcc` 为 `null`（近 3 天与历史都没有正式复习）→ 按 `maintain` 处理，不改 `cgd`、不乘系数。
- **空转日不算优秀**：当天**一张正式复习都没做**（`dueTotal === 0`）→ `maintain`、`cgd` 不动、标 `idleDay`。否则历史正确率会替它兜底，空转三天就能白拿 +5。
- **断签日不叠乘**：当天 `dueTotal > 0` 但完成数、新词数、即时复习全为 0（人根本没来）→ 视为缺席，`limit=min(limit, cl)`、`cgd=0`，**不**执行 `×0.8`。否则断 5 天基线 20→6.5→…→0，永久 0 死锁。`catchUp()` 补结算时会直接给这些天打 `absent`，不靠推断（卡片被清扫后，那一天看起来像「没有到期」）。
- **基线 ≥ 1**：`cl≥1` 时乘法结果 `round` 后至少 1（`round(1×0.75)=1`），保证恢复期能靠 +5 爬回来；`0` 只由「acc<0.70」或「逾期≥50」产生。

## 4. 新词配额（当天实际可学）

唯一的预算函数 `computeWordBudget(state, day)`，`plan()` / `calendar()` / `allowance()` / `learnNewWord()` 共用，
避免「日历说计划 20、点开始说 0」这种自相矛盾：

- `planned` = `manualOverride(day)` → 昨日结算写入的 `pendingLimit(day)` → `currentLimit`，夹到 `[0, maxLimit]`；
- 复习闸：当天**实时**完成率 `< 0.90` 且有到期复习 → `allowed = 0`（`blockedBy='review'`）；
- 逾期闸：短期待逾期 ≥ 50 → `allowed = 0`（`blockedBy='overdue'`）；
- 配额：`cap = min(planned, 池余量 + 今天已学)`，`allowed = min(cap - 今天已学, 池余量)`，
  边学边缩池子不会把当天配额越算越小（`blockedBy='quota'` 表示今天学满了，`'pool'` 表示池子空了，
  `'paused'` 表示上限/计划就是 0——这时提示语是「上限是 0，已暂停」，不会误报成「今天学完了」）；
- **执行点**：`learnNewWord()` 内部就调这道闸，`allowed === 0` 直接返回 `ok:false`；
  `{ force: true }` 只留给补录/调试，日常路径无法绕过复习优先与逾期暂停。
- `DailyPlan.newWordLimit` 是**结算计划值**（§九 JSON 用的就是它），`DailyPlan.allowedNewWords` 是**现在真的能开始学多少**；
  日历两个都显示，被挡住时 `reason` 说明是哪道闸。
- 日历行还带 `newWordBlocked`（`review/overdue/pool/quota/paused/null`），文案由 `copy.ts` 的
  `explainCalendarNewWords(day)` 统一生成，例如「计划 20，因逾期暂停，实际 0」。
  **只给两个数不给原因，用户只会以为数字坏了**——所以计划值旁边必须挂这句。
- 历史日的 `newWordAllowed` 没有意义（池子早变了），`buildCalendar` 直接回填当天实际学到的数，
  免得出现「计划 20、可学 0、已学 20」这种自相矛盾的三联；历史日的 `newWordBlocked` 恒为 `null`。

## 5. 即时复习（§四）

- `pendingImmediateCount` 与 `pendingImmediateWords` 永远等长（前者只是给 UI 显示的计数）。
- 触发条件收敛为「`pendingCount ≥ 10`」：单批 12 词时累计即 12（整批复习，不拆）；单批 4 词则攒到 10 再触发。
- 组内队列：认识 → 出队；不认识 → `immediateLoopCount[word]+1`，满 3 次标 `hardWord` 并出队（明天 1d 正式批次见），未满则回到队尾。
- `skipImmediate()`：整组词打 `skippedImmediate`，明天 1d 批次**排在最前**。
- 即时复习全程不计 `recentAcc`、不计 `completionRate`；中途退出不产生债务（状态只在内存组里）。
- `immediateReviewStats` 按学习日累计 `{ groups, cards, loops, skipped }`，`avgLoops = loops / cards`。

## 6. 批次与逾期（§五、§七）

- 今日短期批次 = `phase==='short' && due===今天`，按 `interval` 分组成 1/2/6/15 四行；`sourceDate = 今天 - interval`（即「1 天前（11月23日）」）。
- 逾期池 = `phase==='short' && due < 今天`，按 `due` 分组，`overdueDays = 今天 - due`，**按逾期天数从短到长**排序。
- 长期逾期（错过周日/1 号批次）单独一栏 `longTermOverdue`，**不计入** `overdueBacklog`（§六.3：长期批次不影响新词决策）。
- `sweepOverdue(day)`：逾期**超过** 7 天（即第 8 天）的词逐个移出逾期池 → 追加到未学池尾部，`state.relearned[word]=true`；重新学到时卡上带 `relearned` 标记，按新词完整走流程。只有「今天」会清扫，预览未来某天不会提前把卡打回池子。
- **`relearned` 的词优先出池**（2026-11-24 改）：`newWordPool()` 把池子分成 relearned / 普通两组，
  组内再按 `newWordOrder`（词表序或词频）排，返回时 relearned 组整体在前。
  原因：追加到池尾只是保持池内顺序；如果按词频抽，这些词会被永远压在后面，「归新词」等于冷藏。
  注意这条**盖过**早先「不插队」的说法——不插队指的是不打乱组内顺序，不是让它们排在最后。
- 未学新词池与逾期池物理分离（`state.unlearned` vs 卡片 `due<今天`），互不抵扣。
- 当天没背完的新词回未学池尾部，不补、不进逾期池。

## 7. 长期节点（§六）

- 卡片在 long 阶段用 `longAnchor`（进入该节点的学习日）+ `longInterval` 判到期，`due` 不参与。
- 批次日：30d → 每周日（`weekday===0`）；90/180/360 → 每月 1 号。批次日收集「到期日 ≤ 批次日」的全部词（含漏做），保证不漏词；正常每周/每月打卡时等价于「过去 7/30 天内满 N 天」。
- 同一天已经收进批次里的词，不会再重复出现在「长期逾期」栏（否则 1 号会同时看到「今天该复习」和「早就该复习」）。
- 同一批次日可能同时命中 30d（周日）与 90d（1 号），`dailyPlan.longTermBatches` 是数组，JSON 里的 `longTermBatch` 取第一条非空（优先级 360>180>90>30）。
- **未来 7 天没有长期批次时不留空**：`calendarView()` 额外返回 `longForecast`（`nextLongForecast`），
  从最早的长期到期日之后找第一个「周日 / 1 号」批次日，给出 `type/date/wordCount/daysAhead/withinWindow`；
  `copy.ts` 的 `describeLongForecast()` 把它变成「周日（12月13日）：30 天批次，预计 30 词」，
  长期库为空时是「近期无长期复习」。实现上先扫一遍卡片找最早到期日，
  再只检查批次日——不能为了预告把 400 天每天的全量批次都算一遍。

## 8. 结算与 `dailyPlan` 快照（§三、§八、§九）

- `settle(day)` 结算**刚结束的一天**，算出**下一天**的新词量，写入 `state.pendingLimit = { day: 次日, value }`。
- 幂等：同一天重复 `settle` 只回放 `DayRecord.settlement` 缓存，不再移动基线、不再加连击。
- 断档补结算（`catchUp`）时，`lastSettledDay` 早于 `day-1` → 先把连击清零再算，不让「连续」跨过缺口。
- 未来日不能结算（`endedDay > today` 直接抛错）；未来日也不冻结到期快照。
- 每日首次 `plan(day)` 时创建 `DayRecord` 并**快照**当天到期词表（`dueSnapshot` + `planSnapshot`）；完成率分母只认这份快照，不会随作答缩小。历史不重算（§八.7）。
- **未来日不冻结快照**：`plan(明天)` 只读现算，不落快照，等那天真到了再拍；否则今天新学的词会漏进明天的分母。同理，预览未来某天不触发逾期清扫（清逾期只在「今天」发生）。
- `completionRate`：分母 = `dueSnapshot.length`；分子 = 快照里已完成的词数。**清逾期不计入分子**（逾期不是当天的到期批次），但会降低 `overdueBacklog`。
- 长期批次与即时复习不进 `DayRecord.accScore/accCount`，因此不进 `recentAcc`。
- 结算 JSON 的 `dailyPlan` 是**新一天**的计划；外层 `SettlementReport` 额外给出 `settledDay / plannedDay`，JSON 本体严格只有 §九 要求的 5 个键。
- `metrics.recentAcc` 在「完全没有正式复习数据」时填 `1`，这是**中性占位**（不判罚），不代表 100% 正确；`reason` 里会写明「还没有正式复习数据」。
- **每次启动都调 `startOfSession()`**，不要只在「跨天首次打开」时调：它内部先按 `lastSettledDay` 判断断档走 `catchUp`，
  然后**无条件** `settle(昨天)`。幂等靠 `DayRecord.settlement` 回放，所以同一天开十次也只动一次基线。
  只在跨天时调的话，凌晨 4 点边界前后各打开一次就会漏掉刚过去的一天。
- 空转日（`plan.totals.dueToday === 0`）不是优秀日，且要明说：`copy.ts` 的 `idleDayNote(plan)` 返回
  「今天没有复习任务，不计入连续优秀。」否则用户会以为「我今天没复习，连击怎么断了」。
- 结算写完 `pendingLimit` 后会顺手把**已存在**的次日 `DayRecord.newWordLimit` 同步一次
  （预览过未来日历的情况下，那个格子可能已经被提前建出来了）。

## 9. 状态字段表（对应需求 §十.2）

全部存在 `SchedulerState` 里，独立 localStorage key `cijian.scheduler.v1`。

| 字段 | 类型 | 在哪 | 含义 / 不变量 |
| --- | --- | --- | --- |
| `userDailyGoal` | number | 顶层 | 用户目标，冷启动 20，随时可改 |
| `maxLimit` | number | 顶层 | 算法上限，默认跟随 `userDailyGoal`；用户单独设置后 `maxLimitPinned` |
| `currentLimit` | number | 顶层 | 自适应基线；只在 `increase/decrease` 时移动，`pause/maintain` 保住 |
| `newWordLimit` | number | `DayRecord` / 结算 JSON | 当天实际新词量，夹在 `[0, maxLimit]` |
| `consecutiveGoodDays` | number | 顶层 | 连续优秀天数；非优秀、完成率不达标、断签都清零 |
| `recentAcc` | number | 结算 JSON（不落库） | `0.7×近3天 + 0.3×历史`，结算时重算 |
| `completionRate` | number | 结算 JSON（不落库） | 快照内完成数 / 快照总数，无到期记 1 |
| `pendingImmediateCount` | number | `immediate.pendingCount` | 距上次即时复习累计的新词数，恒等于 `pendingWords.length` |
| `pendingImmediateWords` | string[] | `immediate.pendingWords` | 待即时复习的新词，按学习顺序 |
| `immediateLoopCount` | Record | `immediate.active.loopCount`、`group.loopCount` | 每个词被答错的次数，满 3 标 hard |
| `hardWord` | boolean | `CardState.hard` | 3 次仍不认识，放过但次日 1 天批次置顶 |
| `skippedImmediate` | boolean / string[] | `CardState.skippedImmediate` + `immediate.stats.skipped` | 用户跳过即时复习；次日 1 天批次排最前 |
| `overduePool` | 派生 | `DailyPlan.overduePool` / 结算 JSON | 短期逾期批次（来源日期、词数、逾期天数），不落库、现算 |
| `relearned` | boolean | `CardState.relearned` + `SchedulerState.relearned` | 逾期 >7 天回池后重学的词 |
| `dailyPlan` 快照 | `DayRecord.dueSnapshot` + `planSnapshot` | `days[studyDay]` | 当天到期词表与批次行，日历读它、不重算历史 |
| `allowedNewWords` | number | `DailyPlan` / `CalendarDay` | 现在真的能开始学多少（复习闸 / 逾期闸 / 配额之后）；`newWordLimit` 才是结算计划值 |
| `newWordBlocked` | 枚举 | `DailyPlan` / `CalendarDay` | 被哪道闸挡住（`review/overdue/pool/quota/paused/null`），日历靠它生成原因短句 |
| `longForecast` | 派生对象 | `CalendarView.longForecast` | 下个长期批次日 + 预计词数 + `withinWindow`；窗口内没有批次时的预告来源 |

派生/不落库的还有：`shortTermBatches`、`longTermBatches`、`longTermOverdue`、`totals`、`warning`、`CalendarDay`——
它们都能从 `cards` + `days` 现算，避免同一份事实存两处。

`CardState` 另含：`phase`（short/long/archived）、`interval`（1/2/6/15）、`due`、`longInterval`、`longAnchor`、
`reps`、`lapses`、`lastRating`、`lastReviewed`、`inMistakes`、`learnedOn`。

## 10. 边界清单（对应需求 §十.3）

| 边界 | 处理 | 测试 |
| --- | --- | --- |
| 学习日 4 点 | `toStudyDay` 03:59→前一天，04:00→新一天 | T13 |
| 跨天打开 | 缺日不逐日补结算；`ensureDay` 只建当天快照 | T17 |
| 断签多天 | 不叠乘、基线保住、`cgd=0`；逾期≥50 停新词 | T17 |
| 逾期 7 天归新词 | `sweepOverdue` 移池 + `relearned` | T12 |
| 360 天归档 | `phase='archived'`，不再进任何批次 | T14 |
| 手动强制改量 | 只改当天 `manualOverride`，`currentLimit` 不变 | T15 |
| 即时复习跳过 | 打 `skippedImmediate`，次日 1d 批次置顶 | T16 |
| 同一词重复作答 | `isRetry` 只记「重试通过」，不调排程、不进正确率；`answer()` 自动覆盖跨批次同日重复 | 9.2 |
| 未来日预览 | 不冻结快照、不清扫逾期、不能结算 | 「未来预览不冻结快照」 |
| 重复结算 / 断档 | `settle` 幂等；断档先清零连击 | 重复结算用例、catchUp 用例 |
| 每次启动结算 | `startOfSession()` 无条件 `settle(昨天)`，重复调用只回放 | 9.7 / 9.7b |
| 逾期词回池 | 回池后**优先出池**（relearned 组在前的两段式排序） | 9.1 |
| 日历计划值 | 必须与 `explainCalendarNewWords()` 的短句成对出现 | 9.4 |
| 长期批次空窗 | `calendarView().longForecast` 兜底，不留空、不隐藏 | 9.5 |
| 空转日 | `idleDayNote()` 明说「不计入连续优秀」 | 9.6 |
| 上限设成 0 | 设置页必须显示 `MAX_LIMIT_ZERO_NOTE`（改回来不会立刻恢复） | 9.3 |

## 11. 性能与规模（2026-11-24 基准）

`pnpm bench:scheduler`：5000 词、模拟 365 天（含每 37 天断签一次），逐日计 `plan()` 与 `settle()`。

| 指标 | 实测（Node 26 / 本机） | 预算 |
| --- | --- | --- |
| `plan()` | 平均 7ms，p95 12ms，最大 16ms | < 50ms |
| `settle()` | 平均 8ms，p95 13ms，最大 16ms | < 50ms |
| `calendarView(8)` | 平均 16ms，最大 32ms | < 100ms |
| `startOfSession()`（断签回来） | 最大 25ms | < 100ms |
| 冷启动（JSON.parse + `new Scheduler` + `plan`） | 31ms（2.27MB 状态） | 一次性，不卡首屏渲染 |

三个曾经是 O(n²) 的地方，已改掉（别再写回去）：

1. `dueSnapshot.includes(word)` → `snapshotWordSet(record)` 的 Set 缓存（`plan.ts`）；
2. `doneToday.includes(word)` → `Scheduler.doneIndexFor(record)` 的 WeakMap Set（`engine.ts`）；
3. `seed()` 里的 `archived.includes(word)` → `new Set(archived)`。

**待办**：365 天状态 JSON 已有 2.27MB，逼近 localStorage 5MB 配额。下一步可把 30 天以前的
`DayRecord.dueSnapshot/doneToday` 压成计数（历史只需完成率，不需要词表）。

## 12. 与 App 的关系

- 模块**不依赖 React**，也不改现有 `cijian.v1` 数据结构：状态存独立 key `cijian.scheduler.v1`，`storage.ts` 走防御式清洗，坏数据回默认值。
- 清洗的三条硬规则：**僵尸卡丢弃并放回未学池**（short 却没有到期日、long 却缺节点/锚点）；**归档索引按卡片状态重建**
  （不留下没有卡片的归档词，也不漏登记已归档的卡）；**分数夹在 `[0, 次数]`**（负分 / 超过次数的分都归位，避免负正确率把新词永久锁死）。
- **本轮不做界面**：需求 §二.1 的卡片外观（只显示单词 + 音标、中文默认遮蔽、三键、显示/关闭中文开关）属于界面层；
  本轮落地的是它的**作答口径**——三档评分（1 / 0.5 / 0）、三档调度动作、答错后重试不计入正确率。
  卡片默认「中文遮蔽」对应 `CardState` 之外的界面开关，交给 UI 层。
- 接线点与后续改造列在 `TODO.md` P0：日历页读 `plan()` / `calendarView()`，复习页调 `answer()`（内部走 `submitReview()`），
  设置页调 `setUserDailyGoal()` / `setMaxLimit()` / `setManualNewWords()`，启动时 `loadScheduler()` + `startOfSession()`。

## 13. 错词本账本（2026-11-24 新增）

**为什么单独一张表**：卡片会被「逾期 >7 天清扫」删掉并放回未学池（`sweepOverdue`），
但「这个词我错过 5 次、最后一次是 11 月 20 日」属于历史，不能跟着卡片一起消失。
所以账本 `state.mistakes: Record<word, MistakeEntry>` 与 `cards` 解耦，`CardState.inMistakes` 退回成「卡片上的一个快捷位」。

```ts
interface MistakeEntry {
  word: string;
  count: number;          // 累计答错次数（跨批次、跨天累加）
  lastDay: StudyDay;      // 最后一次答错的学习日
  source: 'review' | 'immediate' | 'archived' | 'quiz';
}
```

**写入时机（四处，全部在引擎里，UI 不自己记账）**

| 触发 | 入口 | 次数增量 |
|---|---|---|
| 短期 / 长期正式复习答「不认识」 | `submitReview(...,'unknown')` | +1 |
| 即时复习同一个词连问 3 次仍不认识（`hard`） | `answerImmediate` | +`loops`（=3） |
| 归档库抽查答「不认识」 | `reviewArchived` | +1 |
| 错词本单测答「还是不认识」 | `quizMistake(word, false)` | +1 |

**移出时机**：任何一次「认识」——正式复习、归档抽查、错词本单测。
只是把账本条目与 `inMistakes` 清掉，**排程不动**（卡片的 `due/interval` 按原计划走）。

**单测口径**：`quizMistake()` 是「现在还记得吗」，不进正确率（不碰 `accScore/accCount`）、
不进完成率（不碰 `doneToday`）、不改 `reps/lapses/due`。想重走周期请在正式批次里答。

**老状态迁移**：没有账本但有 `inMistakes === true` 的卡片，按 `lapses`（至少 1）与
`lastReviewed ?? learnedOn` 补一条 `source: 'review'`；卡片被清扫且无账本的，不凭空造记录。

**读**：`engine.mistakes()` 返回按 `lastDay` 倒序（同天按次数倒序）的 `MistakeRow[]`，
带 `card`（可能为 null）、`canQuiz`、`relearning`；`stats().mistakes` 给入口徽标用。

## 14. 新词上限的默认值与迁移（2026-11-24）

- `emptyState()`：`maxLimit = userDailyGoal + INCREASE_STEP(5)`，上限 999。
  **理由**：§3 的奖励是 `min(maxLimit, currentLimit + 5)`，上限若等于目标，那 +5 会被自己截掉，等于没实现。
- `setUserDailyGoal()`：未钉住（`maxLimitPinned === false`）时 `maxLimit = goal + 5`；钉住后不再跟着目标走。
- `sanitizeScheduler()` 一次性迁移：`!pinned && maxLimit > 0 && maxLimit <= goal` → `goal + 5`。
  **上限 0 不迁移**——0 是用户主动暂停，偷偷改回来比不迁移更糟；`pinned` 的更不动。
- 兜底不变：`plannedNewWordLimit = min(raw, maxLimit)`，`applyAdaptation` 只算 `raw`（基线），
  上限只截断、不写回基线。上限调到 = 目标时今天只发目标，改回去要等下一次结算（`pendingLimit` 会被截断，见 §10 坑 3）。

