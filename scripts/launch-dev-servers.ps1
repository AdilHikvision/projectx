# Stop common dev ports and open backend + frontend (no rebuild)
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$backendDir = Join-Path $root "backend"
$frontendDir = Join-Path $root "frontend"
$ports = @(5154, 5173, 5174)

foreach ($port in $ports) {
    Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | ForEach-Object {
        $procId = $_.OwningProcess
        if ($procId -gt 0) {
            Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped PID $procId on port $port" -ForegroundColor Gray
        }
    }
}
Start-Sleep -Seconds 1

Start-Process powershell -ArgumentList @(
    "-NoExit", "-NoProfile",
    "-Command",
    "Set-Location '$backendDir'; `$env:ASPNETCORE_ENVIRONMENT='Development'; dotnet run --launch-profile http"
)
Start-Process powershell -ArgumentList @(
    "-NoExit", "-NoProfile",
    "-Command",
    "Set-Location '$frontendDir'; npm run dev"
)
Write-Host "Started backend (5154) and frontend (5173). URLs: http://localhost:5154 | http://localhost:5173" -ForegroundColor Green
