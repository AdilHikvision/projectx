# Очистка БД projectx (данные приложения). Требуется psql (PostgreSQL client).
# Параметры по умолчанию из appsettings.Development.json — при необходимости передайте свои.

param(
    [string] $DbHost = "localhost",
    [int] $Port = 5433,
    [string] $Database = "projectx",
    [string] $User = "projectx_user",
    [string] $Password = "ProjectX123!"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$sqlFile = Join-Path $scriptDir "clear_database.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Error "Не найден файл: $sqlFile"
    exit 1
}

$env:PGPASSWORD = $Password
try {
    & psql -h $DbHost -p $Port -U $User -d $Database -v ON_ERROR_STOP=1 -f $sqlFile
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Write-Host "БД очищена успешно."
} finally {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
}
