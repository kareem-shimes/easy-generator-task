# System Architecture

## Overview

The EasyGenerator Authentication API follows a modular, layered architecture pattern based on NestJS best practices. This document outlines the system design, component structure, and architectural decisions.

## Architecture Pattern

### Layered Architecture

```
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  (HTTP Handlers, Route Definitions)     │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│          Services Layer                 │
│    (Business Logic, Use Cases)          │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│       Repository Layer                  │
│   (Data Access, Mongoose Models)        │
└─────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────┐
│         MongoDB Database                │
└─────────────────────────────────────────┘
```

## Module Structure

### Core Modules

#### 1. Auth Module
**Purpose**: Handles authentication logic including sign-up and sign-in

**Components**:
- `AuthController`: Manages HTTP endpoints for authentication (signup, signin, refresh, logout)
- `AuthService`: Business logic for user registration, login, and token refresh
- `JwtStrategy`: Passport strategy for access token validation
- `LocalStrategy`: Passport strategy for username/password validation
- `RefreshTokenStrategy`: Passport strategy for refresh token validation
- `JwtAuthGuard`: Protects routes requiring access token
- `RefreshTokenAuthGuard`: Protects refresh endpoint

**Responsibilities**:
- User registration with validation
- User authentication
- JWT access token generation (1 hour)
- JWT refresh token generation (7 days)
- Token refresh and rotation
- User logout and token invalidation
- Password hashing and verification
- httpOnly cookie management

#### 2. Users Module
**Purpose**: Manages user data and user-related operations

**Components**:
- `UsersController`: HTTP endpoints for user operations
- `UsersService`: Business logic for user management
- `User Schema`: Mongoose schema for user data
- `User Entity`: TypeScript interface/class

**Responsibilities**:
- User CRUD operations
- User data validation
- User profile management
- Password management

#### 3. Common Module
**Purpose**: Shared utilities, guards, interceptors, and filters

**Components**:
- `JwtAuthGuard`: Protects routes requiring authentication
- `ValidationPipe`: Validates incoming DTOs
- `HttpExceptionFilter`: Handles HTTP exceptions
- `LoggingInterceptor`: Logs requests and responses

**Responsibilities**:
- Request validation
- Error handling
- Logging
- Authentication guards

## Data Flow

### Sign-Up Flow

```
1. Client sends POST /auth/signup
   ↓
2. Controller receives request
   ↓
3. ValidationPipe validates DTO
   ↓
4. AuthService.signup()
   ↓
5. Check if user exists (UsersService)
   ↓
6. Hash password (bcrypt)
   ↓
7. Create user in database
   ↓
8. Generate access token (1 hour)
   ↓
9. Generate refresh token (7 days)
   ↓
10. Set refresh token in httpOnly cookie
   ↓
11. Return response with access token
```

### Sign-In Flow

```
1. Client sends POST /auth/signin
   ↓
2. Controller receives request
   ↓
3. ValidationPipe validates DTO
   ↓
4. LocalStrategy validates credentials
   ↓
5. AuthService.validateUser()
   ↓
6. Verify password hash
   ↓
7. Generate access token (1 hour)
   ↓
8. Generate refresh token (7 days)
   ↓
9. Set refresh token in httpOnly cookie
   ↓
10. Return response with access token
```

### Token Refresh Flow

```
1. Client sends POST /auth/refresh (cookie auto-sent)
   ↓
2. RefreshTokenAuthGuard intercepts request
   ↓
3. RefreshTokenStrategy extracts token from cookie
   ↓
4. Validate token signature (JWT_REFRESH_SECRET)
   ↓
5. Check token expiration
   ↓
6. Verify user exists in database
   ↓
7. AuthService.refreshTokens()
   ↓
8. Generate new access token
   ↓
9. Generate new refresh token (rotation)
   ↓
10. Update refresh token cookie
   ↓
11. Return response with new access token
```

### Logout Flow

```
1. Client sends POST /auth/logout
   ↓
2. Controller receives request
   ↓
3. AuthController.logout()
   ↓
4. Clear refresh token cookie (set to expired)
   ↓
5. Return success message
   ↓
6. Client discards access token from storage
```

**Note**: The logout endpoint clears the refresh token cookie on the server side. The client is responsible for discarding the access token from localStorage or wherever it's stored.

### Protected Route Access

```
1. Client sends request with JWT in header
   ↓
2. JwtAuthGuard intercepts request
   ↓
3. JwtStrategy validates token
   ↓
4. Verify user exists in database
   ↓
5. Extract user from token payload
   ↓
6. Attach user to request object
   ↓
7. Controller handles request
   ↓
8. Return protected data
```

## Design Patterns

### 1. Dependency Injection
NestJS's built-in DI container manages all service dependencies, promoting loose coupling and testability.

```typescript
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}
}
```

### 2. Repository Pattern
Mongoose models abstract data access, separating business logic from database operations.

