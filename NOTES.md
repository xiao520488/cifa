# NOTES

## 2026-11-24 · 收尾：统一学习流重构（v1.1）完成，实测 + design-review 已闭环

- **交付**：按用户口径重构核心流程——「开始背单词」大按钮成为唯一学习入口；旧的「整本词库按批浏览」双轨（图二 481 批）已删，
  列表形态挪进统一 Session，切分改为**今日发放额度按批大小切**（19 词 → 5/5/5/4，尾巴算完整一批）。规约在 `REFACTOR_PLAN.md`。
- **状态机**（`SessionScreen.tsx` 重写）：`review`（三键，复习/逾期强制先行）→ 无缝进 `list`（平铺列表 + 遮蔽切换 + 用户自己点下一批）
  → 攒满 10 个（或末批看完还有没考的）**强制弹** `immediate`（两键、只给英文+音标、不认识回队尾最多 3 次标 hard）
  → 组清空才 `commitNewWords` 入库并解锁下一批 → 全部完成进 `done` 总结页。
- **完成判定口径（最重要）**：列表阶段**零落库**——中途退出下次从第 1 批重看；唯一入库点是即时复习组清空后的 `commitNewWords`。
  复习作答仍逐词落库（既有语义）。错词本在即时复习答错时就记（事实记录），与入库解耦。
- **替用户拍板**：① 尾巴不足 10 也弹一组（状态机无特例，尾巴同样要考）；② 即时复习**没有跳过键**（用户明说两键），想停只能退出；
  ③ 「重置学习进度」入口删了——它原来只清旧浏览 progress（v1.1 后不再展示），按钮语义断了；「清调度状态重新开始」是另一个功能，**待用户要再做**。
- **内核**：`engine.ts` 新增 `startImmediateWith(words)`（未入库词开组）、`commitNewWords(words, day, hardWords)`（唯一落库点，非法词进
  rejected 不整组失败）、`abandonImmediate()`（退组零入库）。旧 API 一律没动——`test-scheduler.ts` 老 67 处调用与 181 项断言、demo 40 天弧线、
  bench 全部原样通过；新增 §11.1–11.7（校验/两键循环/入库判定/退出零状态/19 词全流程/跨天作废/预览不消费）。
- **改动面**：`App.tsx`（删 studying/seen 记录/键盘翻批双轨，首页数字改读调度）、`StudyScreen.tsx`（只剩首页）、
  `TodayCard.tsx`（删两个动作按钮，纯展示）、`CalendarScreen.tsx`（两按钮合并为统一入口）、`ProfileScreen.tsx`（learnedCount 改卡库数）、
  `ControlDock.tsx`（+nextLabel，末批「看完收尾」）。`cijian.v1` 的 `progress.seen/batchIndex` 保留不读不删。
- **已验证**：`tsc --noEmit` 0 错；`vite build` 过（主 chunk 321.6KB / gzip 101KB，CSS gzip 15.6KB，词库仍独立 chunk）；
  `test:scheduler` 全过（含 §11）；`test:books` / `test:csv` 全过；`demo:scheduler` 弧线未变；`bench:scheduler` 全 <50ms。
  **浏览器端到端实测**（fixture「8 张今日到期 + 19 词未学池」，dev 5173）：复习优先→无缝进列表 5/5/5/4→第 2 批「下一批」弹 10 词组→
  清空入库（cards 8→18、pool 19→9）并自动解锁第 3 批→末批按钮变「看完收尾」→尾巴 9 词组→总结页「入库 19」→首页数字一致；
  三个退出场景（列表退 / 即时退 / 复习中途退）全部**零入库**、重进从第 1 批重看；硬词路径：t8 连错 3 → hard 放过 →
  卡 `hard:true`、错词本 count=3 source=immediate、组照常清空入库。
  **design-review v6**：list/immediate/done 各 24 组（4 肤 × 明暗 × 3 视口）真实 DOM 量，首轮 immediate 8 组 FAIL（对比度，见下条坑 3），
  修复后回归 0 失败；报告 `DESIGN_REVIEW.md` v6，截图 `docs/screenshots/v6/`（6 张：home/list-360/list-1440/immediate-360/done-360/done-768）。
