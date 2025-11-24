# Getting Started Guide

## Prerequisites
Before you begin, ensure you have the following installed:
- **Java JDK 21**: [Download](https://adoptium.net/)
- **Maven**: [Download](https://maven.apache.org/download.cgi)
- **Node.js & npm**: [Download](https://nodejs.org/) (LTS version)
- **MySQL Server 8.0+**: [Download](https://dev.mysql.com/downloads/installer/)

## Initial Setup

### 1. Database Setup
Create the required databases in MySQL:
```sql
CREATE DATABASE userdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE storydb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Configure Credentials
If your MySQL root password is not "root", update `application.properties` in:
- `microservices/user-service/src/main/resources/application.properties`
- `microservices/story-service/src/main/resources/application.properties`

```properties
spring.datasource.password=YOUR_PASSWORD
```

### 3. Build Backend
```cmd
cd microservices
mvn clean install -DskipTests
```

### 4. Install Frontend Dependencies
```cmd
cd Frontend
npm install
```

## Running the Application

### Quick Start (Recommended)
Use the improved one-click script to start all services in the correct order with verification:
```cmd
quick-start-improved.bat
```
This script will:
1. Start Eureka Server (and wait for it to be ready).
2. Start User, Story, and Gateway services.
3. Start the Frontend.
4. Verify all services are running.

### Manual Start
If you prefer to start services individually, run them in this specific order:
1. `start-eureka.bat` (Wait 40s)
2. `start-user.bat` (Wait 20s)
3. `start-story.bat` (Wait 20s)
4. `start-gateway.bat` (Wait 25s)
5. `start-frontend.bat`

## Accessing the Application
- **Frontend**: http://localhost:5173
- **Eureka Dashboard**: http://localhost:8761
- **API Gateway**: http://localhost:8080

## First Time Use
1. Open the frontend URL.
2. Click "Register" to create a new account.
3. Log in and start creating stories!

## Stopping the Application
To stop all running services:
```cmd
stop-all.bat
```
Or manually close the terminal windows.
