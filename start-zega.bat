@echo off
echo Starting ZEGA Model Service...
cd AIservices\zega
python -m uvicorn api:app --host 0.0.0.0 --port 8002 --reload
pause
