# 词笺 · 设计系统 (DESIGN_TOKENS v2)

> 这一版从「一套风格」升级成**四套排印系统（皮肤）+ 两个明暗档**。
> 结构层（一页 5 词、底部 4 控件、遮挡自测）不随皮肤变化；变的只有字体、色彩、线条、形状与信息密度。
>
> 硬规则：**同一屏只允许一套皮肤**；每套皮肤 **≤2 个字体族、1 个强调色、≤3 档阴影**；所有实现只引用令牌变量，禁止裸色值裸尺寸。

---

## 0. 机制

### 0.1 两个正交维度

| 维度 | 载体 | 取值 |
|---|---|---|
| 皮肤 | `<html data-skin="…">` | `paper`（默认）/ `foundry` / `instrument` / `broadsheet` |
| 明暗 | `<html data-theme="…">` | `light` / `dark`（`system` 由 JS 解析成前两者） |

- 4 × 2 = 8 种组合，都必须成立。**皮肤不是「换色号」**：字体、字号阶梯、线宽、圆角、阴影、控件形状一起换。
- 持久化在 `localStorage['cijian.v1'].profile.skin`；切皮肤不重置词库、进度、批次。

### 0.2 令牌同名覆盖（实现约定）

`src/styles/tokens.css` 定义 `:root` 与 `[data-theme="dark"]` 的基础令牌。每套皮肤在自己的 CSS 里**用同名变量重新赋值**，于是 `app.css` 里所有既有规则自动跟着换皮肤，无需复制组件样式：

```css
/* src/styles/skins/foundry.css */
[data-skin='foundry'] { --bg: #fff; --text: #0b0b0b; /* … */ }
[data-skin='foundry'][data-theme='dark'] { --bg: #0b0b0b; /* … */ }
```

`app.css` 里表达不了的（斜条纹遮挡、刻度尺、双线报头、报尾工具条）才写组件级覆盖，且**所有选择器必须以 `[data-skin="…"]` 开头**。

### 0.3 文件结构

```
src/styles/
├── tokens.css        # paper 的令牌（原样保留）
├── app.css           # 结构与 paper 的组件样式（原样保留）
├── skin-fonts.css    # 全部 @font-face，自托管，不联网
├── skin-hooks.css    # 皮肤专属结构的默认隐藏 + 外观选择卡片骨架
└── skins/
    ├── foundry.css
    ├── instrument.css
    └── broadsheet.css
```

### 0.4 结构钩子（默认 `display:none`，由皮肤显式打开）

| 钩子 | 内容 | 归属皮肤 |
|---|---|---|
| `.topbar__meta` | 品牌旁小字：阶段 · 第几批 · 几个词 | foundry, broadsheet |
| `.readouts > .readout > .readout__k/__v` | 三个读数块（批 / 本批 / 已学） | instrument |
| `.start__spec > .start__spec-row > .start__spec-k/__v` | 开始页四行元信息 | foundry, instrument, broadsheet |
| `.start__kicker` | 开始页报头下的 kicker 行 | broadsheet |
| `.start__masthead > __brand/__rule/__meta` | 开始页大报头 | broadsheet |

---

## 1. 皮肤 A · paper「词典纸页」（默认，原版）

暖白纸、墨黑字、朱砂点睛；靠字号、字重、留白和发丝线建立层级，不堆卡片、不用渐变。

| Token | light | dark | 用途 |
|---|---|---|---|
| `--bg` | `#F6F3EC` | `#12110E` | 页面底色 |
| `--surface` | `#FFFFFF` | `#1B1A16` | dock、抽屉、输入框 |
| `--surface-sunken` | `#EFEAE0` | `#201E18` | 进度槽、分段底、遮挡替换 |
| `--border` / `--border-strong` | `#E2DCD0` / `#CFC7B8` | `#302D24` / `#423E32` | 发丝线 / 描边 |
| `--text` / `--text-secondary` / `--text-tertiary` | `#191817` / `#57534A` / `#6E685B` | `#EFEAE0` / `#A8A295` / `#918A7D` | 16.0:1 / 6.9:1 / 5.0:1 |
| `--accent` / `--accent-press` / `--accent-weak` | `#B23A2A` / `#93301F` / `#F3E4DE` | `#E5795E` / `#F0907A` / `#34211C` | 5.37:1 on bg |
| 字体 | `--font-serif` = Newsreader（英文）+ 系统无衬线（中文 / UI） | | |
| 字号 | display 34 / h1 26 / h2 21 / body 16 / small 13；单词 `clamp(22px,5.6vw,27px)` | | |
| 圆角 / 阴影 | 8 / 12 / 18 / full；sm/md/lg 三档柔和阴影 | | |

---

## 2. 皮肤 B · foundry「铅字」

> 一家只印活字的印刷厂。硬边、黑即黑。

| Token | light | dark |
|---|---|---|
| `--bg` | `#FFFFFF` | `#0B0B0B` |
| `--surface` | `#F1F0EC` | `#151513` |
| `--border` / `--border-strong` | `rgba(11,11,11,.22)` / `#0B0B0B` | `rgba(242,242,240,.22)` / `#F2F2F0` |
| `--text` / `--text-secondary` / `--text-tertiary` | `#0B0B0B` / `#52524C` / `#85857C` | `#F2F2F0` / `#A9A9A0` / `#7E7E77` |
| `--accent` / `--accent-press` | `#D93A16` / `#A82A0E` | `#FF4A21` / `#C43A16` |
| 字体 | Space Grotesk 700（英文、字距 −0.035em）+ IBM Plex Mono（序号、音标、标签、按钮，大写 +0.08em） | |
| 字号 | 单词 `clamp(26px,7.2vw,34px)`；释义 15/14；等宽微标签 10–13 | |
| 线与形 | 1.5px 实心墨线做行分隔与控制条分格；1px 竖线贯穿序号列；**圆角 0**（遮挡块 2px）；**阴影只允许硬投影** `4px 4px 0` | |
| 专属 | 遮挡 = 45° 斜条纹；激活控件 = 墨底反相（暗色改「白线 + 升一档底」，不做白板）；开始页 = 印刷工单表 | |

