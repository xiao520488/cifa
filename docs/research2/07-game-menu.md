# 07 · 游戏菜单领域调研 —— 版面骨架拆解（焦点 / 栏数 / 密度 / 导航位 / CTA 形态 / 数据放不放首页）

> 领域调研员笔记。只谈**骨架**，不谈配色情绪：一屏的视觉重心落在哪、分几栏、密度多高、导航住在哪、CTA 长什么样、数据摆不摆在首页、什么被藏进二级屏。
> 对象：Persona 5（含 Royal）、Hades、塞尔达传说 王国之泪、Celeste、Monument Valley、Firewatch、Outer Wilds。
>
> **词笺前提（全篇共用）**：皮肤只能改 CSS，不能动 DOM。本笔记默认 `.start__title`（大标语）与 `.start__lede`（玩法段）一律 `display:none`——用户明确要求新皮肤首页不再出现这两块。首页可用素材只有：`header.topbar`（`.brand`/`.brand__name`/`.brand__dot`/`.topbar__meta` + 2×`.icon-btn` + `.avatar-btn`）、`.readouts`（3×`.readout`：今日/批数/已学，补零）、`main.app__main > .screen > .start`（`.start__masthead`/`.start__kicker`/`.start__eyebrow`/`.start__meta`/`.start__spec` 4 行 k-v/`.start__actions > .btn--primary`/`section.today-card` 含 `__head`+`__label`+`__links` 2 个文字链+`__figures`+`__reason.is-*`/`.start__foot > .start__rule`）。
> 关键事实：`.topbar__meta`、`.readouts`、`.start__spec`、`.start__kicker`、`.start__masthead` 在 `src/styles/skin-hooks.css` 里**默认被 `display:none` 关掉**，要用必须自己在 `[data-skin='…']` 块里重新打开；`paper` 皮肤两个都不用，所以别指望它们已经显示。
> 另一事实：`.today-card__figures` 当前实现是 **4 个** figure（新词 / 到期复习 done-total / 逾期 / 连续优秀），不是 3 个——写 `:nth-child()` 时按 4 个准备，`grid-template-columns` 也按 4 算。
> 参照：技术约束全文见 `docs/SKIN_BRIEF.md`，数据可见性（哪些数字在别的页面还看得见）见 `docs/research2/00-data-inventory.md`。

---

## 0. 领域总纲：游戏菜单给词笺的七条结构公理

1. **菜单可以是「场所」而不是「列表」。** 这一族产品最反直觉的共同选择：把功能摊在空间位置上，不摊在纵向列表里。Hades 的冥王之家把「天赋树 / 契约 / 抽卡 / 武器形态」做成屋里四个**各自独立的交互物件**，而不是一个统一菜单（teemo.dev 称之为 "a deliberate spatialisation of the meta layer"）；Firewatch 的地图根本不是菜单或 HUD 的一部分，它是亨利**拿在手里的一张纸**；王国之泪把整套菜单装进 Purah Pad 这块「世界里的平板」。→ 对词笺的含义：**首页不一定要是「读物」，也可以是「一张桌面」。**
2. **一根线就能定全部秩序。** Persona 5 艺术总监须藤正喜在 CEDEC＋KYUSHU 2017 明确说过为什么：菜单画面**中央有一条白色视觉引导线，菜单内容沿线整齐排列**，因为人眼对线条天生敏感，读文本时视线不该被风格化元素阻断（触乐转述）。同一屏的层级不靠字号阶梯，靠**对比度**——「优先级较高的区域对比度更高，没那么重要的信息对比度更低」，选项移动时**布局和角度一起变**。→ 极端的不对称 + 单一强结构线，是不改 DOM 就能偷的最狠的一招。
3. **一屏 = 一幅画，只能有一个可进的动作。** Monument Valley 的技术总监把目标说成「每一屏都是可以打印装框的画」，通关后屏幕只给**两个点**：底部圆圈＝去选关，顶部相机＝自由取景拍照（Polygon 访谈）。界面 chrome 几乎为零：没有血条、没有分数、没有浮层菜单，连教学都是无字的（关卡里只有一句 "tap path to move"）。→ 首屏元素数应当被当成「画布上的墨点」来预算，而不是「卡片位」。
4. **统计要印在主体上，不要摆在主体旁。** Celeste 的选关屏就是那张世界地图，**草莓 48/47、死亡 4514 这类数字直接写在地图上的当前章节位**，一行带过，没有统计卡；Hades 把几乎全部路由信息从 HUD 挪到**门本身**上（"pushing information out of the HUD and onto the world"）；Persona 5 把角色 EXP 印在**悬赏令的赏金位**上。→ 数字的正确位置是「被统计的那个东西的表面」，不是旁边的一排盒子。
5. **看得见的范围本身是信息架构。** Celeste 用**镜头裁切**控制「能看见什么」：直到第 7 章之前，世界地图的取景始终不把山顶拍进画面，山顶的出现＝进度承诺（noctes 的逐屏对照分析）。→ 词笺版：不该出现在首页的数据，可以「这一屏没拍到」，而不是「排在下面」。
6. **数据按「零输入 / 一眼 / 一键」三层预算。** Hades 的信息架构就写死三层：**永远在屏上**（血、死亡 defiance、投掷弹、神力槽、货币，且 0.40 补丁还把 boon 侧栏砍到"只显示相关"）／**diegetic 在世界里**（门上的奖励图标、敌人身上的血条）／**一键之外**（完整 boon 列表、契约、命运名单）。它付出的代价是**字太小**——这是该作被投诉最多的无障碍问题，而且游戏**没有字号选项**。→ 抄这个分层，别抄这个字号（词笺硬约束：成句中文 ≥14px）。
7. **CTA 是「进入」，不是按钮。** Persona 5 的标题菜单里 NEW GAME / LOAD GAME / CONFIG 是**楼体灯光、涂鸦、名片**构成的场景级大字，选中一项＝**机位切换 + 人物走位**；Monument Valley 是点路径即走；Firewatch 连"确认"都收进对讲机。→ 首页可以只有一个「把屏幕交出去」的大动作，其余入口降级为场景里的边角。

