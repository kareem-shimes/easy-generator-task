# EasyGenerator Authentication API

A production-ready, enterprise-grade authentication API built with NestJS, MongoDB, and JWT. This project implements secure user registration, authentication, and session management using modern security practices including refresh token rotation, httpOnly cookies, and comprehensive validation.

Perfect for microservices architectures, this API can be used as a standalone authentication service or integrated into larger applications. It includes full Docker support, comprehensive testing, API documentation, and is ready for production deployment with Nginx reverse proxy and SSL/TLS support.

## 🎯 Features

- ✅ User sign-up with email validation
- ✅ User sign-in with JWT authentication
- ✅ **Refresh token rotation** with httpOnly cookies
- ✅ **Dual token system** (access + refresh tokens)
- ✅ Protected endpoints with JWT guards
- ✅ MongoDB integration with Mongoose
- ✅ Password hashing with bcrypt
- ✅ Request validation with class-validator
- ✅ Swagger/OpenAPI documentation
- ✅ Logging and error handling
- ✅ CORS enabled
- ✅ Cookie-based authentication
- ✅ Docker support
- ✅ Environment-based configuration

## 📋 Requirements

- Node.js 18+
- pnpm 10.18.3+ (managed via corepack)
- MongoDB 6.0+
- Docker & Docker Compose (optional, for containerized deployment)

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/kareem-shimes/easy-generator-task
cd auth-api

# Enable pnpm (if not already installed)
corepack enable
corepack prepare pnpm@10.18.3 --activate

# Install dependencies
pnpm install
```

### 2. Set Up Environment

```bash
# Copy example environment file
cp .env.example .env

# Generate secure JWT secrets (use different secrets for access and refresh tokens)
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For JWT_REFRESH_SECRET

# Edit .env and add your MongoDB URI and JWT secrets
```

### 3. Start MongoDB

**Option A: Using Docker**

```bash
docker-compose up -d mongodb
```

**Option B: Local MongoDB**

```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### 4. Run the Application

```bash
# Development mode with hot-reload
pnpm run start:dev

# Production mode
pnpm run build
pnpm run start:prod
```

The API will be running at:

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

## 📚 API Endpoints

All endpoints return JSON responses. The API uses Bearer token authentication for protected routes.

### Authentication Endpoints

#### Sign Up

Creates a new user account and returns access token with httpOnly refresh token cookie.

```bash
POST /auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}

# Response (201 Created)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
# + Sets httpOnly cookie: refresh_token
```

#### Sign In

Authenticates user credentials and returns access token with httpOnly refresh token cookie.

```bash
POST /auth/signin
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
# + Sets httpOnly cookie: refresh_token
```

#### Refresh Token

Uses refresh token from httpOnly cookie to generate new access and refresh tokens.

```bash
POST /auth/refresh
# Note: Refresh token is automatically sent via httpOnly cookie
# Make sure to include credentials in your request

# Response (200 OK)
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
# + Updates httpOnly cookie: refresh_token (rotated)
```

#### Logout

Clears the refresh token cookie. Client should also discard the access token.

```bash
POST /auth/logout

# Response (200 OK)
{
  "message": "Logged out successfully"
}
# + Clears httpOnly cookie: refresh_token
```

### User Endpoints (Protected)

These endpoints require a valid JWT access token in the Authorization header.

#### Get Profile

Retrieves the current user's profile information.

```bash
GET /users/me
Authorization: Bearer <your_jwt_token>

# Response (200 OK)
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-10-29T16:45:00.000Z",
  "updatedAt": "2025-10-29T16:45:00.000Z"
}
```

#### Update Profile

Updates the current user's profile information.

```bash
PATCH /users/me
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "John Smith"
}

# Response (200 OK)
{
  "id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Smith",
  "createdAt": "2025-10-29T16:45:00.000Z",
  "updatedAt": "2025-10-30T10:30:00.000Z"
}
```

### Health Check

#### Health Status

Returns the API health status and database connection state.

```bash
GET /health

# Response (200 OK)
{
  "status": "ok",
  "timestamp": "2025-10-30T04:26:01.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

### Example Usage with cURL

```bash
# Sign up a new user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User","password":"Test123!@#"}'

# Sign in (save cookies)
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@example.com","password":"Test123!@#"}'

# Get profile (use access token from signin response)
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE"

# Refresh token (use saved cookies)
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Update profile
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Name"}'

# Logout
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

## 🔒 Validation Rules

