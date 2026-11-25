# NOTES

## 2026-11-25 · v10 全站精修交付（8 皮肤 × 5 界面）+ 三个基线级缺陷 + 中文排印系统性提档

- **用户选定**：A=bento / C=nocturne / D=desk / F=vinyl 继续做全站；**E=deck 作废**（`types/storage/skins/main.tsx` 四处摘掉，CSS 存档 `docs/v8-variants/deck.v1.css`）。
  四套入选皮肤已从「只有首页」扩到**五个界面**（学习流 / 日历 / 错词本 / 我的 / 浮层）；现有四套（paper/foundry/instrument/broadsheet）**首页那句功能介绍已删并重排**。
- **那句介绍是"真删"不是"藏起来"**：`StudyScreen.tsx` 里 `.start__title`/`.start__lede` 两个节点删了（`chineseCount` 导入随之删），`app.css` 两条规则删了 → 8 套皮肤同时不再出现；实测 `hasTitle:false / hasLede:false`。
  副作用：「今日批次」`todayBatchCount` 现在只剩 `.start__spec` 第 3 行一个宿主（顶栏报头 + 读数带各皮肤自己决定要不要显示），谁藏谁负责。
- **三个基线级缺陷（8 套皮肤全中，改一处全站受益）**：
  1. `.stepper` 在 390 被 `.app__main{overflow-x:hidden}` **永久裁掉**：盒 116/89px 而子元素需要 144px，「每日新词上限」的「+」落在 380-424 → 几乎点不到。根因是 `.stepper` 自己的 `overflow:hidden` 让 flex 自动最小尺寸归零。修：`.stepper{flex:none}`。
  2. `.hint__btn` 触控盒 18×18。修：元素本体 44×44 + `margin:-13px` 回收布局，18px 可见点挪到 `::before{inset:13px}`，焦点环/hover 一起挪（否则会在透明大盒上画方框）。**遗留**：`Hint.tsx:7` 注释还写着旧 `::after` 热区。
  3. **中文小字系统性不达标**：基线 92 处「>4 汉字」的文本在 11–13px（`.cal-hero__lede` 13px/23 字、`.mistakes-empty__text` 13px/59 字、`.cal-kicker` 11px…）。修：`app.css` 末尾「v10 排印提档」块 + 四套原皮肤各补一块（它们自己压着工业/报纸小字）。硬 FAIL（<13px）**92 → 0**；剩 38 处 13px 是 `.skin-card__tag` 这类宽度受限的卡片副标，有意保留。
