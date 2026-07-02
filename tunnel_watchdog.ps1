$tunnelLog = "C:\Users\user\Downloads\KHAIRATY\serveo.log"
while ($true) {
  $proc = Get-CimInstance Win32_Process -Filter "Name='ssh.exe' AND CommandLine LIKE '%serveo%'" -ErrorAction SilentlyContinue
  if (-not $proc) {
    Write-Output "$(Get-Date -Format 'HH:mm:ss') Tunnel down, restarting..."
    Remove-Item -LiteralPath $tunnelLog -ErrorAction SilentlyContinue
    Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:8000 serveo.net > $tunnelLog 2>&1"
  }
  Start-Sleep -Seconds 30
}