- **坑**：① `commitNewWords` 不复验 allowance（额度在拍列表快照时已定、复习闸在进列表前已清）——别给它加闸，加了会把考完的词拒之门外；
  ② 测试里断言 days 字段前先 `plan()`/`ensureDay()`，新流程列表阶段不建当天记录（§11.4 就栽在这）；
  ③ **皮肤 token 审查顺带修的三处**：broadsheet 深色块漏了 `--danger`（浅色近黑 #14140f 沿用→1.38:1，补 #e8836f）、
  foundry 深色 danger #ff4a21→#ff6a45、foundry 浅色 accent #d93a16→#cf3714（白字 4.46→5.5:1）——以后动答案键颜色先跑 24 组；
  ④ 浏览器脚本按文案找按钮**必须精确匹配**：`textContent.includes('认识')` 会先命中「不认识」，我因此误判过一次「队列无限循环」；
  ⑤ dev 下 `/vite.svg` 不存在会被 SPA fallback 成 index.html——fixture 要写到真静态页 `/icon.svg`，且该导航 load 必超时（预期，忽略）。
- **下一步**：用户真机跑几天验收遗忘曲线与完成判定；过了打 tag `v1.1.0-beta.1`。dev job `pwsh-6d628cb48fd046cf`（5173）还开着；
  preview(4173) 未重启，真机联调前记得 `vite preview` + SW 缓存老坑。

## 2026-11-24 · 收尾：v1.0.0-beta 已打 tag，进入待机维护

- **版本**：`git init` 后首次提交 `fc4a862`，tag **v1.0.0-beta**（标注「完整词库 + 学习调度 + 错词本」）。
  仓库是本地的，没有 remote；`.gitattributes` 已把文本统一成 LF（本机 git 默认 autocrlf 会把 LF 换成 CRLF，
  会让 `Get-Content` 数行数这类老坑更乱）。`node_modules/ dist/ .tmp-vocab/` 都没进库。
- **服务器**：dev `http://127.0.0.1:5173`（后台 job `pwsh-2902091d6cc541b3`）、生产 preview
  `http://127.0.0.1:4173`（`pwsh-98e14d9f2d674910`）。两个都在跑，随时刷新可用；dev 改了代码会热更新，
  改完 `vite.config` / 依赖才需要重启。
- **用户拍板**：① 词频 / 考试标签**只留在数据层，不上 UI**（一屏 5 词已经很紧凑）；② 词条详情页（全义项、例句）**先不做**，
  1–2 条释义够支撑「快速过词」。→ `TODO.md` §5 里两项遗留保持「不做」，别自作主张加角标。
- **接下来**：用户要自己导 200 个专业词真实跑几天，验遗忘曲线和错词本。待机期间按「报 Bug → 修 → 回归」节奏走，
  改完记得更新 tag 前缀或打新 tag（`v1.0.0-beta.2`）。
- **给用户的导入说明**：`docs/IMPORT_WORDS.md`（浏览器 5 步 + 行格式 + 四个坑）。自定义词表走导入，不要手改 `src/data/*.json`。

## 2026-11-24 · 收尾：内置词库换成 ECDICT 完整词表（270 → 17,724 词）

- **交付**：四本内置词库改为从 **ECDICT 1.0.28** 的 `ecdict.csv` 生成——高中 3,671 / 四级 3,846 / 六级 5,406 / 考研 4,801，
  字段 `w/ph/m/r/x`（单词 / 音标 / 1–2 条释义 / 词频名次 / 考试标签位掩码）。流程与清洗规则写在 `docs/VOCAB_DATA.md`。
  新增 `scripts/build-books.ts`（生成）、`scripts/lib/ecdict.ts`（纯函数）、`scripts/test-books.ts`（校验）、
  `scripts/audit-vocab.js`（24 组多视口自动审查）；`npm run build:books / test:books` 已进 package.json。
- **词库按需加载**：四本合计 1.8MB 原始 / 630KB gzip，全部进主 chunk 会让首屏多背 600KB。改成 `import()` 一阶段一本
  （`src/lib/books.ts`），主 chunk 仍是 100KB gzip，首屏只多 130–199KB；`src/data/books.json` 存词数给阶段列表用。
  **换阶段现在是异步的**：`preloadBook()` 到齐后才切 `stage`，连点用 token 防串。
