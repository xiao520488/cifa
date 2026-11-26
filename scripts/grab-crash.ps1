# 抓启动崩溃的堆栈（1.4 一装上就「屡次停止运行」）
# 用法：手机插上 USB + 打开「USB 调试」+ 手机上点「允许」之后，
#       pwsh -File D:\背单词\scripts\grab-crash.ps1
# 产物：out\crash.log（完整）与屏幕上打印的 FATAL EXCEPTION 段；只读，不改手机上的任何东西。
param(
    [string]$Pkg = 'com.cijian.app',
    [int]$WaitSeconds = 5
)
$ErrorActionPreference = 'Stop'
$adb = 'D:\AndroidBuild\platform-tools\adb.exe'
if (-not (Test-Path $adb)) { throw "缺少 adb：$adb" }

& $adb start-server | Out-Null
$devices = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match '\S' }
if (-not $devices) { throw '没有设备：插上 USB、打开「USB 调试」、手机上点「允许」，再跑一次。' }
Write-Host "设备：$($devices -join ', ')"

$sdk = (& $adb shell getprop ro.build.version.sdk).Trim()
$rel = (& $adb shell getprop ro.build.version.release).Trim()
$model = (& $adb shell getprop ro.product.model).Trim()
Write-Host "型号=$model Android=$rel (API $sdk)"
$installed = (& $adb shell dumpsys package $Pkg | Select-String 'versionCode=|versionName=' | ForEach-Object { $_.Line.Trim() })
Write-Host "已安装：$($installed -join ' / ')"

# 清空崩溃缓冲，冷启动一次，等它崩
& $adb logcat -c 2>&1 | Out-Null
& $adb shell am force-stop $Pkg 2>&1 | Out-Null
& $adb shell am start -n "$Pkg/.MainActivity" 2>&1 | Out-Null
Start-Sleep -Seconds $WaitSeconds

$log = Join-Path 'D:\背单词\out' 'crash.log'
& $adb logcat -d -b crash -b system -b main *> $log
& $adb shell pidof $Pkg 2>&1 | ForEach-Object { Write-Host "运行中的 pid：$($_.Trim())（空 = 已崩/未起来）" }

$lines = Get-Content $log -Encoding UTF8
$hit = $lines | Select-String -Pattern 'FATAL EXCEPTION|AndroidRuntime|Caused by' -Context 0, 25
if (-not $hit) {
    Write-Host 'crash 缓冲里没有 FATAL EXCEPTION。把 out\crash.log 发我，或确认装的是 cijian-1.4.apk。'
} else {
    $hit | ForEach-Object { $_.Line; $_.Context.PostContext } | Select-Object -First 60
}
Write-Host "完整日志：$log"
