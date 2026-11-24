# REFACTOR_PLAN · 统一学习流（v1.1）

> 状态：规约（实现前定稿）。用户 2026-11-24 口头需求的形式化。
> 原则：**保留现有视觉外观**，只重构状态机与数据流转；内核旧 API 一律不删（测试 67 处依赖）。

## 0. 现状问题

| # | 问题 | 根因 |
|---|------|------|
| 1 | 首页有割裂感：大按钮走「整本词库 481 批」老浏览线，TodayCard 两个按钮走调度线 | `App.tsx` 的 `studying` 与 `session` 双轨并存，互不相干 |
| 2 | 批次切分与今日额度无关 | `chunk(book.words, batchSize)`，不是 `nextNewWords(allowed)` |
| 3 | 新词单卡「记住了，下一个」，不是列表形态 | `SessionScreen` phase `'newword'` 用 flash 卡 |
| 4 | **学一个词立刻入库建卡**，即时复习没清空也算已学；中途退出不回滚 | `engine.learnNewWord()` 建卡 + 进 pendingWords |
| 5 | 即时复习有「跳过」第三键 | 用户新规则：只允许【认识】【模糊】两键（2026-11-24 修订：原【不认识】改名【模糊】，逻辑不变） |

## 1. 统一状态机（SessionScreen 重写）

```
点【开始背单词】（唯一入口）
  └─ snapshot: plan = engine.plan(); reviewQ = buildReviewQueue(plan)
     ├─ reviewQ 非空 ──► phase 'review'（单卡三键，现有逻辑不动）
     │                    └─ 全部答完 ──► newQ = engine.nextNewWords(allowed)
     │                                    ├─ 非空 ──► phase 'list'（无缝）
     │                                    └─ 空   ──► phase 'done'
     └─ reviewQ 为空 ───► 同上直接进 'list' / 'done'

phase 'list'（图二形态，词 = newQ 按 batchSize 切批，尾巴算完整一批）
  状态: committedCount(已入库数) · batchIdx(当前批) · batchCount
  pending = newQ.slice(committedCount, endOfBatch(batchIdx))
  【下一批】点击：
    if pending.length ≥ 10 或（已是末批 且 pending > 0）
        ──► engine.startImmediateWith(pending) ──► phase 'immediate'
    else if batchIdx+1 < batchCount ──► batchIdx+1（翻页，revealed 重置）
  【上一批】自由回看（不影响 pending；回看不产生任何状态）
  退出（顶栏返回）：什么都不落库 ──► 首页。下次从第 1 批重新看。

phase 'immediate'（单卡两键，居中版式：单词正中→音标→释义，字号随视口自适应；2026-11-24 修订，原「只给英文+音标不渲染释义」）
  【认识】出队；【模糊】回队尾，同词最多 3 次，第 3 次标 hard 放过
  队列清空 ──► engine.commitNewWords(group.words, hard) ──► 入库
    ├─ 还有下一批 ──► phase 'list'（batchIdx+1，解锁）
    └─ 末批已清   ──► phase 'done'
  退出（顶栏返回）：engine.abandonImmediate() 丢弃整组 ──► 首页（这组词没入库）

phase 'done' 总结页：复习 X（认识/模糊/不认识）· 新词入库 Y · 硬词 Z ──► 返回首页
```

### 替用户拍板的两个决定
1. **尾巴不足 10 也弹即时复习**（组大小=剩余 pending）。理由：状态机无特例；尾巴词同样要考、同样「清空才入库」；否则这 9 个词零测试零判定。
2. **即时复习没有「跳过」键**（按用户明说的两键）。想停下只能退出，退出=这组未入库。`skipImmediate` 内核保留（老状态字段 `skippedImmediate` 仍存在），新流程不再产生。

