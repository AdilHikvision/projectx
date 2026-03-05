# Start dev: stop old processes first, then run backend + frontend
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$ports = @(5154, 5173, 5174)

function Stop-PortProcesses {
    foreach ($port in $ports) {
        Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
            $pid = $_.OwningProcess
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "  Stopped PID $pid on port $port" -ForegroundColor Gray
        }
    }
}

Write-Host "Stopping existing processes (ports $($ports -join ', '))..." -ForegroundColor Yellow
Stop-PortProcesses
Start-Sleep -Seconds 1
Stop-PortProcesses
$maxWait = 10
$elapsed = 0
while ($elapsed -lt $maxWait) {
    $busy = $false
    foreach ($port in $ports) {
        if (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue) { $busy = $true; break }
    }
    if (-not $busy) { break }
    Start-Sleep -Seconds 1
    $elapsed++
}
if ($elapsed -ge $maxWait) {
    Write-Host "Warning: some ports still in use after ${maxWait}s" -ForegroundColor Red
}

Write-Host "Building backend..." -ForegroundColor Cyan
Push-Location $backendDir
dotnet build --nologo -v q
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "Building frontend..." -ForegroundColor Cyan
Push-Location $frontendDir
$ErrorActionPreference = "Continue"
cmd /c "npm run build:deploy 2>nul"
$ErrorActionPreference = "Stop"
if ($LASTEXITCODE -ne 0) { Pop-Location; exit 1 }
Pop-Location

Write-Host "Starting backend in new terminal..." -ForegroundColor Green
$backendScript = @"
`$env:ASPNETCORE_ENVIRONMENT = 'Development'
Set-Location '$backendDir'
dotnet run --launch-profile http
"@
$backendScript | Out-File -FilePath (Join-Path $env:TEMP "projectx-backend-dev.ps1") -Encoding utf8
Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", (Join-Path $env:TEMP "projectx-backend-dev.ps1")

Write-Host "Waiting for backend to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Starting frontend dev server..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5154 | Frontend: http://localhost:5173" -ForegroundColor Cyan
Push-Location $frontendDir
npm run dev
