# Protected Routes

## Overview

This document explains how route protection works in the EasyGenerator Authentication API using JWT-based authentication guards.

## Authentication Guards

### JwtAuthGuard

The `JwtAuthGuard` is a NestJS guard that protects routes requiring access token authentication.

**Implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Usage**:
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
async getProfile(@Request() req) {
  return req.user;
}
```

## How It Works

### Authentication Flow

```
1. Client sends request with JWT in Authorization header
   ↓
2. JwtAuthGuard intercepts the request
   ↓
3. Extract token from "Authorization: Bearer <token>"
   ↓
4. Pass token to JwtStrategy for validation
   ↓
5. JwtStrategy verifies token signature and expiration
   ↓
6. Extract user payload from token
   ↓
7. Attach user to request object (req.user)
   ↓
8. Allow request to proceed to route handler
```

**If token is invalid or missing**:
```
1. Guard blocks the request
   ↓
2. Return 401 Unauthorized response
   ↓
3. Route handler never executes
```

## JWT Strategy

### Strategy Configuration

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

### Configuration Options

| Option | Value | Description |
|--------|-------|-------------|
| jwtFromRequest | fromAuthHeaderAsBearerToken() | Extract token from Authorization header |
| ignoreExpiration | false | Reject expired tokens |
| secretOrKey | JWT_SECRET env variable | Secret key for verification |

### Payload Validation

The `validate` method extracts user information from the token and **verifies the user still exists in the database**.

**Token Payload**:
```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1698580800,
  "exp": 1698584400
}
```

**Validation Steps**:
1. Extract user ID (`sub`) and email from token payload
2. Query database to verify user still exists
3. If user not found, throw UnauthorizedException
4. If user exists, attach user info to request

**Extracted User** (attached to `req.user`):
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "user@example.com"
}
```

**Security Benefit**: This ensures that tokens are immediately invalidated if the user account is deleted, even if the token hasn't expired yet.

## Protecting Routes

### Controller-Level Protection

Protect all routes in a controller:

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  // All routes in this controller require authentication
  
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }

  @Patch('profile')
  updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, dto);
  }
}
```

### Route-Level Protection

Protect specific routes:

```typescript
@Controller('users')
export class UsersController {
  // Public route - no authentication required
  @Get('count')
  getUserCount() {
    return this.usersService.count();
  }

  // Protected route - authentication required
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
```

### Method-Level Protection

Apply guard to specific HTTP methods:

```typescript
@Controller('posts')
export class PostsController {
  // Public - anyone can read posts
  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  // Protected - only authenticated users can create
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.userId, dto);
  }
}
```

## Accessing User Information

### Request Object

After successful authentication, user information is available in `req.user`:

```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@Request() req) {
  console.log(req.user.userId);  // "507f1f77bcf86cd799439011"
  console.log(req.user.email);   // "user@example.com"
  
  return req.user;
}
```

### Custom Decorator

Create a custom decorator for cleaner code:

```typescript
// user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
```

**Usage**:
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser() user) {
  console.log(user.userId);
  console.log(user.email);
  return user;
}
```

**Extract specific field**:
```typescript
@UseGuards(JwtAuthGuard)
@Get('profile')
getProfile(@CurrentUser('userId') userId: string) {
  return this.usersService.findById(userId);
}
```

## Protected Endpoints

### Current Protected Routes

| Endpoint | Method | Guard | Description |
|----------|--------|-------|-------------|
| `/users/me` | GET | JwtAuthGuard | Get current user profile |
| `/users/me` | PATCH | JwtAuthGuard | Update current user profile |
| `/auth/refresh` | POST | RefreshTokenAuthGuard | Refresh access token |

### Example: Add New Protected Route

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  // New protected endpoint
  @Delete('account')
  async deleteAccount(@Request() req) {
    await this.usersService.delete(req.user.userId);
    return { message: 'Account deleted successfully' };
  }
}
```

## Testing Protected Routes

### Without Authentication (Should Fail)

```typescript
describe('Protected Routes', () => {
  it('should return 401 without token', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .expect(401);
  });
});
```

### With Authentication (Should Succeed)

```typescript
describe('Protected Routes', () => {
  let token: string;

  beforeAll(async () => {
    // Get token
    const response = await request(app.getHttpServer())
      .post('/auth/signin')
      .send({ email: 'test@test.com', password: 'Test123!' });
    
    token = response.body.access_token;
  });

  it('should return user profile with valid token', () => {
    return request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email');
      });
  });
});
```

### Invalid Token Test

```typescript
it('should return 401 with invalid token', () => {
  return request(app.getHttpServer())
    .get('/users/me')
    .set('Authorization', 'Bearer invalid-token')
    .expect(401);
});
```

### Expired Token Test

```typescript
it('should return 401 with expired token', () => {
  const expiredToken = generateExpiredToken();
  
  return request(app.getHttpServer())
    .get('/users/me')
    .set('Authorization', `Bearer ${expiredToken}`)
    .expect(401);
});
```

## Error Responses

### Missing Token

**Request**:
```bash
GET /users/me
```

**Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Invalid Token Format

**Request**:
```bash
GET /users/me
Authorization: Bearer invalid-token-format
```

**Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Expired Token

**Request**:
```bash
GET /users/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expired.token
```

**Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Malformed Authorization Header

**Request**:
```bash
GET /users/me
Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
# Missing "Bearer" prefix
```

**Response** (401):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

## Client Integration

### JavaScript/TypeScript

```typescript
// Store token after login
const token = loginResponse.access_token;
localStorage.setItem('access_token', token);

