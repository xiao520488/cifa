# 第 9 套皮肤「BREEZE / 晴空」· 规约（先确认，后落码）

> 一句话：**把百词斩的「清透感」搬进词笺**——极浅蓝灰底 + 纯白大圆角卡 + 一点亮蓝，
> 字更大更粗，边界靠阴影和留白而不是线条。
>
> 提炼自用户提供的两张真机截图（百词斩首页 2026-11-26 23:46、单词卡 23:44）：
> ① 浅底 + 纯白卡 + 极淡投影，卡片之间只靠留白分层；② 主按钮通体亮蓝、大圆角、无描边，
> 次按钮是同色系浅底（蓝字）；③ 单词卡里「一个释义 = 一张白卡」，词头极大、居中、无衬线加粗；
> ④ 音标是极浅灰小字（截图里还有一个浅灰药丸底）；⑤ 顶栏/底栏没有分隔线，只有底色与轻微阴影。

---

## 0. 红线与改动面（先看这一节）

**产品侧只有 5 个文件，其中 1 个是新文件：**

| 文件 | 改动 | 说明 |
| --- | --- | --- |
| `src/styles/skins/breeze.css` | **新建** | 全部视觉在这里，选择器一律以 `[data-skin='breeze']` 开头（深色再叠加 `[data-theme='dark']`），不用 `!important` |
| `src/lib/types.ts` | +1 行 | `Skin` 联合类型加 `'breeze'`（不改这一行 `tsc` 不过） |
| `src/lib/skins.ts` | +9 行 | 一条 `SkinMeta`，含 `persistentReadouts: false` |
| `src/lib/storage.ts` | +9 行 | **落地时才发现第 5 处**：`loadStore()` 里还有一份硬编码 `SKINS` 白名单（61 行），不认识的 skin 静默回退 `paper`。漏了它 → CSS 全绿、页面却一直是旧皮肤（实测第一版截图就是 paper）。 |
| `src/main.tsx` | +1 行 | `import './styles/skins/breeze.css'` |

- **`tokens.css` 一个字节都不改**。它虽然是允许改的面，但没有必要：全局令牌改动会同时影响 8 套旧皮肤，
  风险与收益不成比例。所有覆盖写在 `breeze.css` 的 `[data-skin='breeze']` 作用域里——旧皮肤零影响是结构性保证，不是靠自觉。
- **不碰任何 DOM / 组件 / 逻辑**：`.tsx` 只动 `main.tsx` 的那行 import（它不是组件逻辑，是样式表清单）。
- **不改 `app.css` / `skin-hooks.css` / 其它 `skins/*.css`**。
- **测试侧 2 处必要登记**（不属于产品代码，但不登记就等于新皮肤没有门禁）：
  `scripts/scan-tiny.js` 的皮肤数组、`scripts/audit-motion.js` 的 `expectKnown` + press 皮肤数组；
  外加新配置 `scripts/cfg-breeze.json`（只含 `__audit_*` 键）。这三处只影响审计，不影响运行时。

---

## 1. 令牌表 · 浅色档（`[data-skin='breeze']`）

| 令牌 | 值 | 对比度（实测） |
| --- | --- | --- |
| `--bg` | `#F4F8FB` | 极浅蓝灰，页面底 |
| `--surface` | `#FFFFFF` | 卡面 |
| `--surface-raised` | `#FFFFFF` | 浮层 |
| `--surface-sunken` | `#EDF2F8` | 内陷 / 次键底 |
| `--border` | `#E6ECF3` | 只用于极少数 1px 分隔（阴影为主） |
| `--border-strong` | `#D3DDE9` | |
| `--text` | `#0F172A` | 正文 **16.72:1** / 白底 **17.85:1** |
| `--text-secondary` | `#475467` | 白底 **7.69:1** / 页面底 **7.20:1** |
| `--text-tertiary` | `#5F6C7B` | 白底 **5.36:1** / 页面底 **5.02:1** / 内陷底 **4.89:1** |
| `--accent` | `#2563EB` | 白底 **5.17:1** / 页面底 **4.84:1** |
| `--accent-hover` | `#1D4ED8` | 白字 **6.70:1** |
| `--accent-press` | `#1E3A8A` | |
| `--accent-weak` | `#E8F0FF` | 蓝字其上 **5.85:1** |
| `--on-accent` | `#FFFFFF` | 蓝底 **5.17:1** |
| `--success` | `#047857` | 白底 **5.48:1** |
| `--warning` | `#B45309` | 白底 **5.02:1** |
| `--danger` | `#C2410C` | 白底 **5.18:1** / 次键灰底 **4.73:1** |
| `--mask` | `#E8EEF6` | 遮罩条（装饰） |
| `--scrim` | `rgba(15,23,42,.42)` | |
| `--row-hover` | `rgba(37,99,235,.045)` | |
| `--toggle-on` | `#E9EFF7` | 深字其上 **15.43:1** |

