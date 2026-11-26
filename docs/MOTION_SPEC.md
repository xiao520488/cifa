# MOTION_SPEC · 作答手感（v1）

> 一句话：**只加手感，不加表演。** 三档时长、两条曲线、三个组件、零布局动画。
> 范围：学习流（复习三键 / 即时复习两键 / 错词单测）+ 学习流里的 toast。不碰首页、日历、我的、浮层。
>
> **v2（§13）追加三件**：页面转场、主题 / 皮肤切换过渡、读数数字滚动。转场仍是「只动进入屏」，颜色仍是唯一例外，数字滚动是唯一会改文本的动效（口径见 §13.4）。

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
| 入场错峰 / 逐项浮现 / 卡片翻面 | 本轮明确不做（见 §11 决策 D1、D2） |
| 页面**退出**动画 / 两屏同时动 | v2 只做进入屏（§13.3）；退出屏立即卸载，一个像素都不动 |
| 批次转场（下一批 / 即时复习换组） | 仍不做 —— 那会在学习中途抢注意力，与卡片反馈打架 |
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

卡片翻面、批次转场、作答正确时的颜色铺满、涟漪 / 粒子、声音 / 震动（`navigator.vibrate`）。
这些都要等真机一周的手感报告再决定。

**v2 已解禁其中两项**：跨屏转场（§13.3，只做进入屏）、读数数字滚动（§13.5）。翻面、批次转场、铺色、涟漪、粒子、震动仍然不做。

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

---

## 13. 第二轮（v2）· 转场 / 主题过渡 / 数字滚动

> **三件，三个 commit，不混合。** 不加特效，不加档位（唯一例外见 §13.1 D5）。
> 范围：四个 tab 屏之间换屏（学习 ↔ 日历 ↔ 我的 ↔ 错词本）、切明暗 / 切皮肤的那一刻、读数数字的变化。
> 仍然不做：卡片翻面、列表入场错峰、批次转场、涟漪、粒子、震动、`transition: all`。

### 13.0 令牌账（先看这张表）

| 用途 | 值 | 令牌 | 状态 |
|---|---|---|---|
| 转场 | `350ms` | `--motion-swap` | 已有（§1 一直「只定义不接线」，本轮首次接线） |
| 转场位移 | `8px` | `--screen-shift`（新） | **幅度**令牌，不是时长档（与 `--toast-shift` / `--press-scale` 同类） |
| 主题 / 皮肤过渡 | `200ms` | `--motion-theme: 200ms`（字面量） | 零新增值；**不能别名 `--duration-base`**，见下 |
| 数字滚动 | `250ms` | `--motion-number` | **已批准（2026-11-26）：唯一破例，只给数字滚动，不得挪用** |
| 曲线 | — | `--ease-out` / `--ease-state` | 已有，不新增 |

**为什么是 350 / 200 / 250**：转场是「一屏换一屏」，人要重建位置感 → 350；颜色是「同一位置换衣服」，超过 200ms 就像卡顿；数字是最短的一段连续变化，250 是「看得出在动」的下限。
严格说 250 是第四个值 —— **本轮唯一破例，且写死三条限制**：① 只给数字滚动用；② **不得挪用**给任何其他交互（新交互要用的时长必须回 50 / 200 / 350 选，或另开一轮拍板）；③ 令牌名 `--motion-number` 只许出现在数字滚动的实现里，出现第二处即判越界。

**200ms 为什么写成字面量而不是别名 `--duration-base`**：`foundry` 把 `--duration-base` 改成 **160ms**、`instrument` 改成 180ms。别名一接上，「切主题 200ms」就变成随皮肤变 —— 第一次实测切到 foundry 直接是 **0.16s**。主题过渡是跨皮肤的同一条节奏，必须写死 200ms。

### 13.1 三处拍板（2026-11-26 用户已定，下述为定稿口径）

