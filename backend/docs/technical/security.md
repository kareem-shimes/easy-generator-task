# Security Best Practices

## Overview

This document outlines the security measures, best practices, and implementation details for the EasyGenerator Authentication API. Security is a top priority, and this guide ensures the application follows industry standards.

## Authentication & Authorization

### JWT (JSON Web Tokens)

**Dual Token System**:

The API implements a dual token system with refresh token rotation for enhanced security.

**Access Token**:
- Algorithm: HS256
- Secret: `JWT_SECRET` environment variable
- Expiration: 1 hour (configurable via `JWT_EXPIRES_IN`)
- Storage: Client-side (localStorage, memory, or sessionStorage)
- Usage: Sent in Authorization header for API requests
- Payload: user ID, email, issued at (iat), expiration (exp)

**Refresh Token**:
- Algorithm: HS256
- Secret: `JWT_REFRESH_SECRET` environment variable (different from access token)
- Expiration: 7 days (configurable via `JWT_REFRESH_EXPIRES_IN`)
- Storage: httpOnly cookie (server-managed, XSS-protected)
- Usage: Automatically sent to refresh endpoint
- Rotation: New refresh token issued on each refresh
- Payload: user ID, email, issued at (iat), expiration (exp)

**Token Structure**:
```json
{
  "sub": "507f1f77bcf86cd799439011",
  "email": "user@example.com",
  "iat": 1698580800,
  "exp": 1698584400
}
```

**Security Measures**:
- ✅ Dual token system (access + refresh)
- ✅ Access tokens are stateless (no server-side storage)
- ✅ Short access token expiration (1 hour)
- ✅ Refresh tokens stored in httpOnly cookies
- ✅ Token rotation on refresh
- ✅ Separate secrets for access and refresh tokens
- ✅ Secrets are strong and randomly generated (32+ characters)
- ✅ Secrets never exposed in code or logs
- ✅ Tokens validated on every protected request
- ✅ SameSite=Strict cookie attribute (CSRF protection)
- ✅ Secure cookie attribute in production (HTTPS only)

**Best Practices**:
```bash
# Access Token (minimum 32 characters)
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=1h  # Short-lived for security

# Refresh Token (different secret, minimum 32 characters)
JWT_REFRESH_SECRET=different-secret-key-at-least-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d  # Longer for better UX
```

### Password Security

**Hashing Algorithm**: bcrypt

**Salt Rounds**: 10

**Implementation**:
```typescript
import * as bcrypt from 'bcrypt';

// Hashing
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

// Verification
const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
```

