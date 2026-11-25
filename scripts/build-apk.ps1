# 把 dist/ 打进一个可侧载的 APK（不依赖 Gradle / Android Studio）
# 用法: pwsh -File D:\AndroidBuild\build.ps1
$ErrorActionPreference = 'Stop'

$Work = 'D:\AndroidBuild'
$JdkHome = Join-Path $Work 'jdk'
$Sdk = Join-Path $Work 'sdk'
$bt = Join-Path $Sdk 'build-tools\34.0.0'
$androidJar = Join-Path $Sdk 'platforms\android-34\android.jar'
$java = Join-Path $JdkHome 'bin\java.exe'
$javac = Join-Path $JdkHome 'bin\javac.exe'
$keytool = Join-Path $JdkHome 'bin\keytool.exe'
$d8Jar = Join-Path $bt 'lib\d8.jar'
$signerJar = Join-Path $bt 'lib\apksigner.jar'
$ks = Join-Path $Work 'cijian.keystore'
$ksPass = 'cijian2026'
$outApk = Join-Path $Work 'cijian-1.0.apk'

foreach ($p in $java, $javac, $androidJar, $d8Jar, $signerJar) {
    if (-not (Test-Path $p)) { throw "缺少工具: $p" }
}

Set-Location $Work

# 1) 编译 Java → class
Write-Host '== 1/6 javac =='
$classes = Join-Path $Work 'classes'
Remove-Item $classes -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $classes | Out-Null
$sources = (Get-ChildItem (Join-Path $Work 'src') -Recurse -Filter *.java).FullName
& $javac --release 8 -encoding UTF-8 -cp $androidJar -d $classes $sources
if ($LASTEXITCODE -ne 0) { throw 'javac 失败' }

# 2) class → dex
Write-Host '== 2/6 d8 =='
$dexDir = Join-Path $Work 'dex'
Remove-Item $dexDir -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $dexDir | Out-Null
$classFiles = (Get-ChildItem $classes -Recurse -Filter *.class).FullName
& $java -cp $d8Jar com.android.tools.r8.D8 --min-api 24 --output $dexDir $classFiles
if ($LASTEXITCODE -ne 0) { throw 'd8 失败' }

# 3) 打包资源 + assets（生成未签名 APK）
Write-Host '== 3/6 aapt package =='
$base = Join-Path $Work 'base.apk'
Remove-Item $base -Force -ErrorAction SilentlyContinue
& (Join-Path $bt 'aapt.exe') package -f -M AndroidManifest.xml -S res -A assets -I $androidJar -F $base --min-sdk-version 24 --target-sdk-version 34
if ($LASTEXITCODE -ne 0) { throw 'aapt package 失败' }

# 4) 把 classes.dex 塞进 APK 根目录
Write-Host '== 4/6 aapt add classes.dex =='
Push-Location $dexDir
& (Join-Path $bt 'aapt.exe') add $base 'classes.dex'
if ($LASTEXITCODE -ne 0) { Pop-Location; throw 'aapt add 失败' }
Pop-Location

# 5) 对齐
Write-Host '== 5/6 zipalign =='
$aligned = Join-Path $Work 'aligned.apk'
Remove-Item $aligned -Force -ErrorAction SilentlyContinue
& (Join-Path $bt 'zipalign.exe') -f 4 $base $aligned
if ($LASTEXITCODE -ne 0) { throw 'zipalign 失败' }

# 6) 签名（首次自动生成 keystore，之后复用 —— 丢了就无法给同一包名发新版）
Write-Host '== 6/6 签名 =='
if (-not (Test-Path $ks)) {
    & $keytool -genkeypair -keystore $ks -alias cijian -keyalg RSA -keysize 2048 -validity 10000 `
        -storepass $ksPass -keypass $ksPass `
        -dname 'CN=CiJian, OU=Personal, O=CiJian, L=Local, C=CN'
    if ($LASTEXITCODE -ne 0) { throw '生成 keystore 失败' }
}
Remove-Item $outApk -Force -ErrorAction SilentlyContinue
& $java -jar $signerJar sign --ks $ks --ks-key-alias cijian --ks-pass "pass:$ksPass" --key-pass "pass:$ksPass" --out $outApk $aligned
if ($LASTEXITCODE -ne 0) { throw 'apksigner 失败' }

Write-Host '== 校验 =='
& $java -jar $signerJar verify --print-certs $outApk
& (Join-Path $bt 'aapt.exe') dump badging $outApk | Select-String -Pattern 'package:|application-label|launchable-activity|sdkVersion|targetSdkVersion'

Write-Host ("产物: {0}  {1} MB" -f $outApk, [math]::Round((Get-Item $outApk).Length / 1MB, 2))
