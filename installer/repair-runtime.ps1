param(
    [string]$InstallDir = "${env:ProgramFiles(x86)}\ProjectX\Backend",
    [string]$FrontendDistDir = "$PSScriptRoot\..\frontend\dist",
    [string]$ServiceName = "ProjectXBackend",
    [string]$DashboardUrl = "http://localhost:5055/system",
    [string]$LogPath = "$env:TEMP\ProjectX-repair-runtime.log"
)

$ErrorActionPreference = "Stop"
Start-Transcript -Path $LogPath -Append | Out-Null
try {

if (-not (Test-Path $InstallDir)) {
    throw "Install directory not found: $InstallDir"
}

if (-not (Test-Path $FrontendDistDir)) {
    throw "Frontend dist directory not found: $FrontendDistDir"
}

$wwwroot = Join-Path $InstallDir "wwwroot"
if (-not (Test-Path $wwwroot)) {
    New-Item -ItemType Directory -Path $wwwroot -Force | Out-Null
}

try {
    Stop-Service -Name $ServiceName -ErrorAction SilentlyContinue
}
catch {
}

Start-Sleep -Seconds 1

# Mirror frontend files into installed wwwroot to avoid stale JS bundle URLs.
robocopy $FrontendDistDir $wwwroot /MIR /NFL /NDL /NJH /NJS /NP | Out-Null
$robocopyExitCode = $LASTEXITCODE
if ($robocopyExitCode -ge 8) {
    throw "robocopy failed with exit code $robocopyExitCode"
}

$trayScriptPath = Join-Path $InstallDir "ProjectXTrayMonitor.ps1"
$trayScript = @"
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

`$serviceName = "$ServiceName"
`$dashboardUrl = "$DashboardUrl"

function Get-ServiceStateSafe {
    try {
        return (Get-Service -Name `$serviceName -ErrorAction Stop).Status.ToString()
    }
    catch {
        return "NotInstalled"
    }
}

function Invoke-ElevatedServiceAction {
    param([Parameter(Mandatory = `$true)][string]`$Action)
    Start-Process -FilePath "sc.exe" -Verb RunAs -ArgumentList @("`$Action", "`$serviceName")
}

`$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
`$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
`$notifyIcon.Visible = `$true
`$notifyIcon.Text = "ProjectX Server: initializing"

`$menu = New-Object System.Windows.Forms.ContextMenuStrip
`$openItem = `$menu.Items.Add("Open Service Manager")
`$openItem.add_Click({ Start-Process `$dashboardUrl | Out-Null })
`$startItem = `$menu.Items.Add("Start Server")
`$startItem.add_Click({ Invoke-ElevatedServiceAction -Action "start" })
`$stopItem = `$menu.Items.Add("Stop Server")
`$stopItem.add_Click({ Invoke-ElevatedServiceAction -Action "stop" })
`$restartItem = `$menu.Items.Add("Restart Server")
`$restartItem.add_Click({
    Invoke-ElevatedServiceAction -Action "stop"
    Start-Sleep -Seconds 1
    Invoke-ElevatedServiceAction -Action "start"
})
`$null = `$menu.Items.Add("-")
`$exitItem = `$menu.Items.Add("Exit")
`$exitItem.add_Click({
    `$notifyIcon.Visible = `$false
    [System.Windows.Forms.Application]::Exit()
})

`$notifyIcon.ContextMenuStrip = `$menu
`$notifyIcon.add_MouseClick({
    param(`$sender, `$args)
    if (`$args.Button -eq [System.Windows.Forms.MouseButtons]::Left) {
        Start-Process `$dashboardUrl | Out-Null
    }
})

`$timer = New-Object System.Windows.Forms.Timer
`$timer.Interval = 4000
`$timer.add_Tick({
    `$notifyIcon.Text = "ProjectX Server: `$(Get-ServiceStateSafe)"
})
`$timer.Start()
`$notifyIcon.Text = "ProjectX Server: `$(Get-ServiceStateSafe)"
[System.Windows.Forms.Application]::Run()
"@

Set-Content -Path $trayScriptPath -Value $trayScript -Encoding UTF8

$wsh = New-Object -ComObject WScript.Shell
$startupShortcutPath = Join-Path ([Environment]::GetFolderPath("Startup")) "ProjectX Tray Monitor.lnk"
$programShortcutPath = Join-Path ([Environment]::GetFolderPath("Programs")) "ProjectX Tray Monitor.lnk"
$args = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$trayScriptPath`""

foreach ($lnkPath in @($startupShortcutPath, $programShortcutPath)) {
    $lnk = $wsh.CreateShortcut($lnkPath)
    $lnk.TargetPath = "powershell.exe"
    $lnk.Arguments = $args
    $lnk.WorkingDirectory = $InstallDir
    $lnk.Save()
}

Get-CimInstance Win32_Process |
    Where-Object { $_.Name -eq "powershell.exe" -and $_.CommandLine -like "*ProjectXTrayMonitor.ps1*" } |
    ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }

Start-Service -Name $ServiceName
Start-Sleep -Seconds 1
if ((Get-Service -Name $ServiceName).Status -ne "Running") {
    throw "Service '$ServiceName' failed to start."
}

Start-Process -FilePath "powershell.exe" -ArgumentList $args

Write-Host "Repair finished. Service is running and tray monitor started."
}
finally {
    Stop-Transcript | Out-Null
}
