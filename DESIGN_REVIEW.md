# 词笺 · 交付前 Design Review

## v10 · 2026-11-25 · 五界面全站精修（bento / nocturne / desk / vinyl）+ 现有四套首页重排 + 全站中文排印提档

**范围**：用户选定 A=bento / C=nocturne / D=desk / F=vinyl，E=deck 作废（四处注册摘掉，CSS 存档 `docs/v8-variants/deck.v1.css`）。
四套入选皮肤从「只有首页」扩到**五个界面**（学习流 / 日历 / 错词本 / 我的 / 浮层）；现有四套（paper / foundry / instrument / broadsheet）**首页那句功能介绍随 DOM 真删**并重排；
另外修掉两个**基线级**缺陷（`.stepper` 被裁、`.hint__btn` 触控 18px）与一轮**全站中文小字系统性不达标**。
规约文件：`docs/SCREEN_SWEEP.md`。执行：8 路子代理各管一个 CSS 文件，浏览器与审计归我。

| # | 检查项 | 结果 | 证据 | 建议 |
|---|--------|------|------|------|
| 1 | 首页功能介绍已删（8 套一致） | PASS | 实测 `hasTitle:false / hasLede:false`；`grep start__(title\|lede) src/styles` 仅剩注释；未用伪元素补回 | — |
| 2 | 360 无横向滚动 / 截断 / 重叠 | PASS | 8 皮肤 × 5 界面 @360×640 = 40 组 `ovf:0 / nClip:0 / nOut:0` | — |
| 3 | 三档视口信息层级一致（非缩放） | PASS | 768 与 1440 各 32 组全过；desk 768 起真侧栏、bento 磁贴跨格、nocturne 目录行、vinyl 圆盘升档 | — |
| 4 | 五个界面都用了同一皮肤语言 | PASS | 每屏有可命名的结构动作（见 `docs/SCREEN_SWEEP.md` §3 + 下方必修 8 条） | — |
| 5 | 正文对比 ≥4.5:1、大字 ≥3:1 | PASS | 216 组 DOM 实算 `nLow:0`（按元素**真实叠色**算，含半透明叠加） | — |
| 6 | 深浅两档都清楚 | PASS | 390 档 8 皮肤 × 2 主题 × 7 界面 = 112 组 | — |
| 7 | 中文正文 ≥14px（>4 汉字） | 达标（硬线） | 硬 FAIL（<13px）从 **92 处 → 0**；剩 38 处 13px 是宽度受限的卡片副标（`.skin-card__tag`），有意保留 | 若要 14px 一刀切，外观面板卡片会变两行 |
| 8 | 触控目标 ≥44×44（含被裁后的可见尺寸） | PASS | 探针改为「可见盒 + 该轴是否还能滚到」；`.stepper__btn`、`.hint__btn`、`.segmented__item` 三处真缺陷已修 | — |
| 9 | 固定头/底栏遮挡 | PASS | 常驻带都在 `.app` 正常流里（`order` / dock 本身是最后一个子元素），无 `fixed` 脱列 | — |
| 10 | hover / active / focus-visible / disabled | PASS | 三套入选皮肤 v9 已实测；本轮新增 `.answer-btn`（nocturne 无填充排印键）、`.sheet__head`（desk 深色块）等 hover 档均在 `@media (hover:hover)` 内 | — |
| 11 | 空 / 加载 / 出错 / 无权限 | 部分 PASS | **错词本空态已实测**（mistakes=0 天然命中，8 套全过）；首页 `.empty`（无词库）仍未实测——复现要把阶段切到空词池，会把当天新词计划结算成 0 并落盘 | 用一次性测试档案跑，别在真数据上试 |
| 12 | 学习流各阶段 | 部分 PASS | 列表相已实测（8 套）；即时复习 / 总结页需答卡才进得去，会真的落库，故意没测 | 需要时先备份 `cijian.v1` 再进 |
| 13 | 数字/日期格式统一 | PASS | 各皮肤把读数统一成 tabular + 补零；`已学 000 / 批数 04` 实测 | — |
| 14 | 语义色正确 | PASS | 红只在 `is-warn` / 错词 / 危险区；nocturne 的错次徽标改描边不填红；vinyl 洋红不沾状态色 | — |
| 15 | 静态装饰不伪装进度 | PASS | instrument 拆掉 `.start__rule` 6px 假刻度缝；desk 放弃假周内刻度；vinyl 唱针头绑 `__bar` 真宽度 | — |
| 16 | 无裸色值 / 裸尺寸脱离 tokens | PASS | 裸值只在皮肤令牌块；新令牌一律 `--ds-/--nc-/--vy-/--fd-/--bs-` 前缀 | bento 沿用既有 `--bt-` 前缀（未做无谓改名） |
| 17 | 相同组件跨页面一致 | PASS | 五界面都补了 `.btn/.sheet/.dialog/.skin-card/.cal-*/.mistake-*/.stat/.stepper` 档 | — |
| 18 | 图标 / 圆角 / 阴影档位统一 | PASS | desk 0 档、nocturne 0 档、vinyl 1 档、bento 磁贴 2 档、foundry 硬投影 2 档 | — |
| 19 | 字族数 ≤2 | 已知偏差 | broadsheet 声明 serif+sans+mono 三栈（v9 既有事实，中文位靠系统字体回退） | 要收就单独派一轮 |
| 20 | 文案无错别字 / 占位符 | PASS | 皮肤层不产文案；`content` 只有拉丁与符号 | — |

### 必须修（已全部修复并回归，附实测数字）

1. **`.stepper` 在 390 被永久裁掉，「每日新词上限」的「+」几乎点不到**（基线缺陷，8 套全中）。实测：`.stepper` 盒子 `254-370`（w116）而子元素 `−` 255-299 / 值 299-354 / `+` **354-398**；第二行更糟：盒 `281-370`（w89），`+` 落在 **380-424**；`.app__main` 计算值 `overflow-x:hidden` → 不是可滚，是**裁掉**。根因：`.stepper` 自己的 `overflow:hidden` 让 flex 自动最小尺寸归零，被 `.setting-row` 挤窄到 116/89px，而子按钮 `flex:0 0 44px` 不肯收缩。修：`.stepper{flex:none}`（按 max-content 占 144.4px，标签列自己换行让位）。
2. **`.hint__btn` 触控盒只有 18×18**：改成 44×44 真元素 + `margin:-13px` 回收布局足迹，18px 可见点移到 `::before{inset:13px}`，焦点环/hover 一并挪到 `::before`（否则会在透明大盒子上画一方框）。
3. **全站中文小字系统性不达标**：探针实测基线有 **92 处**「>4 个汉字」的文本落在 11–13px，其中成句的说明文字最离谱——`.cal-hero__lede` 13px（23 汉字）、`.mistakes-empty__text` 13px（59 汉字）、`.cal-kicker/.cal-section__hint/.profile__meta/.stage-option__desc` 11–12px。修法：`app.css` 末尾加「v10 排印提档」块（只提字号，不动行高颜色；皮肤层特异性更高，各自定过的照旧），四套原皮肤再各补一块（它们自己压着 10–12px 的工业/报纸/铭牌小字）。结果：**硬 FAIL 92 → 0**。
4. **foundry 首页报头 11px**：`.topbar__meta` 里那个无类名 `<span>` 写着「四级核心词」（5 汉字）在 11px → 提 13px 并把字距从 .08em 收到 .06em（仍是工单味）。顺带修掉它一条**静默丢数据**的旧规则：`@media(max-width:480px)` 用 `nth-child(-n+2)+nth-last-child(-n+2)` 想隐藏「第几批」，但报头只剩三个子节点，两条并集=全部 → 360 档整行数据消失。
5. **foundry 强调读数 4.37:1**：`b.is-accent` 的 `--accent #cf3714` 压在 `--surface #f1f0ec` 上差一档 → 浅色档改 `#c23212`（4.90）；深色档不跟着压（会掉到 3.27）。
6. **broadsheet 外观卡文字 2.15:1 → 3.45:1 → 7.85:1（两轮才修对）**：第一轮只换了文字色（2.15→3.45，仍不过）。真根因是**透明叠透明**：`.skin-grid{background:var(--border)}` 是 `rgba(20,20,15,.3)`，选中的卡片背景又是半透明 `--accent-weak`，两层叠在页底上把文字压成 3.45。把网格底换成不透明 `--surface-sunken` 后 7.85。**教训：半透明 token 当"面板底色"用，对比度必须按叠色后的真实底色算，不能按 token 名义值算。**
7. **bento `.skin-card__latin` 4.34:1** → 文字改 `--text-secondary`。
8. **vinyl `.segmented__item` 43px 宽**（胶囊里只有 1–2 位数字，padding 撑出 43）→ `min-width:44px`。
9. **探针自己的四个洞（不修就永远看不到上面 1–3 条）**：
   - 出列检查用「祖先有横滚就跳过」，而 `.app__main` 计算值 `overflow-x` 恒为非 visible → **整站出列检查长期失效**（v9 的 `nOut:0` 是假的）；
   - 裁切盒没按轴分开：纵向可滚被当成裁切，页脚「换个阶段」44px 按钮报成 39px 假阳性；
   - 裁切盒漏返 `top` 字段 → CTA 判据 `cb.top >= topbar.bottom` 恒为 NaN，**首页 CTA 恒判失败**；
   - 44 判据无亚像素容差 → 43.6px 报缺陷。
   现在改成：横向 `hidden|clip` = 永久裁掉（缺陷），横向 `auto|scroll` = 可滑到（豁免），纵向同理；触控取「可见盒 ∩ 元素盒」并留 0.5px 容差。
10. **nocturne 一度被两轮"只回报不落盘"**：第三轮以「第一个工具调用必须是 edit」强制才落盘（636 行，五界面齐）。它的整文件写入把我手工补的块顶掉了——内容以它的版本为准，我重新全量审计通过。

### 建议修（不阻塞，留给你决定）

1. `warnTiny` 仍有 38 处 13px 中文（主要是 `.skin-card__tag` 卡片副标）：14px 会挤成两行、外观面板要滚更多，现按 13px 取舍。
2. 首页 `.empty`（无词库）分支仍未实测；学习流的「即时复习 / 总结页」两相未截图（要答卡才进得去，会真的落库）。
3. `desk` / `vinyl` 的"底部常驻带"只在家 + 学习流 + 浮层成立——日历与「我的」的 DOM 里没有 `.readouts` 宿主，CSS 造不出来；要严格五屏都有，得给那两屏加 DOM。
4. `Hint.tsx:7` 的注释还在描述旧的 `::after` 热区（本轮没授权改 `.tsx`）；气泡定位改用 44 盒后偏移 13px，视觉仍在 clamp 内，但注释该更新。
5. 顶栏缺 `env(safe-area-inset-top)`（全站既有基线问题，本轮范围外）。
6. broadsheet 三栈字族（见清单 19）。
7. `deck` 只作废未删档：`docs/v8-variants/deck.v1.css`。

### 回归

- [x] 每条必修都在同视口重测：390 档 8 皮肤 × 2 主题 × 7 界面 = **112 组 0 失败**
- [x] 360×640：8 × 5 = **40 组 0 失败**；768×1024：8 × 4 = **32 组 0 失败**；1440×900：8 × 4 = **32 组 0 失败**
- [x] 合计 **216 组**：溢出 0 / 对比度 0 / 触控 0 / 出列 0 / 文字裁切 0 / 中文硬线 0 / 空洞 >150 0 / snap 内衬丢失 0 / 首页 CTA 完整可见 全过
- [x] **学习数据未被污染**：`cards:0 / mistakes:0 / 已学 000 / 未学 3846`，session 档每次进出都比对 `cijian.v1` 全文（`dataKept:true`，24 次）
- [x] `tsc --noEmit` 0 错；`tokens.css` / `skin-hooks.css` 未动；`app.css` 只动了首页 + 三处基线修 + 排印提档块

> ⚠️ **上面这组数字已被 v10.1 作废**（探针豁免逻辑有洞 + `dataKept` 只比对了 `cijian.v1`）。以 v10.1 节为准。

## v10.1 · 2026-11-25 · 重基线：探针豁免逻辑真修 + 学习流两相 DOM 回归 + 中文小字清零

**为什么作废 v10 的数字**：用户指出「祖先 `overflow-x` 计算值非 visible 就跳过出列检查」这条豁免本身是错的——
`overflow-x:hidden` 的裁剪**就是**出列问题。旧写法把 `.app__main`（`overflow-x` 恒为 hidden）当成可滚祖先，
等于把全站出列检查关掉；v10 的 `nOut:0` 与「216 组通过」都是在这个坏探针下测出来的。
现在：**只有 `(auto|scroll)` 且 `scrollWidth > clientWidth`（纵向同理）才算真能滚到、才可豁免**；
同时新增纵向出列判据 `nOutY`（被 `overflow-y:hidden` 永久裁掉且纵向不可滚）。

| 判据 | 结果 | 说明 |
|---|---|---|
| 390×844 × 明暗 × 8 界面 × 8 皮肤 | **128 组 0 失败** | 界面数从 7 拆到 8（导入面板单列一档） |
| 360×640 × 浅 × 6 界面 × 8 皮肤 | **48 组 0 失败** | |
| 768×1024 × 浅 × 6 界面 × 8 皮肤 | **48 组 0 失败** | |
| 1440×900 × 浅 × 6 界面 × 8 皮肤 | **48 组 0 失败** | |
| 合计 | **272 组 0 失败** | 溢出 / 真实叠色对比 / 可见触控盒 / 出列（横+纵）/ 文字截断 / 中文硬线 / 空洞 / snap 内衬 / CTA 完整 全 0 |
| `outYTotal`（新判据） | **0** | 全站没有被 `overflow-y:hidden` 永久裁掉的内容 |
| `warnTiny`（>4 汉字 <14px） | **92 → 38 → 0** | 本轮把最后 38 处清零，见必修 3 |
| 学习流两相 DOM 级回归 | **16 组 × 2 相 = 32 次探针 0 失败** | 即时复习 + 总结，明暗各 8 套；不截图（要答卡），触控/对比/截断/出列全覆盖 |

