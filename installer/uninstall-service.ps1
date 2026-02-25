param(
    [string]$ServiceName = "ProjectXBackend",
    [string]$InstallDir = "$env:ProgramFiles\ProjectX\Backend"
)

$ErrorActionPreference = "Continue"

sc.exe stop $ServiceName | Out-Null
Start-Sleep -Seconds 2
sc.exe delete $ServiceName | Out-Null

if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}

Write-Host "Service '$ServiceName' removed."
