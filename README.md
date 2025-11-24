# Story Writing Project

A comprehensive microservices-based application for writing, sharing, and managing stories.

## 🚀 Quick Start

The fastest way to get started is using the improved one-click script:

```cmd
quick-start-improved.bat
```

This will start all services (Eureka, Gateway, User, Story, Frontend) in the correct order and verify their status.

For more details, see the [Getting Started Guide](docs/guides/GETTING_STARTED.md).

## 📚 Documentation

The documentation is organized in the `docs/` directory:

### Guides
- [Getting Started](docs/guides/GETTING_STARTED.md): Installation and setup instructions.
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md): Common issues and fixes.
- [Scripts Reference](docs/guides/SCRIPTS.md): Details on available batch scripts.
- [Image Storage](docs/guides/IMAGE_STORAGE.md): How images are stored and managed.

### Features
- [Authentication](docs/features/AUTHENTICATION.md): Security, OAuth2, and user management.
- [Characters](docs/features/CHARACTERS.md): Character management features.
- [Genres](docs/features/GENRES.md): Genre system and filtering.
- [Timeline](docs/features/TIMELINE.md): Scene timeline and navigation.
- [Story Cards](docs/features/STORY_CARDS.md): Browsing and search features.
- [UI/UX](docs/features/UI_UX.md): Recent interface improvements.

### Performance
- [Optimization Summary](docs/performance/SUMMARY.md): Details on frontend and backend performance improvements.

## 🏗️ Architecture

The project follows a microservices architecture:
- **Frontend**: React + Vite + Tailwind CSS
- **API Gateway**: Spring Cloud Gateway (Port 8080)
- **Service Discovery**: Netflix Eureka (Port 8761)
- **User Service**: Spring Boot (Port 8081)
- **Story Service**: Spring Boot (Port 8082)
- **Database**: MySQL 8.0

## 🛠️ Development

### Prerequisites
- Java JDK 21
- Maven
- Node.js & npm
- MySQL Server

### Commands
- **Start All**: `quick-start-improved.bat`
- **Stop All**: `stop-all.bat`
- **Clean Build**: `start-clean.bat`

## 📄 License
This project is licensed under the MIT License.
