# MOTION_SPEC · 作答手感（v1）

> 一句话：**只加手感，不加表演。** 三档时长、两条曲线、三个组件、零布局动画。
> 范围：学习流（复习三键 / 即时复习两键 / 错词单测）+ 学习流里的 toast。不碰首页、日历、我的、浮层。

---

## 0. 边界（不可谈判）

**做**：按压位移、按压底色、答后卡片一下轻反馈、toast 进出。

**不做**（出现任一条即判不合格，回退重写）：

| 禁项 | 为什么 |
|---|---|
| 全站统一 `0.3s ease` | 所有东西一个节奏 = 没有触感，只有"过渡开关被打开" |
| 弹跳 / overshoot / 回弹超过 1 帧 | 表演；手机背词是高频动作，弹跳会变成噪音 |
| 发光 / 模糊 / 阴影动画 / filter | 只为"好看"，不传递信息，且 WebView 里掉帧 |
| 按下和松开**同曲线同时长** | 真实按压是"快下、缓起"；对称 = 橡皮泥 |
| 多个动画同时叠在同一个元素上 | 叠加后谁先谁后不可控，观感发糊 |
| 入场错峰 / 逐项浮现 / 卡片翻面 / 页面转场 | 本轮明确不做（见 §11 决策 D1、D2） |
| 动 `width/height/top/left/margin/padding` | 触发布局，必掉帧；也违反"只动卡片不动布局" |

**唯一允许被动画的属性**：`transform`、`opacity`。颜色（`background-color`/`border-color`/`color`）可以做**瞬时或短过渡**，因为它只重绘、不重排，且按压必须有底色变化。

---

## 1. 令牌（写进 `src/styles/tokens.css` 的「动效」段）

