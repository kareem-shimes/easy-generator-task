# Authentication Flow

## Overview

This document describes the authentication system implemented in the EasyGenerator Authentication API, including sign-up, sign-in, and token-based authentication.

## Authentication Strategy

**Type**: Token-based authentication using JWT (JSON Web Tokens)

**Benefits**:
- Stateless (no server-side session storage)
- Scalable across multiple servers
- Self-contained (includes user information)
- Industry standard

## Sign-Up Flow

### Process

```
1. User submits registration form
   ↓
2. Validate input (email, name, password)
   ↓
3. Check if email already exists
   ↓
4. Hash password using bcrypt
   ↓
5. Create user record in database
   ↓
6. Generate JWT access token (1 hour)
   ↓
7. Generate JWT refresh token (7 days)
   ↓
8. Set refresh token in httpOnly cookie
   ↓
9. Return user data + access token
```

### API Endpoint

**POST** `/auth/signup`

**Request Body**:
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123!"
}
```

**Validation Rules**:

| Field | Rules |
|-------|-------|
| email | Required, valid email format, unique |
| name | Required, minimum 3 characters |
| password | Required, min 8 chars, 1 letter, 1 number, 1 special char |

**Success Response** (201):
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

**Error Responses**:

*400 Bad Request* - Validation failed:
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email",
    "password must contain at least one letter, one number, and one special character"
  ],
  "error": "Bad Request"
}
```

*409 Conflict* - Email already exists:
```json
{
  "statusCode": 409,
  "message": "User with this email already exists",
  "error": "Conflict"
}
```

### Implementation Details

**Password Hashing**:
```typescript
import * as bcrypt from 'bcrypt';

const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
```

**Token Generation**:
```typescript
const payload = { sub: user._id, email: user.email };
const token = this.jwtService.sign(payload);
```

## Sign-In Flow

### Process

```
1. User submits login credentials
   ↓
2. Validate input format
   ↓
3. Find user by email
   ↓
4. Verify password hash
   ↓
5. Generate JWT access token (1 hour)
   ↓
6. Generate JWT refresh token (7 days)
   ↓
7. Set refresh token in httpOnly cookie
   ↓
8. Return user data + access token
```

### API Endpoint

**POST** `/auth/signin`

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "statusCode": 401,
  "message": "Invalid email or password",
  "error": "Unauthorized"
}
```

### Implementation Details

**Password Verification**:
```typescript
const isPasswordValid = await bcrypt.compare(
  plainPassword,
  user.password
);

if (!isPasswordValid) {
  throw new UnauthorizedException('Invalid email or password');
}
```

**Security Measures**:
- Generic error message (don't reveal if email exists)
- Password comparison using bcrypt's timing-safe comparison
- Failed login attempts logged for monitoring
- Refresh token set in httpOnly cookie for XSS protection

## Refresh Token Flow

### Process

```
1. Client's access token expires (after 1 hour)
   ↓
2. Client sends request to refresh endpoint
   ↓
3. Server extracts refresh token from httpOnly cookie
   ↓
4. Validate refresh token signature and expiration
   ↓
5. Verify user still exists in database
   ↓
6. Generate new JWT access token (1 hour)
   ↓
7. Generate new JWT refresh token (7 days)
   ↓
8. Set new refresh token in httpOnly cookie (rotation)
   ↓
9. Return user data + new access token
```

### API Endpoint

**POST** `/auth/refresh`

**Request Cookies**:
```
Cookie: refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Implementation Details

**RefreshTokenStrategy**:
```typescript
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      refreshToken,
    };
  }
}
```

**Security Features**:
- Token rotation: New refresh token issued on each refresh
- httpOnly cookie: Not accessible via JavaScript (XSS protection)
- SameSite=Strict: CSRF protection
- User existence validation on each refresh
- Separate secret for refresh tokens

## Logout Flow

### Process

```
1. User initiates logout
   ↓
2. Client sends request to logout endpoint
   ↓
3. Server clears refresh token cookie
   ↓
4. Return success message
   ↓
5. Client discards access token from storage
```

### API Endpoint

**POST** `/auth/logout`

**Success Response** (200):
```json
{
  "message": "Logged out successfully"
}
```

**Response Headers**:
```
Set-Cookie: refresh_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

**Note**: The client should also clear the access token from localStorage or wherever it's stored.

### Implementation Details

**Controller Method**:
```typescript
@Post('logout')
@HttpCode(HttpStatus.OK)
async logout(@Response({ passthrough: true }) res: ExpressResponse) {
  // Clear refresh token cookie
  res.clearCookie('refresh_token', {
    httpOnly: true,
    secure: this.configService.get('nodeEnv') === 'production',
    sameSite: 'strict',
    path: '/',
  });

  return { message: 'Logged out successfully' };
}
```

**Client-side Cleanup**:
```typescript
// After successful logout
localStorage.removeItem('access_token');
// Redirect to login page or update app state
```

## JWT Token Structure

### Token Components

**Header**:
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**Payload**:
```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1698580800,
  "exp": 1698584400
}
```

**Signature**:
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)
```

