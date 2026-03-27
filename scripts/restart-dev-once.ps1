# One-shot: stop dev ports, rebuild, then exit (servers started separately)
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$ports = @(5154, 80, 5173, 5174)

foreach ($port in $ports) {
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
        $procId = $_.OwningProcess
        if ($procId -gt 0) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped PID $procId on port $port" -ForegroundColor Gray
        }
    }
}
Start-Sleep -Seconds 2

Write-Host "Building backend..." -ForegroundColor Cyan
Push-Location $backendDir
dotnet build --nologo -v q
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "Building frontend (build:deploy)..." -ForegroundColor Cyan
Push-Location $frontendDir
npm run build:deploy
if ($LASTEXITCODE -ne 0) { Pop-Location; exit $LASTEXITCODE }
Pop-Location

Write-Host "Rebuild OK." -ForegroundColor Green