---

## 1. Persona 5 / Royal —— 一根引导线 + 每次换机位

**structure**
- 标题（主）菜单**没有列表**：场景是涩谷中央广场，`NEW GAME`、`LOAD GAME`、`CONFIG` 这些字分别由**大楼灯光、涂鸦墙、名片**承担；切到某个选项＝镜头转向另一处（New Game 切到角色侧翻 + 楼上新格字；Config 切到佐仓双叶打一个响指，左侧各楼房间灯光拼出 CONFIG）；确认＝镜头推向场景中的屏幕。画面里**没有居中菜单列**。
- 系统菜单（暂停菜单）是**一根竖线两个半区**：屏幕中央一条白色引导线，**所有选项排在线的左侧**，当前项由一块变形色块顶出；数据/内容排在线右侧。人物的**姿态与眼神**指向右侧数据区（Skill 用脚踩在右下角的线上、眼睛往右下看；Item 用左手托起全队 HP/SP 量表在屏幕左侧、头转向右侧物品列表）。Equip 层**那根白线整体旋转**，角色名仍落在中线区。
- 日历层：白线**右移**，左半为黑底日历、右半为白底当日详情；做过的事写在屏幕右下的**笔记本**上（笔记本＝剧情道具）。存档栏也做成**线圈笔记本每页左下角**。
- 状态页：人物画像做成**悬赏令**，画像下方的数字位原本是赏金——那里放的是**该角色累计 EXP**。
- 层级语法：几乎**不用字号差**，用「对比度 + 倾斜度 + 底色」区分；除 HP/MP 条外**几乎不引入子色调**（为了让红色更醒目）。须藤的解释是风格化与可用性不是零和，是一个**排优先级的过程**。

**surfaced**：一屏只暴露「当前选中项 + 它对应的那一块数据」。HP/SP 量表是唯一的常驻数值。
**hidden**：非当前项一律降到低对比；未选中角色只给名字不给数值；日历历史要翻页；一切"总览"都不在同一个屏幕上同时在场。

**→ 词笺 css_only（P5 手段的可抄子集）**
1. **结构线**：`[data-skin] .start { position: relative; }` + `[data-skin] .start::after { content:""; position:absolute; top:0; bottom:0; left:26%; width:2px; background:var(--accent); }`。这是整页唯一的"重结构"，360px 下 `left` 用 `%`（26%×360≈94px，线左侧还能放 44px 命中区）。线左侧留给标签与导航，右侧留给数字与 CTA。
2. **两栏化**：`[data-skin] .start__body { display:contents; }`（把 `.start__eyebrow`/`.start__meta`/`.start__spec`/`.start__actions`/`.today-card` 全部提为 `.start` 的 grid 子项），再 `[data-skin] .start { display:grid; grid-template-columns:26% 1fr; column-gap:var(--space-3); }`；把标签侧写 `grid-column:1`、内容侧写 `grid-column:2`，标题栏 `.start__masthead` 与 `.start__kicker` 打开后横跨两列（`grid-column:1/-1`）。
3. **对角切角（不斜文字）**：所有切角用 `clip-path: polygon()` 画在**形状层**（`.today-card`、`.start__actions .btn--primary`），文字保持水平不被斜切；切角幅度 ≤10px，保证 44×44 命中区不被裁掉（`clip-path` 会裁掉命中测试）。
4. **视线引导**：把当前主数据钉在线的右下交点：`[data-skin] .today-card__figure:nth-child(1) { grid-column:2; }` 其余三个 figure `opacity:.55`（学"层级靠对比度不靠字号"），`:hover`/`:target` 不做，靠 `:has()` 提升——见 §8 坑。
5. **竖排刻印**：`.start__masthead-meta`（`2026 · 11 · 24`）用 `writing-mode:vertical-rl; letter-spacing:.2em` 贴到线顶端当"书脊"；这是纯数字/拉丁，不受中文 ≥14px 约束，但仍给足高度 `height:min(30vh,150px)`。

---

## 2. Hades —— 没有「菜单」，只有一屋子入口 + 三层 glance 预算

**structure**
- **主菜单**（blackscreengaming 逐屏记录）：屏幕**左侧一竖列四个选项**，**底部一条横向图形菜单**——上下两套异构导航并存，不是一根列表走天下。选中项高亮为橙色，白字深底，OCR/低视力友好。
- **冥王之家＝菜单本体**：镜之夜（天赋树）、惩罚契约、卡戎之井、净化之泉、武器形态——**每一个都是屋里一个可以走过去交互的物件**，官方设计解读明确称之为「把 meta 层空间化」的刻意选择；不做统一 tab 面板。
- **战斗中**：信息被推**到世界上**——奖励图标画在门上、祝福的形状与颜色自带含义、敌人血条与护甲条长在敌人身上。常驻 HUD 只剩极少数（血/死撑/投掷弹/神力槽/货币 + 祝福侧栏），0.40 补丁还把侧栏削成「只显示相关祝福」。
- **一键之外**才给完整清单与文字说明；三档之间**不互相挤占**。
- 代价：所有超出这套策略的信息（写死的祝福文本、字幕）字号偏小，且**没有文字尺寸/字幕尺寸/字体/字幕颜色选项**，也没有色盲模式——社区用描边 mod 补。

