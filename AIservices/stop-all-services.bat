@echo off
echo ========================================
echo   ZEGA AI Services - Stop All
echo ========================================
echo.

echo Stopping all Python uvicorn processes...
taskkill /f /im python.exe /fi "WINDOWTITLE eq ZEGA*" 2>nul
taskkill /f /fi "WINDOWTITLE eq ZEGA Core*" 2>nul
taskkill /f /fi "WINDOWTITLE eq ZEGA ImageGen*" 2>nul
taskkill /f /fi "WINDOWTITLE eq ZEGA Voice*" 2>nul
taskkill /f /fi "WINDOWTITLE eq ZEGA DocParser*" 2>nul
taskkill /f /fi "WINDOWTITLE eq ZEGA MCP*" 2>nul

echo.
echo All ZEGA services stopped.
pause
