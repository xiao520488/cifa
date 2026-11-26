package com.cijian.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.content.res.Configuration;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.view.WindowInsetsController;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

/**
 * 词笺 —— 把打包好的网页（dist/）装进 APK 的 assets，用 WebView 加载。
 *
 * 为什么不直接 loadUrl("file:///android_asset/index.html")：
 * file:// 是不透明源，localStorage 会被隔离、ES module 的 import() 会被 CORS 拦掉，
 * 词库是动态 import 进来的，直接崩。所以这里用 https://appassets.local/ 这个假域名，
 * 在 shouldInterceptRequest 里把请求映射回 assets —— 页面看到的是一个正常的 https 源。
 *
 * 另外故意把 /sw.js 返回 404：离线能力已经由「资源就在 APK 里」天然满足，
 * 让 Service Worker 在 WebView 里跑只会带来缓存打架的风险。
 */
public class MainActivity extends Activity {

    private static final String HOST = "appassets.local";
    private static final String ORIGIN = "https://" + HOST + "/";
    private static final String BRIDGE = "cijianChrome";
    /* 浅色 / 深色的兜底底色（与 paper 皮肤一致），只在首帧还不知道真实主题时用 */
    private static final int BG_LIGHT = 0xFFF6F3EC;
    private static final int BG_DARK = 0xFF12110E;

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();

        /* 首帧的状态栏颜色只能猜：App 的主题（跟随系统 / 手动浅色 / 手动深色）存在
           WebView 的 localStorage 里，原生读不到。这里先跟系统的深色模式走一步，
           页面脚本一跑起来就会用真实主题校正（见 ChromeBridge.setStatusBar）。 */
        boolean systemDark = (getResources().getConfiguration().uiMode
                & Configuration.UI_MODE_NIGHT_MASK) == Configuration.UI_MODE_NIGHT_YES;
        /* 注意：这里**不能**调 applyStatusBar —— API 30+ 的 getInsetsController() 要 DecorView，
           而 DecorView 在 setContentView 之后才存在。1.4 就是这么崩的（真机 TAS-AL00 / Android 12）：
           java.lang.NullPointerException: Attempt to invoke virtual method
           'android.view.WindowInsetsController ...DecorView.getWindowInsetsController()'
           on a null object reference —— NPE 抛在框架内部，我们自己判 null 拦不住。
           所以首帧底色先记在变量里，等视图挂好再刷（见 setContentView 之后那一段）。 */
        int firstBg = systemDark ? BG_DARK : BG_LIGHT;

