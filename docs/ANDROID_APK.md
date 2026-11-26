# 把词笺打成 APK（安卓侧载）

不需要 Vercel、不需要账号、不需要浏览器 —— 网页文件全部装进 APK 里，**完全离线**。

## 产物

| 文件 | 说明 |
| --- | --- |
| `out/cijian-1.4.1.apk` | **1.06 MB，已签名，直接装**（2026-11-26，versionCode **6**，修 1.4 启动即崩；含状态栏跟随主题 / 禁止缩放） |
| `out/cijian-1.4.apk` | **启动即崩，别装**（versionCode 5）：API 30+ 在 `setContentView` 之前调 `getInsetsController()` → DecorView 为 null → NPE。原因与堆栈见下面「启动崩溃」一节 |
| `out/cijian-1.3.apk` | 旧包（versionCode 4，动效第二轮：页面转场 / 主题过渡 / 读数数字滚动） |
| `out/cijian-1.2.apk` | 更旧（versionCode 3，作答手感：按压 / 答后卡片反馈 / toast） |
| `out/cijian-1.1.apk` | 更旧（versionCode 2，轮次模型 + 备份 + 回队尾） |
| `out/cijian-1.0.apk` | 更旧的包（2026-11-25，versionCode 1），只作历史 |
| `out/cijian.keystore` | **签名证书，必须备份**。丢了就再也无法覆盖升级同一个 App（只能卸载重装，进度会丢） |
| `scripts/build-apk.ps1` | 重新打包的脚本 |
| `android/` | **原生源码（唯一真源）**：`AndroidManifest.xml`、`res/`、`src/com/cijian/app/MainActivity.java` |

包名 `com.cijian.app`，应用名「词笺」，minSdk 24（Android 7.0+），targetSdk 34。

**装新版请直接覆盖安装，不要先卸载。** 1.0 – 1.4.1 用的是同一把证书（SHA-256 `bee17fe6…6984`），
覆盖安装时系统会把它当成同一个 App 的升级，**WebView 里的学习进度原样保留**；卸载才会清零。

## 装到手机

1. 把 `cijian-1.4.1.apk` 传到手机：数据线拷贝 / 微信「文件传输助手」发给自己的手机 / QQ 我的设备。
2. 手机上点开这个文件。
3. 若提示「禁止安装未知来源应用」→ 点「设置」→ 允许这个来源（文件管理器或微信）→ 返回继续安装。
4. 小米 / 华为等可能弹「安全检测」「风险应用」提示 —— 选「仍要安装」。
5. 装好后桌面出现「词笺」图标，点开直接用，**断网也能用**。

## 改完网页后怎么重新打包

```powershell
# 1. 重新构建网页
cd D:\背单词
node node_modules\vite\bin\vite.js build

# 2. 把新产物铺进安卓工程的 assets
Copy-Item D:\背单词\dist D:\AndroidBuild\assets -Recurse -Force

# 3. 打包（会自动签名）
powershell.exe -NoProfile -ExecutionPolicy Bypass -File D:\背单词\scripts\build-apk.ps1

# 4. 取产物（脚本产物名固定是 cijian-1.0.apk，复制时改成当前版本号）
Copy-Item D:\AndroidBuild\cijian-1.0.apk D:\背单词\out\cijian-1.4.apk -Force
```

**发新版必须同时做两件事**：
- 把 `AndroidManifest.xml` 的 `android:versionCode` 加 1（`versionName` 随你写）—— 否则覆盖安装会被拒；
- 用**同一个** `out/cijian.keystore` 签名（脚本默认复用 D:\AndroidBuild\cijian.keystore）。

**⚠️ `aapt` / `aapt.exe` 不认中文路径**：直接对 `D:\背单词\out\cijian-1.4.apk` 跑 `aapt dump badging` 会报
`Illegal byte sequence` / `Error opening archive`（aapt 走 ANSI 路径）。先复制到纯 ASCII 路径
（如 `$env:TEMP\xxx.apk`）再 dump。`apksigner`、`zipalign` 不受影响。

**覆盖安装的前提是证书一致**：`apksigner verify --print-certs` 吐的
`certificate SHA-256 digest` 必须和上一版相同（1.0 – 1.4 都是 `bee17fe6…6984`）。不一致 = 系统拒绝升级，
只能卸载重装、进度清零。