**surfaced**：现场只给「下一步动作需要的」那几项；门上/身上＝第一信息层。
**hidden**：任何"清单式总览"都被推到一次交互之外；meta 进度不显示成百分比墙，而是"走到那面镜子前面"。

**→ 词笺 css_only**
1. **屋子化（把首页做成平面而非文档）**：`[data-skin] .screen { min-height:100dvh; position:relative; }`；`[data-skin] .start { position:static; }`；`[data-skin] .today-card__figures { display:contents; }` 让 4 个 `.today-card__figure` 直接升到 `.screen` 层级下各占一个角——`.today-card__figure:nth-child(n) { position:absolute; left/right:X; top/bottom:Y; min-height:44px; }`（**注意**：`display:contents` 后元素仍是其后继 grid/flex 容器的子项；这里要求 `.start` 也是同一层定位上下文，实现时用 `position:absolute` + 最近的 `position:relative` 祖先，实测确认参照系）。
2. **左列导航 + 底部横条（主菜单同款）**：`.topbar` 变竖列：`[data-skin] .topbar { position:fixed; top:0; left:0; bottom:0; width:56px; display:flex; flex-direction:column; justify-content:flex-start; gap:var(--space-2); }`（两个 `.icon-btn` 与 `.avatar-btn` 都是 44–48px 方块，竖排天然满足 ≥44）；正文整体让位 `[data-skin] .screen { padding-left:56px; }`。底部横条用 `.today-card__links { position:fixed; inset:auto var(--page-x) calc(env(safe-area-inset-bottom) + 8px) 56px; display:flex; justify-content:space-between; }` 里的两个 `.btn--compact`——**必须把它们从 `min-height:0` 抬到 44px**（`padding-block:12px`），这是抄"底部图形条"最容易破的一屏。
3. **HUD 分层（三层预算）**：常驻层只给 `.readouts`（三数，打开 `display:grid; grid-template-columns:repeat(3,auto)`，贴在左列导航顶端当侧栏）；世界层＝`.today-card__reason`（一句话，写在 CTA 正下方，小字低对比）；一键层＝`.start__spec`、`.start__meta` 整块 `display:none`（"这些属于清单，清单在日历页/我的页"）。

---

## 3. 塞尔达传说 王国之泪 —— 「没有 UI 比有 UI 好」+ 把空档变成准备屏

**structure**
- 任天堂官方 UI/UX 设计师访谈（IGN Japan 转述）延续旷野之息的原则：**「なければない方がよい UI」**（没有的 UI 才是好 UI）；TotK 曾探索**把 UI 的存在感压到极限**，玩家可在设置里选「プロ」得到最简画面。
- **读屏即内容**：TotK 把快旅读盘画面从「插画」换成**目的地的地图**——设计师的理由是「等待时间因此变成下一段冒险的准备时间」，玩家能提前看见周边信息、发现想绕的路。这是"把统计/信息塞进本来空着的屏幕"最干净的样板。
- **菜单住在世界里的设备**：Purah Pad（外观就是贴皮肤的 Switch）承载地图、海拉鲁百科、背包；操作说明表也长在 Pad 里（基本/特殊两组，按顺序演示按键）。
- **冒险日志按类别分行**：主线 / 支线任务 / 支线探险 / 神殿——TotK 的改动是**把"支线任务"和"支线探险"拆开**（后者地图上无标记但解锁重要奖励），并给每条日志配**地图片段 + 委托者姓名 + 关键信息**：类别 > 全量列表。
- 被骂的结构：融合物品选择是**一条要一路滚到底的横向长列表**（可排序但只有一行），后期内耗严重——反面教材：**横向单轴长列表不是"不对称版式"，是导航失败**。另外游戏**无按键重映射**等无障碍项。

**surfaced**：目的地/下一条任务/类别归属；一屏一屏分层给。
**hidden**：数值型 HUD（温度、体力）在"プロ"档几乎全部收掉；百科、配方、装备细节都在 Pad 的另一页。

**→ 词笺 css_only**
1. **读屏即准备**：把首屏下半（CTA 之下）做成「下一站预览带」而不是"更多数据"：`.start__foot` 打开，`.start__rule` 升为一条满宽带 `[data-skin] .start__rule { display:block; height:min(22vh,150px); background:repeating-linear-gradient(60deg, var(--border) 0 1px, transparent 1px 14px), repeating-linear-gradient(-60deg, var(--border) 0 1px, transparent 1px 14px); mask-image:linear-gradient(to bottom,#000 0 55%,transparent); }` 画"地形/等高线"，纯装饰零溢出，语义上＝"你即将进入的那一批"。带上方落 `.start__foot` 的说明句。
2. **类别 > 全量**：`.start__spec` 的四行 k-v 不再当"工单表"用，改成**四段分类头**：`[data-skin] .start__spec { display:grid; grid-template-columns:1fr; gap:0; }`，`[data-skin] .start__spec-row { display:grid; grid-template-columns:5.5em 1fr; border-bottom:1px solid var(--border); }` + `counter` 编号 `[data-skin] .start__spec { counter-reset:sp; }` / `.start__spec-row { counter-increment:sp; }` / `.start__spec-k::before { content:counter(sp)"  "; font-variant-numeric:tabular-nums; }`（拉丁/数字刻印，允许小字号）。
3. **不做横向长列表**：任何横滑容器只能放 ≤4 项，且必须 `overflow-x:auto` 留在内层、页面级零溢出（词笺硬指标 `scrollWidth===clientWidth`）。这一条是从 TotK 挨骂处直接反推的红线。

