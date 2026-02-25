param(
    [string]$InnoCompilerPath = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$issPath = Join-Path $scriptDir "setup.iss"

if (-not (Test-Path $InnoCompilerPath)) {
    throw "ISCC.exe not found at: $InnoCompilerPath. Install Inno Setup 6 first."
}

& $InnoCompilerPath $issPath
Write-Host "Installer build completed."