- **坑 1 · 启动必须等书到齐**：`App` 挂载前要 `await preloadBook(当前阶段)`（`main.tsx` 的 `<Boot/>`）。词库没到就挂载，
  调度引擎会 `seed([])` 把当天「新词计划」结算成 0 并落盘——修不回来，只能等第二天。换阶段同理，绝不能先切 stage 再加载。
  加载失败（离线且没缓存）时 Boot 停在「词库没有加载出来 + 重新加载」页，**不挂载 App**；实测这时 `cijian.scheduler.v1` 一个字节都没写。
- **坑 2 · ECDICT 音标是伪 IPA**：西里尔 `ә`=`ə`、`є`=`e`、`:`=`ː`、`'`=`ˈ`、`,`=次重音、`.` 是次重音或两个读音的分隔、
  `ɒː`=`ɔː`、`əː`=`ɜː`、`^`=坏掉的 `/g/`。不翻译会显示成乱码；第一版漏了「词首 `.`」，覆盖率卡在 94%，补齐到 98.7–99.8%。
- **坑 3 · 释义必须为 5 词同屏收敛**：真实词典释义很长（`in` 有 6 个 prep 义项），照搬一屏放不下 5 个词。
  规则：`[网络]` 整条丢；`[医][计]` 这类领域释义**只在没有常规释义时才用**（否则 `it` 的第二义会变成「信息论；输入终端」）；
  vt/vi 合并成 v.；每条最多 3 个近义块、首条 ≤15 字、次条 ≤12 字、最多 2 条。
- **坑 4 · 功能词押后，否则第一屏是 the/be/and**：按词频排序时每本书头三批全是语法词。现在把纯功能词（the/be/and/of/which/would…）
  整体挪到队尾（不删除，词表要完整），判断刻意保守——`might`(力量) / `will`(意志) / `can`(罐头) 不算。四级首屏现在是
  government / system / state / might / part。
- **坑 5 · foundry 报头小字（v4 遗留）**：`阶段 · 第 n 批 · N 词` 挤在品牌旁 158px 里折成 2–3 行，顶栏变高把版心推下去。
  ≤480px 只留「第 n / N 批」（阶段与词数工单表里有），16px 单行。
- **兼容老状态**：卡片按单词字符串存，词库换血后已学进度不丢；实测灌 fixture（含不在新词库里的词 + 归档词）→ 卡片保留、
  池子 = 新书 − 已学、当天 `newWordLimit` 不被重置。`seen`（浏览下标）会指向别的词，只是高亮，不影响调度。
- **验收**：`tsc --noEmit` 0 错；`vite build` 过（主 chunk 322KB / gzip 100.5KB，四本词库各自独立 chunk）；`test:books` / `test:csv` /
  `test:scheduler` 全过；`demo:scheduler` 与 `bench:scheduler` 未变；浏览器实测：dev 与 **生产 preview** 都只拉当前阶段那一本、
  换阶段再拉另一本、今日计划保持 20；design-review v5 走完（24 组 0 溢出 / 0 截断 / 0 小目标、5 词全见），报告在 `DESIGN_REVIEW.md`，
  截图 `docs/screenshots/v5/`（8 张）。
- **下一步**：词频/考试标签上界面（`Word.r` / `Word.x` 已有数据，`examTags()` 可解码）；全义项词条详情页（要重跑脚本加字段）；
  状态体积（5000 词池约 40KB，学满 365 天仍会逼近 5MB，压缩方案照旧待做）。

## 2026-11-24 · 收尾：错词本 + 上限默认 +5（P0-2 / P0-3 完成，已验收）

- **交付**：`MistakesScreen`（首页今日卡片 `错词本 N`、我的 → 学习进度、我的 → 每日新词同区三处入口；列表＝词/音标/释义/
  累计错次/最后答错日/下次复习，点行进「单测」）；`state.mistakes` 独立账本（`count/lastDay/source`），与卡片解耦，
  卡片被 7 天清扫后次数仍在；来源覆盖 正式复习不认识 / 即时复习连错 3 次（按 3 次计）/ 归档抽查 / 单测答错。
- **口径**：单测只回答「还记得吗」——答对移出、答错 +1，**不动 `due/interval`、不进正确率与完成率**；
  想重走周期请在正式批次里答。老状态按 `inMistakes + lapses + lastReviewed` 补一次账本。
