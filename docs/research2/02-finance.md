# 领域调研 02 · 金融 / 记账 —— 首页骨架拆解

- 调研日期：2026-11-25
- 负责领域：金融 / 记账（Revolut、Monzo、Robinhood、Copilot Money、Moneytree、支付宝、招商银行 / 国内手机银行）
- 任务定位：**只谈版面骨架**——焦点放在哪、几栏、信息密度、导航位置、CTA 形态、数据放不放首页、什么被藏起来。不谈配色情绪。
- 落地目标：给「词笺」首页（皮肤只能改 CSS，DOM 固定）提出 3 个**结构上真正不同**的布局方向，避开「同一个 UI 换个色」。

---

## 一、速览表（7 个产品的首页骨架）

| 产品 | 首屏焦点 | 栏数 | 密度 | 导航位置 | CTA 形态 | 数据放首页？ | 什么被藏起来 |
|---|---|---|---|---|---|---|---|
| Revolut 10 | 余额（可点切账户/币种） | 单栏纵堆 | 极低→低（余额+快操作） | 底部 5 tab（原 3 tab）+ 首页圆形快操作行 | 快操作图标行，紧贴余额下方 | 只放"余额"这一层 | 产品线全进 Hub；流水进账户页 |
| Monzo 新首页 | 卡片/账户 tile（点它=进全明细） | 单栏 section 列表 | 中（section 可关可排） | 顶部头像=布局编辑器 + 底部 tab | **可点对象即入口**（点卡片而非按按钮） | 摘要在首页，明细不在 | 完整流水；Pots 可 toggle 隐藏；分析在 Trends |
| Robinhood | 账户总值超大数字 + 撑满视口的折线图 | 单栏，图占约 40% 视口 | 低（数字→delta→图→列表） | 底部 tab（Home/Lists/Portfolio/…） | 满宽 Buy/Sell（改版后拆成 3 个明确按钮，实时显示 bid/ask） | 总值+当日涨跌+图；持仓只露前几行 | 历史成交/账本/税务；无自定义时间段 |
| Copilot Money | 月度**进度图**，图上最大字是派生数 "Free to Spend" | 单栏 6 个 section（每 section 自带跳转链） | 高（6 类摘要同屏） | 底部 tab，顺序可在设置里拖拽 | 无主 CTA——首页是"读"，动作在各自详情页 | 全放，但每类只放"摘要 + >" | 明细在 Transactions/Cash Flow/Recurrings 各自 tab |
| Moneytree | 余额表（默认面板） | **左右滑动三分屏**：ポイント/口座残高/支出 | 中（每屏一件事） | 底部 tab（Insights 独立成一 tab） | 弱（+ 号添加、右上图例进图表） | 支出屏只 4 件事：月柱状/最大品类/最大一笔/异常消费 | 週/月/年切换、环比、明细全部在"点卡片后的详情页" |
| 支付宝（经典版） | 顶部高频动作（扫一扫/收付款/卡包） | 单栏多楼层（搜索→入口→宫格→常用→Banner→楼层） | 极高（12~20 宫格 + 楼层） | 底部 5 tab + 宫格翻页 + 二楼 | 图标化高频动作，位置永不弱化 | 服务入口放首页，**资产不在首页** | 长尾服务进小程序中心/百宝箱/更多 |
| 支付宝（AI 版「阿宝」2026-06 内测） | 对话框 | **首页只剩两页**（左对话 / 右资产总览） | 极低（九宫格整块删除） | 底部仍留 4 个高频快捷键 | 对话即动作；资金变动必须跳回本人确认页 | 资产另起一页，不混进对话页 | 上万个服务入口被压进一个输入框 |
| 招商银行 / 国内手机银行 | 金刚区（一屏 9+1 高频入口） | 单栏五段式（搜索/状态栏→金刚区→常用→Banner→楼层） | 高（楼层制，按业务权重排序） | 底部 tab + 金刚区 | 图标网格；财富页顶部总资产+收益为视觉重心 | 入口全放，**资产数字在财富页不在首页** | 品类细节在产品列表/二级页；平安/交行干脆砍掉金刚区换运营位 |

一句话总结这个领域正在发生的事：**金融 App 首页在集体做减法——首屏只留"一个数 + 一个动作"，把明细、口径、时间维度整体推到二级页**；而做减法的代价由 Nielsen Norman Group 点明：信息密度过低、可发现性变差，被挪走的东西必须仍然容易找到。

---

## 二、逐产品拆解

### 1. Revolut（Revolut 10，2023-10）

**structure**
- 一进入就看到所有主账户与余额，**点一下即切换账户/币种**——首页第一件事是"选口径"，不是"看说明"。
- 余额下方紧跟一排圆形快操作（支出与预算 / 卡片 / 充值 / 兑换 / 账户详情 / 月结单 / 换算器 / 添加账户），动作永远贴着数字。
- 继续下滑是 **widget 区**：用户自己决定装哪些卡片。2021 年的 8.0 已经先做过"把核心产品 pin 到首页顶部"。
- 底部导航从 3 个（Home/Transfers/Hub）扩到 5 个（新增 Invest/Crypto/Lifestyle）。
- 一条值得记住的评论：这种极简**不只是视觉语言变化**——银行把广告位从首屏撤走，才有胆子做减法；能把大量产品从首页移除并上线，靠的是产品决断力，不是设计师品味。

**surfaced**：余额（多账户可切换）、一排高频动作、用户自选 widget。
**hidden**：所有产品线（投资/加密/保险/借贷）进 Hub 一屏分类滚动；交易明细要点进账户；月结单/预算分析在快操作后面的页。

**css_only（迁移到词笺）**
词笺没有余额，最接近"可切换口径"的素材是 `.readouts` 的三个 `.readout`。做法：把外壳里的读数带变成横向吸附卡带——

```css
[data-skin='x'] .readouts{display:flex;gap:0;overflow-x:auto;
  scroll-snap-type:x mandatory;padding-inline:var(--page-x);
  border-bottom:1px solid var(--border-strong)}
[data-skin='x'] .readout{flex:0 0 auto;min-width:44%;scroll-snap-align:start;
  padding:8px var(--space-3) 8px 0}
[data-skin='x'] .readout + .readout{border-left:1px solid var(--border)}
[data-skin='x'] .start__actions{order:-1}   /* 动作紧贴读数，像 Revolut 贴着余额 */
```

