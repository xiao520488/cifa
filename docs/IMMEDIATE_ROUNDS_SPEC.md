# 即时复习轮次模型 · 规约（待过目）

> 状态：**待用户过目**。本文档通过之前不改任何代码。
> 版本：v2（2026-11-26，D1/D2/D3 已定稿 + 评审五点修正）　作者：lead　基线：`b0e7df2`（工作树干净）
> 关联：`docs/SCHEDULER_BRIEF.md` §一.2、`docs/REFACTOR_PLAN.md` §1/§2、`NOTES.md` 2026-11-24「即时复习卡片改居中版式」

---

## 0. 前提与不做的事

**前提（已实测确认，见上一轮映射表）**

- 即时复习路径上**没有 `Rating` 这个量**，只有 `known: boolean`；`false` 等价「不认识」。
- 三个标记的现状：`lapses` 只由正式复习 `'unknown'` 累加；`hard` 只由即时复习组内 `loopCount >= 3` 设置；`relearned` 与作答值无关（只由逾期 >7 天清扫设置）。
- 组内计数 `loopCount[word]` 是**每组独立**的，且组收口即入库 → 同词不可能进第二组 → 「跨轮累计」物理上不存在。
- 连带 bug 1：`recordMistake` 执行时卡片尚未建（`engine.ts:440-443` 早于 `commitNewWords`），`if (card)` 落空 → 入库后 `hard=true / inMistakes=false`。
- 连带 bug 2：长期档 `fuzzy` 在 `cards.ts:96` 强制 `inMistakes: true`，但 `engine.ts:730` 只在 `'unknown'` 记账 → 卡 flag 真、账本空。

**本次不做**

- 不改皮肤 CSS、不改 DOM 结构（除下面第 7 节列出的文案节点）。
- 不动 `audit-screens.js` / `audit-skins.js` / 任何矩阵脚本。
- 不改正式复习三键的排程语义（`1→2→6→15→长期`、模糊回退一档）。
- 不改 `CardState` 的调度字段。
- 不给 `lastRating` 写 `'fuzzy'`（即时复习不是正式复习，见 3.3）。

---

## 1. 术语与作用域

| 术语 | 定义 |
|---|---|
| **会话（group）** | 一次即时复习：从 `startImmediateWith()` 开组到 `commitNewWords()` / `abandonImmediate()` / 跨日作废，为一整个会话。stats 的 `groups +1` 按会话计，**不按轮计**。 |
| **轮（round）** | 会话内的一个完整遍历。第 1 轮 = 全组词；第 r 轮 = 第 r−1 轮的「待跨轮」词。范围 1–5。 |
| **本轮再出现一次** | 本轮内某个词第 1 次点「模糊」后回到本轮队尾，**在本轮内最多再被问到一次**。 |
| **需跨轮（crossRound）** | 本轮第 2 次遇到该词、仍点「模糊」→ 本轮不再出现，进入下一轮队列。 |
| **累计模糊次数** | 本次会话内该词被点「模糊」的总次数（`fuzzyCount`）。跨轮累加，**跨会话不累计**。 |
| **收口** | 会话结束、这组词入库。两种：自然收口（某轮没有模糊词）、强制收口（第 5 轮结束仍有模糊词）。 |

**作用域裁定（对应你补的第 1 条）：跨会话不累计。** 一个新会话 = 计数从 0 开始；明天的新组不继承。

---

## 2. 状态机

### 2.1 状态字段

| 字段 | 类型 | 含义 | 初始值 |
|---|---|---|---|
| `schema` | `2` | 新模型标记；缺省 = v1 旧组（见 §6） | 2 |
| `words` | `string[]` | 全组词（入库用） | 入参 |
| `round` | `number` | 当前轮次 1–5 | 1 |
| `queue` | `string[]` | **本轮**待答队列（队头即当前题） | `[...words]` |
| `fuzzyThisRound` | `string[]` | 本轮已模糊过一次的词（保序） | `[]` |
| `crossRound` | `string[]` | 本轮第 2 次仍模糊 → 等下一轮（保序） | `[]` |
| `fuzzyCount` | `Record<string, number>` | 本会话累计模糊次数 | `{}` |
| `hardWords` | `string[]` | 会话结束时仍未点「认识」的词（强制收口产生） | `[]` |
| `startedOn` | `StudyDay` | 开组日（跨日作废沿用） | 今天 |

