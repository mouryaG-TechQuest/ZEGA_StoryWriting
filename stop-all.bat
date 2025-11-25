@echo off
echo ============================================================
echo   StoryWritingProject - STOP ALL SERVICES
echo ============================================================
echo.

echo [1/6] Stopping services on specific ports...
echo       Checking port 8761 (Eureka)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8761') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 8080 (API Gateway)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 8081 (User Service)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 8082 (Story Service)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8082') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 8001 (AI Service)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8001') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 8002 (ZEGA Model)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8002') do taskkill /F /PID %%a >nul 2>&1

echo       Checking port 5173 (Frontend)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do taskkill /F /PID %%a >nul 2>&1

echo.
echo [2/6] Stopping remaining Java processes (Spring Boot)...
taskkill /F /IM java.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] Java processes stopped
) else (
    echo       [i] No Java processes found
)

echo.
echo [3/6] Stopping Node.js processes (Frontend/Vite)...
taskkill /F /IM node.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] Node.js processes stopped
) else (
    echo       [i] No Node.js processes found
)

echo.
echo [4/6] Stopping Python processes (AI Services)...
taskkill /F /IM python.exe >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] Python processes stopped
) else (
    echo       [i] No Python processes found
)

echo.
echo [5/6] Closing command windows...
taskkill /F /FI "WINDOWTITLE eq Eureka*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq User-Service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Story-Service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq API-Gateway*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq AI-Service*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq ZEGA*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq Frontend*" >nul 2>&1

echo.
echo [6/6] Waiting for cleanup...
timeout /t 3 /nobreak >nul

echo.
echo ============================================================
echo   ALL SERVICES STOPPED SUCCESSFULLY
echo ============================================================
echo.
echo   All ports released:
echo     - 8761 (Eureka)
echo     - 8080 (API Gateway)
echo     - 8081 (User Service)
echo     - 8082 (Story Service)
echo     - 8001 (AI Service)
echo     - 8002 (ZEGA Model)
echo     - 5173 (Frontend)
echo.
echo   You can now restart services with run-all.bat
echo.
echo ============================================================
pause