360 注意：每卡 `min-width:44%`（≈158px）能露出下一卡约 8px，作为"还能滑"的提示；首卡不能贴边，靠 `padding-inline` 兜住。**关键事实：`.readouts` 是 `.app` 外壳的兄弟节点，不在 `.app__main` 滚动容器里**，所以它天生是"常驻状态条"，不会随内容滚走；代价是它永久吃掉约 34px 视口高度（bento 注释实测顶栏 60 + 读数条 34 = 94），凡是把 `.readouts` 开起来的皮肤，`.start{min-height}` 必须按实高扣，否则多出幽灵滚动、钉底元素卡在折线外。

### 2. Monzo（新首页，2023）

**structure**
- 首页 = **可自定义的 section 列表**：顶部头像 → 卡片 → Accounts → Pots → Savings Pots → 可选的 insights "spotlight" 小卡（余额/账单/支出/预算）。
- 三档可调：**顺序、可见性、详细程度**；入口是"点左上头像 → Edit layout → Layout 屏"。也就是说**布局本身是一项被产品化的功能**，而不是设计师一次拍板。
- 最值得抄的一条：**可点对象即入口**。要看全部流水，是点你的那张卡/头像，不是找一个"查看全部"按钮。
- 争议点（用户真实反馈）：旧首页打开就是 feed，"零次点击就能看到最新流水"；新首页要点卡片或下滑才能看到。**把最想看的东西推离首屏，是减法最大的翻车面**。

**surfaced**：所有账户汇总的最近活动摘要、Pots 缩略、spotlight 洞察卡。
**hidden**：完整流水（点进账户）；Pots 可整块隐藏；分析在 Trends 页。

**css_only**
- 词笺首页一共只有 7 个可点目标（2 个 `.icon-btn`、`.avatar-btn`、`.btn--primary`、`.today-card__links` 里 2 个文字链、`.start__foot` 里 1 个文字链）。做不出"9+1 宫格"，但可以反用：**把 `.avatar-btn` 放大成首屏唯一的"账户物体"**，用 `position:absolute` 钉在 hero 数字右侧（96×96、超出 44px 要求），呼应 Monzo"点它=进明细"。
- section 分隔骨架：`.start{display:grid;gap:0}`，每个 section（`.today-card` / `.start__meta`）用 `::before` 造 1px hairline + `counter-increment` 造 11px 序号，形成"可排序 section 列表"的视觉语法（即便不能真的排序）。
- 条件骨架（Monzo "有事才出现"的等价物）：`.today-card__figure` 的 `<b>` 带 `is-warn`/`is-accent`，`.today-card__reason` 带 `is-increase|is-decrease|is-paused`，这些是**仅有的状态类**，可以喂给 `:has()`：
  `[data-skin='x'] .start:has(.today-card b.is-warn){/* 有逾期 → 把 today-card 提到首屏最前 */}`。

### 3. Robinhood

**structure**（依据第三方 iOS 拆解 + Pratt IXD 评析，非官方规范，数值当量级参考）
- 同一套屏面法则：**白底、tabular 数字、绿涨橙跌、图先于一切**——"图在别的东西开口之前先占掉视口约 40%"。
- Portfolio 屏自上而下：账户总值超大 tabular 数字（约 32pt）→ **紧接一行 day change（当日涨跌）** → 一条左右撑满的折线图（约 140pt）→ 图下方 `1D/1W/1M/3M…ALL` 时间档 tabs → 持仓列表（左 ticker、右两列右对齐数字）。
- 被批评的地方：只有固定时间档，**没有自定义区间**，想做深度分析就撞上"执行鸿沟"。
- 改版把单个模糊的 Trade 按钮拆成 Buy / Sell / Options 三个，并在按钮里实时显示 bid/ask——**CTA 里带数据**是个好做法。

**surfaced**：总值、当日 delta、走势线、持仓前几行。
**hidden**：历史成交/账本/税务报表在账户深处；深度分析在点进标的之后。

**css_only**
- "数字下面紧跟 delta"可以照抄：`[data-skin='x'] .start__meta{margin-top:4px}` 把 `今日 N 词 / 已学 N 词` 两行压成 hero 数字下面的一条 delta 带（13~14px、tabular、`gap:var(--space-4)`）。
- "图先于一切"在词笺没有图，但有**分数**：`.today-card__figure:nth-child(2) b` 的文本形如 `3/8`（已做/到期）。这就是唯一可用的真实比例。纯 CSS 能做的比例可视化：
  - 用 `8` 个刻度块（`repeating-linear-gradient(90deg,var(--scale) 0 1px,transparent 1px calc(100%/8))`，参考 instrument 已有的 `--ruler-step` 写法）当"格子尺"；
  - 填充宽度**无法**由 `3/8` 算出来（无 JS、无 attr() 计算），只能靠状态类分档：`b.is-accent` / 无类 / `b.is-warn` 对应 0/1/2 档 `clip-path: inset(0 calc(100% - var(--w)) 0 0)`，`--w` 在 `:has()` 规则里写死。
- 数字一律 `font-variant-numeric: tabular-nums`；字体族只有 2 个名额时，**选 IBM Plex Mono 当 hero 数字**（天生等宽、零对齐问题），Instrument Serif/Newsreader 做正文。

### 4. Copilot Money（Dashboard = 默认首页 tab）

**structure** —— 本次最有用的一份，官方帮助文档逐节写明：
1. **Dashboard Graph（顶部 hero）**：月度支出进度图。图上最大字是 **`Free to Spend`**（"还剩 $1,380 可花"）——**hero 是派生数，不是原始余额**。图里两条线：虚线=理想节奏，实线=实际；线末端一个点=今天的位置；**线色随"今天该花到哪"的百分比变化**（超/欠节奏）。房租这类月初大额账单不计入（可归到 Recurrings 去毛刺）。
2. **To Review**：未核对的新流水队列，`view all >` 跳 Transactions tab。
3. **Budgets**：趋势品类快照，`Categories >`。
4. **Upcoming**：未来扣款，**横向滚动列表**，`Recurrings >`。
5. **Net This Month**：本月收支 vs 上月同期，`Cash Flow >`。
6. **Free Months**：推荐进度。
- 每条 section 都自带一个"Xxx >"文字锚：首页只做摘要，**绝不重复详情页**。
- tab 顺序可在 Settings → Appearance → App sections 拖拽（又是"布局即功能"）。
- Accounts tab 则是另一套骨架：顶部净资产图（可切时间档、按住取点）+ 按账户类型分组的列表。