- **D5 · 250ms**：现有档位只有 50 / 200 / 350。**拍板：批准 250ms**，写 `--motion-number: 250ms`；**写死「唯一破例、只给数字滚动、不得挪用」**（落地形式见 §13.0 的三条限制）。
- **D6 · 数字滚动的实现口径**：硬约束是「只用 transform / opacity」，但数字滚动必然要改文本（除非做逐位翻条）。两条路：
  - **A（选它）逐帧改文本**：容器宽度靠「幽灵占位」锁死，每帧只写 `textContent`、不读任何布局 → 布局位移恒 0；8 套皮肤的字距、比例字体、缺 `tnum` 都不影响。
  - **B 逐位翻条**：纯 `translateY` 的 0-9 字条，最贴硬约束；但 8 套皮肤的 `line-height` / `letter-spacing` / 衬线数字各自要适配，进位（9→10）要同时滚两位，实现量与出错面大一个档。
  - **拍板：A。** 同时**必须在 §13.10 记一笔**：这是本轮对「只用 transform / opacity」的第二处破例（第一处是主题三色过渡），**只限本轮，不成先例** —— 不许悄悄破。
- **D7 · 滚哪些宿主**：同一屏同一数字有多个宿主（首页「已学」同时出现在读数带、`.start__meta`、`.start__spec` 第 4 行）。只滚带子，这 250ms 里就会出现「已学 020 / 已学 021」自相矛盾——这正是 v10 明令禁止的「同屏两个值」。
  - **A（选它）同屏同源全滚**：所有宿主共享同一个 `value` + 同一个 `memoKey`，同帧起滚。
  - **B 只滚读数带**：工作量小，但要接受 250ms 的自相矛盾，并写进已知代价。
  - **拍板：A。** §13.7 G3 第 1 条的「125ms 时刻三处『已学』文本逐字相等」断言**保留并加粗强调**，它是 D7-A 唯一的硬证据。

### 13.2 结构事实（决定了实现方式，不能靠猜）

1. **四个屏是条件渲染**（`App.tsx:206-295`）：换屏 = 旧屏整棵卸载 + 新屏整棵挂载。所以「只动进入屏」是结构给的，不需要写「有没有退出动画」的判断；也所以**任何 CSS class 的挂载时机都要早于首帧**（用 `useLayoutEffect`，不是 `useEffect`——后者跑在 paint 之后，会先闪一帧终态再跳回 8px）。
2. **四个屏的根都是 `header.topbar` + `main.app__main`**，首页在两者之间多一条 `.readouts`。
3. **不许加包裹层**：`.app` 自己被皮肤当网格用（`[data-skin='desk'] .app:has(.start)` 两列网格、`vinyl` 靠「最后一个非滚动子元素」吸底）。插一层 wrapper 会同时拆掉 desk 的网格与 vinyl 的吸底。**转场直接打在 `.app` 的直接子级上。**
4. **`.readouts` 有两种，都跟着屏走**：首页那条是屏的一部分；desk / vinyl 在日历与「我的」的那条虽然是 `App` 渲染的常驻带，但换屏时它照样重新挂载（`showBand` 由 false 变 true）或重跑一次动画 —— 实测就是三个节点一起淡入（`enter-390-desk-*` 截图）。**结论：常驻带也属于「进入屏」**，不特殊对待（早先以为它跨屏存在所以不动，实现与截图证明不是这样，以实测为准）。
5. **缓动不能硬编码**：`bento` / `instrument` / `foundry` / `broadsheet` 各自覆盖了 `--ease-out`。转场用 CSS 变量自然跟随；数字滚动必须在每次起滚时**读一次**当前皮肤的 `--ease-out`（一次样式读，不是每帧），否则曲线与其余动效不一致。

### 13.3 规则 D · 页面转场（commit 1）

| 项 | 决定 |
|---|---|
| 触发 | `screen` 在 study / calendar / me / mistakes 之间变化 |
| 不做 | `session` 进出（学习流有自己的节奏）；批次切换；浮层（sheet / dialog 已有自己的入场） |
| 目标 | `.app.is-screen-entering > .topbar`、`> .readouts`、`> main.app__main` |
| 关键帧 | `opacity 0 → 1`、`translateY(var(--screen-shift)) → 0` |
| 时长 / 曲线 | `var(--motion-swap)` / `var(--ease-out)` |
| 结束态 | `transform: none`（**不能**留 `translateY(0)`） |