### 2.2 单次作答（伪代码）

```
answerImmediate(word, known):
  g = active; if (!g) return null
  if (word ∉ g.words) return null

  if (known):
      从 queue / fuzzyThisRound / crossRound 中移除 word        # 出队唯一途径
  else:
      before = g.fuzzyCount[word] ?? 0 ; after = before + 1
      g.fuzzyCount[word] = after
      thresholdCrossed = (before < 3 && after >= 3)             # 本组第 3 次
      if (before >= 3): mistakeIncrement = 1                    # 第 4、5… 次
      elif thresholdCrossed: mistakeIncrement = 3               # 一次记满 3 次
      else: mistakeIncrement = 0

      if (word ∈ g.fuzzyThisRound):                            # 本轮第 2 次
          queue 移除 word；fuzzyThisRound 移除 word；crossRound 追加 word
      else:                                                     # 本轮第 1 次
          fuzzyThisRound 追加 word；queue 移到队尾

  roundFinished = (g.queue.length === 0)
  finished = false
  if (roundFinished):
      if (g.crossRound.length === 0): finished = true           # 自然收口
      elif (g.round >= 5):
          g.hardWords += g.crossRound; g.crossRound = []        # 强制收口
          finished = true
      else:
          g.round += 1; g.queue = [...g.crossRound]; g.crossRound = []; g.fuzzyThisRound = []
  return { group, round, remaining(本轮剩余), loops(=fuzzyCount[word]),
           crossed(本次是否跨轮), thresholdCrossed, mistakeIncrement,
           roundFinished, finished, hardWords }
```

### 2.3 状态转移表

| 当前 | 事件 | 下一状态 | 用户可见 |
|---|---|---|---|
| 轮 r，queue=[w, …] | 点「认识」 | 出队；queue 少一个 | 下一个词 |
| 轮 r，w 首次「模糊」 | 模糊计数 +1，w 回队尾 | 本轮内还会出现一次 | 下一个词 |
| 轮 r，w 第二次「模糊」 | 计数 +1，进 crossRound | 本轮不再出现 | toast「本轮不再出现，下一轮再见」 |
| 轮 r，queue 空、crossRound 空 | 收口 | finished=true | 总结页 |
| 轮 r，queue 空、crossRound 非空、r<5 | 开第 r+1 轮 | queue=上轮 crossRound，round+1 | toast「第 2 轮 · 还有 3 个词」 |
| 轮 5，queue 空、crossRound 非空 | 强制收口 | 残留词进 hardWords，finished=true | 总结页「硬词 N 个」 |
| 任意 | 某个词累计到 3 次模糊 | 记错词本（一次 +3）；**不因记账出队**——本轮第 1 次模糊时它在 `queue`，本轮第 2 次模糊时它在 `crossRound` | toast「已记入错词本」 |

### 2.4 不变量（写进单测，任何一条破了就算失败）

1. `queue ∩ crossRound = ∅`；同一词同一时刻只在一处。
2. `fuzzyThisRound ⊆ queue`（第 2 次模糊后同时从两处移除）。
3. 每轮每个词**最多出现 2 次**；同词全会话最多出现 10 次（5 轮 × 2）。
4. `fuzzyCount` 单调不减。
5. `fuzzyCount[w] >= 3` ⇒ `mistakes[w]` 存在且 `count ≥ 3`（**单向**：反向不成立，账本可能来自正式复习的「不认识」）。
6. 词出队 ⟺ 该次作答为「认识」。
7. 收口时 `queue` 与 `crossRound` 都为空（强制收口时 crossRound 已并入 hardWords）。
8. 入库后 `lastRating === null`、`lapses === 0`（即时复习不写这两个字段）。

### 2.5 一个 4 词例子（可直接当测试用例）

