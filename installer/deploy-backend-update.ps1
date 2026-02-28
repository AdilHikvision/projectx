param(
    [string]$SourceDir = "$PSScriptRoot\..\artifacts\installer\backend-publish",
    [string]$InstallDir = "$env:ProgramFiles(x86)\ProjectX\Backend",
    [string]$ServiceName = "ProjectXBackend",
    [string]$LogPath = "$env:TEMP\ProjectX-deploy-backend-update.log"
)

$ErrorActionPreference = "Stop"
Start-Transcript -Path $LogPath -Append | Out-Null
try {
    if (-not (Test-Path $SourceDir)) {
        throw "SourceDir not found: $SourceDir"
    }

    if (-not (Test-Path $InstallDir)) {
        throw "InstallDir not found: $InstallDir"
    }

    sc.exe stop $ServiceName | Out-Null
    Start-Sleep -Seconds 2

    robocopy $SourceDir $InstallDir /E /NFL /NDL /NJH /NJS /NP | Out-Null
    $rc = $LASTEXITCODE
    if ($rc -ge 8) {
        throw "robocopy failed with exit code $rc"
    }

    sc.exe start $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    $svc = Get-Service -Name $ServiceName -ErrorAction Stop
    if ($svc.Status -ne "Running") {
        throw "Service '$ServiceName' is not running after deploy."
    }

    Write-Host "Backend deploy completed successfully."
}
finally {
    Stop-Transcript | Out-Null
}