---

## 4. Celeste —— 选关屏就是那张地图，统计写在地图上

**structure**
- **没有难度菜单**：只有一条内容阶梯（A 面 606 间 → B 面 181 → C 面 25 → 26 个金草莓），故事全在最底层那一阶上；**Assist 模式挂在文件选择页**，随时可开，背后是一句"把游戏适配给玩家、而不是让步"的全屏说明。→ 结构与设置都不靠"仪表盘"，靠**入口页的层级**。
- **选关＝世界地图本身**，数字直接印在地图上当前章节的位置：`48/47` 草莓、`4514` 死亡——同一行式样，一章一行，没有统计卡、没有图表。
- **镜头裁切即进度**：在打到第 7 章之前，地图取景**从不把山顶拍进画面**（逐章截图对照）；第 7 章选关屏是玩家第一次在游戏内看见山顶。关卡内还有"还剩 N 个检查点到山顶"的倒数牌和一副能一路望到山顶的望远镜。→ **可见范围被当作叙事与进度信息在管理。**
- 主菜单/文件选择是极简的一列文字 + 存档卡（存档位做成卡片、每卡一行进度）；没有 hero 图、没有仪表盘。

**surfaced**：当前章节一行统计 + 地图本身；"还剩几格"用文字倒数。
**hidden**：所有未解锁章节不可见（不是灰掉，是没拍到）；进阶内容（B/C/金草莓）不混在主列表里。

**→ 词笺 css_only**
1. **数字印在主体上**：把 `.today-card__figure` 的第一个数变成"贴在 CTA 表面的批注"——`.start__actions { position:relative; }` + `.start__actions .btn--primary { display:flex; align-items:center; justify-content:space-between; min-height:56px; }`；再用 `.start__actions::after { content:""; position:absolute; inset:auto 8px 6px 8px; height:1px; background:var(--on-accent); opacity:.5 }` 画一条"针脚线"。真正的 `48/47` 式统计用 `.readouts`：`[data-skin] .readouts { display:flex; gap:var(--space-4); }` + `.readout__v { font-variant-numeric:tabular-nums; }`（补零数字正是那种"死亡数 0254"的一行式样），`.readout__k` 两字中文必须 ≥14px。
2. **镜头裁切（"未拍到"的表达）**：`.screen { padding-top:0; }` + `[data-skin] .start::before { content:""; position:absolute; inset:0 0 auto 0; height:min(18vh,120px); background:linear-gradient(to bottom, var(--bg), transparent); pointer-events:none; z-index:2 }` 把首屏最上沿"裁进黑里"，`.start__masthead`/`.start__kicker` 落在这片渐隐下（只当刻印，不当信息）。更硬的裁切用 `mask-image: linear-gradient(to bottom, transparent 0 6%, #000 22%)` 直接压在 `.readouts` 上——装饰可以裁，**信息不许被裁**。
3. **条件提升（`:has()` 当"取景开关"）**：`[data-skin] .start:has(.today-card__figure b.is-warn) .today-card__figure:nth-child(3) { opacity:1; transform:translateY(-2px); }`，同时 `[data-skin] .start:not(:has(.today-card__figure b.is-warn)) .today-card__figure:nth-child(3) { opacity:.5 }`——"逾期>0 才被拍进画面"。纯 CSS，无需 JS；语义红只用 `--danger`/`--warning` 且浅深两档各写一遍。

---

## 5. Monument Valley —— 零界面，每一屏都是可以装框的画

**structure**
- 界面 chrome **接近于零**：没有血条、没有分数、没有浮在玩法之上的菜单。操作**嵌进建筑**——转一个刻在墙上的旋钮、沿轨道拖一块平台，埃舍尔几何随之重排；点一下目的地，公主就走。**没有教学文字**，第一章只有一句 "tap path to move"，新机制靠关卡本身自明。
- 明确的设计目标：**「每一屏都是可以打印装框的画」**（技术总监 Peter Pashley）。版面因此极端留白、元素极少。
- **通关后只给两个动作点**：屏幕**底部圆圈**＝进选关继续，屏幕**顶部相机图标**＝自由取景、缩放、加滤镜拍照存图。两个点在画面的**上下边缘对角**，画面中心留给作品本身。
- 选关屏是**一座立体模型**（章节＝模型里的小场景），列表语义被彻底空间化。

**surfaced**：一屏一件"作品"＋最多两个动作点。
**hidden**：没有任何常驻统计；进度不显示成数字，显示成"走到了哪座建筑"。

**→ 词笺 css_only**
1. **全高海报**：`[data-skin] .screen { min-height:100dvh; display:grid; grid-template-rows:auto 1fr auto; }`；`[data-skin] .start { display:contents; }` 让 `.start` 的块直接吃到这三行（注意 `display:contents` 后 `.start` 自己的 `gap`/`padding` 失效，须在 `.screen` 上重建）；正文除一个焦点物外全部 `display:none`。
2. **底部圆 / 顶部小点＝两个动作**：`.start__actions .btn--primary { border-radius:var(--radius-full); width:min(30vw,104px); aspect-ratio:1; margin-inline:auto; }`——360px 下 `30vw=108px→min 104px`，圆内放「开始背单词」五字必须 `font-size:14px; line-height:1.25;` 两行内放下（或接受按钮只显两字，但文案不能改，故按两行排）。顶部 `.start__masthead` 打开成极小一行刻印（`opacity:.5`）。
3. **画框留白**：`@media (min-width:1440px)` 里给 `.screen` 加 `max-width:var(--content-max); margin-inline:auto;` + 两侧靠 `--bg` 天然留白；小屏靠 `padding-inline:clamp(var(--page-x), 6vw, 56px)` 把"画"缩进框内，`overflow-x` 留在容器内。

