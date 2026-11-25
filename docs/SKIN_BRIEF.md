# 皮肤实现简报（v8 三版首页再设计 · 共用技术约束）

给实现皮肤的 agent：本文件是**唯一技术事实源**。创意方向在 `docs/SKIN_CONCEPTS.md`。

## 0. 铁律

1. **只写你自己那一个 CSS 文件**：`src/styles/skins/<你的皮肤 key>.css`。
   禁止改 `app.css` / `tokens.css` / `skin-hooks.css` / 其它 `skins/*.css` / 任何 `.tsx` / `.ts`。
   注册（`types.ts`、`skins.ts`、`main.tsx` 的 import）已经做好了，文件也已经建好（只有注释头）。
2. 所有选择器必须以 `[data-skin='<key>']` 开头（深色档用 `[data-skin='<key>'][data-theme='dark']`）。
   **不许用 `!important`**，不许写裸 `:root`（会污染全部皮肤）。
3. 不许引入在线字体、外链图片、SVG 文件。装饰只用 CSS 渐变 / 网格 / 圆点 / 边框 / `::before` `::after` 文本。
   可用自托管字体族（已在 `skin-fonts.css` 声明）：
   `Newsreader`（衬线，400–600）、`Space Grotesk`（几何无衬线，300–700）、
   `IBM Plex Sans`（400/500/600）、`IBM Plex Mono`（400/500/600）、`Instrument Serif`（400 + italic）。
   中文一律回退系统：`'PingFang SC', 'HarmonyOS Sans SC', 'Noto Sans SC', 'Microsoft YaHei', system-ui`。
4. **不动数据、不写 localStorage、不碰调度**。皮肤层是纯视觉，任何文案（数字/句子）都由现有 DOM 提供。
5. 首页之外不许出现「半套」：其它页面（列表 / 复习 / 日历 / 我的）会**继承你覆盖的令牌**，
   所以令牌覆盖必须全局自洽（背景、文字、边框、圆角、阴影、字号阶梯都算数），
   组件级补丁只写首页需要的；其它页面靠令牌也不会崩。

## 1. 首页 DOM 骨架（`StudyScreen.tsx` + `TodayCard.tsx`，不许改结构）

```text
header.topbar
  div.brand
    span.brand__name      「词笺」
    span.brand__dot       装饰点（accent）
    span.topbar__meta     > span(阶段名) + span.topbar__sep(·) + span(「今日 N 词」/「今日新词已发完」)
  button.icon-btn         日历（aria-label「打开学习日历」，内含 20px svg）
  button.icon-btn         外观（aria-label「切换外观风格」）
  button.avatar-btn       头像（内含一个汉字）
div.readouts[aria-hidden]  > 3 × div.readout > span.readout__k + span.readout__v（今日/批数/已学，补零）
main.app__main > div.screen > div.start
  div.start__masthead     > span.start__masthead-brand(词笺) + span.start__masthead-rule + span.start__masthead-meta(2026 · 11 · 24)
  p.start__kicker         「四级 · DAILY LIST」
  div.start__body
    p.start__eyebrow      「四级核心词 · 3846 词」（自带 ::before 一小段横线）
    h1.start__title       「一页五个词，看一遍就会。」
    p.start__lede         玩法说明（长句）
    div.start__meta       2 × span（今日 N 词 / 已学 N 词，内含 <b>）
    div.start__spec       4 × div.start__spec-row > span.start__spec-k + span.start__spec-v
                          （阶段 / 今日新词 / 今日批次 / 已学）
    div.start__actions    > button.btn.btn--primary.btn--block「开始背单词」
    section.today-card
      div.today-card__head  > span.today-card__label(今日 · 11月24日 周二)
                            + span.today-card__links > button.btn.btn--text.btn--compact（错词本 N，可为 0 个）+ 学习日历
      div.today-card__figures > 4 × span.today-card__figure > <b> + 文本 [+ span.today-card__tag(↑+5)] [+ span(计划 N)]
                                四个依次是：新词 / 到期复习(done/total) / 逾期 / 连续优秀
                                <b> 可能带 .is-warn（琥珀告警）或 .is-accent（强调）
      p.today-card__reason.is-{ok|warn|paused|...}   一句原因说明
      p.today-card__reason（可选）                   「点开始背单词后会先复习这 N 个到期词…」
  div.start__foot         > span(进度只存在这台设备) + span.start__rule + button.btn.btn--text(换个阶段)
```

`.empty` 分支（词库为空）也存在，别让它散架。