### 批大小与触发阈值
- 批大小 = `profile.batchSize`（默认 5，可选 5/8/10/15/20，设置页保留）。
- 触发阈值 = 累计 pending ≥ `IMMEDIATE_TRIGGER`(10)，**组=全部 pending**（不为凑 10 拆碎批次；8 词/批时第一组是 16 个，符合内核既有设计「组大小跟着累计结果走」）。

## 2. 内核新增 API（engine.ts，旧 API 不动）

```ts
/** 新流程：用指定词开即时复习组（词必须未入库、在池、去重非空）。先 expireStaleImmediate。 */
startImmediateWith(words: string[], day = today()): ImmediateGroup | null

/** 新流程：即时复习组清空后批量入库。逐词校验（在池且无卡），建卡、进 newLearned；
 *  hardWords 打 card.hard；不做 allowance 复验（额度在拍列表快照时已定，闸在复习清空后已开）。 */
commitNewWords(words: string[], day = today(), hardWords: string[] = []):
  { committed: string[]; rejected: string[] }

/** 新流程：丢弃当前即时复习组（退出场景）。词未入库，无需打 skipped 标记。 */
abandonImmediate(): string[]   // 返回被丢弃的词
```

- `answerImmediate` 天然兼容未入库词：hard 分支 `card.hard=true` 有 `if (card)` 保护；`recordMistake` 与卡片解耦（错词本仍记 3 次）。**答错后退出，错词本记录保留**（事实），词本身不入库。
- `learnNewWord` / `startImmediate` / `skipImmediate` / `expireStaleImmediate` 原样保留（老测试 + 兼容）。

## 3. UI 改动清单（视觉不动，数据源/入口动）

| 文件 | 改动 |
|------|------|
| `App.tsx` | 删 `studying` 双轨：大按钮 → `setSession(true)`（统一 Session）；删老列表 effect（seen 记录、键盘翻批、goTo、changeBatchSize 的 batchIndex 换算）；`session` 类型改 boolean |
| `StudyScreen.tsx` | 删 `studying` 分支（列表挪进 Session）；首页 topbar/hero/spec/readouts 数字改读调度：今日新词 `plan.allowedNewWords`、今日批次 `ceil(allowed/batchSize)`、已学 = stats 卡数合计（不再读 `progress.seen/batchIndex`）；lede 文案对齐新流程 |
| `TodayCard.tsx` | 删两个动作按钮（纯展示）；保留错词本 / 学习日历链接 |
| `SessionScreen.tsx` | 重写为 §1 状态机；`list` 阶段复用 `WordRow`+`ControlDock`+`.session/.word-list` 样式；`immediate` 阶段 flash 卡居中版式（`flash-card--centered`，释义直显不遮蔽）、两键 dock；末批「下一批」文案=「看完收尾」；`nextNewWords` 快照在复习清空后重拍 |
| `CalendarScreen.tsx` | 两个按钮合并为一个「开始背单词」（统一入口，复习优先由 Session 内部保证） |
| `ProfileScreen.tsx` | 「每批单词数」hint 文案微调（现在是今日新词的列表批大小） |
| `ControlDock.tsx` | 加 `nextLabel?: string`（默认「下一批」） |
| `storage.ts` / `cijian.v1` | `progress.batchIndex/seen` 保留不读不删（不迁移、不清洗） |

### 跨天守卫
Session 进行中学习日翻转（`engine.today() !== plan.day`）：toast「学习日已切换」→ 强制退出 Session 回首页。列表/即时阶段每个动作前检查。

## 4. 测试与验收

- `test-scheduler.ts` 新增 §11：startImmediateWith 校验（未入库词、重复词、空）、两键循环 3 次 hard、commitNewWords 入库+hard+newLearned、abandon 后词仍在池、19 词全流程模拟（5/5/5/4 → 组10 → 组9 → 入库 19）、中途退出零入库。
- 旧测试全量回归不动（老 API 语义未变）；`demo:scheduler` 弧线允许因入库口径变化而说明差异。
- `tsc --noEmit` / `vite build` / `test:books` / `test:csv` / `bench:scheduler` 全绿。
- 浏览器实测（dev + 生产 preview）：fixture 造「8 到期复习 + 19 新词额度」→ 走完整状态机：复习 8 张 → 列表 5/5/5/4 → 第 2 批末弹 10 词组 → 清空入库 → 末批弹 9 词组 → 总结页；中途退出场景 ×3（列表阶段退、即时阶段退、复习阶段退）验证入库口径。
- design-review：360/768/1440 × 4 皮肤抽查 list/immediate/done 三态（重点：dock 不压最后一行、两键 dock 布局、总结页）。

