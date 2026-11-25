# v10 规约 · 五界面全站精修 + 现有四套首页重排（2026-11-25）

用户选定 **A=bento 磁贴 / C=nocturne 夜航 / D=desk 案头 / F=vinyl 唱盘** 四套继续做全站；
**E=deck 叠章作废**（已摘注册，CSS 存档 `docs/v8-variants/deck.v1.css`）。
另外批准：现有四套（paper / foundry / instrument / broadsheet）首页那句功能介绍**一起删**，删完**重排**。

## 0. 已经改掉的共享事实（不要再依赖）

- `.start__title`（「一页五个词，看一遍就会。」）与 `.start__lede`（那段玩法说明）**已从 DOM 真删**：
  `src/components/StudyScreen.tsx` 里两个节点不见，`app.css` 里两条规则已移除，`chineseCount` 导入随之删掉。
  → 任何皮肤不得再写 `.start__title` / `.start__lede`（现在是死选择器，请顺手删掉），也不得用伪元素把这句话以任何形式补回来。
- 首页现存结构（顺序即 DOM 顺序）：
  `.start` > `.start__masthead`(`__brand`「词笺」/`__rule`/`__meta` 日期) · `.start__kicker`(`阶段短名 · DAILY LIST`) ·
  `.start__body`[`.start__eyebrow`(`阶段名 · N 词`) / `.start__meta`(今日 N 词 · 已学 N 词) / `.start__spec`(4 行 `__spec-row`>`__spec-k`+`__spec-v`：阶段/今日新词/今日批次/已学) / `.start__actions`(主按钮) / 今日卡] ·
  `.start__foot`(「进度只存在这台设备」/`__rule`/「换个阶段」)。
  外壳：`.topbar`（brand + 2×`.icon-btn` + `.avatar-btn`）、`.readouts`（今日/批数/已学）、`main.app__main > .screen`。
- 今日卡：`.today-card` > `__head`(`__label` + `__links`：错词本 N（仅 >0 时）/学习日历) · `__figures` 4×`__figure`(`b` + 新词/到期复习/逾期/连续优秀) · `__reason` 1–2 句。
- **首页独享数据**（谁藏谁负责）：`todayBatchCount`（今日批次）、`pendingReviews` 所在承诺句、以及「先复习后新词」语义。删了 DOM 介绍句之后，「今日批次」只剩 `.start__spec` 第 3 行这一处宿主。

## 1. 共享硬约束（违反 = 直接退回）

1. 只改**分派给你的那一个文件**；`app.css` / `tokens.css` / `skin-hooks.css` / 任何 `.tsx` / 别人的皮肤文件一律不碰（paper 档例外，见 §4）。
2. 每条规则都要 `[data-skin='你的key']` 前缀；**禁止 `!important`、禁止裸 `:root`、禁止改基线选择器的全局行为**。
3. 度量前缀各自唯一（`--bk-` / `--nc-` / `--ds-` / `--vy-`），颜色一律走令牌或自己前缀的变量。
4. 语义色两档各写一遍：`--bg/--surface/--text*/--border*/--accent/--on-accent/--success/--warning/--danger`。**红只用于逾期 / 错词 / 危险**，不当强调色用。
5. 硬指标：正文对比 ≥4.5:1（≥24px 或 ≥18.66px+700 可 3:1）；触控目标 ≥44×44；360 宽零横向溢出；中文正文 ≥14px（>4 个汉字小于 13px 记 FAIL）；≤2 字族；≤1 强调色；阴影 ≤3 档；禁 `filter:invert()`。
6. 自托管字体只有：Newsreader、Space Grotesk、IBM Plex Mono、IBM Plex Sans、Instrument Serif。**不引网络字体、不引图片、不加 SVG 资源**。
7. **伪元素 `content` 只允许拉丁字母 / 数字 / 符号**（`01`、`›`、`▶`、`DAILY`），禁止新造中文文案，禁止复述页面已有文字。
8. **静态装饰不得伪装进度**：没有真数据就不许画假刻度、假填充、假时间戳、假环形进度。
9. v9 学到的结构教训（本轮同样适用）：
   - `position:absolute` **不能锚兄弟**，只认祖先——需要叠放就用同一网格/同一 flex 容器 + `display:contents` 拆壳。
   - `scroll-snap-type` 会滚掉 `padding-inline-start`，必须同时写 `scroll-padding-inline-start/-end`。
   - 网格叠放要**同时钉 `grid-row` 和 `grid-column`**，只钉行会开出隐式列把主体挤窄。
   - `skin-hooks.css` 默认关掉 `.topbar__meta/.readouts/.start__spec/.start__kicker/.start__masthead`；要恢复**必须显式写 `display`**，漏一次=数据整块消失（且没人会报错）。
   - **底色画在真元素上**，别画在 `::before` 上——审计读祖先背景链读不到伪元素，会误报对比度，而且真元素更稳。
   - `display:contents` 会丢掉被拆壳元素的 `aria-label`，需要可见补偿或改宿主元素。