### Token Properties

| Property | Description |
|----------|-------------|
| sub | Subject (user ID) |
| email | User's email address |
| iat | Issued at (timestamp) |
| exp | Expiration time (timestamp) |

### Token Types

**Access Token**:
- Lifespan: 1 hour (configurable via `JWT_EXPIRES_IN`)
- Storage: Client-side (localStorage, memory, or cookies)
- Usage: Sent in Authorization header for protected routes
- Secret: `JWT_SECRET` environment variable

**Refresh Token**:
- Lifespan: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- Storage: httpOnly cookie (secure, not accessible via JavaScript)
- Usage: Automatically sent with refresh requests
- Secret: `JWT_REFRESH_SECRET` environment variable (different from access token)

### Token Configuration

**Environment Variables**:
```bash
# Access Token
JWT_SECRET=your-secret-key-at-least-32-characters
JWT_EXPIRES_IN=1h

# Refresh Token
JWT_REFRESH_SECRET=your-different-secret-key-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d
```

### Token Usage

**Include in Authorization header**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Example Request**:
```bash
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Protected Routes

### Authentication Guard

Routes are protected using `JwtAuthGuard`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  return req.user;  // User extracted from JWT
}
```

### JWT Strategy

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: any) {
    // Verify user still exists in database
    try {
      await this.usersService.findById(payload.sub);
      return { userId: payload.sub, email: payload.email };
    } catch {
      throw new UnauthorizedException();
    }
  }
}
```

### Token Validation Process

```
1. Client sends request with JWT in header
   ↓
2. JwtAuthGuard intercepts request
   ↓
3. Extract token from Authorization header
   ↓
4. Verify token signature using JWT_SECRET
   ↓
5. Check token expiration
   ↓
6. Extract user info from payload (userId, email)
   ↓
7. Verify user still exists in database
   ↓
8. Attach user info to request object (req.user)
   ↓
9. Allow request to proceed
```

**Security Benefit**: Database verification ensures that tokens are immediately invalidated if a user account is deleted, even if the token hasn't expired yet.

## Password Requirements

### Validation Rules

**Minimum Requirements**:
- At least 8 characters long
- Contains at least one letter (a-z or A-Z)
- Contains at least one number (0-9)
- Contains at least one special character (!@#$%^&*(),.?":{}|<>)

**Regex Pattern**:
```typescript
/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
```

**Valid Examples**:
- `SecurePass123!`
- `MyP@ssw0rd`
- `Test1234!`

**Invalid Examples**:
- `password` (no number, no special char)
- `12345678` (no letter, no special char)
- `Pass123` (too short)
- `Password1` (no special char)

### Implementation

```typescript
export class SignUpDto {
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    {
      message: 'Password must contain at least one letter, one number, and one special character',
    }
  )
  password: string;
}
```

## Security Best Practices

### Implemented Measures

1. **Password Hashing**: bcrypt with salt rounds (10)
2. **Dual Token System**: Access tokens (1 hour) + Refresh tokens (7 days)
3. **Token Rotation**: New refresh token issued on each refresh
4. **httpOnly Cookies**: Refresh tokens stored securely (XSS protection)
5. **Separate Secrets**: Different secrets for access and refresh tokens (32+ characters)
6. **User Verification**: Database check on every token validation
7. **HTTPS Only**: In production (enforced via secure cookie flag)
8. **Input Validation**: Strict validation on all inputs via DTOs
9. **Error Handling**: Generic error messages (don't leak info)
10. **CSRF Protection**: SameSite=Strict cookie attribute

### Recommendations for Frontend

1. **Store Access Token**:
   - Use localStorage or memory (access token only)
   - Refresh tokens automatically handled via httpOnly cookies
   - Never manually access or store refresh tokens

2. **Handle Token Expiration**:
   - Implement automatic refresh when access token expires
   - Use interceptors to refresh before 401 errors
   - Redirect to login if refresh fails

3. **Implement Logout**:
   - Call logout endpoint to clear refresh token cookie
   - Remove access token from localStorage
   - Clear any cached user data
   - Redirect to login page

4. **Use credentials: 'include'**:
   - Required for refresh endpoint (sends httpOnly cookies)
   - Use in fetch/axios configuration

5. **Use HTTPS**:
   - Never send credentials over HTTP
   - Ensure SSL certificate is valid in production

## Client Integration Examples

### JavaScript/TypeScript

**Sign Up**:
```typescript
const signup = async (email: string, name: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: allows httpOnly cookie
    body: JSON.stringify({ email, name, password }),
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store access token only (refresh token is in httpOnly cookie)
    localStorage.setItem('access_token', data.access_token);
    return data.user;
  } else {
    throw new Error(data.message);
  }
};
```

**Sign In**:
```typescript
const signin = async (email: string, password: string) => {
  const response = await fetch('http://localhost:3000/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // Important: allows httpOnly cookie
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  
  if (response.ok) {
    // Store access token only (refresh token is in httpOnly cookie)
    localStorage.setItem('access_token', data.access_token);
    return data.user;
  } else {
    throw new Error(data.message);
  }
};
```

**Refresh Token**:
```typescript
const refreshToken = async () => {
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Critical: sends refresh token cookie
  });

  const data = await response.json();
  
  if (response.ok) {
    // Update access token (new refresh token automatically set in cookie)
    localStorage.setItem('access_token', data.access_token);
    return data.user;
  } else {
    // Refresh failed, redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
};
```

**Logout**:
```typescript
const logout = async () => {
  await fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    credentials: 'include', // Sends refresh token cookie to be cleared
  });

  // Clear access token from storage
  localStorage.removeItem('access_token');
  
  // Redirect to login page
  window.location.href = '/login';
};
```

**Authenticated Request**:
```typescript
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token expired, try refreshing
    try {
      await refreshToken();
      // Retry the request with new token
      return getProfile();
    } catch {
      // Refresh failed, user needs to login
      return null;
    }
  }

  return await response.json();
};
```

**Axios Interceptor (Automatic Refresh)**:
```typescript
import axios from 'axios';

