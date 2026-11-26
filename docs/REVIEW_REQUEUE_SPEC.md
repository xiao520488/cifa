# 正式复习「回队尾」· 规约（v2 定稿版）

> 状态：**D1–D4 已由用户拍板定稿**（2026-11-26）。本文档为定稿版，等你扫一眼；**代码在确认后才动**。
> 版本 v2 · 2026-11-26 · 基线 `e90244b`（四张表 `bec46db`，本文件 v1 `959983d`）
> 关联：`docs/QUEUE_AND_ACCURACY.md`（现状对账）、`docs/SCHEDULER_BRIEF.md`、`docs/IMMEDIATE_ROUNDS_SPEC.md`
> v2 改动：**D3 插入点改为「短期 + 长期批次之后、逾期池之前」**（删掉 v1 的「整条队尾」）；**D4 改为全程静默、零提示、DOM 无区别**（删掉 v1 的「回看 n/3」文案与上限 toast）。

---

## 0. 需求 → 设计 对账

| 你的原话 | 落法 | 落在哪 |
|---|---|---|
| 不认识 / 模糊后插回再问一次 | 会话内存里把该词 `splice` 进**回看带**（短期+长期之后、逾期池之前） | §2.2、§5.2 |
| 直到点「认识」或同一词今日被问满 3 次 | `QueueItem.attempt` 1→2→3；`attempt === 3` 后不再入队 | §2.2、§8.3 |
| 排程/准确率/错题本只认第一次 | 第 2、3 次走**现有** `answer()`→`isRetry` 路径，引擎零改动 | §6 |
| 回看零写入、**无 UI 提示、全程静默** | 复用重试路径（只 `retried + 1`）；不新增任何可见 DOM/toast | §6.2、§7 |
| 不跨天 | 保留现有 `today !== plan.day → onExit` 守卫；不补问 | §8.1 |
| 错题本不变 | 引擎与 `recordMistake` 一行不碰 | §10 |

验收定义（四句）：**① 一个词今日最多被问 3 次；② 第 2、3 次作答对卡片/账本/准确率零写入；③ 首次三键语义与今天完全一致；④ 全程静默，回看词的 DOM 与普通复习词逐字节相同。**

---

## 1. 术语

| 术语 | 定义 |
|---|---|
| **首次作答（attempt = 1）** | 该词今日**第一次**被作答，唯一会写调度字段、准确率、错题本的那次。 |
| **回看（attempt = 2、3）** | 回队尾后再被问的次数。**只推进队列，不写任何状态**（除 `DayRecord.retried` 计数），**且不产生任何 UI 提示**。 |
| **今日队列** | `SessionScreen` 进页面时由 `plan()` 派生的**会话副本**（`QueueItem[]`），结构固定为三段：`[短期…][长期…][回看带][逾期…]`（回看带初始为空）。 |
| **回看带** | 短期 + 长期批次之后、逾期池之前的那一段；回看词按**作答顺序**追加到带尾。 |
| **上限** | `attempt ≤ 3`（首次 + 回看 2 次）。 |
| **出队** | 本次会话不再被问。四种途径：点「认识」/ `attempt === 3` / 退出会话 / 跨天。 |

作用域裁定：**回看次数是会话级 UI 状态，不进 `localStorage`、不改 schema**（理由见 §4）。

---

## 2. 状态机

### 2.1 数据结构（只改 UI 层）

```ts
// src/components/SessionScreen.tsx
interface QueueItem {
  word: string;
  kind: 'short' | 'overdue' | 'long';   // 现有
  label: string;                        // 现有
  sourceDate: string;                   // 现有
  attempt: 1 | 2 | 3;                   // 新增：该词在本次会话里是第几次被问
}
```

- `buildReviewQueue(plan)` 产出的每一项 `attempt: 1`，顺序不变（short → long → overdue）。
- 额外维护一个**游标 `requeueEnd`**（数字）：= 短期段长度 + 长期段长度 + 已插入的回看词数，即回看带的右端。初值 = short+long 段总数。
- `queue` 与 `requeueEnd` 必须**原子更新**（同一个 state 对象，或 `useRef` 持有数组 + state 触发重渲染）；两者不同步会让 `splice` 位置漂移。
- **不新增 engine 字段、不改 `ImmediateGroup`、不改 `SchedulerState`、不碰 `storage.ts`。**

### 2.2 单次作答（伪代码）

