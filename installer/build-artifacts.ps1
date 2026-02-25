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

Write-Host "Artifacts ready at: $outputDir"
