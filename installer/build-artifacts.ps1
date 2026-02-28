param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64"
)

$ErrorActionPreference = "Stop"

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
npm ci
npm run build
Pop-Location

$backendWwwroot = Join-Path $backendDir "wwwroot"
if (Test-Path $backendWwwroot) {
    Remove-Item $backendWwwroot -Recurse -Force
}
New-Item -ItemType Directory -Path $backendWwwroot -Force | Out-Null
Copy-Item (Join-Path $frontendDir "dist\*") $backendWwwroot -Recurse -Force

Write-Host "Publishing backend..."
Push-Location $backendDir
dotnet publish "backend.csproj" `
    -c $Configuration `
    -r $Runtime `
    --self-contained true `
    /p:PublishSingleFile=true `
    /p:IncludeNativeLibrariesForSelfExtract=true `
    /p:PublishTrimmed=false `
    -o $publishDir
Pop-Location

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
$sdkCandidates += @(
    (Join-Path $repoRoot "winSDK\lib\HPNetSDK"),
    $defaultSdkDir,
    (Join-Path $repoRoot "linuxSDK\lib")
)

$sdkLibDir = $sdkCandidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path $_) } | Select-Object -First 1

if ($sdkLibDir -and -not $isLinuxRuntime) {
    $hasDlls = (Get-ChildItem -Path $sdkLibDir -Filter "*.dll" -File -ErrorAction SilentlyContinue | Select-Object -First 1)
    if (-not $hasDlls) {
        $nestedWithDlls = Get-ChildItem -Path $sdkLibDir -Directory -ErrorAction SilentlyContinue |
            Where-Object { Get-ChildItem -Path $_.FullName -Filter "*.dll" -File -ErrorAction SilentlyContinue } |
            Select-Object -First 1
        if ($nestedWithDlls) {
            $sdkLibDir = $nestedWithDlls.FullName
        }
    }
}

if (-not $sdkLibDir) {
    $expected = if ($isLinuxRuntime) { "linuxSDK\\EN-HCNetSDK...\\lib" } else { "winSDK\\lib or winSDK\\lib\\HPNetSDK" }
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
        @("HCNetSDK.dll", "HPNetSDK.dll", "HCCore.dll", "hpr.dll")
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