- **上限默认 = 目标 +5**（`emptyState` / `setUserDailyGoal`），老状态在 `sanitizeScheduler()` 一次性迁移；
  **上限 0 不迁移**（那是主动暂停），`maxLimitPinned` 的也不动。兜底已验证：上限=目标时今天只发目标、基线不动，
  改回 30 当天仍是被截断的值，**次日**按基线恢复（`pendingLimit` 在 `setMaxLimit` 里会被 min 截断，老坑，见 §10 坑 3）。
- **文案**：`copy.ts` 新增 `newWordHeadline()`（奖励 `↑ +5` / 减量复用结算原因 / 暂停按 `blockedBy` 分五种：复习未完成、
  逾期过多、上限 0、已学完、词池空）+ `calendarNewWordTag()` + `MAX_LIMIT_EXPLAIN_*`。首页按钮文案复用同一句，
  不再出现「原因是复习没做完、按钮却写新词已暂停」。
- **坑 1 · 小字别用 accent**：`↑ +5` 角标与「错 N 次」徽标原来用 `--accent` 作 11px 文字，深色皮肤只有 2.8–3.2:1。
  改成 `color: var(--text)` + accent 描边后 11–12:1；四肤 × 明暗 8 组复测全过。
- **坑 2 · 气泡别用 absolute**：360 下 300px 气泡把右边界顶到 360。改 `position: fixed` + 点击时用 `getBoundingClientRect`
  夹取，再用 `useLayoutEffect` 量高度决定是否翻到上方；外部点击 / Esc / 滚动 / resize 都收起。
- **坑 3 · 即时复习「跳过」到底丢不丢词**：**不丢**——`skipImmediate()` 只打 `skippedImmediate`，卡的 `due` 还是明天，
  明天第一次 `plan()` 拍快照时按 1 天批次收进来并置顶。但「已经在明天的快照里排好队」这句话是错的：明天的快照今天不冻结。
  真正修掉的是中途退出留下的 `active` 半组（跨学习日自动作废、按 skipped 处理），否则新词进不了组。
- **坑 4 · 本机 shell 是 PowerShell 5.1 + 文件是 LF**：`Get-Content` 数行数会少（117 行报 48），默认按 GBK 读 UTF-8 会乱码；
  `.ps1` 被执行策略挡住，要 `powershell -NoProfile -ExecutionPolicy Bypass -File`。**文档一律用 read/edit 工具**，别用 cat/Get-Content。
- **验收**：`tsc --noEmit` 0 错；`vite build` 过（CSS 100.9KB / gzip 15.45KB，JS 341KB / gzip 108.8KB）；
  `test:scheduler` 新增 §10.1–10.9 全过；`test:csv` 全过；`bench` 仍全部 < 50ms；`demo:scheduler` 弧线**有意变化**
  （第 4 天按 +5 升 25、断签回来逾期 151 而非 126——这是奖励终于发得出来的结果，不是回归）；
  浏览器实测：360 下 4 肤 × 2 明暗无横向溢出、错词本进/出账本与单测、`?` 键盘可达 + Esc 关闭、E2E 学 10 词 → 连错 3 次 → 10 个硬词进账本。
- **审查**：design-review 走完，首轮 4 项 FAIL 全修完并回归（深色 accent 小字、`?` 热区、气泡出界、按钮文案与原因不一致），
  报告在 `DESIGN_REVIEW.md` v4，截图在 `docs/screenshots/v4/`（15 张：8 组皮肤 + 3 视口 + 键盘焦点 + E2E）。
- **一处刻意偏离（等你拍板）**：`allowed === 0` 且原因是「复习闸没开」时，我写「先复习完再学新词」，没用那句
  「今日新词已暂停（逾期过多或正确率偏低）」——那里正确率没问题，照抄会是假话。真正的 pause（计划 0 / 逾期 / 正确率）仍用原文。
- **下一步**：P2（其余页面皮肤覆盖、词表扩充、发音）；状态体积压缩方案仍待做（阈值 3MB、只压 30 天前统计快照）。
  错词本可以再加排序/筛选（现在固定「最后错的在前」）。

## 2026-11-24 · 收尾：错词本 + 设置文案改动（**已由上一条完成**，留作背景）

