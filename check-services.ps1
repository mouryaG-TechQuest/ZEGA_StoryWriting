Write-Host "=== Checking All Services ===" -ForegroundColor Cyan

# Eureka Server
try {
    $eureka = Invoke-WebRequest -Uri "http://localhost:8761" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Eureka Server (8761): RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ Eureka Server (8761): NOT RUNNING" -ForegroundColor Red
}

# API Gateway
try {
    $gateway = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ API Gateway (8080): RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ API Gateway (8080): NOT RUNNING" -ForegroundColor Red
}

# User Service
try {
    $user = Invoke-WebRequest -Uri "http://localhost:8081/actuator/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ User Service (8081): RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ User Service (8081): NOT RUNNING" -ForegroundColor Red
}

# Story Service
try {
    $story = Invoke-WebRequest -Uri "http://localhost:8082/actuator/health" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Story Service (8082): RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ Story Service (8082): NOT RUNNING" -ForegroundColor Red
}

# Frontend
try {
    $frontend = Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing -TimeoutSec 5
    Write-Host "✓ Frontend (5173): RUNNING" -ForegroundColor Green
} catch {
    Write-Host "✗ Frontend (5173): NOT RUNNING" -ForegroundColor Red
}

# ZEGA
try {
    $zega = Invoke-WebRequest -Uri "http://localhost:8002/health" -UseBasicParsing -TimeoutSec 5
    $zegaData = $zega.Content | ConvertFrom-Json
    Write-Host "✓ ZEGA AI Service (8002): $($zegaData.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ ZEGA AI Service (8002): NOT RUNNING" -ForegroundColor Red
}

Write-Host "`n=== Service Check Complete ===" -ForegroundColor Cyan
