# 把词笺打成 APK（安卓侧载）

不需要 Vercel、不需要账号、不需要浏览器 —— 网页文件全部装进 APK 里，**完全离线**。

## 产物

| 文件 | 说明 |
| --- | --- |
| `out/cijian-1.1.apk` | **1.06 MB，已签名，直接装**（2026-11-26，versionCode 2，含轮次模型 + 备份 + 正式复习回队尾） |
| `out/cijian-1.0.apk` | 旧包（2026-11-25，versionCode 1），已被 1.1 取代，留着只作历史 |
| `out/cijian.keystore` | **签名证书，必须备份**。丢了就再也无法覆盖升级同一个 App（只能卸载重装，进度会丢） |
| `scripts/build-apk.ps1` | 重新打包的脚本 |

包名 `com.cijian.app`，应用名「词笺」，minSdk 24（Android 7.0+），targetSdk 34。

## 装到手机

1. 把 `cijian-1.0.apk` 传到手机：数据线拷贝 / 微信「文件传输助手」发给自己的手机 / QQ 我的设备。
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

# 4. 取产物
Copy-Item D:\AndroidBuild\cijian-1.0.apk D:\背单词\out\ -Force
```

**发新版必须同时做两件事**：
- 把 `AndroidManifest.xml` 的 `android:versionCode` 加 1（`versionName` 随你写）—— 否则覆盖安装会被拒；
- 用**同一个** `out/cijian.keystore` 签名（脚本默认复用 D:\AndroidBuild\cijian.keystore）。

**⚠️ `aapt` / `aapt.exe` 不认中文路径**：直接对 `D:\背单词\out\cijian-1.1.apk` 跑 `aapt dump badging` 会报
`Illegal byte sequence` / `Error opening archive`（aapt 走 ANSI 路径）。先复制到纯 ASCII 路径
（如 `$env:TEMP\xxx.apk`）再 dump。`apksigner`、`zipalign` 不受影响。

**覆盖安装的前提是证书一致**：`apksigner verify --print-certs` 吐的
`certificate SHA-256 digest` 必须和上一版相同（1.0 与 1.1 都是 `bee17fe6…6984`）。不一致 = 系统拒绝升级，
只能卸载重装、进度清零。

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
| 安卓工程源码 | `D:\AndroidBuild\src\com\cijian\app\MainActivity.java`、`AndroidManifest.xml`、`res\` |

以上约 840 MB，都在项目目录之外，删掉不影响仓库。

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
