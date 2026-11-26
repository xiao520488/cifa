# 正式复习「回队尾」· 规约（待过目）

> 状态：**待你过目**。本文档通过之前不改任何代码（本文件与 `QUEUE_AND_ACCURACY.md` 的 docs commit 除外）。
> 版本 v1 · 2026-11-26 · 基线 `e90244b`（四张表落于 `bec46db`，工作树干净）
> 关联：`docs/QUEUE_AND_ACCURACY.md`（现状对账，本文的每条「现状」都以它为依据）、`docs/SCHEDULER_BRIEF.md`、`docs/IMMEDIATE_ROUNDS_SPEC.md`
> 作者：lead

---

## 0. 需求 → 设计 对账

| 你的原话 | 落法 | 落在哪 |
|---|---|---|
| 不认识 / 模糊后回今日队列末尾再问一次 | 会话内存里把该词 `push` 回 `queue` 末尾（**不碰 `plan()`**） | §2、§5 |
| 直到点「认识」或 3 次上限 | `QueueItem.attempt` 1→2→3；`attempt === 3` 后不再入队 | §2.2、§2.3 |
| 排程/准确率/错题本只认第一次 | 第 2、3 次走**现有** `answer()`→`isRetry` 路径，引擎零改动 | §6 |
| 第二次及以后「不写任何调度字段」 | 复用重试路径（现状：只 `retried + 1`），并补深比较断言 | §6.2、§9.1 |
| 三次上限 | `attempt ≤ 3` | §8.3 |
| 不跨天 | 保留现有 `today !== plan.day → onExit` 守卫；不补问 | §8.1 |
| 错题本不变 | 引擎与 `recordMistake` 一行不碰 | §10 |

验收定义（四句）：**① 一个词今日最多被问 3 次；② 第 2、3 次作答对卡片/账本/准确率零写入；③ 首次三键语义与今天完全一致；④ 退出或跨天后不补问。**

---

## 1. 术语

| 术语 | 定义 |
|---|---|
| **首次作答（attempt = 1）** | 该词今日**第一次**被作答，唯一会写调度字段、准确率、错题本的那次。 |
| **回看 / 重排（attempt = 2、3）** | 回队尾后再被问的次数。**只推进队列，不写任何状态**（除 `DayRecord.retried` 计数）。 |
| **今日队列** | `SessionScreen` 进页面时由 `plan()` 派生的**会话副本**（`QueueItem[]`）。与 `engine.plan()` 无关，不落库。 |
| **上限** | `attempt ≤ 3`（首次 + 回队尾 2 次）。 |
| **出队** | 该词本次会话不再被问。四种途径：点「认识」/ `attempt === 3` / 退出会话 / 跨天。 |

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

- `buildReviewQueue(plan)` 产出的每一项 `attempt: 1`。
- `reviewQueue` 由 `useState<QueueItem[]>(() => ...)` 的**常量**改成可变 state（`queue` / `setQueue`）。
- **不新增 engine 字段、不改 `ImmediateGroup`、不改 `SchedulerState`、不碰 `storage.ts`。**

### 2.2 单次作答（伪代码）

```
submit(rating):
  if (engine.today() !== plan.day) return onExit()          # 跨天守卫，保持现状
  item = queue[index]
  outcome = run(t => t.answer(item.word, rating))           # ← 引擎入口不变

  if (!outcome.ok):
      toast(outcome.reason); advance(); return              # 不 append、不计数

  if (item.attempt === 1 && outcome.counted):
      tally[rating] += 1                                    # 首次且真正计分才进「认识/模糊/不认识」
  else:
      tally.retried += 1                                    # 回看、以及同日跨批次续答，只进「重试」

  requeue = (rating !== 'known') && (item.attempt < 3)
  if (requeue):
      queue.push({ ...item, attempt: item.attempt + 1 })     # 今日队列末尾
  else if (item.attempt === 3):
      toast('已到今日上限，这个词今天不再出现')

  advance()                                                  # 先 append 再判是否到头
```

```
advance():
  if (index + 1 >= queue.length): finishReview()
  else setIndex(index + 1)
```

