param(
    [string]$Version = "16"
)

$ErrorActionPreference = "Stop"

try {
    winget --version | Out-Null
    Write-Host "Installing PostgreSQL via winget..."
    winget install --id PostgreSQL.PostgreSQL --silent --accept-package-agreements --accept-source-agreements
    Write-Host "PostgreSQL installation command completed."
}
catch {
    Write-Warning "Automatic PostgreSQL install failed: $($_.Exception.Message)"
    Write-Host "Opening PostgreSQL download page..."
    Start-Process "https://www.postgresql.org/download/windows/"
}