- **三条决定全部确认**：① 旧 `seen` 不迁移成卡片；② 种子池跟随当前词库重置；③ 状态瘦身**只压 30 天以前的统计计数**，
  绝不压单张卡的调度字段（`due` / `interval` / `longAnchor` / `longInterval`），且**体积 > 3MB 才触发**。
- **优先级调整**：错词本入口升 **P1 最高优**（答"不认识"进错词本却没有入口，用户会以为词丢了）；
  其他皮肤（foundry / instrument / broadsheet）的新页面覆盖降 **P2**，等主流程闭环。
- **开发环境**：本机没有 `pnpm`，一律 `node node_modules/typescript/bin/tsc --noEmit`、`node node_modules/vite/bin/vite.js build`；
  以后新增脚本要同步写进 `package.json`（或在 README 里写清 `node scripts/xxx.ts` 的跑法）。
- **待做清单已进 `TODO.md` P0-2 / P0-3**：错词本入口、`maxLimit` 默认改 `goal+5`、改名「每日新词上限」、`?` 说明气泡、
  首页/日历三态新词量（↑+5 / 减量原因 / 已暂停）、「上限=目标时仍只发目标且不动基线」的兜底。
- **坑 1 · 改默认值只对新状态生效**：老用户 `cijian.scheduler.v1` 里已经是 `maxLimit === userDailyGoal`
  （`setUserDailyGoal()` 在未 pin 时会同步把 `maxLimit` 设成目标值），光改 `emptyState()` 的话老账号永远拿不到 +5。
  需要在 `sanitizeScheduler()` 里做一次性迁移：`maxLimitPinned` 为 false 且 `maxLimit <= userDailyGoal` 时提到 `goal + 5`。
- **坑 2 · 跳过/中途退出不丢词，但有残留组**：`skipImmediate()` 把卡打 `skippedImmediate`，卡的 `due` 本来就是明天，
  明天 1 天批次靠 `prioritize()` 置顶——**注意明天的快照不是今天冻结的**（按 §8 设计，明天第一次 `plan()` 才拍），
  所以"已经在快照里排队"这个说法不成立，保证不丢的是卡片的 `due`。
  真正要修的是：中途退出即时复习组后 `immediate.active` 一直挂着，后面再攒满 10 个时 `startImmediate()` 会把旧组原样返回，
  新词进不了组。下一轮加一条"跨学习日的 active 组自动作废（打 skipped）"。

## 2026-11-24 · 调度接 UI（4 层全部接完）+ 接线前 8 点

- **交付**：`src/lib/scheduler/*` 内核补完（relearned 优先出池、`answer()` 跨批次 isRetry、`startOfSession()` 每次启动结算、
  日历 `newWordBlocked`/`longForecast`、空转日与上限文案，全在 `copy.ts`）；App 侧新增 `src/lib/deck.ts`、`src/hooks/useScheduler.ts`、
  `CalendarScreen` / `SessionScreen` / `TodayCard`，改了 `App.tsx` / `StudyScreen` / `ProfileScreen` / `app.css`。
- **验收全绿**：`tsc --noEmit` 0 错、`vite build` 通过（CSS 96.4KB / gzip 14.6KB，JS 329KB / gzip 105KB）、
  `pnpm test:scheduler` 全过（新增 9.1–9.8 共 40+ 条）、`demo:scheduler` 40 天弧线**逐行未变**（断签3天→逾期126→新词0→清30→
  暂停→11→16→20）、新增 `pnpm bench:scheduler`（5000 词 × 365 天：plan 最大 18ms、settle 最大 15ms，均 < 50ms）。
- **UI 顺序按你给的来**，每层都在浏览器里用真实数据验过：日期/逾期/闸门数字与 `plan()` 一一对应；三键作答后卡片档位、
  `accCount`、`doneToday` 都对；学新词到第 10 个准确触发即时复习（`stats.groups/cards/loops` 落库正确）；设置页把上限调到 0
  再调回 20，基线保持 20、当天计划仍是 0（正是 copy 里警告的行为）。
- **坑 1 · 未来日不能用复习闸算「现在可学」**：`done/due` 在未来恒为 `0/N`，于是每一格都写「因复习未完成，实际 0」——纯胡说。
  现在 `buildCalendar` 对历史日回填实际学到数、对未来日只报计划值（带「预估」标），只有「今天」才走三道闸。