```
开组 words=[a,b,c,d] round=1 queue=[a,b,c,d]
1. a 模糊 → queue=[b,c,d,a]  fuzzyThisRound=[a]
2. b 认识 → queue=[c,d,a]
3. c 认识 → queue=[d,a]
4. d 认识 → queue=[a]
5. a 模糊（本轮第 2 次）→ 计数 2，crossRound=[a]，queue=[]
   → round 2，queue=[a]，fuzzyThisRound=[]
6. a 模糊 → 计数 3 → 记错词本 +3，回队尾 queue=[a]，fuzzyThisRound=[a]
7. a 模糊（本轮第 2 次）→ 计数 4，+1，crossRound=[a]，queue=[]
   → round 3，queue=[a]
8. a 认识 → queue=[]，crossRound=[] → 自然收口 finished
入库：cards[a].hard=false，cards[a].inMistakes=true（来自账本），mistakes[a].count=4
```

---

## 3. Schema 变更

### 3.1 `ImmediateGroup`（`src/lib/scheduler/types.ts`）

新增 6 个字段，`loopCount` **删除**（新组不再写；旧组见 §6）。

```ts
export interface ImmediateGroup {
  schema: 2;                       // 新模型标记
  words: string[];
  round: number;                   // 1..5
  queue: string[];
  fuzzyThisRound: string[];
  crossRound: string[];
  fuzzyCount: Record<string, number>;
  hardWords: string[];
  startedOn: StudyDay;
}
```

### 3.2 `ImmediateAnswerResult`（`src/lib/scheduler/immediate.ts`）

```ts
export interface ImmediateAnswerResult {
  group: ImmediateGroup;
  round: number;
  remaining: number;          // 本轮剩余题数（UI 用）
  loops: number;              // = fuzzyCount[word]（兼容旧字段名）
  crossed: boolean;           // 本次「模糊」把词推进下一轮
  thresholdCrossed: boolean;  // 本次跨过第 3 次
  mistakeIncrement: 0 | 1 | 3;// 交给 engine 记账（纯函数不碰账本）
  roundFinished: boolean;
  finished: boolean;          // 整组收口（可入库）
  hardWords: string[];        // 收口时仍未认识的词
}
```

`finished` 语义**改变**：旧 = 队列清空；新 = 整组收口。UI 里「组清空 → commit」的位置不变，判断依据仍是 `finished`。

**`loops` 语义确认**：由「组内 `loopCount`」变为「本会话累计模糊次数 `fuzzyCount[word]`」。已 `grep -rn '\.loops' src/` 核对：**没有任何组件读它**——只有 `engine.ts`（stats 累加、`recordMistake` 增量）、`storage.ts`（持久化清洗）、`types.ts`（类型）三处，UI 层 0 处。因此本次**不需要**「已模糊 N 次」的界面改动；将来若要在界面显示，沿用 `loops` 并写「已模糊 N 次」，不要写「循环 N 次」或「错 N 次」。另：`engine.ts:443` 现在用 `result.loops` 当记账增量，本次改由 `mistakeIncrement` 承担。

### 3.3 `CardState`：**不新增字段**

理由：累计计数是**会话作用域**，会话结束即丢；卡片只需要 `hard` 与 `inMistakes` 两个既有布尔。加字段会带来卡库迁移与清洗器风险，收益为零。

**`lastRating` 规则不变**：即时复习不写 `lastRating`（恒 `null`）。不得为了「记录模糊」把 `'fuzzy'` 写进去——那会与正式复习语义混淆，且 `lapses`/`correctRate` 都按正式复习算。

### 3.4 清洗器（`src/lib/scheduler/storage.ts` `readGroup`）

- `schema` 必须是数字 `2`，否则按 §6 处理。
- `round` 夹取 `1..5`（`int(raw.round, 1, 1, 5)`）。
- `fuzzyThisRound` / `crossRound` 用现有 `wordList()`，再 `filter(w => words.includes(w))`。
- `fuzzyCount` 只保留 `words` 内的键、数字 `0..99` 取整。
- `hardWords` 同上（`words` 内）。
- 一致性修复（正常态）：`queue` 为空、`crossRound` 非空、`round < 5` → 把 `crossRound` 并入 `queue` 并清空（防止半截状态卡死）。
- 边缘态（`round === 5` 且 `queue` 空、`crossRound` 非空）：**正常流程不可达**——**正常流程由 `answerImmediate` 原子完成强制收口，清洗器不承担收口职责**。防御性处理：**丢弃该组**，`stats.skipped += 该组剩余词数`（与 D3 旧组丢弃同一口径），词回未学池（零数据损失）；代码注释写「不可达，仅为清洗器自洽」。报告中单列「异常组丢弃数」。
  - ⚠️ 这里**没有采纳你「3 行完成强制收口」的原建议**，原因是它达不到目的：`active = null` 之后没有任何 commit 路径，`hardWords` 会被写进一个随即丢弃的对象，**标记依然落不到卡片上**。真要保住标记，得把 `crossRound` 回填 `queue`、`round` 保持 5，让下一次作答走正常收口——代价是该词在「第 5 轮」再出现一次（总次数 11，与 D1 的 10 次上限冲突），换来的只是一个不可达路径的恢复能力。
