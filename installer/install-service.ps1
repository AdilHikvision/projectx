param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,

    [string]$InstallDir = "$env:ProgramFiles\ProjectX\Backend",
    [string]$ServiceName = "ProjectXBackend",
    [string]$ServiceDisplayName = "ProjectX Backend Service",
    [string]$ServiceDescription = "ProjectX API and local dashboard service",
    [string]$ApiUrls = "http://localhost:5055",
    [string]$DashboardUrl = "http://localhost:5055/system",

    [string]$DbHost = "localhost",
    [int]$DbPort = 5432,
    [string]$DbName = "projectx",
    [string]$DbUser = "projectx_user",
    [Parameter(Mandatory = $true)]
    [string]$DbPassword,

    [string]$JwtIssuer = "projectx-api",
    [string]$JwtAudience = "projectx-frontend",
    [Parameter(Mandatory = $true)]
    [string]$JwtKey,

    [string]$SeedAdminEmail = "",
    [string]$SeedAdminPassword = "",
    [string]$LocalControlKey = "",
    [string]$PostgresServiceName = "postgresql-x64-16",
    [bool]$EnableTrayMonitor = $true,
    [string]$LogPath = "$env:TEMP\ProjectX-install-service.log"
)

$ErrorActionPreference = "Stop"
if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
    $logDir = Split-Path -Parent $LogPath
    if (-not [string]::IsNullOrWhiteSpace($logDir) -and -not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }
    Start-Transcript -Path $LogPath -Append | Out-Null
}

try {

if (-not (Test-Path $SourceDir)) {
    throw "Source directory not found: $SourceDir"
}

$appSettingsProduction = @{
    ConnectionStrings = @{
        DefaultConnection = "Host=$DbHost;Port=$DbPort;Database=$DbName"
    }
    Database = @{
        Username = $DbUser
        Password = $DbPassword
    }
    Jwt = @{
        Issuer = $JwtIssuer
        Audience = $JwtAudience
        Key = $JwtKey
        ExpirationMinutes = 60
    }
    SeedAdmin = @{
        Email = $SeedAdminEmail
        Password = $SeedAdminPassword
        FirstName = "System"
        LastName = "Admin"
    }
    SystemMonitor = @{
        ServiceName = $ServiceName
        LocalControlKey = $LocalControlKey
        ManagedServices = @(
            @{
                Key = "backend"
                ServiceName = $ServiceName
                DisplayName = $ServiceDisplayName
                Port = "5055"
                IsControllable = $true
            },
            @{
                Key = "postgres"
                ServiceName = $PostgresServiceName
                DisplayName = "PostgreSQL"
                Port = "$DbPort"
                IsControllable = $true
            }
        )
    }
}

$exePath = Join-Path $InstallDir "backend.exe"

$existing = sc.exe query $ServiceName 2>$null
if ($LASTEXITCODE -eq 0) {
    sc.exe stop $ServiceName 2>$null | Out-Null
    Start-Sleep -Seconds 2
    sc.exe delete $ServiceName 2>$null | Out-Null
    Start-Sleep -Seconds 1
}

$runningBackendProcesses = Get-Process -Name "backend" -ErrorAction SilentlyContinue
if ($runningBackendProcesses) {
    $runningBackendProcesses | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item (Join-Path $SourceDir "*") $InstallDir -Recurse -Force

$json = $appSettingsProduction | ConvertTo-Json -Depth 8
Set-Content -Path (Join-Path $InstallDir "appsettings.Production.json") -Value $json -Encoding UTF8

if (-not (Test-Path $exePath)) {
    throw "backend.exe not found in install dir: $exePath"
}

function Resolve-PostgresServiceName {
    param(
        [Parameter(Mandatory = $true)]
        [string]$PreferredServiceName
    )

    $preferred = Get-Service -Name $PreferredServiceName -ErrorAction SilentlyContinue
    if ($preferred) {
        return $PreferredServiceName
    }

    $fallback = Get-Service | Where-Object {
        $_.Name -like "postgres*" -or $_.DisplayName -like "PostgreSQL*"
    } | Select-Object -First 1

    if ($fallback) {
        return $fallback.Name
    }

    return $null
}

$resolvedPostgresServiceName = Resolve-PostgresServiceName -PreferredServiceName $PostgresServiceName
if (-not [string]::IsNullOrWhiteSpace($resolvedPostgresServiceName)) {
    $pgService = Get-Service -Name $resolvedPostgresServiceName -ErrorAction SilentlyContinue
    if ($pgService -and $pgService.Status -ne 'Running') {
        Write-Host "Starting PostgreSQL service '$resolvedPostgresServiceName'..."
        Start-Service -Name $resolvedPostgresServiceName -ErrorAction Continue
        Start-Sleep -Seconds 2
    }
}
else {
    Write-Warning "PostgreSQL service not found. Backend service may fail until PostgreSQL is installed and running."
}

function Test-TcpPortOpen {
    param(
        [Parameter(Mandatory = $true)]
        [string]$HostName,
        [Parameter(Mandatory = $true)]
        [int]$Port,
        [int]$TimeoutMs = 2000
    )

    $tcp = New-Object System.Net.Sockets.TcpClient
    try {
        $asyncResult = $tcp.BeginConnect($HostName, $Port, $null, $null)
        if (-not $asyncResult.AsyncWaitHandle.WaitOne($TimeoutMs, $false)) {
            return $false
        }

        $tcp.EndConnect($asyncResult)
        return $true
    }
    catch {
        return $false
    }
    finally {
        $tcp.Dispose()
    }
}

if (-not (Test-TcpPortOpen -HostName $DbHost -Port $DbPort)) {
    throw "Database endpoint '$DbHost:$DbPort' is unreachable. Install/start PostgreSQL and verify credentials before installing ProjectX service."
}

$serviceBinaryPath = "`"$exePath`" --urls `"$ApiUrls`""
New-Service -Name $ServiceName -BinaryPathName $serviceBinaryPath -DisplayName $ServiceDisplayName -Description $ServiceDescription -StartupType Automatic
try {
    Start-Service -Name $ServiceName -ErrorAction Stop
}
catch {
    $recentRuntimeError = Get-WinEvent -FilterHashtable @{
        LogName = 'Application'
        ProviderName = '.NET Runtime'
        StartTime = (Get-Date).AddMinutes(-5)
    } -ErrorAction SilentlyContinue | Where-Object { $_.Message -match 'Application: backend.exe' } | Select-Object -First 1

    if ($recentRuntimeError) {
        throw "Service '$ServiceName' failed to start. .NET Runtime: $($recentRuntimeError.Message)"
    }

    throw
}

$backendService = Get-Service -Name $ServiceName -ErrorAction Stop
if ($backendService.Status -ne 'Running') {
    throw "Service '$ServiceName' is not running after start attempt."
}

if ($EnableTrayMonitor) {
    $trayScriptPath = Join-Path $InstallDir "ProjectXTrayMonitor.ps1"
    $trayScriptContent = @"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

`$serviceName = "$ServiceName"
`$dashboardUrl = "$DashboardUrl"

function Get-ServiceStateSafe {
    try {
        `$service = Get-Service -Name `$serviceName -ErrorAction Stop
        return `$service.Status.ToString()
    }
    catch {
        return "NotInstalled"
    }
}

function Invoke-ElevatedServiceAction {
    param(
        [Parameter(Mandatory = `$true)]
        [string]`$Action
    )

    try {
        Start-Process -FilePath "sc.exe" -Verb RunAs -ArgumentList @("`$Action", "`$serviceName")
    }
    catch {
        [System.Windows.Forms.MessageBox]::Show(
            "Failed to run service action `${Action}: `$(`$_.Exception.Message)",
            "ProjectX Tray",
            [System.Windows.Forms.MessageBoxButtons]::OK,
            [System.Windows.Forms.MessageBoxIcon]::Error
        ) | Out-Null
    }
}

