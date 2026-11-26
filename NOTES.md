# NOTES

## 2026-11-26 · APK 1.1 重打（含轮次模型 + 备份 + 回队尾）——直接可装

- **产物**：`out/cijian-1.1.apk`（1.06 MB，versionCode **2** / versionName 1.1），同目录 `cijian-1.0.apk` 是旧包（11-25，versionCode 1），别装错。**覆盖安装即可，进度不丢**——1.0/1.1 签名证书 SHA-256 都是 `bee17fe6…6984`。
- **这一版比 1.0 多什么**：即时复习轮次模型（`215db47`）、进度导出/导入（`379c7f6`+`7406518`）、正式复习回队尾（`bfd8ca7`+`df04e24`）。
- **怎么验的（实物，不是感觉）**：APK 28 个条目、`dist/` 21 个文件**逐个 SHA256 与包内相同（0 不一致）**；`assets/index.html` 引用的新哈希 `index-KglkUNTR.js` / `index-DuMee3km.css` 都在包内；`apksigner verify` v2+v3 通过；`aapt dump badging` → versionCode 2 / versionName 1.1 / minSdk 24 / targetSdk 34 / label「词笺」。**未上真机**（等你装）。
- **坑（新）**：`aapt.exe` 不认中文路径 —— 直接 dump `D:\背单词\out\*.apk` 报 `Illegal byte sequence`，要先复制到 ASCII 临时路径。`apksigner` / `zipalign` 不受影响。
- **下次发版**：`versionCode` 再 +1（现在 2）、`versionName` 随你、复用 `out/cijian.keystore`；流程见 `docs/ANDROID_APK.md`（已更新 1.1 的事实与上面这条坑）。

## 2026-11-26 · 正式复习回队尾（`bfd8ca7` + `df04e24` + `3549535`）——引擎零改动

- **交付**：点「不认识 / 模糊」后词插回「短期 + 长期之后、逾期池之前」再问，直到点「认识」或同一词今日满 3 次；排程 / 准确率 / 错题本只认首次。改动面只有 `SessionScreen.tsx`（+45 行），`engine / cards / plan / storage / types / backup` 一行未动。
- **为什么能零改动**：`lastReviewed === day` 本来就拒绝二次计分，`answer()` 会自动降级 `isRetry`；该分支在 `record.retried += 1` 后立即 return，位置在所有写入之前。回看所需的一切都在 UI 会话内存（`QueueItem.attempt` + `ReviewQueue{items,end}`），不进 schema、不碰备份链路。
- **两个必记的坑**：① **注入数据前必须删 `days[today]`** —— runner warm-up 已给今天拍过 `snapshotDone:true` 的空快照，不删则 `dueSnapshot` 恒空、完成率分母为 0（第一次 E2E 就是因此报 0）；② **逾期词不进 `dueSnapshot` / `doneToday`**，完成率分母只认 `due === today` 的短期批次，所以断言是 2/2 而不是 3/3（规约 §9.2 原写错，已修）。
- **静默是硬要求（D4）**：无「回看 n/3」、无 toast、回看词 `outerHTML` 与首次逐字节相同；唯一痕迹是总结页「重试 N」（`retried` 必然计入，不额外区分）。
- **实现坑**：插入必须在「是否到头」判断之前，否则最后一个词答错会直接收尾；逾期段游标已越过回看带时插到 `index+1`（否则静默丢词，这是唯一自洽解）。
- **连点保护（`df04e24`）**：按钮不禁用，一次快速双击会在同一帧命中同一张卡两次 → 插两条回看项，同一个词变 4 次。按 `index` 加 `answering` ref 去重（index 只增不回，不会锁死）——所有「点击后异步改队列」的界面都要这条。
- **工具坑（本轮又添一条）**：不要用 PowerShell `-replace | Set-Content` 改写含中文的 md —— 会把整份文件写成乱码（本轮把 727 行的 NOTES 写成 225 行，只能 `git checkout --` 回滚）。改文本一律走 edit 工具；PowerShell 只用来跑命令、数字数。
- **证据**：单测 489 条全过（新增 §14 十二组，含整卡 / 整天深比较）；`tsc` 0 错；`vite build` 过；E2E 13 条断言全绿 + `--selfcheck` 退出码 1；三哈希 before = restored = `4B70AB85…`、afterRun = `D415468D…`（`docs/evidence/review-requeue-2026-11-26.json`）。
- **已知口径**：中途退出 = 剩余回看丢弃（排程已定，不丢数据）；退出重进不会绕过 3 次上限（首次作答必然把 `due` 推到 ≥ 明天）。
- **下一步**：仍按上一轮收尾——真机背一周后只回答三件事（哪天想放弃 / 哪一步最烦 / 哪个数字看不懂），代码暂停。

## 2026-11-26 · 收尾：工具链收口（代码工作暂停，等真机用一周）

- **收口点**：`923417d`，本地 == 远端，工作树干净。闭环齐了：能背 → 能复习 → 能纠错 → 能备份迁移。本轮两件大活都在上面两条里（轮次模型 `215db47`、备份 `379c7f6`+`7406518`），别重读代码猜。
- **代码工作到此暂停**：不再加功能。下一轮输入只能来自真机——手机每天 20 个背一周，回来只回答三件事：**哪天想放弃 / 哪一步最烦 / 哪个数字看不懂**。
- **下次开工**：先读本文件顶部两条，再决定是修体验还是修数据；动手前仍按「先规约、后代码」。
- **已知缺口（上面条目里有原文，这里只列名字）**：备份 UI 未做 8 皮肤 × 2 主题回归、loading 态未截图、demo 弧线未固化基线、11-25 的数据锚点实物已不可复核。
- **⚠️ 装真机前要做**：`out/cijian-1.0.apk` 是 **11-25 的包**，不含本轮轮次模型与备份功能——要重新跑 `scripts/build-apk.ps1`（`versionCode` +1、复用 `out/cijian.keystore`，否则装不上或覆盖不了）。
- **环境**：dev 5173 还开着（job `pwsh-971ea03ded1d4508`）；`dist/` 已是最新代码构建。

## 2026-11-26 · 进度导出/导入（`379c7f6` + `7406518`）——工具链到此收口

