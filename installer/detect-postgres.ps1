param(
    [string]$ServiceNamePattern = "postgresql*"
)

$result = @{
    found = $false
    serviceName = ""
    status = ""
    port = 5432
    message = "PostgreSQL service not found."
}

try {
    $service = Get-Service -Name $ServiceNamePattern -ErrorAction Stop | Select-Object -First 1
    $result.found = $true
    $result.serviceName = $service.Name
    $result.status = $service.Status.ToString()
    $result.message = "Detected PostgreSQL service."
}
catch {
    # keep defaults
}

$result | ConvertTo-Json -Depth 4