### v10.1 新抓到的东西（全部已修）

1. **第二个存储键 `cijian.scheduler.v1`——之前所有「数据未污染」的结论都不成立**。
   学习状态（`cards / unlearned / days / mistakes / immediate`）全在这个 44KB 的键里，`cijian.v1` 只有 profile 和会话开关。
   为补「两相 DOM 检查」必须答卡，**真的把今天 20 个词学掉了**，而 `dataKept` 只比对 `cijian.v1`，一路报 true。
   处理：按 `learnedOn` 把 20 张卡精确退回 `unlearned` 队首 + 清 `days[today].newLearned` + 归零即时计数，
   复核 `cards:0 / unlearned:3846 / newLearned:0 / mistakes:0`，首页读数复原 `今日20 / 批数04 / 已学000`。
   两个审计脚本现在**同时快照-还原-校验两个键**；跑答卡的脚本还在备份前加了一次自愈（`scrub`）——
   否则被超时打断后「还原成功」只是还原到脏状态（本轮实际踩过：`restored:true` 但 `cards:10`）。
2. **探针第 5 个洞：祖先 `display:none` 的后代仍被算成可见**。
   子元素自己的 computed `display` 是 `inline`/`block`，不随祖先变 `none`；只有 `getBoundingClientRect()` 归零能证明它没渲染。
   漏这行会把隐藏节点报成违规：instrument 首页 `.topbar__meta` 明明被
   `.app:has(.start) .topbar__meta{display:none}` 藏了，却被算成「10px 硬失败」。
3. **`.skin-card__tag` 的 38 处 13px 用「改短文案」清零，而不是提字号**（按用户第 2 条决定）。
   8 条 tagline 原本是 9–14 个汉字的三段式说明（「暖纸台面、常驻深色抽屉、768 真侧栏」），压成**四字格**：
   暖纸·朱砂 / 硬边·印章 / 琥珀·等宽 / 栏线·靛蓝 / 冷灰·磁贴 / 墨蓝·月光 / 洋红·唱片 / 抽屉·侧栏。
   ≤4 汉字不触发硬线，13px 定稿，卡片不撑两行、面板不用多滚。改的是 `src/lib/skins.ts` 的文案，不是样式。
4. **最后一批「>4 汉字且 <14px」的文本逐个提档**（不搞一刀切）：
   foundry `.parse-summary/.issues` 11→14（「不会覆盖已有词库」8 汉字），且深色档 tertiary 只有 4.47:1 → 换 secondary；
   foundry `.topbar__meta` 13→14；nocturne `.start__eyebrow / .cal-foot / .section__hint--inline` 13→14；
   desk `.section__title / .cal-foot / .section__hint` 13→14（原来吃 `--fs-small`=13px 这个 token）；
   paper `.today-card__label` 13→14；基线 `.session-done__note` 13→14（「不认识的词会回到明天的 1 天批次」22 汉字）。
5. **Vite 会漏掉 `edit` 工具的写入**：改完 CSS/TS 后浏览器里计算值还是旧的（nocturne 两处 13px、skins.ts 第 8 条 tagline 都中招）。
   表现是「改了没生效」，实际文件已落盘。处理：`(Get-Item file).LastWriteTime = Get-Date` 强制失效再复测。
6. **相位脚本的三个自坑**（不是产品缺陷，但会让结论假通过/假失败）：
   `waitForSelector` 的 timeout 不能当延时用（每步等满 2.5s → 整轮超时被杀）；
   `querySelectorAll` 按文档序返回，`.answer-btn` 里「模糊」在「认识」前面，点模糊会把词退回队尾**永远考不完**；
   即时复习是**每 10 个一组**，一组考完会退回 list 相位读下一批——只戳作答键会卡死，两种推进键都得戳。

### v10.1 建议修

1. 首页 `.empty`（无词库）分支仍未实测——复现要把阶段切到空词池，会结算当天新词计划；建议用一次性测试档案。
2. 即时复习 / 总结两相有了 DOM 级回归但**仍无截图**。补图的正解已换成**隔离 profile**（`scripts/diff-scheduler-iso.js` 的工具序列：独立 context 里答卡，随便怎么落库都不碰真实档案），不必再做快照-回滚；真实档案上的快照-回滚降为次选，用时必须标注「该组跑测会临时改动学习状态，已回滚」。
3. `desk` / `vinyl` 底部常驻带在日历与「我的」两屏没有 DOM 宿主——已批准用 `persistentReadouts` 开关补，**属于 commit B**，不在本次基线内。
4. `Hint.tsx:7` 注释仍描述旧 `::after` 热区；顶栏缺 `env(safe-area-inset-top)`；broadsheet 声明 3 个字族——既有基线问题，本轮范围外。

## v10.2 · 2026-11-25 · 数据事故与全键 diff 补证（与 v9 作废并列阅读）

> **两条并列的"报告级"更正**：① v9 的 `nOut:0` 因探针豁免逻辑失效而作废（见 v10.1）；
> ② **v10/v10.1 里所有 `dataKept:true` 都不构成学习数据的完整性证明**——它只比对了 `cijian.v1`，
> 而学习状态（`cards / unlearned / days / mistakes / immediate`）全在另一个键 `cijian.scheduler.v1`（44KB）。
> 后果：为补「即时复习 / 总结」两相 DOM 回归而答的卡，把当天 20 个新词真学掉了，而脚本一路报 `dataKept:true`。

### 补证方法（不再靠读数，改成可复现实验）

在**独立 browser context**（独立 profile，真实档案零接触）里只播种 `cijian.v1`，让 app 自己长出一份 pristine 学习状态，
再重放与事故当时同样的流程（2 个 session、20 个新词、只点「认识」），拿前后两份全量 JSON 做路径级 diff。
脚本：`scripts/diff-scheduler-iso.js`（隔离实验室 + 工具序列）、`scripts/diff-report.js`（Node 侧全键 diff / 逆操作完备性证明）。
证据：`docs/evidence/scheduler-diff-2026-11-25.json`。

### 结论一：答卡实际只碰 8 条路径（源码审计与实测双向对上）

| # | 路径 | pristine → 答卡后 |
|---|---|---|
| 1 | `unlearned` | 3846 → 3826，**从队首取走 20 个** |
| 2 | `cards` | 0 → +20 键（每键 15 个字段） |
| 3 | `days[今].newLearned` | `[]` → 20 项 |
| 4–5 | `days[今].immediate.groups / .cards` | 0 → 2 / 0 → 20 |
| 6–7 | `immediate.stats.groups / .cards` | 0 → 2 / 0 → 20 |
| 8 | `immediate.lastAvgLoops` | **`null` → `0`**（唯一无法重建的滚动量） |

其余 12 个顶层键与当天记录另外 12 个字段（`mistakes / lifetime / doneToday / accScore / accCount / retried / relearned / archived / freqRank / currentLimit / consecutiveGoodDays / pendingLimit / lastSettlement / dueSnapshot / planSnapshot / snapshotDone / newWordLimit / settled / action / settlement / absent`）**答卡路径零写入**。
`CardState` 真实字段是 15 个：`word phase interval due longInterval longAnchor reps lapses lastRating lastReviewed hard relearned inMistakes skippedImmediate learnedOn`——**没有 `ease` / `reviewCount` / `lastSeen`**（不是 SM-2，档位是离散 1/2/6/15 → 30/90/180/360）；首学当天 `due = 明天`，`reps/lapses = 0`，`lastRating/lastReviewed = null`。

### 结论二：原逆操作不完备，差 exactly 1 项

把事故当时的 scrub 原样跑在隔离副本上再与 pristine 比对：`residueCount = 1`，就是 `immediate.lastAvgLoops`——
它把"没有即时复习历史"（`null`）伪造成"上次平均 0 圈"（`0`），而这个值会喂给自适应。
其余部分（回插 `unlearned` 队首 / 删 `learnedOn===今` 的卡 / `newLearned` 清空 / 两处 `immediate` 计数归零）经实测是**精确逆操作**：
`unlearned` 3846 项**逐元素与 pristine 相同**（`firstDiffAt = -1`），`days` 两条记录 diff 为 0。

### 结论三：真实档案现已归位

| 判据 | 结果 |
|---|---|
| `cijian.scheduler.v1` 与 pristine 的 SHA256 | **`B59898AC…7C7E11BB` 完全相同**（39289 字节，逐字节） |
| 全树路径 diff / canonical JSON 相等 | 0 条 / `true` |
| 38 条关键路径复位核对 | notPristine **0**（修之前是 2） |
| `unlearned` 顺序逐元素比对 | identical `true` |
| `cards / mistakes / newLearned / immediate.stats` | 0 / 0 / `[]` / 全 0；`lastAvgLoops` 已回 `null` |
| 首页读数 | 今日 20 · 批数 04 · 已学 000 |
| `cijian.v1` | 187 字节，只有 `profile / progress / session / custom`，与学习数据无关 |

### 规则固化（已写进脚本注释，十条）

1. **答卡类测试首选隔离**：独立 context / `storageState` 注入，不在真实 profile 上跑；快照-还原只是次选。
2. **快照-还原必须双键**：`cijian.v1` + `cijian.scheduler.v1`；只比前者等于没守住。
3. **还原前自愈保留**，且自愈顺序改为"有 `__bak_at` + 两个 `__bak_*` 就逐字节还原，没备份才按 `learnedOn` 计数 scrub"。
4. **scrub 永不写 `immediate.lastAvgLoops`，只做删除 / 复位，不造值**：pristine 是 `null`，写 `0` 就是伪造一条
   "上次即时复习平均 0 圈"的历史喂给自适应。一般化：**计数器型 scrub 只允许把状态移回已知集合，不得为任何字段生产新值。**
5. **跑完必须删 `__bak_*` / `__bak_at`**（`audit-phases.js:155`）：这条比原事故更危险——它发生在"数据完整性已经修好"
   之后的脚本里，残留的备份会让下一次"自愈"把用户在这期间**真实学习**产生的数据当脏状态回滚掉。
   所以还原与清理是两步，缺第二步等于埋回一个更隐蔽的坑。
6. **整程数据门禁只比学习键 `cijian.scheduler.v1`，逐测点窗口才比双键**（v11 用户拍板，写死在
   `audit-readouts-band.js:26-33`）：`cijian.v1` 存的是**皮肤/主题偏好**，`setSkin()` 每轮**合法改写**它，
   把「双键整程相等」当门禁等于造一条永假断言（v11 实测踩过：`dataKeptAllRun:false` 假警报，
   差点让人去"修"一个根本不存在的 bug）。正确分工——**备份/还原覆盖双键**（防中途崩），
   **整程断言只看学习键**（`learnDataKept`），**逐测点前后比对双键**（那一段没有任何合法写入，diff 即误触）。
   这条与第 2 条不矛盾：第 2 条说的是**保护范围**，第 6 条说的是**断言范围**。
7. **`page.evaluate` 不捕获 Node 闭包变量**（v11 实测：`ReferenceError: BAK is not defined`）：
   Node 侧常量在页面上下文里一律 undefined，凡页面代码要用必须走第二个参数注入
   （`page.evaluate(fn, { ks: KEYS, bak: BAK })`）。写探针时先在脑子里把"页面能看见什么"划一遍线，
   比事后 debug 便宜得多。
8. **pristine 锚点必须可复现，不许引用记忆里的 hash**（v11 收尾实测纠正）：会话里一直挂着
   「pristine = 39289 B / `B59898ACC3…`」，收尾复核却发现当前是 39385 B / `C74F4675E1…`——**差点报成数据被写坏**。
   真相：那个 hash 是**换天结算写盘之前**的快照，+96 B 是应用自己记账（`days[今].immediate` ≈57 B、
   `immediate.stats` ≈53 B、`pendingLimit` ≈47 B 量级）。可复现的基线是「**全新隔离 context 首次启动**，
   应用自行 seed 出来的那一份」——当前真实档案与它**逐字节相同**、字段级 diff 0，这才是「没被写坏」的证明。
   为什么算规则而不是脚注：「逐字节相同」这句话一旦基线不可复现，就会产出**假警报**，
   而假警报的下一步往往就是「顺手 restore」——那正是 v10.2 事故的路径。
    同源纪律：**hash 由脚本产出并落盘，不许人手转录**——本轮把 hash 抄进证据文件时多打了一个 `5`（65 位），
    靠「对三份落盘文件重算再比对」才发现；`docs/evidence/pristine-anchor-2026-11-25.json` 里留了这条 `shaNote`。
9. **纯重构 / 令牌化必须提供两层等值证据**（金值探针 + 像素比对），只证明「没报错」不算完成。
10. **矩阵视口集合本身是门禁的一部分**：改字号 / 文本长度必须补测该元素 display 断点两侧各一档，扩了矩阵才算覆盖。


### 附带：`.skin-card__tag` 语义复核（用户第 2 条决定的补充要求）

逐条核对后改掉 3 条丢区分度的：`硬边·印章`→`纯白·硬边`（与 paper 的"朱砂"撞车）、
`冷灰·磁贴`→`冷灰·青瓷`、`洋红·唱片`→`洋红·黑胶`（后两者原本在重说自己的皮肤名）。
最终 8 条全部 4 汉字 / 13px / 单行 153px 宽，截图 `docs/screenshots/v10/v10.2-sheet-light-390.png`。

## v11 · 2026-11-25 · commit B：日历 / 「我的」常驻读数带（`persistentReadouts` 开关）

**做了什么**：把首页内联的 `.readouts` 抽成共享组件 `src/components/Readouts.tsx`，由 App 顶层
同一份 memo（`buildReadoutItems(allowedNew, todayBatchCount, learnedCount)`）喂三屏；
`SkinMeta` 新增**必填**字段 `persistentReadouts`（desk / vinyl = true，其余 6 套 = false），
节点插在布局层 `.app` 直接子级（`App.tsx` 屏链 `)}` 之后、浮层之前）→ **CalendarScreen / ProfileScreen 零改动**。
false 皮肤是「DOM 里查无此节点」，不是 `display:none`——开关的意义就在这。