| 令牌 | 值 | 用途 |
|---|---|---|
| `--motion-press` | `50ms` | 按下（攻击快） |
| `--motion-release` | `180ms` | 松开（回落慢） |
| `--motion-ack-known` | `180ms` | 答对上浮（与松开同档，不新增档位） |
| `--motion-feedback` | `200ms` | 卡片反馈 + 反馈期间停留 |
| `--motion-toast-in` | `200ms` | toast 进入 |
| `--motion-toast-out` | `150ms` | toast 退出 |
| `--motion-swap` | `350ms` | **只定义，不接线**（留给以后真要的转场） |
| `--ease-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | 进入类（已有，复用） |
| `--ease-state` | `cubic-bezier(0.4, 0, 0.2, 1)` | 状态切换：按下 / 松开 / 退出 / 抖动 |
| `--press-scale` | `0.97` | 按压幅度（全部按钮同一个数） |
| `--press-tint` | `color-mix(in srgb, var(--surface) 90%, #000)` | 按压底色（明暗都"加深"） |
| `--ack-lift` | `-2px` | 答对时卡片的位移 |
| `--ack-shake` | `4px` | 答错时卡片的最大振幅 |
| `--toast-shift` | `12px` | toast 进入位移 |

**两条曲线，各管一类**：进入 → `--ease-out`；状态切换 → `--ease-state`。
**三档时长，各管一类**：50 / 200 / 350。中间那些 180、150 是同一档的派生值，不再新增档位。

时间不对称是手感的来源：50ms 按下、180ms 松开。反过来就是"软"。

---

## 2. 规则 A · 作答按钮（`.answer-btn`，8 套皮肤共用）

适用：`.answer-dock--review` 三键、`.answer-dock--immediate` 两键、错词单测两键。

| 阶段 | transform | 背景 | 时长 / 曲线 |
|---|---|---|---|
| 按下 `:active:not(:disabled)` | `scale(var(--press-scale))` | 中性键 → `var(--press-tint)`；`--known` → `var(--accent-press)` | 50ms / `--ease-state` |
| 松开 | 回到 `scale(1)` | 回原色 | 180ms / `--ease-state` |

实现要点（CSS 只能这么写才成立）：

```css
.answer-btn { transition: transform var(--motion-release) var(--ease-state),
                          background-color var(--motion-release) var(--ease-state),
                          border-color var(--motion-release) var(--ease-state); }
.answer-btn:active:not(:disabled) {
  transform: scale(var(--press-scale));
  background: var(--press-tint);
  transition-duration: var(--motion-press);
}
.answer-btn--known:active:not(:disabled) { background: var(--accent-press); }
```

- 选择器必须带 `:not(:disabled)`：既排除禁用键，也让特异性压过皮肤里的 `[data-skin=x] .answer-btn--fuzzy`（否则 desk 的 `background: transparent` 会盖掉按压底色）。
- 必须**删掉**皮肤里取消按压的规则：`desk.css:414` `.answer-btn:active{transform:none}`、`desk.css:415` 的 `translateY(1px)`、`vinyl.css:1287` 的 `translateY(2px)`（改为保留套色/去阴影，位移统一交回 `scale`）。
- `bento/nocturne` 的 `:active{transform:none}` 位于 reduced-motion 块内，**保留**，不动。
- 连点保护不变：仍靠 `SessionScreen` 里按 `index` 去重的 `answering` ref，按钮不加 `disabled`（禁用会造成底色跳变）。

---

## 3. 规则 B · 作答后的卡片（`.flash-card`）

映射（不新增语义，沿用现有三键）：

| 作答 | 反馈 | 参数 |
|---|---|---|
| `known`（认识 / 记住了） | 上浮回落 | `translateY(var(--ack-lift))` 到 0；`--motion-feedback` 内一次性；`--ease-out` |
| `fuzzy`（模糊） | 抖动 | 见下 |
| `unknown`（不认识 / 还是不认识） | 抖动 | 同上 |

抖动（3 次方向反转，振幅收敛，**不带回弹**）：

```css
@keyframes ack-shake {
  0%   { transform: translateX(0); }
  18%  { transform: translateX(calc(-1 * var(--ack-shake))); }
  40%  { transform: translateX(var(--ack-shake)); }
  62%  { transform: translateX(calc(-0.75 * var(--ack-shake))); }
  82%  { transform: translateX(calc(0.5 * var(--ack-shake))); }
  100% { transform: translateX(0); }
}
@keyframes ack-lift {
  0%   { transform: translateY(0); }
  35%  { transform: translateY(var(--ack-lift)); }
  100% { transform: translateY(0); }
}
```

**关键约束：反馈期间不换卡。** 现有 `submit()` 是同步推进的，必须改成：

1. 引擎写入（`answer()`）仍然**同步**，数据不变、顺序不变；
2. 只把「UI 推进」（`setIndex` / 回看插入后的前进 / `finishReview` / `setRevealed(false)`）推迟 `--motion-feedback`；
3. 推迟期间卡片带 `is-ack-known` 或 `is-ack-wrong` 类（CSS 动画跑完自然归位）；
4. 到点 → 摘掉类 + 执行原推进逻辑。新词出现在 transform 已归零的那一帧，**不产生跳变**。

三个必须一起改的细节：

- `setRevealed(false)` 现在在 `submit()` 里立刻执行 —— 会让遮罩的释义**在反馈的 200ms 里露出来**。必须挪进延迟回调。
- `!outcome.ok`（今天已答过 / 未到期）**不播反馈**、不延迟，照原样 toast + 前进。
- 组件卸载时清定时器；`answering` ref 仍按 `index` 去重，反馈窗口内的第二次点击自然被吞掉。

**代价**：每答一个词，换卡晚 180–200ms。这是本轮唯一愿意付的延迟（见 §10）。

---

## 4. 规则 C · Toast（`.session-toast`）

复用一个 `SessionToast` 组件（`SessionScreen` 两处宿主 + `MistakesScreen` 一处宿主），三态：

| 阶段 | opacity | transform | 时长 / 曲线 |
|---|---|---|---|
| 进入 | 0 → 1 | `translateY(12px)` → 0 | 200ms / `--ease-out` |
| 停留 | 1 | 0 | **2500ms** |
| 退出 | 1 → 0 | 不动 | 150ms / `--ease-state` |

- 退出**不能有位移**（上来时移动过，走的时候再动就是两段表演）。
- 退出动画结束才卸载 DOM；停留期间换文案 → 重置计时器，不重播进入动画。
- **行为变化（要知道）**：现在的 toast 是"一直挂着直到下次动作清掉"，改后 2.5s 自动消失。`MistakesScreen` 原本 2600ms 的本地 timer 合并进组件，删掉重复逻辑。
- 保留 `className="session-toast"` 与 `role="status"`（E2E 脚本靠这两个断言）。

---

## 5. 8 套皮肤的边界

**统一（这是触感，不许分皮肤）**：`.answer-btn` 的按下/松开 —— 同一个 `--press-scale`、同一个 50/180ms、同一条 `--ease-state`。

**可以差（这是语义，但幅度锁死）**：卡片反馈的"表达方式"允许按皮肤气质换，**时长与视觉量级必须完全相同**：

| 皮肤 | 本轮 | 若做（下轮）会是什么 |
|---|---|---|
| 全部 8 套 | 上浮 / 抖动（基座） | — |
| `vinyl` | 基座 | 卡片倾斜 ±0.6° 代替纯上浮（唱片"转一下"），振幅折算 ≤ 2px 视觉量级 |
| `bento` | 基座 | 答对改为 `scale(0.995)` 压一下再回（磁贴被按），不用上浮 |
| `nocturne` | 基座 | 答对时单词行做一次墨色闪（`color` 双跳到 `--accent` 再回），不加位移 |

本轮**只做基座**（推荐，见 §11 D1）。理由：手感还没被真机验证过，先不要给 3 套皮肤各写一条分支——一旦方向错了要回滚三处。

### 5.1 按压底色：默认跟随 accent，描边键跟随自己的墨

基线按压铺的是 `--accent-press`（实心主键按下变深一档）。**但 `vinyl` 与 `nocturne` 的「认识」是描边/排印键（透明底）**，直接套 `--accent-press` 会把绿字压到洋红底上——实测对比度 **1.59:1 / 1.20:1**，字基本看不见。

所以这两套各有一条覆盖（见下方证据），语义是「按压铺自己那支墨水」：

```css
/* vinyl：描边唱片，铺自己的墨，边框保持绿色语义 */
[data-skin='vinyl'] .answer-btn--known:active:not(:disabled) {
  background-color: color-mix(in srgb, currentColor 16%, transparent);
  border-color: var(--success);
}
/* nocturne：本案的落点就是「填充只给 press 的一瞬」，用它自己那对 accent / on-accent */
[data-skin='nocturne'] .answer-btn--known:active:not(:disabled) {
  background-color: var(--accent);
  border-color: var(--accent);
  color: var(--on-accent);
}
```

这条是**例外，不是风格**：所有皮肤按压的位移量、时长、曲线仍然完全一致，只有「填什么颜色」按各自墨色取值。

---

## 6. 降级：`prefers-reduced-motion: reduce`

三件事同时成立才算合规：

1. **令牌归零**（一处写在 `tokens.css`）：

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --press-scale: 1;
    --ack-lift: 0px;
    --ack-shake: 0px;
    --toast-shift: 0px;
  }
}
```

2. **卡片反馈整个跳过**（JS 里判断 `matchMedia('(prefers-reduced-motion: reduce)').matches`）：不播动画、不延迟换卡 —— 开了减弱动效的人不该被额外拖 200ms。

3. **toast 只留 opacity**。现有全局兜底（`app.css` 的 `*` 块，`!important` 把 duration 压到 0.01ms）会把淡入淡出也一起杀掉，所以对 toast 单独放行一条（类选择器特异性高于 `*`）：

```css
@media (prefers-reduced-motion: reduce) {
  .session-toast {
    transition-property: opacity !important;
    transition-duration: var(--motion-toast-out) !important;
    transform: none !important;
  }
}
```

按钮在 reduced-motion 下由各皮肤既有块 `transition: none` 处理（颜色瞬切，无位移），**不再加新规则**。

---

## 7. 实现清单（文件级）

| 文件 | 改动 | 量级 |
|---|---|---|
| `src/styles/tokens.css` | §1 令牌 + §6 归零块 | +30 |
| `src/styles/app.css` | `.answer-btn` 按压重写；`ack-lift`/`ack-shake` 关键帧；`.session-toast` 进出；reduced-motion 放行 | +85 / −10 |
| `src/lib/motion.ts`（新） | 时间常量 + `prefersReducedMotion()` | ~35 行 |
| `src/hooks/useAnswerFeedback.ts`（新） | 挂类 → 等 180/200ms → 摘类并推进；卸载取消 | ~50 行 |
| `src/components/SessionToast.tsx`（新） | 进入/停留 2.5s/退场三态 + 计时器 + 卸载清理 | ~60 行 |
| `src/components/SessionScreen.tsx` | `submit()` 拆「同步写引擎 / 延迟推进」；`answerImmediateClick` 同改；卡片 cls 挂 `is-ack-*`；两处 toast 换组件 | +60 / −30 |
| `src/components/MistakesScreen.tsx` | 单测两键同款反馈；删本地 2600ms timer | +12 / −18 |
| `src/styles/skins/desk.css` | 删取消按压的两条规则；`--fuzzy/--unknown` hover 加 `:not(:active)` | −2 / +2 |
| `src/styles/skins/vinyl.css` | 按压去掉 `translateY(2px)`；hover 加 `:not(:active)`；`is-ack-known` 倾斜变体；描边键按压用自身墨色 | +20 / −2 |
| `src/styles/skins/bento.css` | `is-ack-known` 磁贴下压变体 | +14 |
| `src/styles/skins/nocturne.css` | `is-ack-known` 词头闪墨变体；按压用 accent/on-accent 配对 | +18 |
| `src/styles/skins/foundry.css` | 深色档按压改往亮面薄涂（3.72 → 8.32） | +8 |
| `scripts/audit-motion.js`、`audit-motion-shots.js`、`audit-motion-pressed.js`、`cfg-motion.json`（新） | 8 皮肤按压/反馈/toast/降级/对比度门禁 + 截图 | 新增 |
| `scripts/audit-requeue.js`、`audit-immediate-rounds.js`、`audit-phases.js` | 每次点作答后等待 120/140/200ms → 260ms（换卡被推迟了） | 各 +2 |

不动：`engine/`、`cards/`、`plan/`、`storage/`、`backup/`、schema。**零数据面改动**。

---

## 8. 验收（可执行，逐条要实物）

在 dev 5173 + Playwright 里跑，每条给命令输出或截图：

1. **按压**：按住时读 `.answer-btn` 的 `transform` → `matrix(0.97, …)`、`transition-duration: 0.05s`；松开 260ms 后 → `none` 且 `0.18s`。**8 皮肤 × 明暗全跑**（`scripts/audit-motion.js`）。
2. **按下比松开快**：同一按钮，`pointerdown→稳定` 用时 ≈50ms，`pointerup→归位` ≈180ms（读 `getComputedStyle().transitionDuration`，两值必须不同）。
3. **答对**：点「认识」后 60ms，`.flash-card` 的 `transform` 非 `none`；240ms 后词已换、`transform` 为 `none`。
4. **答错**：点「不认识」/「模糊」后 60–120ms 采样，`transform` 含非零 `translateX`；240ms 后归零且已换卡。
5. **遮罩不泄露**：未点「轻点看中文」直接作答，反馈窗口内 `.masked` 的 `color` 仍为 `transparent`。
6. **toast**：出现时 opacity 从 0 → 1（200ms 内）；2.5s 后开始淡出；解挂时 opacity 0、无位移；全程 `transform` 的 Y 分量不随退出变化。
7. **减弱动效**：`context = { reducedMotion: 'reduce' }` 重跑 1–6 → 按钮 `transform` 恒 `none`；答对后**立即**换卡（无 200ms）；toast 仍有淡入淡出、位移恒 0。
8. **回归**：`tsc --noEmit` 0 错、`vite build` 过、`test:scheduler` 459 条全过、`test:backup` 49 条全过；`audit-requeue.js` 与 `audit-immediate-rounds.js` 重跑全绿（脚本已按 §7 加等待）。
9. **无布局跳动**：作答前后记录 `.flash-card` 的 `getBoundingClientRect()` 宽高，必须相同（transform 不改布局，这条是自证）。
10. **量具必须先自证伪**：对比度探针新增任何颜色/数值解析，先拿已知期望值校准 ——
    白字压 `#000` 必须 ≈21:1、`color-mix()` 输出必须等于手算值、拿不到期望值就先给一个必须红的样例。
    **本轮踩过**：Chromium 把 `color-mix()` 序列化成 `color(srgb r g b / a)`，只认 `rgb()` 的解析会整层跳过、
    拿容器底色顶替 —— foundry 深色实际 8.32:1 被读成 **1.0:1**，vinyl 4.64 被读成 5.8。
    这跟 v9「祖先有 `overflow-x` 就跳过出列检查 → `nOut:0` 全假」是同一类：**探针给自己开了洞，绿的是探针不是产品**。