**surfaced**：还剩多少可花、待核对队列、未来扣款、月度收支对比。
**hidden**：完整流水、品类明细、全部订阅、历史净资产——各自成 tab。

**css_only**
- **hero 必须是派生数**这条，对词笺的直接翻译：别把"已学 128 词"（存量）当 hero，该把"**今天还剩几个没做**"（= `3/8` 里的 8-3，可惜 DOM 没算这个差值）或"今日配额还剩几批"当 hero。DOM 里现成的派生表达只有 `.today-card__figure` 的 `done/total` 和 `.today-card__tag`（↑ +5 之类的奖惩标签）。
- "每 section 一个 > 锚"：词笺的 `>` 锚只有 `.today-card__links` 的两个文字链，可用 `order` 把它们**搬到各自数据块旁边**：`.start__body{display:contents}` 后，`.today-card__head` 与 `.today-card__figures` 拆成独立 grid 子项，把 links 绝对定位到 figures 块右下角，形成"数字块自带跳转锚"的读账感。
- 把 `Upcoming` 的横滑搬过来：`.start__spec{display:flex;flex-direction:row;overflow-x:auto;scroll-snap-type:x proximity}` + `.start__spec-row{flex:0 0 auto;min-width:56%;display:flex;flex-direction:column;gap:2px;padding:10px var(--space-3);border-right:1px solid var(--border)}` —— 工单表 4 行**变横滑工单带**。360 下 56%（≈190px）能露出下一张的边，`min-height:44px` 保住点击/触摸目标。

### 5. Moneytree

**structure**
- 主页不是"图"，是**左右滑动三个面板**：ポイント / 口座残高 / 支出（余额表是默认落地页）。三屏三种口径，而不是三块竖堆。
- Insights tab（2026 秋改版）＝按主题分组的卡片+图 dashboard（支出/资产/退職；月次レポート、光熱費、サブスク属付费 Grow）；每张卡点下去才进详情。
- **时间粒度藏在详情层**：首页各 section 不能切週/月/年，详情页才能切，还能左右箭头翻期并显示"环比 ±%"。这是把"时间切片"当层级边界用。
- 首页「支出」屏只放 4 件事：本月支出柱状 / 支出最多的品类及占比 / 最大一笔支出及占比 / **异常消费——只在真的发现异常时才出现那张卡**。
- 免费用户只看 12 个月：时间范围同时也是权限边界。

**surfaced**：余额表、本月支出、Top 品类、最大一笔、异常。
**hidden**：週/月/年切换、环比、明细、分类构成——全部在"点卡片之后"。

**css_only**
- "只在有事时才出现的卡"是词笺最该抄的密度策略，且有现成状态类：
  `[data-skin='x'] .start:not(:has(.today-card b.is-warn)) .today-card__figure:nth-child(3){display:none}`（无逾期 → 逾期那一格整块不占位），同理 `:has(.today-card__tag)` 控制奖惩标签的可见性。**这比"四个数字永远排成一行"更像记账 App。**
- 三分屏做不了（无 JS），但可做"三档指示器"的错觉：把 `.readouts` 的三个 `.readout__k` 当作 tab 标签（"今日/批数/已学"），点亮其一：`[data-skin='x'] .app:has(.start) .readout:nth-child(1){border-bottom:2px solid var(--accent)}`。诚实的结论是：**它只是视觉暗示，没有真实切换功能，不能拿它当导航用**（WCAG 可操作性 & 语义都会打回）。
- 全屏横向 bleed：`.today-card{margin-inline:calc(var(--page-x) * -1);padding-inline:var(--page-x)}` 可以做出"卡片撑到屏幕两边、内部仍有 20px 安全边距"的 Moneytree 感；`.app__main{overflow-x:hidden}` 保证 360 不产生横向溢出。

### 6. 支付宝

**structure（经典版）**
- 自上而下：搜索/状态栏 → **高频支付入口（扫一扫/收付款/卡包，位置永不弱化）** → 宫格（12~20，可翻页）→ "常用"板块（按行为重排）→ Banner/互动位 → 内容与服务楼层 → 底部导航。
- 三层分类逻辑叠加：**语义**（业务属性）、**心智**（"我常用什么"优先于"它是什么"）、**商业**（理财/保险按营收靠前）。所谓超级 App 的"第三层 IA"。
- 核心金字塔：高频任务（支付/收钱/转账）要"触达路径最短、位置永不弱化、点击成本最低"；中频民生用"宫格+分类"承接高密度强识别；长尾统一进小程序中心/百宝箱/更多。

**structure（AI 版「阿宝」，2026-06 内测）**
- **首页只剩两页**：右滑进入，左=对话框，右=「资产」总览。九宫格、推荐位、生活频道、蚂蚁森林入口全删。
- 反直觉的克制：高频动作**不交给对话**——底部仍保留扫一扫/收付款/出行/理财四个快捷键（便利店扫码时，效率比对话快）。
- 涉及资金变动的关键动作，AI 不靠近，必须跳回本人确认页。
- 代价：界面越简，深层功能越隐（重度理财/复杂业务办理暂时不适合）。

**surfaced**：高频动作入口、宫格服务、（AI 版）对话 + 一页资产总览。
**hidden**：长尾服务、上万个小程序入口、资产明细（在另一页）。

**css_only**
- 真正能抄的是**"动作与数据分屏"**这个 IA 决定，而不是对话。词笺版：`.start__actions{position:sticky;bottom:0;z-index:15}` 让动作永远停在最易触达处，数据随滚动离开首屏；`.readouts` 作为外壳常驻带，天然就是"另一层的总览"。
- 落地细节：sticky 底栏要 `padding-bottom:calc(var(--space-3) + env(safe-area-inset-bottom))`，并给 `.screen` 增加等高的 `padding-bottom`，否则最后一个数字会被压在栏下。
- "把九宫格砍光"的对应用法：`[data-skin='x'] .start__spec,[data-skin='x'] .start__meta,[data-skin='x'] .start__eyebrow{display:none}` —— 但**必须逐条确认被隐藏的东西有第二入口**（见第四节核对表），支付宝砍九宫格时留了四个快捷键，就是这个道理。

### 7. 招商银行 / 国内手机银行

