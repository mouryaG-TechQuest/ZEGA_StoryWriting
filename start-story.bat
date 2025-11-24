@echo off
cd /d "%~dp0microservices\story-service"
echo Starting Story Service on port 8082...
mvn spring-boot:run
pause
