# 队列 · 准确率 · 三键 · 错题本 —— 现状对账

> 状态：**事实文档**（只记录代码现状，不含需求与计划）。
> 日期 2026-11-26 · 基线 `e90244b`（工作树干净）· 方法：grep + 逐行阅读源码，**未运行代码**，数字全部来自静态阅读。
> 关联：`docs/SCHEDULER_BRIEF.md`、`docs/IMMEDIATE_ROUNDS_SPEC.md`、`NOTES.md` 2026-11-26 收尾条目。

---

## 0. 速查（六句）

1. `pendingCount` = **即时复习**待开组词数 = `pendingWords.length`，与正式复习队列长度无关。
2. 正式复习队列在进页面时由 `engine.plan()` **一次性拍定**，三段串行，中途不重排、不插回。
3. 正式复习点「不认识」= **立刻移出今日队列**（`due` 改明天），**没有回队尾机制**；全库唯一的「回队尾」在即时复习。
4. `accScore` / `accCount` 全库只有一处写入：**短期正式复习的首作答、非重试**。
5. 正式复习「不认识」**一次即进错词本**；「认识」出本子；「模糊」不动本子。
6. 新词量 = `manual ?? pendingLimit ?? currentLimit`（再 `min(maxLimit)`），与即时复习的作答选择无关。

---

## 1. 表 1 · 队列结构

