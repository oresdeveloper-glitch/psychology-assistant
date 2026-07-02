Write-Host "=== KHAIRATY - Starting Server & Tunnel ===" -ForegroundColor Cyan
Write-Host ""

$root = Split-Path -Parent $MyInvocation.MyCommand.Definition
$backend = Join-Path $root "backend"
$log = Join-Path $root "server.log"
$tlog = Join-Path $root "tunnel.log"

# Start backend server
Write-Host "[1/2] Starting FastAPI server on port 8000..." -ForegroundColor Yellow
$server = Start-Process -WindowStyle Hidden -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000" -WorkingDirectory $backend -RedirectStandardOutput $log -PassThru
Start-Sleep -Seconds 4

# Verify server is running
try {
    $resp = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "  -> Server running (PID: $($server.Id))" -ForegroundColor Green
} catch {
    Write-Host "  -> Server FAILED to start" -ForegroundColor Red
    exit 1
}

# Start localtunnel
Write-Host "[2/2] Starting localtunnel (public URL)..." -ForegroundColor Yellow
$tunnelJob = Start-Job -Name lt -ScriptBlock {
    param($port, $logPath)
    lt --port $port 2>&1 | Out-File $logPath
} -ArgumentList 8000, $tlog

Start-Sleep -Seconds 8

# Extract URL from tunnel log
$url = $null
if (Test-Path $tlog) {
    $content = Get-Content $tlog -Raw
    $match = [regex]::Match($content, 'https?://[a-zA-Z0-9.-]+\.loca\.lt')
    if ($match.Success) {
        $url = $match.Value
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SERVER: http://localhost:8000" -ForegroundColor White
if ($url) {
    Write-Host "  PHONE:  $url" -ForegroundColor Green
} else {
    Write-Host "  PHONE:  (tunnel still connecting...)" -ForegroundColor Yellow
    Write-Host "  Check tunnel.log for URL: $tlog"
}
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray

# Keep script alive
while ($true) {
    Start-Sleep -Seconds 10
    # Check if server still running
    if (-not (Get-Process -Id $server.Id -ErrorAction SilentlyContinue)) {
        Write-Host "Server has stopped." -ForegroundColor Red
        break
    }
}