- **坑 2 · 存盘有 400ms 防抖**：用脚本读 `localStorage` 验证时不等够 400ms 会读到上一个状态（我因此误判即时复习没生效），
  调试时先等 800ms 再断言。`pagehide` 会强制 flush——用浏览器灌 fixture 时必须先切到**同源非 App 页面**再写 storage，
  否则刷新瞬间被内存里的旧状态覆盖。
- **坑 3 · `setMaxLimit(0)` 会顺手截断 `pendingLimit`**：调回 20 后「今天」仍是 0，要等下一次结算才恢复（基线一直没动）。
  `allowance()` 的 `paused` 文案因此分两句：上限真是 0 / 只是今天的计划是 0。
- **坑 4 · 种子池 = 当前词库**：`useScheduler` 每次启动 `seed(当前 book)`，换阶段/导入会重置「未学池」，已学卡片不动。
  **旧版 `seen` 刻意不迁移成卡片**：那只是「翻到过」，一次性造几百张「明天到期」会把复习队列直接撑爆。
- **下一步**：状态体积（365 天 2.27MB 逼近 localStorage 5MB）压缩；错词本 UI（`inMistakes` 已有数据没有入口）；
  四套皮肤下新页面只验了 paper，foundry / instrument / broadsheet 的 `[data-skin]` 覆盖还没补。

## 2026-11-24 · 学习调度模块（v0.3 内核，未接 UI）

- 交付：`src/lib/scheduler/`（10 个纯 TS 文件，零 React 依赖）；需求原文 `docs/SCHEDULER_BRIEF.md`、契约 `SCHEDULER_SPEC.md`、用户文案 `STRATEGY_GUIDE.md`；测试 `pnpm test:scheduler`（181 项断言）、40 天模拟 `pnpm demo:scheduler`。状态存**独立 key** `cijian.scheduler.v1`，`cijian.v1` 一个字段没动。
- 已过：`tsc --noEmit` 0 错、`vite build` 通过、`demo exit 0`、`pnpm test:scheduler` 181 项断言全过；两轮红队（需求一致性审查 + 10 个脏场景黑盒）后修掉 6 处，最后一轮定向复验也过了（maxLimit 恢复、上限低于基线不加量、坏数据清洗、配额+force 守恒），明细见 `SCHEDULER_SPEC.md`。
- **核心语义别搞反**：`settle(昨天)` 算的是**今天**的新词量；`DailyPlan.newWordLimit` 是结算计划值，`allowedNewWords` 是「现在真的能学多少」（复习闸 / 逾期闸 / 配额之后），两个数故意可以不同。
- 5 个坑见下一条；下一步做 UI 接线，任务已写进 `TODO.md` P0-1。**没接 UI 就是没接**，别在别处宣称「App 已按遗忘曲线复习」。

## 2026-11-24 · 调度模块的 5 个坑（踩过，别踩回去）

**坑 1 · 完成率分母必须是快照**：如果按「当前还剩几个到期」算，答完一个分母就小一个，永远 100%，规则形同虚设。所以 `DayRecord` 在当天第一次 `plan()` 时把到期词表拍下来（`dueSnapshot`），之后作答只改分子。

**坑 2 · 未来日既不能拍快照、也不能清逾期**：`plan(明天)` 若落快照，今天新学的词会漏进明天的分母；若顺手扫逾期，会把还没到期该重学的卡提前打回新词池。判定：只有 `day === today()` 才 freeze + sweep。

**坑 3 · 空转日和断签日要分开处理**：空转（`dueTotal === 0`）不算优秀日——否则历史正确率替它兜底，躺三天白拿一次 +5；断签（有到期却零动作）不叠乘 `×0.8`——否则断 5 天基线归零、永久死锁。`catchUp` 补结算时必须直接给那些天打 `absent`，不能靠「有没有到期」推断（卡被清扫后那天看起来像空转）。

**坑 4 · 三个入口要有守卫**：同一天重复 `settle` 会重复加连击（→ 缓存 `settlement` 回放）；同一个词一天内连点三次「认识」能直接跳到 15 天档（→ `lastReviewed === day` 拒绝）；`learnNewWord` 不校验配额就能绕过「复习优先」和「逾期暂停」（→ 内部走 `computeWordBudget`，`{force:true}` 才是逃生门）。

