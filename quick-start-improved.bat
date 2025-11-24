@echo off
echo ============================================================
echo StoryWritingProject - QUICK START (IMPROVED)
echo ============================================================
echo.
echo Stopping old services...
taskkill /F /IM java.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 5 /nobreak >nul
echo Done.
echo.

echo Starting services...
echo.

echo [1/5] Eureka Server (8761) - Discovery Service
echo        Starting... (this takes ~40 seconds)
start "Eureka-8761" /min cmd /c "cd /d "%~dp0microservices\eureka-server" && mvn spring-boot:run -q"
echo        Waiting 40 seconds for Eureka to initialize...
timeout /t 40 /nobreak >nul

:: Verify Eureka is up
powershell -Command "if ((Test-NetConnection localhost -Port 8761 -WarningAction SilentlyContinue).TcpTestSucceeded) { Write-Host '        Eureka is UP!' -ForegroundColor Green } else { Write-Host '        WARNING: Eureka may not be ready yet!' -ForegroundColor Yellow }"
echo.

echo [2/5] User Service (8081) - Authentication
echo        Starting...
start "User-8081" /min cmd /c "cd /d "%~dp0microservices\user-service" && mvn spring-boot:run -q"
timeout /t 20 /nobreak >nul
echo        Started.
echo.

echo [3/5] Story Service (8082) - Stories and Genres
echo        Starting...
start "Story-8082" /min cmd /c "cd /d "%~dp0microservices\story-service" && mvn spring-boot:run -q"
timeout /t 20 /nobreak >nul
echo        Started.
echo.

echo [4/5] API Gateway (8080) - Routing Layer
echo        Starting...
start "Gateway-8080" /min cmd /c "cd /d "%~dp0microservices\api-gateway" && mvn spring-boot:run -q"
timeout /t 25 /nobreak >nul
echo        Started.
echo.

echo [5/5] Frontend (5173) - React UI
echo        Starting...
start "Frontend-5173" /min cmd /c "cd /d "%~dp0Frontend" && npm run dev:fixed"
timeout /t 5 /nobreak >nul
echo        Started.
echo.

echo ============================================================
echo VERIFICATION
echo ============================================================
echo.
echo Checking service registration...
timeout /t 3 /nobreak >nul

powershell -Command "$services = @('8761 Eureka','8080 Gateway','8081 User','8082 Story','5173 Frontend'); foreach($s in $services) { $p,$n = $s -split ' '; $r = Test-NetConnection localhost -Port $p -WarningAction SilentlyContinue; if($r.TcpTestSucceeded) { Write-Host \"  ✓ $n ($p)\" -ForegroundColor Green } else { Write-Host \"  ✗ $n ($p) - NOT RUNNING\" -ForegroundColor Red } }"

echo.
echo Checking genre endpoint...
timeout /t 2 /nobreak >nul

powershell -Command "try { $r = Invoke-WebRequest 'http://localhost:8080/api/stories/genres' -UseBasicParsing -TimeoutSec 5; $g = ($r.Content | ConvertFrom-Json).Count; Write-Host \"  ✓ Genres loaded: $g\" -ForegroundColor Green } catch { Write-Host \"  ✗ Genre endpoint failed: $($_.Exception.Message)\" -ForegroundColor Red; Write-Host \"     (Services may still be initializing - wait 30 more seconds)\" -ForegroundColor Yellow }"

echo.
echo ============================================================
echo READY!
echo ============================================================
echo.
echo   Frontend: http://localhost:5173
echo   Eureka:   http://localhost:8761
echo   Gateway:  http://localhost:8080
echo.
echo To stop: run stop-all.bat
echo ============================================================
pause
