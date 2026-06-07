<#
.SYNOPSIS
    Generates branded Inno Setup wizard images (BMP) in the ProjectX colors.
    Run once (or after a logo/color change). Outputs to installer\branding\.
#>
param(
    [string]$Logo = "$PSScriptRoot\..\frontend\public\web-app-manifest-512x512.png",
    [string]$OutDir = "$PSScriptRoot\branding"
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$primary = [System.Drawing.ColorTranslator]::FromHtml('#aa9ad4')
$dark    = [System.Drawing.ColorTranslator]::FromHtml('#7d6bb0')
$white   = [System.Drawing.Color]::White

if (-not (Test-Path $OutDir)) { New-Item -ItemType Directory -Path $OutDir -Force | Out-Null }
$logoImg = $null
if (Test-Path $Logo) { $logoImg = [System.Drawing.Image]::FromFile($Logo) }

function New-LargeImage([int]$w, [int]$h, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.TextRenderingHint = 'ClearTypeGridFit'
    # Diagonal brand gradient.
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $primary, $dark, 60.0
    $g.FillRectangle($brush, $rect)
    # Logo, centered upper third.
    if ($logoImg) {
        $ls = [int]($w * 0.42)
        $lx = [int](($w - $ls) / 2)
        $ly = [int]($h * 0.22)
        $g.DrawImage($logoImg, $lx, $ly, $ls, $ls)
    }
    # Wordmark.
    $fontMain = New-Object System.Drawing.Font 'Segoe UI', ([single]($w * 0.13)), ([System.Drawing.FontStyle]::Bold)
    $fontSub  = New-Object System.Drawing.Font 'Segoe UI', ([single]($w * 0.052)), ([System.Drawing.FontStyle]::Regular)
    $sf = New-Object System.Drawing.StringFormat
    $sf.Alignment = 'Center'
    $wb = New-Object System.Drawing.SolidBrush $white
    $g.DrawString('ProjectX', $fontMain, $wb, (New-Object System.Drawing.RectangleF 0, ([single]($h * 0.52)), $w, ([single]($h * 0.2))), $sf)
    $semi = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
    $g.DrawString('Security Platform', $fontSub, $semi, (New-Object System.Drawing.RectangleF 0, ([single]($h * 0.66)), $w, ([single]($h * 0.1))), $sf)
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bmp.Dispose()
    Write-Host "wrote $path ($w x $h)"
}

function New-SmallImage([int]$s, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap $s, $s
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = 'AntiAlias'
    $g.InterpolationMode = 'HighQualityBicubic'
    $g.Clear($white)
    if ($logoImg) {
        $pad = [int]($s * 0.12)
        $g.DrawImage($logoImg, $pad, $pad, ($s - 2 * $pad), ($s - 2 * $pad))
    }
    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bmp.Dispose()
    Write-Host "wrote $path ($s x $s)"
}

New-LargeImage 164 314 (Join-Path $OutDir 'wizard-large.bmp')
New-LargeImage 328 628 (Join-Path $OutDir 'wizard-large@2x.bmp')
New-LargeImage 492 942 (Join-Path $OutDir 'wizard-large@3x.bmp')
New-SmallImage 58  (Join-Path $OutDir 'wizard-small.bmp')
New-SmallImage 116 (Join-Path $OutDir 'wizard-small@2x.bmp')
New-SmallImage 174 (Join-Path $OutDir 'wizard-small@3x.bmp')

if ($logoImg) { $logoImg.Dispose() }
Write-Host "Branding images ready in $OutDir"