```css
@keyframes screen-in {
  from { opacity: 0; transform: translateY(var(--screen-shift)); }
  to   { opacity: 1; transform: translateY(0); }
}
.app.is-screen-entering > .topbar,
.app.is-screen-entering > .readouts,
.app.is-screen-entering > main.app__main {
  animation: screen-in var(--motion-swap) var(--ease-out) backwards;
}
```

- **`backwards` 不是 `both`**：`both` 会把 `translateY(0)` 永久留在元素上 —— 那仍然是一个 `transform`，等于永久给 `main.app__main` 打开 containing block（`position: fixed` 后代、sticky 计算全变）。门禁直接断「350ms 后 `transform === 'none'`」。
- 报头必须一起动：只让正文淡入、标题瞬切，会露馅（且 `topbar` 是 sticky，位移时不会跟着滚，视觉上就是两段）。
- 读数带一起动：首页 `.readouts`，以及 desk / vinyl 在日历与「我的」的常驻带（它是 `.app` 的直接子级，实测会随屏挂载/重跑，见 §13.2 第 4 条）。三处同步起跑，不会出现「带子已经在了、正文还在淡入」。
- class 的挂与摘：`App` 里 `useLayoutEffect` 依 `screen` 挂 `is-screen-entering`，`350 + 30ms` 后摘；重入重置计时器，卸载清理。**只在此处挂，`session` 变化不挂。**
- 8px 缝隙色：`topbar` 与 `app__main` 下移 8px 会露出 `.app` 的底色。门禁断言「`.topbar` 的背景色 = `.app` 的背景色，或 `transparent`」——不同色就是一条会闪的横缝。
- **已知代价**：350ms 内若打开日历的 Hint 浮层，浮层会偏 8px（transform 造 containing block，而 `Hint` 用 `getBoundingClientRect` 定位）。概率极低，不修。

### 13.4 规则 E · 主题 / 皮肤切换过渡（commit 2）

| 项 | 决定 |
|---|---|
| 触发 | `profile.theme` 或 `profile.skin` 变化（含「跟随系统」被系统切暗）；**首次挂载不触发**（用 ref 跳过首轮，否则开 App 就先演一遍） |
| 属性 | `background-color`、`color`、`border-color` —— **逐属性列，禁止 `all`** |
| 时长 / 曲线 | `var(--motion-theme)` / `var(--ease-state)` |
| 生命周期 | 加类 → 属性变更 → `200 + 40ms` 后摘类；重入重置计时器 |
| 载体 | `<html>` 上的 `is-theme-switching`（一次性） |

```css
html.is-theme-switching,
html.is-theme-switching *,
html.is-theme-switching *::before,
html.is-theme-switching *::after {
  transition-property: background-color, color, border-color !important;
  transition-duration: var(--motion-theme) !important;
  transition-timing-function: var(--ease-state) !important;
  transition-delay: 0s !important;
}
/* 必须存在：见下 */
@media (prefers-reduced-motion: reduce) {
  html.is-theme-switching,
  html.is-theme-switching *,
  html.is-theme-switching *::before,
  html.is-theme-switching *::after { transition: none !important; }
}
```

- **为什么用 `*`**：8 套皮肤的色面分散在容器底色、文字、边框、分隔线、`::before` 贴条五处，逐类名枚举必然漏一层；漏一层就是「大部分在过渡、某几块硬切」，比不过渡更丑。
- **为什么要先强制一次样式重算**：类与 `data-theme` / `data-skin` 如果**同一次任务里**一起改，浏览器在两次重算之间从没观察过「带 transition 属性的旧颜色」→ 过渡根本不会触发（看起来就是瞬切）。所以 `startThemeTransition()` 里加完类必须先 `void documentElement.offsetHeight` 把样式压下去，再改 `dataset`。这条不写清，实现出来会是「代码全对、就是不渐变」。
- **为什么必须 `!important`**：元素身上有 20+ 处自己的 `transition`（`app.css` 里 140ms 那批），不加 `!important` 会有一半元素走 140ms、一半走 200ms，同一帧里两种节奏。
- **为什么那条 reduced-motion 反制是硬要求**：`app.css:1933` 的全局兜底把 `transition-duration` 压到 `0.01ms !important`；本块的 `!important` + 类选择器特异性更高，会把 200ms **重新打开** —— 等于给「明确关掉动效」的人加上唯一一个他不想看的过渡。JS 里跳过是主保险，这条 CSS 是二保险，门禁两条都测。
- **覆盖不了的（如实列）**：`background-image`（8 套里 5 套有渐变 / 纹理）、`box-shadow`（明暗档不同）、`color-scheme`（原生控件与滚动条）、字族与间距（皮肤切换会瞬切）。这些会硬切 —— 判定标准是抽查截图，不是数值。
- **不设「中间态对比度」阈值**：两色混合的中途必然低于终值，卡一个阈值只会逼出假阳性。16 组只**记录**中间态最低值 + 3 帧截图，由人判定「有没有丑色」。

