@echo off
echo Starting AI Service...
cd AIservices
call venv\Scripts\activate
uvicorn app.main:app --reload --port 8001
