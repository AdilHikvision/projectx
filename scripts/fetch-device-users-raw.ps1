# Запрос списка пользователей с устройства Hikvision (raw XML/JSON)
#
# Вариант 1 — прямой запрос к устройству (без входа в приложение):
#   .\fetch-device-users-raw.ps1 -Ip "192.168.1.64" -Password "12345" [-Format json]
#
# Вариант 2 — через приложение (устройство должно быть в БД):
#   .\fetch-device-users-raw.ps1 -Email "admin@projectx.local" -Password "yourpassword" -Format json
#
param(
    [string]$Ip,
    [int]$Port = 80,
    [string]$Username = "admin",
    [string]$Password,
    [string]$Email,
    [ValidateSet("xml","json")][string]$Format = "json",
    [string]$BaseUrl = "http://localhost:5154"
)

$ErrorActionPreference = "Stop"

if ($Ip) {
    # Прямой запрос к устройству (пароль по умолчанию 12345 если не указан)
    $pwd = if ($Password) { $Password } else { "12345" }
    $uri = "$BaseUrl/api/devices/users-raw-direct?ip=$Ip&port=$Port&username=$Username&password=$pwd&format=$Format"
    Write-Host "Request: $BaseUrl/api/devices/users-raw-direct?ip=$Ip&port=$Port&format=$Format" -ForegroundColor Cyan
    $resp = Invoke-WebRequest -Uri $uri -UseBasicParsing -TimeoutSec 20
    $resp.Content
} elseif ($Email -and $Password) {
    # Через приложение
    $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
    $loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResp.accessToken
    if (-not $token) { Write-Error "Login failed: no token" }
    $headers = @{ Authorization = "Bearer $token" }
    $devices = Invoke-RestMethod -Uri "$BaseUrl/api/devices" -Headers $headers
    if ($devices.Count -eq 0) { Write-Error "No devices configured. Add a device first." }
    $deviceId = $devices[0].id
    Write-Host "Using device: $($devices[0].name) ($($devices[0].ipAddress))" -ForegroundColor Cyan
    $resp = Invoke-WebRequest -Uri "$BaseUrl/api/devices/$deviceId/users-raw?format=$Format" -Headers $headers -UseBasicParsing
    $resp.Content
} else {
    Write-Host "Usage:" -ForegroundColor Yellow
    Write-Host "  Direct:  .\fetch-device-users-raw.ps1 -Ip `"192.168.1.64`" -Password `"12345`" -Format json"
    Write-Host "  Via app: .\fetch-device-users-raw.ps1 -Email `"admin@...`" -Password `"...`" -Format json"
}