**三条落地纪律**：① 皮肤 CSS 不许 `content:` 造数（`desk.css:280` 的纯装饰拉丁 `CIJIAN · DAILY` 只活在抽屉段，
新带一律无）；② 带子**禁止可点**（决策 #5：一进 `<button>` 就是 44px 门禁 + 误击清空钮 + `go()` 文本查找污染三连）；
③ 360 降级只收 gap / padding，**绝不 `overflow:hidden` 假装降级**。

### Design Review — cal/me 读数带 — 2026-11-25（360×800 / 768×1024 / 1440×900）

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 360 无横向滚动 / 截断 / 重叠 | PASS | `docOvf:false` 于 360/768/1440；`audit-screens` 96 组 `ovf/nOut/nClip` 全 0；截图 `vB-desk-cal-light-360.png`、`vB-vinyl-cal-dark-360.png` |
| 2 | 极端位数不撑破 | PASS | 合成压测（只改 DOM 文本）：desk 最坏 `999/999/99999` usedW **220 / 余 140**；vinyl **267 / 余 93**；`scrollWidth === clientWidth` 无裁切 |
| 3 | 三档视口信息层级一致（非简单缩放） | PASS | ≤389 单行基线（desk 37px / vinyl 41px），≥390 两行柱（54 / 52px）；三项数值与首页逐字相同（`sameAsHome` 断言） |
| 4 | 底栏不遮挡内容 + safe-area | PASS | 带子是 `.app__main` 的**兄弟**不是浮层，main 视口自然收在带顶之上；`padding-bottom: calc(7px \| 8px + env(safe-area-inset-bottom))` |
| 5 | 正文对比度 ≥4.5 / 大字 ≥3 | PASS | 带内专项探针（**绕开 `aria-hidden` 豁免**）`low` 命中 0，64 测点；desk rail-muted 6.91:1、rail-ink 13.98/15.89:1 |
| 6 | 深浅两背景都清楚 | PASS | 明暗各测；截图 `vB-desk-cal-dark-1440.png`、`vB-vinyl-me-dark-1440.png` |
| 7 | 语义色正确、强调色 ≤1 | PASS | 带内无红色；vinyl 只复用既有 accent 呼吸点，desk 带只用 rail 中性色（accent 已花在头像） |
| 8 | 字体族 ≤2 | PASS | 两案带内均 mono + 既有正文族，零新族 |
| 9 | 左右留白三档成立 | PASS | 带内 padding-inline 用 `var(--page-x)`（20 / 32 / 32），与屏边距同源 |
| 10 | 点击目标 ≥44px | N/A（豁免） | 豁免理由**实测**：`inter === 0 && pointer === 0`（H2），任一 >0 即 FAIL，不走豁免分支 |
| 11 | hover / active / focus / disabled / loading | N/A | 带内无可交互元素；`aria-hidden="true"` 保留，屏内别处有等价文本 |
| 12 | 键盘 Tab 顺序 / 焦点环 | PASS | 带内无可聚焦节点，Tab 序与 commit A 基线一致 |
| 13 | 数字格式统一 | PASS | `tabular-nums` + 补零 2/2/3 与首页现体逐字一致；组件不算数、不判零、不查 NaN |
| 14 | 文案无占位符残留 | PASS | 仅「今日/批数/已学」，无 TODO/Lorem |
| 15 | 相同组件跨页一致 | PASS | 同一 `<Readouts>` 实例化三屏；`data-readouts-screen` 只用于定位，皮肤不据此判身份 |

### 必须修（阻塞交付）

无。

### 建议修（三条已全部拍板，处置见下）

1. **裸尺寸**：`desk.css` 新带段的 `font-size: 13px / 20px`、`gap: 6px`、vinyl 的 `7px / 6px` 未走 `--space-*` /
   字号令牌——沿用两文件既有裸值定式（`desk.css:303` 抽屉 13px、`vinyl.css:436` 矮屏 6px），要令牌化应整族一起改，
   不夹带进 B。
   → **拍板：做，但单独 commit** `refactor(tokens): desk/vinyl 带段尺寸令牌化`，整族一次改完、回归照跑；
   夹带进 B 会污染 revert 粒度。**排期在收尾之后。**
2. **desk 首页手机档无带**（决策 #4 已接受为已知代价）：desk 会出现「首页无带、日历/我的有带」的不对称，
   要统一另立 issue。
   → **拍板：保持接受，降级为「已知限制」**（见本节末），后续要修另立 issue，**不混进收尾**。
3. **vinyl 呼吸点在 cal/me 也闪**：`::after` 的 `vy-pulse` 原语义是「播放器在响」，现在日历/我的也常驻闪。
   观感可接受（实测截图无干扰），但语义上是否该在非首页停住，值得下一轮产品判断。
   → **拍板：按语义修，限定只在首页亮**——"观感可接受不等于语义对"。改动只有一行选择器，
   因此**并入收尾 commit**，并在 `audit-readouts-band.js` 加 `pulseOk` 断言（不靠肉眼截图守语义）。

### 回归（全部实测，非推断）

| 门禁 | 范围 | 结果 |
| --- | --- | --- |
| `tsc --noEmit` | 全项目 | **0 错**（必填字段穷尽性同时被验证：8 套皮肤全部表态） |
| `audit-readouts-band.js` | 8 皮肤 × 明暗 × cal/me × [390×844, 360×740] = **64 测点** + 首页对照 32 + 反例 16 | **failCount 0**；`nodeOk`（false 皮肤 DOM 查无节点）全对；`sameAsHome` 全对；`noInter` 全对；`clean` 全对 |
| 同上 · 桌面档 | 8 皮肤 × cal/me × [768×1024, 1440×900] = 32 测点 | **failCount 0**，带高 54px |
| 开关真值表 | desk/vinyl 各 4/4 有节点；其余 6 套 0/4 | 与 `skins.ts` 一致；`SKINS.length===8` 漂移兜底 `driftGuard true` |
| `audit-screens.js`（含新 `nOutY` 门禁） | 8 皮肤 × 明暗 × [home,cal,me] × [390,360] = **96 组** | **failCount 0**、`outYTotal 0`、`warnTiny 0` |
| 学习流反例 | desk/vinyl × 明暗 × [home,session] × 2 视口 = 16 组 | **failCount 0**；session 内 `.readouts` 节点数 **0**（`!session` 生效，不与即时复习 dock 抢底） |
| `scan-tiny.js` | 8 皮肤 × 5 界面 | `groups 0 / hardFail 0`（与基线一致） |
| **逐像素回退证明** | false 皮肤 8 组（paper/bento/nocturne × cal/me × 明暗，390×844）重截 vs commit A 基线 | **8/8 SHA256 逐字节相同**——6 套不开带的皮肤在 cal/me 上观感零变化，开关确实是「节点不进 DOM」而不是「藏起来」 |
| **revert 演练**（规约 §7.1 独立回滚要求） | `git revert --no-commit <本 commit>` → 回退态 `tsc` **0 错**、`vite build` **0**（2.04s）、`audit-screens` 48 组 **0 失败** → `git reset --hard` 复原 | commit B 不依赖任何未提交改动，可单独回退。演练期间踩到 HMR 假报错（删掉 `Readouts.tsx` 时浏览器仍持旧 import → 404），需整页 reload 再看 |
| 数据隔离 | 全程不答卡；双键快照-还原 + `__bandbak_*` 收尾删净 | `learnDataKept true`、`cleanup {restored:true, cleaned:true}`；跑完 `cards 0 / unlearned 3846 / learnedToday 0 / lastAvgLoops null`（逐字节 = pristine） |

**踩到的两个新坑（记进脚本注释）**：
① Playwright 的 `page.evaluate` **不捕获外层闭包变量**——Node 侧的 `BAK` 常量在页面里是 `ReferenceError`，
必须走参数注入；② 整程「双键相等」当门禁是错的：`cijian.v1` 存的是皮肤/主题偏好，`setSkin()` 每轮合法改写它，
整程比对只能盯**学习键**，逐测点窗口才比双键。

### v11 收尾 · 2026-11-25（vinyl 呼吸点语义修正 + 规则与已知限制）

**产品代码只改一处**：`vinyl.css:213` 呼吸点选择器
`[data-skin='vinyl'] .readouts::after` → `.readouts[data-readouts-screen='home']::after`。
`vy-pulse` 的语法是「播放器在响」，日历/「我的」没有播放器，常驻闪是语义漂移（建议修 #3 的拍板）。
撤的是**整颗 accent 点**而不是只停动画——静态 accent 点同样是无语义装饰，还会违反 vinyl 的 accent 预算。
`flash-card__head::after`（学习流卡面那颗）**不动**：那里卡面就是唱片，语义成立。

**语义靠断言守，不靠肉眼**：`audit-readouts-band.js` 新增 `pulseOk`，逐测点读
`getComputedStyle(el, '::after')` 的 `content` / `animationName`——首页 vinyl 必须 `vy-pulse`，
vinyl 的 cal/me 必须 `content:none`，其余皮肤常驻带必须 `animationName:none`；
已纳入 `badBand` 与 `badHome` 门禁（首页那条以前不看动效，vinyl 首页若哪天不响了没人知道）。

**新增工具 `scripts/run-audit-node.js`**：把仓库里的审计脚本 `eval` 起来用 playwright 起
**headless 隔离 context** 跑。起因是 `browser_run_code_unsafe` 单次请求超时——128 组 ≈ 4 分钟直接
`Request timed out`，**页面跑完了但结果 JSON 全丢**。探针逻辑不复制第二份，配置键同源，
只有「谁启动浏览器」变了；顺带符合规则 1（隔离优先）：全新 context 的 localStorage 是空的，
应用按 pristine 自行 seed，真实 profile 一个字节都不碰。分批一律用 `scripts/cfg-matrix-*.json`
（PowerShell 传内嵌 JSON 会把引号吃掉，第一版 runner 就是这么炸的）。

**收尾最终回归（全部实测，非推断）**

| 门禁 | 范围 | 结果 |
| --- | --- | --- |
| `tsc --noEmit` | 全项目 | **0 错** |
| `vite build` | 全项目 | **exit 0** |
| 272 组主矩阵 · A | 8 皮肤 × 明暗 × **8 界面**（home/cal/me/mistakes/sheet/import/dialog/session）× 390 = **128 组** | **failCount 0**、`outYTotal 0`、`dataKept true`、`passN 128`（128.0s） |
| 272 组主矩阵 · B | 8 皮肤 × 明暗 × [home,cal,me] × [360, 768, 1440] = **144 组** | **failCount 0**、`outYTotal 0`、`dataKept true`、`passN 144`（118.5s）；`warnTiny 4` → 已由新 `warnList` 定位，见下「新建议修」 |
| 带断言（含新 `pulseOk`）· 手机 | 8 皮肤 × 明暗 × cal/me × [390, 360] = **64 测点** + 首页对照 32 + 反例 16 | **failCount 0**；`pulse {homePulsing 4, bandDotsRemoved 16, bandNodes 16}`——vinyl 首页 4 个测点全在响、16 个带节点全被撤点 |
| 带断言 · 桌面 | 8 皮肤 × 明暗 × cal/me × [768, 1440] = **64 测点** | **failCount 0**、带高 54px、`driftGuard true`、`counterFail []` |
| 两相 DOM（`audit-phases.js`） | 8 皮肤 × 明暗 = **16 组 × 2 相 = 32 探针**（真答卡） | **failCount 0**、`restoredAll true`、`cleanAll true`、`lastLive {cards 0, unlearned 3846, mistakes 0, learnedToday 0}`、`cleaned true`、runner 侧 `bakKeys []` |
| `scan-tiny.js` | 8 皮肤 × 5 界面 | `groups 0 / hardFail 0 / items []` |
| 数据完整性 | 真实 profile 全程只做导航与探针；答卡矩阵改在**隔离 context** | `cijian.scheduler.v1` **39385 B / SHA256 `C74F4675E11ACE78…`**，与 ① 12:01 全键 diff=0 快照 ② **全新隔离启动**跑出的 `iso-base.json` **逐字节相同**（字段级 diff **0**），见 `docs/evidence/pristine-anchor-2026-11-25.json`；`__bak_*` / `__bandbak_*` 零残留 |

**答卡测试从此走隔离**（规则 1 的正解落地）：`run-audit-node.js` 起的 headless context 是全新 profile，
真答卡只污染这个一次性 context，真实档案一个字节都不动——比"快照-还原"更彻底，且顺带把
`restored` 校验从"依赖上一次没崩"变成"必然成立"。

**新踩的坑（第三条，写死）**：**隔离 context 冷启动直接跑快照-还原类脚本 = 假失败**。
全新 context 里应用还没落过盘，`cijian.v1` 是 `null`、`cijian.scheduler.v1` 不存在，
`audit-phases.js` 在 line 108 抓的备份就是 `null` / `"{}"`，跑完还原-校验必然 `restored:false`
（首跑 16 组全红，而 `live` 明明是 pristine）。修法：runner 种完配置后**先访问一次首页**让应用 seed，
再交给审计脚本。教训通用：**"隔离"改的是数据落点，不改脚本对"起点状态存在"的隐含假设**。

## Design Review — v11 收尾 delta（vinyl 呼吸点仅首页 + cal/me 常驻带）— 2026-11-25

视口 360×740 / 768×1024 / 1440×900（另含 390×844 主档），证据 `docs/screenshots/v11/vC-*.png` 44 张
（撤点后重截）+ 带断言矩阵 64 手机 / 64 桌面。