### 3. Strategy Pattern
Passport strategies implement different authentication methods:
- **LocalStrategy**: Username/password authentication
- **JwtStrategy**: Access token validation (Bearer token)
- **RefreshTokenStrategy**: Refresh token validation (httpOnly cookie)

### 4. Guard Pattern
NestJS guards protect routes and implement authorization logic.

### 5. DTO Pattern
Data Transfer Objects validate and type-check incoming/outgoing data.

## Security Architecture

### Authentication Flow
1. **Stateless JWT**: No server-side session storage
2. **Dual Token System**:
   - Short-lived access tokens (1 hour)
   - Long-lived refresh tokens (7 days)
3. **Hybrid Storage**:
   - Access tokens: Client-side (localStorage/memory)
   - Refresh tokens: httpOnly cookies (server-managed)
4. **Token Rotation**: New refresh token issued on each refresh

### Password Security
1. **Hashing**: bcrypt with salt rounds
2. **Never stored in plain text**
3. **Comparison via secure hash comparison**

### Request Validation
1. **DTO validation**: class-validator decorators
2. **Type checking**: TypeScript compile-time checks
3. **Sanitization**: Prevent injection attacks

## API Documentation

### OpenAPI/Swagger Integration

The API is documented using **Swagger** with **OpenAPI 3.0** specification:

**Features**:
- Auto-generated from NestJS decorators
- Interactive testing interface
- Schema validation documentation
- JWT authentication integration
- Export OpenAPI spec (JSON/YAML)

**Decorators Usage**:
```typescript
@ApiTags('authentication')
@ApiOperation({ summary: 'Sign up new user' })
@ApiResponse({ status: 201, description: 'User created successfully' })
@ApiResponse({ status: 409, description: 'User already exists' })
@Post('signup')
async signup(@Body() dto: SignUpDto) { }
```

## Database Architecture

### Connection
- **Type**: MongoDB via Mongoose ODM
- **Connection pooling**: Automatic via Mongoose
- **Environment-based**: Different databases for dev/test/prod

### Schema Design
- **User schema**: Email (unique), name, password hash, timestamps
- **Indexes**: Email field for faster lookups
- **Validation**: Schema-level validation rules

## Configuration Management

### Environment Variables
- Database connection strings
- JWT secret and expiration
- Port and host settings
- Logging levels

### Configuration Module
NestJS ConfigModule loads and validates environment variables at startup.

**Required Environment Variables**:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth

# JWT Access Token
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRES_IN=1h

# JWT Refresh Token
JWT_REFRESH_SECRET=different-secret-key-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=*

# Logging
LOG_LEVEL=debug
```

## Error Handling

### Exception Filters
Global exception filter catches and formats all errors consistently.

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication failed)
- `403`: Forbidden (authorization failed)
- `409`: Conflict (duplicate user)
- `500`: Internal Server Error

## Logging Architecture

### Logger Service
- Request/response logging
- Error logging
- Performance monitoring
- Environment-based log levels

### Log Levels
- `error`: System errors
- `warn`: Warnings and potential issues
- `info`: General information
- `debug`: Detailed debugging information
- `verbose`: Very detailed logs (development only)

## Scalability Considerations

### Horizontal Scaling
- Stateless design allows multiple instances
- JWT removes need for session sharing
- Database connection pooling

### Performance
- Database indexing on email field
- Efficient password hashing algorithm
- Response caching (where applicable)

### Monitoring
- Health check endpoint
- Logging for debugging
- Error tracking

## Testing Strategy

### Unit Tests
- Service layer logic
- Utility functions
- Guards and strategies

### Integration Tests
- Controller endpoints
- Database operations
- Authentication flow

### E2E Tests
- Complete user journeys
- API contract validation
- Error scenarios

## Current Security Features

### Implemented
1. ✅ **Refresh Tokens**: Dual token system with rotation
2. ✅ **httpOnly Cookies**: Secure refresh token storage
3. ✅ **Token Rotation**: New refresh token on each use
4. ✅ **Separate Secrets**: Different secrets for access/refresh tokens
5. ✅ **CORS Configuration**: Environment-based CORS settings
6. ✅ **Cookie Parser**: Middleware for cookie handling
7. ✅ **Global Validation**: Request validation with class-validator
8. ✅ **Global Exception Filter**: Consistent error handling
9. ✅ **Logging Interceptor**: Request/response logging
10. ✅ **Health Check**: Database connection monitoring

## Future Enhancements

### Potential Improvements
1. **Rate Limiting**: Prevent brute-force attacks
2. **Email Verification**: Verify email addresses on signup
3. **Password Reset**: Forgot password functionality
4. **2FA**: Two-factor authentication
5. **OAuth**: Social login integration
6. **Role-based Access**: User roles and permissions
7. **API Versioning**: Support multiple API versions
8. **Token Blacklist**: Revoke tokens before expiration