- **Email**: Must be a valid email format
- **Name**: Minimum 3 characters
- **Password**:
  - Minimum 8 characters
  - At least one letter
  - At least one number
  - At least one special character (@$!%\*#?&)

## 🐳 Docker Deployment

The project includes Docker support for development environment.

### Quick Start with Docker

**Note**: Docker Compose configuration is located at the **project root** and manages both frontend and backend services.

```bash
# Navigate to project root
cd ..

# Start all services (backend, frontend, mongodb)
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Features

**Development Environment:**

- ✅ Hot reload with volume mounts (src/ and test/ directories)
- ✅ Debug port exposed (9229)
- ✅ All dev dependencies included
- ✅ Docker development mode with `Dockerfile.dev`
- ✅ Automatic restart on file changes
- ✅ MongoDB service included

**Docker Services:**
- **backend**: API on port 3000
- **frontend**: Next.js app on port 3001
- **mongodb**: Database on port 27017

See the [Root README](../README.md) for comprehensive Docker setup guide and [Docker Documentation](./docs/development/docker.md) for detailed information.

## 🧪 Testing

```bash
# Run unit tests
pnpm run test

# Run e2e tests (uses .env.test configuration)
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

**E2E Test Configuration:**

- E2E tests automatically use `.env.test` file (separate test database)
- Test database: `easygenerator-auth-test` (isolated from development/production)
- Database is automatically cleaned before and after tests
- Requires MongoDB running locally or via Docker: `docker-compose up -d mongodb`
- Tests run with `NODE_ENV=test` to load test-specific configuration

## 📜 Available Scripts

```bash
# Development
pnpm run start           # Start application
pnpm run start:dev       # Start in development mode with hot-reload
pnpm run start:debug     # Start in debug mode with inspector
pnpm run start:prod      # Start in production mode

# Building
pnpm run build           # Build the application
pnpm run build:openapi   # Generate OpenAPI specification

# Code Quality
pnpm run format          # Format code with Prettier
pnpm run lint            # Lint and fix code with ESLint

# Testing
pnpm run test            # Run unit tests
pnpm run test:watch      # Run tests in watch mode
pnpm run test:cov        # Run tests with coverage report
pnpm run test:debug      # Run tests in debug mode
pnpm run test:e2e        # Run end-to-end tests
```

## 📖 Documentation

Comprehensive documentation is available in the `/docs` folder:

- [Setup Guide](./docs/development/setup.md)
- [API Endpoints](./docs/technical/api-endpoints.md)
- [Architecture](./docs/technical/architecture.md)
- [Security](./docs/technical/security.md)
- [Environment Variables](./docs/development/environment.md)

## 🛠️ Tech Stack

- **Framework**: NestJS 11.0.1
- **Runtime**: Node.js 18 (Alpine Linux)
- **Database**: MongoDB 6.0 with Mongoose 8.19.2
- **Authentication**: JWT (Dual token system with refresh token rotation)
- **Session Management**: httpOnly cookies for refresh tokens
- **Validation**: class-validator 0.14.2 & class-transformer 0.5.1
- **Documentation**: Swagger/OpenAPI 3.0 (@nestjs/swagger 11.2.1)
- **Password Hashing**: bcrypt 6.0.0
- **Cookie Parsing**: cookie-parser 1.4.7
- **Testing**: Jest 30.0.0 with Supertest 7.0.0
- **Package Manager**: pnpm 10.18.3
- **TypeScript**: 5.7.3
- **Containerization**: Docker with multi-stage builds
- **Reverse Proxy**: Nginx (Alpine) with SSL/TLS support

## 📁 Project Structure

```
easygenerator-auth-api/
├── src/
│   ├── auth/                    # Authentication module
│   │   ├── dto/                # DTOs (SignUp, SignIn, AuthResponse)
│   │   ├── guards/             # Auth guards (JWT, Local, RefreshToken)
│   │   ├── strategies/         # Passport strategies (JWT, Local, RefreshToken)
│   │   ├── auth.controller.ts  # Auth endpoints (/signup, /signin, /refresh, /logout)
│   │   ├── auth.service.ts     # Authentication business logic
│   │   └── auth.module.ts      # Auth module definition
│   ├── users/                   # Users module
│   │   ├── dto/                # User DTOs (UpdateUser)
│   │   ├── entities/           # User entity (for API responses)
│   │   ├── schemas/            # Mongoose schema (User model)
│   │   ├── users.controller.ts # User endpoints (/users/me)
│   │   ├── users.service.ts    # User business logic
│   │   └── users.module.ts     # Users module definition
│   ├── config/                  # Configuration module
│   │   ├── configuration.ts    # Environment configuration loader
│   │   └── validation.schema.ts # Env validation with class-validator
│   ├── common/                  # Shared resources
│   │   ├── filters/            # HTTP exception filters
│   │   └── interceptors/       # Logging interceptors
│   ├── health/                  # Health check module
│   │   ├── health.controller.ts # Health endpoint
│   │   └── health.module.ts    # Health module definition
│   ├── app.module.ts           # Root application module
│   ├── app.controller.ts       # Root controller
│   ├── app.service.ts          # Root service
│   └── main.ts                 # Application entry point
├── test/                        # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── docs/                        # Documentation
│   ├── development/            # Development guides
│   ├── features/               # Feature documentation
│   └── technical/              # Technical documentation
├── scripts/                     # Utility scripts
│   ├── docker-entrypoint.sh
│   ├── docker-healthcheck.sh
│   ├── generate-openapi.ts
│   └── generate-ssl-cert.sh
├── nginx/                       # Nginx configuration
│   ├── nginx.conf              # Reverse proxy config
│   └── ssl/                    # SSL certificates
├── .github/                     # GitHub Actions workflows
│   └── workflows/              # CI/CD pipelines
├── docker-compose.yml          # Development Docker setup
├── docker-compose.prod.yml     # Production Docker setup
├── Dockerfile                  # Production Docker image
├── Dockerfile.dev              # Development Docker image
├── .env.example                # Environment variables template
├── .env.development            # Development environment
├── .env.test                   # Test environment
└── package.json                # Dependencies and scripts
```

## 🔧 Environment Variables

| Variable                 | Description                          | Default                                               |
| ------------------------ | ------------------------------------ | ----------------------------------------------------- |
| `MONGODB_URI`            | MongoDB connection string            | `mongodb://localhost:27017/easygenerator-auth`        |
| `JWT_SECRET`             | Secret key for access token signing  | (required, min 32 chars)                              |
| `JWT_EXPIRES_IN`         | Access token expiration time         | `1h`                                                  |
| `JWT_REFRESH_SECRET`     | Secret key for refresh token signing | (required, min 32 chars, must differ from JWT_SECRET) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration time        | `7d`                                                  |
| `PORT`                   | Server port                          | `3000`                                                |
| `NODE_ENV`               | Environment mode                     | `development`                                         |
| `LOG_LEVEL`              | Logging level                        | `debug`                                               |
| `CORS_ORIGIN`            | Allowed CORS origins                 | `*`                                                   |

## 🔐 Security Features

This project implements multiple layers of security:

### Authentication & Authorization

- **Dual Token System**: Separate access and refresh tokens with different expiration times
- **Token Rotation**: New refresh token issued on each refresh request
- **HttpOnly Cookies**: Refresh tokens stored in httpOnly cookies (not accessible via JavaScript)
- **SameSite Strict**: CSRF protection via SameSite cookie attribute
- **Password Hashing**: Bcrypt with salt rounds for secure password storage
- **JWT Guards**: Route protection with Passport JWT strategy

### API Security

- **Input Validation**: Class-validator for DTO validation on all endpoints
- **Whitelist Mode**: Strip unknown properties from requests
- **Rate Limiting**: Nginx-based rate limiting (5 req/s for auth, 10 req/s for API)
- **CORS Configuration**: Configurable CORS origins
- **Security Headers**: HSTS, X-Frame-Options, X-Content-Type-Options, CSP

### Infrastructure Security

- **Non-Root User**: Docker containers run as non-root user (nodejs:1001)
- **Environment Isolation**: Separate configurations for dev/test/prod
- **SSL/TLS Support**: Nginx reverse proxy with TLS 1.2/1.3
- **Health Checks**: Container health monitoring
- **Secret Management**: Environment-based secrets (never hardcoded)

### Best Practices

- **Minimal Docker Images**: Alpine Linux base for smaller attack surface
- **Multi-Stage Builds**: Production images contain only necessary files
- **Dependency Auditing**: Regular security updates via pnpm
- **Log Sanitization**: Sensitive data excluded from logs

## 🚦 CI/CD

The project includes GitHub Actions workflows for continuous integration and deployment:

- **CI Pipeline** (`.github/workflows/ci.yml`): Automated testing and linting on pull requests
- **Deploy Pipeline** (`.github/workflows/deploy.yml`): Automated deployment to production

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**

```bash
# Ensure MongoDB is running
docker-compose up -d mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in .env file
```

**Port Already in Use**

```bash
# Check what's using port 3000
lsof -i :3000

# Or change PORT in .env file
PORT=3001
```

**PNPM Not Found**

```bash
# Enable corepack (comes with Node.js 16.9+)
corepack enable
corepack prepare pnpm@10.18.3 --activate
```

**Docker Build Fails**

```bash
# Clean Docker cache and rebuild
docker system prune -af
make dev-build
```

**E2E Tests Fail**

```bash
# Ensure test database is clean
# The tests should auto-cleanup, but you can manually drop it:
docker-compose exec mongodb mongosh -u admin -p password123 --authenticationDatabase admin
# Then in mongosh:
use easygenerator-auth-test
db.dropDatabase()
```

**JWT Token Errors**

- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are at least 32 characters
- Ensure `JWT_SECRET` and `JWT_REFRESH_SECRET` are different values
- Check token expiration times in `.env`

### Getting Help

- Check the [documentation](./docs/) folder for detailed guides
- Review [API endpoints documentation](./docs/technical/api-endpoints.md)
- Examine logs: `make dev-logs` or `docker-compose logs -f api`

## 📝 License

This project is MIT licensed.