- **审计脚本 `scripts/audit-screens.js`（新，跨界面用）自己有四个洞，修完才看见上面第 1 条**：
  ① 「祖先横滚就跳过出列检查」遇上 `.app__main` 计算值 `overflow-x` 恒非 visible → **整站出列检查长期失效**（v9 那些 `nOut:0` 是假的）；② 裁切盒不分轴 → 纵向可滚被当裁切，页脚 44px 按钮报成 39px；③ 裁切盒漏返 `top` → CTA 判据 `NaN >= 60` **恒判失败**；④ 44 无亚像素容差 → 43.6px 假阳性。
  现在按轴分：横向 `hidden|clip`=永久裁掉（缺陷）、`auto|scroll`=可滑到（豁免），触控取可见盒 ∩ 元素盒 + 0.5px 容差。**跑之前必须复制到 `C:\Users\xiao\.dsh\mcp\playwright-mcp\scripts\`**（`filename` 参数按 MCP 的 cwd 解析，不是工作区）。
- **半透明叠半透明 = 对比度陷阱**：broadsheet 外观卡文字 2.15 → 3.45 → 7.85，两轮才找对根因（`.skin-grid{background:var(--border)}` 是 rgba + 选中卡 `--accent-weak` 也是 rgba，两层叠在页底上）。**结论：面板底色别用半透明 token，或按叠色后的真实底色算对比。**
- **流程教训（重要）**：子代理会「回报很详细但一个字节没写」——第一轮 8 路全空，mtime 验证过。第三轮起派单加两句硬约束：**「第一个工具调用必须是 `edit`，不许先输出计划」** + 回报必须附 `Get-ChildItem <file> | Select-Object Length,LastWriteTime`。落盘率 0/8 → 8/8。
  另外整文件 `write` 会顶掉别人同期手工补的块（nocturne 覆盖了我加的 §12 段）→ **同一文件只允许一个写者**，被覆盖后必须重新全量审计。
- **实测状态**：216 组矩阵（390 档 8×2 主题×7 界面=112、360×640 40、768 32、1440 32）**0 失败**；`tsc` 0 错；截图 65 张在 `docs/screenshots/v10/`，报告 `DESIGN_REVIEW.md` v10，规约 `docs/SCREEN_SWEEP.md`（含 §6 落盘结果表）。
  **学习数据没被污染**：`cards:0 / mistakes:0 / 已学 000 / 未学 3846`；session 档每次「进入→截图→退出本次学习」都比对 `cijian.v1` 全文（`dataKept:true`）——列表阶段本来就不落库（`SessionScreen.tsx` 头注释第 7 行），可以放心截图。
- **仍未做**：首页 `.empty`（无词库）与学习流的即时复习/总结两相没截图（要落库）；`desk`/`vinyl` 的底部常驻带在日历与「我的」两屏没有 DOM 宿主；顶栏缺 `env(safe-area-inset-top)`（既有基线）；broadsheet 声明 3 个字族（既有）；**这批改动全部未提交**。
- **下一步**：等用户点收哪套 / 是否提交 / 要不要把 13px 卡片副标也一刀切到 14px。

## 2026-11-25 · v10 决策已定（用户拍板四条 + 三条附加要求），执行顺序：commit A 先落，commit B 做 DOM 分支

- **① desk / vinyl 补 `.readouts` 宿主：批准，但有硬条件**（这是 commit B，**不许混进当前基线**）：
  只在对应皮肤激活时渲染，或在 `src/lib/skins.ts` 的皮肤配置里加 `persistentReadouts: true` 开关，**其余 6 套 DOM 里不能出现该节点**；
  内容必须与首页 `.readouts` **同源复用**（同一份 `allowedNew / todayBatchCount / learnedCount`），不准另造数据源；
  回归矩阵要新增「日历 × 我的 × 8 皮肤 × 明暗」，覆盖溢出 / 真实底色对比 / 可见触控盒 / 出列裁切 / snap 内衬；
  360 宽允许降级成单行紧凑态，但**必须在皮肤 CSS 里显式写**，不能靠裁切糊过去。
- **② `.skin-card__tag` 保持 13px，不一刀切 14px**：理由=171px 宽下 14px 会两行、破坏卡片节奏、面板要多滚。
  前提要做：**逐个扫**，凡内容 >4 个汉字的单独提字号或改短文案（`skins.ts` 里的 tagline 是文案宿主，改短算改数据不算改 DOM）；若全是 ≤4 字则 13px 定稿。
  ⚠️ 实测现状：tagline 普遍 9–13 个汉字（「暖纸台面、常驻深色抽屉、768 真侧栏」），**不是 ≤4 字**，所以要逐个处理，不是直接定稿。
- **③ 新用户一次性引导：暂缓**（用户不同意现在做，等后面再谈）。首页那句介绍保持彻底删除状态。
- **④ 提交策略**：commit A = 当前已验证稳定点（两个基线 bug + 审计脚本修复 + 五屏精修 + 四套重排 + deck 作废 + 65 张截图）；commit B = 第①项 DOM 改动，独立回归、独立回滚粒度。
  commit A 的 message 要点：`fix: stepper + 按钮裁切（flex:none，8 套同修）` / `fix: 中文小字 92 处硬失败归零` / `fix: 审计脚本豁免逻辑失效（v9 nOut:0 作废）` / `feat: 五屏精修 + 四套首屏重排` / `chore: deck 作废，存档 docs/v8-variants/deck.v1.css`，
  并且**必须把证据链写进提交说明**：24 次 `dataKept:true`、`cards:0 / mistakes:0`、216 组矩阵、`tsc` 0 错。
- **附加要求 A（探针逻辑要真修，不是打补丁）**：出列检查的豁免条件从「祖先 `overflow-x` 计算值非 visible 就跳过」改成
  **「只有存在真正可滚的祖先（`scrollWidth > clientWidth` 且该轴 `overflow` 是 `auto|scroll`）才豁免」**；
  `overflow-x:hidden` 造成的裁剪**本身就是出列问题，不能豁免**。修完 **v9 报告整体作废**，重新生成基线数字。
- **附加要求 B（学习流两相不许裸奔）**：即时复习 / 总结页可以继续不截图（要答卡才进得去、会落库），
  但回归**至少要加 DOM 级检查**：可见触控盒、文字截断、对比度。以后要截图的话：Playwright `storageState` 注入 + 测后恢复，
  或接受污染后用 localStorage 快照回滚——**两种都必须在报告里显式标注**。
- **当前状态**：deck 已作废、浏览器已复原 `paper / 浅色`、`tsc` 0 错、学习数据未污染。dev 5173 = job `pwsh-f6673db976c64f51`。




## 2026-11-25 · v10.1 重基线：存储其实有两个键（大坑）、探针第 5 洞、中文小字清零

- **⚠️ 最重要：学习状态不在 `cijian.v1`，在 `cijian.scheduler.v1`**（44KB：`cards / unlearned / days / mistakes / immediate / pendingLimit / lastSettlement`）。
  `cijian.v1` 只有 `profile`（皮肤/主题/阶段/批大小）和 `session` 开关。之前所有「dataKept:true、数据没污染」的结论**只比对了前者，等于没守住**。
  为补「即时复习/总结」两相的 DOM 检查必须答卡 → 真把今天 20 个词学掉了。已按 `learnedOn` 把卡退回 `unlearned` 队首 + 清 `days[today].newLearned` + 归零 `immediate` 计数，
  复核 `cards:0 / unlearned:3846 / newLearned:0 / mistakes:0`、首页 `今日20 / 批数04 / 已学000` 复原。**两个审计脚本现在同时快照-还原-校验两个键。**
- **回滚的正确姿势（可复用）**：`days[day].newLearned` 就是当天按 `unlearned` 从头取走的那批，所以「把它们 concat 回 `unlearned` 队首 + 从 `cards` 删掉 `learnedOn===day` 的项」是精确逆操作。
  跑答卡的脚本（`scripts/audit-phases.js`）**备份前先 scrub 一次**——被超时打断后直接还原备份只会还原到脏状态（本轮踩过：`restored:true` 但 `cards:10`）。
- **探针第 5 个洞**：祖先 `display:none` 时后代的 computed `display` 仍是 `inline/block`，**只有 `getBoundingClientRect()` 归零能证明没渲染**。
  漏这行会把隐藏节点报成违规：instrument 首页 `.topbar__meta` 被 `.app:has(.start) .topbar__meta{display:none}` 藏了，却被 scan-tiny 报成 10px 硬失败。
- **豁免逻辑真修（用户要求）**：出列检查只豁免「`(auto|scroll)` 且 `scrollWidth > clientWidth`」的真可滚祖先；`overflow-x:hidden` 的裁剪本身就是缺陷。
  另加纵向判据 `nOutY`（全站 0）。**v9 报告整体作废**（它的 `nOut:0` 是在坏探针下测的），DESIGN_REVIEW 里已标注。
- **新基线数字（以此为准）**：272 组 0 失败 = 390×明暗×8 界面×8 皮肤 128 + 360 48 + 768 48 + 1440 48；
  学习流两相 16 组 × 2 相 = 32 次 DOM 探针 0 失败；`warnTiny` 92→38→**0**。
- **`.skin-card__tag` 按用户第 2 条决定处理**：不一刀切 14px，而是把 8 条 tagline 改成**四字格**（暖纸·朱砂 / 硬边·印章 / 琥珀·等宽 / 栏线·靛蓝 / 冷灰·磁贴 / 墨蓝·月光 / 洋红·唱片 / 抽屉·侧栏），
  ≤4 汉字不触发硬线 → 13px 定稿。改的是 `src/lib/skins.ts` 文案。其余 >4 汉字的 13px 逐个提 14px（foundry `.parse-summary` 11→14 且深色 tertiary 4.47 换 secondary、nocturne 三处、desk 三处吃 `--fs-small`、paper `.today-card__label`、基线 `.session-done__note`）。
- **Vite 会漏 `edit` 工具的写入**：改完 CSS/TS 浏览器计算值仍是旧的（nocturne 两处、skins.ts 第 8 条都中招），文件其实已落盘。
  处理 = `(Get-Item file).LastWriteTime = Get-Date` 强制失效再复测。**改完样式复测前先 touch，别信「改了没生效」。**
- **相位脚本三个自坑（都修了）**：`waitForSelector` 超时不能当延时（整轮被杀）；`querySelectorAll` 文档序「模糊」在「认识」前面，点模糊会回队尾永远考不完；
  即时复习是**每 10 个一组**，组清空会退回 list 相位读下一批 → 两种推进键都要戳。
- **状态**：commit A 落这批；commit B（`persistentReadouts` 补 desk/vinyl 两屏常驻带）待做。浏览器已复原 `paper / 浅色`，临时键 `__bak_* / __p_*` 已删；截图 69 张在 `docs/screenshots/v10/`（48 张本轮重拍）。

## 2026-11-25 · v9 三版结构级重做（desk / deck / vinyl）交付，五条 CSS 陷阱记牢

- **产出**：新增 `src/styles/skins/{desk,deck,vinyl}.css`（案头＝768 真侧栏；叠章＝sticky 压栈遮挡；唱盘＝横向唱片轮 + 底部常驻读数带）；
  `play` 作废（`types/storage/skins/main.tsx` 四处摘掉，CSS 存档 `docs/v8-variants/play.v1.css`）；`bento`/`nocturne` 按用户要求保留。
  三版都删了首页功能介绍（`.start__title/.start__lede` `display:none`）。24 组矩阵 failCount 0，报告 `DESIGN_REVIEW.md` v9，图 `docs/screenshots/v9/`（72 张）。**仍未提交**。
- **这轮学到的五条硬陷阱（比结论更值钱）**：
  1. **`position:absolute` 只能锚祖先，不能锚兄弟**。`.start__actions` 与 `.today-card` 是 `.start__body` 的同层兄弟，把药丸 absolute 到「卡片右端」→ 包含块退到视口，实测 `y=-2`（按钮整个看不见）。
     正解：`display:contents` 把两层壳拆开，让两者成为**同一个网格的同层成员**，用 `grid-row/column` 摆放。
  2. **`scroll-snap-type:x mandatory` 会把滚动容器的 `padding-inline-start` 滚掉**（实测 `scrollLeft=20`、计算值 `padding-left:20px` 却贴屏边）。必须同时写 `scroll-padding-inline-start/-end`。
  3. **网格叠放要同时钉 `grid-row` 和 `grid-column`**，只钉行会让 auto-placement **新开一条隐式列**（实测 `cols: 429.6px 118.4px`，hero 被挤成窄条）。
  4. **`skin-hooks.css` 的默认 `display:none` 会压死皮肤里忘记显式打开的块**——批数 `todayBatchCount` 是「只有首页才有」的数据，漏写一次 `display:grid` 就等于全站丢失。任何被钩子默认关闭的结构，要用就要显式翻面。
  5. **底色画在伪元素上，对比度审计读不到**：祖先背景链只走真元素的 `backgroundColor`，轨内浅色文字被按页面底色算成 1.0:1 误报。画在真实元素上既避免误报又少一个定位伪元素。
- **审计脚本 `scripts/audit-skins.js` 这轮加了四个探针**（都是被真 bug 逼出来的）：CTA 必须**完整**在滚动口内且不被 topbar 裁（旧判据对负 top 恒真）、块间空洞 >140px、横滚容器静止态 `scrollLeft>1`、出列检查跳过横滚容器内的子元素（vinyl 第 4 盘「半切」是有意 affordance，不是溢出）。
- **结构级差异的判据**（用户否掉「换色」后立的）：阅读轴 / 首屏焦点物种 / CTA 锚点 / chrome 是否移动 / 首页数据量 / 阴影语言 / 强调色，七条轴至少各占一条。详见 `docs/SKIN_CONCEPTS.md` v9 段与 `docs/research2/`（13 份跨领域笔记 + 三路收敛）。
- **下一步**：用户从 5 套候选（bento / nocturne / desk / deck / vinyl）里选定后，把**剩下五个界面**按同一语言精修；
  顺手可议：① 现有四套是否也删首页介绍（改 `app.css`/DOM，需批准）② 首启一次性引导替代它 ③ 提交这批改动。
- **当前交接态（2026-11-25 上午，已交付等用户选）**：三版均已注册可切（外观面板 9 张卡，390 两列 / 768 四列）；
  浏览器数据复原 `paper / 浅色`，`unlearned 3846 / cards 0 / days 2`；dev 5173 = job `pwsh-f6673db976c64f51`；
  `git status` 有 6 个 M + 3 个新 CSS + `docs/research2/`(13 份) + `docs/screenshots/v9/`(72 张) + `scripts/audit-*.js`，**全部未提交**。



## 2026-11-25 · v8 三版新皮肤交付 + 用户否掉「换色式」设计，要再来三版

- **已交付**：新增三套皮肤 `src/styles/skins/{bento,play,nocturne}.css`（磁贴/燃点/夜航），**现有四套与 `app.css`、组件 DOM 一行未改**，
  走原 `[data-skin]` 机制叠加；注册面 5 处：`types.ts` 的 `Skin` 联合、`skins.ts` 的 `SKINS`（含 swatch/darkBg/tagline）、
  `storage.ts:61` 的 SKINS 白名单（**漏这里会导致 `profile.skin` 被清洗回 paper，切不过去**）、`main.tsx` import、
  `SkinSheet.tsx` 说明文案改取 `SKINS.length`（原来写死「四套」）。
- **审查**：`scripts/audit-skins.js` 跑 3 皮肤 × 明暗 × 360/768/1440 = 18 组，溢出/对比度/44px/中文小字/出列 **全 0**，
  CTA 18/18 在首屏；报告 `DESIGN_REVIEW.md` v8，截图 `docs/screenshots/v8/`（34 张）。**改动未提交**。
- **用户反馈（下一轮的硬要求）**：① 首页的 slogan「一页五个词，看一遍就会。」+ 玩法说明段**必须删掉**——
  没有产品把功能介绍长期挂在首页，只在首次使用介绍一次；② 这三版被判定「基本是同一个 UI 换个色」，
  **每版必须有自己的信息架构与版式骨架**，首页不必展示全部数据，多出来的指标可以挪到别的页面；
  ③ **保留 A `bento` 与 C `nocturne`**，再重新设计三版（候选总数 5）；④ 调研要**跨领域**，别只看背单词 App。
- **本轮踩到的坑（别再踩）**：
  - 皮肤层不许改 DOM，所以「删文案」= 在新皮肤里 `.start__title/.start__lede { display:none }`，现有四套不动。
  - **同一个数字同屏报多次**是 Anki 26.10 被社区要求回滚的原罪（bento 一度报了四次「今日 20」）；
    静态装饰（刻度尺 / 7 点链 / 额度点阵）**不许长得像进度**——实心 accent 段会被读成假完成度，一律改淡灰装饰色。
  - dev server 会喂**旧 CSS**（`node_modules/.vite` 缓存，源码对了运行是旧的）：`Stop-Process` + 删缓存 + 重启才可信。
    当前 dev 5173 = job `pwsh-f6673db976c64f51`；preview 4173 仍是上个会话遗留的进程（不在 job 列表，只能 Stop-Process 重起）。
  - 测皮肤必须**先导航到同源非 App 页 `/icon.svg` 再写 `cijian.v1.profile.skin`，然后导航回 `/`**；
    在 App 页直接写会被 `pagehide` 的内存态回写覆盖。`audit-skins.js` 里直接改 `<html data-skin>` 不触发重渲染，快但只适合截图审查。
  - **别在浏览器里点「开始背单词」**（`mouse.down/up` 也算点击）——会真的进入学习会话；误进了用「退出本次学习」零入库退出。
- **下一步**：跨领域 UI 调研（健身/金融/音乐/阅读/天气/效率/游戏菜单/硬件品牌等）→ 定三版**结构不同**的方向 →
  写 `docs/SKIN_CONCEPTS.md` v2 段落 → 三个子 agent 各写一个 CSS → 全矩阵审查 + design-review。
  规约与技术约束文件：`docs/SKIN_CONCEPTS.md`、`docs/SKIN_BRIEF.md`（DOM 清单 + 令牌清单 + 硬指标，可直接复用）。


## 2026-11-24 · 收尾：待机维护状态锁更新——HEAD `4d1f381`

- **提交链**（`dc33008` 之后）：`4d1f381` 日历格子信息层级重构（真机报的视觉误导，见下一条）。
  仍全部是「报 Bug / 点名小功能」例外，没有主动推的功能；工作区干净（`git status` 空）。
- **服务器（都挂着，别关）**：dev `http://127.0.0.1:5173`、preview `http://127.0.0.1:4173` 两端口实测在监听。
  **注意**：这两个进程是上个会话启的，已不在本会话 job 列表里（老 job id 失效），要重启只能 `Stop-Process` + 重新起，别用 job 工具找它们。
  dist 已重建并核对过 preview 拿的是新 chunk（`assets/index-ChMXrLY5.js`），手机刷新 preview 即生效。浏览器测试数据已清空。
