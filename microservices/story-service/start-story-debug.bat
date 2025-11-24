@echo off
cd /d "%~dp0"
echo Starting Story Service...
java -jar target\story-service-0.0.1-SNAPSHOT.jar
pause