---

## 9. 已知代价（接受才开工）

1. **每题慢 180–200ms**：手感换时间。若真机上觉得"卡"，唯一旋钮是把 `--motion-feedback` 降到 140ms，**不是**加特效补偿。
2. **toast 2.5s 自动消失**：`今天已经答过这个词了，这次只记重试，不重复计分。`（24 字）读不完。可选补丁：停留时长按字数取 `max(2500, 字数 × 110)`，但会破坏"同一节奏"。**本轮按 2.5s 固定**，真机上觉得急再改。
3. **3 个 audit 脚本要改**：换卡被推迟，原来的"点完立刻读词"会读错。属于必须同步的改动，不是可选。
4. 皮肤里 `animation: vy-pulse`（vinyl 呼吸点）等既有动效**不参与**本轮，保持原样。
5. **会话一结束，toast 就没有宿主**：`session-done` 分支不渲染 `.session-toast`（改动前的结构就是这样）。所以"最后一题被拒"的提示会随收尾页一起消失。**本轮不修**（属于结构问题，不是手感问题），真机上如果觉得该看见，加一行 host 即可。
6. `foundry` 深色档按压时「认识」曾只有 **3.72:1**（`--accent-press` 比 `--accent` 更深，而该档 `--on-accent` 是近黑，越压越闷）。**已修**：改成往自身亮面薄涂（`color-mix(--accent-hover 78%, --text)`），现在 **8.32:1**，且比 hover 更亮一档，桌面从 hover 按下也有变化。

