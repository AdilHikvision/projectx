param(
    [Parameter(Mandatory = $true)]
    [string]$SourceDir,

    [string]$InstallDir = "$env:ProgramFiles\ProjectX\Backend",
    [string]$ServiceName = "ProjectXBackend",
    [string]$ServiceDisplayName = "ProjectX Backend Service",
    [string]$ServiceDescription = "ProjectX API and local dashboard service",
    [string]$ApiUrls = "http://localhost:5055",

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
    [string]$LocalControlKey = ""
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $SourceDir)) {
    throw "Source directory not found: $SourceDir"
}

if (Test-Path $InstallDir) {
    Remove-Item $InstallDir -Recurse -Force
}
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item (Join-Path $SourceDir "*") $InstallDir -Recurse -Force

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
    }
}

$json = $appSettingsProduction | ConvertTo-Json -Depth 8
Set-Content -Path (Join-Path $InstallDir "appsettings.Production.json") -Value $json -Encoding UTF8

$exePath = Join-Path $InstallDir "backend.exe"
if (-not (Test-Path $exePath)) {
    throw "backend.exe not found in install dir: $exePath"
}

$existing = sc.exe query $ServiceName 2>$null
if ($LASTEXITCODE -eq 0) {
    sc.exe stop $ServiceName | Out-Null
    Start-Sleep -Seconds 2
    sc.exe delete $ServiceName | Out-Null
    Start-Sleep -Seconds 1
}

$binPath = "`"$exePath`" --urls $ApiUrls"
sc.exe create $ServiceName binPath= $binPath start= auto DisplayName= $ServiceDisplayName | Out-Null
sc.exe description $ServiceName $ServiceDescription | Out-Null
sc.exe start $ServiceName | Out-Null

Write-Host "Service '$ServiceName' installed and started."
Write-Host "Dashboard URL: $ApiUrls"
