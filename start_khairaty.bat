@echo off
cd /d "%~dp0"
echo ========================================
echo   KHAIRATY - Starting Server + Tunnel
echo ========================================
echo.

:: Start backend server
echo [1/2] Starting FastAPI server...
start /B "" python backend\app\main.py > server.log 2>&1
:: Actually use uvicorn directly
start /B "" python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 1 > server.log 2>&1
cd /d "%~dp0"
timeout /t 5 /nobreak >nul

:: Check server
curl -s http://localhost:8000/api/v1/health >nul 2>&1
if %errorlevel% equ 0 (
    echo   [OK] Server running on port 8000
) else (
    echo   [FAIL] Server did not start
    pause
    exit /b 1
)

:: Start SSH tunnel via serveo.net
echo [2/2] Starting public tunnel...
start /B "" cmd /c "ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:8000 serveo.net > tunnel.log 2>&1"
timeout /t 8 /nobreak >nul

:: Extract URL from tunnel log
set TUNNEL_URL=
for /f "tokens=*" %%a in ('findstr /i "http" tunnel.log') do set TUNNEL_URL=%%a

echo.
echo ========================================
echo   SERVER: http://localhost:8000
for /f "tokens=3" %%a in ('findstr /c:"Forwarding HTTP" tunnel.log') do echo   PHONE:  %%a
echo ========================================
echo.
echo Share the PHONE URL with your smartphone browser
echo Press any key to stop...
echo.

:: Keep window open
pause >nul

:: Cleanup
taskkill /f /im python.exe >nul 2>&1
taskkill /f /im ssh.exe >nul 2>&1
echo Stopped.
