/**
 * 安卓壳（`android/`）与网页之间的唯一通道。
 *
 * 为什么需要它：WebView **不认 `<meta name="theme-color">`** —— 那条 meta 只对
 * Chrome / PWA 生效。APK 里的系统状态栏颜色由原生 `Window.setStatusBarColor()`
 * 决定，所以网页得把「当前主题的页面底色」显式交给原生，否则深色模式下状态栏
 * 一直是写死的浅色（真机截图 2026-11-26 16:40 就是这个问题）。
 *
 * 桥对象由 `MainActivity` 通过 `addJavascriptInterface(..., "cijianChrome")` 注入，
 * 在页面脚本执行前就存在（所以 `index.html` 的首帧内联脚本也能用）。
 * 在浏览器 / PWA 里它是 `undefined`，这里的所有调用都是空操作。
 */
export interface NativeChromeBridge {
  /**
   * color 为 `#RRGGBB`，即当前页面真正的底色。
   * 状态栏图标的明暗由原生按**该颜色的亮度**自己算——不要在这里传「是否深色主题」：
   * instrument 皮肤在浅色主题下也是深底（#0B0D0F），按主题名判断会得到深色图标压在
   * 近黑状态栏上。
   */
  setStatusBar(color: string): void;
}

declare global {
  interface Window {
    cijianChrome?: NativeChromeBridge;
  }
}

/**
 * 同步系统状态栏。桥不存在（浏览器）或桥抛错时静默跳过——
 * 状态栏颜色错了只是难看，绝不能因此让界面崩掉。
 */
export function syncNativeChrome(color: string): void {
  try {
    window.cijianChrome?.setStatusBar(color);
  } catch {
    /* 忽略：WebView 桥不可用 */
  }
}