| # | 检查项 | 结果 | 证据 | 建议 |
|---|--------|------|------|------|
| 1 | 360 无横向滚动 / 截断 / 重叠 | PASS | `vC-vinyl-cal-light-360.png`、`vC-desk-me-light-360.png`；带矩阵 64 测点 `docOvf false`、`outX []` | — |
| 2 | 三档视口信息层级一致（非简单缩放） | PASS | 360 单行基线降级 `vC-*-360.png` vs 768 双行 `vC-*-768.png` vs 1440 `vC-vinyl-cal-light-1440.png`（带子仍沉底、`bandH 54`） | — |
| 3 | 长内容（极端位数）不撑破容器 | PASS | commit B 压测 `999/999/99999`：desk 余 140px、vinyl 余 93px、`clippedByBand false` | — |
| 4 | 固定底栏不遮挡内容 + `env(safe-area-inset)` | PASS | 两文件带段 `padding-bottom: calc(… + env(safe-area-inset-bottom))`；带矩阵 `belowMain true` 全测点 | — |
| 5 | 呼吸点只在首页亮（本次语义修正） | **PASS** | 首页有：`vC-vinyl-home-light-1440.png` 右缘 `x≈1060` 那颗洋红点；带子无：`vC-vinyl-cal-light-1440.png` 同位置空。断言三轮分别 `pulse {homePulsing 4, bandDotsRemoved 16, bandNodes 16}`（390+360×明暗）、`{4, 16, 16}`（768+1440×明暗）、`{2, 8, 8}`（桌面 light 补拍档），三轮全部 `bandDotsRemoved === bandNodes` | — |
| 6 | 学习流卡面那颗点未被误伤 | PASS | `flash-card__head::after` 选择器未改；两相 DOM 32 探针（真答卡）`failCount 0` | — |
| 7 | 正文对比度 ≥4.5 / 大字 ≥3 | PASS | `BAND_PROBE` 钻进 `aria-hidden` 子树实测，64+64 测点 `low 0`（含 13px 标签与 20px 数字） | — |
| 8 | 深浅两档背景都清楚 | PASS | `vC-*-dark-360/390.png` 全套（desk/vinyl × home/cal/me × 明暗） | — |
| 9 | 语义色正确、不用强调色当装饰 | **PASS（本次转好）** | 撤掉的正是「用 accent 当无语义装饰」那颗点；vinyl accent 预算回到只标语义位 | — |
| 10 | 同一层级间距一致（8pt 网格） | PASS | 带段 `gap`/`padding` 全部取自 `--space-*`（vinyl 360 档 `--space-3`）；desk 带段仍有裸 `6px` | 见建议修 #1（令牌化，已排期）→ **v11.1 已落地** |
| 11 | 左右留白三档成立 | PASS | 带段用 `var(--page-x)`，与同页卡片同轴：`vC-desk-cal-light-768.png` | — |
| 12 | hover / active / focus / disabled / loading | N/A | 带子是 `aria-hidden` 纯展示节点，`inter 0 / pointer 0` 实测（H2 前提）；本次未动任何交互件 | — |
| 13 | 键盘 Tab 顺序 / 焦点环 | PASS | 带子不进 tab 序列（无可聚焦元素）；dock/topbar 未改，主矩阵 272 组 `nSmall 0` | — |
| 14 | 点击目标 ≥44×44 | PASS（豁免已写明） | 带内零交互元素，44px 门禁不适用；理由与实测前提写在 `audit-readouts-band.js` 头注释与 `tapExemption` 字段 | — |
| 15 | 空 / 加载 / 出错 / 无权限四态 | N/A（本次 delta 不涉及） | `.empty` 下带值仍未截 → 已列入「已知限制」 | 单独补测 |
| 16 | 文案无错别字 / 占位符 | PASS | 带内仅「今日 / 批数 / 已学」三标签，与首页同源（`sameAsHome` 全对） | — |
| 17 | 数字 / 日期格式统一 | PASS | `padStart(2/2/3)` + `font-variant-numeric: tabular-nums`：`04 / 000` 见 `vC-*-cal-*-360.png` | — |
| 18 | 无裸色值 / 裸尺寸脱离 tokens | FAIL（已知） | desk 带段 `13px / 20px / 6px`、vinyl 360 档 `7px / 6px` | 建议修 #1，已拍板单独 commit |
| 19 | 相同组件跨页外观一致 | PASS | 三屏同源：`Readouts.tsx` 单一实现，DOM 类名与 commit A 逐字节同构（false 皮肤 8 组 SHA256 相同） | — |

### 必须修（阻塞交付）

无。

### 建议修（不阻塞）

1. 裸尺寸令牌化（已拍板：单独 commit `refactor(tokens): desk/vinyl 带段尺寸令牌化`）→ **已落地，见 v11.1 段**。
2. nocturne 桌面档 `.topbar__meta` 13px「四级核心词」——见下节，本轮 `warnList` 新发现。→ **v11.2 已落地（14px + 400–459 降级）**。
3. `.empty` 无词库状态下带子的三档读数补一张截图（逻辑安全，缺证据）。

### 回归

- [x] 返工后同视口重截确认：360 / 390 / 768 / 1440 全套 `vC-*.png`（44 张）
- [x] 带断言 64 手机 + 64 桌面 + 32（桌面 light 补拍档）全 `failCount 0`
- [x] 272 组主矩阵 + 32 探针两相 DOM + `scan-tiny` + `tsc` + `build`

### 新建议修（收尾发现，未动代码）→ **已在 v11.2 落地**
- **nocturne 桌面档 `.topbar__meta` 13px 中文**：`nocturne.css:123-127`，768 / 1440 下
  `span.topbar__meta > span` 渲染「四级核心词」（5 汉字 @13px，宽 74px）触发 `>4 汉字 ≥14px` 软线。
  桌面档完全放得开（`warnTiny 4` 全部来自这一处 × 明暗两档 × 两个视口），**与 commit B / vinyl 无关**
  （`git show --stat` 证实 commit B 只碰了 `desk.css` / `vinyl.css`）。
  建议：桌面媒体查询里把该 `font-size` 提到 14px（窄屏那条 `display:none` 规则 `:600` 不受影响）。
  留作单独 commit，不混收尾。

### 已知限制（刻意代价，不是 bug）

- **desk：首页手机档无带、日历/「我的」有带**（决策 #4 的代价，建议修 #2 拍板保持）。
  首页信息已由 `.start` 自身承载，带子在手机首页会与 dock 抢底；不对称是**故意的**。
  要统一另立 issue，别混进收尾。
- **vinyl 常驻带（cal/me）无活动指示点**：语义修正的直接结果。日后若想让带子表达「有东西在跑」，
  得另找一个非「播放器」语义的符号，不许把这颗点加回来。
- **`.empty`（无词库）状态下带子的值未测**：三档读数会显示 `00 / 00 / 000`，逻辑上安全，但没有截图证据。
- ~~**裸尺寸令牌化未做**~~ → **已落地**：见「v11.1 · `refactor(tokens)`」段，12 个令牌 + 17 条金值 + 像素级 15/16 逐字节相同。
- **400–767 窄档除 nocturne 顶栏外未系统测过**，作为已知限制留档，后续按需再开。
- **vinyl 浅色 390：`.cal-figures` 第 4 格（连续优秀）右侧被裁掉**（v12 动效第二轮发现，
  **既有缺陷，不是动效引入**：转场只动 `transform` / `opacity`，且结束帧的静止截图与起手帧表现一致）。
  成因是 vinyl 把四组读数排成一行、每格给固定圆盘直径，390 下总宽超过 `.app__main`
  （`overflow-x: hidden` 直接裁掉，连横向滚动都没有）。v10 那 272 组矩阵没覆盖这一格的真实列宽，
  属**探针覆盖缺口**。**排期：三个动效 commit 全部验收后单独开 `fix(vinyl)` commit 修，禁止夹带。**

### 操作坑（v11 新增，写死）

- **revert 演练会污染 Vite 模块图**：`git revert --no-commit` 删掉 `Readouts.tsx` 时浏览器仍持旧 import，
  报 404 与 `[vite] Failed to reload`；`git reset --hard` 复原后还会残留旧 `?t=` 时间戳，
  报 `does not provide an export named 'SKINS'` 这类**假错**。
  **演练完必须重启 dev server**（整页 reload 不够），再跑任何回归，否则会把绿的项目读成红的。
  **解法（首选，直接避免污染）**：演练 revert / 改历史一律开临时分离工作树——
  `git worktree add --detach <目录> <sha>`，在里面做完就 `git worktree remove --force <目录>`，
  活动工作树与 dev server 全程不动；只有被迫在活动工作树上演练过，才需要重启 dev server 兜底。
- **MCP 单调用有超时上限**：长矩阵改走 `scripts/run-audit-node.js`（后台 job + `job_output` 收），
  别把 128 组塞进一次 `browser_run_code_unsafe`。
- **`-replace | Set-Content` 会毁中文 md（2026-11-26 实测，写死）**：为了改 `NOTES.md` 里的一个 commit hash，
  用了 `(Get-Content -Raw) -replace 'a1d1a36','df04e24' | Set-Content -NoNewline`，
  结果整份 727 行被写成 225 行乱码（编码混写 + 丢行），`git diff` 一眼就是 `+185 / −687`。
  **改文档一律用 edit 工具**（定点替换、UTF-8 安全）；PowerShell 只用来跑命令、查状态、数行。
  事后靠 `git checkout -- <file>` 回滚，**回滚后必须 `git diff --stat` 确认为空**再继续往下做。
- **PowerShell 数行不可信**：`Measure-Object -Line` 对这个仓库的 md 会少算（97 KB 的 `NOTES.md` 报 189 行，
  实际 715+）。要行号/总量用 read 工具的 `of N`，别拿 `Measure-Object` 当尺子。
- **规约被实测推翻：改规约 + 留档，不许悄悄改口径（v12 动效第二轮，2026-11-26）**：
  `docs/MOTION_SPEC.md` §13.2 第 4 条原写「desk / vinyl 在日历 / 我的的常驻读数带跨屏存在、
  **不参与**转场」。实测推翻——换屏时 `showBand` 由 false→true 会重新挂载，它就是跟着淡入，
  desk 那一帧是三个节点（topbar / readouts / app__main）同动，
  截图 `docs/screenshots/motion/v2-enter/enter-390-desk-dark-1.png`。已修正为「常驻带也属于进入屏」。
  **教训不是「当时想错了」，而是「没实测就写进了规约」**：涉及挂载 / 复用的判断，
  写之前先量一次；量不了就明确写「待验证」，别写成结论。

## v11.2 · 2026-11-25 · nocturne 顶栏小标签 13px → 14px（建议修 #2 落地）+ 顺手挖出 400–767 盲区

排期 ②，独立小 commit，不夹带进 ①。**改这一个字号的过程中发现了一个比它更值得记的问题**，
所以这一段的主角其实是第二段。

### 一、被拍板的那一行

`nocturne.css:125` `.topbar__meta` `font-size: 13px → 14px`。起因是收尾那轮 `warnList` 点名：
`nocturne/dark/768|1440/home 13px「四级核心词」5 字`——>4 汉字的软线以下。
**验收线：矩阵 B 的 `warnTiny` 从 4 归 0**（实测已归零，A 本来 0）。

### 二、400–767 从来没被量过（新发现，比 14px 本身重要）

`.topbar__meta` 只在 `<400` 整条隐藏（§14），而两套主矩阵的视口是 **360 / 390 / 768 / 1440**——
中间这一整段是空白。补测之后：

| 视口 | 13px（改动前） | 14px（改动后，未加降级规则） |
|---|---|---|
| 400 | 需要 166 / 只有 142 → **静默裁字** | 178 / 144 → 裁更多 |
| 412 | 166 / 151 → **静默裁字** | 178 / 153 |
| 430 | 166 / 166 → 刚好装下 | 178 / 168 → **新坏** |
| 460+ | 装下 | 178 / ≥178 → 装下 |

也就是说：**13px 时代这段就已经在吃掉「今日 20 词」这几个字，只是没人测到**；
提 14px 会把裁切范围从「400–412」扩到「400–459」。而这类裁切是 `overflow:hidden` 干的，
不出横滚、不出列、不碰触控盒——**既有四道门禁一条都不会红**。

### 三、降级规则砍哪一段：按宿主数决定，不按长度

`@media (max-width: 459px)` 隐藏 `.topbar__meta > span:first-child`（阶段名）与 `.topbar__sep`，
只留「今日 20 词」。依据是实测宿主数：

- 「四级核心词」在首页另有 **2 处**宿主（`.start__eyebrow`、`.start__spec-v`）→ 冗余，可以先走；
- 「今日 20 词」全页 **0 处**别宿（`todayElsewhere.n = 0`）→ 唯一宿主，必须留。

阈值 459 不是拍的：14px 整串需要 178px，实测 460 是第一个装得下的宽度（`178>178`），459 只有 ~168。
`<400` 那条整条隐藏的旧规则保留不动——那里连 79px 那段都要跟三个 44px 按钮抢位置。

### 四、新增守卫 `scripts/audit-topbar-narrow.js`

400/412/430/440/452/459/460/480/540/600/680/768 × 明暗 = 24 测点，四条判据：
文档零横滚、`scrollWidth <= clientWidth+1`（不被自己 `overflow:hidden` 裁）、顶栏可聚焦件 ≥43.5px、不出列。
配置键同族（`__narrow_widths` / `__narrow_themes` / `__narrow_shots` / `__narrow_prefix`），走 runner 隔离 context。
**改动前跑它 = 抓到 13px 的既有裁切；改动后跑它 = 四个数组全空。**
脚本里留了一条自纠：`textContent` 会把 `display:none` 的子段也算进来，首版用它报「显示了什么」差点得出假结论，
现在只拼可见子段。

### 回归（全部实测）

| 项 | 结果 |
|---|---|
| 主矩阵 128 组 | `failCount 0`、`outYTotal 0`、`warnTiny 0`、`dataKept true`、129.2 s |
| 主矩阵 144 组 | `failCount 0`、**`warnTiny 0`（原 4）**、`warnList []`、119.6 s |
| `scan-tiny` | `groups 0`、`hardFail 0`、`items []` |
| 带断言 64 手机 | `failCount 0`、`pulse {4, 16, 16}`、`learnDataKept true`、`cleanup {restored, cleaned}` 双真 |
| `audit-topbar-narrow` 24 测点 | `clipped []` / `overflow []` / `tapFail []` / `outCol []`；412→`79>79`、460→`178>178` |
| `tsc --noEmit` / `vite build` | 0 / 0，产物 CSS 内含 14px 与 `459px` 断点 |

证据：`docs/screenshots/v11/vE-nocturne-{dark,light}-{412,460,768}.png` 6 张——
412 顶栏只剩「词笺 今日 20 词」且**没有残留分隔点**，460 完整串有余量。