---

## 6. Firewatch —— 没有 HUD；「菜单」是手里那张纸

**structure**
- HUD 只有**一个点准星**，而且可以关掉；除此之外屏幕上几乎什么都不常驻，只有对讲机对话选项、可交互物名称和少数横幅。背包"极简到几乎不会打开"，文档直接就地读，不开文本框。
- **地图不是菜单或 HUD 的一部分**：它是世界中的实物，玩家"打开地图"看到的是亨利的双手把一张纸**展开**；纸离屏幕略远，细节糊——想看清必须**拉近**，于是读图这件事本身变成了"中年男人把地图凑到鼻子前眯眼"的角色塑造（Gamasutra/Wawro 的分析）。**可读性被有意牺牲来换真实感**：一张"通用尺寸、一眼能读"的地图反而不会让人有那种无意识的动作共鸣。
- 罗盘＋纸地图取代小地图；导航靠**在纸上做标记**；对讲机回复是唯一的"菜单"，且回复窗口用一条随时间消退的计量条（diegetic 计时）。
- 标题/选项屏走"插画主导 + 选项缩在边角"的路线：版面重心是一幅画，不是一列按钮。

**surfaced**：手里那张纸上的东西；一次只有一个（地图／对讲机／笔记本）。
**hidden**：数值、状态、清单、进度百分比——统统没有。目标与笔记是纸片物件，不是列表。

**→ 词笺 css_only**
1. **纸片从下缘探出**：`[data-skin] .today-card { position:fixed; left:var(--page-x); right:var(--page-x); bottom:calc(var(--dock-height) + env(safe-area-inset-bottom)); transform:rotate(-1.1deg); padding:var(--space-4); border-radius:var(--radius-sm); background:var(--surface-raised); border:1px solid var(--border-strong); box-shadow:<硬投影 浅/深两档>; }`——首页其余块全部回到正常文档流，"纸"是唯一的浮层。文字**必须随纸一起旋转**（父级 `transform`），AA 不受影响但 `mask` 别裁到字。
2. **纸上是批注不是表格**：`.today-card__figures { display:contents; }` + `[data-skin] .today-card { display:flex; flex-direction:column; gap:var(--space-2); }`，让 4 个 figure 变成逐行手写批注（`::before { content:""; width:1.2em; border-bottom:2px solid var(--accent); }` 画"下划线"），`.today-card__label` 当纸的抬头（右上钉），`.today-card__links` 关掉（导航不该在纸上，它是入口不是批注）。
3. **拉近＝可读**：`.today-card { max-width:min(92vw,380px) }`，其余数据 `display:none`——把"糊"换成"少"，词笺不能靠缩小字号做真实感（硬约束 ≥14px，且 Hades 已经示范了这条路的投诉代价）。

---

## 7. Outer Wilds —— 日志＝飞船上的两块屏（星图 + 传闻）

**structure**
- **零 HUD、零任务标记**：进度不由数值承载。开发日志（Mobius Digital Games 自述）写明 2017 年 12 月**重做飞船电脑**：因为"日志是玩家的『期刊』，它的组织方式极大影响玩家如何理解信息"，所以改成**更视觉化的方式，加一块『侦探板』**。
- 飞船电脑**只有两块屏**：一块**星图**（太阳系位置图，选中天体看条目）与一块**传闻/日志屏**（条目按天体分组，纯文字），文本是记录不是任务目标（Eurogamer 的分析把这称为该作"解决探索压力"的核心手法：30 分钟一轮循环，进度留在你脑子里和飞船电脑上）。
- 时间循环把"进度"从数字改写成"你知道多少"：仪表盘不需要，因为知识本身就是存档。

**surfaced**：你查了什么、知道什么；一块板面上一组关联条目。
**hidden**：所有数值型反馈（无 XP、无完成率、无收集统计）。信息组织按**地点**而非按**类型/时间**。

**→ 词笺 css_only**
1. **双屏骨架（上板下语）**：`[data-skin] .screen { display:grid; grid-template-rows:minmax(0,1fr) auto; min-height:100dvh; }`；上板＝"星图"装饰层 + 三个 `.readout` 当轨道上的点（`[data-skin] .readouts { display:contents }` + 每个 `.readout { position:absolute; }`，用 `%` 定位，`.readout__v` ≥24px 才允许用大字档 3:1）；下语＝`.today-card__reason` 一句 + `.start__actions` 满宽。
2. **侦探板连线**：`.screen::before { content:""; position:absolute; inset:8% 12% 40% 12%; background:repeating-radial-gradient(circle at 50% 50%, var(--border) 0 1px, transparent 1px 28px); mask-image:radial-gradient(circle at 50% 50%,#000 0 62%,transparent 78%); pointer-events:none; }`（同心轨道，纯装饰、被 mask 收在框内 → 360 零溢出）。
3. **按地点分组而不是按类型**：`.today-card__figure` 的四项（新词/到期/逾期/连续）本质是"四个地点"，用 `.today-card__tag` 作站点标记（`:nth-child` 分配 4 个位置，`transform:translate(-50%,-50%)` 居中到轨道交点）；`.start__spec` 关掉——它按"字段类型"分组，是这份调研里唯一该扔的表。

---

