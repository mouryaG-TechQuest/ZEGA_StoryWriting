# 🚀 Quick Start Guide - Running All Services

## One-Command Startup

To start ALL services (Backend + AI + Frontend) in one go:

```cmd
run-all.bat
```

This will launch:
- ✅ **Eureka Server** (8761) - Service Discovery
- ✅ **User Service** (8081) - User Management
- ✅ **Story Service** (8082) - Story Management + Training History API
- ✅ **API Gateway** (8080) - Unified API Entry Point
- ✅ **AI Service** (8001) - Multi-Model Ensemble
- ✅ **ZEGA Model** (8002) - Real-Time Training with Streaming
- ✅ **React Frontend** (5173) - User Interface

---

## 📋 Service Management Commands

### Start All Services
```cmd
run-all.bat
```

### Stop All Services
```cmd
stop-all.bat
```

### Check Service Health
```cmd
check-all-services.bat
```

---

## ⏱️ Startup Timing

**First Run** (requires Maven compilation):
- Total time: ~3-5 minutes
- Services start sequentially with appropriate delays

**Subsequent Runs** (cached):
- Total time: ~1-2 minutes

### Service Startup Order:
1. **Eureka** (15s wait) - Other services need this for discovery
2. **User Service** (5s wait)
3. **Story Service** (5s wait) - Includes Training History API
4. **API Gateway** (10s wait) - Waits for services to register
5. **AI Service** (3s wait)
6. **ZEGA Model** (5s wait) - Includes SSE streaming endpoint
7. **Frontend** (3s wait)

---

## 🔍 Verifying Services

### Method 1: Check All Services Script
```cmd
check-all-services.bat
```

### Method 2: Check Individual URLs

**Backend Services:**
- Eureka Dashboard: http://localhost:8761
- API Gateway: http://localhost:8080/actuator/health
- User Service: http://localhost:8081/actuator/health
- Story Service: http://localhost:8082/actuator/health

**AI Services:**
- AI Service Docs: http://localhost:8001/docs
- ZEGA Health: http://localhost:8002/health
- ZEGA Stats: http://localhost:8002/user/testuser31/stats

**Frontend:**
- React App: http://localhost:5173

### Method 3: Check Ports Manually
```cmd
netstat -an | findstr "8761 8080 8081 8082 8001 8002 5173"
```

---

## 🐛 Troubleshooting

### Issue: Service window closes immediately

**Solution:**
1. Open the service's directory
2. Run manually to see error:
   ```cmd
   cd microservices\story-service
   mvn spring-boot:run
   ```

### Issue: Port already in use

**Solution:**
1. Stop all services:
   ```cmd
   stop-all.bat
   ```
2. Wait 5 seconds
3. Start again:
   ```cmd
   run-all.bat
   ```

### Issue: Python venv not found

**Solution:**
```cmd
cd AIservices
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Issue: Maven not found

**Solution:**
- Install Maven: https://maven.apache.org/download.cgi
- Add to PATH environment variable

### Issue: Node/npm not found

**Solution:**
- Install Node.js: https://nodejs.org/
- Install frontend dependencies:
  ```cmd
  cd Frontend
  npm install
  ```

---

## 🎯 What Each Service Does

### Backend Services (Java/Spring Boot)

**Eureka Server (8761)**
- Service registry and discovery
- Shows health status of all registered services
- Dashboard: http://localhost:8761

**User Service (8081)**
- User registration and authentication
- JWT token generation
- User profile management

**Story Service (8082)**
- Story CRUD operations
- Training History API (NEW!)
  - `GET /api/training-history/user/{userId}`
  - `GET /api/training-history/user/{userId}/stats`
  - Tracks all AI training sessions

**API Gateway (8080)**
- Unified entry point for all backend APIs
- Routes requests to appropriate services
- Load balancing and fault tolerance

### AI Services (Python/FastAPI)

**AI Service (8001)**
- Multi-model story generation
- Ensemble voting across 7 AI models
- Quality scoring and evaluation
- API Docs: http://localhost:8001/docs

**ZEGA Model (8002)**
- Advanced ensemble AI trainer
- Real-time progress streaming (SSE)
- Training history recording
- Endpoints:
  - `POST /auto-train` - Regular training
  - `POST /auto-train-stream` - Real-time streaming
  - `GET /health` - Health check

### Frontend (React + Vite)

**React Application (5173)**
- User interface for all features
- Real-time training progress display
- Training history dashboard
- Story management

---

## 📊 Port Reference

| Service         | Port | Protocol | URL                          |
|----------------|------|----------|------------------------------|
| Eureka         | 8761 | HTTP     | http://localhost:8761        |
| API Gateway    | 8080 | HTTP     | http://localhost:8080        |
| User Service   | 8081 | HTTP     | http://localhost:8081        |
| Story Service  | 8082 | HTTP     | http://localhost:8082        |
| AI Service     | 8001 | HTTP     | http://localhost:8001        |
| ZEGA Model     | 8002 | HTTP/SSE | http://localhost:8002        |
| Frontend       | 5173 | HTTP     | http://localhost:5173        |

---

## 🎨 New Features Available After Startup

### Real-Time Training Progress (SSE Streaming)
Once ZEGA service (8002) is running, the frontend automatically:
- Shows live progress for each training sample
- Displays quality scores in real-time
- Shows training logs as they happen
- Falls back gracefully if streaming unavailable

### Training History Dashboard
Once Story Service (8082) is running, you can:
- View all past training sessions
- See success rates and quality metrics
- Expand session details
- Track model performance over time

---

## 💡 Tips

1. **First startup takes longer** - Maven needs to download dependencies
2. **Wait for Eureka** - Services need time to register (30-60s)
3. **Check Eureka dashboard** - Verify all services show as "UP"
4. **Use check-all-services.bat** - Quick health check
5. **Training History** - Available immediately after Story Service starts
6. **Streaming Progress** - Works automatically when ZEGA service running

---

## 🔄 Development Workflow

### Starting Your Dev Session
```cmd
run-all.bat
```
Wait 2-3 minutes, then open http://localhost:5173

### Making Changes
- **Backend (Java)**: Changes require service restart
- **Frontend (React)**: Hot-reload enabled (instant updates)
- **AI Services (Python)**: `--reload` flag enabled (auto-restart)

### Stopping Your Dev Session
```cmd
stop-all.bat
```

---

## 📝 Quick Commands Reference

```cmd
# Start everything
run-all.bat

# Check what's running
check-all-services.bat

# Stop everything
stop-all.bat

# Start individual services (if needed)
start-eureka.bat
start-user.bat
start-story.bat
start-gateway.bat
start-frontend.bat

# Manual Maven build (if needed)
cd microservices
mvn clean install -DskipTests

# Manual Frontend build
cd Frontend
npm install
npm run build
```

---

## 🌟 Success Indicators

You'll know everything is working when:

1. ✅ All 7 service windows stay open (don't close immediately)
2. ✅ `check-all-services.bat` shows 7/7 services running
3. ✅ Eureka dashboard shows 4 services registered
4. ✅ Frontend loads at http://localhost:5173
5. ✅ Training progress shows real-time updates
6. ✅ Training history displays past sessions

---

**Ready to go!** 🎉

Run `run-all.bat` and you're all set!