- **tag 规则不变**：`v1.1.0-beta.1` 等用户真机跑完 200 个专业词、亲自发话再打，别自作主张。
- **即时复习卡片现行口径**（真机若再报手感问题从这里核对）：居中版式（单词→音标→释义，释义直显）、
  两键【模糊/认识】、模糊回队尾 3 次标 hard、dock 在应用列正常流（禁 fixed/100vw）。
- **日历现行口径**：见 `REFACTOR_PLAN.md` §6 + 下一条；真机再报「数字看不懂」先照那七条核对，不要在前端自己拼数字。

## 2026-11-24 · 日历格子信息层级重构（真机反馈：复习量被藏在小字里）

- **现象**：学完 20 个新词当天看日历，明天那格只有灰色小字「1天前 11月24日 · 20 词」说复习量，同格「新词 20」反而是显眼标签，头部还挂无标签的 `0 / 20`——读起来像「明天不用复习」。
- **修法**：新增负荷行 `.cal-day__load`，槽位顺序恒定 `复习 → 逾期 → 新词 → ↑+5 → 长期`；复习槽最重（`--fs-load` 14px + 700 + accent 描边/圆点/弱底），新词降为中性描边。批次行降级成「来源小字」，`cal-day__count`（裸分数）整个删掉。口径与测试在 `copy.ts: calendarDayLoad/calendarReviewNote` + `test-scheduler §12`（21 条）。
- **规则**：未来日（`estimated`）**永不显示完成度**，只报计划总量；复习为零要占位显示 `复习 —` + 一句「做完前面的复习才会排进来」，不留空格。「接下来 7 天」标题旁加了 `?` 气泡（`Hint.tsx`，从 ProfileScreen 抽出来的共用组件）。
- **坑 1**：`CalendarDay.overdue` = 这天到期没做完的词，**不是**跨日欠账（跨日在 `plan.totals.overdue`）。旧格子因此同时显示 `0/20` 和「逾期 20 词」自相矛盾——现在逾期槽只在 `isPast` 渲染。
- **坑 2**：foundry / broadsheet 的**深色档漏写 `--warning`**，浅色档那条（权重 0,1,0、后加载）盖住 tokens 的深色值 → foundry 深色 2.74:1、broadsheet 深色 1.01:1（等于看不见）。和 v6 那个 `--danger` 是同一个坑：**以后每加一个语义色，四肤 × 明暗八档都要写齐**，别只写浅色。
- **审查**：`scripts/audit-calendar.js`（`localStorage.__audit_vp` 指定单档，24 组一次跑会顶破 MCP 30s 超时）；首轮 2 组 FAIL 修完回归 0 失败。截图 `docs/screenshots/v7/`。
- **下一步**：待机规则不变。`scripts/fixture-calendar.ts` 造两份 fixture（第一天 / 40 天老用户），**跑完会往 `public/` 写 `__fixture-*.json`，必须删掉再 build**，否则打进 dist。