---

## 3. 皮肤 C · instrument「仪表」

> 精密测量仪器。深色原生、等宽数字、刻度感。

| Token | light（实验室白） | dark（原生） |
|---|---|---|
| `--bg` | `#F1F2F4` | `#0B0D0F` |
| `--surface` | `#FFFFFF` | `#12151A` |
| `--border` / `--border-strong` | `#D6DAE0` / `#B9C0C8` | `#20252C` / `#2A3038` |
| `--text` / `--text-secondary` / `--text-tertiary` | `#0C1013` / `#5A626B` / `#626A73` | `#E6E8EB` / `#98A0A9` / `#6B737C` |
| `--accent` | `#FFB020`（仅非文本块）/ 文字色 `#A35A00` | `#FFB020`（文字直接用） |
| 字体 | IBM Plex Sans 600（单词、字距 −0.012em）+ IBM Plex Mono（全部数字、标签、音标、按钮，大写 +0.12em） | |
| 字号 | 单词 `clamp(26px,7.2vw,34px)`；读数 15；等宽微标签 9–11 | |
| 线与形 | 圆角 2px；**零阴影**；层级只靠 1px 线与明度差；刻度尺 / tick 只在顶栏与底部各出现一次 | |
| 专属 | 顶栏三读数块 + 14 段刻度进度尺；底部「4 通道」，激活通道顶线转琥珀；遮挡 = 点阵网格；开始页 = 开机自检 | |

---

## 4. 皮肤 D · broadsheet「词表报」

> 一份只印单词的日报。编辑部排版、栏线、刊号。

| Token | light | dark |
|---|---|---|
| `--bg` | `#F4F4F1`（中性灰白，不许偏黄） | `#131311` |
| `--surface` | `#FFFFFF` | `#1B1B18` |
| `--border` / `--border-strong` | `rgba(20,20,15,.30)` / `rgba(20,20,15,.62)` | `rgba(238,237,231,.28)` / `rgba(238,237,231,.56)` |
| `--text` / `--text-secondary` / `--text-tertiary` | `#14140F` / `#4C4C45` / `#7A7A70` | `#EEEDE7` / `#B9B7AD` / `#8C8A80` |
| `--accent` | `#1B2E6B`（靛蓝） | `#93A8F0` |
| 字体 | Instrument Serif 400（报头、单词、音标 italic）+ IBM Plex Mono（kicker、刊号、页码、按钮，大写 +0.16em） | |
| 字号 | 单词 `clamp(30px,8vw,38px)`；释义 15/1.6；kicker 9–10 | |
| 线与形 | 圆角 0；零阴影；分隔只靠 1px 细线 + 关键处 3px 双线 | |
| 专属 | 报头 + 日期 + 刊号；词条 = 序号 kicker + 单词 + 释义（768+ 两栏带 column-rule）；底部做成报尾工具条（无按钮壳）；遮挡 = 报纸涂黑 | |

---

## 5. 组件契约（跨皮肤共用）

### 5.1 单词行
结构固定：`.word-row__index`（序号）+ `.word-row__body`（`.word-row__head` = 单词 + 音标；`.word-row__meanings` = `.meaning.meaning--main` + `.meaning.meaning--extra`）。
皮肤只能改：序号列宽、单词/音标同一行还是分两行、词性 `.meaning__pos` 的形态、行分隔线、行内边距。**不许改语义顺序**。

### 5.2 底部控制区
四个控件固定：中文 / 英文 / 上一批 / 下一批。状态只许用 `aria-pressed` 与 `:disabled` 表达；皮肤决定它们是「4 格按钮」「4 个通道」还是「报尾文字工具条」。触控区 ≥44×44。

### 5.3 遮挡态
`.masked` 统一由皮肤决定外观（墨条 / 斜条纹 / 点阵 / 涂黑墨块）。行为不变：整行可点、单行偷看、本批内保持可见、`aria-hidden` 对读屏器隐藏。

### 5.4 浮层
抽屉 `.sheet`、对话框 `.dialog`、遮罩 `.scrim` 跟随皮肤，但**必须保持**：底部抽屉 200ms 上滑、Esc 关闭、焦点陷阱、遮罩点击关闭。

### 5.5 外观选择
`.skin-grid` / `.skin-card` 在 `skin-hooks.css` 里已用令牌写好中性骨架；皮肤只微调形状语言（圆角、边框粗细、字重），不得重排信息。

---

## 6. 无障碍与验收

- 正文 ≥14px（等宽微标签允许 10–11px，仅用于序号/刊号/注脚这类非正文信息）；正文对比度 ≥4.5:1，大字 ≥3:1。
- 触控目标 ≥44×44；`:focus-visible` 用 2px 强调色描边 + 2px offset。
- 尊重 `prefers-reduced-motion`；深浅切换首帧不闪。
- 三档视口（360 / 768 / 1440）× 浅深 × 4 皮肤全部检查：无横向滚动、5 词同屏、末行不被控制条压住、无「白板反相」这类夜间刺眼问题。
