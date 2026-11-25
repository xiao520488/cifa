# 词笺 · 背单词 App UI 调研报告（指导 v8 皮肤再设计）

> 调研时间：2026-11-24 ｜ 方法：web_search + web_fetch（无浏览器截图权限，凡视觉结论均来自官方页面 / 设计拆解文 / 评论文本 / 品牌色收录站）
> 覆盖对象：百词斩、墨墨背单词、不背单词、扇贝单词、有道背单词（网易有道）、词根词缀字典、词羿、单词鸭、番茄单词、Anki、Quizlet、Duolingo、Memrise、Drops、Vocabulary、WordUp、EWA、Lexity、Vaia、Cram（共 20 项，逐个拆解见第一节；**Stella Lexicals 与 Brilliant 未找到可靠的界面 / 色值来源，只在趋势与反面证据处引用**，见 §1.21）

---

## 0. 阅读指引与标注约定

| 标注 | 含义 |
|---|---|
| **官方** | 来自官网 / 官方博客 / 官方帮助 / 应用商店官方文案 |
| **二手** | 品牌色收录站、设计系统复刻文档、设计拆解长文（数值可信度中） |
| **目测近似** | 无公开色值，依据商店截图描述的近似 hex，**不可当品牌规范引用** |
| **推断** | 由交互描述、评论、常识反推的版式结论，实施前需自查 |

**本报告不改动任何源码。** 第四节的三版提案全部写成「覆盖同名 CSS 变量 + 打开已有 hook + 少量修饰类」的形式，可直接落到 `src/styles/skins/*.css`。

### 0.1 现有 DOM 骨架（三版提案的硬边界）

首页（`StudyScreen.tsx` + `TodayCard.tsx`，从上到下）：

```
header.topbar
  ├ .brand > .brand__name(词笺) / .brand__dot / .topbar__meta(阶段 · 今日 N 词)   ← hook，默认 display:none
  ├ button.icon-btn ×2（学习日历 / 切换外观）
  └ button.avatar-btn（首字，进「我的」）
div.readouts > .readout ×3（今日 / 批数 / 已学，各含 __k + __v）                  ← hook，默认 display:none
main.app__main > .screen > div.start
  ├ .start__masthead > __brand / __rule / __meta(YYYY · MM · DD)                  ← hook，默认 display:none
  ├ p.start__kicker（CET4 · DAILY LIST）                                          ← hook，默认 display:none
  ├ .start__body
  │    ├ p.start__eyebrow（阶段 · 总词数）
  │    ├ h1.start__title（一页 N 个词，看一遍就会。）
  │    ├ p.start__lede（方法说明段）
  │    ├ .start__meta（今日 N 词 / 已学 N 词）
  │    ├ .start__spec > .start__spec-row ×4（阶段 / 今日新词 / 今日批次 / 已学，各 __k + __v）← hook
  │    ├ .start__actions > button.btn.btn--primary.btn--block（开始背单词）
  │    └ section.today-card
  │         ├ .today-card__head > __label(今日 · 月日 周几) + __links(错词本 N / 学习日历)
  │         ├ .today-card__figures > .today-card__figure ×4
  │         │     ① <b class=is-accent|is-warn> + 「新词」 + 可选 .today-card__tag
  │         │     ② <b>done/due + 「到期复习」  ③ <b class=is-warn?> + 「逾期」  ④ <b> + 「连续优秀」
  │         └ p.today-card__reason ×1-2（含 is-increase / is-decrease / is-paused 三态）
  └ .start__foot > span(进度只存这台设备) / .start__rule / button.btn--text(换个阶段)
```

学习态另有：`.flash-card`（`__word/__ph/__meanings/__reveal`，可 `--masked`、`--centered`）、`.word-list/.word-row`（`__index/__word/__ph/__meaning`）、`.dock > .dock__btn/--toggle/--state/--nav/--nav--primary`、`.answer-dock > .answer-btn--known/--fuzzy/--unknown/--ghost`、`.session-done__*`、`.cal-*`（日历）、`.progress-track`、`.stat`、`.sheet/.dialog/.segmented/.stepper`。
皮肤机制：`tokens.css`（默认 = paper）→ `skins/*.css` 用 `[data-skin='x']` 覆盖**同名变量**，`[data-skin][data-theme='dark']` 重映射深色；`skin-hooks.css` 把皮肤专属结构默认 `display:none`。已有 4 套：`paper / foundry / instrument / broadsheet`，v8 候选 3 个空文件：`bento / play / nocturne`（本报告即对应这三套的完整设计说明）。

---

## 一、逐个 App 拆解

