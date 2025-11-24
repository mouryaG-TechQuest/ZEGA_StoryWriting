# Authentication & Security

## Overview
The application features a robust authentication system with enhanced security measures, including email verification, OAuth2 support, password history, and secure profile management.

## Features

### User Management
- **Registration**: Comprehensive sign-up with validation for username, email, password strength, and personal details.
- **Profile Management**: Users can update their profile, including changing their username and email (requires re-verification).
- **Password History**: The system tracks the last 5 passwords to prevent reuse, enhancing account security.

### Security Measures
- **Email Verification**: New accounts require email verification via a 24-hour token link.
- **Password Reset**: Secure 5-digit code based password reset flow (codes expire in 15 minutes).
- **Username Recovery**: Users can recover their username via email.
- **OAuth2 Support**: Integration with Google and Microsoft for one-click login (requires configuration).
- **JWT Authentication**: Stateless authentication using JSON Web Tokens.

## Configuration

### Email Service
The system uses SMTP for sending emails. Configure your provider in `application.properties`:

**Gmail Example:**
```properties
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

### OAuth2 Setup
To enable social login, configure the client IDs and secrets in `application.properties`:

**Google:**
```properties
spring.security.oauth2.client.registration.google.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_CLIENT_SECRET
```

**Microsoft:**
```properties
spring.security.oauth2.client.registration.microsoft.client-id=YOUR_CLIENT_ID
spring.security.oauth2.client.registration.microsoft.client-secret=YOUR_CLIENT_SECRET
```

## API Endpoints

### Authentication
- `POST /api/auth/register`: Register a new user.
- `POST /api/auth/login`: Authenticate and receive a JWT.
- `GET /api/auth/verify-email`: Verify email address with token.

### Account Recovery
- `POST /api/auth/forgot-password`: Request a password reset code.
- `POST /api/auth/reset-password`: Reset password using the code.
- `POST /api/auth/forgot-username`: Recover username via email.

### Profile
- `PUT /api/auth/profile`: Update user profile (requires JWT).

## Database Schema
The system uses the following tables for security:
- `users`: Stores user credentials and profile info.
- `password_history`: Tracks previous passwords.

**Migration:**
Run `microservices/user-service/add-security-features.sql` to update an existing database schema.

## Security Best Practices
- **Password Hashing**: All passwords are hashed using Bcrypt.
- **Token Expiry**: Verification tokens expire in 24 hours; reset codes in 15 minutes.
- **Input Validation**: Strict validation on all user inputs to prevent injection and bad data.
- **Enumeration Prevention**: Generic responses for invalid emails during recovery to prevent user enumeration.