---

## 10. 本轮不做（明确留口）

卡片翻面、页面/批次转场、作答正确时的颜色铺满、进度条数字滚动、声音/震动（`navigator.vibrate`）。
这些都要等真机一周的手感报告再决定；`--motion-swap` 已经预留，接线时不需要改令牌。

---

## 11. 待拍板

- **D1 皮肤变体**：本轮只做基座（推荐）/ 连带 `vinyl`+`bento`+`nocturne` 三条分支。
- **D2 反馈延迟**：接受 180–200ms 的换卡延迟（推荐）/ 改成"立刻换卡 + 只做按钮按压"（等于放弃规则 B）。

**2026-11-26 用户拍板**：D1 = **直接做三条皮肤分支**；D2 = **接受延迟**。

---

## 12. 实测记录（2026-11-26）

跑法（隔离 headless context，全新 localStorage，不碰真实档案）：

```
Copy-Item scripts\audit-motion*.js C:\Users\xiao\.dsh\mcp\playwright-mcp\ -Force
node run-audit-node.js D:\背单词\scripts\audit-motion.js D:\背单词\scripts\cfg-motion.json
node run-audit-node.js D:\背单词\scripts\audit-motion-shots.js D:\背单词\scripts\cfg-motion.json
```

| 项 | 实测 | 结论 |
|---|---|---|
| 按压（8 皮肤 × 明暗） | 全部 `matrix(0.97, …)`、`transition-duration: 0.05s`，松开 260ms 后 `none` 且 `0.18s` | PASS |
| 答对动画 | paper/foundry/instrument/broadsheet/desk = `ack-lift`；bento = `bt-ack-press`；vinyl = `vy-ack-tilt`；nocturne 卡片 `none` + 词头 `nc-ack-ink` | PASS |
| 答错抖动 | `+3.94px → -2.68px → none`（方向反转、收敛归零） | PASS |
| 遮罩不泄露 | 反馈窗口内 `.masked` 仍是 `rgba(0,0,0,0)` | PASS |
| 布局不跳 | 反馈前后卡片盒宽高逐点相同 | PASS |
| toast | 首帧 `opacity 0 / translateY(12px)` → 300ms 后 `1 / none` → 停留到 2487ms → 2612ms 时 `leaving, opacity 0.05, transform none` → 3.4s 已卸载 | PASS |
| 减弱动效 | 按压 `matrix(1,0,0,1,0,0)`；作答后 90ms 内已换卡（无延迟）；toast 仍淡入、位移恒 `none` | PASS |
| 按压底色对比度（16 组） | **4.64（vinyl 浅）～14.58（broadsheet 浅）**，最低的 foundry 深色已从 3.72 修到 8.32 | PASS（≥3，实测全 ≥4.6） |
| 回归 | `tsc` 0 错、`vite build` 过、`test:scheduler` 459 / `test:backup` 49 全过、`audit-requeue` 全绿（三哈希一致）、`audit-immediate-rounds` 全绿 | PASS |

截图：`docs/screenshots/motion/`（390/360/768/1440 复习屏 + vinyl/bento/nocturne 变体 + 3 张按住态）。