**structure**
- 首页五段式（四大行趋同）：**搜索/状态栏 → 金刚区 → 常用功能区 → Banner/运营位 → 服务模块（楼层）**。金刚区锚定最高频入口，常用区支持个性化/自定义。
- 金刚区两派：只放账户/转账/支付（工农中）；核心 + 一个主推产品（建行/邮储放贷款，招行放余额理财"朝朝宝"）——**金刚区第 11 格是战略位**。
- 招行 = "一屏 9+1"：一屏能摆下 10 个高频入口，第 11 个是"更多"。**"一屏几件事"是被算过的密度指标。**
- 反例：平安、交行干脆**取消金刚区**，把头部整块给运营轮播（"轻功能重运营"）；交通银行金融页改叫"收益中心"，顶部用 tab 分品类（存款/理财/基金/保险/黄金）。
- 财富页四段：顶部资产概览（总资产 + 收益）→ 品类功能 → 营销 Banner → 产品列表（"四笔钱"资产配置）。资产概览用半透明毛玻璃做成整页视觉重心。
- 工行：首页核心运营位做成**可放大/收起的滑动卡片**——选中展全景，收起只留精简信息，"最大程度利用屏效"；金融楼层固定 4 张卡（投资理财/普惠精选/外汇专区/特色服务），另有消息专区与资讯楼层。

**surfaced**：入口密度（金刚区 + 楼层），资产数字放在"财富页"而不是首页。
**hidden**：每个楼层/品类点进去才有明细；产品详情、账单、分析各自成页。

**css_only**
- "收起态/展开态两档信息量"在纯 CSS 里只能靠滚动驱动动画（`animation-timeline: view()`，Chrome 115+ / Safari 26 支持，WebGL 无关，但**必须能在不支持时静态退化为收起态**）。可作为锦上添花，不能作为骨架依赖。
- 更稳的替代：**用 `:has()` 做"状态换骨"**——词笺首页有两组现成状态类（`b.is-warn` / `b.is-accent`、`.today-card__reason.is-*`），可以让"有逾期"与"无逾期"是两套版面（逾期时 today-card 上提为第一块、CTA 缩短；无逾期时 today-card 退为脚注一行）。这是国内手机银行"楼层按状态重排"的 CSS 版。
- 毛玻璃 hero（招行财富页）能借用，但注意词笺的 `--surface` 令牌与 `.app{overflow:hidden}`：给 hero 层 `backdrop-filter: blur(12px)` + `background:color-mix(...)`；**代价是给祖先加 filter 会把它变成 fixed 后代的包含块**——若皮肤同时用 `position:fixed` 层，必须避免把 filter 放在 `.app/.app__main/.screen` 上（抽查过 app.css：这四个类目前都没有 transform/filter，`backdrop-filter` 只在 `.dock`/`.answer-dock` 上，安全）。

---

## 三、四类财务口径 —— 本次调研最有价值的一条方法论

来源是中文设计工作室的财务看板规范（JVDS），它对"看板为什么读不懂"给出的诊断极其适用词笺：**所有卡片都套同一种底色、同一种青绿大数字、同一种环形图，用户就读不出这个 4,280 是"存量"还是"本月流量"。** 四类数据的区分法则：

| 口径 | 典型指标 | 必须交代的上下文 | 该配的组件形态 |
|---|---|---|---|
| 时点存量 Stock | 账户余额、当前净资产 | 更新时间戳（截至今日 14:30）+ 环比涨跌胶囊 | 大字号主数字 + 类别**堆叠横条** |
| 期间流量 Flow | 本月累计收入、近 30 天支出 | 时间周期选择器 + 上月同期对比 | **双柱/面积折线**，流入流出不一样色相或正负号 |
| 定额进度 Quota | 月度预算使用率 | `已用/额度`（¥6,400/¥10,000）+ 剩余天数 | 带警戒阈值的**线性进度条**（>85% 转橙，超支转红） |
| 周期承诺 Recurring | 待扣款订阅、分期 | 下一次扣款日期（3 天后）+ 频率 | 日历时间轴 / **按到期日排序的紧凑列表** |
| 反面规则 | — | — | **不要用同一种环形图同时表达"构成比""健康度得分""预算消耗"**；构成比交给堆叠条、进度交给水平条、趋势交给折线 |

映射到词笺首页现有数字：

| 词笺数字 | 口径 | 应有的形态 | 现在（paper/bento）的问题 |
|---|---|---|---|
| 已学 128 / 总词量 1200 | Stock 存量 | 大数字 + 堆叠条（已学 vs 剩余） | 和"今日新词"排成一模一样的一行 |
| 今日新词 5（配额） | Quota 定额 | 带阈值的线性进度 + "还剩几批" | 同上，且没有"额度"感 |
| 到期复习 3/8 | Quota/Recurring | 分数 + 刻度尺（按到期日排序的队列感） | 同上 |
| 逾期 4 | Recurring（已违约） | 按到期日排序的紧凑列表 + **红**（唯一合法红） | 同上，被压成一个数字 |
| 连续优秀 6 | Flow/习惯 | 一行 delta，不是独立卡片 | 与配额同权重 |
| 「一页五个词」标语 + 玩法段 | 无（说明文） | **用户已要求从首页删掉** | — |

**骨架级结论：词笺首页现在的毛病不是颜色，是"7 个数字用同一种形态并排出现"**——这正是 Copilot 用"每 section 不同组件形态"、JVDS 用"四类四形态"专门治的病。新皮肤让 5 个数字**长得不一样**（一个大字 / 一个分数带刻度 / 一个横条 / 一行脚注 / 一个只在有事时出现的红块），就已经是结构差异，而不是换色。

另一条同源经验（FinyxFin「Today」）：**hero 用派生数，原始总数降级成右上角小字**——"Safe to spend"当第一屏，"total balance"是一个小链接；"This week"是 7 天窄条 + 需要处理的事（逾期、即将到期、已到期），`Show all` **原地展开**剩下的月份；"Momentum（连续）"默认**只有一行**，点了才给整卡。这就是"今天/本周时间切片"最清晰的骨架表述。

---

## 四、词笺首页 DOM 的硬事实（写皮肤前必须知道的）

从 `src/components/StudyScreen.tsx`、`src/components/TodayCard.tsx`、`src/styles/app.css`、`src/styles/skin-hooks.css` 核对：

1. **外壳结构**：`.app`（flex column，`height:100dvh; overflow:hidden`）里依次是 `header.topbar`（sticky，z-index 20，min-height 56，含 safe-area-inset-top）、`.readouts`、`main.app__main`（`flex:1; overflow-y:auto`——**唯一的滚动容器**）。
   ⇒ `.readouts` 天生是**不随内容滚动的常驻带**（当状态条用），但会永久吃掉约 34px 高；`.start{min-height}` 必须扣 `顶栏 + 读数条 + env(safe-area-inset-top)` 的实测总高（bento 注释：94px），否则出幽灵滚动。