### 13.5 规则 F · 数字滚动（commit 3）

**宿主（本轮就这些，其余不动）**

| 屏 | 宿主 | 数字 |
|---|---|---|
| 首页 | `.readouts` 三个 `.readout__v` | 今日 / 批数 / 已学（零填充 2/2/3） |
| 首页 | `.start__meta` 两个 `<b>` | 今日 N / 已学 N |
| 首页 | `.start__spec` 第 2/3/4 行 | 今日新词 / 共 N 批 / 已学 N |
| 日历 | `.cal-title b` | 新词 N |
| 日历 | `.cal-figures` 四个 `dd` | 到期 a / b、逾期、今日已学、连续 N 天 |
| 日历 | `.cal-foot` | 上限 / 目标 / 未学 |
| 错词本 | `.study-bar__sub` | `${rows.length} 个词` |
| 我的 | `.stat__num` | **不做**（你没点名；要就一句话加上） |

**机制**：新组件 `src/components/RollingNumber.tsx`

```tsx
<span className="num-roll" data-num-key={memoKey}>
  <span className="num-roll__ghost" aria-hidden="true">{'0'.repeat(digits)}</span>
  <span className="num-roll__live" aria-hidden="true">{text}</span>
  <span className="sr-only">{finalText}</span>
</span>
```

```css
.num-roll { position: relative; display: inline-block; font-variant-numeric: tabular-nums; white-space: nowrap; }
.num-roll__ghost { visibility: hidden; }                          /* 用真字体撑出最宽位数 */
.num-roll__live  { position: absolute; inset: 0; text-align: end; } /* 右对齐叠在同格 */
```

- **宽度为什么用「幽灵占位」而不是 `min-width: 4ch`**：`ch` 只在「等宽数字 + 无字距 + 有 `tnum`」时才准。8 套皮肤里有加 `letter-spacing` 的、有比例数字的、有可能缺 `tnum` 的 —— `4ch` 一定小于真实「0000」宽度，于是 999→1000 那一帧照样撑开。幽灵层渲染的是同样字体的同样个数的 `0`，**盒宽天生等于最宽情形**，`live` 是绝对定位的，文本再宽也只能往左溢出，推不动布局（这就是「右对齐 + 预留宽度」的合体）。
- **跨挂载记忆（不写这条功能等于不存在）**：四个屏是条件渲染，答完题回首页时屏是**重新挂载**的。若组件只在本地存 `prev`，mount 时 `prev === value` → 永远不滚。所以 `RollingNumber.tsx` 里放一个模块级 `Map<string, number>`，`memoKey` 做键：mount 时「有旧值且 ≠ 新值」→ 从旧值滚到新值；否则直接显示。**冷启动首屏仍然不滚**（Map 是空的）。
  **模块态可以放（key 有限、不会泄漏），但卸载清理里绝不能把 `lastShown` 写成目标值 `e.to`**——这是本轮真正的坑，不是"模块记忆被清掉"：
  StrictMode 在开发模式下会把「挂载 → 卸载 → 再挂载」走一遍同一个 commit，卸载时的清理如果写 `lastShown = e.to`，
  等于**把起点抹成终点**，紧接着的第二次挂载 `ensure` 看到「已是终值」→ 一帧不滚、直接落终值。
  实测日志：`3966ms set-unsub home.learned 10` → `3967ms ensure cur=10 last=10` → 三处文本首帧就是 10。
  清理里只能记 **`e.current`（用户最后真正看到的那个数）**；这条对「滚到一半离开首页」同样正确 —— 回来从半路接着滚。
  生产构建没有 StrictMode 双跑，但清理逻辑仍然必须正确（切屏 / 退出都会走到同一路径）。