### 本轮沉淀（已固化为规则九 / 规则十）

- 规则九：纯重构 / 令牌化必须提供两层等值证据（金值探针 + 像素比对）。
- 规则十：矩阵视口集合本身是门禁的一部分——只测 360/390/768/1440 等于默认 400–767 不存在。

## v11.1 · 2026-11-25 · `refactor(tokens)`：desk / vinyl 读数族尺寸令牌化（建议修 #1 落地）

**范围**：commit B 拍板「做，但单独 commit」的那条。只动两个 CSS 文件的**读数族尺寸**，
新增令牌 12 个（desk 5 + vinyl 7），不改一个像素——所以本 commit 的正确判据不是「回归没红」，
而是「每个计算值逐条等于替换前的字面量」。

### 改了什么

| 皮肤 | 新令牌 | 值 | 替换掉的裸尺寸 |
|---|---|---|---|
| desk | `--ds-readout-k` | 13px | 抽屉标签 + 常驻带标签（两处同值，现同一令牌） |
| desk | `--ds-readout-v` | 34px | 抽屉读数数字 |
| desk | `--ds-band-v` | 20px | 常驻带读数数字 |
| desk | `--ds-band-gap` | 6px | ≤389 单行态 k/v 基线间距 |
| desk | `--ds-kicker` | 11px | 轨顶 `CIJIAN · DAILY`（纯装饰拉丁，允许低于 13px） |
| vinyl | `--vy-band-pad` / `-pad-sm` | 8px / 7px | 带内距（默认档 / 矮屏+≤389 单行态，§6·矮屏定式·§16 三处共用） |
| vinyl | `--vy-band-gap-sm` / `-cell-gap` | 6px / 3px | 单行态与两行态的 k/v 间距 |
| vinyl | `--vy-band-disc` | 26px | 带左缘微型盘 |
| vinyl | `--vy-band-v` | 18px | 带内读数数字 |
| vinyl | `--vy-dot` | 7px | **三处同径圆点**：首页带呼吸点、学习流卡面呼吸点、小节标题静态点 |

顺带修掉一个**死令牌**：`--ds-cell-h: 96px`（`desk.css:66`）定义了却没人引用，抽屉格高在 `:296` 写死 `96px`。
现在 `min-height: var(--ds-cell-h)`，注释与实际终于对上。

`--vy-dot` 是「整族一次改完」的落点：三颗点尺寸相同、语义差别只在有没有 `animation`，
留两处裸 `7px` 等于没令牌化；但**不**把它们合并成一个语义令牌——呼吸点与静态点仍是不同规则，只共用尺寸。

### 边界（明确没动的东西，免得下轮误以为漏改）

- 媒体查询断点 `389px` / `429px` / `640px`：是**条件**不是尺寸，不进令牌。
- 抽屉列宽 `212px`、缝线把手 `40px`：属抽屉**版面几何**，不是读数族，另议。
- 日历盘内数字 `18px`（`vinyl.css:843`）与带内数字恰好同值，但那是「盘」这个组件的字号，**不共用** `--vy-band-v`——
  同值不同义就分令牌，否则改带子会莫名其妙改掉日历盘。
- `letter-spacing` / `line-height: 1` / `aspect-ratio`：比例量，不是尺寸。

### 等值证明（两层，都不依赖「回归没红」）

1. **金值探针** `scripts/audit-token-equiv.js`（本轮新增，留作常备守卫）：17 条 `getComputedStyle` 断言，
   覆盖 desk 抽屉 96/13/34/11、desk 带 13/20/6、vinyl 带 8/26/3/18/7+`vy-pulse`、vinyl cal 带 `content:none`、
   ≤389 降级 7/6、小节静态点 7 → **`allOk: true` / `fail: []`**。
   期望值全部抄自替换前的字面量，所以这 17 条同时**冻结**了带段几何：日后真要改尺寸必须显式改期望值。
   踩到一条：Chromium 的 `gap` 在 row==column 时折叠成单值（`6px` 而非 `6px 6px`），首跑 4 条假失败全是这个格式问题。
2. **像素级**：同条件重截 16 张与上一 commit 的 `vC-*.png` 逐字节比对 → **15/16 SHA256 完全相同**，
   唯一差异 `vinyl-home-light-390` 经画布逐像素定位为 **45 个像素、全部落在 7×7 框（x 363-369, y 815-821）**，
   最大通道差 3——正是 `--vy-dot` 那颗呼吸点的动画相位。页面其余部分零差异。

### 回归（全部实测）

| 项 | 结果 |
|---|---|
| 主矩阵 128 组（390×8 皮肤×2 主题×8 界面） | `failCount 0`、`outYTotal 0`、`warnTiny 0`、`dataKept true`、129.3 s |
| 主矩阵 144 组（8×2×3 界面×360/768/1440） | `failCount 0`、`passN 144`、`warnTiny 4`（**还是那条 nocturne 13px**，本轮没碰它，正好反证） |
| 带断言 64 手机 | `failCount 0`、`pulse {4, 16, 16}`、`bandH` desk 54 / vinyl 52、`learnDataKept true` |
| 带断言 64 桌面 | `failCount 0`、`pulse {4, 16, 16}`、`bandH 54` |
| 两相 DOM（真答卡，隔离 context） | `failCount 0`、`restoredAll true`、`cleanAll true`、`lastLive {cards 0, unlearned 3846, mistakes 0, learnedToday 0}` |
| `scan-tiny` | `groups 0`、`hardFail 0` |
| `tsc --noEmit` / `vite build` | 0 / 0，且 4 个抽查令牌名在产物 CSS 中**均存在**（没被打包器折叠掉） |

### 新建议修（本轮方法沉淀）→ **已固化为规则九**

- **「纯重构必须证明等值，不许只证明没报错」**：本轮靠金值探针 + 像素比对两层证据才敢说「不改一个像素」。
  用户已拍板，写进规则段第 9 条。

## v9 · 2026-11-25 · 三版结构级重做（desk 案头 / deck 叠章 / vinyl 唱盘）〔**已作废**：出列判据当时被探针的豁免逻辑整体关掉，`nOut:0` 不可信；`deck` 亦已按用户选择作废〕

**范围**：新增三套皮肤 `src/styles/skins/{desk,deck,vinyl}.css` + 注册；`play` 作废（四处注册摘掉，CSS 存档 `docs/v8-variants/play.v1.css`）；
`bento`/`nocturne` 按用户要求原样保留。**现有四套皮肤与 `app.css`/`tokens.css`/`skin-hooks.css`/组件 DOM 仍一行未改。**
本轮两条新方针：① 首页功能介绍（`.start__title` + `.start__lede`）在新皮肤里**删除**；② 三版必须占**互斥的骨架轴**（栏 / 栈 / 横），数据不必全放首页。

| # | 检查项 | 结果 | 证据 | 建议 |
|---|--------|------|------|------|
| 1 | 360 无横向滚动 / 截断 / 重叠 | PASS | `docs/screenshots/v9/v9-{desk,deck,vinyl}-light-360.png`，24 组矩阵 `ovf:0` 全清 | — |
| 2 | 三档视口信息层级一致（非简单缩放） | PASS | desk 360 竖轨→768 真侧栏（`main` 让到 `217,61 546×839`）；deck 章高 240→264；vinyl 轮 120/96→128/104 且第 4 盘由半切变全露 | — |
| 3 | 长内容撑破容器 | PASS | 360 档注入「学术英语高级词汇扩展包 · 128466 词」+ 长承诺句 + 「错词本 128」：三版 `scrollWidth==clientWidth==360`、出列元素 0（`v9-*-longcontent-360.png`） | — |
| 4 | 固定头/底栏遮挡 | PASS | desk 侧栏与 vinyl 底带都在 `.app` 的 flex/grid 正常流里（`order` 交换，非 `fixed`）；CTA 判据要求 `top ≥ topbar 下缘` 且 `bottom ≤ 滚动口下缘`，24/24 通过 | — |
| 5 | 首页无功能介绍 | PASS | 三版 `.start__title/.start__lede` 计算值 `display:none`（实测 `titleDisp:"none"`）；全文无中文伪元素 `content`（grep 复核） | 现有四套仍保留，是否全局删除等用户拍板 |
| 6 | 标题与正文 ≥1.25 倍 | PASS | desk 27/14、deck 72/14、vinyl 27/14 | — |
| 7 | 正文对比 ≥4.5:1、大字 ≥3:1 | PASS | 24 组 DOM 实算 `nLow:0`（deck 深色页脚 4.16 已修，见必须修 7） | — |
| 8 | 深浅两档都清楚 | PASS | 明暗各 12 组全过；三版语义色两档各写一遍 | — |
| 9 | 语义色正确 | PASS | 红色只出现在 `is-warn`/危险位；vinyl 逾期盘只在 `:has(b.is-warn)` 点 `--warning`，洋红 accent 不沾状态 | — |
| 10 | 同层级间距一致 | PASS | deck 章间 `gap:10` + 唇边 `-14`；vinyl 网格 `row-gap:20`；desk 台账行 `min-height:44` | — |
| 11 | 相关靠近 / 无关拉开 | PASS | vinyl 三轮呼吸行把「标题↔货架头↔轮↔页脚」拉开（实测最大单处 108–123px，阈值 140 内） | — |
| 12 | hover / active / focus-visible / disabled | PASS | 实测：desk CTA `#20623F→#1A5235`、deck `#17171A→#2A2A2E + translateY(-1px)`、vinyl `#A62A5E→#8E2250 + translateY(-1px)`，移开均复原；焦点环 2px + offset 2px 三版各有；`prefers-reduced-motion` 下 deck 位移归零（`transform:none`） | `:active` 按 CSS 源码核对（点主按钮会真的进入学习会话） |
| 13 | 键盘 Tab 顺序 | PASS | 三版一致：日历 → 外观 → 我的 → 主按钮 → 学习日历 → 换个阶段 | vinyl 多一个停靠点＝横轮容器本身（Chrome 可滚动区域可聚焦，标准行为） |
| 14 | 点击目标 ≥44×44 | PASS | 24 组 `nSmall:0`；外观面板 9 张卡在 390 两列 / 768 四列均 ≥44（`v9-picker-390.png`） | 「我的」页那个 18×18 帮助按钮是基线就有，paper 同样存在 |
| 15 | 空 / 加载 / 出错 / 无权限 | 部分 N/A | Boot 失败页与 `.empty` 分支未改；三版对 `.empty` 有基础适配但**仍未实测** | 见建议修 2 |
| 16 | 文案无错别字 / 占位符 | PASS | 皮肤层不产文案；`content` 只有拉丁印章 01–07、`→`、`▶`、`CIJIAN · DAILY` | — |
| 17 | 数字 / 日期格式统一 | PASS | desk 侧栏补零读数（04 / 000）；deck 题章拉丁日期 `2026 · 11 · 25` 与台账 `今日 · 11月24日 周二` 各一处，不再双报 | — |
| 18 | 无裸色值脱离 tokens | PASS | 裸值只在皮肤令牌定义块；组件补丁一律 `var()`；三版各自定义 `--ds-*` / `--dk-*` / `--vy-*` 度量前缀 | — |
| 19 | 相同组件跨页面一致 | PASS | 三版都补了 `.btn/.sheet/.dialog/.skin-card/.cal-*/.flash-card/.stat` 的底色描边圆角；实测「我的」页三版 `ovf:0 / nLow:0` | 精修度仍不如首页，见建议修 1 |
| 20 | 图标 / 圆角 / 阴影档位统一 | PASS | desk 0 档阴影 + 直角轨；deck 3 档柔和 + 圆角 12；vinyl 1 档厚度 + 圆 999 盘 | — |
| 21 | **结构互斥（本轮新增判据）** | PASS | 阅读轴：栏（desk）/ 栈（deck）/ 横（vinyl）；CTA 锚点：列底 sticky / 行动章内部 / 货架头药丸；chrome 移动：768 真侧栏 / 无 / 读数带沉底；首页数据量：7 / 首屏 1 / 6 | — |

### 必须修（已全部修复并回归，附实测数字）

1. **vinyl 主 CTA 在屏幕上根本看不见**：`.start__actions` 用 `position:absolute` 锚到 `.today-card`，而**两者是兄弟**——absolute 只认祖先，包含块退到视口，实测三档都是 `y=-2`（`258,-2 / 636,-2 / 1308,-2`）。改网格同层放置后 `absCount=0`、CTA `214,44` 完整可见。**审计判据同步收紧**：旧判据 `top < innerHeight && bottom > 0` 对负 top 恒真，这就是它当初没被抓到的原因。
2. **vinyl 横轮第一盘贴屏边**：`scroll-snap-type:x mandatory` 把 `padding-inline-start` 的 20px 滚掉了（实测 `rail.scrollLeft=20`、`disc1.x=0`，而计算值 `padding-left:20px` 是对的）。加 `scroll-padding-inline-start/-end` → 现 `scrollLeft=0`、`disc1.x=20`。
3. **deck 压栈永不发生**：`scrollHeight 820 / client 784` → 整页只能滚 36px，六章 sticky 偏移 0/26/52… 全部没机会触发，静止看就是六张等宽圆角卡（=本轮被否掉的「换色」）。改成一卡一章 + 不等高（240/138/118/118）+ 负 margin 唇边 → 余量 **248/240/264**，滚动后实测各章钉在 60/86/143/211/345/459/573/723。
4. **deck 批数整块消失**：`.start__spec` 计算值 `display:none`——被 `skin-hooks.css` 的默认钩子压死（不是规则打架，是漏写）。批数 `todayBatchCount` 是**只有首页才有**的数据，皮肤层藏掉＝全站不可见。显式 `display:grid` 后实测 `208×38` 落在 hero 章右下。
5. **deck 叠放漏写 `grid-column`**：hero 与批数行都只写 `grid-row:2`，自动布局新开了一条隐式列（实测 `.start` 计算 `cols: 429.6px 118.4px`，hero 被挤成 118px 窄条）。两格同时钉列 → `cols: 350px`、hero `350×240`。
6. **desk 768 侧栏 700px 全黑空**：只有两格读数 + 底部把手，像没加载完。填法只用真结构：轨顶拉丁字标、读数格 `min-height:96`、通高缝线 + 末端把手（`flex:1` 吃余量）。**放弃**「7 格周内刻度」——没有真数据就是假进度。
7. **deck 深色页脚 4.16:1 不达标**：`--text-tertiary #8f8c85` 压在页脚章面 `#2a2a2a` 上。抬到 `#9a9690` → 4.88，24 组 `nLow:0`。
8. **desk / vinyl 大标题折行留孤「·」**：390/360 两行、行尾一个间隔号。`clamp(20px,5.6vw,27px)` + `text-wrap:balance` + `word-break:keep-all` + 关掉基线 `::before` 那根短线（它在 26px 标题前渲染成一个「—」，像误留字符）→ 实测单行。
9. **desk 抽屉底色画在伪元素上导致审计误报**：轨内浅色文字被按页面底色算出 1.0:1（祖先背景链读不到 `::before` 的底色）。把底色改画在真实元素 `.start__masthead` 上——顺带少一个定位伪元素。
10. **vinyl 单处 314px 空洞**：内容止于 y≈433、foot 在 725，中间一整片空纸。改三条 `1fr` 呼吸行均分余量，并把承诺句紧贴轮（注解不离开主体）→ 最大单处 108–123px。

