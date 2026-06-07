<#
.SYNOPSIS
    Stops and removes the ProjectX nginx reverse-proxy service, firewall rule and
    installation directory.
#>
param(
    [string]$InstallRoot = "$env:ProgramData\ProjectX\nginx",
    [string]$ServiceName = "ProjectXNginx",
    [int]$ListenPort = 80,
    [bool]$RemoveFiles = $true
)

$ErrorActionPreference = "Continue"

$nssmExe = Join-Path $InstallRoot "nssm.exe"
if (Test-Path $nssmExe) {
    & $nssmExe stop $ServiceName 2>$null | Out-Null
    Start-Sleep -Seconds 1
    & $nssmExe remove $ServiceName confirm 2>$null | Out-Null
}
else {
    sc.exe stop $ServiceName 2>$null | Out-Null
    sc.exe delete $ServiceName 2>$null | Out-Null
}

# Kill any stray nginx workers.
Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

$ruleName = "ProjectX nginx ($ListenPort)"
Get-NetFirewallRule -DisplayName $ruleName -ErrorAction SilentlyContinue | Remove-NetFirewallRule -ErrorAction SilentlyContinue

if ($RemoveFiles -and (Test-Path $InstallRoot)) {
    Start-Sleep -Seconds 1
    Remove-Item $InstallRoot -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "nginx service '$ServiceName' removed."