## 8. 对词笺的三个结构方向（改的是信息架构与版面骨架，不是配色）

> 三个方向各自改变「焦点在哪 / 数据放不放首页 / CTA 形态 / 导航位置 / 密度」中的至少三轴，并明确区别于 bento（冷灰等宽读数 + 不对称磁贴并列）、play（纵向文档流 + 厚按钮 + 按下沉 6px）、nocturne（墨蓝夜纸 + 零阴影排印）。共同前提：`.start__title`、`.start__lede` 一律 `display:none`。配色只是附属，每个方向都能套任意合法色板。

### 方向 A「一根线定版」—— 首页是一条结构轴，不是一篇文章
- **焦点**：距左缘 26% 处一条**从头贯到尾的强调色竖线**（`.start::after`）＋线上端一个巨型数字。所有东西沿这根线挂：线左侧只放标签（`.readout__k`、`.start__spec-k`、`.start__eyebrow`），线右侧只放值与动作。首屏重心明显偏右，形成强制不对称。
- **首页保留**：线 + **两个数**（`.readout` 今日、批数，`.readout:nth-child(3)` 已学关掉）＋ **一句原因**（`.today-card__reason`，唯一中文正文）＋ **一个 CTA**（斜切满宽块贴线右侧）＋ 一根日期书脊（`.start__masthead-meta` 竖排）。密度=词笺现有皮肤里第二低，但版面最"硬"。
- **被挪走**：`.start__spec` 四行工单表全关（阶段/今日新词/批次/已学在「我的」页与日历页都还在，见 `docs/research2/00-data-inventory.md` §6-A）；`.today-card__figures` 只留 1 个当线旁批注，其余到期/逾期/连续交给**日历页 hero**；`.today-card__links` 两个文字链退到**列表页顶部**（它们是导航，不是首页内容）；`.start__meta` 与 `.start__eyebrow` 的二段中文关掉。
- **CTA**：`clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), 12px 100%, 0 100%)` 的**切角满宽块**，高 ≥60px，贴在线右侧、距首屏底 1/3 处；选中/按压态用**色块顶出**（Persona 5 同款：`::before` 一块 accent 底板从左侧探出，`transform:translateX` 8px），而不是阴影加深。
- **本质区别**：bento 的秩序来自**磁贴尺寸的并列差**，play 来自**文档段落顺序**，nocturne 来自**字号与行距的排印**；A 的秩序来自**一根非居中的物理线**——它同时是栏格、是进度轴、是视线引导，页面第一次有了"装订边"。层级还额外用**对比度**（非当前项 `opacity:.55`）表达，这是 P5 明确写过的做法，现有 7 套都没用过。
- **风险**：竖线与切角都是纯装饰，命中区不受影响；360px 下线左侧仅 ~94px，`.start__spec-k` 若复用需注意 5.5em 中文换行——本方案已把 spec 关掉，无此风险。

### 方向 B「装框的一页」—— 首屏是一幅竖构图海报，数据只有一行
- **焦点**：整屏一张竖"画"：视觉中心是**一个数字**（`.readout__v:nth-child(1)` 今日新词，字号 `clamp(72px, 26vw, 150px)`，占首屏 ≥40% 高）＋**一条地平线**（`.start__rule` 拉成满宽地形带，`repeating-linear-gradient` 斜纹 + `mask` 渐隐）。没有卡片、没有边框、没有网格、没有第二栏。
- **首页保留**：一个大数 + 地平线 + 一行小字（`.start__kicker`：`四级 · DAILY LIST`，当版画落款）+ 底部一枚**圆形 CTA**。信息密度刻意做到**全站最低**：抄的是 Monument Valley「每一屏都能装框」＋ Celeste「镜头只拍到当下该看见的东西」——不该在场的统计，这一屏没拍到，而不是排在下面。
- **被挪走**：其余两个读数（批数/已学）、四个 `.today-card__figure`、`.start__spec`、`.start__meta`、`.today-card__reason` 两句、`.today-card__links` **全部离开首页**：到期/逾期/连续优秀 → 日历页 hero 的 `cal-figures`；阶段/词库量/每批词数 → 我的页（都已有落点）；批数与"待复习合计句"是首页独享，**挪走前先在日历 hero 补一行**（见 `00-data-inventory.md` §6-C 与 §5 的可复用字段）。
- **CTA**：底部居中一枚**圆形按钮**（`border-radius:var(--radius-full); width:min(30vw,104px); aspect-ratio:1`）——即 MV 通关后那个"底部圆圈"；文案五字两行 14px 排满；它是画面里唯一的可点物，其余入口退到顶栏（`.icon-btn` 保持 44px）。
- **本质区别**：其余皮肤都在**组织多个区块**；B 取消区块本身：一屏一物，读径从 F 型扫描变成单点凝视，导航全部上交顶栏与底部页。首屏 DOM 可见节点 ≤6 个。
- **风险**：超大数字要 AA 大字档 ≥3:1 且需处理"补零 2 位 vs 三位已学"的字宽跳变（`font-variant-numeric:tabular-nums`）；圆形按钮里的五字必须两行不破版；`.empty` 分支（空词库）要单独兜底成同一张海报，别散架。

