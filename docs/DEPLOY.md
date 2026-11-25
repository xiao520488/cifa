# 部署到 Vercel + 安卓装成 App

> 本项目是**纯静态前端**（Vite + React + PWA），没有后端、没有数据库、进度只存浏览器 localStorage。
> 所以「部署」= 把 `dist/` 丢到任何支持 HTTPS 的静态托管；「装成 App」= PWA 装桌面，或打一个 TWA 的 APK。

---

## 0. 一次性准备

| 要的东西 | 说明 |
| --- | --- |
| Vercel 账号 | 用 GitHub / 邮箱注册即可，免费 Hobby 计划足够（静态站点 100 GB/月带宽） |
| Node.js ≥ 20.19 | 本机 `node -v` 是 v26，满足；Vite 7 要求 20.19+ / 22.12+ |
| Vercel CLI | 不需要全局装，`npx.cmd vercel` 即可（见下方 PowerShell 的坑） |

> **本机 PowerShell 的坑**：执行策略禁用了 `.ps1`，所以 `npm` / `npx` 会报「禁止运行脚本」。
> 一律用带后缀的 `npm.cmd` / `npx.cmd`，或者先 `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`。

---

## 1. 部署（路线 A：CLI，最快，不依赖 Git 仓库）

当前仓库**没有配置远端**，用 CLI 直接上传本地目录最省事。

```powershell
cd D:\背单词
npx.cmd vercel login          # 浏览器里点一下授权
npx.cmd vercel --prod         # 首次会问几个问题，见下
```

首次交互的回答：

| 提问 | 回答 |
| --- | --- |
| Set up and deploy? | `Y` |
| Which scope? | 选你自己的账号 |
| Link to existing project? | `N` |
| What's your project's name? | 回车用默认（目录名可能是中文，建议手输 `cijian`） |
| In which directory is your code located? | `./` |
| Want to modify these settings? | `N`（`vercel.json` 已写好） |

构建发生在 Vercel 侧：`pnpm install --frozen-lockfile` → `pnpm build` → 发布 `dist/`。
本机没装 pnpm **不影响**部署，Vercel 会按 `pnpm-lock.yaml` 自动选包管理器。

拿到形如 `https://cijian-xxxx.vercel.app` 的地址就上线了，HTTPS 自动配好（PWA 的硬前提）。

### 路线 B：GitHub 自动部署（推荐长期用）

```powershell
cd D:\背单词
git init                                    # 若还没有
git add -A; git commit -m "chore: vercel 部署配置"
git remote add origin https://github.com/<你>/cijian.git
git push -u origin main
```

然后 <https://vercel.com/new> 导入该仓库，Framework 会自动识别成 **Vite**（Build `pnpm build`，Output `dist`），点 Deploy。
之后每次 `git push` 自动重建，不必再跑 CLI。

> ⚠️ 路线 B 会把仓库推到 GitHub。`docs/`、`NOTES.md` 等内容也会一起公开（除非建私有仓库）。用私有仓库即可。

---

## 2. 部署后自检（三条命令，别跳过）

```powershell
# ① sw.js 必须是「每次回源」的缓存头，否则旧 Service Worker 会一直钉住
curl.exe -sI https://<你的域名>/sw.js | Select-String -Pattern 'HTTP/|cache-control'

# ② manifest 的类型必须是 application/manifest+json
curl.exe -sI https://<你的域名>/manifest.webmanifest | Select-String -Pattern 'HTTP/|content-type'

# ③ 首页 200，且 hash 资源头是 immutable
curl.exe -sI https://<你的域名>/ | Select-String -Pattern 'HTTP/'
```

浏览器侧再看一眼：DevTools → **Application → Manifest**（无红色报错、图标显示正常）→ **Service Workers**（状态 `activated and is running`）。
手机侧：安卓 Chrome 打开该地址 → 菜单里应出现「**安装应用 / 添加到主屏幕**」。

---

## 3. 安卓装成 App

### 方式 1：PWA 装桌面（零成本，先做这个）

- **Chrome / Edge**：地址栏右侧出现安装图标，或菜单 →「安装应用」。装好后从桌面图标启动，**没有地址栏**（`display: standalone`）。
- **国产 ROM 自带浏览器**（小米 / 华为 / OPPO / vivo）：菜单 →「添加到桌面」，多数只是快捷方式，启动后仍带浏览器地址栏 —— 能用，但不算真 App。
- 判断标准：从桌面图标点开，**顶部有没有地址栏**。没有 = 真 PWA。

### 方式 2：打 APK 侧载（要一个真正的 apk，不上架商店）