- **每帧只做两件事**：`live.textContent = format(round(eased(t)))`；不 `getBoundingClientRect`、不 `getComputedStyle`、不读写布局属性。
- **缓动**：起滚时读一次当前 `--ease-out`（皮肤可覆盖），用 `motion.ts` 里的 cubic-bezier 求值器算进度。不硬编码 `1-p³`。
- **打断**：同一个 `memoKey` 二次变化 → 取消上一帧循环，从「当前显示值」接着滚（不回跳到旧旧值）。
- **同屏一致（D7 的落地）**：同一数字的多个宿主拿同一个 `memoKey`，同一帧起滚；门禁在 125ms 时刻比对三处「已学」文本必须相等。
- **reduced-motion**：直接写终值，不建 rAF、不延迟。
- **不滚的**：错词本行内「错 N 次」徽标（答对后整行移除，滚它没意义）、学习流进度（`aria-valuenow` + 进度条，另议）、阶段词数 `totalCount`（词库常量，不随学习变化）。

### 13.6 降级汇总（`prefers-reduced-motion: reduce`）

| 件 | 行为 | 实现 |
|---|---|---|
| 转场 | 350ms **淡入**，位移恒 0 | `--screen-shift: 0px` 归零（tokens 既有归零块）+ 一条「只保时长」的 `!important` override（全局 `*` 会把时长压到 0.01ms） |
| 主题 / 皮肤 | 不加类，瞬切 | JS 直接 return + 上条 CSS 反制 |
| 数字 | 首帧即终值 | JS 读 `prefersReducedMotion()` |

转场那条 override 的必要性同 §6 的 toast：不给时长放行，淡入会变成 0.01ms 的硬切 —— 而「只留 opacity」正是你要的行为。

### 13.7 门禁：`audit-motion.js` 三组新断言（各自单跑，不混进旧组）

**跑法（v12 复盘后改）**：八组（`G1 G2 G3 press shake toast reduce contrast`）都支持单组跑 ——
cfg 里写 `{"__audit_only":"G3"}`，逗号分隔可列多组；**认不出的组名当场报错**（不许「一个组都没跑 → 零失败 → 绿灯」，
已知坏样例：`scripts/cfg-motion-badgroup.json`）。实测全量 66.6s → 单组 G3 14.8s。
**子集跑不是发布门**：commit 前必须全量一次，`fails: []`。

**G1 转场只动进入屏**
1. 依次 study → cal → me → mistakes → study；每次切换后 60ms 采样：`.screen` 节点数 === 1；`topbar` / `app__main` 的 `animation-name === 'screen-in'`、`animation-duration === '0.35s'`。
2. 旧屏：切换前给旧节点打 `data-old`；切换后 `isConnected === false` 且 `getAnimations().length === 0`（证明没有退出动画在跑）。
3. 位移收束：60ms > 200ms > 350ms，350ms 后 `transform === 'none'`（断 `backwards` 没写成 `both`）。
4. 缝隙色：`.topbar` 背景色 === `.app` 背景色，或 `transparent`。
5. reduced-motion：全程 `translateY` 分量恒 0，60ms 时 `opacity < 1`。

**G2 主题过渡不常驻**
1. 基线（切换前）：`<html>` 上没有 `is-theme-switching`；记录六个节点（`.app` / `.topbar` / `.screen` / `.readout` / `.btn` / `.cal-figure`）的 `transition-property` 与 `transition-duration` 原串；任意时刻 computed `transition-property` **不含 `all`**。
   ⚠️ **基线允许本来就含 `background-color / color / border-color`**：基座与 8 套皮肤本来就有 140ms 的 hover 颜色过渡。真正的判据是「320ms 后逐字回到基线」，不是「基线里没有颜色」——第一版规约写成「基线不含」，是错的，已按实测改。
