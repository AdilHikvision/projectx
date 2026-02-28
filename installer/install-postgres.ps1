param(
    [string]$Version = "16"
)

$ErrorActionPreference = "Stop"

try {
    winget --version | Out-Null
    Write-Host "Installing PostgreSQL via winget..."
    $packageId = "PostgreSQL.PostgreSQL.$Version"
    winget install --id $packageId --silent --accept-package-agreements --accept-source-agreements
    if ($LASTEXITCODE -ne 0) {
        throw "winget install failed for package '$packageId' (exit code: $LASTEXITCODE)."
    }

    Write-Host "PostgreSQL installation command completed for package: $packageId"
}
catch {
    Write-Warning "Automatic PostgreSQL install failed: $($_.Exception.Message)"
    Write-Host "Opening PostgreSQL download page..."
    Start-Process "https://www.postgresql.org/download/windows/"
}