用 [PWABuilder](https://www.pwabuilder.com)，它把 PWA 包成 **TWA**（Trusted Web Activity，本质是全屏 WebView + 复用系统 Chromium），**不需要本机装 Android Studio / JDK**。

1. 打开 pwabuilder.com，输入你的 `https://<域名>`，Start。评分页里 Manifest / Service Worker 应全绿（本项目已具备）。
2. **Package for stores → Android**，填写：
   - **Package ID**：`com.cijian.app`（之后不能改，改了等于另一个 App）
   - **App name**：词笺 ｜ **版本**：`1.0.0`
   - **Signing key**：`Create new`（首次）；**务必勾选下载 signing key**
3. Download → zip 里关键三样：`*.apk`、`assetlinks.json`、`signing.keystore`（**keystore 丢了就再也无法给同一个包名发新版**，备份好）。
4. 把 zip 里的 `assetlinks.json` 放到 `public/.well-known/assetlinks.json`，再跑一次 `npx.cmd vercel --prod`。
   （这条路径已实测：Vite 会把 `public/` 下的点目录原样拷进 `dist/.well-known/`，不用改 `vite.config.ts`。）
5. 校验资产链接（**这步决定是不是全屏**）：

   ```powershell
   curl.exe -s https://<你的域名>/.well-known/assetlinks.json
   ```

   同时核对 [Google 的验证器](https://developers.google.com/digital-asset-links/tools/generator) 或 `statement` 里的 `package_name` / `sha256_cert_fingerprints` 与你的 keystore 一致。
6. 把 APK 传到手机（数据线 / 微信文件传输助手）→ 点开 → 允许「安装未知来源应用」→ 安装。
7. 打开后**顶部还有地址栏** = 资产链接没验过（大概率：`assetlinks.json` 没落在根域、`package_name` 不匹配、或站点有 301 跳转）。

**TWA 的前提**：手机上得有一个支持 TWA 的浏览器（Chrome / Edge / 三星浏览器等），因为 TWA 借它来渲染。纯国产 ROM 若没有 Chrome，APK 会打不开 —— 那就退回方式 1。

**版本关系（重要）**：TWA 打开的是**线上站点**，所以网页更新后 App 自动跟着更新，不用重打包。
只有改了包名 / 应用名 / 图标 / `manifest` 才需要重新打包，且 `versionCode` 必须比上一版大。

---

## 4. 每次发版的固定动作

1. 改代码。
2. **把 `public/sw.js` 的 `CACHE` 版本号 +1**（当前 `cijian-v2` → `cijian-v3`）。不升版本，用户的旧缓存不会被清掉。
3. `npx.cmd vercel --prod`（或 `git push`）。
4. 手机端：关掉 PWA 再打开，应拿到新版；导航请求走 network-first，正常不会白屏。

---

## 5. 常见故障

| 症状 | 原因 / 处理 |
| --- | --- |
| 部署失败 `ERR_PNPM_OUTDATED_LOCKFILE` | `package.json` 与锁文件不一致。本地跑一次 `pnpm install` 重新生成 `pnpm-lock.yaml` 再提交（本机没 pnpm 就先 `npm.cmd i -g pnpm`） |
| 部署失败提示 lockfile 版本不被支持 | 当前 `pnpm-lock.yaml` 是 `lockfileVersion: 9.0`，需要 pnpm ≥ 9。在 `package.json` 加一行 `"packageManager": "pnpm@9.15.0"` 后重新部署 |
| 构建失败在 `tsc --noEmit` | 本地先验：`node node_modules\typescript\bin\tsc --noEmit` |
| 构建报 Node 版本过低 | 已在 `package.json` 固定 `"engines": { "node": "22.x" }`；若 Vercel 项目设置里单独指定过 Node 版本，以项目设置为准 |
| 装好的 App 打开是白屏 / 旧版 | 旧 Service Worker 缓存。升级 `CACHE` 版本重新部署；或手机 Chrome → 站点设置 → 清除数据 |
| 刷新子路径 404 | 本项目没有前端路由（单页 tab 切换），不需要 rewrite；以后加了 react-router 再在 `vercel.json` 加 `rewrites` 到 `/index.html` |
| 手机上打不开 `*.vercel.app` | 见下一节 |

## 6. 关于国内可达性（别忽略）

`*.vercel.app` 在部分地区和运营商会被 DNS 污染或限速，**部署成功后一定用手机 4G/5G 实测**，不要只在电脑上验证。

- 手机能开 → 直接用。
- 手机打不开 / 很慢 → 换静态托管：**Cloudflare Pages**（同样零配置、免费、国内通常更稳）或 **Netlify**；也可以绑自己的域名（国内域名需备案，解析到境外 CDN 的体验仍取决于线路）。
- 本项目的部署产物就是 `dist/` 一个目录，换平台只是重新上传，代码零改动。

---

## 7. 本轮已验证 / 未验证

- ✅ 已验证：`pnpm build`（等价命令）通过 —— `tsc --noEmit` 无错，Vite 产出 21 个文件，首屏 JS 325 kB / gzip 102 kB。
- ✅ 已验证：`dist/` 产物是纯静态目录（`index.html` + `assets/` 带 hash + `manifest.webmanifest` + `sw.js` + `icons/`），无服务端依赖。
- ✅ 已验证：`vercel.json` 能被解析，四条 `headers` 规则按路径生效（`/sw.js`、`/manifest.webmanifest`、`/assets/(.*)`、`/(.*)`）。
- ✅ 已验证：`public/.well-known/assetlinks.json` 会原样进入 `dist/`（测试用的假指纹已删除，仓库里不留占位文件）。
- ⚠️ 未验证：真实 `vercel --prod` 构建（需要你的账号登录）、真机安装 PWA / APK、`*.vercel.app` 在你手机网络下的可达性。