2. **`.readouts` 是 `aria-hidden="true"`**：屏幕阅读器读不到它。任何"把首页数据只放进读数带"的方案都会让 AT 用户拿到零信息——**必须至少保留一行非 hidden 的等价文本**（`.start__spec-v` 或 `.today-card__figure`）。
3. `skin-hooks.css` 默认把 `.topbar__meta`、`.readouts`、`.start__spec`、`.start__kicker`、`.start__masthead` **全部 `display:none`**；皮肤按令牌开启。
4. **可用状态类（`:has()` 的原料，全部来自 DOM 已有 class）**：`.today-card__figure b.is-warn`（逾期>0 / 配额被闸）、`b.is-accent`（配额有奖励）、`.today-card__reason.is-increase|is-decrease|is-paused`、`.today-card__figure .today-card__tag`（↑+5 之类奖惩标签存在与否）、`blocked` 时多出的"计划 N"纯文本 span。
5. **入口重复性核对**（决定"能不能把东西藏掉"）：
   - 错词本：首页 `.today-card__links` 有链，**「我的」页 ProfileScreen 也有一行入口** ⇒ 首页可以隐藏，不断路。
   - 学习日历：首页文字链 + **顶栏 `.icon-btn`** ⇒ 可以隐藏。
   - 换阶段/外观：`.start__foot` 文字链 + 顶栏 `.icon-btn` + 「我的」页 ⇒ 可以隐藏。
   - **唯一不可断的"开始背单词"只有一个：`.btn--primary`** ⇒ 首页绝不许 `display:none` 它（包括 `empty` 分支另有导入按钮，不在此讨论）。
6. **数字格式**：`.readout__v` 是 `padStart` 补零的（`05`/`012`）；`.start__spec-v` 与 `.today-card__figure b` 是未补零的自然数。⇒ **hero 大数字必须取自 spec/figure，不能用 readout**（"05 词"当 96px hero 会变成装饰噪音）；补零读数只适合做 ticker / 仪表条。
7. **同一数字会重复出现**：`今日新词` 同时存在于 `.topbar__meta`、`.readouts`、`.start__meta`、`.start__spec`、`.today-card__figure` 五处。bento 的注释已把这条列为硬规则（"每个数只出现一次"，并提到 Anki 重复计数被回滚）。**新皮肤必须自己消重，这是结构性任务不是装饰性任务。**
8. 宽度令牌：`--page-x:20px`（≥768 时 32px）、`--content-max:640px`、`--app-max:760px`；≥1440 的居中轴用现成写法 `padding-inline: max(var(--page-x), calc((100% - var(--content-max)) / 2))`。任何 `position:fixed` 层必须用同一轴对齐（`left:50%; transform:translateX(-50%); width:min(100%,var(--app-max))`），否则在大屏上飞出内容列。
9. 抽查 `app.css`：`.app / .app__main / .screen / .start` 上**没有** `transform / filter / contain`，所以 `position:fixed` 相对视口可用（写皮肤时再确认自己没在这条链上加 filter/backdrop-filter）。

---

## 五、给词笺首页的 3 个结构方向

三个方向分别踩在四条互不相干的轴上：**焦点物体**、**栏数与阅读轴**、**CTA 在版面里的地位**。共同前提（用户已定）：`.start__title` 与 `.start__lede` 一律 `display:none`，标语和玩法说明彻底离开首页。

### 方向 A｜`balance-sheet` —— 余额即整页（Revolut 10 + Robinhood 单数字）

- **focal**：首屏唯一焦点 = **今日配额的一个超大数字**（取自 `.today-card__figure:nth-child(1) b`，未补零），`font-size:clamp(72px,26vw,132px)`，占首屏约 45–55% 高。数字下面**紧跟一行 delta**（Robinhood 的 day change）：`.today-card__figure:nth-child(2)` 的 `3/8` + `.today-card__tag`，14px、tabular、单行。
- **on_home**：超大配额数 + 一行 delta + 满宽 CTA + 一行"今日 · 11月25日 周二"（`.today-card__label`）。其余全消。
  消重手段：`.readouts`、`.start__meta`、`.start__spec`、`.topbar__meta` 一律 `display:none`——**配额数在整页只出现一次**。
- **moved_away**：`已学/总词量` → 「我的」页统计；`批数` → 复习会话页；`逾期/连续` → 日历页与「我的」页。
  **但**：`.today-card__reason`（"为什么是这个量"）留在首页 hero 之下，最多一行、`display:-webkit-box;line-clamp:2`。理由来自 FinyxFin/Copilot：派生数必须能就地解释，否则用户只能跳页去找原因。
- **cta**：`满宽 60px`，位置在 delta 之下（不是页面底部），`.start__actions{order:0}` + `.today-card` 被 `display:contents` 拆散后 CTA 自然上提；360 上若首屏放不下，退化为 `.start__actions{position:sticky;bottom:0}`。
- **differs**：bento 是"读数条 + 4 个不对称磁贴"（7 个指标同屏）；play/nocturne 是原骨架换色并砍几块；A 的骨架变化在于**把 `.today-card` 这个 section 拆成版面本身**：卡片的 `border/padding/border-radius/background` 全部归零，`figures` 用 `display:contents` 让 4 个 figure 直接成为 `.start` 的 grid 子项，第一个升级成全页 hero、第二三个降级成 delta 行、第四个（连续）按 `:has()` 条件隐藏。**"卡片变成页面"是 DOM 分层的取消，不是颜色调整。**
- 关键 CSS 片段：

```css
[data-skin='balance'] .readouts,[data-skin='balance'] .start__spec,
[data-skin='balance'] .start__meta,[data-skin='balance'] .topbar__meta,
[data-skin='balance'] .start__masthead,[data-skin='balance'] .start__title,
[data-skin='balance'] .start__lede{display:none}
[data-skin='balance'] .today-card{border:0;background:none;padding:0;
  margin:0;display:contents}
[data-skin='balance'] .today-card__figures{display:contents}
[data-skin='balance'] .start{display:grid;grid-auto-rows:min-content;row-gap:var(--space-2);
  align-content:start;min-height:calc(100dvh - 56px - env(safe-area-inset-top,0px))}
[data-skin='balance'] .today-card__figure:first-child{grid-row:1;font-size:clamp(72px,26vw,132px);
  line-height:.86;font-variant-numeric:tabular-nums;letter-spacing:-.03em}
[data-skin='balance'] .start__actions{order:2;margin-top:var(--space-4)}
[data-skin='balance'] .today-card__figure:nth-child(4){display:none}   /* 连续:去日历页 */
```
- 风险：hero 若用 `is-accent`（奖励态）颜色，AA 下 3:1 只在大字成立；`is-warn` 的红色只在"逾期/被闸"时出现，符合"红只用于危险"。