// Include token in requests
const getProfile = async () => {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch('http://localhost:3000/users/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    // Token expired or invalid - redirect to login
    localStorage.removeItem('access_token');
    window.location.href = '/login';
    return;
  }

  return await response.json();
};
```

### Axios Interceptor

```typescript
import axios from 'axios';

// Add token to all requests automatically
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### React Hook Example

```typescript
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:3000/users/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          localStorage.removeItem('access_token');
        }
      } catch (error) {
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return { user, loading };
};
```

## Security Considerations

### RefreshTokenAuthGuard

The `RefreshTokenAuthGuard` is a NestJS guard that protects the refresh endpoint, validating refresh tokens from httpOnly cookies.

**Implementation**:
```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class RefreshTokenAuthGuard extends AuthGuard('jwt-refresh') {}
```

**Usage**:
```typescript
@UseGuards(RefreshTokenAuthGuard)
@Post('refresh')
async refresh(@Request() req) {
  return this.authService.refreshTokens(req.user.userId, req.user.email);
}
```

**How It Works**:
1. Extracts refresh token from `refresh_token` httpOnly cookie
2. Validates token signature using `JWT_REFRESH_SECRET`
3. Checks token expiration (7 days by default)
4. Attaches user payload to request object
5. Allows request to proceed to refresh handler

### RefreshTokenStrategy

**Strategy Configuration**:
```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

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

**Configuration Options**:

| Option | Value | Description |
|--------|-------|-------------|
| jwtFromRequest | Custom extractor from cookies | Extract refresh token from httpOnly cookie |
| ignoreExpiration | false | Reject expired tokens |
| secretOrKey | JWT_REFRESH_SECRET env variable | Separate secret for refresh tokens |
| passReqToCallback | true | Pass request object to validate method |

### Token Storage

**Current Implementation**:

**Access Token** (Client-Side):
- Storage: localStorage, sessionStorage, or memory
- Manual inclusion in Authorization header
- Lifespan: 1 hour
- Usage: `Authorization: Bearer <token>`

**Refresh Token** (httpOnly Cookie):
- Storage: httpOnly cookie set by server
- Not accessible via JavaScript (XSS protection)
- Automatic inclusion in requests to same domain
- Lifespan: 7 days
- Attributes: `HttpOnly`, `SameSite=Strict`, `Secure` (production)

**Security Benefits**:
1. **XSS Protection**: Refresh token cannot be accessed by JavaScript
2. **CSRF Protection**: SameSite=Strict prevents cross-site cookie sending
3. **Separate Secrets**: Different secrets for access and refresh tokens
4. **Token Rotation**: New refresh token issued on each refresh
5. **Short-lived Access Tokens**: Minimizes impact if stolen

**Cookie Configuration**:
```typescript
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,              // Not accessible via JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in production
  sameSite: 'strict',          // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/',                   // Available for all routes
});
```

### Token Transmission

**Always use HTTPS in production**:
- Tokens are sensitive credentials
- HTTP transmits tokens in plain text
- Man-in-the-middle attacks can steal tokens
- Configure SSL/TLS certificates

### Token Expiration

**Access Token** (1 hour):
- Limits damage if token is stolen
- Sent with every API request
- Stored client-side (less secure storage acceptable)
- Automatically refreshed when expired

**Refresh Token** (7 days):
- Stored in httpOnly cookie (secure)
- Only sent to refresh endpoint
- Rotated on each use
- Longer lifespan for better UX

## Advanced: Role-Based Access

### Future Enhancement

For role-based authorization:

```typescript
// roles.decorator.ts
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// roles.guard.ts
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    return requiredRoles.some((role) => user.roles?.includes(role));
  }
}

// Usage
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Delete('users/:id')
deleteUser(@Param('id') id: string) {
  return this.usersService.delete(id);
}
```

## Debugging Protected Routes

### Check Token Validity

```bash
# Decode JWT (without verification)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | cut -d'.' -f2 | base64 -d | jq
```

### Verify Authorization Header

```typescript
@UseGuards(JwtAuthGuard)
@Get('debug')
debug(@Headers() headers, @Request() req) {
  return {
    authHeader: headers.authorization,
    user: req.user,
  };
}
```

### Log Guard Execution

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    console.log('Error:', err);
    console.log('User:', user);
    console.log('Info:', info);
    
    if (err || !user) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
```

## Best Practices

1. **Always use HTTPS** in production
2. **Keep tokens short-lived** (1 hour)
3. **Store tokens securely** (httpOnly cookies preferred)
4. **Validate tokens on every request**
5. **Never log tokens** or expose in errors
6. **Implement token refresh** for better UX
7. **Clear tokens on logout**
8. **Handle 401 errors gracefully**
9. **Use strong JWT secrets**
10. **Monitor for suspicious activity**