### 建议修（不阻塞，留给你决定）

1. **三版仍只精修首页**。其它页只做了「不崩」兜底（实测「我的」页三版零溢出零对比度问题），选定后需按同一语言重做列表 / 复习 / 即时复习 / 日历 / 我的。
2. **空状态仍未实测**：复现要把阶段切到无词表，而空词池会把当天新词计划结算成 0 并落盘（老坑），不该在真数据上试。
3. deck / vinyl 用 `display:contents` 拆壳会丢 `.today-card` 的 `aria-label="今日学习摘要"`（可见补偿分别是「01–07 印章 + 日期条」与 `__label` 日期行）。要严格保住，只能保留外壳——那会牺牲版面自由度。
4. desk 手机档与桌面档的批数宿主不同（手机在 `spec` 行、桌面在侧栏读数），两档要各查一遍。
5. vinyl 横轮容器在 Chrome 里是一个额外 Tab 停靠点（可滚动区域可聚焦，标准行为）；不想要就得改 DOM 加 `tabindex="-1"`。
6. `play` 只作废未删档：`docs/v8-variants/play.v1.css`。

### 回归

- [x] 每条必修都在同一视口重截（`docs/screenshots/v9/`，72 张）
- [x] 最终 24 组矩阵（3 皮肤 × 明暗 × 390/360×640/768/1440）：溢出 0 / 对比度 0 / <44px 0 / 出列 0 / snap 内衬丢失 0 / 单处空洞 >140 0 / **CTA 完整可见 24/24**
- [x] 长内容注入实测（360 档，三版 `scrollWidth==360`、出列 0）
- [x] 交互态实测（hover 三版各自变化且可复原、焦点环 2px+2px、reduced-motion 位移归零）
- [x] 外观面板 9 张卡：390 两列 / 768 四列，零溢出、零小目标
- [x] `tsc --noEmit` 0 错；现有四套皮肤与 `app.css`/`tokens.css`/`skin-hooks.css` 未动

## v8 · 2026-11-24 · 三版新皮肤首页（bento 磁贴 / play 燃点 / nocturne 夜航）

**范围**：只新增三套皮肤 + 注册（`src/styles/skins/{bento,play,nocturne}.css`、`types.ts`、`skins.ts`、
`storage.ts` 的 SKINS 白名单、`main.tsx` import、`SkinSheet` 说明文案改取 `SKINS.length`）。
**现有四套皮肤与 `app.css` / 组件 DOM 一行未改**，切换走原有 `[data-skin]` 机制。

| # | 检查项 | 结果 | 证据 | 建议 |
|---|--------|------|------|------|
| 1 | 360 无横向滚动 / 无截断 / 无重叠 | PASS | `docs/screenshots/v8/v8m-{bento,play,nocturne}-{light,dark}-360.png` 三版 × 明暗 `scrollWidth == clientWidth` | — |
| 2 | 三档视口信息层级一致（非简单缩放） | PASS | 360 / 768 / 1440 各档截图：bento 读数条+不对称磁贴、play 单栏→双栏+圆币、nocturne 刊号行+两栏读数 在三档都保持同一层级 | — |
| 3 | 长内容撑破容器 | PASS | 磁贴数字 `overflow-wrap: anywhere`；币内 `128/150` 折行不外溢（320 下币径 88 实测） | 极端三位数 + `↑+5` 角标同屏时磁贴会变高，阵型不齐（可接受） |
| 4 | 固定头/底栏遮挡 | N/A | 首页无 dock；`.readouts` 在正常流 | — |
| 5 | 标题与正文字号差 ≥1.25 | PASS | bento 22/14、play 38/16、nocturne 34/16 | — |
| 6 | 正文行高 1.5–1.7 / 标题 1.1–1.3 | PASS | lede 1.65–1.75；标题 1.08–1.35 | — |
| 7 | 每行字符数（中文 20–40） | PASS | lede `max-width: 34–46ch`，截图实测 24–34 字/行 | — |
| 8 | 正文对比 ≥4.5:1、大字 ≥3:1 | PASS | 18 组（3 皮肤 × 明暗 × 360/768/1440）DOM 实算 **0 项不达标**（脚本 `scripts/audit-skins.js`） | — |
| 9 | 深浅两档都清楚 | PASS | 明暗各 9 组全过；语义色两档都写齐（老坑已避） | — |
| 10 | 语义色正确（不用强调色代替错误色） | PASS | 红色只出现在 `--danger` / 错词 / 危险操作；逾期=warning、复习=success、新词=accent | — |
| 11 | 同层级间距一致（8pt） | PASS | bento 节拍 24/12/12/24/32 全走 `--space-*`；play 16/20/12/28/32 | — |
| 12 | hover / active / focus-visible / disabled | PASS | 三版各有 `:hover`（包 `@media (hover: hover)`）、`:active`、`:focus-visible`、`:disabled`；实测 hover 三版背景/描边/位移均变化且移开可复原；焦点环 bento 2px teal、play 3px 墨、nocturne 2px 月光蓝 | `:active` 按 CSS 源码核对（浏览器里点主按钮会真的进入学习会话，故不实测） |
| 13 | 键盘 Tab 顺序合理 | PASS | 顶栏日历 → 外观 → 我的 → 主按钮 → 卡内链接，与基线一致 | — |
| 14 | 点击目标 ≥44×44 | PASS | 18 组 `smallTargets` 计数 **全 0** | — |
| 15 | 空 / 加载 / 出错 / 无权限 | 部分 N/A | Boot 失败页与 `.empty` 分支未改；三版对 `.empty` 有基础适配但**未实测** | 见建议修 5 |
| 16 | 文案无错别字 / 占位符 | PASS | 皮肤层不产文案；顺手修了外观面板写死的「四套排印系统」→ `SKINS.length` | — |
| 17 | 数字 / 日期格式统一 | PASS | 读数条补零（20 / 04 / 000）为 bento 刻意的仪表感；其余沿用基线格式 | — |
| 18 | 无裸色值脱离 tokens | PASS | 裸值只出现在皮肤令牌定义处；组件补丁一律 `var()` | — |
| 19 | 相同组件跨页面一致 | PASS | 三版都重写了 `.btn/.dock/.answer-btn/.sheet/.dialog/.skin-card/.cal-*` 的底色描边圆角 | 精修度不等，见建议修 1 |
| 20 | 图标风格 / 圆角 / 阴影档位统一 | PASS | bento 2/6/8 + 1 档；play 14/18/28/999 + 3 档全硬底边；nocturne 2/3/4 + 0 档 | — |

### 必须修（已在交付前修复并回归）

1. **bento 顶栏品牌名折成竖排两行**（`topbar__meta` 打开后挤压 `.brand`）→ `.brand__name` `flex:none + nowrap`、meta 改 `display:block` 并只留阶段名。回归：390/320/768 三档 `brand` 高度 15px 单行。
2. **同屏四次报「今日新词 20」**（顶栏 / 读数条 / 工单表 / 磁贴）——Anki 26.10 被社区回滚的原罪 → 关 `.topbar__meta` 的数字位、`.start__spec` 整块关。回归：首屏 7 个指标、每个只出现一次。
3. **bento 刻度尺 6/10 段实心 teal 被读成「复习完成 60%」**（真数据是 `0/0`）→ 刻度尺与 7 点链改为**零 accent** 纯装饰，「今天」那一格用空心描边（3.43 / 3.85:1）。
4. **bento 深色主按钮整块 `#4fd1c5` 像告警条** → 深色档改 `--accent-weak` 底 + accent 描边与文字（7.33:1），左 4px 色条保留实心。
5. **bento / play 纵向节奏「中间飘一块」**（`.start__body` 用 `margin-block:auto` 居中）→ 改固定节拍 + `.start__foot { margin-top: auto }` 钉底；bento 顺带修 `.start` 的 `min-height` 只扣顶栏 56px、没扣读数条 34px 造成的约 38px 幽灵滚动。回归：390 下 bento 页高 782 < 844、play 820 < 844。
6. **play 三枚币是蛋形**（`111×88` + `border-radius:999` → 椭圆）→ `aspect-ratio: 1/1` + `minmax(0,1fr)` + `min(100%,104px)`。回归：320→88、360→101、390→104、768→93，全部 W=H。
7. **nocturne 同屏三次报数 + 含中文 11–12px 小字** → 关工单表第 2/4 行；CJK 标签统一抬到 13px 起、成句中文 ≥14px。
8. **nocturne 深色描边 1.3–1.9:1 当状态边界用** → 状态一律走填充色 / accent 描边（≥7.6:1），线只做装饰。

### 建议修（不阻塞，留给你决定）

1. **三版目前只精修首页**。其它页面（列表 / 复习 / 即时复习 / 日历 / 我的 / 浮层）只做了「不崩」兜底：底色、描边、圆角、中文小字下限。**选定某一版之后才值得把剩下五个界面按同一语言重做**。
2. bento 的刻度尺与 7 点链、play 的额度点阵都是**静态装饰**，不接真数据——皮肤层拿不到数据，要接必须改 DOM。
3. nocturne 顶栏下「刊号行 / kicker / eyebrow」三行小字信息略重复，可考虑砍掉 eyebrow。
4. play 在 768 下左栏 CTA 以下留白偏大（内容短 + 报尾钉底）；可改成整块垂直居中，但会牺牲刚修好的节拍。
5. **空状态（词库为空）没有实测**：要复现得把阶段切到「自定义」且无词表，而空词池会把当天的新词计划结算成 0 并落盘（老坑），不该在真数据上试。
6. play 深色档币的 2px 装饰边只有 1.65:1（刻意按「装饰线」处理）。

### 回归

- [x] 每条必修都在同一视口重截过图（`docs/screenshots/v8/`，共 34 张）
- [x] 最终全矩阵 18 组：溢出 0 / 对比度不达标 0 / 点击目标 <44 0 / 中文小字 0 / 出列 0 / CTA 在首屏 18/18
- [x] `tsc --noEmit` 0 错；现有四套皮肤截图对照基线未变（`v8-baseline-paper.png`）

## v7 · 2026-11-24 · 日历格子信息层级（真机反馈）

审查范围：学习日历「接下来 7 天」全部 7 格 + hero 短句 + 新增的 `?` 说明气泡｜
fixture A（真机第一天：今天学完 20 新词 → 明天到期 20、26 日起没排上）与 fixture B（连续优秀 40 天 + 长期批次 + ↑ +5，脚本 `scripts/fixture-calendar.ts`）｜
视口 360/768/1440 × 4 皮肤 × 浅深 = 24 组 × 2 份 fixture｜方法：`scripts/audit-calendar.js` 真实 DOM 量。

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 复习量是否一眼可见（不再藏在灰色小字） | PASS | 7 格首槽恒为 `复习 …`，tone 只允许 `primary`/`quiet`；`docs/screenshots/v7/v7-calendar-day1-360.png` |
| 2 | 歧义的裸分数 `0 / 20` 绝迹 | PASS | 24 组 × 7 格 `.cal-day__count` 恒为 null |
| 3 | 未来日不显示完成度（只报计划总量） | PASS | §12.1 断言 + DOM：`复习 20 词`，字符串里不含 `/` |
| 4 | 复习为零显式占位 `复习 —` + 一句人话 | PASS | 6 格 quiet + 「还没排上复习：做完前面的复习才会排进来。」 |
| 5 | 对比度 WCAG AA（正文 ≥4.5:1） | 修后 PASS | **首轮 2 组 FAIL**（见必须修 1），修复后 24 组 0 失败 |
| 6 | 横向溢出 / 胶囊与短句被裁 | PASS | 24 组 `scrollWidth-clientWidth = 0`、clipped 全空；1440 应用列 758px 居中 |
| 7 | `?` 交互（热区 / 气泡出界 / Esc） | PASS | 热区 44×44（本体 18×18 + `::after -13px`）；气泡 left 44 / right 344 在 360 内；Esc 关闭 true |
| 8 | 长期批次 / ↑ +5 / 逾期 槽的排版 | PASS | fixture B：`长期 30 天 12 词`、`↑ +5` 均落在负荷行；`v7-calendar-long-360.png` |

### 必须修（本轮全部修完）

1. **foundry 深色 `--warning` 漏档**：`#7a4e10` 在 `#0b0b0b` 上只有 **2.74:1**（hero 那句「今天已经学了 20 个…」与「计划 25，因复习未完成…」）。
   根因同 v6 的 `--danger`：浅色档 `[data-skin='foundry']`（权重 0,1,0）在 tokens.css 之后加载，深色档没写这条就被它盖住。补 `--warning: #d3a25a` → 8.5:1。
2. **broadsheet 深色 `--warning` 同样漏档**：`#14140f` 在 `#131311` 上 **1.01:1**，等于文字看不见。补 `--warning: #d3a25a`。
3. **`逾期 N 词` 的语义误标**（顺手修）：`CalendarDay.overdue` 是「这天到期没做完」，今天做之前它恒等于剩余量——旧格子会同时显示 `0 / 20` 和「逾期 20 词」。现在只在**历史日**渲染逾期槽，今天的剩余量由 `复习 12/20` 那个分数说。