**坑 5 · 上限只截断，不写回基线**：`setMaxLimit(0)` 再把上限调回 20，基线不能停在 0（用户会被永久关在门外）。`currentLimit` 不按 `maxLimit` 夹取，`newWordLimit = min(limit, maxLimit)`；上限低于基线时不做增量，标 `maintain` 而不是 `decrease`。

## 2026-11-24 · 收尾

- 交付：四套皮肤（paper / foundry / instrument / broadsheet）× 浅深两档，切换入口＝顶栏调色板按钮 + 我的 → 外观风格；原版「词典纸页」原样保留且为默认。
- 状态：`tsc --noEmit` 0 错、`vite build` 通过（CSS 87.09KB / gzip 13.15KB）、`scripts/test-csv.ts` 全过；24 组自动化核对（四肤 × 浅深 × 360/768/1440）0 阻塞项，明细见 `DESIGN_REVIEW.md` v2 + v2.1。
- 已按你要求删掉自测提示条 `.study-note`（四肤切换开关实测 0px 位移）；「可点揭示」不再有任何文字提示，这是刻意取舍，别再往回加。
- 下次开工先读本文件 + `TODO.md`；规约 `DESIGN_TOKENS.md`（v2 多皮肤）、样张 `design-lab/`（仅参照，可删）。
- 细节（实现方式 / 5 个坑）见下一条。

## 2026-11-24 · 四套皮肤（原版保留，可切换）

**结论**：界面从「一套风格」升级为 **4 套皮肤 × 2 明暗档**，原来那套「词典纸页」原样保留并作为默认（`paper`）。新增「铅字 foundry」「仪表 instrument」「词表报 broadsheet」。切换入口两处：顶栏调色板按钮（任何页面）+ 我的 → 外观风格。

**怎么实现的**：皮肤 = `<html data-skin>`；每份皮肤 CSS **用同名变量覆盖** `tokens.css`（`--bg/--text/--accent/--radius-*/--fs-*/…`），`app.css` 不动就自动换皮；`app.css` 表达不了的（斜条纹遮挡、刻度尺、双线报头、报尾工具条）才写组件覆盖，且一律以 `[data-skin="…"]` 开头。皮肤专属结构（读数块、工单表、报头、kicker）放在 `skin-hooks.css` 里默认 `display:none`，这是 paper 不被污染的关键。

**坑 1 · 别用 `dataset.skin` 手动改皮肤来截图**：React 的 effect 会在任何一次重挂载时把 `data-skin` 写回 `profile.skin`，浏览器里手改会被瞬间覆盖（尤其 HMR 之后）。要换皮肤就走 UI，或先写 `localStorage['cijian.v1'].profile.skin` 再 reload。

**坑 2 · 皮肤 CSS 写「:root」会污染所有皮肤**：token 覆盖必须写成 `[data-skin='x'] { … }`；`!important` 一律不用，靠选择器权重与加载顺序（app.css → fonts → hooks → skins）解决。

**坑 3 · 5 词同屏是硬指标**：三套新皮肤在 390×844 / 360×800 下都必须 5 行全见且不被 dock 压住。240 组自动核对（4 皮肤 × 3 视口 × 2 明暗 × 多状态）都过；paper 在 1440 需要滚一下才见第 5 行（原设计行为，非遮挡）。

**坑 4 · Vite 转换缓存会让新字段「不生效」**：改完 `skins.ts` 后浏览器里 `darkBg` 仍是 undefined，`fetch('/src/lib/skins.ts')` 拿到的仍是旧版。删 `node_modules/.vite` 重启 dev server 才恢复。以后遇到「源码对了但运行结果是旧的」，先清这层缓存。

**坑 5 · 自测提示条已删（2026-11-24）**：`已关闭中文 · 点按某一行可以单独查看` 这条 `.study-note` 会随开关出现/消失，导致整页词表上下位移。已从 DOM 和四份 CSS 里彻底移除，四肤切换中文开关的位移实测 0px。要不要给「可点揭示」另找不占位的提示方式（例如遮挡块里的小图标），等定了再说。