- `loopCount`：方案 B 下 `readGroup` 不再读它（v1 组整组丢弃）。

---

## 4. 字段映射表（三个键 + 两个键）

| 入口 | 按钮 | 调用 | 写入 | 分支判据 |
|---|---|---|---|---|
| 复习三键 | 不认识 | `submit('unknown')` | `lastRating='unknown'`、`lapses+1`、`interval=1`、`due=+1d`、`inMistakes=true`、账本 `+1` | `rating === 'unknown'` |
| 复习三键 | 模糊 | `submit('fuzzy')` | `lastRating='fuzzy'`、回退一档；**不加 lapse、不记账本**（长期档见 D2） | `rating === 'fuzzy'` |
| 复习三键 | 认识 | `submit('known')` | `lastRating='known'`、进下一档、`clearMistake` | `rating === 'known'` |
| 即时两键 | 模糊 | `answerImmediateClick(false)` | `fuzzyCount[word]++`；≥3 → 账本 `+3`；本轮第 1 次回队尾 / 第 2 次进 crossRound；**不写 `lastRating`** | `known === false` + `fuzzyThisRound` 成员判断 |
| 即时两键 | 认识 | `answerImmediateClick(true)` | 出队；`fuzzyCount` 保留；**不写 `lastRating`** | `known === true` |

**「进错词本 ≠ 出队」**：第 3 次模糊只记账，词仍在**本次会话**里（本轮第 1 次模糊时在 `queue`，本轮第 2 次模糊时在 `crossRound`），必须点到「认识」才真正出队（你补的第 2 条）。

---

## 5. 两个连带 bug 的修法

### 5.1 连带 bug 1：`inMistakes` 时序

**修法：账本是唯一来源，卡片 flag 是镜像。**

1. `commitNewWords()` 建卡后补一行：
   ```ts
   if (this.s.mistakes[word]) card.inMistakes = true;
   ```
   （`hard` 的写入保持现有 `hardWords` 逻辑不动。）
2. `learnNewWord()`（legacy 路径，UI 已不调用）同样补这一行，避免两条建卡路径行为不一致。
3. 新增不变量断言（单测）：3 次模糊 → 收口 → `mistakes[a].count === 3` **且** `cards[a].inMistakes === true`。

**验收口径**：你说的「进 mistakes 且 inMistakes 为 true」按此实现；flag 不再由「记账那一刻卡片是否已存在」决定。

### 5.2 连带 bug 2：长期档模糊是否进错词本（**已定：A，不进**）

| 方案 | 行为 | 代价 |
|---|---|---|
| **A（推荐）** | 长期档「模糊」**不进**错词本：`cards.ts:96` 的 `inMistakes: true` 改为保留原值；只有「不认识」进账本 | 与短期档、与 `SCHEDULER_BRIEF §二.2`（模糊=0.5，间隔缩短）一致；改动 1 行 |
| B | 长期档「模糊」进错词本：保持 flag，并在 `engine.submitReview` 里对 `fuzzy` 也 `recordMistake(+1)` | 用户可见行为变化（长期档点模糊会进本子）；需要新文案解释 |

推荐 A 的理由：同一评分不应在不同档位有不同账本语义；现状「flag 真、账本空」是自相矛盾状态，任何读取方都会出错；若真要「长期档模糊=明显遗忘」，应显式定义并同时记账，不能只翻 flag。

**历史数据不追溯（已定）**：D2 修完后，库里可能有一批「`card.inMistakes = true` 但 `mistakes` 账本无记录」的老卡。**不做批量清洗**：清洗器不扫卡库、不加迁移脚本；这些卡在后续 `clearMistake()`（正式复习答「认识」或错词本单测答对）时自然归位。读取方一律以账本为准（错词本只在账本有条目时展示），flag 仅作镜像。

