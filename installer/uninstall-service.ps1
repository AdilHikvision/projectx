param(
    [string]$ServiceName = "ProjectXBackend",
    [string]$InstallDir = "$env:ProgramFiles\ProjectX\Backend"
)

$ErrorActionPreference = "Continue"

sc.exe stop $ServiceName | Out-Null
Start-Sleep -Seconds 2
sc.exe delete $ServiceName | Out-Null

$startupShortcut = Join-Path ([Environment]::GetFolderPath("Startup")) "ProjectX Tray Monitor.lnk"
$menuShortcut = Join-Path ([Environment]::GetFolderPath("Programs")) "ProjectX Tray Monitor.lnk"
if (Test-Path $startupShortcut) {
    Remove-Item $startupShortcut -Force
}
if (Test-Path $menuShortcut) {
    Remove-Item $menuShortcut -Force
}

if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}

Write-Host "Service '$ServiceName' removed."
