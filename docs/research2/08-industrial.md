# 08 · 工业/硬件品牌 —— 首页布局结构调研

> 领域：Teenage Engineering / Nothing / Braun / Dyson / Aesop / Apple 硬件页
> 视角：**只看骨架**——焦点在哪、几栏、密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。配色情绪一律不谈。
> 用途：为「词笺」皮肤系统提供结构方向。词笺约束：CSS-only（不改 DOM / 不加图片 / 不联网字体 / 不写 JS），新皮肤首页须删掉 `.start__title` 与 `.start__lede`。
> 对照基准：已有 bento（不对称磁贴）、play（厚按钮）、nocturne（夜纸排印）——本文所有方向必须与它们在**信息架构层**不同，仅换色一律作废。

---

## 0. 这个领域的共同骨架法则

工业/硬件品牌的版面不是「网页的排版」，而是**产品外壳的排版**——它们把印刷在机器面板、说明书、价签上的逻辑直接搬进屏幕。可归纳为五条结构法则：

1. **编号即导航**：区块不用标题党，用 `01 / 02 / 03`、产品代号、修订号来定序。序号承担了装饰的全部职能。
2. **标签-值（label/value）是唯一的组件**：参数、价格、状态全部拆成「小字标签 + 等宽值」的二元组，铺满页面即信息。Braun 的价签、TE 的 mono 价格行、Nothing 的 NDot 读数，全是这一个组件的变体。
3. **网格由 1px 细线暴露出来**：不靠卡片阴影分层，靠 hairline 分隔线与留白分层。「结构是看得见的」——网格本身就是设计。
4. **首屏数据极少，甚至为零**：TE 首页只有一张照片加一行公告；Nothing OS 桌面只有一块点阵大数字。数据要么只留一个焦点读数，要么全部推到二级页。
5. **CTA 反「按钮化」**：TE 用蓝色下划线文字链购买；Dyson 全站只有一个动作色、按钮是方角薄片；Braun 面板上的「按钮」是一个物理级的单一控件。CTA 要么退化为文字，要么膨胀为满幅开关——**没有中间态的圆角药丸**。

Aesop 是这个家族的旁支（药房/编辑式），贡献的是「严格网格 + 极端留白 + 纯文字售卖」的密度控制；Apple 贡献的是「居中铁塔 stack + 全宽色带分节」的零售骨架。

---

## 1. Teenage Engineering —— 「一张照片 + 一条标签栏，页面即产品目录」