> 亮蓝的取色说明（这是全篇唯一一处「不照抄截图」的地方）：百词斩按钮上的蓝约 `#2F6BFF`，
> 白字压上去只有 **4.2:1**，16px 正文不达 AA。同色相压深到 `#2563EB` → **5.17:1** 通过，
> 色感差异肉眼几乎不可辨（ΔE ≈ 3）。**宁可让蓝深一档，也不让按钮上的白字糊掉。**

## 2. 令牌表 · 深色档（`[data-skin='breeze'][data-theme='dark']`）

| 令牌 | 值 | 对比度（实测） |
| --- | --- | --- |
| `--bg` | `#121212` | 深灰底（按需求指定，非纯黑） |
| `--surface` | `#1B1D21` | 卡面，比底色亮一档 |
| `--surface-raised` | `#24272C` | 浮层 |
| `--surface-sunken` | `#0C0D0F` | |
| `--border` | `#2B2F36` | |
| `--border-strong` | `#3C424B` | |
| `--text` | `#F2F5F9` | 底 **17.13:1** / 卡面 **15.43:1** |
| `--text-secondary` | `#B4BCC8` | 卡面 **8.81:1** |
| `--text-tertiary` | `#9AA4B2` | 卡面 **6.69:1** / 浮层 **5.94:1** |
| `--accent` | `#6E9BFF` | 卡面 **6.26:1** |
| `--accent-hover` | `#8CB0FF` | |
| `--accent-press` | `#5A87F0` | |
| `--accent-weak` | `#16233D` | 蓝字其上 **5.81:1** |
| `--on-accent` | `#0A1020` | 蓝底 **7.04:1** |
| `--success` | `#6FD3A8` | 卡面 **9.29:1** |
| `--warning` | `#F0B24A` | 卡面 **8.98:1** / 底 **9.97:1** |
| `--danger` | `#FF9B85` | 卡面 **8.26:1** / 底 **9.17:1** |
| `--mask` | `#262A31` | |
| `--scrim` | `rgba(0,0,0,.62)` | |
| `--row-hover` | `rgba(242,245,249,.05)` | |
| `--toggle-on` | `#1E2A3F` | |

阴影在深色档重写（不是调透明度了事）：
`--shadow-sm: 0 2px 8px rgba(0,0,0,.35)` ／ `--shadow-md: 0 10px 28px rgba(0,0,0,.45)` ／ `--shadow-lg: 0 20px 48px rgba(0,0,0,.55)`。

**量具自证伪（两次，都是红过的）**：`#94A3B8` 压在白卡上 = **2.56:1**（会给「极浅灰音标」判红，
证明公式不是只会报绿）；`#334155` 压在 `#1B1D21` 上 = **1.63:1**（深色档若直接搬浅色释义色会被抓出来）。

---

## 3. 排印 / 圆角 / 阴影 / 动效

**字体（2 族，符合上限）**
- 拉丁与数字：`'Space Grotesk'`（自托管，300–700）——词头、音标数字、读数数字。几何无衬线，比衬线更「清透」。
- 中文与 UI：系统无衬线栈（`--font-sans` 原值不动）。

**字号（在现有阶梯上「更张扬」一档）**

| 档 | 浅色/深色同值 | 768+ |
| --- | --- | --- |
| `--fs-display` | 34px | 38px |
| `--fs-h1` | 26px | 28px |
| `--fs-h2` | 19px | 20px |
| `--fs-body` | 16px | 16px |
| `--fs-small` | 14px | 14px |
| `--fs-word`（列表词头） | `clamp(24px, 7vw, 30px)` | `clamp(26px, 2.6vw, 32px)` |
| `--fs-phonetic` | 13px | 14px |
| `--fs-meaning` | 16px | 17px |
| `--fs-load` | 14px | 14px |