```
submit(rating):
  if (engine.today() !== plan.day) return onExit()          # 跨天守卫，保持现状
  item = queue[index]
  outcome = run(t => t.answer(item.word, rating))           # ← 引擎入口不变

  if (!outcome.ok):
      toast(outcome.reason); advance(); return              # 不插入、不计数

  if (item.attempt === 1 && outcome.counted):
      tally[rating] += 1                                    # 首次且真正计分才进「认识/模糊/不认识」
  else if (!outcome.counted):
      tally.retried += 1                                    # 回看 / 同日跨批次续答，只进「重试」计数

  if (rating !== 'known' && item.attempt < 3):
      pos = Math.max(requeueEnd, index + 1)                 # 回看带右端；永不落到游标之前
      queue.splice(pos, 0, { ...item, attempt: item.attempt + 1 })
      requeueEnd += 1
  # attempt === 3：静默出队，不 toast、不改任何文案

  advance()                                                  # 先插入再判是否到头
```

```
advance():
  if (index + 1 >= queue.length): finishReview()
  else setIndex(index + 1)
```

两个关键点：

1. **插入必须在「是否到头」判断之前**，否则最后一个词答「不认识」会直接收尾（最容易写错的一行）。
2. **`pos` 取 `max(requeueEnd, index+1)`**：正常情况（游标还在短期/长期段）插在回看带右端，即「逾期池之前」；若游标已经进入逾期池（回看带在游标身后），插到游标后一位，否则这个词会被永远跳过，违反「直到认识或 3 次上限」（见 §5.2、§8.10）。

### 2.3 不变量（实现与测试都要逐条对）

| ID | 不变量 |
|---|---|
| I1 | 任一 `word` 在队列中同时只出现一项；`attempt` ∈ {1,2,3}。 |
| I2 | `attempt > 1` 的作答**只允许**改 `DayRecord.retried`（+1）；`CardState` 12 个字段全等。 |
| I3 | `accScore` / `accCount` 只在 `attempt === 1` 且 `kind === 'short'` 时变化（引擎保证）。 |
| I4 | `dueSnapshot` / `planSnapshot` 整日不变。 |
| I5 | `doneToday` 每词最多出现一次，且只在 `attempt === 1` 时写入。 |
| I6 | 队列词集合 ⊆ 进页面时的 plan 词集合（回看只重复，不引入新词）。 |
| I7 | 退出会话不写任何状态；回看词消失不丢数据（排程已在首次定死）。 |
| I8 | 跨天不补问：`today !== plan.day` 时点任何键都只 `onExit()`。 |
| I9 | 「今日最多 3 次」跨会话也成立：首次作答必然把 `due` 推到 ≥ 明天，重进页面该词不在 `plan` 里。 |
| I10 | 回看词插入位置恒 `> index`（永不落到已消费区）。 |
| I11 | `attempt` 只在插入时 +1，永不复位、永不回写。 |
| I12 | 回看词的 DOM 与同一词的首次渲染**逐字节相同**（无 `data-*` 区分、无额外文案）。 |

### 2.4 状态迁移表

| 当前 | 事件 | 下一状态 | 队列动作 | UI |
|---|---|---|---|---|
| attempt=1 | 认识 | 出队 | 不插入 | 正常 |
| attempt=1 | 模糊 | 回看（attempt=2） | 插入回看带 | **无提示** |
| attempt=1 | 不认识 | 回看（attempt=2） | 插入回看带 | **无提示** |
| attempt=2 | 认识 | 出队 | 不插入 | 正常 |
| attempt=2 | 模糊 / 不认识 | 回看（attempt=3） | 插入回看带 | **无提示** |
| attempt=3 | 任意 | 出队 | 不插入 | **无提示** |
| 任意 | 跨天 | 退出会话 | 丢弃队列 | — |
| 任意 | 主动退出 | 退出会话 | 丢弃队列 | — |

---

## 3. 首次 vs 回看：写入差异（本次改动的核心约束）