2. 点「深色」后一帧：类在；上述节点 `transition-duration` 含 `0.2s`、`transition-property` 含三属性、无 `all`。
3. `+320ms`：类消失；六个节点的两条属性字符串与基线**逐字相等**（这是「不常驻」的判据，不是「看起来还好」）。
4. 真在过渡：100ms 时 `.app` 的 `background-color` 既不等于切换前、也不等于切换后。
5. **reduced-motion 两条都要测**：① **JS 跳过** —— 点「深色」后连续采样，类一次都不出现，且 `.app` 背景 60ms 内已经是终值（没有中间态）；② **CSS 反制** —— 手动强制加类后，六个节点的 `transition-duration` 必须是 `0s` / `0.01ms`，不许是 `0.2s`（否则等于给「明确关掉动效」的人加了他唯一不想看的过渡）。
6. **自证伪**：手动加一个旧类名（`is-theme-fade`）→ 「320ms 后类消失」这条必须红；红不了就是探针在自欺。

**G3 数字滚动不撑布局**
1. 隔离 context 造 1 张今日卡 → 首页读「已学」→ 进 session 答完 → 回首页；回首页 30ms 采样：文本 ≠ 新值；125ms：介于旧值与新值之间；300ms：等于新值。
   **125ms 时刻，首页三处「已学」宿主（`.readout__v`、`.start__meta b`、`.start__spec` 第 4 行）的文本必须逐字相等** —— 这是 D7-A「同屏同源全滚」唯一的硬证据，任一不等即 FAIL（不允许出现「已学 020 / 已学 021」）。
2. 布局：0 / 60 / 125 / 190 / 250ms 五个采样点，`.num-roll`、其父宿主、`.readouts`（或 `.start__spec`）的 `getBoundingClientRect()` 宽高逐点相同；`.app__main` 的 `scrollHeight` 不变。
   **只量可见宿主**：paper / foundry / broadsheet / nocturne / desk 的**首页读数带本身是 `display:none`**（宽 0），拿它量「撑不撑布局」只会得到假失败 —— 这是探针自己的洞，不是产品问题。
3. 390 档 × 8 皮肤 × 明暗：`.readouts` 的 `scrollWidth === clientWidth`（4 位预留不许把带子挤溢出）。带子被皮肤隐藏时 `sw === cw === 0`，按通过处理（没有可溢出的宽度）。
4. 首次渲染：冷启动首屏 30ms 文本已等于终值。
5. reduced-motion：同一流程，回首页首帧即终值。
6. **自证伪**：三组各带一个必须红的样例（G1 把 `--screen-shift` 临时改 0 → 位移断言必须失败；G2 用旧 class 名强制加类 → 类消失断言必须失败；G3 把 `digits` 设 1 → 宽度断言必须失败）。沿用 §8 第 10 条：红不了的探针等于没有探针。

### 13.8 三个 commit（各自可单独 revert，各自带实物）

| # | message | 实物 |
|---|---|---|
| 1 | `feat(motion): 页面转场——进入屏淡入 + 上移 8px（350ms，退出屏不动）` | G1 全绿输出 + reduced-motion 输出 + 8 皮肤 × 明暗 3 帧截图 + `tsc`/`build` |
| 2 | `feat(motion): 主题/皮肤切换 200ms 颜色过渡（一次性类，不常驻）` | G2 全绿输出（含 320ms 后逐字相等的 diff）+ 16 组 3 帧截图 + 中间态对比度记录表 |
| 3 | `feat(motion): 读数数字滚动（250ms，幽灵占位锁宽）` | G3 全绿输出 + 5 采样点盒宽表 + 390 档 8 皮肤 `scrollWidth` 表 + reduced-motion 输出 |

每个 commit 前必须：`tsc --noEmit` 0 错、`vite build` 过、`test:scheduler` 459 / `test:backup` 49 全过、既有三组 `audit-motion` 组不变绿（不许为了新组把旧组改软）。

### 13.9 实现清单

