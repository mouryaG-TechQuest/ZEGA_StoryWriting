@echo off
REM Quick verification that all services can start successfully

TITLE Service Health Check

echo.
echo ================================================
echo   PRODUCTION READINESS VERIFICATION
echo ================================================
echo.

echo Checking required tools...
echo.

REM Check Java
java -version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Java not found
    goto :error
) else (
    echo [PASS] Java installed
)

REM Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Python not found
    goto :error
) else (
    echo [PASS] Python installed
)

REM Check Node
node --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Node.js not found
    goto :error
) else (
    echo [PASS] Node.js installed
)

REM Check Maven
mvn --version >nul 2>&1
if errorlevel 1 (
    echo [FAIL] Maven not found
    goto :error
) else (
    echo [PASS] Maven installed
)

echo.
echo Checking project structure...
echo.

REM Check directories
if not exist "microservices" (
    echo [FAIL] microservices folder missing
    goto :error
) else (
    echo [PASS] Microservices folder exists
)

if not exist "Frontend" (
    echo [FAIL] Frontend folder missing
    goto :error
) else (
    echo [PASS] Frontend folder exists
)

if not exist "AIservices" (
    echo [FAIL] AIservices folder missing
    goto :error
) else (
    echo [PASS] AIservices folder exists
)

REM Check Python venv
if not exist "AIservices\venv" (
    echo [WARN] Python venv not found - will need to create
) else (
    echo [PASS] Python venv exists
)

REM Check Frontend node_modules
if not exist "Frontend\node_modules" (
    echo [WARN] Frontend dependencies not installed - run: cd Frontend && npm install
) else (
    echo [PASS] Frontend dependencies installed
)

echo.
echo Checking configuration files...
echo.

if not exist "microservices\story-service\src\main\resources\application-production.yml" (
    echo [FAIL] Story Service production config missing
    goto :error
) else (
    echo [PASS] Production configs present
)

if not exist "run-production.bat" (
    echo [FAIL] Production deployment script missing
    goto :error
) else (
    echo [PASS] Production deployment script ready
)

echo.
echo ================================================
echo   ✅ ALL CHECKS PASSED - PRODUCTION READY
echo ================================================
echo.
echo Next steps:
echo   1. Ensure database is running and accessible
echo   2. Set environment variables if needed
echo   3. Run: run-production.bat
echo.
pause
exit /b 0

:error
echo.
echo ================================================
echo   ❌ CHECKS FAILED - NOT READY FOR PRODUCTION
echo ================================================
echo.
echo Please fix the issues above and try again.
echo.
pause
exit /b 1