皮肤私有：`--bz-word-card: clamp(38px, 11vw, 54px)`（**学习卡词头**，比基线 30–44 大一档）、
`--bz-latin: 'Space Grotesk', …`、`--bz-num: 'Space Grotesk', …`。

**圆角**：`--radius-sm: 10px` / `--radius-md: 16px`（按钮、释义卡）/ `--radius-lg: 20px`（大卡）/ `--radius-full: 999px`。
**阴影（3 档）**：浅色 `0 2px 8px rgba(23,43,77,.05)` / `0 10px 28px rgba(23,43,77,.08)` / `0 20px 48px rgba(23,43,77,.14)`。
**间距**：8pt 网格不动；`--page-x: 20px`（768+ 32px）、`--content-max: 640px`、`--app-max: 760px`、`--dock-height: 76px`（768+ 80px）。
**动效**：零新增动画。按压/松开/换卡/转场/数字滚动全部沿用基线令牌（50ms→180ms、`--press-scale: .97`），
所以「按压反馈」这条门禁天然是绿的；`prefers-reduced-motion` 也不需要额外反制（没有新位移）。
卡片 hover 只给 140ms 的背景/阴影过渡，包在 `@media (hover: hover)` 里。

**断点**：360 / 390 / 768 / 1440 四档都要过（矩阵只跑 390 + 1440 单档抽查，见 §7）。

---

## 4. 首页（学习入口）· 草图与 DOM 映射

```text
┌──────────────────────────────────────┐  ← .app 底 = #F4F8FB，768+ 也不画竖线
│ 词笺 ·              [▦] [◐] (你)     │  .topbar  透明、无下边框；图标 hover 淡蓝圆
│                                      │
│ ┌─ 四级核心词 · 3846 词 ─┐            │  .start__eyebrow → 蓝底药丸标签（12px/600）
│                                      │
│  今日 10 词    已学 0 词              │  .start__meta → 26px 拉丁数字 + 13px 灰标签
│                                      │
│ ┌──────────────────────────────────┐ │
│ │          开始背单词               │ │  .btn--primary.btn--block → 蓝 #2563EB
│ └──────────────────────────────────┘ │  半径 16 / 高 56 / 蓝色柔光投影
│ ┌──────────────────────────────────┐ │
│ │ 今日 · 11月24日 周二    错词本 3  │ │  .today-card → 纯白 20r + shadow-md
│ │                                  │ │
│ │  10        0/0      0       0    │ │  .today-card__figure b → 26px/700
│ │  新词    到期复习   逾期   连续优秀│ │  标签 13px 灰
│ │                                  │ │
│ │ ── 一句原因（14px 灰）──────────  │ │  .today-card__reason → 14px/1.65
│ │ 点开始后会先复习这 N 个到期词…     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ 进度只存在这台设备 ─── 换个阶段        │  .start__foot → 14px 灰（不降到 12）
└──────────────────────────────────────┘
```

| DOM | 处理 |
| --- | --- |
| `header.topbar` | 背景透明、`topbar--bordered` 下边框透明；`brand__dot` 6px 蓝点；`icon-btn` hover 淡蓝底 |
| `div.readouts` | **继续隐藏**（首页 `.start__meta` 已经报了「今日/已学」，再开一条读数带就是同屏三次报数——v10 已踩过） |
| `.start__masthead` / `.start__kicker` / `.start__spec` | **不开**（保持 `skin-hooks.css` 的默认隐藏）。`persistentReadouts: false` 同理 |
| `.start__eyebrow` | 蓝底药丸标签；`::before` 那条小横线隐藏 |
| `.start__meta` | 两个读数并排，数字 26px Space Grotesk 700、标签 13px `--text-tertiary` |
| `.start__actions` / `.btn--primary` | 蓝、16r、56h、17px/600、`0 10px 22px rgba(37,99,235,.22)` |
| `.today-card` | 白卡 20r、`--shadow-md`、内边距 20、`border: 0` |
| `.today-card__figure b` | 26px/700 Space Grotesk；`.is-accent` 用蓝，`.is-warn` 用琥珀 |
| `.today-card__tag`（↑ +5） | 无边框药丸，`--accent-weak` 底 + `#1D4ED8` 字 |
| `.today-card__links .btn--text` | 14px，蓝字；hover 加深 |
| `.start__foot` | 14px 灰；`start__rule` 变透明（不画线，靠留白） |