10. 不许「换色」：本轮判据是**结构动作**（网格拓扑 / 主轴方向 / 容器是否成卡 / 底部常驻条 / 刻度与遮挡），每屏要能一句话说出「这一屏的结构和别的皮肤差在哪」。

## 2. 五个界面（本轮主战场）

组件源码都在 `src/components/`，**动手前先读源码拿准类名**，不要照抄本文的清单：

| 界面 | 文件 | 关键类族 |
|---|---|---|
| ① 学习流 | `SessionScreen.tsx`(575) + `ControlDock.tsx` + `WordRow.tsx` + `Hint.tsx` | `.session` `.study-bar__title/-total/-sub` `.study-progress`+`__bar` `.word-list` `.word-row__*` `.answer-dock`(`--review`/`--immediate`) `.answer-btn`(`--known/--fuzzy/--unknown`) `.flash-card__*` `.meaning*` `.session-done*` `.session-toast` `.topbar--bordered` |
| ② 学习日历 | `CalendarScreen.tsx`(250) | `.cal` `.cal-kicker` `.cal-title*` `.cal-hero*`(`__actions`/`__lede`/`__reason`) `.cal-figures`+`.cal-figure` `.cal-batch*` `.cal-days`+`.cal-day__*`(`__badge*`/`__batches`/`__date`/`__weekday`/`__head`/`__load`/`__empty`/`__reason`) `.cal-load__*` `.cal-long__*` `.cal-note*` `.cal-section*` `.cal-foot` |
| ③ 错词本 | `MistakesScreen.tsx`(229) | `.mistakes` `__list` `-empty*` `.mistake-row*`(`__word/__ph/__meaning/__meta/__badge/__date/__hint`) `.mistake-quiz__meta` + 复用 `.answer-dock/.answer-btn/.flash-card*` |
| ④ 我的 | `ProfileScreen.tsx`(375) | `.profile` `__body/__meta/__name` `.avatar` `.stat__num/__unit` `.progress-track`+`__bar` `.section*`(`--danger-zone`) `.setting-row*` `.stage-grid` `.stage-option*` `.stepper*`(`__btn/__value`) `.btn--danger-text` |
| ⑤ 浮层 | `Modal.tsx` `SkinSheet.tsx` `SkinPicker.tsx` `ImportSheet.tsx` `Segmented.tsx` | `.scrim`(`--center`) `.sheet`+`__head/__title/__desc/__body/__foot` `.dialog`+`__title/__text/__actions` `.skin-grid`+`.skin-card*` `.segmented`+`__item` `.textarea` `.parse-summary` `.issues` |

每屏都必须做到：**读得出层级、点得到（≥44）、不溢出（360/768/1440）、明暗两档都成立、空数据/长文案不塌**。
浮层屏特别注意：`sheet` 从底部升起、`dialog` 居中，`max-height` 与内部滚动要保住（`env(safe-area-inset-bottom)`）。

## 3. 四套入选皮肤的语言延续（方向提案，细节你定）

### bento 磁贴（teal `#0E7C86`，冷灰纸，等宽读数，不对称磁贴阵）
延续「阵」：**任何一屏都不许退回单列流水账**。
① 学习流：三枚 `answer-btn` 做成不等分磁贴组（主键占大格，次键小格，别三兄弟等宽），`.word-list` 行=小磁贴，`.study-progress` 做成条状磁贴而非发丝线。
② 日历：`.cal-days` 天然磁贴阵（今日大格跨 2×2、其余等格），`.cal-figures` 做成大小不一的读数磁贴阵。
③ 错词本：`.mistake-row` 磁贴列表 + 右侧计数徽标做成小格；复用①的 dock。
④ 我的：`.stat` 磁贴阵（一个大磁贴放主进度），`.setting-row` 保持台账行。
⑤ 浮层：`.sheet__body` 内 `.skin-grid` 与 `.segmented` 都按磁贴语言重排。

### nocturne 夜航（月光蓝 `#1E4E8C`，墨蓝夜纸，零阴影，排印文档）
延续「文档」：**零阴影不破，层级只靠字号/字距/规则线/缩进**，卡片外壳该消就消（`display:contents` 可用，但要给回可见的归属线索）。
① 学习流：词头排成词典条目（大字 + 音标小字 + 通栏细线），`.answer-dock` 三键做成**无填充排印按钮**（靠上划线/大写词距区分主次，不做三块实心）。
② 日历：航海日志/星表感——等宽数字对齐、发丝线分格、月份做拉丁大标。
③ 错词本：索引排印（`词 · 音标 · 释义`，右侧日期靠齐一列），行距舒适、无卡片。
④ 我的：章节标题用衬线小字 + 通栏线，`.stat` 用大数字排印而非方卡。
⑤ 浮层：sheet 内文全部按文档排印（标题字距、行分隔线、按钮走①的语言）。

