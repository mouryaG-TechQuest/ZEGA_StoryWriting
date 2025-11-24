# Troubleshooting Guide

## Common Issues

### Services Won't Start
- **Port Conflicts**: Ensure ports 8761, 8080, 8081, 8082, and 5173 are free.
  ```cmd
  netstat -ano | findstr :8080
  taskkill /PID <process_id> /F
  ```
- **Database Connection**: Verify MySQL is running and credentials in `application.properties` are correct.

### Frontend Issues
- **Blank Page**: Check browser console (F12) for errors. Verify API Gateway is running at http://localhost:8080.
- **CORS Errors**: Ensure you are accessing the app via `localhost:5173` and the Gateway is running.

### Service Discovery (Eureka)
- **Services Not Registered**: If services don't appear in the Eureka dashboard (http://localhost:8761), they may have started before Eureka was ready. Use `quick-start-improved.bat` or restart the specific service.
- **Gateway 503 Error**: This usually means the Gateway cannot find the Story or User service in Eureka. Wait a minute for registration to complete.

### Build Failures
- **Maven**: Run `mvn clean install -U -DskipTests` to force update dependencies.
- **npm**: Delete `node_modules` and `package-lock.json`, then run `npm install`.

## Logs
- **Backend**: Check the terminal windows for each service.
- **Frontend**: Check the browser console and the terminal running the Vite server.

## Resetting Data
To completely reset the application data:
```sql
DROP DATABASE userdb;
DROP DATABASE storydb;
CREATE DATABASE userdb;
CREATE DATABASE storydb;
```
Restart the backend services to let Hibernate recreate the tables.