---

## 5. 学习卡（复习三键 / 即时两键 / 词表）· 草图与 DOM 映射

```text
┌──────────────────────────────────────┐
│ ←      复习 · 第 1 / 1 批      (你)  │  .topbar--bordered 无边框
│ ▬▬▬▬▬▬▬▬▬▬▬▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭▭          │  .study-progress 6px 高，蓝条 999r
│                                      │
│               district               │  .flash-card__word clamp(38,11vw,54)
│                                      │  Space Grotesk 700 / -0.02em / 居中
│            ┌ /ˈdɪstrɪkt/ ┐           │  .flash-card__ph 13px 灰 + 浅灰药丸底
│                                      │
│  ┌────────────────────────────────┐  │
│  │ v.使分心；打扰；转移(注意力)     │  │  .meaning 一张白卡：16px/1.75
│  └────────────────────────────────┘  │  #334155（深灰不是纯黑）/ 16r / 18px 内距
│  ┌────────────────────────────────┐  │
│  │ n.区域                          │  │  .meaning--extra 15px，同卡同色系
│  └────────────────────────────────┘  │
│              ( 轻点看中文 )           │  .flash-card__reveal → 44h 灰药丸，居中
│                                      │
├──────────────────────────────────────┤  .answer-dock 无上边框 + 向上淡阴影
│ [ 不认识 ] [   模糊   ] [ ✓ 认识 ]    │  灰底红字 / 淡蓝底蓝字 / 蓝底白字
└──────────────────────────────────────┘  三键 56h / 16r / 无描边
```

| DOM | 处理 |
| --- | --- |
| `.flash` | 上下留白加大；卡片不再有分隔线 |
| `.flash-card` | `border: 0`、`background: transparent`、词与释义之间 20px |
| `.flash-card__head` | 改为**竖排居中**（复习与即时复习统一，`--centered` 那档不打架） |
| `.flash-card__word` | `--bz-word-card`，700，`#0F172A`（深色 `#F2F5F9`），`letter-spacing: -.02em` |
| `.flash-card__ph` | 13px `--text-tertiary` + `background: var(--surface-sunken)`、`6px 12px`、999r |
| `.flash-card__meanings` | 撑满卡宽、`gap: 12px`；`--centered` 的 `max-width 32em` / `align-items:center` 才被覆盖 |
| `.meaning` | **一张白卡**：`--surface`、16r、`18px 16px`、`--shadow-sm`、16px/1.75、`#334155`（深色 `#C6D1E0`） |
| `.masked` | 遮罩条 `#E8EEF6`、8r（未揭示时是三条灰块，不再是灰底文字） |
| `.flash-card__reveal` | 44h 药丸、无虚线下划线、居中 |
| `.answer-dock` | `border-top: 0`、`background: color-mix(bg 86%, transparent)` + 12px 模糊、`0 -8px 24px rgba(15,23,42,.06)` |
| `.answer-btn` | 56h、16r、无描边、16px/600；`:active` 沿用基线的 0.97 / 50ms |
| `.answer-btn--known` | 蓝底白字 + 蓝柔光投影 |
| `.answer-btn--fuzzy` | `--accent-weak` 底 + 蓝字（百词斩的「次键」就是同色浅底） |
| `.answer-btn--unknown` | `#F1F5F9` 底 + `--danger` 字（4.73:1） |
| `.study-progress` | 6px 高、`--surface-sunken` 槽、蓝条；位置贴近顶栏 |
| `.word-list` / `.word-row` | 去掉 `border-top`/`border-bottom`，**每行一张白卡**（16r、14px 16px、间距 10px、shadow-sm） |
| `.word-row__word` | Space Grotesk 700、`--fs-word` |
| `.word-row__index` | 12px 数字（纯数字不算中文小字），`--text-tertiary` |
| `.dock` | 无上边框、底透明 + 上向淡阴影；按钮 14r；`toggle[aria-pressed=false]` 由虚线改成实心淡蓝 |
| `.dock__nav--primary` | 蓝底白字、14r |

