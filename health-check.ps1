Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Service Health Check" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Test-Service {
    param(
        [string]$Name,
        [string]$Url
    )
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "[OK] $Name" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "[FAIL] $Name - $_" -ForegroundColor Red
        return $false
    }
}

# Check all services
$eurekaOk = Test-Service -Name "Eureka Server (8761)" -Url "http://localhost:8761"
$gatewayOk = Test-Service -Name "API Gateway (8080)" -Url "http://localhost:8080/actuator/health"
$userOk = Test-Service -Name "User Service (8081)" -Url "http://localhost:8081/actuator/health"
$storyOk = Test-Service -Name "Story Service (8082)" -Url "http://localhost:8082/actuator/health"
$frontendOk = Test-Service -Name "Frontend (5173)" -Url "http://localhost:5173"
$zegaOk = Test-Service -Name "ZEGA AI (8002)" -Url "http://localhost:8002/health"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

if ($eurekaOk -and $gatewayOk -and $userOk -and $storyOk -and $frontendOk -and $zegaOk) {
    Write-Host "All Services Running Successfully!" -ForegroundColor Green
} else {
    Write-Host "Some Services Failed - Please Check" -ForegroundColor Yellow
}

Write-Host "========================================" -ForegroundColor Cyan