- **交付**：「我的 → 数据备份」两个按钮。导出 `cijian-backup-YYYY-MM-DD.json`（`version: 1` / `app: cijian` / `profile` / `custom` / `scheduler`）；导入走 选文件 → 校验 → 二次确认 → 写入 → 刷新。
- **两个硬口径怎么落的**：① 二次确认用既有 `ConfirmDialog`，文案报出备份里的卡片 / 未学词 / 错词 / 词库数；E2E 断言「浮层出现时 localStorage 一个字节没变」，点确认后才写。② 原子拒绝：`validateBackupText` 全量校验通过才 `applyBackup`；写入先算好两个键的字符串，任一 `setItem` 抛错就**回滚两个键**再抛；单测覆盖「拒绝时零写入」「写一半失败回滚」。
- **⚠️ 抓到的真 bug（以后别再踩）**：点确认后 `location.reload()`，而应用在 `pagehide` 会把**内存里的旧状态**写回 localStorage，正好盖掉刚导入的数据（E2E 实测 `groups` 从备份的 0 又变回 7）。修法：导入前挂 `cijian.importing` 一次性闸门，`useScheduler` 的 `flush` 与防抖存盘见到就不写，新页面 boot 时清掉。**任何「先写 storage 再 reload」的路径都要走这套。**
- **custom 词库的最终决定：带上**。它就在 `cijian.v1` 里（`Store.custom`），和 `profile` 同键不同字段——`379c7f6` 只取了 profile，等于导出了**半份备份**。**version 不 bump**（可选字段，旧 v1 备份读到 null 按「保留本机词库」处理）；导入三条语义写死：备份有本机没有 → 写入 / 本机有备份没有 → 保留不删 / 两边都有 → 备份覆盖。体积实测 200 词 ≈ 41 KB（含调度数据），不设上限。
- **design review 的覆盖缺口（如实记）**：备份 UI 只抽查 **390 浅色档**；`--danger` 与 `.section__hint` 复用 v10 审计过的组合，**未做 8 皮肤 × 2 主题回归，接受为已知缺口**。loading 态**未截图**，仅代码路径确认（`disabled` + `aria-busy`）。截图 `docs/screenshots/v12/`（3 张）。
- **证据**：`test:backup` 49 条断言全过；`tsc` 0 错；`test:scheduler` 459 条全过；`vite build` 过；E2E（隔离 context）导出 / 坏文件拒绝 / 确认后覆盖 / 词库恢复 / 双键 SHA256 全绿。
- **下一步：别再写代码。** 工具链齐了（能背、能复习、能纠错、能备份迁移）。接下来是使用者的事：手机上按 APK 装好，每天 20 个背一周，回来只说「哪里难用」——那才是下一轮的输入。

## 2026-11-26 · 即时复习改轮次模型（`215db47`）+ 数据锚点核不了的诚实记录

- **交付**：`fix(immediate)` 单 commit，13 文件 / +1319 −123。状态机改 `schema: 2`（`round / fuzzyThisRound / crossRound / fuzzyCount / hardWords`，删 `loopCount`）：模糊 = 本轮再出现一次 → 第 2 次跨轮 → 下一轮；累计 3 次进错词本但**不出队**；第 5 轮强制收口标 hard。连带修两个 bug：`inMistakes` 时序（记账跑在建卡之前 → `hard=true` 而 `inMistakes=false`）、长期档 fuzzy 的 flag 与账本矛盾（D2-A：只有 unknown 记账）。
- **证据**：459 条断言全过（§13 新增 65）、`tsc` 0 错、build 过、bench <50ms；隔离 context E2E 双键 SHA256 跑前跑后相同（`71DDC852…`/`4B70AB85…`）+ `--selfcheck` 退出码 1；`audit-phases` 8 皮肤×2 主题 16 组 `failCount 0`。证据 `docs/evidence/immediate-rounds-2026-11-26.json`，规约 `docs/IMMEDIATE_ROUNDS_SPEC.md`。
- **⚠️ 数据锚点：两句话必须分开说，别混成「没问题」**：①「真实档案没被本轮碰过」**有证据**——所有答卡都在 `run-audit-node.js` 起的 headless **隔离 context**（独立 profile）里跑，真实浏览器只开过只读 `/icon.svg`；②「39385 B / `C74F4675…` 锚点 byteIdentical」**给不出实物**——本机 MCP 浏览器的 `127.0.0.1:5173` origin 现在 `keys: []`（浏览器重启 / 临时 profile），那份档案已不在这台机器上。给不出就是给不出，不粉饰。
- **两处实现差异（都合理，别再改回去）**：① 13.6b（第 3 次落在某轮第 2 次模糊）**正常流程不可达**——词能进下一轮说明上一轮已模糊两次，第 3 次必然落在某轮「第一次」上；测试直接构造状态测纯函数分支，实现保留该分支。② 跨轮与「本轮清空开下一轮」常在同一次点击里，分两条 toast 会被后一条覆盖 → 必须合成一条（`本轮不再出现 · 第 2 轮 · 还有 1 个词`）；第一次 E2E 就是因此红的，说明测试有效。
- **demo 弧线分叉**：`demo:scheduler` 自 11/28 起与旧版不同（复习量 141→142、acc 0.808→0.801…），原因是 hard 语义收窄 → 次日 1 天批次**排序**变 → demo 按批内位置取评分，后续排期分叉。**未固化基线**（demo 无断言、只打印；要对比就重跑），不做独立 commit。
- **下一步（优先级上升）**：数据只存在浏览器 `localStorage`，**profile 一换就没了**——这次只是测试环境，等真开始背词就是真实风险。**备份 / 导出功能优先级上升，不是现在做**（`TODO.md` 第 17 项挂这条）。
- **工具坑（本轮新增）**：新 E2E `scripts/audit-immediate-rounds.js` 必须复制到 `C:\Users\xiao\.dsh\mcp\playwright-mcp\` 再用 `run-audit-node.js` 跑（`filename` 按 MCP 的 cwd 解析）；cfg 一律传**文件路径**，PowerShell 内嵌 JSON 会吃引号（本轮又踩一次，runner 直接 JSON.parse 崩）。

## 2026-11-26 · 远端备份打通（GitHub，走 SSH 不走 HTTPS）

- **结论**：代码 + 笔记已推到 `github.com/xiao520488/cifa`（公开仓库，659 文件 / 30 MB），远端 `main` = `ce1d66f`。词库、截图、设计文档一并入库；`out/`（APK 与 keystore）被 `.gitignore` 挡着，**故意不进仓库** —— keystore 泄露等于别人能签同包名的假更新。
- **为什么用 SSH**：本机到 github.com 的 HTTPS 时通时不通 —— `curl https://github.com` 拿到 200 但 12 秒只收 320 KB 就超时，`git ls-remote` 直接 `Recv failure: Connection was reset`。而 `~/.ssh` 里的 `id_ed25519` 早已被 GitHub 认得（`ssh -T` 回 `Hi xiao520488!`），换 `git@github.com:xiao520488/cifa.git` 一次就推成功。**在这个网络里别再试 HTTPS 推送**，只会卡在认证或重置。
- **坑 · 怎么判断 push 到底成没成**：`git push` 的进展走 stderr，PowerShell 会把整个命令判成 `exit code 1`，看着像失败。真凭据是 `* [new branch] main -> main`，以及事后 `git ls-remote --heads origin` / GitHub API 的 commit sha 与本地 `HEAD` 一致。
- **坑 · 仓库是公开的**：`NOTES.md` / 95 KB 的 `DESIGN_REVIEW.md` / `docs/research2/` 竞品调研 / 65 张截图全部可见。要私有：仓库页 → Settings → 拉到底 Danger Zone → Change visibility → Make private（已推历史一起变私有，不必重推）。用户当时未表态，默认按公开留着。
- **敏感信息扫过一遍**：无 token、无手机号、无第三方密码。唯一一条是 `scripts/build-apk.ps1` 里的 keystore 口令 `cijian2026` —— 脱离 keystore 文件签不出任何东西，可以不管。提交记录会暴露作者邮箱 `671010009@qq.com`（git 默认行为，介意就在 GitHub 开邮箱隐私）。
- **备份现状**：代码/笔记 = 本机 + GitHub 异地双份；`cijian.keystore` 用户 2026-11-26 自行备份完成（**口头确认，未看到产物，属用户自证**）。
- **下一步**：`TODO.md` 第 17 项「导出 / 导入进度」仍是最大风险项（卸载/换机 = 学习记录清零），用户已明确「先记不做」。

