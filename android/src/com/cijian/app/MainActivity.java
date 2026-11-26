package com.cijian.app;

import android.app.Activity;
import android.content.res.AssetManager;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
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
    private static final int BG = 0xFFF6F3EC; // 与 manifest 的 background_color 一致

    private WebView web;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.setStatusBarColor(BG);
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        web = new WebView(this);
        web.setBackgroundColor(BG);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);   // localStorage —— 学习进度全靠它
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100);             // 不跟随系统字号，避免版式被撑坏
        settings.setUseWideViewPort(true);     // 让 <meta viewport> 生效
        settings.setLoadWithOverviewMode(true);

        if (Build.VERSION.SDK_INT >= 33) {
            // App 自己处理深色模式（跟随系统或手动），别让系统再叠一层反色
            settings.setAlgorithmicDarkeningAllowed(false);
        }

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                if (request == null || request.getUrl() == null) return null;
                if (!HOST.equals(request.getUrl().getHost())) return null;
                return serveAsset(request.getUrl().getPath());
            }
        });

        setContentView(web);
        web.loadUrl(ORIGIN);
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