## 1.4 启动即崩（已修，留档）

真机 TAS-AL00（Mate 30，Android 12 / API 31）装上 1.4 后立刻「屡次停止运行」。`adb logcat -b crash` 原文：

```
java.lang.RuntimeException: Unable to start activity ComponentInfo{com.cijian.app/com.cijian.app.MainActivity}
Caused by: java.lang.NullPointerException: Attempt to invoke virtual method
  'android.view.WindowInsetsController com.android.internal.policy.DecorView.getWindowInsetsController()'
  on a null object reference
    at com.android.internal.policy.PhoneWindow.getInsetsController(PhoneWindow.java:4325)
    at com.cijian.app.MainActivity.applyStatusBarIcons30(MainActivity.java:152)
    at com.cijian.app.MainActivity.applyStatusBar(MainActivity.java:144)
    at com.cijian.app.MainActivity.onCreate(MainActivity.java:59)
```

**根因**：`applyStatusBar()` 在 `setContentView()` **之前**被调用。API 30+ 的 `Window.getInsetsController()`
内部要先 `mDecor.getWindowInsetsController()`，而 DecorView 还没建 → NPE 抛在**框架内部**；
调用方写 `if (controller == null) return` 救不了，因为异常根本轮不到它判。

**修法（1.4.1 / versionCode 6）**：
1. 首帧底色先存进变量，等 `setContentView` 之后再把状态栏刷上去；
2. `WindowInsetsController` 改成从 `window.getDecorView().getWindowInsetsController()` 拿，decor / controller 双重判空。

**规矩**：`WindowInsetsController` / `WindowInsets` 这类窗口装饰 API 一律放在 `setContentView` 之后调；
「首帧就要刷」的东西必须在代码里把调用时机写明确，不能靠「反正 onCreate 里总有一处」的假设。

## 技术选择（为什么这么做）

| 决策 | 原因 |
| --- | --- |
| WebView 内嵌 `dist/`，而不是 Capacitor/Gradle | 不需要 Android Studio（省 1 GB+ 和 Gradle 网络问题），直接调 `javac` + `d8` + `aapt` + `zipalign` + `apksigner`，全程 30 秒 |
| 用 `https://appassets.local/` 假域名拦截请求，而不是 `file://` | `file://` 是不透明源：localStorage 被隔离、ES module 的 `import()` 被 CORS 拦掉。词库是动态 import 的，用 file:// 会直接加载失败。假域名让页面看到正常的 https 源 |
| `/sw.js` 故意返回 404 | 资源本来就在 APK 里，离线是天然的；让 Service Worker 在 WebView 里跑只会引入缓存打架 |
| `setDomStorageEnabled(true)` + `setUseWideViewPort(true)` | 前者是学习进度的存储，后者让 `<meta viewport>` 生效，否则会按 980px 桌面宽度渲染 |
| `setAlgorithmicDarkeningAllowed(false)`（API 33+） | App 自己按主题切换配色，不让系统再叠一层反色 |

## 工具链位置（本机）

| 东西 | 路径 |
| --- | --- |
| JDK 17 (Temurin) | `D:\AndroidBuild\jdk` |
| build-tools 34.0.0 | `D:\AndroidBuild\sdk\build-tools\34.0.0` |
| platform android-34 | `D:\AndroidBuild\sdk\platforms\android-34\android.jar` |
| 安卓工程源码 | **仓库 `android/`**（2026-11-26 起进 git）。`D:\AndroidBuild\{src,res,AndroidManifest.xml}` 是构建时从仓库覆盖过去的拷贝，**别直接改那里** |
| 构建工作区 | `D:\AndroidBuild`（jdk / sdk / assets / 签名中间产物） |

以上约 840 MB，都在项目目录之外，删掉不影响仓库（`android/` 只有 3 个文件、约 14 KB）。

> **`scripts/build-apk.ps1` 必须存为 UTF-8 with BOM**。PowerShell 5.1 对无 BOM 的 UTF-8 按 ANSI
> 解码，中文注释会让脚本解析坏（2026-11-26 实测：报 `Test-Path 参数为 null`，变量根本没赋上值）。
> 用编辑器改完若发现打包突然报莫名其妙的 null，先查 BOM。

## 已知限制