**来源**：[PageProofer 拆解](https://pageproofer.com/inspiration/calm-minimal/teenage-engineering/)、[StyleGallery 品牌研究](https://github.com/changeroa/stylegallery/blob/0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff/showcase/teenage-engineering/brief.md)

### Structure（骨架）
- 首页 = **一张满幅黑白照片占掉整个首屏**（约 1440×2100），导航绝对定位浮在照片顶边，无背景条、无模糊、无分隔。
- 导航是**一行六个模块横排**：wordmark 左 → 四组「单线图标 + 26–28px 细字小写标签 + 3 行小字子链纵列」→ 日文小字块 + 描边 logo 右。每个模块顶对齐。
- 照片下面**只有一个全宽公告带**（黑底，两行居中大写细字，约 80px 纵 padding，**没有按钮**），再下面是一行式页脚。整页无卡片、无分栏、无节段节奏。
- 层级**只靠字号**（13px ↔ 27px 跳变），全站无粗体；标签体用 IBM Plex Mono（导航、价格、产品代号），正文 Inter Tight 负字距。近黑满幅产品舞台与米白 hairline 网格交替。
- 唯一大写体是公告（`NOW OPEN! WED–SUN 11AM–7PM`），唯一橙色像「机器上的一个旋钮」，购买是**蓝色下划线文字链**，不是按钮。

### Surfaced（放首页的）
- 一个场景陈述（店开了/新品发布）+ 导航本身。**零数据**：连产品渲染图都不放。

### Hidden（藏起来的）
- 全部商品价格、参数、购买路径推到产品页；营业时间等信息甚至只存在于照片里的霓虹灯牌中。

### CSS-only 转译（词笺可用手法）
- `.start__masthead` 用 `::before/::after` 造两行居中大写小字公告，配超大 `padding-block`（clamp 64–96px），做成「公告带」，`border-block:1px solid` 即可。
- CTA 去按钮化：`.btn--primary { background:none; border:0; border-bottom:1px solid var(--accent); border-radius:0; padding:2px 0 }`——但 44px 触控高要用 `min-height:44px` + flex 居中断面保证（下划线文字链 + 触控达标是这套手法唯一的坑）。
- `.topbar__meta` 与 `.brand__dot` 排成「单行 mono 状态栏」：`.topbar { font-family:'IBM Plex Mono'; letter-spacing:.06em }`，`.readouts` 整组 `display:none`，数据推日历页。

---

## 2. Nothing —— 「640px 单列 + 点阵大读数，桌面只有一个数字」

**来源**：[AIGiner Nothing 参考页](https://www.aiginer.com/labs/references/nothing/)、[Nothing Design Tokens](https://cdn.jsdelivr.net/npm/imhcode@3.1.0/skills/nothing-design/references/tokens.md)、[Nothing OS 桌面复刻规格](https://raw.githubusercontent.com/Roqak/NothingLauncher/refs/heads/main/2-product-overview.md)、[ui-craft 粗野主义预设（Nothing-phone UI）](https://github.com/educlopez/ui-craft/blob/main/examples/presets/brutalist.md)

### Structure（骨架）
- 网站内容宽度只有 **640px**——移动优先的极限形态：全站单列、窄幅居中，靠 8px 间距制（8/16/24/32）与 1px 边框呼吸，像一份被居中的技术文档。
- 字体三分工是结构件：**NDot57 点阵体只做大号数字读数**（时钟、计数），Space Grotesk 做正文，Space Mono 做 `11px / 0.08em 大写 tracking` 的标签。Type-as-hero、可见网格、裸露结构件（raw chrome）。
- Nothing OS 桌面（仪表盘类比）：**4×6 网格、单色图标、dock 下无标签、大量留白**，首屏视觉焦点是一块**点阵大字时钟/读数组件**——整个「首页」的数据只突出一个数字，其余全部对齐在网格里降为噪声以下的灰度。
- 产品图直接坐在中性底上，无容器、无卡片阴影。

### Surfaced（放首页的）
- 一个巨号读数（时间/计数）+ 大写 mono 标签；产品名。

### Hidden（藏起来的）
- 图标下的文字标签、其余次要数据（降为 300 字灰或挪出首屏）、一切装饰性图形。

### CSS-only 转译
- 焦点读数：`.today-card__figure:nth-child(1) b { font-family:'IBM Plex Mono'; font-size:clamp(64px,22vw,96px); line-height:1 }`，`.today-card__figure:not(:first-child) { display:none }`（另两个数挪我的页/复习会话页承接），`.today-card__tag` 改 11px 大写 `letter-spacing:.08em` mono 标签。
- 单列窄版文档感：`.start { max-width:560px; margin-inline:auto }` + 8px 间距制的 `row-gap`；`.readouts` 整组降级为页尾一行灰字（`font-weight:300`）。
- 点阵味可用 `background-image:radial-gradient(circle, currentColor 1px, transparent 1.5px)` + `background-size:4px 4px` 做数字背后 4% 透明度的点阵底纹——纯 CSS，无需图片。

---

## 3. Braun —— 「价签逻辑：序号 + k/v 行 + 一根细线，网格是被暴露的测量系统」

**来源**：[Braun Grid System 解读（视觉手册作为工作文档）](https://onlyonceshop.com/blog/the-braun-grid-system)、[Dieter Rams/Braun 设计配方](https://craftwork.design/skills/web-design-engineer/.well-known/agent-skills/web-design-engineer/references/style-recipes/dieter-rams-braun.md)、[Braun 色与字分析](https://www.omoro.io/brands/braun)

### Structure（骨架）
- 核心不是「极简风」而是**控制逻辑**：价签、说明书、传单、橱窗共用同一套网格/间距/度量系统，「决定在内容到来之前就做好了」。可重复的秩序，不是风格。
- 组件语言 = **编号 + 标签-值行 + hairline**：产品名一行、参数成表、每条信息落在固定的栏格位置；数字偏好等宽变体；「一个信号点」（电源橙点）只出现在功能位。
- 版面密度低但**对齐密度极高**：物体检视为素底上的干净对象，层级靠网格位置而非字重（正文 400、强调 500、从不 700）。
- 中性灰阶 + 单功能强调色；「Less, but better」在骨架层意味着：**删不掉的那根线才留下**。

### Surfaced（放首页的）
- 规格本身——参数表就是正文，没有「卖点文案」层。

### Hidden（藏起来的）
- 图像装饰、色彩情绪、按钮化导航（状态靠位置表达）。

### CSS-only 转译
- `.start__spec` 就是现成的工单表，升级成 Braun 价签：`display:grid; grid-template-columns:auto 1fr; ` 每行 `border-bottom:1px solid`，行号用 counter：
  `.start__spec { counter-reset:row } .spec__row::before { counter-increment:row; content:"0" counter(row) " — "; font-family:'IBM Plex Mono'; color:var(--faint) }`（按实际类名选 `.start__spec > *`）。
- `.readouts` 重排为**三行 k/v**（`display:grid; grid-template-columns:1fr auto; ` + `row-gap` 8px 制），标签 11px 大写，值等宽右对齐——把「读数卡」拆成「仪器清单」。
- 强调色只给一个点：`.brand__dot` 是唯一彩色，`::after` 给 `.btn--primary` 加一个 `content:"▸"` 信号字符即可。

---

## 4. Dyson —— 「满幅黑白舞台交替 + 内容左对齐，全站只有一个动作色」

**来源**：[Refero Dyson 样式规范](https://styles.refero.design/style/96845df2-7ddb-420a-814e-c339f95a6554)、[OpenDesign Dyson 拆解（12 栏/断点/布局规格）](https://opendesign.cc/zh-CN/sites/dyson)、[优网科技 Dyson 官网拆解（中文）](https://www.uweb.net.cn/zhishiku/wangyeUIsheji/35689.html)

### Structure（骨架）
- **全宽英雄区、内容左对齐**，下方接 12 栏网格的产品卡片带（container 1440 / gutter 24 / 断点 768、1024）；近黑满幅带与白底带**交替成节**，页面像博物馆展柜轮换。
- 表面完全扁平：**无阴影、无渐变、无圆角>8px（按钮 2px）**，结构全靠明度对比与 hairline；字重封顶 300–500，大号展示文字反而是轻字重。
- **导航状态不靠颜色靠位置**；交互色全站只有一种（一个绿/一个蓝），所有「购买/了解更多」同一色——「绿 = 唯一行动入口」，用户不需要读按钮文字。
- 详情页是「奖杯式叙事流」：产品图巨幅居中、文字分屏左右咬合，把电商做成杂志。

### Surfaced（放首页的）
- 一个产品叙事（图 + 短标题 + 一个动作）。

### Hidden（藏起来的）
- 价格促销层、多种 CTA 颜色、卡片容器感——数据被压进页尾规格表。

### CSS-only 转译
- 黑白满幅交替：`.start > section:nth-of-type(even) { background:var(--ink); color:var(--paper) }` + 各自 `::before { position:absolute; inset:0; margin-inline:-16px }` 把底色横向撑破容器边距，做出「满幅带」而 DOM 不动。
- 唯一动作色：`.btn--primary` 全站唯一实心色块、2px 圆角、`min-height:48px`；其余可点元素一律文字链（`text-decoration:underline; text-underline-offset:3px`）。
- 轻字重层级：`.readouts .readout__v { font-weight:300 }`（Space Grotesk 有 300），把「读数」从强调降为冷静仪表刻度。

---

## 5. Aesop —— 「严格网格 + 三分法 + 极端留白，不靠一张照片卖货」

**来源**：[Aesop Design System（zeroheight：Layout 章节）](https://zeroheight.com/5d543d8ca/p/616884-layout)、[AIGiner Aesop 参考页](https://www.aiginer.com/labs/references/aesop/)、[shadcn Aesop DESIGN.md](https://www.shadcn.io/design/aesop)

### Structure（骨架）
- **奇数间距制 + 三分法规则**：官方 DSM 明言布局按三分法做「视觉动态」，间距分横（排版驱动）纵（组件最小距驱动）两套，eyebrow 小标签与正文之间用 5/10/15px 级别的微距差建立层级。
- 刚性网格 + 极宽页边距，内容像印在大幅面纸上的一栏文字；零阴影、零圆角（除 50px 圆形功能件）、1px 边框做结构分隔。
- 版面主体是**文字本身**：产品名、成分句、编号按编辑式排印铺成纵向序列，图片只作背景氛围，从不作信息载体。层级 400 字重内完成。

### Surfaced（放首页的）
- 一段可精读的文本流（eyebrow → 正文 → 下一节），无数字仪表盘。

### Hidden（藏起来的）
- 促销、评分、价格对比等电商噪声全部推到列表/详情层级。

### CSS-only 转译
- 三分法偏置：`.readouts { display:grid; grid-template-columns:1fr 2fr }` 让第一个读数独占窄列、其余两个挤宽列——非对称基线，纯布局改动。
- 极端留白：`.start { row-gap:clamp(48px,12vh,96px) }` + `.start__meta, .start__spec { margin-left:auto; max-width:34ch }` 把工单表推到版面的「右下三分之一」。
- eyebrow 微层级：`.start__eyebrow { font-size:11px; letter-spacing:.14em; text-transform:uppercase }` + 与下一块 `margin-top:6px` 的微距，复刻 DSM 的 eyebrow→正文节奏。360px 下用 `max-width:100%` 解锁单列。

---

## 6. Apple 硬件页 —— 「居中铁塔 stack + 全宽明暗 tile 带循环」

**来源**：[StyleGallery Apple iPhone 页拆解](https://github.com/changeroa/stylegallery/blob/0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff/showcase/apple-iphone/brief.md)、[VoltAgent apple DESIGN.md](https://github.com/voltagent/awesome-design-md/blob/3b605329240ce735b510037cca322f1831fdd7f8/design-md/apple/DESIGN.md)

### Structure（骨架）
- 首屏是**居中纵向铁搭 stack**：区域提示 → 巨号产品名（40px/600）→ 一行 tagline → **两个并置 CTA（实心 + 文字链）** → 产品渲染。全部居中轴线上，除产品外无颜色。
- 往下是**全宽 tile 带循环**：浅色带/羊皮纸带/近黑带交替（tile padding 80px、无圆角），每带同一内容栈换底色；旁挂「购买理由横向轮播」「配件瓦片」「可扩展设备面板」「目录带」「脚注区」。
- 导航 sticky 半透明；默认无阴影，「产品渲染自带系统阴影」承担全部立体感；价格藏在 chip 网格与脚注星号里。

### Surfaced（放首页的）
- 产品名 + 双 CTA；数据全部是营销化的（芯片性能倍数），不是仪表盘。

### Hidden（藏起来的）
- 技术参数表整体推到 Tech Specs 二级页；购买配置在独立 buy 页。

### CSS-only 转译
- `.start__masthead { text-align:center }` + `.start__actions { display:flex; justify-content:center; gap:24px }`，`.btn--primary` 实心 pill 之外把 `.today-card__links a` 伪装成第二个文字链 CTA（`::after{content:" ›"}`），凑出「实心 + 文字」双 CTA 结构。
- tile 带：`.today-card { border-radius:0; padding-block:64px; margin-inline:-16px; background:var(--tile) }` 满幅化；`::after` 造 footnote 星号行。
- ⚠️ 与 bento 的差异必须靠「全宽交替带」而非「磁贴分割」，否则退化回换色。

---

## 7. 横向对比：骨架轴矩阵

| 产品 | 焦点 | 栏数 | 密度 | 导航 | CTA 形态 | 首页数据量 |
|---|---|---|---|---|---|---|
| Teenage Engineering | 满幅场景+公告 | 单幅横排 | 极低 | 浮动横排（标签+子链） | 下划线文字链 | 0 |
| Nothing | 点阵大读数 | 640px 单列 | 低-中 | 顶部细线横排 | 方角薄片/文字 | 1 个读数 |
| Braun | 参数表 | 严格多栏格 | 中（行式） | 位置表状态 | 面板上的单一控件 | 全量，但呈 k/v 行 |
| Dyson | 产品叙事舞台 | 满幅带交替 | 低 | 顶部，色不指示状态 | 全站唯一色实心块 | ≈0（营销数字另算） |
| Aesop | 文字流 | 刚网单栏宽边 | 极低（留白主导） | 顶部小字 | 文字链 | 0 |
| Apple | 居中 stack + tile 带 | 全宽带内居中 | 中-高 | sticky 半透明 | 实心+文字双 CTA | 营销化数据 |

**词笺可提炼的三根结构杠杆**：① 数据收敛为「一个大读数」或「一列 k/v 行」，磁贴化是外来物；② CTA 两极化——要么满幅开关要么下划线文字，拒绝普通按钮；③ 序号 + hairline + 留白可以完全替代卡片、图标与装饰。

---

## 8. 给词笺首页的 3 个结构方向

> 前提复述：标语 `.start__title` 与玩法段 `.start__lede` 一律 `display:none`；所有方向在 360px 零横向溢出（满幅元素用 `margin-inline:calc(50% - 50vw)` 撑破容器，不用 `width:100vw` 避免滚动条溢出）。

### 方向 A ·「面板」—— 机器前面板，CTA 是满幅总开关

**一句话**：把首页倒转成一块设备前面板：顶部一条机械计数窗，底部一格占据屏高 18–22% 的固定总开关，中间是空面板。

- **骨架**：`body/app__main` 顶部 `.readouts` 重排为**贴顶 sticky 横条**：三等分 `grid-template-columns:repeat(3,1fr)`，每格「11px 大写 mono 标签在上 + 等宽值在下」，像 OP-1 顶部的三条小读数窗，底边 1px hairline。标语区删除后 `.start` 中段只留 `.today-card__reason` 一行状态字 + 大面积留白。`.btn--primary` 用 `position:fixed; inset-inline:0; bottom:0; height:clamp(64px,11vh,84px); border-radius:0` 变成**整屏宽的物理开关条**，`::after` 刻 `POWER — START DRILL` 类辅助字，按下态 `transform:translateY(2px)` + 内阴影仿行程（面板需给底部让位：`.start{padding-bottom:96px}`）。
- **焦点**：底部开关（拇指热区），其次顶部三读数。
- **数据**：3 个 readouts 上浮成计数窗；`.today-card__figures` 与 `.start__spec` `display:none`——数字详情去日历页/我的页，工单参数去我的页。首屏数据总量 = 恰好 3 个。
- **360px**：计数窗三格各留 1 位数 + 缩写标签（`font-size:clamp()` 缩值）；开关条满幅天然达标。
- **与既有皮肤的本质差异**：bento/play/nocturne 都是「从上往下滚的文档流」；A 把 CTA 从文档流里**抠出来钉死在屏幕底**，首页变成一屏仪表盘面板，滚动内容被清空。导航仍在顶栏但被降格为 hairline 下的一条小字。

### 方向 B ·「工单」—— 640px 连续编号文档，数据拆行、全表面化

**一句话**：首页是一份窄幅技术文档：每个区块冠以 `01./02./03.` 序号，`.readouts` 被 `display:contents` **拆散**塞进正文行内，整页只有 hairline 与序号，无任何容器。

- **骨架**：`.start { max-width:560px; margin-inline:auto; display:grid; row-gap:24px }`。`counter-reset:sec` + 各直接子项 `counter-increment:sec; ::before { content:"0" counter(sec) " / "; font-family:'IBM Plex Mono'; color:var(--faint) }` 给 masthead、spec、actions、today-card、foot 冠号。关键动作：**`.readouts { display:contents }`** 把三个 `.readout` 从顶部提升为 `.start` 的直接 grid 子项，用 `order:-1…-3` 排在文档最前，各自做成一行「`00x — 标签 ……… 值`」的点线引导行（`::after { content:""; flex:1; border-bottom:1px dotted }`）；`.start__spec` 的 4 行 k/v 同构排成第二张清单表；`.today-card__head/__figures/__links` 拆为连续段落，`display:contents` 让 figure 变成行内「tag:值」对，`__reason.is-*` 保留为文档中唯一带左边框 2px 的批注行。CTA：文档末尾一条**满栏方角细边框按钮**（`border:1px solid; background:none`），`::after { content:" →" }`，是 Braun 价签上的「下单」而非 App 按钮。
- **焦点**：无单一焦点——**阅读流本身**，从计数行扫到签名线。
- **数据**：全量保留（readouts + spec + figures 都在首页），但全部**行式化**：这是与 bento 最本质的不同——数据不再是可扫视的磁贴，而是可通读的清单。
- **360px**：文档流天然安全；点线引导行在窄屏把标签压到 10–11px 仍 ≥ 触控无关（纯文本）；无横向元素。
- **与既有皮肤的本质差异**：paper/foundry 等仍是「块状分区」；B 通过 `display:contents` **消灭了 DOM 上的分组结构本身**，把三个原本在不同位置的组件熔成一份连续的编号卷宗。foundry 是铸造质感（金属块面），B 是纸面工单（线性清单），骨架动词相反：一个堆体量，一个铺行。

### 方向 C ·「机库」—— 100svh 分屏海报，竖排编号导轨 + 单一大数字

**一句话**：首页是一屏（不外滚）的硬件发布海报：左侧 48px 竖排导轨承担导航与编号，右侧整屏只放**一个 30vh 级的大数字**和它下面的一条细长 CTA，其余全部推走。

- **骨架**：`main .screen:has(.start) { min-height:calc(100svh - var(--topbar-h)); display:grid; grid-template-columns:48px 1fr }` 不可行（DOM 深度不够）——落地版：`.start { display:grid; grid-template-columns:48px 1fr; min-height:calc(100svh - 56px) }`，`.start__masthead` 用 `writing-mode:vertical-rl; text-orientation:mixed` 塞进左列做成**竖排书脊导轨**（品牌名 + `01/02/03` 通道编号，`::after` counter 生成），导轨兼作导航替代：`.topbar` 绝对定位 `position:fixed; inset:0 0 auto` 保留但压成透明浮层（对齐 TE 浮动导航），真正的入口序列在书脊上。右列：`.today-card__figure:first-of-type b { font-size:clamp(112px,30vw,240px); font-family:'IBM Plex Mono'; display:block }` 为绝对焦点，其 `::after` 挂 11px 大写 mono 单位标签；`.btn--primary` 变成数字正下方一条 `max-width:280px` 的细长方形（高 48px，2px 圆角，满幅色块——Dyson 式唯一动作色）；`.start__spec`、其余 figures、`.readouts` 全部 `display:none`。
- **焦点**：一个数字。首屏数据量 = 1。
- **数据**：连续天数（或今日新词）独占首页；readouts → 日历页（已有同源数据）、总量 → 我的页、复习队列 → 即时复习页；spec → 我的页底部。海报页拒绝信息密度，这是 Nothing OS 桌面「一个时钟组件」的网页版。
- **360px**：`clamp(112px,30vw,240px)` 时 30vw≈108px 仍不溢出（数字最多 3 位；若 4 位用 `letter-spacing:-0.04em` 保险）；导轨 48px 时内容列 312px 可用；`@media(min-width:768px)` 导轨放宽到 72px、数字升到 240px。
- **与既有皮肤的本质差异**：全部 7 套皮肤首页都是纵向长文档；C 把首页改成**不外滚的一屏海报 + 常驻竖排导轨**——导航位置（文档流顶部 → 屏幕左缘书脊）、密度（多块 → 1 数字）、CTA 角色（区块成员 → 海报中的唯一标签）同时换骨架。nocturne 的「零阴影排印」在 C 里只是副产品，不是卖点。

---

## 9. 风险与合规备忘（实现时逐条核对）

- **AA 对比度**：mono 小标签（11px 在词笺规则下正文须 ≥14px——**标签类小字建议直接 12→14px 起步**，仅装饰性 `content:"01 /"` 前缀可小于 14px 因为它不承载信息）；C 方向的 30vw 大数字走 3:1 大字标准没问题，但竖排导轨上的文字必须 ≥4.5:1。
- **44px 触控**：A 的开关条、B 的方角按钮、C 的细长 CTA 都天然 ≥44px；但 B 的「点线引导行」若整行可点需给 `min-height:44px`；C 的竖排导轨条目各自 `padding-block` 撑到 44。
- **360px 溢出源**：A 的 fixed 开关条（用 `inset-inline:0`，勿用 `width:100vw`）；B 的 `max-width:560px` 容器要 `margin-inline:auto; padding-inline:16px`；C 的满幅数字 `font-size` 必须 `vw` 系 clamp。
- **红色语义**：三方向中红色只允许出现在 `.today-card__reason.is-overdue` 类状态行（C 的批注行左边框），其余强调一律单色。
- **深浅两档**：A 的开关条内阴影、B 的点线、C 的导轨边框都要在 nocturne 式深底上重写一遍（`color-scheme` 感知的 `color-mix()` 或双档自定义属性）。
- **不要与 foundry 撞车**：B 落地前先看 foundry.css 是否已用「工单表 + 序号」作为主骨架；若已占用，把 B 的 `display:contents` 行式化改配「全 hairline 无边距密排」以示区别。

---

## 10. 来源清单

1. https://pageproofer.com/inspiration/calm-minimal/teenage-engineering/ （TE 首页完整拆解：布局/导航/组件/注意项）
2. https://github.com/changeroa/stylegallery/blob/0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff/showcase/teenage-engineering/brief.md （TE 目录系统：mono 标签导航、hairline 网格、文字链购买）
3. https://www.aiginer.com/labs/references/nothing/ （Nothing 站点规格：640px 内容宽、8px 间距制、透明网格）
4. https://cdn.jsdelivr.net/npm/imhcode@3.1.0/skills/nothing-design/references/tokens.md （Nothing tokens：NDot 仅大号读数、11px/0.08em mono 标签）
5. https://raw.githubusercontent.com/Roqak/NothingLauncher/refs/heads/main/2-product-overview.md （Nothing OS 桌面骨架：4×6 网格、点阵读数组件、dock 无标签）
6. https://github.com/educlopez/ui-craft/blob/main/examples/presets/brutalist.md （Nothing-phone 粗野预设：type-as-hero、可见网格、裸露结构）
7. https://onlyonceshop.com/blog/the-braun-grid-system （Braun 视觉手册的网格/度量控制逻辑）
8. https://craftwork.design/skills/web-design-engineer/.well-known/agent-skills/web-design-engineer/references/style-recipes/dieter-rams-braun.md （Braun 配方：等宽数字、单信号点、字重≤500）
9. https://www.omoro.io/brands/braun （Braun 功能极简的结构要素）
10. https://styles.refero.design/style/96845df2-7ddb-420a-814e-c339f95a6554 （Dyson：扁平表面、hairline 结构、位置表状态）
11. https://opendesign.cc/zh-CN/sites/dyson （Dyson 布局规格：12 栏、全宽英雄区内容左对齐、字重 300）
12. https://www.uweb.net.cn/zhishiku/wangyeUIsheji/35689.html （Dyson 中文拆解：单一 CTA 色统治全站）
13. https://zeroheight.com/5d543d8ca/p/616884-layout （Aesop DSM Layout：三分法、奇数间距、eyebrow 节奏）
14. https://www.shadcn.io/design/aesop （Aesop：零阴影零圆角、hairline 分隔）
15. https://github.com/changeroa/stylegallery/blob/0bf928f6269b1cb6cf24f04e0bf28a8ce2bbc0ff/showcase/apple-iphone/brief.md （Apple iPhone 首页结构序列：居中 stack + tile 带）
16. https://github.com/voltagent/awesome-design-md/blob/3b605329240ce735b510037cca322f1831fdd7f8/design-md/apple/DESIGN.md （Apple 组件规格：product-tile 明暗带、双 CTA stack）
