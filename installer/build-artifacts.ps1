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
$defaultSdkDir = if ($isLinuxRuntime) { Join-Path $repoRoot "linuxSDK\lib" } else { Join-Path $repoRoot "winSDK\lib" }
$sdkCandidates += $defaultSdkDir

$sdkLibDir = $sdkCandidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) -and (Test-Path $_) } | Select-Object -First 1

if (-not $sdkLibDir) {
    $expected = if ($isLinuxRuntime) { "linuxSDK\lib" } else { "winSDK\lib" }
    Write-Warning "Hikvision SDK folder not found. Expected $expected or HIKVISION_SDK_PATH. Artifacts will be built without SDK native files."
}
else {
    Write-Host "Using SDK directory: $sdkLibDir"

    if ($isLinuxRuntime) {
        Copy-Item (Join-Path $sdkLibDir "*.so*") $publishDir -Force -ErrorAction SilentlyContinue
    }
    else {
        Copy-Item (Join-Path $sdkLibDir "*.dll") $publishDir -Force -ErrorAction SilentlyContinue
    }

    $sdkComDir = Join-Path $sdkLibDir "HCNetSDKCom"
    if (Test-Path $sdkComDir) {
        $targetComDir = Join-Path $publishDir "HCNetSDKCom"
        if (Test-Path $targetComDir) {
            Remove-Item $targetComDir -Recurse -Force
        }
        Copy-Item $sdkComDir $targetComDir -Recurse -Force
    }
    else {
        Write-Warning "HCNetSDKCom folder is missing in '$sdkLibDir'."
    }

    $requiredNativeFiles = if ($isLinuxRuntime) {
        @("libhcnetsdk.so", "libHCCore.so", "libhpr.so")
    }
    else {
        @("HCNetSDK.dll", "HCCore.dll", "hpr.dll")
    }
    foreach ($nativeFile in $requiredNativeFiles) {
        if (-not (Test-Path (Join-Path $publishDir $nativeFile))) {
            Write-Warning "Required SDK dependency '$nativeFile' was not copied to publish output."
        }
    }
}

Write-Host "Artifacts ready at: $outputDir"