关键点：**append 必须在「是否到头」判断之前**，否则最后一个词答「不认识」会直接收尾（这是本次最容易写错的一行）。

### 2.3 不变量（实现与测试都要逐条对）

| ID | 不变量 |
|---|---|
| I1 | 任一 `word` 在队列中同时只出现一项；`attempt` ∈ {1,2,3}。 |
| I2 | `attempt > 1` 的作答**只允许**改 `DayRecord.retried`（+1）；`CardState` 12 个字段全等。 |
| I3 | `accScore` / `accCount` 只在 `attempt === 1` 且 `kind === 'short'` 时变化（引擎保证）。 |
| I4 | `dueSnapshot` / `planSnapshot` 整日不变（回看不调 `snapshotDue` 的新路径）。 |
| I5 | `doneToday` 每词最多出现一次，且只在 `attempt === 1` 时写入。 |
| I6 | 队列词集合 ⊆ 进页面时的 plan 词集合（回看只重复，不引入新词）。 |
| I7 | 退出会话不写任何状态；回看词消失不丢数据（排程已在首次定死）。 |
| I8 | 跨天不补问：`today !== plan.day` 时点任何键都只 `onExit()`。 |
| I9 | 「今日最多 3 次」跨会话也成立：首次作答必然把 `due` 推到 ≥ 明天，重进页面该词不在 `plan` 里（`known` 前进/`fuzzy` 回退/`unknown` +1 均如此）。 |

### 2.4 状态迁移表

| 当前 | 事件 | 下一状态 | 队列动作 |
|---|---|---|---|
| attempt=1 | 认识 | 出队 | 不 append |
| attempt=1 | 模糊 | 回队尾（attempt=2） | append |
| attempt=1 | 不认识 | 回队尾（attempt=2） | append |
| attempt=2 | 认识 | 出队 | 不 append |
| attempt=2 | 模糊 / 不认识 | 回队尾（attempt=3） | append |
| attempt=3 | 任意 | 出队 + toast | 不 append |
| 任意 | 跨天 | 退出会话 | 丢弃队列 |
| 任意 | 主动退出 | 退出会话 | 丢弃队列 |

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
| UI `queue` | 可能 append | 可能 append | 本文档 §2.2 |

---

## 4. 决策 D1 · 三次计数器存在哪

| 方案 | 改动面 | 退出重进语义 | 备份/schema | 风险 |
|---|---|---|---|---|
| **A. 会话内存（推荐）**：`QueueItem.attempt` | 只改 `SessionScreen.tsx` | 重进 = 该词已不在今日 plan（I9），**不会绕过上限** | 零改动 | 极低 |
| B. 写进 `DayRecord`（如 `requeued: Record<string, number>`） | `types / storage / backup / engine` 四处 + 单测 | 跨会话保留次数 | 要 bump schema 或做兼容读，`backup.ts` 白名单要跟 | 中：迁移/备份兼容是新增风险面 |

**推荐 A**。理由：① 这是**展示行为**不是学习状态，排程与准确率已在首次锁死，计数丢不了任何数据；② 不改 schema 就不会碰备份/恢复这条刚收口的高风险链路；③ 由 I9 保证「退出重进」无法让一个词被问第 4 次，所以 A 的语义缺口实际不存在。

**代价**：`attempt` 不跨会话，退出重进后剩余回看直接消失（见 §12）。

---

## 5. 与 `plan()` / `dueSnapshot` 的关系

- 回看**只** push 进 UI 的 `queue`，**不调** `engine.plan()`、**不调** `engine.allowance()`、**不改** `DayRecord` 任何字段。
- `plan()` 的「一次性拍定」逻辑一行不动：进页面时的 `plan` 仍然是 `useState` 初值，之后不刷新。
- `dueSnapshot` 是完成率分母，回看不动它 → **完成率不受回看影响**（与需求一致：回看不是「额外到期」）。
- 任务列表里的「还剩 N 个」应改用 `queue.length - index`（随 append 增长），不再用 `tally` 之和推导。

---

## 6. 决策 D2 · 回走哪条路径