## 5. 风险与对策

| 风险 | 对策 |
|------|------|
| 列表阶段不入库 → 用户「看了但没 commit」第二天重复出现 | 这是**需求本身**（重看列表）；today 卡片数字不变（没入库就不该算） |
| 复习清空后 `nextNewWords` 重拍与首页数字不一致 | 同一 `plan()` 数据源；重拍只是等闸开 |
| commit 时词已不在池（被逾期清扫等极端情况） | `commitNewWords` 逐词校验，rejected 返回并 toast 提示，不整组失败 |
| 老用户 `immediate.active` 残留半组 | Session 启动即 `expireStaleImmediate`；新组走 `startImmediateWith` 不碰 pendingWords |
| 生产 preview 的 SW 缓存 | 验证时先 Ctrl+F5 / 清 caches（NOTES 老坑 2） |

## 6. 日历格子的信息层级（v1.2 · 真机反馈修复）

**问题**：学完 20 个新词的当天打开日历，明天那格里「复习 20 词」只藏在灰色批次小字
（`1天前 · 11月24日 · 20 词`）里，而同格的「新词 20」是显眼标签；头部右侧又挂着无标签的
`0 / 20`——读起来像「明天要复习 0 个、还能学 20 个新词」。视觉层级把结论说反了。

**口径**（写死，以后改日历 UI 先照这段核对）：

1. 每格新增**负荷行** `.cal-day__load`，槽位顺序恒定：`复习 N 词` → `新词 M 词`（有长期批次才追加 `长期 K 词`；有逾期追加 `逾期 X 词`）。原来散在 `__foot` 的三类计数全部挪进这一行，一格里「今天要干几件事」只看一行。
2. 复习是当天的主任务 → 负荷行里最重（≥13px + 600 字重 + accent 描边与实心圆点）；新词降为中性描边次级标签。**层级靠尺寸与字重，颜色只作辅助编码**（去掉颜色仍可读——`emil-design-eng` 反模式「只用颜色表示状态」）。
3. **完成度只属于今天和过去**，且必须带标签写在复习槽内（`复习 12/20`）；未来日（`estimated`）一律不显示完成度，只报计划总量。裸分数 `0 / 20` 那个元素整个删掉。
4. 复习为零也**占位显示** `复习 —`（显式零，不留空格，七格竖扫时槽位对齐），并配一行短说明：今天/过去=「没有到期复习」，未来=「还没排上复习——要等前面的复习做完才排得出后面的」。
5. 批次明细降级为**来源小字**（12px `--text-tertiary`），只回答「这些词是哪一天学的」，不再承担显示复习量的职责。
6. 「接下来 7 天」标题旁加 `?` 气泡（复用设置页 `.hint` 组件：外点 / Esc / 滚动 / resize 关闭、44px 透明热区、`aria-expanded` + `aria-controls`），文案在 `copy.ts` 的 `CALENDAR_FORECAST_EXPLAIN_*`：排期随每天作答动态调整，日历只展示当前已确定的部分。
7. `?` 组件从 `ProfileScreen` 抽成 `src/components/Hint.tsx` 共用，两处行为必须一致（只有一份实现的份上）。

**数据源不变**：复习量 = `CalendarDay.dueTotal`（短期，历史日读快照）、长期 = `longTermBatches`、
新词 = `newWordPlan`、逾期 = `overdue`、预估 = `estimated`。UI 层零加减、零推断。

