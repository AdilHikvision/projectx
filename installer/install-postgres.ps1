<#
.SYNOPSIS
    Installs PostgreSQL natively on the server (no Docker) and creates the ProjectX
    application database and user.

.DESCRIPTION
    1. If a PostgreSQL service already exists, the engine install is skipped.
    2. Otherwise the EDB Windows installer is downloaded and run unattended
       (silent, native service). winget is used as a fallback.
    3. The service is started and the application role + database are created
       (idempotently) so the backend can connect immediately after install.

.NOTES
    Run elevated. SuperPassword is the PostgreSQL superuser ("postgres") password
    set on a fresh install; it is required to create the app role/database.
#>
param(
    [string]$Version = "16",
    [string]$DbName = "projectx",
    [string]$DbUser = "projectx_user",
    [string]$DbPassword = "",
    [int]$DbPort = 5432,
    [string]$SuperPassword = "",
    [string]$InstallerUrl = "",
    [string]$LogPath = "$env:TEMP\ProjectX-install-postgres.log"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
    $logDir = Split-Path -Parent $LogPath
    if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Start-Transcript -Path $LogPath -Append | Out-Null
}

# Default EDB installer URLs (native Windows, no Docker). Override with -InstallerUrl
# or the POSTGRES_INSTALLER_URL environment variable.
$edbUrls = @{
    "16" = "https://get.enterprisedb.com/postgresql/postgresql-16.4-1-windows-x64.exe"
    "15" = "https://get.enterprisedb.com/postgresql/postgresql-15.8-1-windows-x64.exe"
    "17" = "https://get.enterprisedb.com/postgresql/postgresql-17.0-1-windows-x64.exe"
}
$serviceName = "postgresql-x64-$Version"