### 方向 B｜`ledger-console` —— 双栏台账 + 常驻底栏（Copilot Accounts + 招行财富页 + 四口径四形态）

- **focal**：不是数字，而是**一张账本**。首屏焦点 = 6 行右列对齐的台账（`.start__spec` 4 行 + `.start__meta` 2 行合并），左列 13px 标签、右列 tabular 数字，**每行按口径换形态**：Stock 行只有数字 + 时间戳小字；Quota 行带水平刻度尺（`repeating-linear-gradient` + `clip-path` 分 3 档）；Recurring 行（逾期）前面钉一个方点节点，像账单时间轴；Flow 行（连续）用一行脚注宽度。
- **on_home**：**密度回到 6–8 行**（与 A 完全反向，也直接反驳"极简=好看"的懒惰解法）：常驻读数带（`.readouts` 三等分、hairline 分隔，当"账户总览条"）+ 台账 6 行 + `.today-card__head` 的两个文字链（搬到台账表头右侧当筛选）+ 底部常驻 CTA。
- **moved_away**：`.today-card__figures`（4 个数字）与两段 `.today-card__reason` 长句 → 首页删除（数字与台账 6 行重复，正是 bento 立的"一个数只出现一次"）；说明句 → 列表页顶部或「我的」页帮助区。
- **cta**：`.start__actions{position:sticky;bottom:0;z-index:15}`，满宽、带 `env(safe-area-inset-bottom)`，像记账 App 的"确认/记一笔"栏——**这是把 CTA 从"段落末尾"提升为"外壳常驻层"，是导航层级的改动**。`.screen` 底部留等高 padding 防遮挡。
- **differs**：三档栏数变化——**≥768 真双栏**（`.start__body{display:contents}` 后把 `.start` 做成 `grid-template-columns: minmax(0,1fr) 300px`，左：表头 + 6 行台账；右：hero 配额数 + 刻度尺 + CTA + 两个文字链），360 退化为"单栏台账 + 常驻底栏"。bento 的磁贴是**无对齐轴**的阵型，B 是**有表头、有行、有右对齐数字列、有合计线**的对账表：阅读轴从"逐块扫视"变成"沿一条竖直基线滑读"。
- 无障碍：`.readouts` 是 aria-hidden ⇒ 台账 6 行（非 hidden）承担全部朗读；刻度尺是纯装饰，必须 `aria-hidden` 无法加 ⇒ 用 `::before` 伪元素画（伪元素本来就不进无障碍树），**不要**用 `content` 塞有意义的新数字以外的内容。

### 方向 C｜`action-sheet` —— 整屏即按钮，首屏零数据（支付宝阿宝 + Monzo 点卡片 + FinyxFin Today）

- **focal**：**没有可读焦点**。首屏就是一个可点的东西：`.start__actions` 撑满 `app__main` 可视区，`.btn--primary` `width:100%;height:100%`，文字居中、22–32px。这是把"首页有内容"这一前提作废。
- **on_home**：只剩四角各一条 ≤14px 小字，全部用绝对定位钉在这个动作面上：
  左上 `.today-card__label`（今日日期 = 时间切片锚）、右上 1 个 `.readout`（连续天数，接受补零）、左下 `.start__foot`（"进度只存在这台设备" + 换阶段）、右下 `.start__kicker`（阶段 · DAILY LIST）。
- **moved_away**：所有数值明细整体搬家——`已学/总词量/阶段` → 「我的」页；`今日新词/批数` → 复习会话页首屏；`到期/逾期` → 日历页（那里本来就是时间轴）。依据已核对：**错词本、学习日历、外观、阶段在「我的」页与顶栏都有第二入口**，隐藏不断路（这正是支付宝敢砍九宫格的前提：高频动作留在原地）。
- **cta**：
```css
[data-skin='action'] .start__actions{position:fixed;left:50%;transform:translateX(-50%);
  top:calc(56px + env(safe-area-inset-top,0px));bottom:0;z-index:15;
  width:min(100%,var(--app-max))}
[data-skin='action'] .start__actions .btn--primary{width:100%;height:100%;border-radius:0;
  font-size:clamp(22px,6vw,32px);justify-content:center}
[data-skin='action'] .topbar{position:sticky;z-index:20;background:var(--bg)}  /* 顶栏必须浮在动作层之上 */
```
  按下态用 `transform:scale(.995)` + 背景加深，**不要用 translateY**（会露出底下空层）。
- **differs**：现有 7 套（含 bento/play/nocturne）全都是"报头/说明/数据块/按钮"的纵向文章骨架，差别只在删了几块、按钮多厚。C 把 `.start__body` 拆成 `display:contents` 后**只让 CTA 存活并升格为版面本身**，其余子项 `display:none`；首屏信息量趋近 0，导航完全靠顶栏 4 个目标。这是"做对了减法"的极端检验：**如果去掉数字后用户仍然知道下一步按哪里，首页的数字本来就多是噪音。**
- 风险（必须实测）：① 大面积 fixed 层会盖住 `.app__main` 的滚动——若还留有可滚内容就会不可达，C 方案要求首屏之下真的没有内容；② 隐藏元素必须用 `display:none` 而非 clip/sr-only，否则朗读顺序里出现大片空白；③ 整屏按钮 + 44px 目标重叠，需保证顶栏与两个文字链的点击不被吞。

### 三个方向与"换色"的分界线

|  | A balance-sheet | B ledger-console | C action-sheet |
|---|---|---|---|
| 焦点物体 | 一个派生大数字 | 一张右对齐的账本 | 一整块动作面 |
| 首屏数据量 | 1 数 + 1 delta | 6–8 行读数 | 0（四角小字） |
| 栏数（768+） | 1 | 2（左账右动作） | 1（全屏） |
| CTA 地位 | 数字之下第一块 | sticky 常驻底栏 | 就是页面本身 |
| 导航 | 顶栏 | 顶栏 + 表头文字链 | 只靠顶栏 |
| 领域出处 | Revolut 10 / Robinhood | Copilot / 招行财富页 / JVDS 四口径 | 支付宝阿宝 / Monzo / FinyxFin |

