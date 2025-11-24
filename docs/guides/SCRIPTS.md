# Script Reference

The project includes several batch scripts to simplify development and deployment.

## Startup Scripts

### `quick-start-improved.bat` (Recommended)
The most reliable way to start the application. It starts services in the correct order, waits for initialization, and verifies connectivity.

### `quick-start.bat`
A faster startup script with shorter wait times. Use this if your machine is fast and you've already built the project recently.

### `start-clean.bat`
Performs a full clean build (Maven & npm) before starting services. Use this if you've made significant changes or are encountering build issues.

### `run-all.bat`
A simple script that launches all service start scripts.

## Individual Service Scripts
- `start-eureka.bat`: Starts the Eureka Discovery Server.
- `start-gateway.bat`: Starts the API Gateway.
- `start-user.bat`: Starts the User Service.
- `start-story.bat`: Starts the Story Service.
- `start-frontend.bat`: Starts the React Frontend.

## Utility Scripts

### `stop-all.bat`
Forcefully stops all Java and Node.js processes related to the project. Use this to ensure a clean shutdown.

### `verify-all-users.sql`
A SQL script to check user data in the database.

### `clean-database.sql`
A SQL script to reset the database state (use with caution).
