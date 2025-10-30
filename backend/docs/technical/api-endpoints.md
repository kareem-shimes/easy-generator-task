# API Endpoints Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the EasyGenerator Authentication API, including request/response formats, status codes, and examples.

## Base URL

```
Development: http://localhost:3000
Production: https://your-domain.com
```

## Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints Summary

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/auth/signup` | POST | Register new user | No |
| `/auth/signin` | POST | Authenticate user | No |
| `/auth/refresh` | POST | Refresh access token | Refresh Token (Cookie) |
| `/auth/logout` | POST | Logout user | No |
| `/users/me` | GET | Get current user profile | Access Token (Bearer) |
| `/users/me` | PATCH | Update current user profile | Access Token (Bearer) |
| `/health` | GET | Health check | No |

## Endpoints

### 1. Sign Up

Register a new user account.

**Endpoint**: `POST /auth/signup`

**Authentication**: Not required

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**Request Body Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| email | string | Yes | Valid email format |
| name | string | Yes | Minimum 3 characters |
| password | string | Yes | Min 8 chars, 1 letter, 1 number, 1 special char |

**Success Response** (201 Created):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-29T10:30:00.000Z",
    "updatedAt": "2025-10-29T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Headers**:
```
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
```

**Note**: Refresh token is set as an httpOnly cookie with 7 days expiration.

**Error Responses**:

*400 Bad Request* - Validation error:
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "name must be at least 3 characters",
    "password must contain at least one letter, one number, and one special character"
  ],
  "error": "Bad Request"
}
```

*409 Conflict* - User already exists:
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "John Doe",
    "password": "SecurePass123!"
  }'
```

---

### 2. Sign In

Authenticate a user and receive a JWT token.

**Endpoint**: `POST /auth/signin`

**Authentication**: Not required

**Request Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response** (200 OK):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-29T10:30:00.000Z",
    "updatedAt": "2025-10-29T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Headers**:
```
Set-Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
```

**Note**: Refresh token is set as an httpOnly cookie with 7 days expiration.

**Error Responses**:

*400 Bad Request* - Validation error:
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password should not be empty"
  ],
  "error": "Bad Request"
}
```

*401 Unauthorized* - Invalid credentials:
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

---

### 3. Refresh Access Token

Refresh the access token using the refresh token stored in httpOnly cookie.

**Endpoint**: `POST /auth/refresh`

**Authentication**: Required (Refresh Token Cookie)

**Request Cookies**:
```
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note**: The refresh token cookie is automatically sent by the browser. Make sure to include `credentials: 'include'` in fetch requests.

**Success Response** (200 OK):
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2025-10-29T10:30:00.000Z",
    "updatedAt": "2025-10-29T10:30:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response Headers**:
```
Set-Cookie: refresh_token=NEW_TOKEN...; Path=/; HttpOnly; SameSite=Strict; Max-Age=604800
```

**Note**: A new refresh token is issued with each refresh (token rotation for security).

**Error Responses**:

*401 Unauthorized* - No refresh token or invalid refresh token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X POST http://localhost:3000/auth/refresh \
  -H "Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**JavaScript/Fetch Example**:
```javascript
const response = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  credentials: 'include', // Important: sends httpOnly cookies
});

const data = await response.json();
const newAccessToken = data.access_token;
```

---

### 4. Logout

Logout the current user by clearing the refresh token cookie.

**Endpoint**: `POST /auth/logout`

**Authentication**: Not required (but should be called when user wants to logout)

**Success Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

**Response Headers**:
```
Set-Cookie: refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Note**: The refresh token cookie is cleared. The client should also discard the access token from storage.

**cURL Example**:
```bash
curl -X POST http://localhost:3000/auth/logout \
  -H "Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  --cookie-jar cookies.txt \
  --cookie cookies.txt
```

**JavaScript/Fetch Example**:
```javascript
const response = await fetch('http://localhost:3000/auth/logout', {
  method: 'POST',
  credentials: 'include', // Important: sends httpOnly cookies
});

const data = await response.json();
console.log(data.message); // "Logged out successfully"

// Also clear the access token from client storage
localStorage.removeItem('access_token');
// Or if stored elsewhere, clear it accordingly
```

---

### 5. Get Current User Profile

Get the authenticated user's profile information.

**Endpoint**: `GET /users/me`

**Authentication**: Required (JWT)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
```

**Success Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Doe",
  "createdAt": "2025-10-29T10:30:00.000Z",
  "updatedAt": "2025-10-29T10:30:00.000Z"
}
```

**Error Responses**:

*401 Unauthorized* - No token or invalid token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 6. Update User Profile

Update the authenticated user's profile information.

**Endpoint**: `PATCH /users/me`

**Authentication**: Required (JWT)

**Request Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body** (all fields optional):
```json
{
  "name": "John Smith"
}
```

**Request Body Schema**:
| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | No | Minimum 3 characters |

