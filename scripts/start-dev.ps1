$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$ports = @(5173, 5174, 5227)

Write-Host "Stopping old dev servers on ports 5173, 5174, 5227..."
$owners = Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

foreach ($owner in $owners) {
    Stop-Process -Id $owner -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 2

Write-Host "Starting .NET API on http://localhost:5227..."
Start-Process -FilePath "dotnet" `
    -ArgumentList @("run", "--project", "ScientificJournalTrendSystem\ScientificJournal.API\ScientificJournal.API.csproj", "--launch-profile", "http") `
    -WorkingDirectory $root `
    -RedirectStandardOutput "dotnet-5227.payos.out.log" `
    -RedirectStandardError "dotnet-5227.payos.err.log" `
    -WindowStyle Hidden

Write-Host "Starting Google OAuth helper on http://localhost:5173..."
Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev:api") `
    -WorkingDirectory $root `
    -RedirectStandardOutput "node-5173.google.out.log" `
    -RedirectStandardError "node-5173.google.err.log" `
    -WindowStyle Hidden

Write-Host "Starting React app on http://localhost:5174..."
Start-Process -FilePath "npm.cmd" `
    -ArgumentList @("run", "dev", "--", "--strictPort") `
    -WorkingDirectory $root `
    -RedirectStandardOutput "vite-5174.payos.out.log" `
    -RedirectStandardError "vite-5174.payos.err.log" `
    -WindowStyle Hidden

Start-Sleep -Seconds 6

Write-Host ""
Write-Host "Listening ports:"
Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue |
    Select-Object LocalAddress, LocalPort, OwningProcess |
    Format-Table -AutoSize

Write-Host "Open http://localhost:5174"