### desk 案头（松绿 `#20623F`，暖纸台面 + 深色抽屉 + 台账行）
延续「抽屉 + 台账」。**首页那根左抽屉是 `.app:has(.start)` 专属网格，其它页没有 `.readouts`，不要试图复制同一网格**——
统一动作改成：**非首页把深色抽屉搬到顶上**（`.topbar--bordered` 变实底深色块，返回键/标题/头像在里面重排），内容区延续台账行（左标签右 tabular 值）与通高缝线。
① 学习流：`.study-bar` 即抽屉条（深色实底），`.answer-dock` 三键是列底 sticky 条（沿用首页 CTA 的锚点逻辑），`.word-row` 做台账行。
② 日历：`.cal-day__load` 用真数据做深浅格子（有数据才着色，不许画假刻度）；`.cal-figures` 做侧栏式 96px 读数格语言。
③ 错词本：台账行 + 行尾日期列；dock 同①。
④ 我的：`.stat` 抽屉内读数格（≥96px 高、等宽数字），`.section__title` 做台账小标。
⑤ 浮层：sheet 头沿用深色抽屉块（`.sheet__head` 实底深色，`__title` 反白）——**底色画在真元素上**。

### vinyl 唱盘（洋红 `#A62A5E`，横向吸附轮，圆盘，底部常驻读数带，1 档阴影）
延续「盘 + 底部常驻条」。**其它页没有 `.readouts`，底部常驻条由 `.answer-dock` / `.dock` 担任**，别用 `fixed`（会脱出 `--app-max` 居中）。
① 学习流：三枚 `.answer-btn` = 三张唱片（圆形/胶囊，`--known` 用 success、`--fuzzy` 用 warning、`--unknown` 用 danger，语义不变），`.word-row` 行首加一枚小圆盘做序位；`.study-progress` 可做成圆盘边缘弧——**但必须绑真数据**，否则改成条。
② 日历：`.cal-figures` 复用首页唱片轮（横向 snap + `scroll-padding` 内衬 + 末盘半切），`.cal-day__badge` 做小圆盘点。
③ 错词本：`.mistake-row` 行首一枚圆盘=错词次数（真数据），dock 同①。
④ 我的：`.stat__num` 三枚圆盘读数。
⑤ 浮层：`.segmented` 做成横滑胶囊轮，sheet 底角圆与首页一致。

## 4. 现有四套：删掉介绍之后的首页重排（只做首页，其它页不动）

共同要求：删掉大标题后**不许留 140px 以上空洞**（我会跑空洞探针），必须指定**新的首屏焦点**并说得出它是什么物种；
`.start__title/.start__lede` 的死选择器清掉；`.start__foot` / 今日卡 / 主按钮 / `__links` 等功能入口必须保住。
各自的新锚（方向提案）：

- **paper（词典纸页）**：例外授权——可改 `src/styles/app.css` 的**首页段落**，但**所有新增规则必须写成 `[data-skin='paper']` 前缀**，不得改动会影响别的皮肤的基线声明（`app.css` 是全站基线）。新锚：把 `.start__eyebrow` 提级成词典词条头（衬线大字 + 词性式小字 + 通栏细线），今日卡做成词典内页双栏，spec 做发丝台账。
- **foundry（铅字）**：新锚＝铭牌。`.start__spec` 做成工业铭牌（等宽大写标签 + 铆钉式方点 + 深槽），主按钮左对齐成铅条，eyebrow 升为大号工序标题。
- **instrument（仪表）**：新锚＝读数。显式打开 `.readouts` 做成表盘三联（`display:grid`，漏写就没了），今日卡 `__figures` 降为副仪表，spec 做量具刻度表（真数才画）。
- **broadsheet（词表报）**：新锚＝报名。显式打开 `.start__masthead`（「词笺」升为报名大字 + 拉丁刊号式小字 + 通栏双细线），正文两栏，spec 做分类广告栏。

## 5. 交付格式（每个 agent）

1. 直接改文件（**只改你那一个**），不要新建文件、不要改 DOM、不要跑浏览器（browser MCP 归我，别碰）。
2. 回报里给：每屏做了什么**结构动作**（一句话/屏）、用到的选择器要点、新增令牌、你自查的风险（哪些地方我审计可能抓到）、你没覆盖到什么。
3. 自检清单（写代码前先看一遍）：无 `!important`；无裸 `:root`；全前缀；两档语义色；对比度自查（**按真实底色算**，含深色抽屉/深色 sheet 头这种背景转移）；≥44；360 零溢出；伪元素无中文；无假进度；死选择器已清。
4. 不许顺手「优化」别的皮肤或基线；发现基线有 bug 只在回报里说，不动手。

