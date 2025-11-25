@echo off
setlocal ENABLEDELAYEDEXPANSION

echo ============================================================
echo   StoryWritingProject - Health Check All Services
echo ============================================================
echo.

set "PASS=0"
set "FAIL=0"

REM Function to check if a port is listening
echo Checking Backend Services (Java):
echo.

echo [1/7] Eureka Server (8761)...
netstat -an | findstr ":8761.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8761
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo [2/7] API Gateway (8080)...
netstat -an | findstr ":8080.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8080
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo [3/7] User Service (8081)...
netstat -an | findstr ":8081.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8081
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo [4/7] Story Service (8082)...
netstat -an | findstr ":8082.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8082
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo.
echo Checking AI Services (Python):
echo.

echo [5/7] AI Service (8001)...
netstat -an | findstr ":8001.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8001
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo [6/7] ZEGA Model (8002)...
netstat -an | findstr ":8002.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:8002
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo.
echo Checking Frontend:
echo.

echo [7/7] React Frontend (5173)...
netstat -an | findstr ":5173.*LISTENING" >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo       [√] RUNNING - http://localhost:5173
    set /a PASS+=1
) else (
    echo       [X] NOT RUNNING
    set /a FAIL+=1
)

echo.
echo ============================================================
echo   Health Check Summary
echo ============================================================
echo   Services Running: %PASS%/7
echo   Services Down:    %FAIL%/7
echo.

if %FAIL% EQU 0 (
    echo   [√] ALL SERVICES ARE RUNNING!
    echo.
    echo   Quick Links:
    echo     - Application:  http://localhost:5173
    echo     - Eureka:       http://localhost:8761
    echo     - AI Docs:      http://localhost:8001/docs
    echo     - ZEGA Health:  http://localhost:8002/health
) else (
    echo   [!] Some services are not running
    echo.
    echo   To start all services, run: run-all.bat
)

echo.
echo ============================================================
pause