### 建议修（不阻塞）

- 7 格里连续 6 格 `复习 —` 时说明句重复 6 遍，略啰嗦；若要收敛，可只在第一格给整句、其余给短横。本轮按「每格自解释」保留。
- 负荷行是纯 `<span>` 组合，屏幕阅读器读作「复习 20 词 新词 20 词」；如果以后加语音播报，考虑给格子补 `aria-label`。

### 回归

`tsc --noEmit` 0 错；`test:scheduler` 全过（新增 §12 共 21 条断言，旧 181 条未动）；`vite build` 过（CSS 102.7KB / gzip 15.7KB，主 JS gzip 102.1KB）；
浏览器实测两份 fixture × 3 视口，`复习` 槽恒在首位、无裸分数、无横向滚动。

## v6 · 2026-11-24 · 统一学习流（Session 状态机重构）

审查范围：首页（唯一入口 + 纯展示 TodayCard）、Session 四态（review 三键 / list 分批列表 / immediate 两键 / done 总结页）｜
fixture：27 词自定义词库（8 张今日到期卡 + 19 词未学池，发放 19 → 5/5/5/4）｜ 视口 360/768/1440 × 4 皮肤 × 浅深 = 24 组 ｜
方法：真实 DOM 量（溢出、对比度 WCAG、点击目标、截断、卡片与 dock 重叠）+ 全流程浏览器实测（含三个退出场景与硬词 3 次上限）。

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | list 态 24 组（溢出/对比/目标/截断/5 词全见） | PASS | 0 失败；`list-360.png` 最后一行 bottom 590 < dock top 740 |
| 2 | immediate 态 24 组 | 修后 PASS | **首轮 8 组 FAIL**（见必须修 1–3）；修复后回归 0 失败；`immediate-360.png` 只有英文+音标+两键 |
| 3 | done 态 24 组 | PASS | 0 失败；`done-360.png` / `done-768.png` |
| 4 | 首页无多余学习入口 | PASS | `home-360.png`：只有大按钮 + 摘要数字 + 错词本/日历链接 |
| 5 | 复习优先无缝切换 | PASS | 实测：8 张三键卡答完 → 直接落在「今日新词 · 第 1/4 批」，无中间页 |
| 6 | 10 词强制即时复习 / 尾巴也弹 | PASS | 第 2 批「下一批」→ 10 词组；末批「看完收尾」→ 9 词组 |
| 7 | 完成判定（清空才入库） | PASS | 组清空前 localStorage cards=8；清空后 18（+10）；尾巴清空后 27（+19） |
| 8 | 中途退出零入库 | PASS | 列表退：cards=8/newLearned=0/pool=19；即时退：active=null、零入库、错词本不记（未满 3 次） |
| 9 | 重进从第 1 批重看 | PASS | 退出重进 → 第 1 批首词 t8 |
| 10 | 硬词 3 次上限 | PASS | t8 连错 3 → hard 放过 → 组清空入库；卡 `hard:true`、错词本 count=3 source=immediate |
| 11 | 总结页数字与引擎一致 | PASS | 「复习 8 · 入库 19 · 硬词 1」与落库 JSON 逐项一致 |

截图：`docs/screenshots/v6/` —— home-360 / list-360 / list-1440 / immediate-360 / done-360 / done-768。

### 必须修（已修复并回归）
1. **broadsheet 深色 `--danger` 未覆盖**：浅色档的 #14140f（近黑）直接沿用到深色，「不认识」1.38:1 → 深色块补 `--danger: #e8836f`（6.6:1）。
2. **foundry 深色 `--danger` #ff4a21** 4.34:1 → 改 #ff6a45（6.5:1）。
3. **foundry 浅色 `--accent` #d93a16 上白字 4.46:1**（差 0.04）→ 压深一档 #cf3714（5.5:1），色相不变。

### 建议修（不阻塞）
1. 768/1440 下 list 到 dock 仍有大空档（v2 起的老问题，列表垂直居中未做）。
2. 总结页「复习 0 个」在复习与入库分属两次进入时略显割裂，可考虑合并展示当日总量（数据在 DayRecord 里都有）。

### 回归
- [x] 修复后 immediate 24 组重跑 0 失败
- [x] `tsc` 0 错、`vite build` 过、`test:scheduler`（含 §11）/`test:books`/`test:csv` 全过

## v5 · 2026-11-24 · 完整词库接入（ECDICT）+ 学习栏批号

审查范围：学习中页（5 词列表 / 学习栏批号）、开始页（foundry 报头小字）、我的 →「词库」新增的「词库数据」行 ｜
数据：四级 3,846 词（原 70 词样本）｜ 视口：360×800 / 768×1024 / 1440×900 ｜ 皮肤：4 套 × 浅/深 = 24 组

方法：`scripts/audit-vocab.js` 在真实 DOM 上量（`scrollWidth`、每行 `getBoundingClientRect()`、WCAG 对比度、
点击目标尺寸、`scrollWidth > clientWidth` 的截断检测），一轮跑完 24 组，不是肉眼看截图。

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 360 无横向滚动 | PASS | 24 组 `docOverflow` 全为 0 |
| 2 | **5 词同屏不被撑破**（硬指标） | PASS | 360 下最后一行的 bottom 与 dock top：paper 629/727、foundry 622/738、instrument 601/742、broadsheet 655/746，均留 ≥ 90px 余量；768/1440 同样 5/5 可见 |
| 3 | 行高因释义变长而失控 | PASS | 单释义行 94px / 双释义行 121–149px（paper）；释义固定 1–2 条、首条 ≤15 字，最坏情况仍是一屏 5 词 |
| 4 | 对比度 ≥ 4.5:1（小字） | PASS（1 项豁免） | 全站扫描仅 1 处低于阈值：broadsheet **浅色**下**禁用**的「上一批」4.05–4.17:1；禁用控件按 WCAG 1.4.3 属豁免范围，启用态 6.5:1 |
| 5 | 点击目标 ≥ 44×44 | PASS | 24 组 `smallTargets` 均为空 |
| 6 | 无文字截断 | PASS | 24 组 `clipped` 均为空（学习栏标题、词、音标、释义、设置行都查了） |
| 7 | 学习栏放得下三位数批号 | 修后 PASS | **首轮 FAIL**：`第 1 / 770 批` 在 foundry 21px 下换行成两行 → 拆成「第 1」+ 小一号的「/ 770 批」并加 `nowrap`，360 实测单行 |
| 8 | 副标题不截断 | 修后 PASS | **首轮 FAIL**：`四级核心词 · 本批 5 词` 在 foundry 的 104px 里被省略号切掉 → 改「四级 · 5 词」，360 实测完整 |
| 9 | foundry 报头小字不折行 | 修后 PASS | **首轮 FAIL（v4 就有）**：`阶段 · 第 n 批 · N 词` 三段挤在 158px 里折成 2–3 行，顶栏变高把版心推下去 → ≤480px 只留「第 n / N 批」（阶段与词数在工单表里已有），实测高度 16px 单行 |
| 10 | 新页面文案与数据一致 | PASS | 我的 → 词库数据：「ECDICT 1.0.28 · 音标 99.7% · 词频 99.6%」；自定义词库显示「没有词频与考试标签」 |
| 11 | 空状态 / 边界 | PASS | 自定义 3 词时批次为 1/1，今日卡片「学新词 3 个」（受池子限制）；空词库仍走原兜底 |
| 12 | 只用 tokens | PASS | 新增 CSS 只有 `.study-bar__title-total { font-size:0.72em; color: var(--text-tertiary) }` 与 foundry 的媒体查询，无裸色值 |
| 13 | 首屏词条是否像话 | PASS | 四级首屏 government / system / state / might / part；功能词（the / be / and）押到队尾，不再占据头几批 |

截图：`docs/screenshots/v5/` —— `study-360-{paper-light,foundry-dark,instrument-light,broadsheet-light}.png`、
`study-768-paper-light.png`、`study-1440-paper-light.png`、`start-360-foundry-dark.png`、`profile-360-paper-light.png`。

### 必须修（已在交付前修复并回归）
1. 学习栏 `第 1 / 770 批` 在 foundry 21px 下换行 → 主次分档 + `nowrap`，回归单行。
2. 学习栏副标题被省略号切掉 → 收成「四级 · 5 词」，回归完整。
3. foundry 报头小字折行（v4 遗留）→ ≤480px 只留批号，回归 16px 单行。

### 建议修（不阻塞）
1. broadsheet 浅色禁用态「上一批」4.05:1：禁用态可豁免，想更稳可以把 `--text-tertiary` 的禁用色再提一档。
2. 768/1440 下列表到 dock 仍有 200–300px 空档（v2 就记录过），列表可考虑垂直居中。
3. 我的 →「词库数据」是只读信息行，视觉上和可点的设置行同构，后续可换成说明性小卡或并入「导入词表」的下方小字。

### 回归
- [x] 改完重跑 `scripts/audit-vocab.js`：24 组全部 0 溢出 / 0 截断 / 0 小目标，5 词全见。
- [x] 三处修复各补一张 360 截图（foundry 深色学习页、foundry 深色开始页、paper 浅色我的）。

## v4 · 2026-11-24 · 错词本 + 动态新词量 + 上限气泡


审查范围：错词本（列表 / 单测 / 空状态）、首页今日卡片（`↑ +5` 角标与三态文案）、学习日历（今日 hero + 未来格角标）、我的 →「每日新词上限」`?` 气泡 ｜
视口：360×800 / 768×1024 / 1440×900 ｜ 皮肤：paper / foundry / instrument / broadsheet × 浅/深

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 360 无横向滚动 | PASS | 8 组皮肤 × 明暗 `scrollWidth === clientWidth`；768 / 1440 同样为 false |
| 2 | 无文字截断 / 重叠 | PASS | 错词行三行布局（词 + 音标 / 释义 / 次数 + 日期 + 下次复习）在 360–1440 都不截断；长释义单行省略 |
| 3 | 对比度 ≥ 4.5:1（小字） | 修后 PASS | **首轮 FAIL**：`↑ +5` 角标与「错 N 次」徽标原本用 `--accent` 作小字，深色下 3.2:1 / 2.8:1 → 改成 `color: var(--text)` + accent 描边，实测 12.6:1 / 11:1；三档灰字 4.7–6.8:1 |
| 4 | 触控目标 ≥ 44×44 | 修后 PASS | **首轮 FAIL**：`?` 只有 18×18 → 加 `::after { inset: -13px }` 扩到 44×44 热区；错词行整行高 64–72 |
| 5 | 气泡不出视口、贴住触发元素 | 修后 PASS | **首轮 FAIL**：360 下 300px 气泡把右边界顶到 360 → 改为 `position: fixed` + JS 夹取；实测 360：x 44–344；1440：x 486，按钮 x 498（-12px 对齐） |
| 6 | 键盘可达 + 焦点可见 | PASS | Tab 可依次到 `?`（2px 实心环，offset 2px，实测可见）；Enter 展开、Esc 关闭；行是原生 `<button>` |
| 7 | 关闭路径齐全 | PASS | 外部点击 / Esc / 滚动 / 窗口缩放都会收起气泡；`aria-expanded` + `aria-controls` 同步 |
| 8 | 减少动效 | PASS | `prefers-reduced-motion: reduce` 下气泡动画与 `?` 过渡关闭 |
| 9 | 信息层级一致（三档） | PASS | 360 卡片内数字换行 2–3 行、768 起单行，字号与「今日」标签不变；错词列表 360 与 1440 的层级相同，仅 meta 由换行变右对齐 |
| 10 | 只用 tokens | PASS | 新增 CSS 全部为 `var(--…)`，无裸色值；例外仅 `::after` 的 `-13px` 热区偏移 |
| 11 | 状态语义正确 | PASS | 新词量三态：奖励（accent 描边角标）/ 减量（warning 文字）/ 暂停（分「复习未完成 / 逾期过多 / 上限 0 / 已学完 / 词池空」五种原因），按钮文案与原因一致（不再出现「原因是复习没做完、按钮却说新词已暂停」） |
| 12 | 空状态 / 边界 | PASS | 错词本空态有标题 + 说明 + 主按钮；卡片被清扫的词标「已回到新词池」 |

截图：`home-{paper,foundry,instrument,broadsheet}-{light,dark}.png`、`mistakes-*`（同 8 组）、`calendar-360.png`、`calendar-1440.png`、
`hint-360b.png`、`hint-1440.png`、`quiz-360.png`、`mistakes-paper-1440.png`、`e2e-mistakes-hard.png`。

### 必须修（已在交付前修复并回归）
1. 角标 / 徽标小字对比度：accent 小字在深色底只有 3.2:1 → 文字改 `--text`，强调靠 accent 描边（12 组复测均 ≥ 11:1）。
2. `?` 触控目标 18px → 44×44 热区（`::after`），并保留 focus-visible 环。
3. 气泡在 360 下右边界贴屏 → 改 fixed + 视口夹取 + 高度溢出时翻到上方。
4. 首页「新词已暂停」与真实原因不符（复习闸未开也说暂停）→ 文案按 `blockedBy` 分五种，按钮复用同一句。

### 建议修（不阻塞，留给你决定）
1. foundry 皮肤下今日卡片的四个读数在 360 宽度会排到第三行（`↑ +5` 角标加宽所致）；若介意，可把「连续优秀」单独一行或缩短角标为 `+5`。
2. 未来 7 天每格都挂 `↑ +5`，信息重复；可只在「今天」挂角标，未来格靠「预估」标签表达。
3. 错词本列表暂无排序/筛选（目前固定「最后错的在前」）；词多起来后可加「只看待复习 / 按错误次数」。

### 回归
- [x] 修完角标颜色后重截 8 组（`mistakes-*` / `home-*`），无深色低对比。
- [x] 修完气泡定位后重截 360 / 1440，边界在视口内。
- [x] 修完按钮文案后重截首页，`先复习完再学新词` 与原因句一致。

---

## v3 · 2026-11-24 · 调度接 UI 新增四个界面