## 6. 实际落盘结果（交付后回填，给下一轮看）

| 文件 | 行数 | 五界面各做了什么（实测过的一句话版） |
|---|---|---|
| `bento.css` | 440→783 | 作答键不等宽磁贴阵（主键占大格）；日历复刻首页今日卡拓扑（1 大 2 小 1 长）+ 双列日格；错词本左 3px 红签磁贴 + 竖排账尾；`.stat` 拆「数字磁贴 + sunken 长槽」；sheet / segmented / dialog 全走磁贴 |
| `nocturne.css` | 354→636 | 词行=词典条目（44px 悬挂索引 + 缩进竖发丝代替盒）；三枚作答键**无填充**排印按钮（上划线分级，`--known` 2px accent）；日历=航海日志两栏网格（左列日期对齐成一列、右列四行钉格）；错词本=索引排印（<480 右栏折下行内）；我的=章节目录行（去壳，选中态 2px accent 下边线）；浮层零阴影、`.skin-card` 顶线目录行 |
| `desk.css` | 345→575 | **非首页把深色抽屉搬到顶栏**（`.topbar--bordered` 实底，底色画在真元素上）；学习流 = 抽屉条 + 通栏台账行 + 列底 sticky 三键；日历 = 侧栏 96px 读数格语言搬进纸面；错词本 = 出血台账行 + 等宽账尾；我的 = ≥96px 抽屉读数格；sheet 头实底深色反白 |
| `vinyl.css` | 445→1237 | 三枚作答键做成**不同直径的唱盘**（96/88/76）；`.answer-dock/.dock` = 与首页读数带同语法的实底常驻带；进度=唱臂导轨 + 绑真宽度的唱针头；日历 `.cal-figures` 复用首页吸附唱片轮（`scroll-padding` 齐）；错词本行首一枚正圆盘=真错次；我的 `.stat__num` 圆盘读数；segmented 横滑胶囊轮 |
| `app.css` | 2270→~2560 | ① 删 `.start__title/.start__lede` 两条规则 + paper 首页重排块（词条头 / 词典内页双栏 / 发丝台账）；② 基线修 `.stepper{flex:none}`、`.hint__btn` 44 触控盒；③「v10 排印提档」块（17 类→14px、4 类→15px、`.skin-card__tag`→13px） |
| `foundry.css` | 1251→1483 | 新锚=**印刷厂铭牌总成**（工序墨条 → 大号工序标题 → 2px 墨框铭牌 → 铅条按钮），今日卡降为检验记录条；另补排印提档 + 报头 11→13px + 强调读数浅色改 `#c23212` |
| `instrument.css` | 1255→1409 | 新锚=**三联表盘读数带**（显式重开 `.readouts`，顶栏小读数让位避免同数双报）；spec 降为量具刻度表；今日卡降副仪表（360 两列 / 768 四列）；拆掉 `.start__rule` 的 6px 假刻度缝 |
| `broadsheet.css` | 1065→1268 | 新锚=**通栏报名**（「词笺」46–78px 居中 + 真日期做刊号 + 通栏双细线），版心改具名网格（手机单栏 head→ads→cta→news，768 两栏）；另补非首页排印提档 + 外观卡透明叠色对比修复 |

**没做到的**：`desk` / `vinyl` 的底部常驻带只覆盖有 dock 的屏（日历与「我的」的 DOM 里没有 `.readouts` 宿主，CSS 造不出来）；首页 `.empty` 与学习流的即时复习 / 总结两相仍未截图（要落库）；`warnTiny` 剩 38 处 13px 卡片副标。

**流程教训（值得沿用）**：
1. 子代理会「回报很详细但一个字节没写」。第三轮起派单里加了硬约束——**「第一个工具调用必须是 `edit`，不许先输出计划」**，并要求回报附 `Get-ChildItem <file> | Select-Object Length,LastWriteTime`（行数/时间戳没变就算没做完）。落盘率从 0/8 拉回 8/8。
2. 整文件 `write` 会**顶掉别人同期手工补的块**（nocturne 覆盖了我加的 §12 段）：同一文件只允许一个写者，被覆盖后必须重新全量审计。
3. 审计脚本自己也会错，而且**它错了就等于全站"通过"**：本轮抓到四个探针缺陷（横滚祖先豁免把整站出列检查废掉、裁切盒不分轴、裁切盒漏 `top` 让 CTA 恒判失败、44 无亚像素容差）。修完才看见 `.stepper` 那个 8 套皮肤全中的真 bug。
4. **半透明 token 当面板底色用，对比度必须按叠色后的真实底色算**：broadsheet 的外观卡文字 2.15→3.45→7.85，两轮才找对根因（网格底 + 选中卡底都是 rgba）。