| 文件 | 改动 | 量级 |
|---|---|---|
| `src/styles/tokens.css` | `--screen-shift`、`--motion-theme`（别名）、`--motion-number`（待批）；归零块加 `--screen-shift: 0px` | +5 |
| `src/styles/app.css` | `@keyframes screen-in`、`.app.is-screen-entering > …`、`html.is-theme-switching …`（+ reduced 反制）、`.num-roll` 三件 | +40 |
| `src/lib/motion.ts` | `cubicBezier()` 求值器、`startThemeTransition()`、`readEaseOut()` | +70 |
| `src/components/RollingNumber.tsx`（新） | 幽灵占位 + 每 key 一条 rAF + 同 key 共享时钟 + 打断/卸载清理 | ~110 |
| `src/components/Readouts.tsx` | `value` 从字符串改为数字 + 用 `RollingNumber` 渲染（`data-readout` / 类名不许变） | +12 / −6 |
| `src/components/StudyScreen.tsx` | `.start__meta` 两个 `<b>`、`.start__spec` 三处数字 | +8 / −8 |
| `src/components/CalendarScreen.tsx` | `.cal-title b`、`.cal-figures` 四组、`.cal-foot` 三数 | +15 / −10 |
| `src/components/MistakesScreen.tsx` | `.study-bar__sub` 计数 | +3 / −1 |
| `src/App.tsx` | `useLayoutEffect` 挂/摘 `is-screen-entering`；主题 / 皮肤 effect 调 `startThemeTransition()`（首轮跳过） | +30 |
| `scripts/audit-motion.js`、`cfg-motion.json` | G1/G2/G3 三组 + 三个必须红的样例 | +160 |
| `scripts/audit-motion-shots.js` | 转场 3 帧 / 主题 3 帧 × 8 皮肤 × 明暗 | +40 |

不动：`src/styles/skins/*.css`（预期零改动）、`engine/`、`scheduler/`、`storage/`、`backup/`、schema。**零数据面改动。**

若 390 档某皮肤读数带因 4 位预留溢出：只准收该皮肤该处的 padding，并记录在案；**不许用 `overflow: hidden` 糊过去**。

### 13.10 已知代价（接受才开工）

1. 转场期间 `main.app__main` 带 `transform` → 350ms 内打开 Hint 浮层会偏 8px。
2. 主题切换只有三色过渡：渐变、阴影、字族、间距会硬切；判丑靠人眼抽查，不靠阈值。
   **中间态发灰是「fg/bg 同时过渡」的固有结果，不是 bug**：中段对比度 **1.04–1.59**、落定 **4.59–7.36**，
   16 组（8 皮肤 × 明暗互切）已记录，截图在 `docs/screenshots/motion/v2-theme/`（每张带 `ratio`）。
   2026-11-26 用户拍板：**接受 200ms 不动**。将来若要优化，方向是**错开 fg / bg 的起点**
   （背景 0–200ms、文字 80–280ms），**不是压时长** —— 压时长只是让那一下更快，交叉本身还在。
3. **⚠️ 本轮对「只用 transform / opacity」有两处破例，逐条写在案，不许悄悄破**：
   - **破例一 · 颜色过渡**：主题 / 皮肤切换做 `background-color` / `color` / `border-color` 200ms 过渡（§13.4）。颜色只重绘不重排，是最古老的那条例外；仍然**逐属性列，永不用 `all`**。
   - **破例二 · 文本变化**：数字滚动逐帧改 `textContent`（D6-A）。布局稳定不是靠「只动 transform」，而是靠**幽灵占位锁宽 + 每帧不读布局**两条可测约束兜住；`--motion-number` 的适用范围写死到这一处。
   - **两处都只限本轮，都不成为先例**：以后任何新的颜色动效、任何新的文本动效，都要单独过一遍（说清为什么非它不可 + 用什么可测约束兜住布局），不许引用「上次就这么干的」。
4. 250ms 是第四个时长值（D5）：唯一破例、只给数字滚动、不得挪用（§13.0）。
5. 「我的」页 `.stat__num`、错词本行内徽标、学习流进度条不滚。
6. `session` 进出不转场；若在转场 380ms 内点「开始背单词」，学习流首屏会继承一次淡入（类还没摘）——概率低，接受。