        web = new WebView(this);
        web.setBackgroundColor(systemDark ? BG_DARK : BG_LIGHT);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);   // localStorage —— 学习进度全靠它
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        /* 禁缩放：viewport 里已经写了 user-scalable=no / maximum-scale=1，
           这里再从原生侧关掉内置缩放手势 —— 两边都关才挡得住（2026-11-26 真机反馈：
           页面能双指放大，放大后版式全乱且回不到 100%）。 */
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setTextZoom(100);             // 不跟随系统字号，避免版式被撑坏
        settings.setUseWideViewPort(true);     // 让 <meta viewport> 生效
        settings.setLoadWithOverviewMode(true);

        if (Build.VERSION.SDK_INT >= 33) {
            // App 自己处理深色模式（跟随系统或手动），别让系统再叠一层反色
            settings.setAlgorithmicDarkeningAllowed(false);
        }

        /* 网页 → 原生：把当前主题的页面底色送进状态栏（WebView 不认 theme-color meta，
           那条 meta 只对 Chrome / PWA 生效）。接口对象在页面脚本执行前就已注入。 */
        web.addJavascriptInterface(new ChromeBridge(this), BRIDGE);

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return null;
                if (!HOST.equals(request.getUrl().getHost())) return null;
                return serveAsset(request.getUrl().getPath());
            }
        });

        setContentView(web);
        /* 视图已经挂好，DecorView 存在了，这时才能碰 WindowInsetsController。
           页面脚本跑起来后会用真实主题再校正一次（ChromeBridge.setStatusBar）。 */
        applyStatusBar(firstBg, systemDark);
        web.loadUrl(ORIGIN);
    }

    /** JS 桥：网页调用 `window.cijianChrome.setStatusBar('#RRGGBB')`。 */
    public static final class ChromeBridge {
        private final MainActivity activity;

        ChromeBridge(MainActivity activity) {
            this.activity = activity;
        }

        @JavascriptInterface
        public void setStatusBar(String hex) {
            activity.onChromeColor(hex);
        }
    }

    /** 颜色可能不规范；解析失败就当没收到，保留上一帧的颜色。 */
    void onChromeColor(String hex) {
        final int color;
        try {
            color = Color.parseColor(hex);
        } catch (RuntimeException e) {
            return;
        }
        /* 图标明暗按**底色亮度**算，不看「主题叫浅色还是深色」：instrument 皮肤本来就是深的
           （浅色主题下也是 #0B0D0F），只看主题名会把深色图标压在近黑状态栏上。 */
        final boolean darkBg = Color.luminance(color) < 0.5f;
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                applyStatusBar(color, darkBg);
            }
        });
    }

    /**
     * 状态栏底色 + 图标明暗。API 30 起用 WindowInsetsController，之前用
     * SYSTEM_UI_FLAG_LIGHT_STATUS_BAR（minSdk 24，两条路都要留）。
     * API 30 的调用封在单独方法里：旧系统加载类时不会去解析不存在的方法。
     */
    private void applyStatusBar(int color, boolean dark) {
        Window window = getWindow();
        window.setStatusBarColor(color);
        if (Build.VERSION.SDK_INT >= 30) {
            applyStatusBarIcons30(window, dark);
            return;
        }
        window.getDecorView().setSystemUiVisibility(
                dark ? 0 : View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);
    }

    private static void applyStatusBarIcons30(Window window, boolean dark) {
        /* 必须从 DecorView 拿 controller：Window.getInsetsController() 在 DecorView 还没建好时
           会在框架内部抛 NPE（PhoneWindow.getInsetsController → mDecor.getWindowInsetsController），
           不是返回 null，所以外面判空救不了。DecorView 自己在没有 controller 时会返回 null。 */
        View decor = window.getDecorView();
        if (decor == null) return;
        WindowInsetsController controller = decor.getWindowInsetsController();
        if (controller == null) return;
        int mask = WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS;
        controller.setSystemBarsAppearance(dark ? 0 : mask, mask);
    }

    /** 把 URL 路径映射成 assets 里的文件。 */
    private WebResourceResponse serveAsset(String rawPath) {
        String path = (rawPath == null || rawPath.isEmpty() || "/".equals(rawPath)) ? "/index.html" : rawPath;
        if (path.contains("..")) return error(404, "Not Found");

        String assetPath = path.startsWith("/") ? path.substring(1) : path;

        // 见类注释：WebView 里不启用 Service Worker
        if ("sw.js".equals(assetPath)) return error(404, "Not Found");

        try {
            InputStream in = getAssets().open(assetPath, AssetManager.ACCESS_STREAMING);
            Map<String, String> headers = new HashMap<>();
            headers.put("Cache-Control", "no-cache");
            return new WebResourceResponse(mimeOf(assetPath), charsetOf(assetPath), 200, "OK", headers, in);
        } catch (IOException e) {
            return error(404, "Not Found");
        }
    }

    private static String extensionOf(String path) {
        int dot = path.lastIndexOf('.');
        return dot < 0 ? "" : path.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String mimeOf(String path) {
        switch (extensionOf(path)) {
            case "html": return "text/html";
            case "js":
            case "mjs": return "text/javascript";
            case "css": return "text/css";
            case "json": return "application/json";
            case "webmanifest": return "application/manifest+json";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg":
            case "jpeg": return "image/jpeg";
            case "woff2": return "font/woff2";
            case "woff": return "font/woff";
            case "ico": return "image/x-icon";
            case "txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    private static String charsetOf(String path) {
        String mime = mimeOf(path);
        boolean textual = mime.startsWith("text/")
                || mime.contains("json")
                || mime.contains("javascript")
                || mime.contains("xml");
        return textual ? "utf-8" : null;
    }

    private static WebResourceResponse error(int code, String message) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-store");
        return new WebResourceResponse("text/plain", "utf-8", code, message, headers,
                new ByteArrayInputStream(message.getBytes()));
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) {
            web.goBack();
            return;
        }
        super.onBackPressed();
    }

    @Override
    protected void onPause() {
        if (web != null) web.onPause();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (web != null) web.onResume();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.loadUrl("about:blank");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }
}