---

## 6. 旧数据兼容（**已定：B，旧组丢弃**）

**现状**：`immediate.active` 会持久化。升级那一刻用户可能正停在半组里。

| 方案 | 做法 | 代价 |
|---|---|---|
| A（你的建议） | 旧组（无 `schema`）按 v1 旧语义跑完：`immediate.ts` 保留一条 legacy 分支，清洗器保留 `loopCount` | 永久双状态机 + 双套测试；旧组跑完后仍要迁移 |
| **B（推荐）** | 载入时遇无 `schema` 的组 → 直接丢弃（等价 `abandonImmediate()`），`stats.skipped += n`，组内词原样留在未学池 | 用户丢掉这半组进度（**零数据损失**：v1.1 列表阶段不建卡、不 commit，词还在 `unlearned`，下次列表重新出现）；代码 ~3 行 |

推荐 B：这是**一次性升级路径**，为它永久养一条旧状态机不划算；而「丢掉半组」的成本与用户中途退出一次完全相同，本来就是已接受的行为（`abandonImmediate` 注释）。

**无论 A/B，都写死**：不做字段迁移、不猜测旧字段含义、不清洗 `loopCount` 到 `fuzzyCount`。

---

## 7. 文案与 UI（最小面，不新增 CSS 类）

| 位置 | 改动 |
|---|---|
| `SessionScreen.tsx` 即时复习相 | 删除组件内 `hardSet`，硬词以 `group.hardWords` 为唯一来源（顺带修掉「刷新后硬词标记丢失」）；`finished` 时 `commitNewWords(group.words, day, group.hardWords)` |
| 同上 | 轮次推进 toast（复用现有 `.session-toast`）：`第 2 轮 · 还有 3 个词` |
| 同上 | 跨轮 toast：`本轮不再出现，下一轮再见`；进错词本 toast：`已记入错词本`（二者同时发生时，后者优先，用一条含两句的文案） |
| `SessionScreen.tsx` 总结页 | `hardTotal > 0` 文案改为：`即时复习转满 5 轮仍没点「认识」的词已标成硬词；复习里不认识的词回到明天的 1 天批次，硬词和错词置顶。明天见。` |
| `copy.ts:39` | 帮助文案改为：`即时复习是学新词时每攒够 10 个当场过一遍。第 1 轮把整组过一遍：点「认识」出队；点「模糊」的词本轮再出现一次，还模糊就等下一轮。下一轮只考上一轮模糊过的词，最多 5 轮。同一个词累计模糊 3 次会记进错词本，但仍要考到点「认识」才算过关。即时复习不算正式成绩，中途退出也不欠账。` |
| `MistakesScreen.tsx:4/180` | 「即时复习里同一个词连问 3 次仍不认识」→「即时复习里累计模糊 3 次」 |
| `types.ts:39`、`immediate.ts` 头注释 | 按新语义重写 |

**约束**：新增文案的中文 >4 字处一律 ≥14px（复用现有类，本身已满足）；不新增选择器，因此**不需要跑 8 皮肤 × 2 主题的样式回归**，只跑 `scan-tiny` + `audit-phases` 即可。

---

## 8. 统计口径变更

| 指标 | 旧 | 新 |
|---|---|---|
| `immediate.stats.groups` | 每会话 +1 | 每会话 +1（不变） |
| `immediate.stats.cards` | `words.length` | 不变 |
| `immediate.stats.loops` | 组内 `loopCount` 求和 | `Σ fuzzyCount`（每个模糊事件 +1） |
| `immediate.lastAvgLoops` | `loops / cards` | 公式不变，**数值含义变为「平均每词模糊次数」**，历史不可比（报告里注明） |
| `record.immediate.loops` | 同上 | 同上 |

**`demo:scheduler` / `bench:scheduler` 不受影响**（不经过即时复习路径）。

---

## 9. 回归矩阵

### 9.1 纯函数单测（`scripts/test-scheduler.ts` 新增 §13，接在 §12 后）