**Security Features**:
- ✅ Passwords never stored in plain text
- ✅ Passwords excluded from API responses via entity transformation
- ✅ Bcrypt automatically handles salting
- ✅ Bcrypt is resistant to rainbow table attacks
- ✅ Password available in database for authentication verification
- ✅ JWT strategies verify user existence on each request

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase or lowercase letter
- At least one number
- At least one special character (!@#$%^&*(),.?":{}|<>)

**Validation Regex**:
```typescript
/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/
```

### Session Management

**Approach**: Hybrid (Stateless JWT + httpOnly Cookies)

**Implementation**:
- Access tokens are stateless (client-managed)
- Refresh tokens in httpOnly cookies (server-managed)
- No session storage required
- Token rotation prevents reuse

**Benefits**:
- ✅ Horizontally scalable
- ✅ No session synchronization needed
- ✅ Reduced database load
- ✅ XSS protection for refresh tokens
- ✅ Automatic token refresh for better UX
- ✅ Short-lived access tokens limit exposure

**Refresh Token Rotation**:
```typescript
// On each refresh, issue new tokens
const { response, refreshToken } = await this.authService.refreshTokens(
  req.user.userId,
  req.user.email,
);

// Update refresh token cookie
res.cookie('refresh_token', refreshToken, {
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
});

return response;
```

**Considerations**:
- Token revocation requires blacklist (future enhancement)
- Consider implementing logout endpoint to clear cookies

## Input Validation & Sanitization

### Request Validation

**Tool**: class-validator with NestJS ValidationPipe

**Global Validation Pipe**:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,  // Strip properties not in DTO
  forbidNonWhitelisted: true,  // Throw error if extra properties
  transform: true,  // Transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

**DTO Validation Example**:
```typescript
export class SignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(3)
  @Matches(/^[a-zA-Z0-9\s]*$/)  // Prevent injection
  name: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])/)
  password: string;
}
```

### Sanitization

**Measures**:
- ✅ Email converted to lowercase
- ✅ Whitespace trimmed from strings
- ✅ HTML/script tags stripped
- ✅ MongoDB query operators sanitized
- ✅ Type conversion for numbers/booleans

**Protection Against**:
- SQL Injection (N/A for MongoDB)
- NoSQL Injection
- XSS (Cross-Site Scripting)
- Command Injection
- Path Traversal

### MongoDB Query Safety

**Mongoose Protection**:
```typescript
// Mongoose automatically escapes query operators
// This is safe:
const user = await this.userModel.findOne({ email: userInput });

// Avoid raw queries:
// UNSAFE: db.collection.find({ $where: userInput })
```

## CORS (Cross-Origin Resource Sharing)

### Configuration

**Development**:
```typescript
app.enableCors({
  origin: '*',  // Allow all origins in development
  credentials: true,
});
```

**Production**:
```typescript
app.enableCors({
  origin: [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
  maxAge: 3600,
});
```

## HTTPS/TLS

### Requirements

**Production**:
- ✅ All traffic over HTTPS
- ✅ TLS 1.2 or higher
- ✅ Valid SSL certificate
- ✅ HTTP redirects to HTTPS

**Implementation** (with Express/NestJS):
```typescript
// In production, use a reverse proxy (nginx, Caddy)
// or hosting platform (Heroku, AWS) to handle HTTPS
```

**Headers**:
```typescript
app.use(helmet());  // Sets security headers
```

## Security Headers

### Helmet Configuration

Helmet sets various HTTP headers for security:

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

**Headers Set**:
- `Strict-Transport-Security`: Enforce HTTPS
- `X-Content-Type-Options`: Prevent MIME sniffing
- `X-Frame-Options`: Prevent clickjacking
- `X-XSS-Protection`: Enable XSS filter
- `Content-Security-Policy`: Control resource loading

## Rate Limiting

### Implementation

**Package**: `@nestjs/throttler`

**Configuration**:
```typescript
ThrottlerModule.forRoot({
  ttl: 60,  // Time window in seconds
  limit: 10,  // Max requests per ttl
})
```

**Per-Route Limits**:
```typescript
@Throttle(5, 60)  // 5 requests per minute
@Post('signin')
async signIn() { }

@Throttle(3, 60)  // 3 requests per minute
@Post('signup')
async signUp() { }
```

**Benefits**:
- Prevents brute-force attacks
- Protects against DDoS
- Reduces server load
- Improves availability

## Error Handling

### Secure Error Messages

**Production**:
- Never expose stack traces
- Use generic error messages
- Log detailed errors server-side
- Don't reveal system information

**Development**:
- Detailed error messages for debugging
- Stack traces in responses
- Verbose logging

**Example**:
```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const message = process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : exception.message;

    // Log full error server-side
    this.logger.error(exception);

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
    });
  }
}
```

## Logging

### What to Log

**Security Events**:
- ✅ Failed login attempts
- ✅ Successful authentications
- ✅ Account creation
- ✅ Password changes
- ✅ Authorization failures
- ✅ Rate limit violations

**What NOT to Log**:
- ❌ Passwords (plain or hashed)
- ❌ JWT tokens
- ❌ Credit card numbers
- ❌ Personal identification numbers
- ❌ API keys or secrets

**Implementation**:
```typescript
// Good
this.logger.log(`User ${email} logged in successfully`);

// Bad - Never log passwords
this.logger.log(`Login attempt: ${email} / ${password}`);
```

### Log Levels

- `error`: Authentication failures, system errors
- `warn`: Suspicious activity, rate limits
- `info`: Successful operations
- `debug`: Detailed debugging (dev only)

## Environment Variables

### Security Best Practices

**Storage**:
- ✅ Use `.env` file (never commit to git)
- ✅ Add `.env` to `.gitignore`
- ✅ Use `.env.example` as template
- ✅ Use environment variable injection in production

**Required Variables**:
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth

# JWT Access Token
JWT_SECRET=your-super-secret-key-at-least-32-characters-long
JWT_EXPIRES_IN=1h

# JWT Refresh Token
JWT_REFRESH_SECRET=different-super-secret-key-at-least-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d

# Application
PORT=3000
NODE_ENV=production

# CORS
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
```

**Validation**:
```typescript
// Validate env vars at startup
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 32) {
  throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
}

if (process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET must be different');
}
```

## Database Security

### MongoDB Security

**Connection Security**:
- ✅ Use authentication (username/password)
- ✅ Use TLS/SSL for connections
- ✅ Whitelist IP addresses
- ✅ Use connection string in environment variables

**Access Control**:
- ✅ Create database user with minimal permissions
- ✅ Use separate users for different environments
- ✅ Enable MongoDB authentication
- ✅ Regularly rotate credentials

**Query Safety**:
- ✅ Use Mongoose schemas for validation
- ✅ Avoid `$where` operator with user input
- ✅ Sanitize input before queries
- ✅ Use parameterized queries (Mongoose does this)

## Dependency Security

### Package Management

**Audit Dependencies**:
```bash
# Check for vulnerabilities
pnpm audit

