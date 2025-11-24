@echo off
echo Testing AI Service Startup...
cd AIservices\zega
python -m uvicorn api:app --host 0.0.0.0 --port 8002
pause