### 6.1 方案对比

| 方案 | 说明 | 优点 | 缺点 |
|---|---|---|---|
| **A. 复用 `answer()` → `isRetry`（推荐）** | UI 直接调现有入口；引擎靠 `lastReviewed === day` 自动降级 | 零新 API；「只写 `retried`」是**已有且已测**的行为；一条写入路径 | 语义上「重试」被扩展为「回看」，`retried` 数字会变大 |
| B. 新增 `answerRequeue()` | 引擎里加一条只推进队列的路径 | 语义最干净 | 多一条写入路径要维护/测试；与 `answer()` 的 guard 重复 |

**推荐 A。** 依据：`submitReview` 的 `isRetry` 分支在 `record.retried += 1` 后立即 return，位置在所有调度/准确率/账本写入之前（[engine.ts:717-729](../src/lib/scheduler/engine.ts#L717)），天然满足 I2。

### 6.2 复用 A 必须补的断言（现有测试没覆盖到的）

现状只有 T22（`重试不拉高正确率 / 不覆盖排程 / 只记一次重试`，[test-scheduler.ts:454-471](../scripts/test-scheduler.ts#L454)）与 9.2（同日第二次自动 `isRetry`，[test-scheduler.ts:818-838](../scripts/test-scheduler.ts#L818)）。缺的：

1. `CardState` **深比较**（12 字段逐一相等），不只是 `due`；
2. `DayRecord` 除 `retried` 外**逐字段相等**（含 `accScore / accCount / doneToday / dueSnapshot / planSnapshot / immediate`）；
3. `lifetime` 不变；
4. `mistakes` 账本对象引用与内容不变、`inMistakes` 不变。

### 6.3 ⚠️ 保留路径的既有副作用（必须写进测试注释）

`submitReview` 第一行是 `snapshotDue(ensureDay(day))`（[engine.ts:714](../src/lib/scheduler/engine.ts#L714)），而 `ensureDay` 对「今天」会跑 `sweepOverdue`（[engine.ts:292-300](../src/lib/scheduler/engine.ts#L292)）。它是**当天幂等**的清扫（>7 天逾期打回未学池），首次作答前已执行过，回看时通常空转。断言方式：**卡片集合跑前跑后相同**（不假设「空转」）。若某次回看真的新增清扫，那是数据缺陷，测试应当红。

---

## 7. UI 契约

| 项 | 规定 |
|---|---|
| 按钮 | 保持三键（认识 / 模糊 / 不认识），回看时**不置灰**（回看仍要能表达「还不会」）。 |
| 卡片提示 | 回看时在批次标签旁显示 **「回看 2/3」/「回看 3/3」**（见 D4）。 |
| toast（成功） | 现有逻辑在 `!outcome.counted` 时**无条件**弹「今天已经答过这个词了…」（[SessionScreen.tsx:170-172](../src/components/SessionScreen.tsx#L170)）。必须收窄为「`attempt === 1` 且 `!counted`」才弹（那种情况是同日跨批次续答）；`attempt > 1` 弹「回看 · 本词首次已计分，本次不计分」。 |
| toast（上限） | 第 3 次答完弹「已到今日上限，这个词今天不再出现」。 |
| 统计 | `认识/模糊/不认识` 三个数只统计 `attempt === 1` **且 `counted === true`** 的作答；`重试` 统计所有 `counted === false` 的作答（回看 + 同日跨批次续答）。 |
| 进度 | 用 `queue.length - index` 显示剩余；`finishReview` 条件 `index + 1 >= queue.length` 在 append 之后判定。 |
| 顺序 | 回看词一律追加到**整条今日队列末尾**（见 D3）。 |

---

## 8. 边界

| # | 边界 | 规定 |
|---|---|---|
| 8.1 | **跨天**（会话内过 0 点 / 4 点边界） | 保留现有守卫：`engine.today() !== plan.day` → `onExit()`，不补问、不写任何东西。跨天**不**把这些词算作「已完成」——`doneToday` 只认首次。 |
| 8.2 | **中途退出** | 剩余回看直接丢弃；卡片停在首次结果；下次进入该词不在今日 plan（I9），不会重问。 |
| 8.3 | **三次上限** | `attempt === 3` 答完即出队，无论认识/模糊/不认识；不再追加。 |
| 8.4 | **长期档词** | 首次不认识 → 打回 `short/1` + 回看；回看时卡片已是 `short`，走重试路径。首次认识进 90/180/360 或归档，不进回看。 |
| 8.5 | **逾期池词** | 与短期同规则（`reviewOverdue` 底层也是 `submitReview`）。 |
| 8.6 | **首次作答失败**（`!outcome.ok`，如今日已答/未到期） | 不 append、不计数；照旧 toast + 前进。 |
| 8.7 | **归档词** | 不在复习队列里，不受影响。 |
| 8.8 | **append 时正好是队列最后一项** | 先 append 再判结束，否则会提前收尾（§2.2 关键点）。 |
| 8.9 | **同一个词被 append 两次** | 物理不可能：append 的项 `attempt` 递增，原项已消费；同词同时只有一项（I1）。 |

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
| 14.6 | 连续三次作答（模拟 attempt 3） | 卡片仍 == 首次结果；`retried === 2`；`accCount === 1` |
| 14.7 | 首次模糊 → 同日再答 | 卡片停在模糊结果（回退一档、`lapses=0`、账本无）；`accScore=0.5 / accCount=1` |
| 14.8 | 首次不认识 | `accScore=0 / accCount=1`；账本 `count=1 / source='review'` |
| 14.9 | 次日再答（跨天） | **不**走 `isRetry`，正常计分（防止把回看逻辑写进引擎） |
| 14.10 | 卡片集合跑前跑后 | 相同（`sweepOverdue` 幂等，见 §6.3） |

### 9.2 E2E（新增 `scripts/audit-requeue.js`）

一条链跑完，不能只测单点：

```
注入隔离档案（今日 3 个到期词：w1 短期 1 天档、w2 短期 6 天档、w3 逾期 3 天）
→ 进入复习
→ w1 点「不认识」 → 断言：队列长度 3→4、w1 出现在队尾且标「回看 2/3」
→ w2 点「模糊」   → 断言：队列 4→5、w2 在队尾、标「回看 2/3」
→ 走完剩下的词 → 到 w1（第 2 次）点「认识」 → 断言：w1 不再追加、进度推进
→ 到 w2（第 2 次）点「模糊」 → 追加「回看 3/3」
→ 到 w2（第 3 次）点「不认识」 → 断言：出队 + 上限 toast
→ 断言 localStorage（cijian.scheduler.v1）：
   cards[w1] = 不认识首次结果；cards[w2] = 模糊首次结果（lapses 0、账本无）；
   days[today].accCount = 3、accScore = 0（w1）+ 0.5（w2）+ w3 首次得分；retried = 2；
   dueSnapshot 长度 = 3（未被回看污染）
→ 逐字节还原双键 → 校验还原后 SHA256 == 跑前
```

### 9.3 数据隔离（**与以往口径不同，注意**）

- 独立 context（Playwright 新建 profile），不碰真实档案（**硬要求**）。
- **不能**要求「跑前跑后双键 SHA256 相同」——回看会合法地把 `retried` 从 0 改到 2，本次跑完哈希**必然**变。
- 正确口径：**跑前备份两个键的原始字节 → 跑完断言 → 逐字节写回 → 校验还原后 SHA256 == 跑前 SHA256**（备份值随报告落盘）。
- 报告：`docs/evidence/review-requeue-2026-11-26.json`，含 `beforeSha / afterRunSha / restoredSha` 三个值 + 全部断言明细。
- 跑完删 `__bak_* / __p_*`。
- 脚本必须复制到 `C:\Users\xiao\.dsh\mcp\playwright-mcp\` 再用 `run-audit-node.js` 跑（`filename` 按 MCP 的 cwd 解析）；cfg 一律传**文件路径**，不要内联 JSON（PowerShell 会吃引号）。

### 9.4 量具自证伪

`--selfcheck` 模式：把期望值故意写错（如期望 `cards[w1].lapses === 0`），必须**非 0 退出**。一次没红过的检查不算检查。

### 9.5 验收口径（全绿才算完成）

- `node scripts/test-scheduler.ts` 全过（含 §14）
- `node node_modules/typescript/bin/tsc --noEmit` 0 错
- `node node_modules/vite/bin/vite.js build` 过
- E2E 报告 0 失败 + `--selfcheck` 能红
- 还原后双键 SHA256 == 跑前（三个哈希都在报告里）
- `scan-tiny` 0（新增文案「回看 2/3」「已到今日上限」）

---

## 10. 改动清单（文件级）

| 文件 | 改动 | 规模估计 |
|---|---|---|
| `src/components/SessionScreen.tsx` | `QueueItem.attempt`；`reviewQueue` 改可变 state；`submit` 分支（append 顺序、tally 口径、toast 收窄）；「回看 n/3」提示 | ~40 行 |
| `scripts/test-scheduler.ts` | §14 十条 | ~90 行 |
| `scripts/audit-requeue.js` | 新增 E2E | 新文件 |
| `docs/evidence/review-requeue-2026-11-26.json` | 证据 | 产物 |

**明确不改**：`engine.ts`、`cards.ts`、`plan.ts`、`storage.ts`、`types.ts`、`backup.ts`、`copy.ts`、`app.css`/皮肤 CSS、任何矩阵审计脚本、即时复习轮次模型、准确率口径、`plan()` 一次性拍定。

---

## 11. 需你拍板（4 条，均已给推荐）

| 编号 | 问题 | 推荐 | 备选与差别 |
|---|---|---|---|
| **D1** | 三次计数器存哪 | **会话内存**（`QueueItem.attempt`） | 存 `DayRecord`：跨会话保留，但要动 schema/storage/backup，收益接近零（I9 已封住绕过） |
| **D2** | 回看走哪条路径 | **复用 `answer()` → `isRetry`** | 新增 `answerRequeue()`：语义干净，但多一条写入路径 |
| **D3** | 回看插到哪 | **整条今日队列末尾**（贴合你原话） | 「当前批次末尾」：回看间隔更短；代价是队列变成「分段+队尾」两层结构，`finishReview` 判据要改 |
| **D4** | 是否显示「回看 2/3」 | **显示**（否则易被当成队列重复 bug） | 不显示：少一行文案，但用户看不出这是第几次 |

D3 的取舍值得说清：若今日队列里还有大批逾期词（例如 30 个），整条队尾意味着这个词要等 30 多张卡之后才回看——间隔可能是十几分钟。若你更在意「趁热再背一遍」，选「当前批次末尾」；若你更在意「一次背完再统一回看」，选整条队尾。

---

## 12. 已知代价（接受才开工）

1. **退出即放弃剩余回看**：2 次没过后退出，再进来该词今天不会再问（排程已定，不丢数据，但当天少了两次复习机会）。
2. **`retried` 数字会变大**：总结页「重试 N」会包含回看次数（语义仍是「同一词今日重复作答」）。
3. **整条队尾方案下间隔可能很长**（D3 选的代价）。
4. **回看不进任何统计口径**：`immediate`、完成率、正确率全部不受影响 → 数据上「多背了两次」这件事不可见（只有 `retried` 一个影子）。
5. **不持久化**：刷新页面/切后台被杀 → 回看计数与剩余回看消失（同 1）。

---

## 13. 执行顺序（通过后）

1. 按 §10 改 `SessionScreen.tsx` + §14 单测，`tsc` / `test:scheduler` / `build` 全绿 → commit 1（`feat(review): 正式复习回队尾（仅会话层，引擎零改动）`）。
2. 写 `scripts/audit-requeue.js`，隔离 context + 三哈希 + `--selfcheck` → 证据落盘 → commit 2（`test(review): 回队尾 E2E + 证据`）。
3. 补 `NOTES.md` 一条（结论/坑/下一步）→ commit 3（`docs(notes): 回队尾落地记录`）。
4. **每一步独立可回滚**，不夹带无关改动。