| 编号 | 断言 |
|---|---|
| 13.1 | 首轮模糊一次 → 回队尾，本轮内再出现一次（队尾位置） |
| 13.2 | 本轮第 2 次模糊 → 不回队尾、进 crossRound、本轮不再出现 |
| 13.3 | 本轮无模糊 → `finished=true`、`hardWords=[]` |
| 13.4 | 跨轮：`round=2`、`queue === 上轮 crossRound`（保序）、`fuzzyThisRound=[]` |
| 13.5 | 累计 1、2 次模糊 → `mistakes` 无条目、`thresholdCrossed=false` |
| 13.6a | 【前置】`fuzzyCount[w]=2` 且 `fuzzyThisRound` **不含** w（本轮首次遇到它）→ 点模糊（累计第 3 次）→ `mistakes[w].count=3`、`source='immediate'`、`thresholdCrossed=true`、**`queue` 仍含 w（回队尾）**、`crossRound` 不含 w |
| 13.6b | 【前置】`fuzzyCount[w]=2` 且 `fuzzyThisRound` **含** w（本轮第 2 次遇到它）→ 点模糊（累计第 3 次）→ `mistakes[w].count=3`、`thresholdCrossed=true`、**`queue` 不含 w**、`crossRound` 含 w |
| 13.7 | 第 4 次模糊 → `count=4`（每次 +1） |
| 13.8 | 「认识」出队后账本**不**清（即时复习的认识不清账，只有正式复习/单测答对才移出） |
| 13.9 | 5 轮上限：每轮都模糊 → 第 5 轮结束 `finished=true`（强制）、残留词进 `hardWords` |
| 13.10 | 入库：`cards[w].hard` 按 `hardWords`、`inMistakes=true`（bug 1）、`lastRating=null`、`lapses=0` |
| 13.11 | 旧组兼容：按 §6 选定方案断言（B：载入后 `active=null`、词仍在 `unlearned`） |
| 13.12 | 跨学习日作废：`expireStaleImmediate` 仍丢弃整组、不继承轮次 |
| 13.13 | `stats.loops === Σ fuzzyCount`；`stats.groups` 不因轮数重复计数 |
| 13.14 | 第 3 次只记一次 3、不重复记（3→4 时 +1，不 +3） |
| 13.15 | 长期档 fuzzy：按 D2 选定方案断言账本与 flag 一致 |
| 13.16 | 不变量 1–8 逐条断言（§2.4） |

### 9.2 端到端链（隔离 context，`scripts/audit-immediate-rounds.js` 新增）

链路（一条跑完，不能只测单点）：

```
10 词列表 → 下一批 → 即时复习
 → w1 模糊 ×1（回队尾）→ ×2（跨轮，toast）
 → 其余全认识 → 第 2 轮（toast「第 2 轮 · 还有 1 个词」）
 → w1 模糊（累计 3，toast「已记入错词本」，DOM 断言错词本入口数字 +1）
 → w1 认识 → 收口 → 总结页
 → 断言双键：mistakes[w1].count=3、cards[w1].inMistakes=true、cards[w1].hard=false、
   immediate.active=null、stats.groups +1、stats.loops=3
 → 逐字节还原双键 → 校验 restored
```

**数据隔离（硬要求）**：
1. 独立 context（Playwright 新建 profile，不继承真实档案）；
2. 双键快照-还原（`cijian.v1` + `cijian.scheduler.v1`），跑前跑后 SHA256 必须相等；
3. 跑完删 `__bak_*` / `__p_*`；scrub 不写 `lastAvgLoops`；
4. 报告落盘 `docs/evidence/immediate-rounds-2026-11-26.json`，含两个 SHA256。

**量具自证伪**：脚本带 `--selfcheck` 模式，故意把期望值写成错的（例如期望 `enteredMistakes=false`），必须退出码非 0。一次没红过的检查不算检查。

### 9.3 验收口径（全绿才算完成）

- `node scripts/test-scheduler.ts` 全过（含 §13）
- `node node_modules/typescript/bin/tsc --noEmit` 0 错
- `node node_modules/vite/bin/vite.js build` 过
- E2E 报告 0 失败 + `--selfcheck` 能红
- `scan-tiny` 0（新文案）
- `audit-phases` 的 immediate/done 两相 DOM 检查照旧 0 失败
- 真实档案 SHA256 跑前后相同（**双键**）

---

## 10. 改动清单（文件级）