### 方向 C「屋子就是菜单」—— 首页是一张平面，入口钉在位置上
- **焦点**：首屏没有文档流。`.screen` 变成**一张桌面/平面图**：主 CTA 是贴在平面下半的**唯一大物件**（占屏宽 74%、高 ≥88px、非圆角矩形、带"压印"边），四周钉着 4 个位置化入口/读数；平面背景用 `repeating-linear-gradient` 网格 + `.screen::before` 同心轨道（Outer Wilds 侦探板 / MV 立体模型语义）。
- **首页保留**：一句 `.today-card__reason`（唯一中文，落在 CTA 表面当"批注"）＋ `.readouts` 三数钉在平面**三个角**（Hades 的"常驻层"，每个 ≥44px 命中盒）＋ `.start__masthead-meta` 日期当平面抬头。四个 `.today-card__figure` 只留 1 个贴在 CTA 上（Celeste 的"统计印在地图上"），其余关掉。**首页不放任何表格。**
- **被挪走**：`.start__spec`（工单表）、`.start__meta`、`.start__eyebrow`、`.today-card__links` 全部离开首页——按 Hades 的三层预算，这些属于"一键之外"；导航去处：错词本 → 列表页/我的页，日历 → 顶栏既有 `.icon-btn`，皮肤 → 顶栏 `.icon-btn`，我的 → `.avatar-btn`（首页导航因此从"文字链"变成"顶栏 + 平面位置"，dock 不动）。
- **CTA**：物件级——`.btn--primary` 变成平面上的**一块可站的地方**：`position:absolute; inset:auto var(--page-x) calc(var(--dock-height) + 16px) var(--page-x); min-height:88px;`，按压态用 **6px 位移 + 内阴影**（区别于 play 的下沉：这里下沉的是"站上去的板"，不是按钮壳），学 Firewatch 的"操作世界而不是操作控件"。
- **本质区别**：A/B 无论怎么不对称都还是**竖直的文档流**；C 把版面从 1 栏变成 2 维——导航与数据靠**位置**表达层级（上/下/角/心），而不是靠顺序或尺寸并列。这是本领域独有（Hades 空间化 meta、MV 选关即立体模型、Zelda Pad 即设备）且现有 7 套完全没有的语法，纯 CSS（absolute + `%` + `:has()`）即可成立。
- **风险（必须先实测）**：① `display:contents` 之后 `position:absolute` 的**参照祖先**会变（最近的 `position:relative`），实现时要给 `.screen` 或 `.start` 明确 `position:relative` 并逐元素核对；② 360×640 下四个钉点会互相压字，须用 `width:max-content` + `text-align` 锁形并在 360 断点退化为"两钉点 + 两关掉"；③ 固定/绝对定位的 CTA 与既有 `.dock`、iOS 安全区叠加需真机验证；④ `prefers-reduced-motion: reduce` 下把 6px 位移关掉（保留位置）；⑤ 浅/深两档的"压印"阴影要分别定义（深色档不许沿用浅色档投影，多半换成描边 + 内发光）。

---

## 9. 落地前必须实测的坑（本域共性）

- **`display:contents` 是提层，不是魔法**：`.start__body`/`.start`/`.today-card__figures` 被拆后，原容器的 `gap`/`padding`/`border`/背景全部失效，间距必须在新父级重建；`.today-card__figure` 上的 `.is-warn`/`.is-accent` 语义色仍挂在 `<b>` 上，提层后不要指望卡片底色还在。
- **`position:absolute` 的参照系**：拆包后元素会去找别的祖先；每个钉点都要显式确认 `position:relative` 在哪一层，并在 360 档实测 `scrollWidth===clientWidth`。
- **斜切/圆切不吃命中区**：`clip-path` 与 `border-radius` 会裁掉可点区域——切角 ≤10px 或用伪元素画切角、实体保持 ≥44×44。
- **竖排/旋转文字**：`writing-mode` 与 `transform:rotate` 只用在**数字与拉丁刻印**上；成句中文（`.today-card__reason`、`.start__foot`）保持水平、≥14px、AA 4.5:1。Firewatch 那种"故意糊"不能抄成小字。
- **不对称必须仍单列**：390/360 下任何多栏都以"左右宽度不对称的单列"表达（如方向 A 的 26% / 1fr），768+ 才允许真正的双栏，1440 靠 `max-width:var(--content-max)` 收成海报，不做宽屏多栏。
- **红色语义守恒**：P5 的"主色即红"不能照抄——词笺单一强调色里，红只准出现在逾期/错误/危险；`--warning`/`--danger`/`--success` 浅深两档各写一遍（老坑，已在别的皮肤栽过两次）。
- **`:has()` 条件取景**：`b.is-warn` 只在特定状态下存在，两态都要有可读样式（不能"逾期为 0 时那块位置空着"）；旧 WebView 不支持 `:has()` 时要有默认态兜底。
- **伪元素文本只当装饰**：`content:` 造出的字母/符号不进无障碍树，不得承载唯一信息；所有真实数据必须来自既有 DOM 文本。
- **数字跳宽**：补零读数（02/002）用 `font-variant-numeric:tabular-nums` + 固定列宽，防止 360 下换行。

---

## 10. 来源