`$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
`$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
`$notifyIcon.Visible = `$true
`$notifyIcon.Text = "ProjectX Server: initializing"

`$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip
`$openItem = `$contextMenu.Items.Add("Open Service Manager")
`$openItem.add_Click({
    Start-Process `$dashboardUrl | Out-Null
})

`$startItem = `$contextMenu.Items.Add("Start Server")
`$startItem.add_Click({
    Invoke-ElevatedServiceAction -Action "start"
})

`$stopItem = `$contextMenu.Items.Add("Stop Server")
`$stopItem.add_Click({
    Invoke-ElevatedServiceAction -Action "stop"
})

`$restartItem = `$contextMenu.Items.Add("Restart Server")
`$restartItem.add_Click({
    Invoke-ElevatedServiceAction -Action "stop"
    Start-Sleep -Seconds 1
    Invoke-ElevatedServiceAction -Action "start"
})

`$null = `$contextMenu.Items.Add("-")

`$exitItem = `$contextMenu.Items.Add("Exit")
`$exitItem.add_Click({
    `$notifyIcon.Visible = `$false
    [System.Windows.Forms.Application]::Exit()
})

`$notifyIcon.ContextMenuStrip = `$contextMenu
`$notifyIcon.add_MouseClick({
    param(`$sender, `$args)
    if (`$args.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        Start-Process `$dashboardUrl | Out-Null
    }
})

`$timer = New-Object System.Windows.Forms.Timer
`$timer.Interval = 4000
`$timer.add_Tick({
    `$state = Get-ServiceStateSafe
    `$notifyIcon.Text = "ProjectX Server: `$state"
})
`$timer.Start()

`$notifyIcon.Text = "ProjectX Server: `$(Get-ServiceStateSafe)"
[System.Windows.Forms.Application]::Run()
"@

    Set-Content -Path $trayScriptPath -Value $trayScriptContent -Encoding UTF8

    $shortcutTarget = "powershell.exe"
    $shortcutArguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$trayScriptPath`""

    $wsh = New-Object -ComObject WScript.Shell
    $startupFolder = [Environment]::GetFolderPath("Startup")
    $programsFolder = [Environment]::GetFolderPath("Programs")

    $startupShortcut = $wsh.CreateShortcut((Join-Path $startupFolder "ProjectX Tray Monitor.lnk"))
    $startupShortcut.TargetPath = $shortcutTarget
    $startupShortcut.Arguments = $shortcutArguments
    $startupShortcut.WorkingDirectory = $InstallDir
    $startupShortcut.Save()

    $menuShortcut = $wsh.CreateShortcut((Join-Path $programsFolder "ProjectX Tray Monitor.lnk"))
    $menuShortcut.TargetPath = $shortcutTarget
    $menuShortcut.Arguments = $shortcutArguments
    $menuShortcut.WorkingDirectory = $InstallDir
    $menuShortcut.Save()

    Start-Process -FilePath "powershell.exe" -ArgumentList "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$trayScriptPath`""
}

Write-Host "Service '$ServiceName' installed and started."
Write-Host "Dashboard URL: $ApiUrls"
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
        Stop-Transcript | Out-Null
    }
}
