<#
.SYNOPSIS
    Clean native-PostgreSQL repair for an installed ProjectX backend.

.DESCRIPTION
    DESTRUCTIVE. Removes any existing native PostgreSQL instance(s) and their data,
    installs PostgreSQL fresh on the server (no Docker), creates the app role +
    database, removes any stray .env from the install dir, and (re)starts the
    ProjectXBackend service.

    Use this when the installed service fails to start because the target database
    (projectx) does not exist on the native PostgreSQL.

.NOTES
    RUN AS ADMINISTRATOR. This deletes existing PostgreSQL data on this machine.
#>
param(
    [string]$DbName = "projectx",
    [string]$DbUser = "projectx_user",
    [string]$DbPassword = "ProjectX123!",
    [int]$DbPort = 5432,
    [string]$PgVersion = "16",
    [string]$ServiceName = "ProjectXBackend",
    [string]$BackendInstallDir = "",
    [string]$LogPath = "$env:TEMP\ProjectX-repair-clean-db.log"
)

$ErrorActionPreference = "Stop"
if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
    $d = Split-Path -Parent $LogPath
    if ($d -and -not (Test-Path $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    Start-Transcript -Path $LogPath -Append | Out-Null
}

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    return ([Security.Principal.WindowsPrincipal]$id).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

try {
    if (-not (Test-Admin)) { throw "Run this script as Administrator." }

    # Resolve where the backend was installed (32-bit installer -> Program Files (x86)).
    if ([string]::IsNullOrWhiteSpace($BackendInstallDir)) {
        foreach ($c in @("${env:ProgramFiles(x86)}\ProjectX\Backend", "$env:ProgramFiles\ProjectX\Backend")) {
            if (Test-Path (Join-Path $c "backend.exe")) { $BackendInstallDir = $c; break }
        }
    }
    Write-Host "Backend install dir: $BackendInstallDir"

    # ── 1) Stop the ProjectX service ────────────────────────────────────────────
    $svc = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    if ($svc) {
        Write-Host "Stopping $ServiceName ..."
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
    }

    # ── 2) Uninstall existing native PostgreSQL + data (DESTRUCTIVE) ─────────────
    Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "Stopping PostgreSQL service $($_.Name) ..."
        Stop-Service -Name $_.Name -Force -ErrorAction SilentlyContinue
    }
    $pgRoots = @("$env:ProgramFiles\PostgreSQL", "${env:ProgramFiles(x86)}\PostgreSQL")
    foreach ($root in $pgRoots) {
        if (-not (Test-Path $root)) { continue }
        Get-ChildItem $root -Directory -ErrorAction SilentlyContinue | ForEach-Object {
            $uninst = Join-Path $_.FullName "uninstall-postgresql.exe"
            if (Test-Path $uninst) {
                Write-Host "Uninstalling PostgreSQL at $($_.FullName) (unattended) ..."
                Start-Process -FilePath $uninst -ArgumentList @("--mode", "unattended") -Wait
            }
        }
    }
    # Remove lingering services + leftover data dirs.
    Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | ForEach-Object {
        sc.exe delete $_.Name | Out-Null
    }
    Start-Sleep -Seconds 2
    foreach ($root in $pgRoots) {
        if (Test-Path $root) { Remove-Item $root -Recurse -Force -ErrorAction SilentlyContinue }
    }

    # ── 3) Fresh native install + create app role/database ──────────────────────
    $installPg = Join-Path $PSScriptRoot "install-postgres.ps1"
    if (-not (Test-Path $installPg)) { throw "install-postgres.ps1 not found next to this script." }
    Write-Host "Installing PostgreSQL fresh and creating $DbName / $DbUser ..."
    & $installPg -Version $PgVersion -DbName $DbName -DbUser $DbUser -DbPassword $DbPassword `
        -DbPort $DbPort -SuperPassword $DbPassword
    if ($LASTEXITCODE -ne 0 -and $null -ne $LASTEXITCODE) { throw "install-postgres.ps1 failed (exit $LASTEXITCODE)." }

    # ── 4) Remove stray .env so the service uses appsettings.Production.json ─────
    if (-not [string]::IsNullOrWhiteSpace($BackendInstallDir)) {
        $strayEnv = Join-Path $BackendInstallDir ".env"
        if (Test-Path $strayEnv) {
            Remove-Item $strayEnv -Force
            Write-Host "Removed stray .env from $BackendInstallDir."
        }
    }

    # ── 5) Start the service ─────────────────────────────────────────────────────
    Write-Host "Starting $ServiceName ..."
    Start-Service -Name $ServiceName
    Start-Sleep -Seconds 3
    $svc = Get-Service -Name $ServiceName -ErrorAction Stop
    if ($svc.Status -ne 'Running') { throw "$ServiceName is not running after start." }

    Write-Host ""
    Write-Host "Repair complete. $ServiceName is running."
    Write-Host "  DB: $DbName @ localhost:$DbPort (user $DbUser), native PostgreSQL $PgVersion."
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($LogPath)) { Stop-Transcript | Out-Null }
}