判废标准（写进皮肤验收）：**如果把新皮肤的 CSS 里的颜色、圆角、字体族全部还原成 bento 的令牌，版面读起来仍然与 bento 不同，才算结构差异；如果还原后就是"bento 换了个数字大小"，作废。**

---

## 六、可复用技法速查（词笺 DOM 专用）

1. `display:contents` 是最强的结构武器：`.start__body{display:contents}` 把 7 个子项直接交给 `.start`；`.today-card{display:contents}` 与 `.today-card__figures{display:contents}` 能把"卡片"这个概念从版面上抹掉。代价：父元素背景/边框消失，`.today-card` 一旦 `display:contents` 就不能再有卡片外观。
2. `grid-template-areas` + 给子项命名 `grid-area` 是唯一能做真 2D 重排的手段（比 `order` 强，可跨行跨列）；配合 `display:contents` 才能给 `.today-card__figure` 这种孙元素分配区域。
3. 横滑带（ticker）永远优于换行：`overflow-x:auto; scroll-snap-type:x mandatory; scrollbar-width:none` + 每卡 `flex:0 0 44~56%`（露出下一张当提示）+ `padding-inline:var(--page-x)` + 外层 `.app__main{overflow-x:hidden}` 已保证 360 零横向溢出。
4. "进度"在词笺只能分档不能算比例（无 JS、`attr()` 不参与计算）：把 `--w` 写在 `:has()` 规则里，用 `clip-path:inset(0 calc(100% - var(--w)) 0 0)` 或 `background:linear-gradient(90deg,var(--accent) 0 var(--w),transparent 0)`。
5. 装饰与标签一律走伪元素：既免 DOM，又天然不进无障碍树；`counter-increment` + `content: counter(...)` 能给台账行造行号/给 figure 造序号。
6. 常驻层只有两类安全位置：外壳带（`.readouts`，不滚）与 `.app__main` 内 `position:sticky`（bottom:0 最有用）。`position:fixed` 必须自己复刻居中轴与 safe-area。
7. `.readout__v` 补零、`.today-card__figure b` 不补零 —— 按用途选来源，别混。
8. 语义色规则要**逐档写两遍**（浅/深各一套），并且把"红"限死给 `b.is-warn` 的逾期/被闸；进度超前（西方 App 会标红的那一类）在词笺必须用琥珀或强调色，不用红。

---

## 七、待办 / 下一步

- [ ] 三方向先做 360×844 的纯 CSS 纸面推演（A 最容易，B 的 ≥768 双栏与 sticky 底栏最容易出幽灵滚动，C 必须先实测 fixed 层的可点性）。
- [ ] 落地前逐条核对第四节第 5 点的入口重复性（改动 DOM 之外的任何皮肤都不许造成"某功能只剩一个入口且它被隐藏"）。
- [ ] B 方向的"四口径四形态"若被采纳，建议同步写进 `DESIGN_TOKENS.md`（刻度尺 `--w` 三档、tabular 规则、hero 数字字号阶梯）。
- [ ] C 方向需要一个"首屏之下无内容"的验收截图：若 `.app__main` 仍可滚动，则 fixed 层与滚动内容冲突，退回 B 的 sticky 方案。

---

## 八、来源清单

Revolut
- https://www.revolut.com/blog/post/revolut-10/ （Revolut 10 官方：更简的首页、点一下就切账户/币种、可定制背景/widget/主题/导航）
- https://www.revolut.com/ja-JP/blog/post/rev10-introduction/ （Revolut 10 首页各图标与快操作清单、下滑添加 widget、出金/ATM 已提额度）
- https://www.revolut.com/blog/post/simplified-app-infinite-possibilities/ （8.0：核心产品 pin 到首页顶部，其余进 Hub 一屏分组）
- https://www.revolut.com/blog/post/introducing-revolut-7-0/ （7.0：Home/Wealth/Payments 三 tab，登录后首页即列所有账户）
- https://www.presse-citron.net/revolut-fait-peau-neuve-les-plus-grosses-nouveautes-qui-debarquent/ （底部导航由 3 键扩为 5 键：新增 Invest/Crypto/Lifestyle）
- https://madebyfelix.com/work/revolut/ （Revolut 零售银行设计师：首页与账户页的定制/导航流程、widget 框架）
- https://web.reeddaily.com/post/635005 「一个大数字：金融科技公司如何围绕你的余额重建主屏幕」（余额中心化极简；T-Bank/Sber 跟进；引 NN/g 提醒过度极简导致密度过低、可发现性变差）

Monzo
- https://monzo.com/blog/the-new-and-improved-home-screen （新首页：汇总所有账户活动、可选洞察、spotlight 卡、头像→Edit layout 排序/隐藏 Accounts/Pots/Savings Pots）
- https://monzo.com/blog/2023-08-01/see-into-the-future-of-monzo （Labs 灰度新首页布局）
- https://community.monzo.com/t/app-evolution-new-look-monzo-app-feedback-megathread/141702 （产品设计师原话：section 可从 Layout 屏与各 section 菜单编辑、将来可整体排序）
- https://community.monzo.com/t/get-to-know-your-new-home-screen/151912 （用户对新首页的反应）
- https://community.monzo.com/t/app-evolution-feedback-megathread/141702/1197 （"旧首页零点击见流水 / 新首页要点卡片或下滑"、Pots 可隐藏）
- https://community.monzo.com/t/jars-in-activity-usa-vs-uk-app/181630/9 （pot/jar 流水默认隐藏，"all activity" 才全）

Robinhood
- https://code.jiangshu.ai/awesome-design-html/assets/ios/design.robinhood-ios.html （第三方 iOS 拆解：Portfolio 屏 32pt tabular 总值 → day change → 约 140pt 撑满边缘折线图 → 1D…ALL 时间档 tabs → 持仓右对齐列；"图先占约 40% 视口"。非官方，数值当量级参考）
- https://ixd.prattsi.org/2025/02/design-critique-robinhood-ios-app/ （Pratt IXD 评析：Trade 拆成 Buy/Sell/Options 并在按钮内实时显示 bid/ask；只有固定时间档、无自定义区间造成执行鸿沟）
- https://robinhood.com/us/en/support/articles/ios-widgets/ （widget：Portfolio 总值 / Holdings、Lists 预览——"首页只放总值"的延伸证据）
- https://robinhood.com/us/en/support/articles/watchlist-and-cards/ （Lists/watchlist 独立成区）
- https://blog.klutter.ai/robinhood-net-worth-track-wealth-guide/ （点进 portfolio 才看资产类型配置、单只涨跌、总盈亏）

