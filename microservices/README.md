# Story App - Microservices Architecture

## 🎯 Overview

Your Story Writing application has been successfully refactored from a monolithic architecture into a **microservices architecture** with the following services:

### Services Architecture

```
┌─────────────────┐
│   Frontend      │
│  (React:5173)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  API Gateway    │
│   (Port 8080)   │
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐  ┌────────┐
│ User   │  │ Story  │
│Service │  │Service │
│ :8081  │  │ :8082  │
└────────┘  └────────┘
    │          │
    ▼          ▼
┌────────┐  ┌────────┐
│userdb  │  │storydb │
└────────┘  └────────┘
```

## 📁 Project Structure

```
StoryWritingProject/
├── Backend/                    # Original monolithic app (keep as reference)
├── Frontend/                   # React frontend (no changes needed)
└── microservices/
    ├── pom.xml                # Parent POM
    ├── api-gateway/           # Port 8080 - Routes requests
    │   ├── pom.xml
    │   └── src/main/
    │       ├── java/com/storyapp/gateway/
    │       │   └── ApiGatewayApplication.java
    │       └── resources/
    │           └── application.properties
    │
    ├── user-service/          # Port 8081 - Authentication
    │   ├── pom.xml
    │   └── src/main/
    │       ├── java/com/storyapp/user/
    │       │   ├── UserServiceApplication.java
    │       │   ├── controller/
    │       │   │   └── AuthController.java
    │       │   ├── model/
    │       │   │   └── User.java
    │       │   ├── repository/
    │       │   │   └── UserRepository.java
    │       │   └── security/
    │       │       └── JwtTokenProvider.java
    │       └── resources/
    │           └── application.properties
    │
    └── story-service/         # Port 8082 - Story management
        ├── pom.xml
        └── src/main/
            ├── java/com/storyapp/story/
            │   ├── StoryServiceApplication.java
            │   ├── controller/
            │   ├── model/
            │   │   ├── Story.java
            │   │   └── Character.java
            │   ├── repository/
            │   ├── service/
            │   └── dto/
            └── resources/
                └── application.properties
```

## 🚀 Getting Started

### Prerequisites

- Java 21
- Maven 3.8+
- MySQL 8.0+
- Node.js 18+ (for frontend)

### Step 1: Setup Databases

```sql
-- Create databases
CREATE DATABASE userdb;
CREATE DATABASE storydb;

-- Grant permissions
GRANT ALL PRIVILEGES ON userdb.* TO 'root'@'localhost';
GRANT ALL PRIVILEGES ON storydb.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
```

### Step 2: Build All Services

```cmd
cd c:\Users\hp\Desktop\StoryWritingProject\microservices
mvn clean install
```

### Step 3: Start Services (in order)

**Terminal 1 - API Gateway:**
```cmd
cd c:\Users\hp\Desktop\StoryWritingProject\microservices\api-gateway
mvn spring-boot:run
```

**Terminal 2 - User Service:**
```cmd
cd c:\Users\hp\Desktop\StoryWritingProject\microservices\user-service
mvn spring-boot:run
```

**Terminal 3 - Story Service:**
```cmd
cd c:\Users\hp\Desktop\StoryWritingProject\microservices\story-service
mvn spring-boot:run
```

**Terminal 4 - Frontend:**
```cmd
cd c:\Users\hp\Desktop\StoryWritingProject\Frontend
npm run dev
```

### Step 4: Verify Services

- **API Gateway**: http://localhost:8080
- **User Service**: http://localhost:8081
- **Story Service**: http://localhost:8082
- **Frontend**: http://localhost:5173

## 🔧 Configuration

### User Service (application.properties)

```properties
server.port=8081
spring.application.name=user-service

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/userdb?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root

# JWT
jwt.secret=MySecretKeyForJWTSigningReplaceWithStrongerOne
jwt.expiration=86400000
```

### Story Service (application.properties)

```properties
server.port=8082
spring.application.name=story-service

# Database
spring.datasource.url=jdbc:mysql://localhost:3306/storydb?createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
```

### API Gateway (application.properties)

```properties
server.port=8080
spring.application.name=api-gateway

# Routes
spring.cloud.gateway.routes[0].id=user-service
spring.cloud.gateway.routes[0].uri=lb://user-service
spring.cloud.gateway.routes[0].predicates[0]=Path=/api/auth/**

spring.cloud.gateway.routes[1].id=story-service
spring.cloud.gateway.routes[1].uri=lb://story-service
spring.cloud.gateway.routes[1].predicates[0]=Path=/api/stories/**
```

## 📊 API Endpoints

### Via API Gateway (http://localhost:8080)

**Authentication (User Service):**
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login
- GET `/api/auth/validate` - Validate JWT token

**Stories (Story Service):**
- GET `/api/stories` - Get all stories
- GET `/api/stories/my-stories` - Get user's stories
- GET `/api/stories/{id}` - Get story by ID
- POST `/api/stories` - Create story
- PUT `/api/stories/{id}` - Update story
- DELETE `/api/stories/{id}` - Delete story

## ✅ Benefits of Microservices Architecture

1. **Independent Deployment**: Update user authentication without touching story logic
2. **Scalability**: Scale story service independently during high load
3. **Technology Flexibility**: Use different databases/technologies per service
4. **Fault Isolation**: User service down? Stories still viewable
5. **Team Autonomy**: Different teams can work on different services
6. **Reusability**: Use user-service in other projects

## 🔄 Migration from Monolith

**No Frontend Changes Required!** Your frontend continues to call `http://localhost:8080/api/*` - the API Gateway handles routing to microservices transparently.

## 🐳 Docker Deployment (Optional)

Create `docker-compose.yml` in `microservices/` folder:

```yaml
version: '3.8'
services:
  mysql-users:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: userdb
    ports:
      - "3307:3306"

  mysql-stories:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: storydb
    ports:
      - "3308:3306"

  user-service:
    build: ./user-service
    ports:
      - "8081:8081"
    depends_on:
      - mysql-users

  story-service:
    build: ./story-service
    ports:
      - "8082:8082"
    depends_on:
      - mysql-stories

  api-gateway:
    build: ./api-gateway
    ports:
      - "8080:8080"
    depends_on:
      - user-service
      - story-service
```

Run: `docker-compose up`

## 🛠️ Next Steps

1. **Add Service Discovery** (Eureka Server) for dynamic service registration
2. **Implement Circuit Breakers** (Resilience4j) for fault tolerance
3. **Add Distributed Tracing** (Zipkin/Sleuth) for debugging
4. **Centralized Configuration** (Spring Cloud Config)
5. **Add Message Queue** (RabbitMQ/Kafka) for async communication
6. **API Documentation** (Swagger/OpenAPI per service)

## 📝 Notes

- Each service has its own database (database-per-service pattern)
- JWT tokens are validated by User Service via Feign client
- API Gateway handles CORS centrally
- Services communicate via REST (can be upgraded to messaging)

## 🚨 Troubleshooting

**Port already in use:**
```cmd
netstat -ano | findstr :<PORT>
taskkill /PID <PID> /F
```

**Database connection failed:**
- Verify MySQL running: `services.msc`
- Check credentials in application.properties
- Ensure databases created

**Service not registered:**
- Wait 30 seconds for Eureka registration
- Check Eureka dashboard (if using)
- Verify `eureka.client.service-url.defaultZone`

## 📞 Support

For issues or questions about the microservices architecture, refer to:
- Spring Cloud Gateway docs
- Spring Cloud Netflix docs
- Microservices patterns: https://microservices.io

---

**Ready to use in other projects!** Each service is now independently deployable and reusable.
