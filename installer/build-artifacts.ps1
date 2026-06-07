param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"

# Run a native command (npm/dotnet) without letting its stderr output be treated as
# a terminating error (Windows PowerShell 5.1 wraps native stderr as ErrorRecords
# under -EA Stop). Success/failure is decided by the real exit code.
function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)][scriptblock]$Script,
        [Parameter(Mandatory = $true)][string]$What
    )
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { & $Script } finally { $ErrorActionPreference = $prev }
    if ($LASTEXITCODE -ne 0) { throw "$What failed (exit code $LASTEXITCODE)." }
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Resolve-Path (Join-Path $scriptDir "..")
$frontendDir = Join-Path $repoRoot "frontend"
$backendDir = Join-Path $repoRoot "backend"
$outputDir = Join-Path $repoRoot "artifacts\installer"
$publishDir = Join-Path $outputDir "backend-publish"

if (Test-Path $publishDir) {
    Remove-Item $publishDir -Recurse -Force
}

Write-Host "Building frontend..."
Push-Location $frontendDir
try {
    Invoke-Native { npm ci } 'npm ci'
    Invoke-Native { npm run build } 'npm run build'
}
finally { Pop-Location }

$backendWwwroot = Join-Path $backendDir "wwwroot"
if (Test-Path $backendWwwroot) {
    Remove-Item $backendWwwroot -Recurse -Force
}
New-Item -ItemType Directory -Path $backendWwwroot -Force | Out-Null
Copy-Item (Join-Path $frontendDir "dist\*") $backendWwwroot -Recurse -Force

Write-Host "Publishing backend..."
Push-Location $backendDir
try {
    Invoke-Native {
        dotnet publish "backend.csproj" `
            -c $Configuration `
            -r $Runtime `
            --self-contained true `
            /p:PublishSingleFile=true `
            /p:IncludeNativeLibrariesForSelfExtract=true `
            /p:PublishTrimmed=false `
            -o $publishDir
    } 'dotnet publish'
}
finally { Pop-Location }

# Safety: a dev .env must never ship inside the installer (it would override the
# generated appsettings.Production.json at runtime). Remove it if it slipped in.
$publishedEnv = Join-Path $publishDir ".env"
if (Test-Path $publishedEnv) {
    Remove-Item $publishedEnv -Force
    Write-Host "Removed stray .env from publish output."
}

Write-Host "Copying Hikvision SDK native dependencies..."
$sdkCandidates = @()
if (-not [string]::IsNullOrWhiteSpace($env:HIKVISION_SDK_PATH)) {
    $sdkCandidates += $env:HIKVISION_SDK_PATH
}
$isLinuxRuntime = $Runtime.StartsWith("linux-", [System.StringComparison]::OrdinalIgnoreCase)
$defaultSdkDir = if ($isLinuxRuntime) {
    Join-Path $repoRoot "linuxSDK\EN-HCNetSDKV6.1.9.48_build20230410_linux64\lib"
} else {
    Join-Path $repoRoot "winSDK\lib"
}
# HCNetSDK (не HPNetSDK) — требуется для NET_DVR_ActivateDevice. HPNetSDK исключён.
# The SDK normally lives under the repo root, but it is also kept under backend\
# (gitignored) — include both so the build finds it without HIKVISION_SDK_PATH.
$sdkCandidates += @(
    $defaultSdkDir,
    (Join-Path $repoRoot "backend\winSDK\lib"),
    (Join-Path $repoRoot "winSDK\lib"),
    (Join-Path $repoRoot "backend\linuxSDK\lib"),
    (Join-Path $repoRoot "linuxSDK\lib")
)

$sdkLibDir = $sdkCandidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path $_) } | Select-Object -First 1

# Для Windows: не переключаться на вложенные папки (HPNetSDK) — нужен HCNetSDK в winSDK\lib
if ($sdkLibDir -and -not $isLinuxRuntime) {
    $hasHcNetSdk = Test-Path (Join-Path $sdkLibDir "HCNetSDK.dll")
    if (-not $hasHcNetSdk) {
        Write-Warning "HCNetSDK.dll not found in $sdkLibDir. Ensure winSDK\lib contains full HCNetSDK (not HPNetSDK)."
    }
}

if (-not $sdkLibDir) {
    $expected = if ($isLinuxRuntime) { "linuxSDK\\lib or linuxSDK\\EN-HCNetSDK...\\lib" } else { "winSDK\\lib (HCNetSDK)" }
    Write-Warning "Hikvision SDK folder not found. Expected $expected or HIKVISION_SDK_PATH. Artifacts will be built without SDK native files."
}
else {
    Write-Host "Using SDK directory: $sdkLibDir"

    if ($isLinuxRuntime) {
        Copy-Item (Join-Path $sdkLibDir "*.so*") $publishDir -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $sdkLibDir "*.xml") $publishDir -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $sdkLibDir "*.conf") $publishDir -Force -ErrorAction SilentlyContinue
    }
    else {
        Copy-Item (Join-Path $sdkLibDir "*.dll") $publishDir -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $sdkLibDir "*.xml") $publishDir -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $sdkLibDir "*.properties") $publishDir -Force -ErrorAction SilentlyContinue
        Copy-Item (Join-Path $sdkLibDir "*.aac") $publishDir -Force -ErrorAction SilentlyContinue
    }

    $componentDirs = @("HCNetSDKCom", "HPStreamCom")
    foreach ($componentDirName in $componentDirs) {
        $componentDir = Join-Path $sdkLibDir $componentDirName
        if (Test-Path $componentDir) {
            $targetComponentDir = Join-Path $publishDir $componentDirName
            if (Test-Path $targetComponentDir) {
                Remove-Item $targetComponentDir -Recurse -Force
            }
            Copy-Item $componentDir $targetComponentDir -Recurse -Force
        }
    }

    $requiredNativeFiles = if ($isLinuxRuntime) {
        @("libhcnetsdk.so", "libHCCore.so", "libhpr.so")
    }
    else {
        @("hpr.dll")
    }

    $primarySdkFiles = if ($isLinuxRuntime) {
        @("libhcnetsdk.so", "libHCCore.so", "libhpr.so")
    } else {
        @("HCNetSDK.dll", "HCCore.dll", "hpr.dll")
    }
    foreach ($sdkFile in $primarySdkFiles) {
        if (Test-Path (Join-Path $publishDir $sdkFile)) {
            Write-Host "SDK file copied: $sdkFile"
        }
    }

    foreach ($nativeFile in $requiredNativeFiles) {
        if (-not (Test-Path (Join-Path $publishDir $nativeFile))) {
            Write-Warning "Required SDK dependency '$nativeFile' was not copied to publish output."
        }
    }
}

Write-Host "Artifacts ready at: $outputDir"