axios.defaults.withCredentials = true; // Enable credentials globally

// Response interceptor to handle token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token
        const { data } = await axios.post('/auth/refresh');
        localStorage.setItem('access_token', data.access_token);
        
        // Update original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${data.access_token}`;
        
        // Retry original request
        return axios(originalRequest);
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

## Testing Authentication

### Manual Testing

**Using cURL**:
```bash
# Sign up (save cookies to file)
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","name":"Test User","password":"Test123!"}' \
  -c cookies.txt

# Sign in (save cookies to file)
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!"}' \
  -c cookies.txt

# Refresh token (load cookies from file)
curl -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt \
  -c cookies.txt

# Access protected route
curl -X GET http://localhost:3000/users/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Logout (load cookies from file)
curl -X POST http://localhost:3000/auth/logout \
  -b cookies.txt
```

### Automated Testing

```typescript
describe('Authentication', () => {
  it('should signup new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@test.com',
        name: 'Test User',
        password: 'Test123!',
      })
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('email', 'test@test.com');
  });

  it('should signin existing user', async () => {
    // First signup
    await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@test.com',
        name: 'Test User',
        password: 'Test123!',
      });

    // Then signin
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({
        email: 'test@test.com',
        password: 'Test123!',
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  it('should refresh tokens', async () => {
    // Signup to get tokens
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@test.com',
        name: 'Test User',
        password: 'Test123!',
      });

    const cookies = signupRes.headers['set-cookie'];

    // Refresh tokens
    const refreshRes = await request(app.getHttpServer())
      .post('/auth/refresh')
      .set('Cookie', cookies)
      .expect(200);

    expect(refreshRes.body).toHaveProperty('access_token');
    expect(refreshRes.headers['set-cookie']).toBeDefined();
  });

  it('should logout user', async () => {
    // Signup to get tokens
    const signupRes = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: 'test@test.com',
        name: 'Test User',
        password: 'Test123!',
      });

    const cookies = signupRes.headers['set-cookie'];

    // Logout
    const logoutRes = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookies)
      .expect(200);

    expect(logoutRes.body).toHaveProperty('message', 'Logged out successfully');
  });
});
```

## Common Issues & Solutions

### Invalid Token

**Error**: 401 Unauthorized

**Causes**:
- Token expired
- Invalid token format
- Wrong JWT secret
- Token not included in request

**Solutions**:
- Check token expiration
- Verify Authorization header format
- Ensure JWT_SECRET matches

### Password Validation Failed

**Error**: 400 Bad Request

**Cause**: Password doesn't meet requirements

**Solution**: Ensure password has:
- Minimum 8 characters
- At least one letter
- At least one number
- At least one special character

### Email Already Exists

**Error**: 409 Conflict

**Cause**: Email already registered

**Solution**: Use different email or sign in instead

### Refresh Token Not Found

**Error**: 401 Unauthorized

**Causes**:
- No refresh token cookie in request
- Cookie expired or cleared
- Missing `credentials: 'include'` in fetch request

**Solutions**:
- Ensure cookies are being sent with request
- Use `credentials: 'include'` in fetch/axios configuration
- Check if cookie was set properly during login

### Logout Failed

**Error**: 401 Unauthorized

**Cause**: No refresh token cookie present