| 项 | 结论 | 代码位置 |
|---|---|---|
| **正式复习队列怎么拼** | 三段串行：短期批次（1/2/6/15 天档，按档位升序）→ 长期批次（30/90/180/360）→ 逾期池（逾期天数从短到长）。进页面时 `engine.plan()` 拍一次，全流程不重排、不插回 | [SessionScreen.tsx:58-91](../src/components/SessionScreen.tsx#L58)、[plan.ts:82-99](../src/lib/scheduler/plan.ts#L82) |
| **批内顺序** | `prioritize()`：`hard` 或 `skippedImmediate` 的词提到该批最前，其余保持池序 | [plan.ts:70-79](../src/lib/scheduler/plan.ts#L70) |
| **今日批次怎么组织** | 短期只收 `due === day` 的卡并按 `interval` 分桶；长期按批次日（周日跑 30d，每月 1 号跑 90/180/360）；逾期单独成池，**不影响新词量**（长期逾期只展示） | [plan.ts:82-99](../src/lib/scheduler/plan.ts#L82)、[plan.ts:132-153](../src/lib/scheduler/plan.ts#L132) |
| **待复习量（完成率分母）** | `DayRecord.dueSnapshot`：当天第一次 `plan()` 拍下，之后永不重算；界面「今天到期 N 个」读 `plan.totals.dueToday` | [engine.ts:307-315](../src/lib/scheduler/engine.ts#L307) |
| **`pendingCount` 怎么算** | 恒等于 `pendingWords.length`：学一个词 push 后重算 → 开组清 0 → 跳过清 0 → 载入时按数组长度重建。**没有独立计数逻辑** | [engine.ts:403-404](../src/lib/scheduler/engine.ts#L403)、[engine.ts:431](../src/lib/scheduler/engine.ts#L431)、[engine.ts:488](../src/lib/scheduler/engine.ts#L488)、[storage.ts:390](../src/lib/scheduler/storage.ts#L390) |
| **即时复习什么时候开** | 攒够 10 个（`IMMEDIATE_TRIGGER`）；统一流程里是「列表看完 → `pending` 里的词开组」，末批不足 10 个也强制开 | [immediate.ts:19](../src/lib/scheduler/immediate.ts#L19)、[SessionScreen.tsx:221-239](../src/components/SessionScreen.tsx#L221) |
| **正式复习点「不认识」：立刻移出还是留队** | **立刻移出**：`interval` 打回 1、`due = 今天 + 1`，今天不再出现；UI 只把 `index + 1` 往前走 | [cards.ts:74](../src/lib/scheduler/cards.ts#L74)、[SessionScreen.tsx:180-181](../src/components/SessionScreen.tsx#L180) |
| **有没有「回队尾」机制** | **正式复习没有**。唯一回队尾在即时复习：本轮第 1 次模糊 → `queue.push(word)` 回本轮队尾；第 2 次模糊 → 进 `crossRound` 等下一轮 | [immediate.ts:103-114](../src/lib/scheduler/immediate.ts#L103) |

补充：正式复习里同一个词一天只能计分一次（`lastReviewed === day` 直接拒绝）；同一天第二次出现会被 `answer()` 自动降级成重试，只记 `retried`、不动排程（[engine.ts:794-799](../src/lib/scheduler/engine.ts#L794)）。

---

## 2. 表 2 · 准确率写入点

**全库只有一处写 `accScore` / `accCount`：**

| 写入点 | 触发动作 | 写入内容 | 计入正确率 |
|---|---|---|---|
| [engine.ts:749-752](../src/lib/scheduler/engine.ts#L749) | `submitReview()` 且 `kind === 'short'`，**短期正式复习**（1/2/6/15 天档），非重试 | `accScore += RATING_SCORE[rating]`（认识 1 / 模糊 0.5 / 不认识 0）、`accCount += 1`；同时 `lifetime.score/count` 同增 | ✅ 是 |
| [engine.ts:106-107](../src/lib/scheduler/engine.ts#L106) | `makeDayRecord()` 建当天记录 | 初始化为 0 | — 非事件 |
| [storage.ts:127-139](../src/lib/scheduler/storage.ts#L127) | 载入存档时的规范化 | 把 `accScore` clamp 到 `[0, accCount]` | — 非事件 |

**明确不写准确率的四条路径**：即时复习（[engine.ts:435-474](../src/lib/scheduler/engine.ts#L435)，整段无这两个字段）、长期批次（`counted:false`，[engine.ts:770](../src/lib/scheduler/engine.ts#L770)）、答错当场重试（[engine.ts:717-729](../src/lib/scheduler/engine.ts#L717) 提前 return）、错词本单测与归档抽查（`quizMistake` / `reviewArchived` 均 `counted:false`）。

**新词量的读取链：**

| 问题 | 结论 | 代码位置 |
|---|---|---|
| `plan.newWordLimit` 读哪个字段 | `manual(当天)` ?? `pendingLimit(当天)` ?? `currentLimit`，最后 `min(maxLimit)` | [plan.ts:202-209](../src/lib/scheduler/plan.ts#L202)、[plan.ts:227](../src/lib/scheduler/plan.ts#L227) |
| `pendingLimit` 谁写 | 结算时写入「明天生效值」 | [engine.ts:914](../src/lib/scheduler/engine.ts#L914) |
| `currentLimit` 谁动 | 只在自适应真正增减时移动；暂停/维持/被上限截断都保住基线 | [adaptation.ts:260-261](../src/lib/scheduler/adaptation.ts#L260) |
| `DayRecord.newWordLimit` 是什么 | 只是快照字段，给日历读；首页与今日卡读的是 `plan.newWordLimit` | [plan.ts:332](../src/lib/scheduler/plan.ts#L332)、[TodayCard.tsx:61](../src/components/TodayCard.tsx#L61) |

**是否取决于即时复习第一次选择：不取决于。** 准确率只来自短期正式复习。即时复习影响新词量只有两条间接路径：① 组平均模糊次数 ≥ 2 → 当日额度再 ×0.9（[adaptation.ts:233-240](../src/lib/scheduler/adaptation.ts#L233)）；② 硬词 / 跳过词只改**次日批次排序**，不改数量（[plan.ts:70-79](../src/lib/scheduler/plan.ts#L70)）。

准确率合成本身：0.7 × 近 3 天加权（0.5/0.3/0.2，缺数据的天剔除并归一）+ 0.3 × 历史累计（[adaptation.ts:11-16](../src/lib/scheduler/adaptation.ts#L11)、[adaptation.ts:41-62](../src/lib/scheduler/adaptation.ts#L41)）。

---

## 3. 表 3 · 三键对调度字段的影响

所有非重试提交都会先执行 `reps + 1`、`lastRating = rating`、`lastReviewed = day`（[cards.ts:53-55](../src/lib/scheduler/cards.ts#L53)），并统一清掉 `hard` 与 `skippedImmediate`（[engine.ts:739-740](../src/lib/scheduler/engine.ts#L739)）。下表只列差异项。

**短期档（1 / 2 / 6 / 15 天）**

| 键 | interval / phase | due | lapses | inMistakes | 错题本账本 |
|---|---|---|---|---|---|
| 认识 | 1→2→6→15；**15 档答对 → phase `long`，`longInterval=30`、`longAnchor=今天`** | `今天 + 新档`；进长期后 **null** | 不变 | **false**（清） | **删除**（`clearMistake`） |
| 模糊 | 回退一档：1→1、2→1、6→2、15→6 | `今天 + 新档`（1 档模糊 = 明天还来） | 不变 | **不变**（在册仍留） | **不动**（既不加也不删） |
| 不认识 | 强制 `1` | `今天 + 1` | **+1** | **true** | **count + 1**，`source:'review'` |

**长期档（30 / 90 / 180 / 360）**

| 键 | interval / phase | due | lapses | inMistakes | 错题本账本 |
|---|---|---|---|---|---|
| 认识 | 30→90→180→360；**360 答对 → phase `archived`**（`longInterval` / `longAnchor` 置 null，同时进 `archived[]`） | 长期期 `due` 恒为 null（到期日 = `longAnchor + longInterval` 现算）；归档后 null | 不变 | **false**（清） | **删除** |
| 模糊 | 打回 `phase short`、`interval=1`，长期字段清空 | `今天 + 1` | **不变** | **不变** | **不动** |
| 不认识 | 同上打回 `short / 1` | `今天 + 1` | **+1** | **true** | **count + 1** |

两点容易踩的：

- **长期「模糊」会打回 1 天但不算错**，不进错词本；只有长期「不认识」才 `lapses + 1` 并记账（[cards.ts:90-98](../src/lib/scheduler/cards.ts#L90)）。
- **重试路径卡片一字不改**：只 `record.retried += 1`，连 `lastRating` 都不覆盖（[engine.ts:717-729](../src/lib/scheduler/engine.ts#L717)）。

即时复习两键不碰任何调度字段（不改 interval / due / lapses / lastRating），只在「第 5 轮强制收口」时给残留词打 `hard = true`（[engine.ts:449-456](../src/lib/scheduler/engine.ts#L449)）。

---

## 4. 表 4 · 错题本触发条件

**正式复习：第一次点「不认识」就进，没有累计门槛。** 短期路径在 `applyShortReview` 里直接把新卡 `inMistakes` 置 true（[cards.ts:74](../src/lib/scheduler/cards.ts#L74)），engine 再补一次账本（[engine.ts:744](../src/lib/scheduler/engine.ts#L744)）。出本子只靠「认识」（[engine.ts:745](../src/lib/scheduler/engine.ts#L745)），「模糊」不会把人踢出本子。

`recordMistake()` 全部调用点（4 处，别无其他）：

| 路径 | 调用点 | 触发条件 | 计数方式 |
|---|---|---|---|
| 正式复习（含逾期清账） | [engine.ts:744](../src/lib/scheduler/engine.ts#L744) | **一次「不认识」即进** | `+1`，`source:'review'` |
| 即时复习 | [engine.ts:446](../src/lib/scheduler/engine.ts#L446) | 本会话累计模糊**满 3 次**才进（第 3 次一次记满 3） | `increment` 3 或 1，`source:'immediate'` |
| 错词本单测 | [engine.ts:697](../src/lib/scheduler/engine.ts#L697) | 答错即 `+1`（答对则出本子） | `+1`，`source:'quiz'` |
| 归档库抽查 | [engine.ts:843](../src/lib/scheduler/engine.ts#L843) | 一次「不认识」即进，且 `lapses + 1` | `+1`，`source:'archived'` |

`recordMistake` 本体还会顺手把卡片 `inMistakes` 置 true，作为账本的镜像（[engine.ts:643-644](../src/lib/scheduler/engine.ts#L643)）；账本与卡片刻意解耦——卡片被逾期清扫回未学池后，账本仍留着（[types.ts:83-97](../src/lib/scheduler/types.ts#L83)）。

**两条语义差必须分开记**：正式复习是「一次错就进」，即时复习是「累计 3 次才进」；并且**即时复习进本子不出队**——词仍在本轮 `queue` 或 `crossRound` 里，直到点「认识」（[immediate.ts:4-11](../src/lib/scheduler/immediate.ts#L4)）。

---

## 5. 未验证（本文档的边界）

以下均为**静态阅读结论**，未跑测试、未跑 E2E，改动前需按 `REVIEW_REQUEUE_SPEC.md` §9 的矩阵实测：

- 「重试路径零写入」目前只有 T22 与 9.2 两条断言覆盖（[test-scheduler.ts:454-471](../scripts/test-scheduler.ts#L454)、[test-scheduler.ts:818-838](../scripts/test-scheduler.ts#L818)），未做 `DayRecord` 深比较。
- 重试路径仍会经过 `ensureDay → sweepOverdue`（[engine.ts:292-300](../src/lib/scheduler/engine.ts#L292)），属当天幂等清扫；「卡片集合跑前跑后不变」未单独断言过。
- 长期档「模糊」打回短期时 `inMistakes` 保持原值这一点，仅代码路径确认，无专测。