审查范围：首页「今日」卡片、学习日历、专注学习页（复习/新词/即时复习）、我的 → 每日新词 ｜ 视口：360×800 / 768×1024 / 1440×900 ｜ 主题：浅 + 深

自动核对（6 组 = 3 视口 × 2 主题，每组跑首页/日历/我的三个界面），结果：

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 横向溢出 | PASS | 6 组 `scrollWidth === clientWidth`，全部 false |
| 2 | 文字截断 | PASS | 6 组 `truncated` 均为空 |
| 3 | 正文 / 三级文字对比度 ≥ 4.5:1 | PASS | 浅色 4.99–7.66，深色 5.09–6.86（`.cal-kicker` / `.cal-figure dt` / `.cal-hero__lede` / `.setting-row__value` / `.today-card__reason` / `.stepper__btn`） |
| 4 | 触控目标 ≥ 44×44 | 修后 PASS | **首轮 FAIL**：360 下步进器按钮被 flex 压到 25×44 / 22×44 → 改 `flex: 0 0 44px`，回归实测 44×44 |
| 5 | 360 无拥挤换行 | 修后 PASS | **首轮 FAIL**：「接下来 7 天」被右侧提示挤成两行 → ≤430px 改为标题/提示上下排，回归 h2 单行（33.6px） |
| 6 | 固定作答栏不遮挡内容 | PASS | 360 下 dock 高 77、top 723；内容底 667 |
| 7 | 桌面不浪费宽度 | 修后 PASS | 日历读数块 768 起由 2 列改 4 列 |
| 8 | 只用 tokens，无裸值 | 部分 | 新增 CSS 全部引用变量；例外：`.answer-dock` 的 `backdrop-filter: 12px`、`.flash-card` 的 `min-height: 3.4em`（与既有 app.css 同类写法一致） |

截图：`cal-360.png`（360 深，修前）、`cal-360b.png`（360 深，修后）、`cal-768.png`、`cal-1440.png`。
深色/浅色两套都验过，四套皮肤**只验了 paper**——foundry / instrument / broadsheet 的专属覆盖还没补，见 TODO。

---

日期：2026-11-23 ｜ 审查范围：背单词页、我的页、导入抽屉、重置对话框、空状态 ｜ 视口：360×800 / 768×1024 / 1440×900 ｜ 主题：浅色 + 深色

证据截图在 `docs/screenshots/`：`01-home.png`（360 浅）、`02-study.png`（360 浅）、`03-quiz-peek.png`（360 遮挡+偷看）、`04-me.png`（360 浅）、`05-dark-study.png`（360 深）、`06-tablet-768.png`（768 浅）、`07-desktop-1440.png`（1440 浅）、`08-import.png`（导入错误态）。

> 审查后用脚本对每个视口做了自动核对：横向溢出、正文对比度（WCAG AA）、可点目标尺寸、文字截断。最终一轮四项全部为 0 问题。

## 清单

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 360 无横向滚动 / 文字截断 / 元素重叠 | PASS | 三档 `scrollWidth === clientWidth`；45 字符长单词 + 长音标换行不溢出（压力测试） |
| 2 | 三档视口信息层级一致 | PASS | 360 单列满宽；768 起 640 内容列居中；1440 保持单列（`07` 与 `06` 层级一致） |
| 3 | 长内容不撑破容器 | PASS | 长单词/长释义 `overflow-wrap: anywhere`；词库为空时有空状态，不塌陷 |
| 4 | 固定底栏不遮挡最后一行 | PASS | 360×640 下 10 词 + 多义项滚到底，第 10 行完整可见；dock 含 `safe-area-inset-bottom` |
| 5 | 标题 / 正文字号差距 | PASS | 34 / 26 / 21 / 16 / 13，比例 ≥ 1.25 |
| 6 | 行高与行宽 | PASS | 正文 1.6–1.7，标题 1.15–1.3；中文行宽 20–30 字 |
| 7 | 正文对比度 ≥ 4.5:1 | PASS | 浅色正文 16.0:1、次级 6.9:1、弱文本 4.99:1；深色 15.7 / 7.4 / 5.5（脚本逐元素核对） |
| 8 | 深浅背景都清楚 | PASS | `05-dark-study.png` 与 `02-study.png` 对照；深色强调色 5.99:1 |
| 9 | 语义色使用 | PASS | 朱砂只用于主操作/当前状态；危险操作用 `--danger`；成功/警告未滥用 |
| 10 | 8pt 间距节奏 | PASS | 4/8/12/16/24/32/48/64 变量，区块间距一致 |
| 11 | hover / active / focus / disabled / 空态 | PASS | 全部定义；触屏用 `@media (hover: none)` 去掉粘滞 hover；disabled 降透明且不可点 |
| 12 | 键盘可达、焦点环可见 | PASS | Tab 顺序：返回 → 头像 → 词行（遮挡时）→ dock；`:focus-visible` 2px accent；Esc 关闭浮层并归还焦点 |
| 13 | 移动端点击目标 ≥ 44×44 | PASS | 脚本核对：头像 44、分段控件 44、dock 56、图标按钮 44；`.profile__name` 33 → 44 已修 |
| 14 | 空 / 加载 / 出错 / 无权限 | PASS（N/A 加载） | 无异步加载；空词库有空状态；导入有行级错误提示（`08-import.png`）；无权限场景不存在 |
| 15 | 文案与数字格式 | PASS | 无占位残留；批次 `1 / 14`、数字等宽字体；日期统一 YYYY-MM-DD |
| 16 | 无裸色值 / 尺寸 | PASS（组件级尺寸例外） | 颜色全部走 variables；组件尺寸（44px 触控、52px 主按钮）保留字面值并在 tokens 注释说明 |
| 17 | 组件一致性 | PASS | 两个页面共用同一套按钮、分段、区块标题与圆角/阴影档位 |
| 18 | PWA / 离线 | PASS | manifest 200、SW activated 并控制页面；导航走 network-first，避免部署后拿到旧 HTML |

## 必须修（已在交付前修复并回归）

1. **选中阶段卡的「70 词」对比度 4.47:1**（< 4.5）→ 选中态计数改用 `--text-secondary`，回归后脚本 0 低对比。
2. **昵称输入框高 33px**（触控目标不足）→ `min-height: 44px`，回归后脚本 0 小目标。
3. **头像 36×36、分段控件 38px 高** → 统一到 44px。
4. **深色下 dock「显示」开态几乎不可见** → 新增 `--toggle-on` 变量（浅 `#ece6da` / 深 `#2d2a22`）。
5. **Service Worker 缓存旧 index.html 导致白屏** → 导航请求改 network-first + 缓存版本 `cijian-v2`；浏览器端反注册旧 SW 后回归正常。

## 建议修（不阻塞，留给你决定）

1. **遮挡墨条偏「骨架屏」**：目前是纯色块，有人可能误以为是加载占位。可换成斜纹遮条或加一枚极小的「遮住」图标；现在靠顶部提示与 dock 状态解释。
2. **音标断行**：超长音标（压力测试用 45 字符单词）会在音标中间换行；真实词表几乎不会触发，但可加 `white-space: nowrap` + 横向裁切策略。
3. **桌面端信息密度**：1440 下单列 640px 留白很大，是刻意的「一页纸」取向；若希望桌面更像工具，可加双栏（左列表、右词族/统计）。
4. **首页留白**：居中海报式排版，喜欢的人觉得安静，不喜欢的人觉得空；可加一句每日语料/待复习提示填充。
5. **未做加载态**：当前无网络请求，无需 loading；接入云端同步后需补骨架与失败重试。

## 回归

- [x] 360 浅色：首页 / 学习 / 遮挡 / 我的 / 导入 / 重置 / 空状态
- [x] 360 深色：首页 / 学习 / 遮挡 / 我的
- [x] 768 浅色 + 深色：学习 / 我的
- [x] 1440 浅色：学习
- [x] 键盘：← → 翻批、空格关中文、Tab 焦点、Esc 关浮层
- [x] 持久化：刷新后回到原批次、开关状态保留；重置后进度归零
- [x] 构建：`tsc --noEmit` + `vite build` 通过；`pnpm test:csv` 13 项全过

---

# v2 · 四套皮肤（2026-11-24）

日期：2026-11-24 ｜ 审查范围：paper / foundry / instrument / broadsheet 四套皮肤 × 浅色深色 × 开始页 / 学习中 / 自测遮挡 / 我的 / 外观面板
视口：360×800 / 768×1024 / 1440×900
证据截图：`design-lab/shots/rev-360-*.png`、`rev-1440-study.png`、`v4-*.png`（四肤并排）、`sheet2-*-360.png`（外观面板）

> 自动化脚本跑了 **24 组**（4 皮肤 × 2 明暗 × 3 视口）：横向溢出、5 词同屏、正文对比度（正文/释义/次释义/音标/序号/副标题/控制条状态）、可点目标尺寸。除下方「建议修 3」外全部通过。

## 清单

| # | 检查项 | 结果 | 证据 |
|---|--------|------|------|
| 1 | 360 无横向滚动 / 截断 / 重叠 | PASS | 24 组 `scrollWidth - clientWidth = 0`；45 字符长单词 + 长音标压力测试四肤均换行不溢出 |
| 2 | 三档视口层级一致 | PASS | 四肤同在 760 上限内，768 起居中；`rev-360-*` 与 `rev-1440-*` 对照 |
| 3 | 固定底栏不遮挡末行 | PASS | 滚到底时四肤 `lastRowBottom - dockTop` 全为负（−21 ~ −270）；360 下四肤均完整显示 5 行 |
| 4 | 正文对比度 ≥ 4.5:1 | PASS | 24 组逐元素测量，最低值 4.99（paper 音标/序号 `#6E685B` on `#F6F3EC`），其余 5.5–16 |
| 5 | 深浅都清楚 | PASS | `v4-study-dark.png`；foundry 暗色不再出现白底反相（改为白线+升档底） |
| 6 | 语义色不被挪用 | PASS | 四肤各自只有 1 个强调色，用量集中在当前态/主操作/遮挡标记；危险操作仍用 `--danger` |
| 7 | 8pt 节奏 | PASS | 三套新皮肤均从 `--space-*` 取间距，无自由落值 |
| 8 | hover / active / focus / disabled | PASS | 四肤均定义；`:focus-visible` 2px 描边（paper `#B23A2A`、foundry `#D93A16`、instrument `#A35A00`、broadsheet `#1B2E6B`） |
| 9 | 键盘可达 + 焦点归还 | PASS | 外观面板 Esc 关闭、焦点陷阱生效；关闭后焦点回到触发按钮（真实点击路径） |
| 10 | 点击目标 ≥ 44×44 | PASS | 24 组脚本 0 个小目标；dock 单元 44–60 高，皮肤卡 156×125 |
| 11 | 外观面板 | PASS | `sheet2-*-360.png`：2 列卡片、遮罩浓度随皮肤（0.42 / 0.72 / 0.46 / 0.55）、圆角随皮肤（18 / 0 / 2 / 0） |
| 12 | 无裸值 | PASS | 三份皮肤 CSS 全部以 `[data-skin=...]` 作用域，令牌同名覆盖；`!important` 0 处，未加前缀的顶层选择器 0 个 |
| 13 | paper 未被污染 | PASS | 皮肤选择前 `paper-start/study` 与 v1 截图一致（仅顶栏多一枚外观按钮） |

## 必须修（阻塞交付）

无。24 组自动化 + 逐张人工核对均未发现遮挡、溢出、低对比或小目标。

## 建议修（不阻塞，留给你决定）

1. **宽视口纵向留白**：768 / 1440 下列表结束后到控制条还有 95–270px 空档（instrument 最明显）。可以在剩余空间里让列表块垂直居中，或加一条「本批结束」收尾线把空档变成版式。
2. **foundry 控制条贴屏底**：比 paper 少 8px 内缩，真机上要确认 `safe-area-inset-bottom` 是否留够。
3. **paper 在 1440 需要滚动**才能看到第 5 行（`visibleRows=4`）。这是原版按 27px 单词 + 16px 释义放大后的既有行为，滚到底不遮挡；如果要「永远一屏 5 词」，把 1440 档的单词上限从 27px 收到 25px。
4. **instrument 浅色档辨识度**：深色才是它的本色，浅色更像普通列表；若主要白天用，建议浅色档加回刻度尺与读数块的存在感。
5. **CSS 体积**：四套皮肤使 CSS 从 22.6KB 涨到 88KB（gzip 13.3KB）。当前可接受；若要更省，可把三套新皮肤改成按需 import。

## 回归

- [x] 360 浅/深 × 4 皮肤：开始页 / 学习 / 自测遮挡
- [x] 768 浅 × 4 皮肤：学习
- [x] 1440 浅 × 4 皮肤：学习
- [x] 外观面板：四皮肤下的卡片、明暗分段、选中态
- [x] 我的页：四皮肤下的阶段/批量/释义/外观分区
- [x] 键盘：Esc 关面板、Tab 焦点、← → 翻批、空格关中文（四肤一致）
- [x] 构建：`tsc --noEmit` 0 错、`vite build` 通过（CSS 88.15KB / gzip 13.28KB）、`scripts/test-csv.ts` 全过

## v2.1 修订（2026-11-24）

**改动**：移除自测态顶部提示条 `.study-note`（「已关闭中文 · 点按某一行可以单独查看」）。它一出现就把整个词表往下顶，切换开关时整页位移，代价大于收益。

- 组件：`StudyScreen.tsx` 删除该节点与 `hiddenParts` 计算、`IconEyeOff` 引用。
- 样式：`app.css` 与三份皮肤 CSS 里对应的 `.study-note` 规则一并删除（无死代码）。
- 回归（脚本量 `firstTop`）：四肤切换「中文」开关前后位移均为 **0px**（paper 76→76、foundry 81→81、instrument 129→129、broadsheet 71→71），`document.querySelector('.study-note')` 恒为 null。
- 证据：`design-lab/shots/nonote-{paper,foundry,instrument,broadsheet}-390.png`。
- 构建：CSS 87.09KB / gzip 13.15KB；`tsc --noEmit` 0 错。
