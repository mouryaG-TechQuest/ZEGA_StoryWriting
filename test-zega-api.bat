@echo off
echo Testing ZEGA API Endpoints...
echo.

echo 1. Testing Health Endpoint...
curl -X GET http://localhost:8002/health
echo.
echo.

echo 2. Testing Predict Endpoint (Story Generation)...
curl -X POST http://localhost:8002/predict ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"test-user\",\"context\":\"Generate a JSON story\",\"instruction\":\"Create a short fantasy story with title and description in JSON format: {\\\"title\\\": \\\"...\\\", \\\"description\\\": \\\"...\\\"}\",\"mode\":\"scene\"}"
echo.
echo.

echo 3. Testing Learn Endpoint (Training)...
curl -X POST http://localhost:8002/learn ^
  -H "Content-Type: application/json" ^
  -d "{\"user_id\":\"test-user\",\"text\":\"This is a test story about a hero.\",\"rating\":5.0}"
echo.
echo.

echo 4. Testing Metrics Endpoint...
curl -X GET http://localhost:8002/metrics
echo.
echo.

echo Tests completed!
pause