## 2026-11-24 · 即时复习卡片改居中版式（用户点名）

- 版式：单词正中 → 音标 → 释义（直显、不遮蔽），专属修饰类 `.flash-card--centered`，
  **复习三键卡片完全不受影响**（仍是左对齐 + 轻点揭义），实测两态互不污染。
- 字号自适应：单词 `clamp(26px, 7vw, 40px)`、释义 `clamp(14px, 4vw, var(--fs-meaning))`；
  360 下单词中心偏差 0px、1440 下相对应用列居中偏差 0px；长专业词换行不裁切、无横向滚动。
- 规则修订：原「即时复习只给英文+音标不渲染释义」作废，REFACTOR_PLAN.md §1/§UI 表已同步。
- 截图 `docs/screenshots/v6/immediate-centered-360.png / -1440.png`。

## 2026-11-24 · 真机反馈修复：即时复习 dock 溢出 + 两键改【认识/模糊】

- **溢出根因**：`.answer-dock` 原来是 `position: fixed; inset-inline: 0`——按**视口**撑宽，
  而 `.app` 是 `max-width: 760` 居中列；桌面窄窗口（768–900px）dock 两侧各捅出列外约 30px，
  真机上被感知为「撑破屏幕/截断」。修复：改回正常流 `flex: none; width: 100%; box-sizing: border-box`
  （它本来就是 `.app` flex column 的直接子元素，和列表阶段 `.dock` 同构）。**别再把它改回 fixed/100vw**。