**Success Response** (200 OK):
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "name": "John Smith",
  "createdAt": "2025-10-29T10:30:00.000Z",
  "updatedAt": "2025-10-29T16:45:00.000Z"
}
```

**Error Responses**:

*400 Bad Request* - Validation error:
```json
{
  "statusCode": 400,
  "message": ["name must be at least 3 characters"],
  "error": "Bad Request"
}
```

*401 Unauthorized* - No token or invalid token:
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**cURL Example**:
```bash
curl -X PATCH http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{"name": "John Smith"}'
```

---

### 7. Health Check

Check if the API is running and healthy.

**Endpoint**: `GET /health`

**Authentication**: Not required

**Success Response** (200 OK):
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T16:45:00.000Z",
  "uptime": 3600,
  "database": "connected"
}
```

**cURL Example**:
```bash
curl -X GET http://localhost:3000/health
```

---

## Status Codes Summary

| Code | Description | When Used |
|------|-------------|-----------|
| 200 | OK | Successful GET, PATCH, DELETE requests |
| 201 | Created | Successful POST requests (resource created) |
| 400 | Bad Request | Validation errors, malformed requests |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Valid auth but insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource (e.g., email exists) |
| 500 | Internal Server Error | Server-side errors |

## Error Response Format

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description or array of validation errors",
  "error": "Error type (Bad Request, Unauthorized, etc.)"
}
```

## Rate Limiting

**Note**: Rate limiting should be implemented in production.

Recommended limits:
- Authentication endpoints: 5 requests per minute per IP
- Protected endpoints: 100 requests per minute per user

## Pagination

For endpoints that return lists (future implementation):

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

**Response Format**:
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

## Swagger/OpenAPI Documentation

Interactive API documentation is automatically generated using **Swagger** with **OpenAPI 3.0** specification.

**Access the documentation**:
```
http://localhost:3000/api/docs
```

**Features**:
- **Interactive UI**: Try out endpoints directly from the browser
- **Schema visualization**: View request/response schemas
- **Validation rules**: See all validation requirements
- **Authentication testing**: Test protected endpoints with JWT tokens
- **Code generation**: Generate client code in various languages
- **Export**: Download OpenAPI spec in JSON/YAML format

**Setup** (in your NestJS app):
```typescript
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('EasyGenerator Authentication API')
  .setDescription('Authentication API with JWT')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);
```

## Postman Collection

A Postman collection is available for testing:

1. Import the collection from `/docs/postman/collection.json`
2. Set the environment variables:
   - `base_url`: http://localhost:3000
   - `access_token`: (obtained from signin/signup)

## JavaScript/TypeScript Examples

### Sign Up

```typescript
const response = await fetch('http://localhost:3000/auth/signup', {
  method: 'POST',
  credentials: 'include', // Important: to receive httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    name: 'John Doe',
    password: 'SecurePass123!',
  }),
});

const data = await response.json();
const token = data.access_token;
// Refresh token is automatically stored in httpOnly cookie
```

### Sign In

```typescript
const response = await fetch('http://localhost:3000/auth/signin', {
  method: 'POST',
  credentials: 'include', // Important: to receive httpOnly cookie
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123!',
  }),
});

const data = await response.json();
const token = data.access_token;
// Refresh token is automatically stored in httpOnly cookie
```

### Refresh Token

```typescript
const response = await fetch('http://localhost:3000/auth/refresh', {
  method: 'POST',
  credentials: 'include', // Sends httpOnly cookie
});

if (response.ok) {
  const data = await response.json();
  const newAccessToken = data.access_token;
  // New refresh token automatically updated in cookie
}
```

### Get Profile (Protected)

```typescript
const response = await fetch('http://localhost:3000/users/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

const profile = await response.json();
```

### Complete Auth Flow with Auto-Refresh

```typescript
class AuthService {
  private accessToken: string | null = null;

  async login(email: string, password: string) {
    const response = await fetch('http://localhost:3000/auth/signin', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    this.accessToken = data.access_token;
    return data;
  }

  async refreshToken() {
    const response = await fetch('http://localhost:3000/auth/refresh', {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) return null;
    
    const data = await response.json();
    this.accessToken = data.access_token;
    return data.access_token;
  }

  async fetchWithAuth(url: string, options: RequestInit = {}) {
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    // If 401, try refreshing
    if (response.status === 401) {
      const newToken = await this.refreshToken();
      if (newToken) {
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      }
    }

    return response;
  }
}
```

## Versioning

Current API version: **v1**

Future versions may be accessible via:
- URL path: `/api/v2/auth/signup`
- Header: `API-Version: 2`

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is enabled for:
- Development: All origins
- Production: Specific whitelisted domains

## Content Negotiation

Currently supports:
- Request: `application/json`
- Response: `application/json`

## Webhooks (Future)

Planned webhook events:
- `user.created`
- `user.updated`
- `user.deleted`

## Best Practices for API Consumers

1. **Store tokens securely**: Use httpOnly cookies or secure storage
2. **Handle token expiration**: Implement token refresh logic
3. **Validate inputs client-side**: Before sending to API
4. **Handle errors gracefully**: Show user-friendly messages
5. **Use HTTPS in production**: Never send credentials over HTTP
6. **Implement retry logic**: For network failures
7. **Cache when appropriate**: Reduce unnecessary requests