- **卸载 App = 学习进度全丢**（进度存在 WebView 的 localStorage 里）。重装要重新背。
- 需要 **Android 7.0+ 且系统 WebView 较新**（2019 年后的手机基本没问题）。如果打开是白屏，大概率是 WebView 太旧。
- 只能「覆盖安装」升级，不能降级（versionCode 必须递增）。
- 不上应用商店，装的时候系统会提示未知来源风险，属正常。

## 已验证 / 未验证

- ✅ 已验证：`javac` 编译通过（仅 1 条 deprecation 提示）、`d8` 生成 dex、`aapt` 打包、`zipalign` 对齐、`apksigner` 签名。
- ✅ 已验证：`apksigner verify` 通过（v2 + v3 方案，minSdk 24 无需 v1）。
- ✅ 已验证：APK 内 28 个条目，`dist/` 的 21 个文件**一个不缺**，`index.html` 引用的 2 个带 hash 资源都在包内。
- ✅ 已验证：`aapt dump badging` → `package com.cijian.app`、`label 词笺`、`launchable-activity MainActivity`、`sdkVersion 24`、`targetSdkVersion 34`。
- ✅ 已验证（2026-11-25）：**真机安装并打开正常**（用户本人安卓手机确认）。
- ✅ 已验证（2026-11-26，1.1 / versionCode 2）：APK 内 **28 个条目**，`dist/` 的 **21 个文件逐个 SHA256 与包内一致**
  （0 不一致），`assets/index.html` 引用的新哈希资源（`index-KglkUNTR.js` / `index-DuMee3km.css`）都在包内；
  `apksigner verify` → v2 + v3 通过、签名证书 SHA-256 = `bee17fe6…6984`（与 1.0 同一把，可覆盖安装）；
  `aapt dump badging` → `versionCode='2' versionName='1.1'`、`sdkVersion 24`、`targetSdk 34`、`label 词笺`。
- ✅ 已验证（2026-11-26）：**1.1 真机覆盖安装成功、打开正常**（用户本人确认；未卸载，学习进度保留）。
- ✅ 已验证（2026-11-26，1.2 / versionCode 3）：APK 内 **28 个条目**，`dist/` 的 **21 个文件逐个 SHA256 与包内一致**（0 不一致）；
  `assets/index.html` 引用的 `index-nRO8XMO0.js` / `index-CrvaQPU8.css` 都在包内（即 1.2 的 CSS 含 foundry 深色按压修复）；
  `apksigner verify -v` → v1 false / **v2 true / v3 true**、证书 SHA-256 = `bee17fe6…6984`（与 1.0/1.1 同一把）；
  `aapt dump badging` → `versionCode='3' versionName='1.2'`、`sdkVersion 24`、`targetSdk 34`、`label 词笺`。
- ⏳ 未验证：1.2 的真机安装（等下一次用户上手；签名与资产已核对，预期覆盖安装即可）。
- ✅ 已验证（2026-11-26，1.3 / versionCode 4）：包内 21 个 `dist/` 文件逐个 SHA256 一致、v2+v3 签名、
  `aapt` 字段全对（`versionCode='4' versionName='1.3'`）——**真机已安装使用，用户确认「可以」**。
- ✅ 已验证（2026-11-26，1.4 / versionCode 5，静态核验）：APK 内 **28 个条目**、`dist/` 的 **21 个文件逐个 SHA256
  与包内一致（0 不一致）**；`assets/index.html` 已含 `maximum-scale=1, user-scalable=no` 与
  `window.cijianChrome.setStatusBar(...)` 的内联调用；`classes.dex` 里查到 `MainActivity$ChromeBridge`、
  字符串 `"cijianChrome"`、`addJavascriptInterface`、`Color.luminance`、`setSystemBarsAppearance`、
  `setBuiltInZoomControls`、`setDisplayZoomControls`；`apksigner verify` → v1 false / **v2 true / v3 true**、
  证书 `bee17fe6…6984`（与 1.0–1.3 同一把，可覆盖安装）；`aapt dump badging` → `versionCode='5' versionName='1.4'`、
  `sdkVersion 24`、`targetSdk 34`、`label 词笺`。
- ⏳ **未验证（本机无设备）**：1.4 的两个修复在真机上的效果——深色主题下状态栏是否跟 App 同色、双指是否真的捏不动。
  静态证据只证明「代码进包了」，不证明「手感对了」。