- Persona 5 菜单结构与设计流程（CEDEC＋KYUSHU 2017 和田和久 / 须藤正喜 演讲转述，中文）：https://www.chuapp.com/article/284630.html （原日文来源 https://www.famitsu.com/news/201711/13145540.html ）
- Persona 5 各界面逐屏解析（标题菜单＝场景机位；系统菜单白线左列选项＋右侧数据、悬赏令 EXP、日历左右分色、存档＝线圈本）：https://www.vgover.com/zh-tw/news/12008 ／同文简体 https://www.bilibili.com/opus/742048492130664470
- Persona 5 招贴/拼贴字体与"引导线 + 对比度分级"的动机（须藤正喜：Pop×Punk）：https://indienova.com/indie-game-development/p5-ui-design/
- Persona 5 菜单＝动态艺术、机位切换式选项（Hashino 访谈）：https://www.eurogamer.net/lets-talk-about-persona-5s-menus （西语镜像 https://www.eurogamer.es/entrevista-director-persona-5-katsura-hashino-menus ）
- Persona 5 UI 的学术侧写（风格化强度与可读性的权衡）：https://core.ac.uk/download/616926166.pdf
- Hades 信息架构三层预算、"信息放世界上不放 HUD"、冥王之家把 meta 空间化为独立交互物、文字过小与无色盲模式：https://teemo.dev/game-design/hades/systems/ux-ui-and-accessibility/
- Hades 主菜单实屏（左侧竖排四项 + 底部横向图形条，选中橙色高亮）：http://blackscreengaming.com/hades/menus/
- Hades 界面语法（面板/边框/标签同一套"凿刻+贴金"词汇）：https://designbycurio.com/learn/hades-underworld-supergiant-2020 （中文 https://designbycurio.com/zh/learn/hades-underworld-supergiant-2020 ）
- Hades 镜之夜＝独立屏（进度页不是设置页）：https://hades.fandom.com/wiki/Mirror_of_Night
- 王国之泪「没有的 UI 才是好 UI」＋读盘画面改为目的地地图（任天堂官方「仕事を読み解くキーワード」访谈，日文）：https://jp.ign.com/the-legend-of-zelda-tears-of-the-kingdom/78636/
- 王国之泪 UI/UX 逐项点评（Purah Pad 承载全部菜单、冒险日志按主线/支线/神殿分类并拆出"支线探险"、融合物品横向长列表是最大痛点、无按键重映射）：https://www.uied.cn/posts/24653 （英文原文 https://uxdesign.cc/tears-of-the-kingdom-how-nintendo-improved-and-ignored-ui-issues-843f094b14b2 ）
- 王国之泪具体交互问题清单（横向单行滚动、无排序图标、烹饪步数过多）：https://izaakbecker.com/zelda-totk-ux-case-study/
- 旷野之息/王国之泪「UI 存在感极限压低」的玩家侧反馈（プロ 档）：https://community.drownedinsound.com/t/the-legend-of-zelda-tears-of-the-kingdom-spoilers-itt/72656/621
- Celeste 选关屏的镜头裁切（山顶在第 7 章才入镜）与地图上一行统计（草莓/死亡数）：https://noctes.mathematicae.ca/peak-game-design-in-celeste.html
- Celeste「没有难度设置、只有一条内容阶梯」＋Assist 挂在文件选择页与其全屏说明文案沿革：https://teemo.dev/game-design/celeste/systems/difficulty-layering-b-sides/ 、https://teemo.dev/game-design/celeste/systems/assist-mode-and-accessibility-tuning/
- Monument Valley「每一屏都是可以装框的画」＋通关后底部圆圈继续 / 顶部相机拍照两个动作点：https://www.polygon.com/2014/3/18/5522874/monument-valley-everyone-finish/
- Monument Valley 零 chrome、控件嵌进建筑、无字教学：https://typenorm.com/apps/monument-valley ；等轴测视角与界面稳定性的学术分析：https://www.e3s-conferences.org/articles/e3sconf/pdf/2021/12/e3sconf_icersd2020_05097.pdf ；"几乎没有书面指引"的研究文本：https://works.hcommons.org/records/3p6x0-hxj89/files/201506_monument-valley.pdf
- Firewatch 极简 HUD（只有一个可关准星、背包几乎不用、就地读文档）：https://www.gamedeveloper.com/design/realism-in-games-what-makes-firewatch-feel-personal 、https://giantbomb.com/user-reviews/id/303787/i-kind-of-want-to-be-a-fire-watch-volunteer-now
- Firewatch 纸地图＝不在菜单/HUD 里、展开在手里、要拉近才读得清（可读性换真实感）：https://wnhub.io/zh/news/game-design/item-10979
- Firewatch 对话树/笔记作为世界内文本的研究：https://actaludologica.com/wp-content/uploads/2025/12/AL_2025-8-2_Study-1_Torzsok-1.pdf 、https://core.ac.uk/download/232614196.pdf
- Outer Wilds 飞船电脑两块屏（星图 + 传闻）与"进度留在电脑上"的循环设计：https://www.eurogamer.net/outer-wilds-absolutely-nails-this-one-thing-about-exploration
- Outer Wilds 开发团队（Mobius Digital Games）自述 2017 年 12 月重做飞船电脑、日志改"侦探板"式视觉组织：https://www.mobiusdigitalgames.com/news/archives/12-2017 ；飞船电脑条目按天体分组的实屏记录（文本内容，非布局说明）：https://outerwilds.fandom.com/wiki/Computer
- 跨游戏版式对称/不对称的结构研究（Firewatch、Monument Valley 居中对称；Persona 5 是唯一刻意不对称样本）：https://www.thinkmind.org/download_full.php?instance=VISUAL+2022
- 标题屏/主菜单作为独立研究对象的学术界定：https://netlibrary.aau.at/obvuklhs/download/pdf/10301835
- diegetic 分级框架的个案研究综述（TLOU2 极简、P5 强风格化、对马岛 diegetic 调制、Disco Elysium 排版密度）：https://fido.palermo.edu/servicios_dyc/proyectograduacion/archivos/8288.pdf
- 词笺内部事实基线：DOM 与令牌 `docs/SKIN_BRIEF.md`；皮肤专属结构的默认隐藏 `src/styles/skin-hooks.css`；首页数据可见性与可安全移除清单 `docs/research2/00-data-inventory.md`