**其它页（日历 / 我的 / 错词本 / 浮层）**：不写组件级补丁，只吃令牌（背景、卡面、圆角、阴影、字体、语义色）。
必保三件：横向零溢出、正文 ≥14px 中文、可点元素 ≥44×44。

---

## 6. 会写到的选择器清单（预估 60–70 条 / ~360 行）

`topbar · brand · icon-btn · avatar-btn · start__eyebrow · start__meta · start__actions · btn--primary/--text/--secondary · today-card 系列（label/links/tag/figure/reason） · start__foot · study-progress · word-list/word-row/index/word/ph/meanings · flash/flash-card/head/word/ph/meanings · flash-card__reveal · answer-dock/answer-btn 三态 · dock/dock__btn/toggle/nav · session-done · sheet/dialog/segmented/stat/section（仅令牌级） · 768 断点 · hover 媒体查询`。

---

## 7. 门禁计划（跑什么、判据、怎么单组跑）

先起 `pnpm dev`（127.0.0.1:5173），然后：

| 门禁 | 跑法 | 判据 |
| --- | --- | --- |
| `tsc` | `pnpm build`（`tsc --noEmit` + vite build） | 0 错；新皮肤进产物 |
| `scan-tiny.js` | `run-audit-node.js scripts/scan-tiny.js`（皮肤数组已加 `breeze`） | `groups 0 / hardFail 0`（中文 <14px 一处都不许有） |
| `audit-screens.js` | `cfg-breeze.json`：`breeze` × 明暗 × 390 与 1440 × 8 界面 | `nLow 0`（对比度）/ `ovf 0`（横向溢出）/ `nSmall 0`（<44 触控）/ `nOut 0` / CTA 可见 |
| `audit-motion.js` **press 组** | `{"__audit_only":"press","__audit_motion_skins":"[\"breeze\"]"}` | 按下 `scale(0.97)` / 50ms、松开 180ms 归位、答对挂 `is-ack-known` 且动画 = `ack-lift` |
| `audit-motion.js` **contrast 组** | `{"__audit_only":"contrast"}` | 无低对比项（用 `__audit_skins` 只留 breeze 时更快） |

**单组开关**按 AGENTS.md 的纪律：改皮肤只用 press 单组 + 一次全量；认不出的组名会当场报错（已有坏样例 `cfg-motion-badgroup.json`）。
**不跑全 8 皮肤 × 5 视口矩阵**（默认最省）：旧皮肤没被改到，因为它们的选择器前缀不同、`tokens.css` 未动，
另附一条结构性证据 —— `git diff --stat` 只出现 1 个新 CSS 文件 + 3 行登记。

---

## 8. 交付物

1. `src/styles/skins/breeze.css`（成品：809 行 / 107 条规则 / 0 处 `!important`）+ 5 处登记行。
2. 截图 7 张（`out/`，390 与 1440）：
   `breeze-home-{light,dark}-390`、`breeze-home-{light,dark}-1440`、
   `breeze-card-{light,dark}-390`、`breeze-card-masked-light-390`、`breeze-list-light-390`、`breeze-sheet-light-390`。
3. 实测数字见 §10（原始输出，不是转述）。
4. 如实列出**没验到的**：真机（APK 未重打包）、iOS Safari、hover 手感。

---

## 9. 默认皮肤（用户追加要求，已落）

「设为默认」＝**全新安装 / 清空数据后的初始皮肤**，不是把所有人已经选好的皮肤改掉。
落地四处：

| 位置 | 改动 | 为什么是这里 |
| --- | --- | --- |
| `src/lib/storage.ts` `DEFAULT_PROFILE.skin` | `'paper'` → `'breeze'` | 唯一决定「初始偏好」的地方 |
| `src/lib/skins.ts` | breeze 条目移到 `SKINS[0]` | `skinMeta()` 的兜底取 `SKINS[0]`；默认与兜底不允许是两套。顺带外观面板第一张就是默认皮肤 |
| `index.html` | 首帧脚本按已存 `profile.skin` 提前挂 `data-skin`；`theme-color` 与状态栏兜底色改成 breeze 两档 | 皮肤原本要等 App 挂载（还要等词库 `import()`）才挂上，中间会按纸色画一屏。这条对 9 套皮肤都生效，旧皮肤同样不再闪一帧别人的底色 |
| —— | 已有用户的 `profile.skin` **不动** | 那是用户的选择，迁移会把它悄悄改掉 |

