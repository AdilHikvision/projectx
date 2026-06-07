<#
.SYNOPSIS
    Installs Npcap (packet capture driver) so the backend's SADP device
    auto-discovery PCAP channel works.

.DESCRIPTION
    - Skips if Npcap is already installed (service "npcap" or wpcap.dll present).
    - Downloads the Npcap installer (npcap.com, with a Wayback Machine fallback).
    - Installs in WinPcap API-compatible mode (so SharpPcap finds wpcap.dll in
      System32). The free Npcap edition does not officially support fully silent
      (/S) installs, so we attempt /S first and fall back to the (short) interactive
      installer wizard if the driver is not present afterwards.

    Npcap is OPTIONAL: without it, SADP discovery still works over the UDP channels;
    only the raw-Ethernet PCAP channel is unavailable. A failure here is non-fatal.

.NOTES
    Run elevated (admin). Requires internet access on first install.
#>
param(
    [string]$Version = "1.80",
    [string]$LogPath = "$env:TEMP\ProjectX-install-npcap.log"
)

$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

if (-not [string]::IsNullOrWhiteSpace($LogPath)) {
    $logDir = Split-Path -Parent $LogPath
    if ($logDir -and -not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir -Force | Out-Null }
    Start-Transcript -Path $LogPath -Append | Out-Null
}

function Test-NpcapInstalled {
    if (Get-Service -Name "npcap" -ErrorAction SilentlyContinue) { return $true }
    if (Test-Path "$env:WinDir\System32\Npcap\wpcap.dll") { return $true }
    if (Test-Path "$env:WinDir\System32\wpcap.dll") { return $true }
    return $false
}

function Get-FileWithFallback {
    param([string[]]$Urls, [string]$OutFile, [int]$MinBytes = 1)
    foreach ($u in $Urls) {
        try {
            Write-Host "  downloading: $u"
            Invoke-WebRequest -Uri $u -OutFile $OutFile -UseBasicParsing -TimeoutSec 120
            if ((Test-Path $OutFile) -and (Get-Item $OutFile).Length -ge $MinBytes) { return $true }
        }
        catch { Write-Warning "  download failed ($u): $($_.Exception.Message)" }
    }
    return $false
}

try {
    if (Test-NpcapInstalled) {
        Write-Host "Npcap already installed. Skipping."
        return
    }

    $exe = Join-Path $env:TEMP "npcap-$Version.exe"
    $urls = @(
        "https://npcap.com/dist/npcap-$Version.exe",
        "https://web.archive.org/web/2id_/https://npcap.com/dist/npcap-$Version.exe"
    )
    Write-Host "Downloading Npcap $Version ..."
    if (-not (Get-FileWithFallback -Urls $urls -OutFile $exe -MinBytes 500000)) {
        throw "Failed to download Npcap $Version from all sources."
    }

    # WinPcap API-compatible mode puts wpcap.dll/Packet.dll in System32 where
    # SharpPcap (LibPcap) looks for them.
    $opts = @("/winpcap_mode=yes", "/loopback_support=no")

    Write-Host "Attempting silent Npcap install ..."
    $p = Start-Process -FilePath $exe -ArgumentList (@("/S") + $opts) -Wait -PassThru
    Start-Sleep -Seconds 3

    if (-not (Test-NpcapInstalled)) {
        # Free edition likely ignored /S — run the (short) interactive installer.
        Write-Warning "Silent install did not complete (free Npcap edition does not support /S)."
        Write-Host "Launching the Npcap installer window — please click through it to finish ..."
        Start-Process -FilePath $exe -ArgumentList $opts -Wait | Out-Null
        Start-Sleep -Seconds 2
    }

    Remove-Item $exe -Force -ErrorAction SilentlyContinue

    if (Test-NpcapInstalled) {
        Write-Host "Npcap installed (SADP PCAP discovery channel enabled)."
    }
    else {
        throw "Npcap does not appear to be installed after the installer ran."
    }
}
finally {
    if (-not [string]::IsNullOrWhiteSpace($LogPath)) { Stop-Transcript | Out-Null }
}