| 写入对象 | attempt = 1 | attempt = 2 / 3 | 谁保证 |
|---|---|---|---|
| `CardState.reps / lastRating / lastReviewed` | 写 | **不写** | 引擎 `isRetry` 提前 return（[engine.ts:717-729](../src/lib/scheduler/engine.ts#L717)） |
| `CardState.interval / due / phase / longInterval / longAnchor` | 写 | **不写** | 同上 |
| `CardState.lapses / inMistakes / hard / skippedImmediate` | 写 | **不写** | 同上 |
| `DayRecord.accScore / accCount` | 仅 short 写 | **不写** | 同上（`counted:false`） |
| `DayRecord.doneToday` | 可能 +1 | **不写** | 同上 |
| `DayRecord.retried` | 0 | **+1/次** | 重试路径唯一副作用（[engine.ts:718](../src/lib/scheduler/engine.ts#L718)） |
| `DayRecord.immediate.*` | 不动 | 不动 | — |
| `mistakes` 账本 | 不认识 +1 / 认识 删 | **不动** | 重试路径在记账之前 return |
| `lifetime.score / count` | 仅 short 写 | **不写** | 同上 |
| `dueSnapshot / planSnapshot` | 不动 | 不动 | — |
| UI `queue` | 可能插入 | 可能插入 | 本文档 §2.2 |

---

## 4. 决策 D1（已定稿）· 三次计数器存在哪

| 方案 | 改动面 | 退出重进语义 | 备份/schema | 结论 |
|---|---|---|---|---|
| **A. 会话内存（`QueueItem.attempt`）** | 只改 `SessionScreen.tsx` | 重进 = 该词已不在今日 plan（I9），**不会绕过上限** | 零改动 | ✅ **采用** |
| B. 写进 `DayRecord` | `types / storage / backup / engine` 四处 + 单测 | 跨会话保留次数 | 要 bump schema 或做兼容读，`backup.ts` 白名单要跟 | ❌ 不做 |

理由：① 这是**展示行为**不是学习状态，排程与准确率已在首次锁死；② 不改 schema 就不会碰备份/恢复这条刚收口的高风险链路；③ I9 保证「退出重进」无法让一个词被问第 4 次，所以 A 的语义缺口不存在。

---

## 5. 与 `plan()` / `dueSnapshot` 的关系

### 5.1 只动 UI 副本

- 回看**只**改 UI 的 `queue` 数组，**不调** `engine.plan()`、**不调** `engine.allowance()`、**不改** `DayRecord` 任何字段。
- `plan()` 的「一次性拍定」逻辑一行不动：进页面时的 `plan` 仍是 `useState` 初值，之后不刷新。
- `dueSnapshot` 是完成率分母，回看不动它 → **完成率不受回看影响**。
- 「还剩 N 个」改用 `queue.length - index`（随插入增长），不再用 `tally` 之和推导。

### 5.2 插入位置（D3 定稿）

队列布局：

```
[ 短期批次 … ][ 长期批次 … ][ 回看带 ][ 逾期池 … ]
                              ↑
                      回看词按作答顺序追加到这里
```

- 初始 `requeueEnd = shortCount + longCount`（回看带为空）。
- 每次插入：`pos = max(requeueEnd, index + 1)`，插入后 `requeueEnd += 1`。
- **正常路径**（游标还在短期/长期段）：`requeueEnd > index`，插在回看带右端 → 效果就是「短期+长期之后、逾期池之前」，与需求原话一致。
- **逾期池路径**（游标已越过回看带）：`requeueEnd <= index`，此时插到 `index + 1`，即「马上再问一次」。这是「逾期词也在正式复习里」的必要推论——否则回看带在其身后，该词会被静默丢弃（见 §8.10）。
- 逾期池本来可跳过，所以回看词不会因为逾期很长而排在后面（需求原文的顾虑已由本布局解决）。

---

## 6. 决策 D2（已定稿）· 回看走哪条路径

### 6.1 采用：复用 `answer()` → `isRetry`

`submitReview` 的 `isRetry` 分支在 `record.retried += 1` 之后立即 return，位置在所有调度/准确率/账本写入之前（[engine.ts:717-729](../src/lib/scheduler/engine.ts#L717)），天然满足 I2。**引擎零改动。**

不采用新增 `answerRequeue()`：多一条写入路径要维护和测试，收益仅为语义命名。

### 6.2 必须补的断言（现有测试没覆盖）

现状只有 T22（`重试不拉高正确率 / 不覆盖排程 / 只记一次重试`，[test-scheduler.ts:454-471](../scripts/test-scheduler.ts#L454)）与 9.2（同日第二次自动 `isRetry`，[test-scheduler.ts:818-838](../scripts/test-scheduler.ts#L818)）。缺的：

1. `CardState` **深比较**（12 字段逐一相等），不只是 `due`；
2. `DayRecord` 除 `retried` 外**逐字段相等**（含 `accScore / accCount / doneToday / dueSnapshot / planSnapshot / immediate`）；
3. `lifetime` 不变；
4. `mistakes` 账本对象引用与内容不变、`inMistakes` 不变。

### 6.3 ⚠️ 保留路径的既有副作用（必须写进测试注释）

`submitReview` 第一行是 `snapshotDue(ensureDay(day))`（[engine.ts:714](../src/lib/scheduler/engine.ts#L714)），而 `ensureDay` 对「今天」会跑 `sweepOverdue`（[engine.ts:292-300](../src/lib/scheduler/engine.ts#L292)）。它是**当天幂等**的清扫（>7 天逾期打回未学池），首次作答前已执行过，回看时通常空转。断言方式：**卡片集合跑前跑后相同**（不假设「空转」）。若某次回看真的新增清扫，那是数据缺陷，测试应当红。

---

## 7. UI 契约（D4 定稿：全程静默）

| 项 | 规定 |
|---|---|
| 按钮 | 保持三键（认识 / 模糊 / 不认识），回看时**不置灰**。 |
| 卡片外观 | **与普通复习词逐字节相同**：无「回看 n/3」文案、无边框/角标、无 `data-attempt` / `data-requeue` 属性。 |
| toast（回看） | **一律不弹**（含第 3 次上限出队）。 |
| toast（其他） | 现有「今天已经答过这个词了…」收窄为 **`attempt === 1 && !counted`** 才弹（那种情况是同日跨批次续答，[SessionScreen.tsx:170-172](../src/components/SessionScreen.tsx#L170)）；`attempt > 1` 不弹。 |
| 统计 | `认识/模糊/不认识` 只统计 `attempt === 1` 且 `counted === true`；`重试` 统计所有 `counted === false`（回看 + 同日续答）。**这是全程唯一的间接痕迹**，出现在复习总结页，不在答题界面。 |
| 进度 | 用 `queue.length - index` 显示剩余；`finishReview` 条件 `index + 1 >= queue.length` 在插入之后判定。 |
| 顺序 | 回看词一律进「回看带」（§5.2）。 |

---

## 8. 边界

| # | 边界 | 规定 |
|---|---|---|
| 8.1 | **跨天** | 保留现有守卫：`engine.today() !== plan.day` → `onExit()`，不补问、不写任何东西。跨天**不**把这些词算作「已完成」——`doneToday` 只认首次。 |
| 8.2 | **中途退出** | 剩余回看直接丢弃；卡片停在首次结果；下次进入该词不在今日 plan（I9），不会重问。 |
| 8.3 | **三次上限** | `attempt === 3` 答完即出队，无论认识/模糊/不认识；不再插入；**无任何提示**。 |
| 8.4 | **长期档词** | 首次不认识 → 打回 `short/1` + 回看；回看时卡片已是 `short`，走重试路径。首次认识进 90/180/360 或归档，不进回看。 |
| 8.5 | **逾期池词** | 同规则；插入位置见 8.10。 |
| 8.6 | **首次作答失败**（`!outcome.ok`，如今日已答/未到期） | 不插入、不计数；照旧 toast + 前进。 |
| 8.7 | **归档词** | 不在复习队列里，不受影响。 |
| 8.8 | **插入时正好是队列最后一项** | 先插入再判结束，否则会提前收尾。 |
| 8.9 | **同一个词被插入两次** | 物理不可能：插入项 `attempt` 递增，原项已消费；同词同时只有一项（I1）。 |
| 8.10 | **游标已进入逾期池后才答错逾期词** | 回看带在其身后 → 插到 `index + 1`（马上再问），否则该词被静默丢弃（违反 §0 验收 ①）。**行为说明：逾期词第一次答错后，下一个还是它。** 用户会觉得「我刚点不认识怎么又是它」——这是逾期段特有的，短期/长期段不会这样（那里的回看排在逾期池之前，中间隔着别的词）。不补这句，以后有人看到会当成 bug。 |

---

## 9. 回归矩阵

### 9.1 单测（`scripts/test-scheduler.ts` §14，引擎层）

| ID | 场景 | 断言 |
|---|---|---|
| 14.1 | 首次不认识 → 同日 `answer(known)` | 卡片深比较 == 首次结果（`interval=1 / due=+1 / lapses=1 / lastRating='unknown' / reps=1`） |
| 14.2 | 同上 | `DayRecord` 除 `retried` 外逐字段相等 |
| 14.3 | 同上 | `lifetime.score / count` 不变 |
| 14.4 | 同上 | `mistakes[word]` 不变、`cards[word].inMistakes === true` |
| 14.5 | 同上 | `dueSnapshot / planSnapshot / doneToday` 不变 |
| 14.6 | 连续三次作答 | 卡片仍 == 首次结果；`retried === 2`；`accCount === 1` |
| 14.7 | 首次模糊 → 同日再答 | 卡片停在模糊结果（回退一档、`lapses=0`、账本无）；`accScore=0.5 / accCount=1` |
| 14.8 | 首次不认识 | `accScore=0 / accCount=1`；账本 `count=1 / source='review'` |
| 14.9 | 次日再答（跨天） | **不**走 `isRetry`，正常计分（防止把回看逻辑写进引擎） |
| 14.10 | 卡片集合跑前跑后 | 相同（`sweepOverdue` 幂等，见 §6.3） |

### 9.2 E2E（新增 `scripts/audit-requeue.js`）

数据：今日 3 个到期词 —— `w1` 短期 1 天档、`w2` 短期 6 天档、`w3` 逾期 3 天。初始队列 `[w1, w2, w3]`，`requeueEnd = 2`。

```
w1 点「不认识」        → 队列 [w1, w2, w1r2, w3]        # 断言：w1 在 w3(逾期) 之前 = D3
w2 点「模糊」          → 队列 [w1, w2, w1r2, w2r2, w3]
w1r2 点「认识」        → 出队、不再插入
w2r2 点「不认识」      → 队列 […, w2r2, w2r3, w3]
w2r3 点「不认识」      → attempt=3 静默出队、不再插入
w3 点「不认识」        → 游标已在逾期段 → 立即插到 index+1（§8.10）
w3r2 点「认识」        → 出队，会话结束
```

断言清单：

| 类别 | 断言 |
|---|---|
| 顺序（D3） | `w1` 第二次出现的位置 **早于** `w3`（逾期词） |
| 静默（D4） | 回看这 5 次作答**全部** `document.querySelector('.session-toast') === null` |
| DOM 无差别（I12） | `w1` 第二次出现时的卡片 `outerHTML` 与首次**完全相同**；且无 `[data-attempt]` / `[data-requeue]` |
| 上限 | `w2` 只出现 3 次；第 3 次后不再入队 |
| 排程（首次不认识） | `cards[w1] = { interval:1, due:+1, lapses:1, lastRating:'unknown', reps:1, inMistakes:true }` |
| 排程（首次模糊） | `cards[w2] = { interval:2, due:+2, lapses:0, lastRating:'fuzzy' }`（6 档模糊回退到 2） |
| 准确率 | `days[today].accCount === 3`、`accScore === 0 + 0.5 + w3 首次得分` |
| 零写入 | `dueSnapshot.length === 2`、`doneToday.length === 2`（**逾期词不进到期快照**，也不进 doneToday——完成率分母只认 `due === today` 的短期批次）、`retried === 4`（w1r2 / w2r2 / w2r3 / w3r2） |
| 错题本 | `mistakes[w1].count === 1`（在）；`mistakes[w2]` 不存在（模糊不进）；`mistakes[w3]` 存在 |
| 收尾 | 队列走空后进入总结页，`认识 + 模糊 + 不认识` 只等于 3 |

### 9.3 数据隔离（**与以往口径不同，注意**）

- 独立 context（Playwright 新建 profile），不碰真实档案（**硬要求**）。
- **不能**要求「跑前跑后双键 SHA256 相同」——回看会合法地把 `retried` 从 0 改到 5，本次跑完哈希**必然**变。
- 正确口径：**跑前备份两个键的原始字节 → 跑完断言 → 逐字节写回 → 校验还原后 SHA256 == 跑前 SHA256**。
- 报告：`docs/evidence/review-requeue-2026-11-26.json`，含 `beforeSha / afterRunSha / restoredSha` 三个值 + 全部断言明细。
- 跑完删 `__bak_* / __p_*`。
- ⚠️ **注入数据前必须删掉当天的 `days[today]`**：runner 的 warm-up 已经给「今天」拍过到期快照（`snapshotDone: true` + 空 `dueSnapshot`），不删的话注入的卡永远进不了 `dueSnapshot`，完成率分母恒为 0，E2E 看起来像「快照没生效」（本次实现时踩过）。
- 脚本必须复制到 `C:\Users\xiao\.dsh\mcp\playwright-mcp\` 再用 `run-audit-node.js` 跑（`filename` 按 MCP 的 cwd 解析）；cfg 一律传**文件路径**，不要内联 JSON（PowerShell 会吃引号）。

### 9.4 量具自证伪

`--selfcheck` 模式：把期望值故意写错（如期望 `cards[w1].lapses === 0`），必须**非 0 退出**。一次没红过的检查不算检查。

### 9.5 验收口径（全绿才算完成）

- `node scripts/test-scheduler.ts` 全过（含 §14）
- `node node_modules/typescript/bin/tsc --noEmit` 0 错
- `node node_modules/vite/bin/vite.js build` 过
- E2E 报告 0 失败 + `--selfcheck` 能红
- 还原后双键 SHA256 == 跑前（三个哈希都在报告里）
- `scan-tiny` 0（本次不新增中文文案）

---

## 10. 改动清单（文件级）

| 文件 | 改动 | 规模估计 |
|---|---|---|
| `src/components/SessionScreen.tsx` | `QueueItem.attempt`；`queue` + `requeueEnd` 原子维护；`submit` 分支（插入位置、tally 口径、toast 收窄）；插入顺序在结束判断之前 | ~45 行 |
| `scripts/test-scheduler.ts` | §14 十条 | ~90 行 |
| `scripts/audit-requeue.js` | 新增 E2E | 新文件 |
| `docs/evidence/review-requeue-2026-11-26.json` | 证据 | 产物 |

**明确不改**：`engine.ts`、`cards.ts`、`plan.ts`、`storage.ts`、`types.ts`、`backup.ts`、`copy.ts`、`app.css`/皮肤 CSS、任何矩阵审计脚本、即时复习轮次模型、准确率口径、`plan()` 一次性拍定。

---

## 11. D1–D4 定稿（原文照录）

| | 决定 |
|---|---|
| **D1** | 计数器放会话内存（`QueueItem.attempt`），不改 `types/storage/backup`。首次作答必然把 `due` 推到 ≥ 明天，退出重进词不在今日 plan，不会被绕过。 |
| **D2** | 回看复用 `answer()` → `isRetry` 路径。该路径在 `record.retried += 1` 后立刻 return，位置在所有写入之前，天然零写入。引擎零改动，改动面只剩 `SessionScreen.tsx`。 |
| **D3** | 回看词插在**短期 + 长期批次之后、逾期池之前**。逾期池本来就可跳过，回看词不会因为逾期长而等太久。 |
| **D4** | **完全不提示**。回看词 DOM 与普通复习词无区别，无「回看 n/2」文案，无回看 toast，全程静默。`QueueItem.attempt` 上限为 **3**（总次数 3 次 = 首次 + 回看 2 次）。 |

**由 D3/D4 派生、需你扫一眼的两条实现细则：**

1. **§5.2 / §8.10**：游标已进入逾期池后再答错逾期词时，回看带在其身后 → 插到 `index + 1`（马上再问）。这是「不静默丢弃」与「插在逾期池之前」两条约束在逾期段上的唯一自洽解。
2. **§7 统计行**：回看全程静默，但复习总结页的「重试 N」仍会计入回看次数（与 `DayRecord.retried` 同源，数据诚实）。若你要连这个也静默，说一声，改成只统计「同日跨批次续答」即可（一行）。

---

## 12. 已知代价（接受才开工）

1. **退出即放弃剩余回看**：第 1 次没过后退出，再进来该词今天不会再问（排程已定，不丢数据，但少了 2 次复习机会）。
2. **`retried` 数字会变大**：总结页「重试 N」包含回看次数（唯一的间接痕迹，见 §7、§11）。
3. **静默的代价**：用户第二次看到同一个词，无法从界面判断这是「第 2 次」还是「第 3 次」，也拿不到任何「已到上限」的反馈——这是 D4 明确接受的。
4. **逾期词的回看会被立刻再问**（§8.10），与短期词「排在逾期池之前」的节奏不同。
5. **回看不进任何统计口径**：`immediate`、完成率、正确率全部不受影响。
6. **不持久化**：刷新页面/切后台被杀 → 回看计数与剩余回看消失（同 1）。

---

## 13. 执行顺序（通过后）

1. 改 `SessionScreen.tsx` + §14 单测，`tsc` / `test:scheduler` / `build` 全绿 → commit 1（`feat(review): 正式复习回队尾（仅会话层，引擎零改动）`）。
2. 写 `scripts/audit-requeue.js`，隔离 context + 三哈希 + `--selfcheck` → 证据落盘 → commit 2（`test(review): 回队尾 E2E + 证据`）。
3. 补 `NOTES.md` 一条（结论/坑/下一步）→ commit 3（`docs(notes): 回队尾落地记录`）。
4. **每一步独立可回滚**，不夹带无关改动。