### 1. 百词斩（图背单词 · 中文系最大流量）
- **首页骨架**：改版后官方口径是「更专注的首页视觉」——单词由横排改**竖排大字**卡片，卡片主体是「图 + 词 + 例句」，动作区新增 **记住了 / 没记住** 与 **问 AI**；「斩」只做「这词我过了」的确认键，拼写改由键盘回车提交。日历页新增**掌握率折线图 + 词类分析**（v7.8.10 官方更新说明）。底导 4 项（学习 / 复习 / 发现 / 我的）+ 首页左下角「切回旧版」开关（推断，据官方微博 + 评论区教程）。
- **视觉语言**：7.0（2020）换标把品牌色从淡天蓝改成**扎眼深蓝**（目测近似 `#1B2AC4`，官方未公开 hex；报道只说「天蓝→深蓝、与白对比更强」），logo「100」由斩切改成断裂、去掉多余圆角；卡片圆角大、插画/实拍配图密度极高。
- **字体气质**：无衬线大标题 + 手写感插画，字号量级偏大、元素偏多。
- **标志性交互**：**图片联想卡**（一词一图）、单词 TV/电台、单词 PK、日历打卡 + 掌握率曲线。
- **为什么有效**：把「记不住」转成「看得开心」，入门门槛最低，年轻/学生用户留存靠情绪。
- **被诟病**：老用户直言新版「**花里胡哨、像在玩不像学习**」、「判错不即时」让人以为全对、「问 AI」紧挨「斩」导致误触；图片联想的经典副作用——**记住图没记住词**、复习时靠图猜义。官方给的解法（**关图复习**：一轮带图速刷、二三轮关图强制回忆）恰恰说明装饰层会吃掉回忆强度。
- 来源：[什么值得买·改版争议与两个开关](https://post.smzdm.com/p/am9vl5ep/)、[百词斩官方微博·升级说明](https://m.weibo.cn/search?containerid=231522type%3D1%26t%3D10%26q%3D%23%E7%99%BE%E8%AF%8D%E6%96%A9%E5%85%A8%E6%96%B0%E5%8D%87%E7%BA%A7%23)、[新旧版差异](http://www.mizhijia.net/wz/765923.html)、[logo 换色报道](https://www.sohu.com/a/375528046_120065410)、[产品体验报告](https://www.cnblogs.com/w1821262080/p/13974424.html)

### 2. 墨墨背单词（数据派 + 打卡上瘾）
- **首页骨架**：白底极简，主色调白 + 浅绿辅助（目测近似 `#8FD3B6`，推断）；打开直接进**今日复习任务卡片**，卡内上方英文 + 发音，点屏出释义/例句/助记；底部四键 **认识 / 模糊 / 忘记 / 熟知**；完成后在页面生成**按月排列的打卡图标**；另有「特殊单词（顽固词）」入口、`今日回顾 / 历史回顾`（不影响长期排期）。统计页是它的主视觉：**遗忘曲线、记忆持久度、未来每日复习压力柱图**。
- **不设固定新词量**——官方明确把「复习量 + 建议新学量」合成一个「学习量」，复习多则新词少（[官方帮助](https://www.maimemo.com/help30)）。这条**算法哲学**和词笺的额度闸门完全同构，是首页文案可直接借鉴的地方。
- **默认单词上限 600**，靠签到/购买扩容——付费墙设计（少数派早期测评记为「容易上瘾但也容易卡壳」）。
- **标志性组件**：四档记忆反馈 + 记忆曲线图 + 签到「Peng!」动效 + 月历打卡。
- **有效**：状态可见、算法可信、界面干净（多篇知乎长文的第一关键词就是「**干净**」）。**诟病**：广告/社区/助记内容质量参差、上限收费、部分功能藏二级。
- 来源：[官方帮助·记忆按钮语义](https://www.maimemo.com/help30)、[少数派·墨墨评测](https://sspai.com/post/56641)、[知乎·界面干净](https://zhuanlan.zhihu.com/p/565891843)、[知乎·一年使用感受（顽固词/再复习入口）](https://zhuanlan.zhihu.com/p/340495337)、[公众号·四页结构拆解](http://mp.weixin.qq.com/s?__biz=MzkzMzQzMTAxNQ==&mid=2247484955&idx=1&sn=f5ea3d9d010a31730e1a7380db5b55d8)

### 3. 不背单词（审美派 · 壁纸 + 三档夜色）
- **首页骨架**：正中心是**签到按钮 + 一张每日壁纸**（壁纸上印一个单词，可投稿），主导航只有「背单词 / 复习」两个大入口；底部四个次级入口（技巧 / 收藏 / 听力 / 记录）做成**上滑展开**，不占首页；复习页顶部英文 + 释义、中部自动播放例句、最大面积给用法/词根/派生。
- **视觉语言**：**明亮 / 深邃 / 极夜**三主题，支持随日出日落自动切换；换到极夜时**连字体主色都换成蓝色**去配壁纸（目测近似 `#3E6BD1`，推断）。这是中文背单词 App 里最早把「三档明度叙事」做成品牌记忆点的。
- **标志性组件**：壁纸式签到卡、**四颗星**记忆强度条、左滑拼写 / 下滑搜词的手势层。
- **有效**：审美带来的「愿意打开」；**诟病**：豆瓣用户实测其**背景有纹理、整体偏灰，看照片/图糊**（低对比纹理在真实设备上的代价）；默认一组 20 词对通勤党偏多；复习页快捷键字母组合被骂。
- 来源：[知乎·设计角度安利](https://zhuanlan.zhihu.com/p/500050420)、[B站·三主题拆解](https://www.bilibili.com/read/cv12996403/)、[官方三主题说明（蓝叠页）](https://www.bluestacks.com/campaign/cn.com.langeasy.LangEasyLexis/th)、[App Store 评论（快捷键/20 词一组）](https://apps.apple.com/jp/app/id698570469?see-all=reviews)、[豆瓣·偏灰看不清](https://www.douban.com/group/topic/285402556/)

### 4. 扇贝单词（功能矩阵 + 成就体系）
- **首页骨架**：蓝绿 + 白（目测近似 `#0FA6A0`，推断）；顶部是**学习计划**（词汇书封面 + 时间进度 + 每日进度 + 剩余天数），下面挂「短语炼句 / 单词对战 / 旧词复习 / 口语听力阅读课程」优先级列表；底导 4 项：学习 / 课程 / 发现 / 我的；**打卡日历被整合进「我的成就」并新增今日排行**（产品分析里的优化结论）。
- **背词流**：每日先复习旧词再学新词；答题三态「我认识 / 提示一下 / 太简单」，提示会补例句帮确认。
- **标志性组件**：计划进度带、勋章与打卡展示、智慧词根 / 派生联想（付费）。
- **有效**：把「坚持」外化成可见资产；**诟病**：功能过多导致分心、课程页探索率低、商城入口过深（同一篇产品分析的主要结论）。
- 来源：[知乎·产品分析（首页优先级重构）](https://zhuanlan.zhihu.com/p/146535197)、[知乎·打卡拆解](https://zhuanlan.zhihu.com/p/492603864)、[体验报告](https://www.jianshu.com/p/a9f681ce51ff)

### 5. 有道背单词 / 有道词典单词本（用色相突围 + IP 情感化）
- **视觉**：官方分析原文——「在一眼望去满是蓝绿色调的背单词 App 中，一片**亮黄色**的面包形象异常显眼」，采用**橙黄主色 + MBE 风格描边图标 + 大量插画**（目测近似 `#FFC629` / `#FF8A00`，推断）。这是**色彩族突围**的教科书案例：同一品类里换色相比换组件更有效。
- **首页骨架**：主页 = 默认在刷词单 + 学习计划 + 入口卡；「切换单词书」有**两个不一致入口**（个人中心二级 / 学习计划三级），「我的记忆日记」（成就页）混在设置里——被指入口过深、命名不统一。
- **有效**：面包君 IP + 情感化陪伴文案降低枯燥；**诟病**：主色亮黄夜间刺眼（分析直接建议「降低黄色占比、补夜间模式」）、刷词卡文字过多导致层级打架。
- 来源：[网易·有道背单词产品分析（视觉与框架）](https://www.163.com/dy/article/DK9JI29A0511805E.html)、[知乎同题（视觉/交互优化建议）](https://zhuanlan.zhihu.com/p/38228764)

### 6. 词根词缀字典（内容硬核 · 界面欠债）
- 少数派结论：「**功能简陋、界面简单，甚至可以说有点丑**」，但词根/词缀/来源故事覆盖极全，由独立开发者近 10 年维护、完全免费。
- 首页是纯列表 + 查询框，零装饰、零打卡、零色彩语义；它的存在证明：**内容密度能补偿视觉欠债，但补偿不了「不想每天打开」**（无激励机制）。
- 对词笺的启示：把「词根/派生」做成**可读的结构化排版**（不是插画），是低成本高识别度的差异化。
- 来源：[少数派·9 款深度体验（词根词缀字典一节）](https://sspai.com/post/43655)

### 7. 词羿（2026 新品的「反花哨」宣言）
- 官方文案直接打「**极简设计，让单词学习回归本身**：摒弃花哨和干扰」「清爽界面」「以极简图表呈现掌握度、连续学习天数、情景薄弱词」；功能侧是情景锁定 + 听写/听音选义/情景练习 + 离线 TTS。
- 这是**中文市场最新的定位证据**：新品不再用插画抢注意力，而是用「专注契约」抢用户。
- 对词笺：首页装饰层每多一个元素，就多一句要解释「这不是玩具」。
- 来源：[App Store 中国·词羿页面文案](https://apps.apple.com/cn/app/%E8%AF%8D%E7%BE%BF-%E6%99%BA%E8%83%BD%E5%85%A8%E6%84%9F%E5%AE%98%E8%83%8C%E5%8D%95%E8%AF%8D/id6761745797)

### 8. 单词鸭（小游戏化极端样本）
- **玩法骨架**：**单词消消乐**（match-3 棋盘）+ **单词数独**（拼词）+ 相机拍物自动生成词卡 + 记忆卡左滑不认识/右滑认识（错词自动进生词本，按艾宾浩斯排复习）+ 写一写三步（临摹→填空→听写）。商店描述强调「关卡生成算法基于艾宾浩斯遗忘曲线，千人千面」。
- **视觉语言**：高饱和糖果色 + 棋盘格 + 收集卡册，密度极高、色彩承担「玩法提示」而非「状态语义」（目测近似：粉/黄/绿三色分区，推断）。
- **有效**：把启动成本压到「反正是在玩」；**诟病/风险**：40 分钟记 82 词的爽感来自**识别**而非**回忆**，与百词斩「看图猜义」同源——游戏机制会替用户回避最费力也最值钱的那一步。
- 来源：[mergeek 商店文案](https://www.mergeek.cn/en/free/apps/KvEVrAK2oen7POx6)、[MWM·Interface Decoded](https://mwm.ai/apps/dan-ci-ya-xiao-xiao-le-fang-shi-xue-dan-ci-zi-jian-ci-ku-ji-yi-qia/6462759069)、[头条·使用自述](https://www.toutiao.com/w/1881119746722816/)

### 9. 番茄单词（计时约束 + 两遍学习法）
- 官方文案：**番茄钟 25 分钟学 / 5 分钟休**，记录「学习番茄数」；**两遍学习法**（第一遍全对一次、第二遍深度掌握高错词）；词义模式 / 拼写模式切换；**简洁清爽的界面 + 深色/浅色主题 + 完全离线**。
- 对词笺最有价值的不是配色，而是**把「时长/轮次」而不是「词数」作为第二进度轴**：一条 session 结束后用户看得到「我投入了几格时间」。
- 来源：[番茄单词 App Store 文案](https://appagg.com/ios/utilities/fan-qie-dan-ci-si-liu-ji-dan-ci-xue-xi-li-qi-40268986.html?hl=en)、[Foxdata 应用报告](https://foxdata.cn/app-marketing-analytics/6744610110/as/IN/)

### 10. Anki（AnkiMobile / AnkiDroid · 极简表单 + 大字卡 + 三色语义）
- **首页骨架**：牌组列表 = 一张表。每行右侧**三个数字**：**蓝 = 新卡、红 = 学习中、绿 = 待复习**（全平台一致，官方语义），默认每日 20 新卡 / 100 复习；复习页是**大字居中卡片 + 底部四个答案按钮**（Again / Hard / Good / Easy），几乎零装饰、零插画、零进度环。
- **色彩语义（二手 + 社区）**：牌组计数蓝/红/绿；答案按钮历史上 Hard 曾从 `#cccc00` 改成 `#cc7700` 以拉开与 Good 的可辨识度；社区有「Review 按钮配色」插件（Classic/Ocean/Pastel/**Colorblind friendly**/Monochrome，浅/深各自一套，radius/padding/字号/边框粗细全可调），以及 Dracula / Nord / Tokyo Night / Paperwhite 整套**主题插件**——证明「同名 token 覆盖」这条路在同类产品里已被大规模验证。
- **26.10 改版翻车（最重要的反面教材）**：论坛大量反馈——每张牌组行都重复印「New / Learning / To Review」文字是「**冗余、干扰、像 AI 一小时生成的稿**」；**红色天然意味着危险，不该在首页被普遍使用**；pill 太高浪费竖向空间、粗体大字号导致牌组名被截断、「compact 模式并不 compact」；结论是「Anki 是 power-user 工具，不该按大众 App 的原则重设计」。
- **有效**：状态一目了然、肌肉记忆快、可预测；**诟病**：丑、上手门槛高、信息架构像数据库。
- 另有 add-on 把牌组浏览器改造成「**heads-up display**」：双轴图（答题速度 vs 留存率）、按新卡密度发光——硬核用户**真的想要数据仪表盘**。
- 来源：[知乎·红蓝绿三色含义](https://zhuanlan.zhihu.com/p/117618624)、[学术 PDF·蓝新/红学/绿复习](https://core.ac.uk/download/597989057.pdf)、[论坛·Undo 26.10 update（冗余文字/红色滥用）](https://forums.ankiweb.net/t/undo-26-10-update/74279/48)、[论坛·compact 不 compact](https://forums.ankiweb.net/t/compact-mode-in-the-new-design-is-not-very-compact/74276/6)、[论坛·色盲与按钮色 #cc7700](https://forums.ankiweb.net/t/suggestion-make-feedback-ticks-easier-to-distinguish-for-colorblind-users/12878/8)、[GitHub PR·colored answer buttons](https://github.com/ankitects/anki/pull/4371)、[AnkiWeb·Button Colors 插件](https://ankiweb.net/shared/info/747344205)、[AnkiWeb·UI Themes 插件](https://ankiweb.net/shared/info/120261643)、[插件·HUD 双轴图](https://ankiweb.net/shared/info/1148089465)、[品牌色 #80C2EE（二手）](https://colorbase.in/brands/anki/80c2ee)

### 11. Quizlet（学习模式切换器 · 蓝色系）
- **首页骨架**：set 详情 = 一张封面卡 + **学习模式切换器**（Cards / Learn / Test / Match，2016 改版后成为核心心智），网页端在学习模式右侧挂**进度侧栏**（显示进度 + 额外选项）。底导以「学习集/搜索/创建」为主。
- **视觉语言**：品牌蓝（theSVG 收录 **`#4255FF`**；brandcolor.dev 记为 `#4257B2` + aqua `#3CCFCF` + 中性 `#F0F0F0`）；设计系统「Assembly」基于 **Google Material UI 二次改造**（同一按钮换皮即成 Quizlet 语言）——是「用现成组件库 + 皮肤层换性格」的直接同类先例。
- **有效**：模式切换器把「同一批词的不同练法」平铺成可选项，认知成本极低。
- **诟病**：v10.36 把 Learn / Test / 离线**挪进付费墙**，商店均分从 3.53 掉到 2.75——**别把用户已习惯的免费主流程当变现杠杆**。
- 来源：[theSVG·Quizlet #4255FF](https://thesvg.org/icon/quizlet)、[brandcolor.dev·Quizlet](https://brandcolor.dev/brands/quizlet)、[Quizlet 设计系统分析 PDF（MUI→Assembly）](https://www.ischools.org/_files/ugd/7cc5b2_bc6e38981bec4c00b79c64d4845b6128.pdf)、[Dribbble·Quizlet redesign 侧栏](https://dribbble.com/quintin/projects/432428-Quizlet)、[MWM·付费墙与评分下跌](https://mwm.ai/articles/app-updates/quizlet-v10-36-moves-core-study-features-behind-paywall-triggering-ratings-drop-in-may-2026)

### 12. Duolingo（游戏化的视觉语法 · 权威色值）
- **首页骨架**：顶部一排**资源计数**（XP / 🔥 streak / 宝石 / 心），中间**路径式关卡**（圆形节点 ~80×72、绿色当前节点脉冲 1.6s、锁定节点转灰），底部 4–5 项导航。练习页 = 大提问 + 白色选项块 + 底部绿色粗按钮；答对绿/答错红整屏反馈 + 吉祥物动画。
- **视觉语言（二手·系统复刻文档）**：品牌绿 **`#58cc02`**（面积占比 >30%）+ 深绿 `#58a700`（按压/阴影）+ 亮绿 `#89e219` + 淡绿 `#dbf8c5`；**连击橙 `#ff9600`**、**宝石粉 `#ce82ff`**、**提示蓝 `#1cb0f6`**、**错误红 `#ff4b4b`**、**徽章黄 `#ffc800`**；页面纯白 `#ffffff`、边框 **2–3px 实线 `#e5e5e5`（从不用发丝线）**、文字 `#3c3c3c/#777777/#afafaf`；卡片圆角 16–20px、按钮 12px、chip/进度条 `9999px`；**每个可交互元素底部 4px 厚边（"chunky shadow"）= 触觉按压隐喻**，active 时 translate-y 4px 并抹掉厚边。
- **字体**：Feather Bold（定制圆角无衬线）800 字重打天下 + Mona Sans 正文；display 从 48px 起，「Duolingo 从不低语」。
- **有效**：状态可见性 + 可变奖励 + 集邮心理 + 单按钮庆祝页（「领取奖励」只有一个 CTA）。
- **被诟病（学术）**：2026 ACM 论文以 Duolingo 为样本提出 **goal drift / gamified obligation / exit friction**——活跃不等于学习，孩子为了保连胜而「打卡式空转」；另有硕士论文实测其**深色渐变把注意力从内容抽走、进度条与按钮对比度过低**。它的品牌绿 #58cc02 上放白字只有 **2.09:1**（本报告实测），根本不适合正文/按钮文字——**游戏化品牌色普遍不满足 AA，必须准备"深一档"的可用色**。
- 来源：[优设·万字拆解（路径/能量/勋章/即时反馈）](https://www.uisdc.com/duolinguo)、[open-design·Duolingo 设计系统复刻](https://github.com/nexu-io/open-design/blob/e584126d4a6981ef22431cc10bff5f0a853f57de/design-systems/duolingo/DESIGN.md)、[brandcolor.dev·Duolingo 11 色](https://brandcolor.dev/brands/duolingo)、[ACM·The Evil Bird and the Right to Disconnect](https://dl.acm.org/doi/10.1145/3773077.3806127)、[LUT 硕士论文·深色渐变与对比](https://lutpub.lut.fi/bitstream/handle/10024/170147/mastersthesis_Sandeepani_Rappitigala_Jayasundara_Widanalage_Madushika.pdf)、[Promova·游戏化风险](https://promova.com/blog/gamified-language-learning-apps)

### 13. Memrise（本地人视频 + 首页指标重做）
- **首页骨架（官方 2024 变更）**：旧的「周目标 tracker」（35 新词 / 5 视频 / 5 次对话）被**换成「能力等级框架 + 积分」**，官方理由是旧设计让用户误解进度；streak 现在显示在**「首页」tab 顶部 🔥 之下，并列当前与历史最长**。底导以「首页 / 练习 / 进度 / 设置」为轴。
- **视觉语言**：品牌三色 **mem yellow `#FFC000` / deep ink `#2C3748` / 暗金 `#937A25`**（二手 logo 站）+ 各地语言**本地 teal**；几何、轻快、圆润的无衬线；游戏化元素密度高（XP、段位、徽章、剩余积分提示）。
- **有效**：把「和真人学」做成差异化情感资产；勋章 + 全球榜满足不同玩家类型（杀手/成就/探索）。
- **诟病**：首页指标体系一年一换，用户心智被打断；游戏化让「刷分」替代「说出口」。
- 来源：[Memrise 官方博客·新进度体系](https://www.memrise.com/fr/blog/new-progress-tracking-for-language-learning)、[Memrise 帮助·streak 在首页顶部 🔥 下](https://memriseandroid.zendesk.com/hc/pt-br/articles/25929826435345)、[logo.dev·品牌三色](https://www.logo.dev/search/brands/memrise)、[学位论文·Memrise 游戏化标记表](https://hdms.bsz-bw.de/frontdoor/deliver/index/docId/6766/file/Bachelorthesis_am196.pdf)

### 14. Drops（5 分钟硬闸 + 全图形匹配）
- **首页骨架**：**每日只给 5 分钟**（硬计时，用完即止）；词包以「图形网格 + 图标」呈现；核心练习是**看图选词 / 图形匹配**，全程无母语翻译。
- **视觉语言**：官方品牌三色（二手）**Jagger `#3F0F63`（深紫，对白 14.39:1）、Pear `#D9EB3F`（荧光黄绿，对白 1.32:1 → 只能做填充/大标题）、Eminence `#5A2E85`**；商店截图另见紫 `#a356e8`、深紫 `#4c1d95`、绿 `#4caf50`、黄 `#ffca28`、品红 `#d81b60`——**「深底 + 一个荧光亮色」的高能量组合**，且色相族（紫）与蓝绿海完全脱开。
- **有效**：时间稀缺感降低启动阻力（「你永远有 5 分钟」）+ 纯视觉记忆；**诟病**：App Store 长评「**好看但不适合认真学**、像 Google 翻译式词表、不教语法」；落地页也说不清自己的差异化。
- 来源：[Google Play 官方描述·5 分钟/纯视觉](https://play.google.com/store/apps/details?id=com.languagedrops.drops.learn.learning.speak.language.dutch.words&hl=fr)、[ColorFYI·Drops 官方三色 + WCAG](https://colorfyi.com/th/brands/planb-labs-ou/)、[Screenspo·截图色板](https://www.screenspo.com/apps/drops/colors)、[App Store 评论](https://apps.apple.com/ca/app/drops-language-learning/id939540371?see-all=reviews)、[Landing Doctors·teardown](https://landingdoctors.com/teardowns/drops-com)

### 15. Vocabulary（2025 苹果设计大奖视觉类入围 · 单卡刷词）
- **首页骨架**：**一次一词、上下滑切换**（像刷短视频），页面只有单词 + 底部菜单；释义/音标/例句/词源随卡片展开；底部菜单再给「按主题学 / Practice（Guess the word、Match synonyms、Fill in the gap、Sprint/Rush）」；Onboarding 会问年龄/目标/时长并**直接让用户挑图标风格、主题色、桌面小组件**。
- **视觉语言**：**米色背景 + 黑色字 + 大量留白 + 线性图标**，配**风格统一的高度抽象插画**（按动词/名词/情绪/文化分类），点缀蓝绿与红；截图自动生成排版精美的分享卡。
- **有效**：把「背单词」重构成「内容消费」，随机奖励 + 零表单压迫；**个性化外观本身成为留存机制**（自我决定理论：自主/胜任/拥有）。
- **风险**：定位「酷而不常用」的词，对备考人群无直接价值。
- 来源：[优设·设计拆解（含视觉与插画分析）](https://www.uisdc.com/vocabulary)、[人人都是产品经理·同题](https://www.woshipm.com/evaluating/6272227.html)

### 16. WordUp（真实语料 + AI 图的教训）
- 用户评价共识：**菜单与图标清晰、上手快、免费可用**；**主要抱怨是 AI 生成配图假且干扰、界面分心、核心功能被付费化、词库缺词时无法手动补**。学术评测也指出「配图与多选题组合未必符合认知负荷原则」。
- 结构上仍是**列表 + 详情双栏**（原生 UIKit tab bar + table view），不是激进设计。
- 对词笺：**没有插画预算就别塞 AI 图**；纯排印路线在评论区同样能获得「干净」好评。
- 来源：[chrome-stats·WordUp 评论摘要](https://chrome-stats.com/d/co.wordupapp.app/reviews)、[EUROCALL 论文 PDF·WordUp 界面评述](https://www.polipapers.upv.es/index.php/eurocall/issue/download/1318/702)、[Princeton LSK·WordUp 前端结构](https://princetonuniversity.github.io/LSK/productguide.pdf)

### 17. EWA（影视片段 + 卡片）
- 4 万+ 单词卡、**每天 5 分钟**、间隔重复、score chart 排行榜；核心是**互动阅读器 + 影视剧原声片段**（点任意词即时释义并入学生词表）。
- 商业侧数据（第三方）：**11–18 步 onboarding、软付费墙、约 85k 月装机、$550k 月流水**——重情感场景 + 重引导。
- **诟病**：某次大更新后出现界面 bug、加载慢、音效音量异常，老用户反弹（MWM 汇总）。
- 来源：[screensdesign·EWA 案例页](https://screensdesign.com/showcase/ewa-english-language-learning)、[MWM·EWA 商店页与口碑](https://mwm.ai/ja/apps/ewa-english-language-learning/1200778841)、[mergeek·EWA 介绍](https://mergeek.cn/projects/DkYlemel5rWd9VPJ)

### 18. Lexity（word-of-the-day 的视觉仪式）
- 「每日一词」类里最激进的视觉宣言：**全屏 mid-century 复古未来主义插画 + 同步发光音频**，反对「白屏上甩一行定义」的传统。
- 说明：**词卡本身就是一种可收藏的物件**——即使我们没有插画资产，也可以用纯排印 + 纹理（纸纹、印章、色带）制造「可分享的一张卡」。
- 来源：[App Store·Lexity 文案](https://apps.apple.com/si/app/lexity-word-of-the-day/id6739183323)

### 19. Vaia（原 StudySmarter · 模式切换器 + AI 工具箱）
- 闪卡模式提供**按掌握度筛选复习范围**（考前只练不熟的）、自动播放、AI 生成卡与测验；界面被第三方拆成 **154 屏 / 6 条主流程**（Onboarding 35 屏、Learning & Quiz 48 屏）——是「模式切换 + 精细选项」路线的典型复杂度。
- 品牌视觉走紫蓝 + 卡片栅格（目测近似 `#7C5CFC`，推断）。
- 来源：[Vaia 帮助·闪卡模式设置](https://vaia.zendesk.com/hc/en-us/articles/18539943391772)、[mobileappdesign·154 屏拆解](https://www.mobileappdesign.io/apps/vaia-ai-study-flashcards)

### 20. Cram（够用主义的下界）
- 评测原话：「**界面 2013 年放在 iPhone 5C 上也不违和**」，但没有多余东西：搜索现成卡组、建卡、Jungle Quiz、文字转语音（限 300 字符）、方向键翻卡。
- **价值**：给「极简表单」定了下界——只要反馈快、无干扰，丑也能留存；但完全没有品牌溢价与复访动机。
- 来源：[Lifehacker·Cram 评测](https://lifehacker.com/tech/cram-flashcard-app-review)、[Cram 官方帮助](https://www.cram.com/docs/help)

### 21. 覆盖缺口说明（诚实标注）

- **Stella Lexicals**：搜索仅命中同名无关内容（词网络论文、无关游戏评论），**没有可靠的界面截图描述或官方设计页**。结论：本报告**不对其视觉语言下任何判断**，只在方向提案里参考同品类（word-of-the-day / 生僻词卡）已验证的做法——见 §1.15、§1.18。
- **Brilliant**：未做逐个拆解（它是学习 App 而非背单词 App）。仅在两处作为**证据**引用：① 有研究指出 Brilliant 深色模式装饰元素层叠导致注意力偏离内容、进度条/按钮对比不足（[LUT 硕士论文](https://lutpub.lut.fi/bitstream/handle/10024/170147/mastersthesis_Sandeepani_Rappitigala_Jayasundara_Widanalage_Madushika.pdf)）；② 其「深色 + 反馈环 + 吉祥物气泡」的组件写法与 `nocturne` 版相关。
- **EWA / WordUp / Vaia**：界面细节来自第三方拆站与商店文案（**二手**），未见官方设计系统文档；具体色值一律标 **目测近似/推断**。
- **中文系官方色值全部未公开**：百词斩 / 墨墨 / 不背 / 扇贝 / 有道的 hex 均为**目测近似**，引用时请写「近似值」而非「品牌色」。
- **图片取证缺失**：本次未使用浏览器截图（协调要求），因此「版式骨架」部分是从**文字描述 + 评测截图说明 + 常识推断**还原的，凡推断处已标 **推断**；实施前建议由 lead 用真机截图复核一次。

---

## 二、横向模式总结

### 2.1 「今日学习 / 首页」骨架的 6 种范式

| # | 范式 | 代表 | 顶部放什么 | 中间主卡 | 底部导航 | 适配人群 | 主要代价 |
|---|---|---|---|---|---|---|---|
| P1 | **单卡沉浸流** | Vocabulary、不背单词核心页、Lexity | 极简（仅日期/进度小字） | **一次一词全屏卡**，滑动切换 | 4 项（学习/收藏/练习/记录） | 兴趣型、碎片时间、审美敏感 | 看不见「今天还剩多少」，控制感弱 |
| P2 | **任务计数面板** | 墨墨、扇贝、有道、番茄单词 | 今日待复习数 / 计划进度条 | **一张「开始」大卡 + 三四个数字** | 4 项（学习/复习/发现/我的） | 备考党、要确定性的人 | 易被运营位/商城污染 |
| P3 | **路径关卡地图** | Duolingo、沪江开心词场、单词鸭 | 资源计数（XP/🔥/宝石/心） | **节点地图**（当前位置高亮） | 4–5 项（学习/排行榜/挑战/商店/我的） | 低自驱、需外部动机 | 过度游戏化 → goal drift、退出摩擦 |
| P4 | **牌组计数表** | Anki、Cram | 牌组名 + 三个彩色计数 | **列表本身**（无 hero 卡） | 3 项（牌组/统计/设置） | power user、长期主义者 | 上手门槛高、零情绪价值 |
| P5 | **模式切换器** | Quizlet、Vaia、不背单词四模式 | set 标题 + 进度 | **学习模式卡片矩阵** | 3–4 项 | 一册多用法的学生 | 选项过载；付费墙风险（Quizlet 前车之鉴） |
| P6 | **限时冲刺 / 图形匹配** | Drops、单词鸭、EWA | **5 分钟倒计时** + 今日已用 | 图-词匹配卡 / 棋盘 | 3 项（词包/进度/商店） | 通勤、启动困难者 | 学到的是「识别」不是「回忆」 |

> **词笺现状属于 P2 的变体**（一张 hero「开始」卡 + 四格读数 + 批次 spec + 日历/错词入口）。因此三版提案应保留 P2 骨架，用**不同的材质与密度**拉开气质，而不是去模仿 P3 地图（DOM 不支持，且与「一页 5 词」的安静契约冲突）。

### 2.2 各 App 的视觉语言对照

| App | 主色（hex 来源标注） | 背景 | 圆角 | 阴影 | 密度 | 字体气质 |
|---|---|---|---|---|---|---|
| 百词斩 | 深蓝（目测近似 `#1B2AC4`，二手/换标报道） | 白 + 满屏插画 | 大（16+） | 软阴影多 | 低（每屏一词） | 无衬线大标题 |
| 墨墨 | 白 + 浅绿辅（目测近似 `#8FD3B6`，推断） | 纯白 | 中 8–12 | 轻 | 中 | 系统无衬线，四键为大按钮 |
| 不背单词 | 主题驱动（极夜时文字转蓝，目测近似 `#3E6BD1`，推断） | **摄影壁纸** | 中 | 少 | 低 | 细字重 + 大图 |
| 扇贝 | 蓝绿（目测近似 `#0FA6A0`，推断） | 白 | 中 | 中 | 高（功能矩阵） | 无衬线 15–18 |
| 有道背单词 | 亮黄/橙（目测近似 `#FFC629`，二手评论「满是蓝绿中的一片亮黄」） | 白 + 插画 | 大 | 中 | 中 | 圆体 + IP |
| Anki | 语义三色 蓝/红/绿（官方语义，二手 `#80C2EE` 品牌） | 纯白 / 主题可换 | **0** | 极少 | **极高（列表）** | 系统字 + 大字居中卡 |
| Quizlet | `#4255FF` / `#4257B2` + `#3CCFCF`（二手） | 白 / 浅灰 | 中-大 | Material 阴影 | 中高 | 几何无衬线（MUI 系） |
| Duolingo | `#58cc02` + `#ff9600`/`#ce82ff`/`#1cb0f6`/`#ff4b4b`（二手系统文档 + brandcolor.dev） | 纯白 `#ffffff`，深色仅渐变点缀 | 卡片 16–20 / 按钮 12 / chip 9999 | **4px 厚底边**（非模糊） | 低-中 | Feather Bold 800 + Mona Sans |
| Memrise | `#FFC000` / `#2C3748` / `#937A25`（二手） | 白 / 深墨 | 大 | 中 | 中 | 几何圆润无衬线 |
| Drops | `#3F0F63` / `#D9EB3F` / `#5A2E85`（二手，含 WCAG 实测） | 深紫 + 插画 | 大 | 少（色块自承重） | 低 | 圆润粗体 + 图形优先 |
| Vocabulary | 米色底 + 黑字 + 蓝绿/红点缀（二手描述，未取到 hex） | **纯色米底、大留白** | 中 | 极少 | **最低（一屏一词）** | 排印主导，线性图标 |
| 番茄单词 | 番茄红 + 白（目测近似 `#E0492F`，推断） | 白 / 深色可切 | 中 | 少 | 中 | 系统无衬线 + 计时环 |

**三条可直接下结论的分布规律**
1. **中文系集体用蓝绿，唯一破局的是黄色的有道、深蓝的百词斩**；国际系里 Duolingo 占绿、Quizlet 占蓝、Drops/Memrise 占紫/黄。**「蓝紫渐变 + 圆润卡片」= 该品类最差的安全区**。
2. **凡是「一屏一词 + 大留白 + 排印优先」的（Vocabulary、不背单词、Lexity）都拿到设计奖项或审美口碑**；凡是「功能矩阵 + 运营位」的（扇贝、百词斩新版）都收到「花里胡哨」的骂。
3. **材质决定气质**：Duolingo 的识别度 70% 来自那 4px 厚底边与 2–3px 粗边，而不是插画。词笺用纯 CSS 就能复刻「材质语言」这一层。

### 2.3 色彩语义系统与浅/深映射（横向对照）

| 语义 | 常见取值 | 代表 | 浅色档要求 | 深色档做法 |
|---|---|---|---|---|
| 新词 | 蓝（Anki 传统 `#80C2EE` 系）/ 青 | Anki、Quizlet | 文字级 ≥4.5:1 | 提亮到 `#4FD1C5`/`#A9C7F0` 量级，**不要直接反相** |
| 学习中 / 到期复习 | 红-橙（Anki 学习中=红）、绿（Duolingo 进度） | Anki、Duolingo | 红色慎用：Anki 论坛明确「首页不该普遍用红」 | 用饱和度更低的珊瑚红 `#F08177`/`#FF7A70` |
| 待复习（已掌握但到期） | 绿（Anki=绿） | Anki、墨墨 | 绿必须压深（`#0F7A45` 级）才够 AA | 提亮 `#4ED18A`/`#6FD39F` |
| 错误 / 逾期 / 警告 | 红 `#A8332A`–`#B92A22`、琥珀 `#8A4A05`–`#A15C00` | 全部 | 大面积填充 + 小面积文字，文字版实测 ≥4.5 | 深色档改珊瑚 `#F08177`/`#FF7A70` |
| Streak / 打卡 | 橙 `#ff9600`（Duolingo）、🔥 emoji（Memrise）、黄 `#ffc800` | Duolingo、Memrise | 橙底白字必挂（`#FF8A1F` 上白字只有 2.36:1）→ **改用深墨字压在橙上（实测 10.36:1）** | 深底直接用亮橙文字（实测 9.31:1） |
| 成功 / 连击达成 | 绿 `#58cc02`（但白字在其上只有 2.09:1）→ 实操需深一档 `#0A7A44`/`#C74A08` 量级 | Duolingo 反面教材 | 装饰层用亮色、**文字/按钮用加深档** | 亮色可直接做文字 |

**深色模式的三条纪律（有来源）**
- 深色是「逐 token 重新设计」，不是变换：浅色档过 AA 的颜色在深色档几乎必然挂（[zeroheight](https://zeroheight.com/learn/implementing-dark-mode-with-design-tokens/)、[theming.md](https://raw.githubusercontent.com/simota/design-skills/refs/heads/main/skills/design-tokens/reference/theming.md)）。本项目三版全部写独立 `[data-skin][data-theme='dark']` 色阶，**禁用 `filter: invert()`**。
- 深色档的**装饰过载**是真实故障源：Duolingo / Brilliant 被实测「深色渐变把注意力从内容抽走、淡掉的进度条与低对比按钮」——**暗档应减少渐变与发光，而不是增加**。
- 层级靠「明度阶 + 1px 线」，不靠彩色堆叠；Linear/Stripe 的暗色仪表盘是参照（低对比面板描边、右对齐等宽数字、克制网格线）。

### 2.4 移动端硬指标（实际取值范围）

| 指标 | 权威值 | 对本项目的取值建议 |
|---|---|---|
| 点击目标 | **iOS HIG 44×44pt**、**Material/Android 48×48dp**、**WCAG 2.2 SC 2.5.8 最小 24×24 CSS px（AA）**（[W3C](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)、[对照说明](https://pub.dev/documentation/flutter_accessibility_scanner/1.1.0/flutter_accessibility_scanner/TapTargetDetector-class.html)） | 主 CTA ≥52px；`.btn--text`/`.icon-btn` 一律 **44×44**（用 padding 撑，不改视觉尺寸）；`.today-card__links` 两个文字按钮必须 44px 高 + ≥8px 间距（WCAG 允许 24px 但依赖 spacing，本项目直接上 44） |
| 正文字号 | 移动最低 **16px 建议 / 14px 硬底**；iOS Dynamic Type 默认 body 17pt（11 档 11–53pt，[对照表](https://github.com/Dokhacgiakhoa/Agent-Skills-4-Vibe-Coding-CLI/blob/HEAD/.agent/skills/mobile-design/mobile-typography.md)） | 词笺正文 **15–16px**；`.start__lede` ≥15px；任何语言都不低于 **14px**（含 `.today-card__tag`、`.meaning__pos`） |
| 字号阶梯 | iOS：34 / 28 / 22 / 20 / 17 / 15 / 13 / 12；Android Material 类似 5 档 | 三版各自定义 **5 档**：display 34–46 / h1 26–30 / h2 20–22 / body 15–16 / micro 12–13（micro 只用于拉丁标签、等宽读数，中文一律 ≥14） |
| 间距 | 4px 基数（4/8/12/16/20/24/32/40/48/64） | 沿用 `--space-1..8`；卡片内 padding 12–20；块间距 24–32（360px 视口）；`--page-x` 16–20 |
| 栅格 | 移动端 4 列 / 640–1024 8 列 / 1440 12 列，gutter 16/24/32 | 360–430 用 **2 列（gutter 12）** 放读数磁贴；768 用 4 列；1440 用 6–12 列并锁 `--content-max` 640–720 |
| 对比度 | WCAG 1.4.3：正文 4.5:1、大字（≥24px 或 19px 粗）3:1（[W3C](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)） | 本报告第四节所有色值**已用相对亮度公式实测**，标注 ratio；装饰性 1px 线不参与语义 |
| 字体族 | 一套界面 ≤2 族 | 三版均为「拉丁 2 族 + 中文系统字回退」，且全部命中**项目已自托管的 woff2**（零新增下载） |

### 2.5 2025-2026 移动学习类设计趋势（该跟 / 该观望 / 不该用）

| 趋势 | 状态与证据 | 判定 |
|---|---|---|
| **Liquid Glass（iOS 26，WWDC 2025）** | 半透明折射材质、控件浮在内容之上；但设计师公开吐槽「**漂亮但难读**」，Apple 论坛出现「要求一键关闭玻璃」请愿；有团队（Not Boring）**直接减少使用** | **观望/仅借概念**：本项目只在 `nocturne` 的吸底 CTA 用「单层半透明 + 实色可读性保底」，绝不在阅读面上铺玻璃 |
| **Material 3 Expressive（Android 16 / Wear OS 6）** | 官方新增可变字体轴（动态字重/宽度）、形状变形、贴边容器、更深的色板与更多令牌 | **该借概念**：用 `font-variation-settings` 做字重呼吸（已托管 Space Grotesk `300 700` 可变区间），不引入组件库 |
| **Bento / 模块化栅格** | Zorraquino《UX Trends 2025 · Structure order》、Think201 年度盘点把 bento 列为「最受喜爱布局」；学习类的「今日计数」天然适合分格 | **该用**（`bento` 版的核心），但要按 44px 目标与 AA 校验，不拿 bento 当装饰 |
| **Neo-brutalism** | 2022–2025 高热（2–4px 黑边、硬投影、奶油底）；本项目 `foundry` 已实现 | **不重复**：新三版不再做黑边硬投影，避免四套皮肤同气质 |
| **Glassmorphism** | 学术与行业双侧都判它「**在真实传播型 Web 项目里没成主流**」；Envato《2026 UX/UI 趋势》明确「炫技退场、克制转正」 | **不用** |
| **Handmade / 纹理 / wabi-sabi** | **NN/g 2026-04《Handmade Designs: The New Trust Signal》**：AI 疲劳让「看得出是人做的」成为信任信号——线宽不均、未闭合、纸纹、手写字；Canva 2026 报告题名即《Imperfect by Design》 | **该用，且是我们能白嫖的**：纯 CSS 纸纹（`repeating-linear-gradient` + 1px 位移线）+ 手绘感「印章/票根」形状，零图片预算 |
| **Dark-first / OLED 优先** | 「视觉大胆」2026 报告主张暗色优先 + 高对比；但同类实测也警告装饰过载 | **该用一版**（`nocturne`），且必须独立调 token，不做反相 |
| **Editorial / 瑞士栅格 / monochrome + single accent** | shadcn 2026-04 新风格 **Sera**（衬线标题 + 无衬线正文、方角、大写 tracking、下划线控件）；Envato 把「克制、透明、低认知负荷」列为 2026 主线 | **该用**：这正是词笺已有资产（paper/broadsheet）的进化方向，但新三版要各走不同的编辑流派 |
| **Data-rich dashboard** | 参照 Linear（暗色优先、低对比面板线、一次只给一层细节）与 Stripe（表格即界面、右对齐等宽数字、内联 sparkline、克制网格线）；Anki 社区把牌组浏览器改造成 HUD 的插件存在 | **该用**（`bento` 版的语义骨架） |
| **Variable font / 数字排版** | M3 Expressive 官方推可变轴；仪表盘派强调 tabular figures | **该用**：所有数字加 `font-variant-numeric: tabular-nums`，避免读数跳动时列宽抖 |
| **AI 插画** | WordUp 因「AI 生成配图假且干扰」被差评 | **不用**（无原创插画预算时用排印，不用生硬插画） |

---

## 三、可迁移到本项目的设计元素清单

### 3.1 布局层（改结构，但复用现有 DOM 与 hook）

| 元素 | 来源 | 落点（现有类名） | 代价 | 备注 |
|---|---|---|---|---|
| 顶部「读数条」替代 hero 卡 | Anki 牌组计数 / Memrise 首页顶部 streak | 打开 `.readouts`（三格 `.readout`）+ `.topbar__meta` | 低 | 已在 hook 里默认隐藏，皮肤内 `display:flex` 即可 |
| 「工单表 / spec」信息块 | Stripe 表格即界面、Anki 列表 | 打开 `.start__spec`（4 行 k/v） | 低 | 天然适合高密度版 |
| 报头 / 刊号行 | Vocabulary、Broadsheet、Lexity | 打开 `.start__masthead` + `.start__kicker` | 低 | 编辑派专属；三版只有一版打开全部 |
| 单卡沉浸主视区 | Vocabulary / Lexity | `.start__title` 升 display 尺寸 + 隐藏 `.start__lede`、`.start__meta` | 低 | 用 `order` / `display:none`，不删 DOM |
| 磁贴栅格（2×2 / 3 列） | bento、Duolingo 勋章网格 | `.today-card__figures` 改 grid，`.today-card__figure` 做卡片 | 低 | 360px 下 2 列，768 起 4 列 |
| 吸底主 CTA | Duolingo「Continue」、iOS 26 控件浮层 | `.start__actions` + `.btn--block` 用 `position:sticky` | 中 | 需处理 `--dock-height` 与安全区；只在 `.start` 内吸底 |
| 底部工具条化（非按钮壳） | Vaia / Broadsheet 报尾 | `.start__foot` + `.today-card__links` 改横条 | 低 | 保持 44px 目标 |
| 日历入口升为「色带」 | 墨墨月历、Duolingo streak 日历 | `.today-card__links` + `.cal-*` 负荷点 | 中 | 日历页另有 `.cal-load--*` 语义类可复用 |

### 3.2 组件层（需要专属 CSS，全部走 `[data-skin='x']` 选择器）

| 组件 | 来源 | 落点 | 实现要点 |
|---|---|---|---|
| **进度环 / 刻度尺** | Duolingo 进度条（16px 高、`9999px`）、M3 Expressive | `.progress-track__bar`、`.start__meta` 伪元素 | `conic-gradient` + `mask` 做环；或 `repeating-linear-gradient` 做 14 段刻度 |
| **厚底边按压按钮** | Duolingo（4px 底边 + active 位移） | `.btn--primary`（play 版） | `box-shadow: 0 4px 0 var(--accent-deep)` → `:active{transform:translateY(4px);box-shadow:none}` |
| **状态印章 / 戳记** | Drops、纸质账簿 | `.today-card__tag`、`.cal-day__badge` | 方框 + 大写 + 旋转 -3°，纯描边不用色块铺满 |
| **顽固词 / 错词高亮** | 墨墨「特殊单词」、Duolingo 错题回顾 | `.answer-btn--fuzzy/--unknown`、`.word-row--peekable` | 用「左侧 3px 色条 + 弱底」，不整行铺满 |
| **遮挡 / 揭示** | Broadsheet 涂黑、Foundry 斜纹 | `.masked`（现有 `--mask` 变量） | 每版给一套 `--mask` 材质（点阵 / 斜纹 / 墨块），点击后 clip-path 擦除 |
| **连续优秀链条** | Duolingo streak、Memrise 🔥 | 第 4 个 `.today-card__figure` | 7 格点阵 + 当前格发光；深墨字压在亮橙上（实测 10.36:1） |
| **词根 / 派生的结构化排版** | 不背单词、词根词缀字典 | `.meaning__pos`、`.word-row__meanings` | 用 `·` 分节 + 等宽词缀块，替代插画 |
| **模式切换 segmented** | Quizlet、不背单词四模式 | `.segmented__item` | 保持 ≤3 段，避免付费墙式功能切分 |
| **分享卡（截图即成卡）** | Vocabulary、Lexity | `.flash-card` 打印样式 / `@media print` | 用现成卡片加纸纹与刊号，无需新 DOM |

### 3.3 纯装饰层（**必须可一键全关**，且不允许承担语义）

- 1px 纸纹 / 网点 / 45° 斜条纹背景（`repeating-linear-gradient`）——NN/g 的「handmade」信号，但要控制对比：实测 `#DEDED8` 压在 `#F1F1EE` 上只有 **1.19:1**，**只能做装饰线，不能做状态边界**（状态边界需 ≥3:1）。
- 双线栏线、角标、刊号「No.」、日期戳印章、虚线引导点（leader dots）。
- 吉祥物 / 大插画 / 3D 角色（Duolingo 路线）——**本项目无插画资产，全部放弃**。
- 渐变光晕、毛玻璃、发光边（Liquid Glass / glassmorphism）——**只在 nocturne 的吸底层用一次，绝不上阅读面**。
- 粒子、动画庆祝全屏、角色眨眼/跳跃——**放弃**，PWA 性能与「安静」定位都不允许。

### 3.4 明确不抄清单

1. **红色不用于首页常态信息**（Anki 26.10 翻车点）：本项目红色只给「逾期 / 错词 / 危险操作」。
2. **不给每个读数重复印标签**（Anki 论坛骂点：每行都写 New/Learning/To Review）。标签出现一次即可，靠字号/位置分层。
3. **不做 5 分钟倒计时硬闸**（Drops 机制依赖内容形态）；词笺的「额度闸门」已在算法里，界面只报结果。
4. **不塞 AI 配图**（WordUp 差评）。
5. **不学 Duolingo 的品牌绿直接铺按钮**（白字只有 2.09:1）；亮色只做装饰，文字级一律压深一档。
6. **不把「错词本 / 学习日历」这种主流程藏进二级**（有道、扇贝共同被诟病点）——它们现在就在 `.today-card__links`，保持一级可见。

---

## 四、三版差异化设计方向提案

> 三版共用同一 DOM，差异只在 **色彩族 / 字体 / 栅格密度 / 材质 / 打开哪些 hook / 组件形态**。
> 所有对比度均已用 WCAG 相对亮度公式实测（标注 `≈x:1`），深色档为**独立重映射**，无 `invert()`。
> 三版都遵守：正文 ≥14px、点击目标 ≥44px、AA（正文 4.5:1 / 大字 3:1）、一套界面 ≤2 字体族、≤1 强调色、≤3 档阴影。

---

### 版本 A ｜「磁贴 · BENTO」—— 今日是一台仪表盘

**一句话气质**：把今日学习做成一台**可核对的仪表**：等宽数字、分格磁贴、表格化进度，冷静但不冷（teal 信号色）。

**信息密度**：高（三版中最高）· **首屏可读指标**：7 个（今日/批数/已学 + 新词/复习/逾期/连续）

**配色板（浅色档 · 原生）**

| 角色 | hex | 实测对比 |
|---|---|---|
| 纸 `--bg` | `#F1F1EE` | 墨字 15.98:1 |
| 磁贴面 `--surface` | `#FFFFFF` | — |
| 内凹 `--surface-sunken` | `#E7E7E2` | 磁贴槽 |
| 线 `--border` | `#DEDED8` | 1.19:1，**仅装饰** |
| 状态线 `--border-strong` | `#0B646C` | 6.08:1 |
| 墨 `--text` | `#15161A` | 15.98:1 |
| 次 `--text-secondary` | `#56585F` | 6.28:1 |
| 注 `--text-tertiary` | `#6A6C73` | 4.63:1 |
| 强调 `--accent` | `#0E7C86` | 白字 4.95:1 |
| 强调（文字级）`--accent-text` | `#0B646C` | 6.08:1 |
| 弱底 `--accent-weak` | `#DCEDEE` | 墨字 14.97:1 |
| 复习 `--success` | `#14684A` | 5.97:1 |
| 逾期 `--warning` | `#94500A` | 5.44:1 |
| 错词 `--danger` | `#A8332A` | 5.85:1 |

**配色板（深色档）**：底 `#0D1013` / 面 `#14181D` / 升 `#1B2027` / 线 `#272D34` / 墨 `#E9EDF1`(16.22:1) / 次 `#9AA2AC`(6.91:1) / 注 `#7C858F`(4.76:1) / 强调 `#4FD1C5`(10.23:1，按钮上放深墨字 8.92:1) / 弱底 `#123236` / 复习 `#6FD39F`(10.44:1) / 逾期 `#E0A955`(9.06:1) / 错词 `#F08177`(7.42:1)。

**字体族**（全部已自托管）：**IBM Plex Mono**（数字、读数、单位、kicker，大写 +`0.1em`）+ **IBM Plex Sans**（标题与正文、中文回退系统字）。2 族达标。`font-variant-numeric: tabular-nums` 强制等宽数字。
字号阶梯：display 30 / h1 22 / h2 18 / body 15 / micro 12（micro 只放拉丁）。

**版式骨架（360px，ASCII）**

```
┌──────────────────────────────┐
│ 词笺 · CET4 · 今日 20 词  📅 🎨 [词]│ ← topbar，__meta 打开
├──────────────────────────────┤
│  今日   批数   已学              │ ← .readouts：三格等宽，12/28px
│  020    004    1280            │   数字 IBM Plex Mono 28px
├──────────────────────────────┤
│ ┌────────────┐┌───────┬───────┐│ ← .today-card__figures → 磁贴栅格
│ │ 到期复习    ││ 逾期  │ 新词  ││   「1 大 + 2 小」两行布局
│ │ 12/20      ││  3    │ 20    ││
│ │ ▓▓▓▓▓▓░░░░ │├───────┴───────┤│
│ ├────────────┤│ 连续优秀  07    ││ ← 第 4 格 = 7 格点阵
│ │ 阶段  CET4 │└───────────────┘│
│ │ 新词  20   │                  │ ← .start__spec 打开为工单表
│ │ 批次  4×5  │                  │
│ │ 已学  1280 │                  │
│ └────────────┘                  │
│ ▌ 复习清空才轮到新词（注脚）      │ ← .today-card__reason
├──────────────────────────────┤
│ [ 开始背单词            → ]     │ ← 通栏方块按钮 + 左侧 4px 色条
│ 错词本 12  ·  学习日历          │ ← .today-card__links 变表尾工具条
└──────────────────────────────┘
```
768px：读数条与磁贴走 4 列 + 工单表移左栏、CTA 移右下；1440px：`--content-max: 720px`，磁贴 6 列，右侧留空给网格底纹。

**三个标志性组件**
1. **读数条（Readout Rail）**：`.readouts` 打开为三格等宽数字（今日/批数/已学），1px 竖线分格，数字 28px、单位 12px 大写——Anki 首页计数与 Stripe 表格数字的直接转译。
2. **磁贴组（Tile Cluster）**：`.today-card__figures` 从「一行小灰字」变成 **1 大 + 2 小 + 1 长** 的 bento 分格，每格右上有一个 2px 高的**负荷条**（`repeating-linear-gradient` 刻度）。
3. **进度尺刻度（Gauge Rule）**：到期复习 `12/20` 下方一条 10 段刻度尺，满段实色、半段斜纹，替代表述「还差几个」。

**借鉴了谁**：Anki 的三色计数语义与「列表即首页」（[论坛](https://forums.ankiweb.net/t/undo-26-10-update/74279/48)）＋ Anki HUD 插件的双轴/密度发光思路 ＋ Stripe/Linear 的表格即界面、右对齐等宽数字 ＋ Memrise 首页顶部指标位 ＋ 墨墨的遗忘曲线/未来压力可视化 ＋ Zorraquino 的 bento 分格秩序。

**风险点**
- **容易和现有 `instrument` 皮肤撞脸**（同为深色 + 等宽 + 读数）。规避：BENTO **浅色原生**、圆角 2/6px（不是全 0）、只用 1 个 teal 强调（instrument 是琥珀）、层级靠磁贴面差而非线框。
- 高密度在 360px 上易显挤 → 磁贴必须走「大 + 小」两级，禁止四格等大。
- 数字全是等宽 → 中文标签必须 ≥14px，否则小屏出现「像后台系统」的观感。
- 装饰线（`#DEDED8`，1.19:1）不能承担状态；任何需要被看见的边界一律用 `#0B646C`。

**落地清单**：`[data-skin='bento']` 覆盖 `--bg/--surface/--surface-sunken/--border/--border-strong/--text/--text-secondary/--text-tertiary/--accent/--accent-weak/--on-accent/--success/--warning/--danger/--fs-*/--radius-*/--shadow-*/--font-serif(=Plex Sans)/--font-mono`；`display` 打开 `.readouts` + `.start__spec`；新增修饰类 `.today-card--tiles`（可选）；阴影只用 `--shadow-sm` 一档。

---

### 版本 B ｜「燃点 · PLAY」—— 把打卡做成有手感的游戏币

**一句话气质**：暖奶油纸 + 燃橙 + 厚底边按钮 —— **有物理手感的鼓励**，一眼就知道「今天值得点一下」。

**信息密度**：低-中（三版中最少指标）· **首屏可读指标**：3 个（今日额度、复习进度、连击）

**配色板（浅色档）**

| 角色 | hex | 实测对比 |
|---|---|---|
| 奶油纸 `--bg` | `#FFFBF2` | 墨字 17.24:1 |
| 面 `--surface` | `#FFFFFF` | — |
| 内凹 `--surface-sunken` | `#F6EEDF` | 键帽底槽 |
| 线 `--border` | `#EBE1CC` | 1.26:1，仅装饰 |
| 强调 `--accent`（可点面） | `#C74A08` | 白字 **4.76:1** |
| 强调·深 `--accent-press` | `#A33C06` | 厚底边/按压 |
| 强调·亮（装饰/大字） | `#E0590B` | 3.63:1 → **仅 ≥24px 或图形色** |
| 弱底 `--accent-weak` | `#FFE9D2` | 墨字 15.13:1 |
| 连击 `--streak` | `#FFB84D` | 深墨字 10.36:1（**绝不用白字**） |
| 对 `--success` | `#0F7A45` | 5.23:1 |
| 错 `--danger` | `#B92A22` | 5.95:1 |
| 提示 `--warning` | `#A15C00` | 5.03:1 |

**配色板（深色档）**：底 `#14121A` / 面 `#1F1B28` / 升 `#292334` / 线 `#322B41` / 墨 `#F3F1F7`(16.56:1) / 次 `#ADA6B8`(7.16:1) / 注 `#9A95A6`(6.39:1) / 强调 `#FFA24D`(文字 9.31:1；按钮上放深墨字 8.93:1) / 弱底 `#33231A`(13.42:1) / 对 `#4ED18A`(9.56:1) / 错 `#FF7A70`(7.31:1)。

**字体族**：**Space Grotesk**（已托管可变 `300 700`，做 display / 单词 / 数字，700 字重 + 紧字距 `-0.02em`）+ **IBM Plex Sans**（正文、按钮、中文回退系统字）。2 族。**数字全部走 Space Grotesk + `tabular-nums`**（其字形等宽；若个别字宽不齐回退 Plex Mono）。

**版式骨架（360px，ASCII）**

```
        ╭──────────────────────────╮
        │  词笺              📅  🎨  │  ← 顶栏做成「色带」而非白底
        ╰──────────────────────────╯
        ┌──────────────────────────┐
        │  ●●●●●●●○○○  今日额度     │ ← 10 格点阵（额度可视化）
        │                          │
        │   今天 20 个词             │ ← display 38px，700，紧字距
        │   一页看完，别贪           │
        │                          │
        │  复习 ███████░░░ 12/20    │ ← 圆角胶囊进度，橙填充
        │                          │
        │  ┌────────────────────┐  │
        │  │   开 始 背 单 词    │  │ ← 厚底边按钮：0 6px 0 --accent-press
        │  └────────────────────┘  │   :active 下沉 6px、底边归零
        │      ⏱ 约 6 分钟          │
        └──────────────────────────┘
          ╭─────╮ ╭─────╮ ╭─────╮
          │ 7 🔥 │ │12/20│ │ 3   │   ← 三枚「币」：连击/复习/逾期
          │ 连续  │ │ 复习 │ │ 逾期 │      圆形浮雕 + 内上高光
          ╰─────╯ ╰─────╯ ╰─────╯
        ─────────────────────────────
        错词本 12    学习日历    换个阶段  ← 报尾胶囊链接
```
768px：主卡与三枚「币」左右分栏（2:1），CTA 保持通栏在左栏；1440px：主卡最大 560px 居中，「币」横排，背景加极淡网点（对比 ≤1.3:1，仅装饰）。

**三个标志性组件**
1. **按压按钮（Pressable Block）**：Duolingo 的 `border-bottom: 4-6px solid deeper` + active 位移归零 —— **本项目最容易落地、辨识度收益最高的一条材质规则**。
2. **今日额度点阵（Allowance Dots）**：10 个圆点表示额度档位（涨/减/暂停各一种填充），把 `.today-card__tag` 的 `↑+5 / ↓ / 暂停` 三态做成图形语言。
3. **连击币（Streak Coin）**：圆形浮雕 + 内上高光 + 深墨字压在亮橙上；第 4 格「连续优秀」在 `.start__title` 上方以 7 个小点重复一次，形成「本周链」。

**借鉴了谁**：Duolingo 的 4px 厚底边 / 2–3px 粗边 / 圆角尺度（16–20 / 12 / 9999）与「单按钮庆祝页」＋ Memrise 顶部 🔥 streak 位 ＋ Vocabulary 的「一屏只说一件事」＋ 不背单词的签到仪式感（把「Peng!」翻译成 CSS 下沉动效）＋ 单词鸭/百词斩的低门槛情绪 ＋ Envato 2026「低认知负荷」约束（元素数量做减法）。

**风险点**
- **最容易被读成「AI 默认审美」**（圆润卡片 + 暖底 + 橙强调）。规避：字重 700 + 紧字距 + 大字（38–44px）+ 非对称栅格（左重右轻），禁用蓝紫渐变与柔光阴影。
- 亮橙 `#E0590B` 与 `#FFB84D` **不能放白字**（3.58:1 / 2.36:1）：按钮必须用压深档 `#C74A08`，亮橙只做填充/装饰。这是最可能翻车的细节。
- 游戏化情绪与「安静自测」的产品定位有张力 → **只保留 1 个庆祝时刻**（session 结束页 `.session-done`），首页不铺奖励动画。
- 大圆角 + 厚底边在小屏上「吃掉」纵向空间 → 主卡内 padding 上限 20px，`.start__lede` 隐藏（DOM 保留但不显示）。

**落地清单**：`[data-skin='play']` 覆盖同名令牌（含新增 `--accent-press`、`--streak`）；隐藏 `.start__spec` 与 `.readouts`（保持低密度）；打开 `.start__kicker` 做橙色胶囊标签；`.btn` 全局厚底边 + `:active` 位移；`--radius-md: 18px`、`--radius-lg: 28px`、`--radius-full: 999px`；阴影三档全部改成「硬底边」而非模糊。

---

### 版本 C ｜「夜航 · NOCTURNE」—— 深色原生的安静长读

**一句话气质**：墨蓝夜纸上的一页词：**零阴影、零卡片感、只靠排印与一根细分线分层**，深夜背书不刺眼。

**信息密度**：最低（三版中最克制）· **首屏可读指标**：2 个（今日新词、到期复习）· **深色为原生档**（浅色档是「白天复刻」而非主档）

**配色板（深色档 · 原生）**

| 角色 | hex | 实测对比 |
|---|---|---|
| 夜纸 `--bg` | `#0B0D12` | 墨字 16.53:1 |
| 层 `--surface` | `#12151C` | 次字 7.96:1 |
| 升 `--surface-raised` | `#191E27` | 唯一「浮起」层 |
| 线 `--border` | `#242A36` | 装饰 |
| 实线 `--rule` | `#39424F` | 1.91:1，**仅装饰线**；语义线用强调色 |
| 墨 `--text` | `#E8EDF5` | 16.53:1 |
| 次 `--text-secondary` | `#A2ACBB` | 7.96:1 |
| 注 `--text-tertiary` | `#7C8796` | 5.33:1 |
| 强调 `--accent` | `#A9C7F0` | 11.21:1（按钮上用夜航墨字 10.81:1） |
| 弱底 `--accent-weak` | `#161F2E` | 14.07:1 |
| 复习 `--success` | `#79D3A5` | 10.80:1 |
| 逾期 `--warning` | `#E6B877` | 10.63:1 |
| 错词 `--danger` | `#F1897E` | 7.98:1 |

**配色板（浅色档 · 白天复刻）**：底 `#F4F5F7` / 面 `#FFFFFF` / 线 `#E2E5EA` / 墨 `#10141B`(16.92:1) / 次 `#4E5661`(6.81:1) / 注 `#697079`(4.59:1) / 强调 `#1E4E8C`(白字 **8.32:1**、做文字 7.63:1) / 弱底 `#E1E9F4` / 复习 `#14603F` / 逾期 `#7A4F0B` / 错词 `#9B2C22`。

**字体族**：**Newsreader**（已托管可变 `400 600`，做单词与 display，靠 `font-weight:480/560` 做「同族两级」层次）+ **IBM Plex Sans**（UI、数字 `tabular-nums`、中文回退系统字）。2 族达标。若想更「印刷」，display 可换 **Instrument Serif**（已托管，只 400/斜体）——但**不可与 Newsreader 同屏出现**（违反 ≤2 族）。
字号阶梯：display 34（clamp 到 22vw 内）/ h1 24 / h2 20 / body 16 / micro 13（micro 仅用于拉丁 `DAILY LIST`）。

**版式骨架（360px，ASCII）**

```
┌──────────────────────────────────┐ ← 通栏无边距，内容左右各 24px
│  词笺                              │   衬线 20px，无图标按钮底色
│  CET4 · 今日 20 词        📅  🎨 人 │   .topbar__meta 打开，13px 拉丁/14px 中文
│ ───────────────────────────────── │   唯一一条 1px 全宽线
│                                    │
│  CET4 · DAILY LIST                 │ ← .start__kicker：13px 大写 +0.14em
│                                    │
│  一页五个词，                        │ ← Newsreader 34px / 1.15 行高 / -0.01em
│  看一遍就会。                        │   不居中、不加粗、不用强调色
│                                    │
│  先顺着看一遍，再关掉中文考自己。      │ ← .start__lede 16px / 1.75，仅 2 行
│  每两批抽查一次。                     │
│                                    │
│   今日新词            到期复习        │ ← 两栏排印（不用卡片不用磁贴）
│     20                12/20         │   数字 24px tabular，标签 14px 次级墨
│                                    │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─   │ ← 虚线引导（装饰，非语义）
│  连续优秀 07 天 · 逾期 3 · 错词本 12 → │   一行文字链，44px 触摸高
│                                    │
│  ┌──────────────────────────────┐  │
│  │  开始背单词                    │  │ ← 通栏：1px --accent 描边 + 弱底
│  └──────────────────────────────┘  │   文字用强调色，不用实色块
│  进度只存在这台设备                  │
└──────────────────────────────────┘
```
768px：报头 + kicker + 标题组成左栏，两栏数据右移，CTA 与脚注通栏左对齐；1440px：`--content-max: 680px` 左偏置（右侧 12 列空网格 = 呼吸），标题升到 44px。

**三个标志性组件**
1. **刊号行（Masthead Rule）**：`.start__masthead` 打开——「词笺 — 2026·11·24」加一条 1px 线，把首页定性为「今天这一期」，替代进度环。
2. **两栏排印读数（Editorial Ledger Pair）**：不用卡片，只用**基线对齐 + 留白**把「今日新词 / 到期复习」做成一栏两列，数字 24px `tabular-nums`，标签 14px 次级。
3. **描边按钮（Outlined Action）**：主 CTA 不铺色块，只给 **1px 强调描边 + `--accent-weak` 底 + 强调色文字**（实测弱底对墨字 14.07:1）；`:hover` 才把整块填成强调色并把文字反成墨——一次按压一个高光，全页无阴影。

**借鉴了谁**：Vocabulary 的「米色底 + 黑字 + 大留白 + 一屏一词」（[优设拆解](https://www.uisdc.com/vocabulary)）＋ 不背单词的**极夜/深邃三档叙事**（并把「夜间换字色」升级成整套独立 token）＋ Anki 的极简表单与大字居中卡（`--flash-card--centered` 现成）＋ shadcn **Sera** 的「衬线标题 + 无衬线正文 + 方角 + 大写 tracking + 下划线控件」＋ Envato 2026「克制/透明/低认知负荷」＋ Apple HIG 的层级优先原则。

**风险点**
- **深色原生 = 必须逐 token 重设计**，任何「浅色反相」都是灾难（zeroheight / theming.md 已论证）；本项目 `--scrim`、`--row-hover`、`--mask`、`.cal-*` 全部要单独写深色档。
- OLED 纯黑底的**对比度陷阱**：`--border` 在 `#0B0D12` 上只有约 1.35:1，**卡片边界看不见**——层级只能靠明度阶（bg/surface/raised）与留白，别指望描边。
- 衬线 + 小字号中文（14–15px）在低 DPI 屏发虚：`.start__lede` 必须走系统无衬线，衬线只给拉丁单词与 display。
- **气质偏冷**，「安静」容易被读成「没人维护」；需要一处微暖信号（连击数字用 `#E6B877`）避免全页无情绪。
- 与现有 `paper`/`broadsheet` 血缘远，但和 `instrument` 同为深色 → 用「零阴影、零等宽大字、衬线 display」拉开。

**落地清单**：`[data-skin='nocturne']` 覆盖同名令牌；**深色档写进 `[data-skin='nocturne'][data-theme='dark']` 且设为默认视觉**；打开 `.topbar__meta` + `.start__masthead` + `.start__kicker`，隐藏 `.readouts` 与 `.start__spec`；`--shadow-*` 全置 `none`（≤3 档 = 0 档）；`--radius-sm/md/lg: 2px`；链接态用 `text-decoration-thickness/underline-offset` 做下划线控件。

---

### 4.1 三版横向对照

| | **A 磁贴 BENTO** | **B 燃点 PLAY** | **C 夜航 NOCTURNE** |
|---|---|---|---|
| 一句话 | 今日是一台仪表盘 | 打卡有物理手感 | 深夜的一页词 |
| 色族 | 冷灰纸 + teal | 奶油 + 燃橙 | 墨蓝 + 月光蓝 |
| 原生档 | 浅色 | 浅色（深色另调） | **深色** |
| 字体 | Plex Mono + Plex Sans | Space Grotesk + Plex Sans | Newsreader + Plex Sans |
| 圆角 | 2 / 6 | 18 / 28 / 999 | 2（几乎方角） |
| 阴影 | 1 档（浮磁贴） | 3 档全「硬底边」 | **0 档** |
| 首屏指标数 | 7 | 3 | 2 |
| 打开的 hook | `.readouts` + `.start__spec` | `.start__kicker` | `.topbar__meta` + `.start__masthead` + `.start__kicker` |
| 标志组件 | 读数条 / 磁贴组 / 刻度尺 | 按压按钮 / 额度点阵 / 连击币 | 刊号行 / 两栏读数 / 描边按钮 |
| 主要来源 | Anki、Stripe/Linear、Memrise、墨墨、bento 趋势 | Duolingo、Memrise、Vocabulary、不背单词 | Vocabulary、Anki、不背单词极夜、shadcn Sera |
| 最大风险 | 与 `instrument` 撞脸 | 与「AI 默认审美」撞脸 | 深色下描边不可见 / 中文衬线发虚 |
| 适合谁 | 备考期、要看数据的人 | 需要外部推力、容易弃用的人 | 夜读、专注、厌恶装饰的人 |

### 4.2 硬约束合规自查

| 约束 | A | B | C |
|---|---|---|---|
| 正文 ≥14px | ✅ 15/14 | ✅ 16/14 | ✅ 16/14 |
| 点击目标 ≥44px | ✅ 按钮 52 / 链接 44 | ✅ 按钮 56 / 币 48 | ✅ 按钮 52 / 链接 44 |
| 正文对比 ≥4.5:1 | ✅ 实测最低 4.63 | ✅ 实测最低 4.61 | ✅ 实测最低 4.59（浅）/ 5.33（深） |
| 大字对比 ≥3:1 | ✅ | ✅（装饰橙 3.63） | ✅ |
| ≤2 字体族 | ✅ 2 拉丁 + 系统中文 | ✅ | ✅ |
| ≤1 强调色 | ✅ teal | ✅ 燃橙（绿/红仅状态色） | ✅ 月光蓝 |
| ≤3 档阴影 | ✅ 1 | ✅ 3（硬底边） | ✅ 0 |
| 不用 `filter: invert()` | ✅ | ✅ | ✅ 深色为独立 token 重映射 |
| 复用现有 DOM | ✅ 仅覆盖同名变量 + 打开 hook | ✅ | ✅ |
| 360 / 768 / 1440 | ✅ 2→4→6 列 | ✅ 单栏→2:1→居中 560 | ✅ 单栏→双栏→680 偏置 |

---

## 附录 · 建议实施顺序

1. 先做 **C 夜航**（改动面最小：零阴影 + 无新组件，风险集中在深色 token 表）→ 验证「皮肤层能撑住一整套深色原生」。
2. 再做 **A 磁贴**（信息密度收益最高，直接复用 `.readouts` / `.start__spec` 两个现成 hook）。
3. 最后做 **B 燃点**（材质规则最多：厚底边、active 位移、圆角尺度，牵动 `.btn` 全局，宜在前两版稳定后进）。
4. 每版三视口自查：360（额度点阵/磁贴会不会溢出）、768（双栏基线对齐）、1440（`--content-max` 是否锁住）。