---

## 10. 实测结果（2026-11-27 00:20 前后，本机 5173）

| 项 | 命令 | 结果 |
| --- | --- | --- |
| 类型 | `node node_modules/typescript/bin/tsc --noEmit` | **0 errors** |
| 构建 | `node node_modules/vite/bin/vite.js build` | ✓ 893ms；`index-*.css` 266.38 kB 内含 **114** 处 `breeze`、含 `Space Grotesk` |
| 中文小字 | `scan-tiny.js`（9 皮肤 × 5 界面） | `groups 0 / hardFail 0 / items []`，30.7 s |
| 版面矩阵 | `audit-screens.js` + `cfg-breeze.json`（390 / 1440 × 明暗 × 6 界面） | `n 24 / failCount 0 / warnTiny 0 / outYTotal 0 / passN 24` |
| 中档 + 窄档 | `cfg-breeze-mid.json`（360 / 768） | `n 24 / failCount 0 / passN 24` |
| 动效全量 | `audit-motion.js` + `cfg-motion.json`（8 组 / 9 皮肤） | `ok:true / partial:false / fails:[]`；breeze G1 `gapOk:true`（明暗各一）、press `matrix(0.97)` / `0.05s` / 松手 `none 0.18s` / 动画 `ack-lift`、按压对比度 **6.37 : 1（浅）/ 8.45 : 1（深）**、读数带按设计 `0/0`（隐藏）；切皮肤过渡 200ms 真跑（`clsFrames 30 / runningPast120 10`） |
| 默认皮肤 | 全新 context → 只 `goto /` | `dataset.skin = breeze`、`storedSkin = breeze`、`appBg rgb(244,248,251)`、主按钮 `rgb(37,99,235)`；外观面板 **9 张**、顺序 `BREEZE…DESK`、`aria-pressed` 落在第 0 张 |
| 外观面板滚动 | 同上，把 `.sheet__body` 滚到底 | 可滚 `139px`；「案头」完整可见（`bottom 641 < 按钮 top 764`）——**不是裁切**，是滚动 |

> 量具自证伪（两次）：`#94A3B8` 压白卡 **2.56:1**（极浅灰在 13px 上确实不达标）、
> `#334155` 压深色卡 **1.63:1**（浅色档的释义色直接搬进深色档会被抓出来）。
>
> 审计侧两处修正（改的是量具，不是产品）：① 切皮肤用 `[aria-pressed="false"]` 取代 `nth-child(2)`
> —— 默认皮肤排到第一之后，`nth-child(2)` 就是「当前已选中」那张，点了什么都不发生，断言变成假失败；
> ② `judgeThemeSwitch` 的 `seen[0].bgAnim` 改为空数组给 `null` —— 该 fail 曾被 TypeError 吞掉，
> 整轮审计当场崩、其余 7 组的结论一起丢失。
> 全量 `fails: []` 之前，press 单组先红过一次吗？没有——press 第一版就绿；
> 但**默认皮肤**这一条第一版是红的：`storage.ts` 白名单没加 `breeze`，页面静默回退 paper（截图里 accent 是朱砂红）。
> 这条已按「先修产品、再跑门禁」的顺序修完，不是把红改绿。

---

## 11. 已知取舍（如实记录）

1. **首页上下留白偏大**（390 下正文垂直居中，上下各 ~140px）。这是 `.start__body { margin-block: auto }` 的既有骨架，没改 DOM 就动不了；
   删掉它会把内容顶到顶栏、页脚悬在中间，更难看。要更紧凑得动结构（不在本轮红线内）。
2. **`.start__meta` 的「今日 20 词 / 已学 0 词」与今日卡有轻微重复报数**（元数据两处，但一处是大数字一处是卡片内小字）。
   百词斩首页也是这种双报数，暂留。
3. **`.today-card__figures` 改成 2×2 网格**（手机）是为了避免基线 flex 折成「3+1」把最后一个 0 甩在左边；768+ 恢复 1×4。
4. **学习卡遮罩在浅色下是浅灰条**（`#DEE7F2`，对白卡 1.26:1，装饰层不参与对比度门禁）；深色下 `#262A31`。
5. **`.meaning__pos`（词性 n./v.）改成灰蓝**而不是强调蓝：蓝色只留给主按钮、链接、进度条，符合「一个强调色」。

