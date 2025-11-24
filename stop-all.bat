@echo off
echo ============================================================
echo StoryWritingProject - STOP ALL SERVICES
echo ============================================================
echo.

echo Stopping all Java processes (Eureka, User, Story, Gateway)...
taskkill /F /IM java.exe >nul 2>&1

echo Stopping all Node.js processes (Frontend)...
taskkill /F /IM node.exe >nul 2>&1

echo Stopping all Python processes (AI Service)...
taskkill /F /IM python.exe >nul 2>&1

timeout /t 2 /nobreak >nul

echo.
echo All services stopped.
echo ============================================================
echo.
pause