## 2. 默认被隐藏的「皮肤专属结构」（`skin-hooks.css`）

```css
.topbar__meta, .readouts, .start__spec, .start__kicker, .start__masthead { display: none; }
```

要用哪块就自己 `display:` 打开（这是让皮肤长得不一样最主要的杠杆）。
`paper` 皮肤两者都不用——所以**别指望它们已经显示**。

## 3. 令牌清单（`tokens.css` 的默认值；覆盖时按你的方向重定义）

- 颜色：`--bg --surface --surface-raised --surface-sunken --border --border-strong
  --text --text-secondary --text-tertiary --accent --accent-hover --accent-press --accent-weak
  --on-accent --success --warning --danger --mask --scrim --row-hover --toggle-on`
- 字体：`--font-serif --font-sans`（组件里只引用这两个 + 皮肤自定义 `--font-*`）
- 字号：`--fs-display 34 --fs-h1 26 --fs-h2 21 --fs-body 16 --fs-small 13`
  组件档：`--fs-word clamp(22,5.6vw,27) --fs-phonetic 13 --fs-meaning 15 --fs-load 14`
- 间距：`--space-1 4 / -2 8 / -3 12 / -4 16 / -5 24 / -6 32 / -7 48 / -8 64`
- 度量：`--page-x 20 --content-max 640 --app-max 760 --dock-height 76`
- 圆角：`--radius-sm 8 --radius-md 12 --radius-lg 18 --radius-full 999`
- 阴影：`--shadow-sm --shadow-md --shadow-lg`
- 动效：`--duration-fast 140ms --duration-base 200ms --duration-slow 280ms --ease-out --ease-in`
- 768+ 断点默认会改：`--page-x 32 --fs-display 38 --fs-phonetic 14 --fs-meaning 16 --fs-word --dock-height 80`
  **你的皮肤也要在 `@media (min-width: 768px)` 里给出自己的这一组**（参考 `skins/instrument.css` 末尾）。

自定义度量按 foundry 的做法：`--fd-*` 前缀；你的皮肤用自己的两字母前缀（如 `--bt-*` / `--pl-*` / `--nc-*`），
写在 `[data-skin]` 块里，别和别人的撞。

## 4. 首页之外会被你的令牌带到的东西（心里有数即可，不必精修）

`.word-list/.word-row/.meaning/.masked`（列表）、`.flash/.flash-card`（复习卡）、
`.dock/.dock__btn/.dock__toggle/.dock__nav`（底部控制条）、`.answer-dock/.answer-btn`（答案键）、
`.section/.setting-row/.stat/.segmented/.stage-option`（我的）、`.sheet/.dialog/.scrim`（浮层）、
`.cal-*`（日历，见 `CalendarScreen.tsx`）、`.skin-card`（外观选择卡）。
**至少要保证**：文字对比度达标、不横向溢出、按钮不小于 44px。

## 5. 硬指标（会被脚本自动审查）

- 横向零溢出：`documentElement.scrollWidth === clientWidth`（320/360/390/768/1440 都要）。
- 正文 ≥ 14px（`--fs-small` 以下的装饰性大写小字允许 10–12px，但必须是拉丁/数字标签，不能是成句中文）。
- 所有可点元素 ≥ 44×44px。
- WCAG AA：正文 ≥ 4.5:1，≥24px 或 ≥18.66px+700 的字 ≥ 3:1。
  **四肤 × 明暗八档都要写齐语义色**（`--warning` `--danger` `--success` 漏深色档是老坑，已经栽过两次）。
- 一套界面 ≤ 2 字体族、≤ 1 强调色（数据语义色另算，但要克制）、≤ 3 档阴影。
- 深色档单独设计：不许 `filter: invert()`，不许纯黑纯白，阴影在深色上要重新定义（多半要降不透明度或换内发光/描边）。
- `prefers-reduced-motion: reduce` 下把位移/过渡关掉。
- hover 状态包在 `@media (hover: hover)` 里（触屏不粘滞）。

## 6. 交付格式（回给你的会话）

1. 最终令牌表（浅色 12 个关键色 + 深色 12 个），我要拿去填 `skins.ts` 的 swatch/darkBg。
2. 首页版式说明：每块 DOM 被你用来表达什么、哪些钩子被打开、哪些被关掉。
3. 你自查过但**没能验证**的点（因为不能跑浏览器），列出来我去实测。
4. 文件行数与体积（`[data-skin]` 规则数），别写超过 ~450 行。