**Solution**: User is already logged out or never logged in

## Token Refresh Flow

### Overview

The API implements **refresh token rotation** for enhanced security. When the access token expires, the client can use the refresh token to obtain a new access token without requiring the user to log in again.

### Process

```
1. Client's access token expires
   ↓
2. Client sends POST /auth/refresh (refresh_token cookie auto-sent)
   ↓
3. RefreshTokenStrategy validates refresh token
   ↓
4. Verify refresh token signature and expiration
   ↓
5. Extract user info from token payload
   ↓
6. Generate new access token
   ↓
7. Generate new refresh token (rotation)
   ↓
8. Set new refresh token in httpOnly cookie
   ↓
9. Return new access token
```

### API Endpoint

**POST** `/auth/refresh`

**Authentication**: Required (Refresh Token in Cookie)

**Request Cookies**:
```
refresh_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
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

**Error Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Client Integration

**Automatic Token Refresh**:
```typescript
const refreshAccessToken = async () => {
  const response = await fetch('http://localhost:3000/auth/refresh', {
    method: 'POST',
    credentials: 'include', // Important: sends httpOnly cookies
  });

  if (!response.ok) {
    // Redirect to login if refresh fails
    window.location.href = '/login';
    return null;
  }

  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  return data.access_token;
};

// Use with API requests
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  let token = localStorage.getItem('access_token');
  
  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });

  // If 401, try refreshing token
  if (response.status === 401) {
    token = await refreshAccessToken();
    if (token) {
      response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  }

  return response;
};
```

### Security Benefits

1. **Token Rotation**: New refresh token issued on each refresh
2. **httpOnly Cookies**: Refresh token not accessible via JavaScript (XSS protection)
3. **SameSite=Strict**: Protection against CSRF attacks
4. **Separate Secrets**: Access and refresh tokens use different secrets
5. **Short-lived Access Tokens**: Limits exposure window if token is stolen
6. **Long-lived Refresh Tokens**: Better user experience without compromising security

### Implementation Details

**RefreshTokenStrategy**:
```typescript
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.refresh_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.refreshSecret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken = req.cookies?.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return { userId: payload.sub, email: payload.email, refreshToken };
  }
}
```

**Cookie Configuration**:
```typescript
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,              // Not accessible via JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/',
});
```

## Logout Flow

### Overview

The API provides a logout endpoint that clears the refresh token cookie. The client should also discard the stored access token.

### Process

```
1. Client calls POST /auth/logout
   ↓
2. Server clears refresh_token httpOnly cookie
   ↓
3. Server responds with success message
   ↓
4. Client removes access token from storage
   ↓
5. User is logged out
```

### API Endpoint

**POST** `/auth/logout`

**Description**: Logs out the current user by clearing the refresh token cookie. Requires a valid refresh_token cookie to be present.

**Request**: Requires `refresh_token` cookie to be present

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

**Status Codes**:
- `200 OK`: Logged out successfully
- `401 Unauthorized`: No refresh token found in cookies

### Client Integration

```typescript
const logout = async () => {
  const response = await fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    credentials: 'include', // Important: sends httpOnly cookies
  });

  if (response.ok) {
    // Clear access token from client storage
    localStorage.removeItem('access_token');
    // Redirect to login page
    window.location.href = '/login';
  }
};
```

### Security Notes

1. **Stateless Tokens**: Since JWT tokens are stateless, the access token remains valid until it expires (typically 1 hour)
2. **Cookie Cleared**: The refresh token cookie is immediately invalidated
3. **Client Responsibility**: The client must discard the access token to complete logout
4. **Token Expiration**: Even after logout, the access token can be used until it expires (limited exposure window)

### Best Practices

1. **Clear All Client-Side Data**: Remove access token and any cached user data
2. **Redirect to Login**: Navigate user to login page after successful logout
3. **Handle Logout Everywhere**: If user has multiple tabs open, consider using localStorage events to logout all tabs
4. **Server-Side Logout** (Optional): For higher security, implement token blacklisting to invalidate access tokens immediately

**Multi-Tab Logout**:
```typescript
// In one tab
localStorage.setItem('logout-event', Date.now().toString());
localStorage.removeItem('access_token');

// In other tabs, listen for storage events
window.addEventListener('storage', (event) => {
  if (event.key === 'logout-event') {
    // User logged out in another tab
    window.location.href = '/login';
  }
});
```

## Future Enhancements

Potential improvements:

1. **Email Verification**: Confirm email ownership
2. **Password Reset**: Forgot password flow
3. **2FA**: Two-factor authentication
4. **OAuth**: Social login (Google, Facebook)
5. **Session Management**: View/revoke active sessions
6. **Account Lockout**: After multiple failed attempts
7. **Token Blacklist**: Revoke tokens before expiration (immediate logout)