Copilot Money
- https://help.copilot.money/en/articles/6045480-dashboard-tab-overview （Dashboard 六段：Free to Spend 图上 hero + 虚线理想节奏/实线实际/线末端点、To Review、Budgets、Upcoming 横向滚动、Net This Month、Free Months；每段自带 "Xxx >"；tab 顺序可在设置拖拽）
- https://help.copilot.money/en/articles/6213732-accounts-tab-overview （Accounts tab：顶部净资产图 + 时间档 + 按账户类型分组列表）
- https://help.copilot.money/en/articles/9682232-cash-flow-tab-overview / .../9504513-categories-tab-overview / .../9554412-transactions-tab-overview / .../9778259-recurrings-tab-overview （明细各自成 tab）
- https://www.copilot.money/ （"Follow the line：一天从支出线、待退款项、即将扣款开始"、"All your money, one screen"）

Moneytree
- https://help.getmoneytree.com/en/articles/17765252-moneytree-insights-tab-frequently-asked-questions-faq （Insights＝按主题分组的卡片+图 dashboard；点卡进详情；首页 section 不能切时间单位，详情页可切 週/月/年 + 前后期间 + 环比 %；首页「支出」只 4 项，异常消费只在异常时出现）
- https://help.getmoneytree.com/ja/articles/10278390 （主画面为「口座残高」，左右滑动切换 ポイント/口座残高/支出 三面板）
- https://getmoneytree.com/jp-blogs/insight-tab-1 （改版说明：从列表式换成主题卡片/图 dashboard；点柱状或品类可强调数值）
- https://release.nikkei.co.jp/attach_file/0474261_01.pdf （Moneytree 引擎与信用卡支付日日历视图）

支付宝
- https://www.uweb.net.cn/zhishiku/jianzhanliuchengyugongju/32658.html 「支付宝首页 IA 全解析」 （六个演变阶段：工具型→支付中心（顶部四大入口）→服务开放→12~20 宫格→大中台→智能化个性化；核心金字塔 高频/中频/长尾；语义+心智+商业三套分类逻辑；高频入口位置永不弱化）
- http://mp.weixin.qq.com/s?__biz=MzYzNDg5NDE4MQ==&mid=2247484629&idx=2&sn=655afc8102bc4055837c95f626a88443 「支付宝二十年来最大一次升级：首页只剩两个页面」（阿宝：左对话 / 右资产；底部仍留扫一扫/收付款/出行/理财）
- http://mp.weixin.qq.com/s?__biz=MzAxNzAwMjIxNg==&mid=2247487663&idx=3&sn=3a01d084c3d801ab7283b8bffe88ce01 「支付宝砍掉金刚区」（旧版首页塞满金刚区/推荐位/生活频道/花呗账单/余额宝收益；新版删至"对话 + 独立资产页"；资金变动必须本人确认）
- http://mp.weixin.qq.com/s?__biz=MzE5ODE1ODg1Ng==&mid=2247483711&idx=1&sn=2e0f53f02e538d26a34a749f2a0d62a3 「支付宝：一个10亿用户App的AI式自杀与重生」（宝计划立项、右滑切版、上万个服务压进对话框）

招商银行 / 国内手机银行
- https://mp.weixin.qq.com/s?__biz=Mzg5NzY5NjMzOA==&mid=2247495774&idx=1&sn=385891e353d5417e07c5ad5b9d76ff17 「AI 如何提高手机银行用户体验感知度」（四行首页同构：搜索/状态栏+金刚区+常用功能区+Banner/运营位+服务模块；招行"一屏 9+1"；工行首页核心运营位为可放大/收起滑动卡片；财富页四段"顶部资产概览+常用功能区+营销Banner+产品推荐与列表"，总资产与收益为核心锚点；交行金融页以顶部 tab 分品类、突出"收益中心"）
- http://mp.weixin.qq.com/s?__biz=MjM5MTI4OTQ3Ng==&mid=2649584237&idx=1&sn=c574459420e73b0f5090f92231a7e2b8 「手机银行首页签布局及运营方式」（金刚区两派：核心功能 vs 核心+1 主推；招行主推朝朝宝；平安/交行取消金刚区改"轻功能重运营"；楼层制）
- http://mp.weixin.qq.com/s?__biz=MjM5MTI4OTQ3Ng==&mid=2649592123&idx=2&sn=0d167800f671390c790d80e87c21d261 「从手机银行界面设计和运营内容看招商银行」（财富页资产收益板块用半透明毛玻璃做成整页视觉重心）
- http://szjj.china.com.cn/2026-01/15/content_43334855.html （工行首页升级：金刚区/宫格区按角色差异化、金融楼层 4 卡、首页首屏露出重点金融服务）

方法论 / 横向
- https://jiedastudio.com/share/ui-design/personal-finance-dashboard-context-u132 「个人财务看板设计：青绿卡片里的不同口径」（Stock/Flow/Quota/Recurring 四口径四形态；禁止用同一种环形图同时表达构成比/得分/消耗进度）
- https://finyxfin.app/help/today-help （Today 自上而下：Safe to spend 为 hero、总余额降级为右上角小字；Month pace 小图+"under pace/ahead"；This week 7 天窄条 + 逾期与即将到期 + Show all 原地展开；To review 队列；Momentum 默认一行；Suggestions/Moments 有事才出现；Customize Today 可排序/隐藏 section，保留 Classic 回退）
- https://blog.gitcode.com/9b97e3cd5c3bbd990a684ad3425bf9f0.html （财务面板的 section builder：没有数据的 section 从列表里剔除，不占位、不给"暂无数据"卡）
- https://help.emma-app.com/en/category/analytics-155lckn/ （Emma：Feed 为主屏，Analytics 藏在 Feed 下滑后的入口——"摘要在主屏、图在二级"的另一种解）
- https://help.bunq.com/es-es/articles/introducing-v5-your-new-bunq-app-experience （bunq V5：Home tab 顶部 Net Wealth 磁贴点开即品类支出与环比）

---
*领域笔记，可独立阅读。代码事实部分核对自 `src/components/StudyScreen.tsx`、`src/components/TodayCard.tsx`、`src/components/ProfileScreen.tsx`、`src/styles/app.css`、`src/styles/skin-hooks.css`、`src/styles/tokens.css` 与现有 7 套皮肤。*
