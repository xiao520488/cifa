$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
$ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
$dir = Join-Path $PSScriptRoot 'fonts'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

$targets = @(
  @{ name = 'space-grotesk';  css = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap' },
  @{ name = 'ibm-plex-mono';  css = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap' },
  @{ name = 'ibm-plex-sans';  css = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&display=swap' },
  @{ name = 'instrument-serif'; css = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&display=swap' }
)

foreach ($t in $targets) {
  $r = Invoke-WebRequest -Uri $t.css -UseBasicParsing -Headers @{ 'User-Agent' = $ua }
  $css = $r.Content
  # 只保留 latin 段（含 unicode-range U+0000-00FF 的块）
  $blocks = ($css -split '(?=/\*)') | Where-Object { $_ -match 'latin' -and $_ -match 'U\+0000-00FF' }
  $i = 0
  foreach ($b in $blocks) {
    if ($b -notmatch 'url\((https://[^)]+\.woff2)\)') { continue }
    $url = $Matches[1]
    $weight = if ($b -match 'font-weight:\s*(\d+)') { $Matches[1] } else { 'var' }
    $style  = if ($b -match 'font-style:\s*(\w+)') { $Matches[1] } else { 'normal' }
    $file = if ($blocks.Count -gt 1) { "$($t.name)-$weight-$style.woff2" } else { "$($t.name).woff2" }
    $out = Join-Path $dir $file
    if (-not (Test-Path $out)) {
      Invoke-WebRequest -Uri $url -UseBasicParsing -Headers @{ 'User-Agent' = $ua } -OutFile $out
    }
    $i++
    "OK  $file  $([math]::Round((Get-Item $out).Length/1024,1)) KB"
  }
}
"---"
Get-ChildItem $dir -Filter *.woff2 | Select-Object Name, Length | Format-Table -AutoSize
