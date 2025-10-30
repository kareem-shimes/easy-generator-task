# EasyGenerator Authentication API - Documentation

## 📖 Overview

This documentation provides comprehensive guidance for the backend authentication API built with NestJS and MongoDB. The API implements secure user authentication with sign-up, sign-in, and protected endpoints functionality.

## 🎯 Project Purpose

This authentication API is built as part of a full-stack test task to demonstrate:
- Production-ready backend development practices
- Secure authentication implementation
- Clean, maintainable code architecture
- Industry-standard security practices

## 📚 Documentation Structure

### 🔧 [Technical Documentation](./technical/)
- **[Architecture](./technical/architecture.md)** - System design and application structure
- **[Database Schema](./technical/database-schema.md)** - MongoDB collections and data models
- **[API Endpoints](./technical/api-endpoints.md)** - Complete API reference with request/response examples
- **[Security](./technical/security.md)** - Security implementation and best practices

### 💻 [Development Documentation](./development/)
- **[Setup Guide](./development/setup.md)** - Getting started with the project
- **[Environment Variables](./development/environment.md)** - Configuration and environment setup
- **[Testing](./development/testing.md)** - Testing strategy and running tests
- **[Deployment](./development/deployment.md)** - Deployment guidelines and production setup
- **[GitHub Workflows](./development/github-workflows.md)** - CI/CD with GitHub Actions

### ✨ [Features Documentation](./features/)
- **[Authentication Flow](./features/authentication.md)** - Sign-up and sign-in process
- **[User Management](./features/user-management.md)** - User data handling and validation
- **[Protected Routes](./features/protected-routes.md)** - JWT-based route protection

## 🚀 Quick Start

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env

# Start MongoDB (if running locally)
docker-compose up -d

# Run in development mode
pnpm run start:dev

# Run tests
pnpm run test
```

## 📋 Task Requirements

This backend implements the following requirements:

### Core Features
- ✅ User sign-up with validation (email, name, password)
- ✅ User sign-in with JWT authentication
- ✅ **Refresh token rotation** with httpOnly cookies
- ✅ **Token refresh endpoint** for seamless authentication
- ✅ **Logout endpoint** to clear refresh tokens
- ✅ Protected endpoints with JWT guards
- ✅ MongoDB integration
- ✅ NestJS framework implementation

### Validation Rules
- **Email**: Valid email format
- **Name**: Minimum 3 characters
- **Password**: 
  - Minimum 8 characters
  - At least one letter
  - At least one number
  - At least one special character

### Nice-to-Haves
- ✅ Refresh token implementation (httpOnly cookies)
- ✅ Token rotation on refresh
- ✅ Logging implementation
- ✅ Security best practices
- ✅ API documentation (Swagger/OpenAPI)
- ✅ Error handling
- ✅ Testing coverage
- ✅ CI/CD setup

## 🛠️ Tech Stack

- **Framework**: NestJS 11
- **Database**: MongoDB
- **ORM**: Mongoose
- **Authentication**: JWT (Dual token system)
  - Access tokens (1 hour)
  - Refresh tokens (7 days) with rotation
- **Session Management**: httpOnly cookies
- **Cookie Parsing**: cookie-parser
- **Validation**: class-validator
- **API Documentation**: Swagger/OpenAPI 3.0
- **Testing**: Jest
- **Logging**: NestJS Logger
- **Package Manager**: pnpm
- **CI/CD**: GitHub Actions

## 📞 Support

For questions or issues, please refer to the specific documentation sections or create an issue in the repository.

## 🔗 Related Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)