# Fix vulnerabilities automatically
pnpm audit --fix

# Update packages
pnpm update
```

**Best Practices**:
- ✅ Regularly update dependencies
- ✅ Review security advisories
- ✅ Use `pnpm-lock.yaml`
- ✅ Minimize dependencies
- ✅ Use trusted packages only

**Automated Tools**:
- Dependabot (GitHub)
- Snyk
- pnpm audit

## API Security Checklist

### Development Phase
- [ ] Input validation on all endpoints
- [ ] Password hashing with bcrypt
- [ ] JWT for authentication
- [ ] Environment variables for secrets
- [ ] Error handling without data leaks
- [ ] CORS configuration
- [ ] Request validation with DTOs

### Pre-Production
- [x] Refresh token rotation implemented
- [x] httpOnly cookies for refresh tokens
- [x] Separate secrets for access/refresh tokens
- [x] Cookie parser middleware enabled
- [ ] Rate limiting enabled
- [ ] HTTPS enforced
- [ ] Security headers (Helmet)
- [x] Logging implemented
- [ ] Dependencies audited
- [x] Environment variables secured
- [ ] Database authentication enabled
- [x] Password complexity enforced

### Production
- [ ] HTTPS with valid certificate
- [ ] Whitelist CORS origins
- [ ] Production error handling
- [ ] Log monitoring setup
- [ ] Regular security audits
- [ ] Backup strategy
- [ ] Incident response plan
- [ ] Regular dependency updates

## Common Vulnerabilities & Mitigations

| Vulnerability | Mitigation |
|---------------|------------|
| **SQL/NoSQL Injection** | Mongoose query sanitization, input validation |
| **XSS** | Input sanitization, CSP headers |
| **CSRF** | SameSite cookies, CSRF tokens (if using cookies) |
| **Brute Force** | Rate limiting, account lockout |
| **Session Hijacking** | HTTPS, secure token storage, short expiration |
| **Man-in-the-Middle** | HTTPS/TLS, certificate validation |
| **Password Attacks** | Strong password policy, bcrypt hashing |
| **Dependency Vulnerabilities** | Regular audits, updates |

## Security Testing

### Tools

1. **OWASP ZAP**: Web application security scanner
2. **Burp Suite**: Security testing platform
3. **pnpm audit**: Dependency vulnerability checker
4. **SonarQube**: Code quality and security
5. **Snyk**: Dependency and code scanning

### Testing Checklist

- [ ] Authentication bypass attempts
- [ ] Authorization checks
- [ ] Input validation tests
- [ ] SQL/NoSQL injection tests
- [ ] XSS vulnerability tests
- [ ] CSRF tests
- [ ] Rate limiting verification
- [ ] Password policy enforcement
- [ ] Token expiration tests
- [ ] Error message information leakage

## Incident Response

### Steps

1. **Detect**: Monitor logs for suspicious activity
2. **Assess**: Determine severity and impact
3. **Contain**: Isolate affected systems
4. **Eradicate**: Remove threat
5. **Recover**: Restore normal operations
6. **Review**: Post-incident analysis

### Contact Information

Maintain a security contact for:
- Vulnerability reports
- Security incidents
- Security questions

## Compliance & Standards

### Standards Followed

- **OWASP Top 10**: Web application security risks
- **JWT Best Practices**: RFC 8725
- **GDPR**: Data protection (if applicable)
- **PCI DSS**: Payment card data (if applicable)

### Regular Reviews

- Monthly dependency audits
- Quarterly security reviews
- Annual penetration testing
- Continuous monitoring

## Implemented Security Features

1. ✅ **Refresh Tokens** with rotation
2. ✅ **httpOnly Cookies** for refresh token storage
3. ✅ **Dual Token System** (access + refresh)
4. ✅ **Token Rotation** on each refresh
5. ✅ **Separate Secrets** for different token types
6. ✅ **CORS Configuration** (environment-based)
7. ✅ **Cookie Security** (httpOnly, SameSite, Secure)
8. ✅ **Password Hashing** (bcrypt)
9. ✅ **Input Validation** (class-validator)
10. ✅ **Global Exception Filtering**

## Future Security Enhancements

1. **Two-Factor Authentication (2FA)**
2. **Token Blacklist** for logout
3. **Email Verification**
4. **Password Reset** with secure tokens
5. **Account Lockout** after failed attempts
6. **Rate Limiting** for brute-force protection
7. **Helmet** for security headers
8. **IP Whitelisting** for admin endpoints
9. **Audit Logs** for compliance
10. **Intrusion Detection** system
11. **Web Application Firewall** (WAF)