- **两键文案**：即时复习左键【不认识】→【模糊】（更贴合刚学完的体感），逻辑零改动——
  仍回队尾循环、3 次标 hard、明天进 1 天批次。样式改用 `answer-btn--fuzzy`（中性描边，去掉 ✕）。
- **两键/三键隔离**：dock 加修饰类 `answer-dock--review` / `answer-dock--immediate`；
  复习三键（不认识/模糊/认识）与即时两键（模糊/认识）的 DOM 与选择器互不影响，实测 360 两态标签正确。
- **附带**：`.flash-card__word` 加 `overflow-wrap: anywhere`——200 个专业长词不再被裁；
  `.answer-btn` 加 `min-width: 0` 防文案撑爆。320/360/820/1440 四档实测 docScroll==innerWidth。
- **回归**：tsc 0 错、test-scheduler 全过、build 过（dist 已重建，preview 4173 直接生效）；
  浏览器全流程实测「模糊」回队尾正确。证据 `docs/screenshots/v6/immediate-fuzzy-360.png`。

## 2026-11-24 · 收尾：v1.1 + 引擎重置完成，进入待机维护（锁定 6bd5d5b 之后的 HEAD）

- **新增（用户点名的小功能）**：设置页最底部「清空所有学习数据」——危险红样式 + 二次确认弹窗。
  引擎方法 `Scheduler.resetLearning()`：清 `cijian.scheduler.v1` 的卡片/复习队列/错词本/历史/结算/统计，
  **保留**每日目标、上限（含钉住）、新词顺序、词频表；App 层重置完立刻 `seed(当前词库)` 灌回池子。
  实测：重置后首页「今日 20 / 已学 0」、池 27、错词本 0，像新用户。测试 §11.8 覆盖。
- **v1.1 统一学习流已实测闭环**（见下一条）：端到端 + 三个退出场景 + 硬词 3 次上限 + design-review v6 全过。
- **服务器（都挂着，别关）**：dev `http://127.0.0.1:5173` job `pwsh-6d628cb48fd046cf`；
  生产 preview `http://127.0.0.1:4173` job `pwsh-12264c6efd4940bc`（dist 已含重置功能的新构建）。
  浏览器测试数据已清空，真机数据在手机上互不影响。
- **待机规则（用户定死）**：不再主动推功能；只有报 Bug / 点名小功能才动代码。
  **tag `v1.1.0-beta.1` 等用户真机跑完 200 个专业词、确认手感后由用户亲自发话再打**，别自作主张。
- **用户下一步**：导入 200 个专业词（走 `docs/IMPORT_WORDS.md` 的导入，不要手改 `src/data/*.json`），真实体验几天遗忘曲线与完成判定。
- **坑（重置相关）**：`resetLearning()` 后必须重新 seed——池子空着当天就没新词可发，且 `plan()` 会把这天结算成 0 落盘（老坑的变体）；
  App 的 `resetEngine` 里 run 回调是「reset + seed」两步原子，别拆开。

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