## 2026-11-25 · 安卓 APK 打包链路打通（真机已验收）+ 部署配置就绪

- **交付**：`out/cijian-1.0.apk`（1.06 MB，包名 `com.cijian.app`，minSdk 24 / target 34，v2+v3 签名），**用户真机打开正常**。网页、词库、字体全在包内，断网可用，不需要任何网址和账号。
- **为什么不用 Gradle / Capacitor**：只需 JDK17 + build-tools 34 + platform-34 三个压缩包（实际下载约 300 MB，解压 840 MB 在 `D:\AndroidBuild`，仓库外），`javac → d8 → aapt → zipalign → apksigner` 五步 30 秒出包，绕开 Android Studio 和 Gradle 的网络/体积问题。
- **坑 1（决定性）路 file:// 不可用**：`file://` 是不透明源 —— localStorage 被隔离、ES module 的 `import()` 被 CORS 拦，而词库正是动态 `import()` 进来的 → 直接加载不出来。改用 `https://appassets.local/` 假域名 + `shouldInterceptRequest` 映射回 assets，页面看到的是正常 https 源。
- **坑 2 · WebView 里故意让 `/sw.js` 返回 404**：离线能力已由「资源就在 APK 里」天然满足，SW 在 WebView 里跑只会带来缓存打架。
- **坑 3 · 两个必设项**：`setUseWideViewPort(true)`（否则按 980px 桌面宽度渲染，`<meta viewport>` 不生效）、`setDomStorageEnabled(true)`（学习进度的存储前提）。
- **坑 4 · 下载源**：GitHub 的 Temurin JDK 被限速到 7 MB / 12 分钟；换清华镜像 `mirrors.tuna.tsinghua.edu.cn/Adoptium/17/jdk/x64/windows/` 秒下。dl.google.com 的 build-tools / platform 直连可用（`platform-34_rXX.zip` 不存在，实际文件名是 `platform-34-ext12_r01.zip`）。
- **坑 5 · 签名与升级**：keystore 在 `out/cijian.keystore`（随 `out/` 被 gitignore）—— **丢了就无法覆盖升级同一 App**；发版必须 `versionCode +1` 且复用同一 keystore。卸载 App = localStorage 进度全丢。
- **部署侧**：`vercel.json`（构建 + sw.js 回源 + hash 资源 immutable）和 `docs/DEPLOY.md` 已就绪，但 `*.vercel.app` 在大陆被 DNS 污染，手机流量大概率打不开（Vercel 官方 KB 已承认无大陆节点）—— 对「个人手机使用」这个目标，**APK 才是可用路径，Vercel 只是备选**。
- **验证边界（别夸大）**：本机无安卓设备/模拟器，只验到「21 个 dist 文件一个不缺 + index.html 资源引用对账 + `apksigner verify` 通过 + `aapt dump badging` 字段正确」；渲染由用户真机确认。
- **下一步（最大风险项）**：加「导出 / 导入进度」，否则换机或重装 = 学习记录清零。**用户 2026-11-25 决定先记不做**，已转 `TODO.md` 第 17 项（含验收标准）。

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

## 2026-11-25 · commit A 已落 `af21e28`；用户追加：数据事故要补全键 diff（先给结果再开 commit B）

- **commit A = `af21e28`**（221 文件，message 五条 + 证据链）。HEAD 之前是 `18541cb`。
- **数据事故升级为用户的硬要求**：`cijian.scheduler.v1` 才是学习状态宿主，所以之前 24 次 `dataKept:true` 只证明皮肤/主题没变。
  1. **这条要写进 DESIGN_REVIEW，和 v9 报告作废并列**（不是脚注）。
  2. 回滚证据不能只看四个读数（cards / unlearned / mistakes / 首页）。要补：有完整快照就逐字节 diff；
     **没有完整快照就做字段级 diff**，把那 20 张卡碰过的字段逐项列出并确认复位——用户点名 `learnedOn / interval / ease / lastSeen / reviewCount`，
     但「包括但不限于」，所以要从引擎源码里枚举 `answer()` / `answerImmediate()` 到底改哪些字段，再逐个核对当前值。
  3. **diff 结果先交给用户，才允许开 commit B。**
- **三条规则固化进脚本注释**：① 答卡类测试首选**隔离**（Playwright `storageState` 注入或独立 profile），快照-还原是次选；
  ② 快照-还原必须**双键**（`cijian.v1` + `cijian.scheduler.v1`）；③ **还原前自愈 scrub 保留**，防超时打断后「还原到脏状态」。