| 文件 | 改动 |
|---|---|
| `src/lib/scheduler/types.ts` | `ImmediateGroup` 新字段；`ImmediateAnswerResult` 注释 |
| `src/lib/scheduler/immediate.ts` | 重写状态机（~90 行，纯函数） |
| `src/lib/scheduler/engine.ts` | `answerImmediate` 按 `mistakeIncrement` 记账；`commitNewWords` 补 `inMistakes`；`learnNewWord` 同补 |
| `src/lib/scheduler/cards.ts` | 长期档 `fuzzy` 的 `inMistakes`（D2） |
| `src/lib/scheduler/storage.ts` | `readGroup` schema 校验 + 新字段清洗 |
| `src/components/SessionScreen.tsx` | 硬词读 `group.hardWords`、轮次 toast、总结页文案 |
| `src/lib/scheduler/copy.ts` | 帮助文案 |
| `src/components/MistakesScreen.tsx` | 说明文案 |
| `scripts/test-scheduler.ts` | §13 单测 |
| `scripts/audit-immediate-rounds.js` | E2E（新） |

**不改**：皮肤 CSS、`app.css`、`audit-screens.js`、`audit-skins.js`、`docs/screenshots/`。

---

## 11. 已知代价（接受才开工）

1. **中途退出 = 计数清零**：2 次模糊后退出，下次重新从 0 计。理论上可「刷掉」第 3 次。这是「跨会话不累计」的直接后果（你补的第 1 条）。
2. **同词最多被问 10 次**（5 轮 × 每轮 2 次）：**已定不加单词级上限**（你的原话「直到全部点认识」，5 轮已是妥协；用户随时可点「认识」放弃，接受）。当前 UI 不显示 `loops`，所以也不需要「已模糊 N 次」提示。
3. **`lastAvgLoops` 历史不可比**：口径从「组内循环次数」变成「累计模糊次数」，数值会变大。
4. **`hard` 语义收窄**：不再由「3 次模糊」触发，只由「强制收口时仍未认识」触发。老用户卡片上已有的 `hard=true` 不受影响（只在正式复习答对时清除）；但新会话不再产生大量 hard。

---

## 12. 决策记录

| 编号 | 决定 | 落点 |
|---|---|---|
| **D1** | **不加**单词级上限。5 轮已是妥协；同词最多 10 次属极端情况，用户随时可点「认识」放弃 | §11.2、§9.1 13.9 |
| **D2** | **A**：长期档「模糊」**不进**错词本，修掉 flag 与账本自相矛盾；历史 flag 不追溯 | §5.2、§9.1 13.15 |
| **D3** | **B**：升级时旧组直接丢弃，零数据损失、不养双状态机；丢弃数记 `stats.skipped`，报告中单列 | §6、§9.1 13.11 |

**唯一待你确认的一处偏离**：§3.4 的 `round=5` 边缘态，我没按「3 行完成强制收口」写，因为 `active=null` 后没有 commit 路径，`hardWords` 落不到卡片上——写规约时改成「丢弃该组 + 注释标明不可达」。若你坚持要能恢复标记，我改回「回填 queue、round 保持 5」，代价是该词总次数变 11（与 D1 冲突）。

---

## 13. Commit 计划

**单个 commit**，不混皮肤/审计改动：

```
fix(immediate): 即时复习改轮次模型（模糊=本轮重考一次、跨轮累计、5 轮上限）

- 状态机：ImmediateGroup 改 schema 2（round/fuzzyThisRound/crossRound/fuzzyCount/hardWords），
  删除 loopCount；模糊=本轮再出现一次→跨轮；3 次累计进错词本但不出队
- 修 inMistakes 时序：commitNewWords 建卡后按账本回填镜像（hard=true 但 inMistakes=false 的坑）
- 修长期档 fuzzy 账本与 flag 不一致（flag 不再强制 true，只有 unknown 记账）
- 兼容：旧 schema 组按弃组处理（词回未学池，零数据损失），不迁移字段
- 回归：§13 单测 17 条（含 13.6a/13.6b）+ 隔离 context E2E 全链 + 双键 SHA256 证据
```

证据链写进 commit body：`test-scheduler` 全过、`tsc` 0、`build` 过、E2E JSON 路径、双键 SHA256、`--selfcheck` 能红。