function Find-Psql {
    # Include the native 64-bit Program Files (ProgramW6432) and a hardcoded path so
    # this works even if launched from a 32-bit host where $env:ProgramFiles points
    # to "Program Files (x86)" (PostgreSQL is 64-bit).
    $roots = @(
        $env:ProgramFiles,
        ${env:ProgramFiles(x86)},
        $env:ProgramW6432,
        "C:\Program Files",
        "C:\Program Files (x86)"
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique

    foreach ($r in $roots) {
        $p = Join-Path $r "PostgreSQL\$Version\bin\psql.exe"
        if (Test-Path $p) { return $p }
    }
    $cmd = Get-Command psql.exe -ErrorAction SilentlyContinue
    if ($cmd) { return $cmd.Source }
    foreach ($r in $roots) {
        $pgRoot = Join-Path $r "PostgreSQL"
        if (Test-Path $pgRoot) {
            $found = Get-ChildItem $pgRoot -Recurse -Filter "psql.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { return $found.FullName }
        }
    }
    return $null
}

function Get-PostgresService {
    Get-Service -Name "postgresql*" -ErrorAction SilentlyContinue | Select-Object -First 1
}

try {
    $pg = Get-PostgresService
    $engineAlreadyPresent = [bool]$pg

    if ($engineAlreadyPresent) {
        Write-Host "PostgreSQL service already present: $($pg.Name). Skipping engine install."
        $serviceName = $pg.Name
    }
    else {
        # ── Install engine (EDB unattended; winget fallback) ──────────────────────
        $url = $InstallerUrl
        if ([string]::IsNullOrWhiteSpace($url)) { $url = $env:POSTGRES_INSTALLER_URL }
        if ([string]::IsNullOrWhiteSpace($url)) { $url = $edbUrls[$Version] }

        $installedViaEdb = $false
        if (-not [string]::IsNullOrWhiteSpace($url)) {
            try {
                $exe = Join-Path $env:TEMP "postgresql-$Version-setup.exe"
                Write-Host "Downloading PostgreSQL $Version installer ..."
                Write-Host "  $url"
                Invoke-WebRequest -Uri $url -OutFile $exe -UseBasicParsing -TimeoutSec 600

                if ([string]::IsNullOrWhiteSpace($SuperPassword)) {
                    # Need a superuser password for unattended install; reuse app password.
                    $SuperPassword = $DbPassword
                }
                if ([string]::IsNullOrWhiteSpace($SuperPassword)) {
                    throw "A PostgreSQL superuser password is required for unattended install."
                }

                Write-Host "Running unattended PostgreSQL install (native service '$serviceName', port $DbPort) ..."
                $args = @(
                    "--mode", "unattended",
                    "--unattendedmodeui", "none",
                    "--superpassword", $SuperPassword,
                    "--servicename", $serviceName,
                    "--serverport", "$DbPort",
                    "--enable-components", "server,commandlinetools",
                    "--disable-components", "pgAdmin,stackbuilder"
                )
                $p = Start-Process -FilePath $exe -ArgumentList $args -Wait -PassThru
                if ($p.ExitCode -ne 0) { throw "PostgreSQL installer exited with code $($p.ExitCode)." }
                Remove-Item $exe -Force -ErrorAction SilentlyContinue
                $installedViaEdb = $true
                Write-Host "PostgreSQL installed natively."
            }
            catch {
                Write-Warning "EDB unattended install failed: $($_.Exception.Message)"
            }
        }

        if (-not $installedViaEdb) {
            Write-Host "Falling back to winget ..."
            try {
                winget --version | Out-Null
                winget install --id "PostgreSQL.PostgreSQL.$Version" --silent `
                    --accept-package-agreements --accept-source-agreements
                if ($LASTEXITCODE -ne 0) { throw "winget exit code $LASTEXITCODE." }
                Write-Warning "Installed via winget. The superuser password is unknown, so the app DB/user may need to be created manually."
            }
            catch {
                Write-Warning "Automatic PostgreSQL install failed: $($_.Exception.Message)"
                Write-Host "Opening PostgreSQL download page for manual install ..."
                Start-Process "https://www.postgresql.org/download/windows/"
                throw "PostgreSQL must be installed manually, then re-run the installer."
            }
        }
    }

    # ── Ensure service is running ──────────────────────────────────────────────────
    $pg = Get-PostgresService
    if (-not $pg) { throw "PostgreSQL service not found after install." }
    $serviceName = $pg.Name
    if ($pg.Status -ne 'Running') {
        Write-Host "Starting service $serviceName ..."
        Start-Service -Name $serviceName
        Start-Sleep -Seconds 3
    }

    # ── Create / update application role + database (idempotent) ────────────────────
    # The superuser password is set only once (at the original EDB install) and can
    # never be recovered afterwards. So we persist it to the registry and, on a
    # pre-existing engine where the password passed in this run is wrong, fall back
    # to the persisted value. The role password is always synced (ALTER ROLE) so it
    # matches what the backend writes into appsettings.Production.json.
    $regPath = "HKLM:\SOFTWARE\ProjectX"
    $savedSuper = $null
    try { $savedSuper = (Get-ItemProperty -Path $regPath -Name "PgSuperPassword" -ErrorAction Stop)."PgSuperPassword" } catch {}

    $psql = Find-Psql
    if (-not $psql) {
        Write-Warning "psql.exe not found. Create database $DbName and user $DbUser manually."
    }
    else {
        # Candidate superuser passwords, tried in order: the one passed this run,
        # the persisted one, then the app password (used on unattended EDB installs).
        $candidates = @()
        foreach ($p in @($SuperPassword, $savedSuper, $DbPassword)) {
            if (-not [string]::IsNullOrWhiteSpace($p) -and ($candidates -notcontains $p)) { $candidates += $p }
        }

        $workingSuper = $null
        foreach ($c in $candidates) {
            $env:PGPASSWORD = $c
            try {
                & $psql -U postgres -h 127.0.0.1 -p $DbPort -tAc "SELECT 1" *> $null
                if ($LASTEXITCODE -eq 0) { $workingSuper = $c; break }
            }
            catch {}
            finally { Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue }
        }

        if (-not $workingSuper) {
            Write-Warning "Could not authenticate as the PostgreSQL superuser on the existing engine."
            Write-Warning "Run installer/repair-clean-db.ps1 for a clean reinstall, or create role '$DbUser' + database '$DbName' (owner $DbUser) manually."
            throw "PostgreSQL superuser authentication failed; cannot create the application role/database."
        }

        Write-Host "Ensuring role $DbUser and database $DbName exist (password synced) ..."

        # Build SQL without any literal quote chars in source (avoids escaping pitfalls).
        # q = double-quote (identifier quoting), sq = single-quote, dq = SQL-escaped quote.
        $q = [char]34
        $sq = [char]39
        # SQL-escape single quotes via the -replace operator (String.Replace(char,..)
        # would bind to the char,char overload and fail on the 2-char replacement).
        $escPwd = $DbPassword -replace "'", "''"
        $do = [char]36 + "do" + [char]36   # $do$ dollar-quote tag for the DO block

        $createDb = "CREATE DATABASE $q$DbName$q OWNER $q$DbUser$q"
        $dbLit = $sq + ($createDb -replace "'", "''") + $sq

        # Upsert the role (CREATE if missing, else ALTER) so its password ALWAYS
        # matches the one the backend will use. Database create stays idempotent.
        $sqlLines = @(
            "DO $do"
            "BEGIN"
            "  IF EXISTS (SELECT FROM pg_roles WHERE rolname = $sq$DbUser$sq) THEN"
            "    ALTER ROLE $q$DbUser$q WITH LOGIN PASSWORD $sq$escPwd$sq;"
            "  ELSE"
            "    CREATE ROLE $q$DbUser$q LOGIN PASSWORD $sq$escPwd$sq;"
            "  END IF;"
            "END"
            "$do;"
            "SELECT $dbLit WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = $sq$DbName$sq)\gexec"
            "GRANT ALL PRIVILEGES ON DATABASE $q$DbName$q TO $q$DbUser$q;"
        )

        $sqlFile = Join-Path $env:TEMP "projectx-create-db.sql"
        Set-Content -Path $sqlFile -Value $sqlLines -Encoding ascii

        $env:PGPASSWORD = $workingSuper
        try {
            & $psql -U postgres -h 127.0.0.1 -p $DbPort -v ON_ERROR_STOP=1 -f $sqlFile
            if ($LASTEXITCODE -ne 0) { throw "psql returned exit code $LASTEXITCODE." }
            Write-Host "Role $DbUser and database $DbName are ready (password in sync with appsettings)."

            # Persist the working superuser password so future installs/updates can
            # manage this engine without prompting.
            try {
                if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
                New-ItemProperty -Path $regPath -Name "PgSuperPassword" -Value $workingSuper -PropertyType String -Force | Out-Null
            }
            catch { Write-Warning "Could not persist superuser password to registry: $($_.Exception.Message)" }
        }
        catch {
            Write-Warning "Could not create/update app role/database automatically: $($_.Exception.Message)"
            throw
        }
        finally {
            Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
            Remove-Item $sqlFile -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "PostgreSQL setup complete (service: $serviceName, port: $DbPort)."
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($LogPath)) { Stop-Transcript | Out-Null }
}