- **② tagline 四字格要复核语义**：别为凑四字丢区分度，逐条确认 + 截图确认后才算定稿。
- **commit B 先写规约给用户过目，规约没点头不准动 DOM。** 七项必须覆盖：
  ① 开关形态（`persistentReadouts: true` 放 skin 配置还是组件级判断，给类型定义 + 8 套取值表）；
  ② 渲染边界（日历屏读日历数据、我的屏读统计，复用首页 `.readouts` 组件，写清 props 契约与数据源，**禁止皮肤 CSS 造数**）；
  ③ DOM 插入点（`.app__main` 内底部固定还是布局层；确认不破坏现有 snap、不触发新出列裁切）；
  ④ 360 降级（单行紧凑态在皮肤 CSS 显式写，给断点 + 降级后触控盒尺寸）；
  ⑤ 回归矩阵（日历 × 我的 × 8 皮肤 × 明暗，覆盖溢出/真实底色对比/触控盒/出列裁切/snap 内衬/**nOutY**；两相 DOM 检查照旧）；
  ⑥ 数据隔离（这次不答卡，脚本仍走双键快照-还原防意外）；
  ⑦ 回滚粒度（commit B 单独可 revert，不依赖 commit A 未提交改动）。
- **另外记下**：Vite 会漏 `edit` 工具的写入（复测前先 touch）；探针「祖先 `display:none` 的后代仍算可见」这个假阳性要写进探针注释。
- **全键 diff 已做完（用户要求的 gate）**：隔离 context 里重放同一流程拿到权威答案 —— 答 20 个新词**只碰 8 条路径**
  （`unlearned` 队首 −20 / `cards` +20 键 / `days[今].newLearned` +20 / `days[今].immediate.groups|.cards` 0→2/20 /
  `immediate.stats.groups|.cards` 0→2/20 / **`immediate.lastAvgLoops` null→0**）。其余 12 个顶层键 + 当天记录另外 12 个字段零写入。
  `CardState` 是 15 个字段，**没有 ease / reviewCount / lastSeen**（不是 SM-2，离散档位 1/2/6/15→30/90/180/360）。
- **逆操作完备性：residue = 1**，就是 `lastAvgLoops` —— scrub 把它写成 0 = 伪造「上次即时复习平均 0 圈」喂给自适应。
  真实档案已归位：`cijian.scheduler.v1` 与 pristine **SHA256 逐字节相同**（`B59898AC…7C7E11BB`，39289 字节），
  全树 diff 0 条、38 条关键路径 notPristine 0、`unlearned` 3846 项逐元素 identical、`days` 两条记录 diff 0。证据 `docs/evidence/scheduler-diff-2026-11-25.json`。
- **脚本硬化**：`audit-phases.js` 自愈改成「有 `__bak_at` 就逐字节还原，没备份才计数 scrub」，scrub 不再写 `lastAvgLoops`，
  跑完必须删 `__bak_*`（否则下次「自愈」会把用户这期间真实学习的数据当脏状态回滚掉——这个坑比原事故更隐蔽）。
- **commit B 规约已写**：`docs/COMMIT_B_SPEC.md`（581 行，七项齐）。两个硬发现：
  ① 首页 `.readouts` 带 `aria-hidden="true"`（`StudyScreen.tsx:78`）→ `audit-screens.js:51` 整棵子树跳过，**新带子必须在独立断言脚本里显式探针**；
  ② `audit-screens.js:159` 的 `bad()` 不含 `nOutY`（v10.1 加了指标却没进门禁）→ 按纪律另立 commit，不许夹带进 B。
- **② tagline 语义复核**：改掉 3 条丢区分度的（`硬边·印章`→`纯白·硬边` 撞 paper 的朱砂；`冷灰·磁贴`、`洋红·唱片` 原本在重说自己的皮肤名 → `冷灰·青瓷`、`洋红·黑胶`）。
  8 条全部 4 汉字 / 13px / 单行 153px，截图 `docs/screenshots/v10/v10.2-sheet-light-390.png`。
- **当前状态**：工作树有 v10.2 这批未提交改动（`DESIGN_REVIEW` / `NOTES` / `audit-phases` / `audit-screens` 注释 / `skins.ts` tagline / 两个新脚本 / 证据 + 截图）；
  浏览器 `paper/浅色`，学习数据 = pristine（逐字节），隔离 tab 已关。下一步等用户拍板规约 6 项 + 决定这批是否先单独落一个 commit。


## 2026-11-25 · 收尾二：AGENTS.md 按"衰减后还剩效用吗"瘦身（8858 → 6843 B）

- **用户的质疑成立，我采纳**：全局条款管不住深会话中段的行为 → 判据从"说得对不对"换成「**衰减之后还剩效用吗**」。
  只有两类留下：**默认值**（默认抽查 / 副本 / 不夹带——只在起点生效一次，起点正是注入权重最高处）与
  **触发器**（红灯词——由我自己的措辞触发，检测时机天然正确）。
- **实删**：「三个日常硬习惯」整节（"返工日志"那条最先走，用户判定它对他无价值）；重复条款合并（"断言带证据"＝"完成必须有实物"）；
  只属于本项目的条款退回 DESIGN_REVIEW。数字：验收纪律节 3312 → 2317 B（−30%），全文件 8858 → **6843 B**（−22.7%，占预算 10.4%）。
- 修掉一处**我自己造的悬空引用**：UI 条目仍指着已改名的「证据强度」，改指「默认最省」；全文核对无残留。

## 2026-11-25 · 机制事实：AGENTS.md 不是"只在开头注入一次"

- 本机实测：编辑 `~/.dsh/AGENTS.md` 后**整份内容当轮就重新出现**（本轮 4 次）；安装文档另有 **reconciliation message（对账消息）**，
  且 `maxBytes` 是按"每条链 × 每次对账"计。所以"看过就忘了"不是失效原因。
- 真正的失效是**内容就在上下文里却照样违反**。本轮两次当场复现：写下"不许凭记忆写锚点"后，下一分钟改计划文件就 miss 一次；
  把"PowerShell 吃引号"记进 NOTES 后，紧接着的 `git commit -m` 就因引号**提交失败一次**（换 `-F 文件` 才过）。
- **下次别再犯**：靠句子维持纪律不成立。有牙齿的约束必须落成脚本/门禁；条款文件只配装默认值与触发器，其余是装饰。

## 2026-11-25 · 未决清单（下次开工先问，不许当已决）

- **`LOG.md` 删还是留**：已定位为"给下一个 agent 的交接档案"，但效用是弱保证（取决于是否真被读）。用户倾向无用——
  **等他一句"删"再删**（连带 NOTES 里的指针），不主动删、也不再为它辩护。
- 项目级 `D:\背单词\AGENTS.md`：提议过，未拍板，未建。
- 唯一值得动手的"加牙齿"项：**提交前证据门禁脚本**（证据产物不存在就拒绝提交）。用户未批，未做。
- ③ 新用户引导暂缓；400–767 窄档 = 已知限制不扫；这两条自上轮起未变。

## 2026-11-25 · 收尾：本轮交付面 + 方法沉淀去了哪儿

- **提交链末端**：`2ccdef4` LOG.md 首版 + NOTES 复盘 → `5220e82` 操作坑补安全演练解法 → `c87fe98` LOG 改人话版 →
  `21a2fd9` **更正 LOG 读者定位**。工作树 `clean=True`，dev server 存活，落前五项确认最后两次通过（见下）。
- **本轮代码零改动**：最后四刀全是文档（规则九/十、已知限制、LOG、操作坑解法），设计工作在 `0231257` 就结束了。
- **方法沉淀的实际去处**：通用纪律 → `~/.dsh/AGENTS.md` 的「验收纪律」（**同日又被瘦身为 6 条，见上条**）；
  训练排期 → `~/.dsh/AGENT-PLAN-30D.md`（新建）；项目细节 → DESIGN_REVIEW 规则 1–10 + LOG.md。
  **注意层级**：只有 AGENTS.md（全局链 + 项目链）会自动进上下文，其余文件必须主动 read。
- **未决/暂缓**（下次别当已决）：项目级 `D:\背单词\AGENTS.md` 我提议过、**用户未拍板，未建**；
  ③ 新用户引导仍暂缓；400–767 全站窄档扫描已定为已知限制、不做。

## 2026-11-25 · DSH 指令链机制（查文档实证，不看文档想不起来）

- **只有 AGENTS.md 会被自动注入**，分两条链各自计额：**全局链** = `$DSH_HOME/AGENTS.md`（本机即 `~/.dsh/AGENTS.md`）+ 共享
  agents 根目录；**项目链** = 项目根 `AGENTS.md`。子目录 AGENTS.md 是 **on-touch**（碰到那个目录才注入），不是一开始就全量加载。
- 出处（当前安装的 asar 内文档）：`docs/cookbook/extension-cookbook.md:113-114`、
  `docs/upgrade-guide/v0.2.1-rc.1/agent-instructions-chain-budgets/guide.md:12,16`。
- **预算**：`@deepseek-ai/dsh-agent-instructions` 的 `maxBytes`，`dsh-base` 默认 **65536**，**两条链分别计**（同时含两条的消息可达 2 倍）；
  超限会静默截断，但首条 `Instructions from:` 消息里会有一行 `Workspace instruction budget` 点名被省略/截断的文件。
  实测本机全局文件 8858 B = 13.5%，很宽，但它是**每次对话的固定开销**，别当日记本。
- 验证是否生效：看会话开头有没有 `Instructions from: ~/.dsh/AGENTS.md` 那段；编辑该文件后**当前会话会立刻重载**（本轮实测三次）。

## 2026-11-25 · 在 ASAR 里查本机 DSH 文档的可复现做法（三个坑）

- 本机是 Desktop（`DSH_PROFILE=desktop`，`DSH_INSTALL_DIR=D:\deepseek\resources\app.asar\dsh\node_modules\@deepseek-ai\dsh`）。
  **原生 grep/glob/node/PATH 里的 node 全都穿不过 app.asar**，必须用 `$env:DSH_NODE_EXECUTABLE` + `ELECTRON_RUN_AS_NODE=1`。
- **坑 1**：pwsh 沙箱是 ConstrainedLanguage，`[System.Diagnostics.ProcessStartInfo]::new()` 会**静默返回 null** 再报"不能对 Null 调用方法"。
  改走核心 cmdlet：`Start-Process -FilePath $env:DSH_NODE_EXECUTABLE -ArgumentList <脚本> -NoNewWindow -Wait -RedirectStandardOutput <文件>`，再 `Select-Object -First N` 读。
- **坑 2**：本项目 `package.json` 是 `"type": "module"`，放 `out/` 的 **`.js` 会被当 ESM**，`require` 直接报 undefined。
  **写 `.cjs` 才有效**。这是第二次撞闭包/模块边界（第一次是 `page.evaluate` 不捕获 Node 闭包）。
- **坑 3**：`docs/**/*.zh.md` 在 GBK 控制台输出全是乱码（`files` 名正常），**引文档要引英文版行号**，别抄乱码文本。

## 2026-11-25 · 「落前五项确认」为什么必须当场跑（本轮真实翻车一次）

- 那次提交后隔约 1 小时再确认，**第五项直接不合格**：浏览器重启过，页面掉到 `about:blank`，主题被重置成 `system`（跟随系统 ≠ 浅色）。
- 修法走应用自己的控件（开「切换外观风格」→ `浅色` → `完成`），**不直接写 localStorage**，避免内存态与持久态分叉。
- 副产品证据：改完主题后 `cijian.scheduler.v1` 仍 **39385 B / byteIdentical true**，说明主题写入只动 `cijian.v1`，不碰调度状态。
- 同类一次遗漏：`NOTES.md` 在写完复盘后**没提交**，我上一轮却报过 `clean=True`（那是提交前的状态）。
  **纪律**：状态断言只在**当轮有效**，隔了轮次/隔了进程就必须重跑，不许引用上一轮的结果。

## 2026-11-25 · 给用户的训练结论（下次开新项目，我要按这个执行）

- 用户明确反馈：**过程类记录对他无价值**（做完就不再读，且读不懂）。已采纳——LOG.md 读者改成"下一个 agent"，
  用户只看顶部 5 句口令卡片。**跨项目复用的是形状，不是条目**。
- **四动作**（他能做、且跨项目不变）：规划（逼 agent 交四行计划，判"每步会看到什么实物"）／
  切分（同一活切两种，只比**返工次数**）／节省（每轮先定"我要拿到什么东西"，拿到就停）／
  达标（3 条完成标准写在开工前，**中途不许加**）。
- **三数字机制**：每个项目只留 `交付物数 / 返工次数 / 耗时`，**由 agent 统计**；下次用户开新项目时，
  **我在汇报开头附上上一行数字**。这是本轮定下的固定动作，别等用户要求。
- 技术学习的位置：不是前提，是四动作熟练后的**副产品**（带着问题查词）。别再对他讲"先学底座"。

## 2026-11-25 · 复盘：为什么「换几个主题」花了这么多 token（成本账 + 下次怎么省）

- **成本不是来自需求膨胀，来自"验收定义"**：皮肤是**叠在现有组件上的层**，所以一套皮肤能弄坏五个界面里的任何一个；
  8 皮肤 × 2 主题 × 8 界面 × 4 视口 ≈ 数百个状态，肉眼看不完 → 只能变成脚本矩阵，而**脚本自己也要被验收**。
  一句话：验收面是乘出来的，不是加出来的。
- **最贵的一类开销是"修量具"**：探针自己有四个洞（祖先横滚豁免把出列检查整体关掉、裁切盒不分轴、漏返 `top` 让
  `NaN >= 60` 恒判失败、44px 无亚像素容差）。v9 那批 `nOut:0` 是**假绿**，绿了几个版本。
  根因：AGENTS.md 要求产品先写规约，**没人要求测试脚本先写规约**。
- **第二贵的是数据事故那条弧**：在有状态功能上拿真实 profile 做测试，一次覆盖学习数据 →
  换来整套证据装置（全键 diff、隔离 context、可复现锚点、规则 1-8）。**下次的第一条纪律就该是：有状态测试默认隔离，不碰真实档案。**
- **本机工具摩擦**（每次都是一段弯路 + 一条写死的规则）：MCP 单调用超时（128 组跑完但结果 JSON 全丢）、
  注入代码里没有 `require`、`page.evaluate` 不捕获 Node 闭包、PowerShell 吃引号、`filename` 按 MCP cwd 解析、
  revert 演练污染 Vite 模块图（必须重启 dev server）、GBK 控制台乱码。
- **我自己的错，占了一部分成本，且全是同一类**：**先下断言，后验证**。
  「可单独 revert」写进 commit message 后实测才发现文档冲突（于是重写消息 + 重放 ②，hash 全变）；
  hash 手抄多打一个 `5`；引用记忆里 pristine 的旧 hash 差点报成数据被写坏；
  `textContent` 把 `display:none` 子段也算进去，差点得出"窄档还在显示阶段名"的假结论；
  `gap` 期望值按 `"6px 6px"` 写导致 4 条假失败；Markdown 列表项多一个前导空格会**静默消失**。
  共同点：**这些都是"看起来已经知道"的东西**，没有一条是难题，全是我把推测当成了记录。
- **为什么"以前"就带着问题**：因为过去的"完成"是**断言出来的，不是量出来的**，而且量过的那部分恰好错在**产生假绿**的方向上
  （出列检查失效、92 处中文小字、`--ds-cell-h` 死令牌、400–767 从没被任何矩阵覆盖）。
  缺陷一直在那儿，只是没有门禁会红。
- **下次省 token 的具体做法**：① 测试脚本也先写规约（视口集合本身算门禁的一部分＝规则十；每个探针配一个已知坏样例自检）；
  ② 金值/锚点一律脚本产出落盘，禁止转录；③ 有状态测试走隔离 context；④ 任何"已验证/可回退"必须附命令与输出才允许写进 message；
  ⑤ 长矩阵一开始就走 runner，别等超时；⑥ **开工前问一句"要多少证据"**——本轮的口径是"零数据风险 + 三视口全绿"，
  存在便宜得多的版本（抽查 3 套皮肤、1 个视口、不碰数据），贵不贵应该由用户当场选，而不是由我默认。

## 2026-11-25 · 收工最后一刀：规则九/十固化，窄档扫描砍掉

- **规则段八条 → 十条**：九＝纯重构/令牌化必须两层等值证据（金值探针 + 像素比对），只证明"没报错"不算完成；
  十＝矩阵视口集合本身是门禁的一部分，改字号/文本长度必须补测该元素 display 断点两侧各一档。各一行，不扩篇幅。
- **400–767 全站窄档扫描：砍掉**，不写脚本、不出报告；只在「已知限制」留一句
  「400–767 窄档除 nocturne 顶栏外未系统测过，作为已知限制留档，后续按需再开」。上一轮那条四行长的说明已被替换成这一句。
- **③ 新用户引导继续暂缓**，本轮未动。
- **最终 hash 序列**（上一轮为改掉 ① 里那句不成立的「可单独 revert」而重写消息并重放 ②，旧 hash 已不在 main 上）：
  `9a5316f` 收尾 → `1feba36` ① 令牌化 → `0231257` ② nocturne 14px → 本刀。内容与重写前逐字节相同。
- 上一条 NOTES 里写的「待拍板两条纪律」现已拍板；那条里的 `926a714` 是重写前的旧号，别再引用。

## 2026-11-25 · ①② 落地：令牌化 `926a714` + nocturne 14px（附带挖出 400–767 盲区）

- **① `refactor(tokens): desk/vinyl 带段尺寸令牌化` = `926a714`**：12 个令牌（desk 5 + vinyl 7），值全等于被替换的裸尺寸；
  顺带激活死令牌 `--ds-cell-h`（定义了没人引用，抽屉格高写死 96px）。`--vy-dot` 三处同径圆点共用尺寸（语义差别只在 animation）。
  **等值证明不靠「回归没红」**：`scripts/audit-token-equiv.js` 17 条 `getComputedStyle` 金值（`allOk true`，留作常备守卫）
  + 同条件重截 16 张与上一 commit 比 SHA256 → **15/16 逐字节相同**，唯一差异 45 像素全在 7×7 呼吸点框内（动画相位）。
  坑：Chromium 的 `gap` 在 row==column 时折叠成单值（`6px` 而非 `6px 6px`），首跑 4 条假失败全因为这个。
- **② nocturne `.topbar__meta` 13→14px**：验收线 `warnTiny 4 → 0` 达成（矩阵 B 现在 0）。
  但**真正的收获是发现 400–767 从来没被量过**：矩阵只跑 360/390/768/1440，而 `.topbar__meta` 在 ≥400 就显示；
  13px 时代 400/412 已经在 `overflow:hidden` 下**静默吃字**（需要 166px 只有 142/151px），四道门禁一条都不红。
- **降级规则砍哪段的判据 = 宿主数，不是长度**：`@media (max-width:459px)` 只隐藏阶段名与分隔点、留「今日 20 词」，
  因为实测「四级核心词」首页另有 2 处宿主（`.start__eyebrow`/`.start__spec-v`），而「今日 20 词」**全页唯一宿主（n=0）**。
  459 也是量出来的：14px 整串要 178px，460 是第一个装得下的宽度。
- 新守卫 `scripts/audit-topbar-narrow.js`（24 测点 × 4 判据，配置键同族 `__narrow_*`）。
  自纠一条：`textContent` 会把 `display:none` 的子段也算进去，用它报"显示了什么"会得出假结论 → 只拼可见子段。
- **待拍板的两条纪律**（已写进 DESIGN_REVIEW「本轮沉淀」，没擅自加进规则段）：
  ① 纯重构必须证明等值而非"没报错"；② 改字号/文本长度必须补测该元素 display 断点两侧各一档（矩阵视口集合本身是门禁的一部分）。
- ③ 新用户引导仍暂缓。下一步：等用户点收这两刀 + 决定两条纪律是否升成规则。

## 2026-11-25 · v11 收尾验收 + 规则 8 升级成两条硬纪律 + ①② 排期开工

- **四个 commit 全部接受**：`c0ad5b4` → `849d41b` → `3c07562`（commit B）→ `9a5316f`（v11 收尾）。
  vinyl 撤整颗点（不是只停动画）与「卡面那颗不动」两处判断被点名认可；回归 272 + 64/64/32 + 32 探针 + design-review 19 项 0 必须修，接受。
- **数据锚点处理方式被认可**：发现 39385 vs 39289 时**先去查基线本身**而不是当成写坏；三份落盘文件重算相同、字段级 diff 0，
  96 B 是换天结算前的快照差。**结论：不可复现的基线 = 假警报 = v10.2 事故路径。**
- **规则 8 附带的两条硬纪律（用户要求写进 DESIGN_REVIEW 规则段，不只是说说）**：
  ① **hash 必须脚本产出并落盘，禁止人手转录**（本轮手抄多打一个 `5` → 65 位，靠重算才暴露）；
  ② **`docs/evidence/pristine-anchor-*.json` 必须含 seed 脚本路径 + 复现步骤 + 权威 hash**，任何人能重跑出同一字节。
- **排期拍板**：① `refactor(tokens): desk/vinyl 带段尺寸令牌化`（整族一次改完，独立 commit，回归照跑）；
  ② `nocturne 桌面档 .topbar__meta 13px → 14px`（**独立小 commit，不混进 ①**，因为是 commit B 之外的新发现，按不夹带纪律单落）；
  ③ 新用户引导**仍暂缓**。两个 commit 各自可 revert、都不依赖未提交改动。
- **落前确认四项（本轮口径）**：工作树干净、`cijian.scheduler.v1` 与**本次收尾后**逐字节相同（锚点 `C74F4675E11ACE78…` 39385 B）、
  `__bak_*` / `__bandbak_*` / 临时配置键零残留、浏览器 `paper/浅色`。
- **已知限制三条 + 操作坑两条**全部接受为「写进 DESIGN_REVIEW 即可，不修」：desk 手机首页无带的刻意不对称、
  vinyl 常驻带无活动指示点、`.empty` 带值未测；revert 演练后必须重启 dev server、长矩阵必须改走 runner。

## 2026-11-25 · v11 收尾已落：vinyl 呼吸点语义 + 隔离 context 回归

- **产品代码只改一行**：`vinyl.css:213` 呼吸点选择器加 `[data-readouts-screen='home']`——cal/me 整颗 accent 点撤掉
  （不是只停动画，静态 accent 点同样是无语义装饰）。语义由 `audit-readouts-band.js` 的 `pulseOk` 断言守，不靠肉眼截图。
- **新工具 `scripts/run-audit-node.js`**：把仓库里的审计脚本 `eval` 起来用 playwright 起 **headless 隔离 context** 跑。
  起因：`browser_run_code_unsafe` 单次请求超时，128 组 ≈ 4 分钟跑完了但**结果 JSON 全丢**。探针不复制第二份，配置同源。
- **新坑（第 3 条）**：隔离 context **冷启动**跑快照-还原脚本 = 假失败——应用还没落盘，`audit-phases.js` 抓到的备份是
  `null` / `"{}"`，`restored` 恒 false（首跑 16 组全红而 `live` 明明 pristine）。修法：runner 种完配置**先访问一次首页**让应用 seed。
- 收尾回归：**272 组（128+144）0 失败**、带断言 64 手机 + 64 桌面 0 失败（`pulse {homePulsing 4, bandDotsRemoved 16/16}`）、
  两相 DOM 32 探针 0 失败（`restoredAll true`、`cleaned true`、`bakKeys []`）、`scan-tiny` 0、`tsc` 0、`build` 0。
- **新建议修**：nocturne 桌面档 `.topbar__meta` 13px「四级核心词」（`nocturne.css:123`，`warnTiny 4` 全来自它，
  与 commit B / vinyl 无关）→ 单独 commit 提到 14px。审计输出也顺手改了纪律：`pass` 全列表 → `passN` + 新增 `warnList`。
- **pristine 锚点纠正（规则段现为八条，第 8 条）**：会话里记的「39289 B / `B59898ACC3…`」是**换天结算写盘前**的快照，
  当前真实档案 39385 B / `C74F4675E1…`——**不是被写坏**：与 ① 12:01 全键 diff=0 快照 ② 全新隔离启动 seed 的 `iso-base.json`
  都**逐字节相同**、字段级 diff 0。今后「没被写坏」的证明一律以**可复现基线**（全新隔离 context 首启）为准，
  不引用记忆里的 hash——不可复现的基线只会产出假警报，而假警报下一步就是「顺手 restore」，那是 v10.2 事故路径。
  证据文件 `docs/evidence/pristine-anchor-2026-11-25.json`。
- 下一步排期：① `refactor(tokens): desk/vinyl 带段尺寸令牌化`；② nocturne 14px；③ 新用户引导**仍暂缓**。

## 2026-11-25 · commit B 验收 + 建议修三条拍板 + 收尾范围（用户定稿）

- **三 commit 证据全部接受**：`c0ad5b4`（v10.2 补证）→ `849d41b`（`bad()` 纳入 `nOutY`）→ `3c07562`（commit B）。
  用户点名「false 皮肤 8 组重截 SHA256 逐字节相同」是最硬的一条；规约两处估算被实测校正（vinyl 360 带高 33→**41**，漏算 `::before` 的 26px 圆盘顶高）。
- **建议修拍板**：① **裸尺寸令牌化＝做，但单独 commit** `refactor(tokens): desk/vinyl 带段尺寸令牌化`，整族一次改完，不混收尾（夹带会污染 revert 粒度）；
  ② **desk「首页无带、日历/我的有带」＝保持接受**，写进 DESIGN_REVIEW **已知限制**，要修另立 issue；
  ③ **vinyl `vy-pulse`＝限定只在首页亮**——「播放器在响」的语义在 cal/me 是漂移，**观感可接受不等于语义对**，按语义修，回归加「cal/me 不闪」断言。
- **规则扩到七条**（新增两条要写死）：**第六条** 整程数据门禁只比**学习键** `cijian.scheduler.v1`，逐测点窗口才比双键——
  `cijian.v1` 存皮肤/主题偏好，`setSkin()` 每轮合法改写它，拿双键整程相等当门禁等于造一个永假断言；
  **第七条** `page.evaluate` **不捕获 Node 闭包变量**，页面里用到的常量必须参数注入。
- **操作坑（记进 DESIGN_REVIEW）**：**revert 演练会污染 Vite 模块图**——残留旧 `?t=` 时间戳，之后报
  `does not provide an export named 'SKINS'` 这类假错；**演练完必须重启 dev server** 再回归。
- **收尾范围**：vinyl 呼吸点限定首页 + DESIGN_REVIEW 补已知限制与第六/七条规则 + 最终回归（272 组主矩阵 + 带断言 + 两相 DOM + tsc + build）。
  commit message：`chore(release): v11 收尾——vinyl 呼吸点语义修正 + DESIGN_REVIEW 规则与已知限制`。**新用户引导继续暂缓**。
- **落之前四项确认**：工作树干净、浏览器 `paper/浅色`、`__bak_*` / `__bandbak_*` 零残留、`cijian.scheduler.v1` 与收尾前逐字节相同。

## 2026-11-25 · commit B 已落：cal/me 常驻读数带（persistentReadouts）

- **实现**：`.readouts` 抽成 `src/components/Readouts.tsx`，App 顶层 `buildReadoutItems()` 一份 memo 喂三屏；
  `SkinMeta.persistentReadouts` **必填**（漏写＝tsc 失败），desk/vinyl=true，其余 6 套=false；
  节点插布局层（屏链 `)}` 之后）→ **CalendarScreen / ProfileScreen 零 diff**；`!session` 让学习流里根本不渲染带子。
- **实测**：带断言 64 测点（8 皮肤×明暗×cal/me×390/360）+ 桌面 32 测点 **0 失败**；通用门禁 96 组 0 失败、`outYTotal 0`；
  `scan-tiny` 0；带高 360 档 desk 37 / vinyl 41，≥390 档 54/52；极端位数压测（`999/999/99999`）desk 余 140、vinyl 余 93，无裁切无横滚。
- **两个新坑（写进脚本注释）**：① `page.evaluate` **不捕获 Node 闭包变量**，页面里用到的常量必须走参数注入（`BAK is not defined`）；
  ② 整程「双键相等」当门禁是错的——`cijian.v1` 存皮肤/主题偏好，`setSkin()` 每轮合法改写；
  整程只比**学习键**，逐测点窗口才比双键。
- **遗留（不夹带，另立 commit）**：desk 带内裸尺寸令牌化；desk 首页手机档无带的不对称（已接受为代价）；
  vinyl 呼吸点在 cal/me 也闪（语义上「播放器在响」是否该只在首页）。
- **当前状态**：三 commit 序列 = `c0ad5b4`（v10.2 数据补证）→ `849d41b`（nOutY 门禁）→ commit B；
  真实 profile 学习数据仍逐字节 = pristine（`cards 0 / unlearned 3846 / learnedToday 0 / lastAvgLoops null`）。

## 2026-11-25 · v10.2 gate 通过 + 六项拍板全按推荐 + 三 commit 序列（用户定稿）

- **数据事故 gate 已过**：独立 context 重放 + 路径级 diff + SHA256 逐字节相同，用户接受；`lastAvgLoops`（null→0 伪造历史喂自适应）算关键发现。
- **两条规则写死（用户原话）**：① **scrub 永不写 `lastAvgLoops`，只做删除/复位，不造值**；
  ② **跑完必须删 `__bak_*`**——用户认同「这条比原事故更危险，因为它发生在已修好数据完整性之后的脚本里」。两条都要进脚本注释 **和 DESIGN_REVIEW**。
- **tagline 定稿**：`纯白·硬边` / `冷灰·青瓷` / `洋红·黑胶` 三条改法接受，8 条全 4 汉字 13px 单行 153px。
- **commit B 规约七项接受**，六项拍板**全部按推荐**：cal/me 用首页同三项（今日/批数/已学）；App 传 `items` 数组（`ReactNode` 槽位不可审计，否掉）；
  360 断点 `max-width:389px`；**desk 首页手机档本次不动，「首页无带、日历有带」的不对称作为已知代价写进规约备注，要修另立 issue**；
  带子禁止可点；真值表走新独立脚本 + 手抄常量 + `SKINS.length===8` 兜底。
- **两条硬性完成条件（不做不算完成）**：① `.readouts` 带 `aria-hidden="true"` 是既有探针盲区（`audit-screens.js:51` 整棵子树跳过），
  **独立断言脚本必须显式把带子探针进去**；② 「带内零交互元素所以 44px 门禁豁免」这个理由**必须显式写在断言脚本里**，不许默默放过。
- **提交序列（用户定）**：`fix(data): 全键 diff 补证 + lastAvgLoops 残留归位 + 答卡测试改走隔离 profile`（v10.2，不含 nOutY）
  → `fix(audit): bad() 纳入 nOutY 门禁`（单独小 commit）→ commit B（只含 persistentReadouts + Readouts.tsx + desk/vinyl 两屏带 + 断言脚本 + 回归矩阵）。三个各自可 revert。
- **落 v10.2 前的自检**：`__bak_*` 删除规则、scrub 不写 `lastAvgLoops`、双键快照-还原、隔离 profile 四条都在脚本注释里 + 工作树确认后再落。



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