**待办/取舍**：宽视口 768/1440 下列表到 dock 仍有 95–270px 空档；foundry 控制条贴屏底（safe-area 待真机确认）；CSS 从 22.6KB 涨到 88KB（gzip 13.3KB），要省可改成按需加载。详见 `DESIGN_REVIEW.md` v2 的「建议修」。

**下一步开工**：读本文件 + `TODO.md`；规约看 `DESIGN_TOKENS.md`（v2 多皮肤）；样张在 `design-lab/`（可删，仅作参照）。

## 2026-11-23 23:55 · 收尾

- 首版已交付并验收：`pnpm build` 通过、词表解析 13 项测试全过、360/768/1440 × 浅/深审查无阻塞项。
- 跑起来：`pnpm dev`（5173）或 `pnpm preview`（4173，当前后台仍开着）。手机同 Wi-Fi：`pnpm dev --host 0.0.0.0`。
- 后续待办已全部搬进 `TODO.md`（P0 学习闭环 / P1 内容体验 / P2 产品化 / P3 质量），不再散落在对话里。
- 下次开工先读本文件 + `TODO.md`，规约看 `PRODUCT_SPEC.md` 与 `DESIGN_TOKENS.md`；本次不做上下文压缩。

## 2026-11-23 · 词笺（背单词 App）首版交付

**结论**：交付移动优先 PWA「词笺」，两页（背单词 / 我的）+ 导入与确认浮层。核心是「一批 = 一页纸」：默认 5 词同屏，英文 + 音标 + 释义；底部固定「中文 / 英文 / 上一批 / 下一批」，关中文后释义变墨条、可单行偷看。阶段决定释义详略（高中只看主义，四六级考研展开），可手动覆盖。四个内置词库共 270 词，支持 CSV/文本导入，全部数据存 localStorage。

**为什么这样定**：用户明确要「一屏 N 个词、可下滑、按阶段自适应释义、底部四个按钮」；市面 App 全是单卡全屏，批量浏览 + 遮挡自测是差异化点。视觉走「词典纸页」：暖白 / 暖黑、朱砂点睛、英文 Newsreader 自托管、无卡片堆叠。

**坑 1 · Vite watcher 崩溃**：编辑工具落盘时会在被监听目录生成 `.xxx.tmpdir/`，Node 26 的 fs.watch 触发 EBUSY 直接杀死 dev server。解法：`server.watch.ignored` 忽略 `**/*.tmpdir/**` 与 `**/*.tmp`（见 `vite.config.ts`）。

**坑 2 · Service Worker 旧 HTML**：cache-first 导航 + 不带 hash 的 `index.html`，重新构建后旧 HTML 指向已删除的 JS，整页白屏（MIME text/html）。解法：导航 network-first、资源 cache-first，缓存版本升到 `cijian-v2`；SW 注册仅在生产开启。

**坑 3 · 导入格式的分号二义性**：用户可能写 `n. 好处；v. 有益于`，也可能写 `v. 放弃；抛弃`。规则定为：ASCII `;` / `|` 分义项，中文 `；` 只在后面紧跟新词性（n./v./adj. …）时才二次切分；释义必须含中文，否则逐行报错。测试见 `scripts/test-csv.ts`（13 项）。

**坑 4 · 词库去重**：最初跨阶段去重，导致四级词表被高中词表「吃掉」19 个词。改成只在词库内部去重——真实考试词表本来就重叠，每个阶段必须自洽。

**坑 5 · pnpm 11 配置迁移**：`package.json` 的 `pnpm.onlyBuiltDependencies` 不再被读取，需放 `pnpm-workspace.yaml`；esbuild 的 postinstall 被忽略不影响 Vite 构建（只用 JS API）。

**已知取舍**：释义放在英文下一行（不是同一行接排），多义项更好读；若要「一行到底」的紧凑模式，作为下一步开关。目前没有 SRS 排程、发音、账号同步；存储已收口在 `src/lib/storage.ts`，加同步时只改这一层。

**下一步**：① FSRS/SM-2 排程（progress 增加 dueAt/stability，批次按到期队列生成）；② 完整 3500/5500 词表或词根词族数据；③ 发音（TTS 或音频）；④ 云端账号 + 多端同步；⑤ 一键部署（Vercel/Netlify）+ 真机安装测试。
