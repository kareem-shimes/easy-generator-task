# Environment Variables

## Overview

This document describes all environment variables used in the EasyGenerator Authentication API, their purpose, and configuration guidelines.

## Environment Files

### File Structure

```
.
├── .env                 # Local development (gitignored)
├── .env.example         # Template (committed to git)
├── .env.development     # Development-specific (optional)
├── .env.test            # Testing environment
└── .env.production      # Production (never commit!)
```

### .env.example

Always keep `.env.example` updated as a template:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth

# JWT Configuration - Access Token
JWT_SECRET=change-this-to-a-secure-random-string-at-least-32-characters
JWT_EXPIRES_IN=1h

# JWT Configuration - Refresh Token
JWT_REFRESH_SECRET=change-this-to-a-different-secure-random-string-at-least-32-characters
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug

# CORS (Optional)
CORS_ORIGIN=*

# Rate Limiting (Optional)
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

## Variable Descriptions

### Database Configuration

#### MONGODB_URI

**Purpose**: MongoDB connection string

**Type**: String (URL)

**Required**: Yes

**Examples**:

Local MongoDB:
```bash
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth
```

MongoDB with authentication:
```bash
MONGODB_URI=mongodb://username:password@localhost:27017/easygenerator-auth?authSource=admin
```

MongoDB Atlas (Cloud):
```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/easygenerator-auth?retryWrites=true&w=majority
```

Docker:
```bash
MONGODB_URI=mongodb://admin:password123@mongodb:27017/easygenerator-auth?authSource=admin
```

**Security Notes**:
- Never commit credentials to version control
- Use environment-specific databases
- Enable authentication in production
- Use TLS/SSL for remote connections

---

### JWT Configuration

The application uses a **dual token system** with separate secrets for access tokens and refresh tokens.

#### JWT_SECRET (Access Token)

**Purpose**: Secret key for signing JWT tokens

**Type**: String

**Required**: Yes

**Minimum Length**: 32 characters

**How to Generate**:

Using OpenSSL:
```bash
openssl rand -base64 32
```

Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Using online generator: [Generate Random](https://www.random.org/strings/)

**Example**:
```bash
JWT_SECRET=Kj8H3nP2vX9mZ7qT4wR6yE1sA5dF0gH2jK4lM8nB3cV7xQ9z
```

**Security Notes**:
- ⚠️ **CRITICAL**: Use different secrets for dev/staging/production
- ⚠️ **CRITICAL**: Use different secret from `JWT_REFRESH_SECRET`
- ⚠️ Never expose in code, logs, or error messages
- ⚠️ Rotate periodically (requires re-authentication of users)
- Minimum 32 characters recommended
- Use cryptographically random values

#### JWT_REFRESH_SECRET (Refresh Token)

**Purpose**: Secret key for signing JWT refresh tokens (MUST be different from JWT_SECRET)

**Type**: String

**Required**: Yes

**Minimum Length**: 32 characters

**How to Generate**:

Using OpenSSL:
```bash
openssl rand -base64 32
```

Using Node.js:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example**:
```bash
JWT_REFRESH_SECRET=Qr5W8zN2xP4mY6tH9jL3kF7vC1bN0dG5aE8rT2yU4iO9pS6w
```

**Security Notes**:
- ⚠️ **CRITICAL**: MUST be different from `JWT_SECRET`
- ⚠️ **CRITICAL**: Use different secrets for dev/staging/production
- ⚠️ Never use the same secret for access and refresh tokens
- ⚠️ Never expose in code, logs, or error messages
- Refresh tokens have longer lifespan, so security is critical
- Stored in httpOnly cookies for added protection
- Minimum 32 characters recommended
- Use cryptographically random values

#### JWT_EXPIRES_IN (Access Token)

**Purpose**: JWT token expiration time

**Type**: String (time span)

**Required**: Yes

**Format**: Vercel ms format
- Seconds: `60s`, `120s`
- Minutes: `5m`, `30m`
- Hours: `1h`, `24h`
- Days: `7d`, `30d`

**Recommended Values**:

Development:
```bash
JWT_EXPIRES_IN=24h  # Convenient for development
```

Production:
```bash
JWT_EXPIRES_IN=1h   # Security best practice
```

**Considerations**:
- Shorter expiration = more secure but requires more frequent refreshes
- Longer expiration = more convenient but less secure if token stolen
- Works with refresh tokens to maintain user sessions
- Balance between security and refresh frequency

#### JWT_REFRESH_EXPIRES_IN (Refresh Token)

**Purpose**: Refresh token expiration time (longer than access token)

**Type**: String (time span)

**Required**: Yes

**Format**: Vercel ms format
- Hours: `12h`, `24h`
- Days: `7d`, `14d`, `30d`
- Weeks: `1w`, `2w`

**Recommended Values**:

Development:
```bash
JWT_REFRESH_EXPIRES_IN=30d  # Convenient for development
```

Production:
```bash
JWT_REFRESH_EXPIRES_IN=7d   # Balance of security and UX
```

**Considerations**:
- Refresh tokens enable seamless user experience
- Stored in httpOnly cookies (not accessible via JavaScript)
- Token rotation on each refresh enhances security
- Longer lifespan is acceptable due to httpOnly storage
- User must re-authenticate when refresh token expires
- Typical values: 7 days to 30 days

---

### Application Configuration

#### PORT

**Purpose**: Port number for the HTTP server

**Type**: Number

**Required**: No (defaults to 3000)

**Example**:
```bash
PORT=3000
```

**Common Values**:
- Development: 3000, 3001, 8000
- Production: 80 (HTTP), 443 (HTTPS), or custom

**Notes**:
- Ports below 1024 require root/admin privileges
- Ensure port is not already in use
- Use reverse proxy (nginx, Caddy) in production

#### NODE_ENV

**Purpose**: Application environment mode

**Type**: String (enum)

**Required**: Yes

**Allowed Values**:
- `development` - Local development
- `test` - Running tests
- `staging` - Staging environment
- `production` - Production environment

**Example**:
```bash
NODE_ENV=production
```

**Impact**:
- Affects logging verbosity
- Changes error message detail
- Influences performance optimizations
- Determines which features are enabled

**Environment-Specific Behavior**:

| Feature | Development | Production |
|---------|-------------|------------|
| Error Details | Full stack traces | Generic messages |
| Logging | Verbose | Minimal |
| CORS | Allow all | Specific origins |
| Caching | Disabled | Enabled |
| Minification | No | Yes |

---

### Logging Configuration

#### LOG_LEVEL

**Purpose**: Minimum log level to output

**Type**: String (enum)

**Required**: No (defaults to 'info')

**Allowed Values** (in order of verbosity):
- `error` - Only errors
- `warn` - Warnings and errors
- `info` - General information (default)
- `debug` - Detailed debugging
- `verbose` - Very detailed (development only)

**Examples**:

Development:
```bash
LOG_LEVEL=debug
```

Production:
```bash
LOG_LEVEL=warn
```

**Log Level Matrix**:

| Level | Error | Warn | Info | Debug | Verbose |
|-------|-------|------|------|-------|---------|
| error | ✅ | ❌ | ❌ | ❌ | ❌ |
| warn | ✅ | ✅ | ❌ | ❌ | ❌ |
| info | ✅ | ✅ | ✅ | ❌ | ❌ |
| debug | ✅ | ✅ | ✅ | ✅ | ❌ |
| verbose | ✅ | ✅ | ✅ | ✅ | ✅ |

---

### CORS Configuration (Optional)

#### CORS_ORIGIN

**Purpose**: Allowed origins for CORS requests

**Type**: String (URL or wildcard)

**Required**: No (defaults based on NODE_ENV)

**Examples**:

Allow all (development only):
```bash
CORS_ORIGIN=*
```

Single origin:
```bash
CORS_ORIGIN=https://yourdomain.com
```

Multiple origins (comma-separated):
```bash
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com,https://app.yourdomain.com
```

**Security Notes**:
- Never use `*` in production with credentials
- Specify exact domains in production
- Include protocol (http/https)
- Don't include trailing slashes

---

### Rate Limiting Configuration (Optional)

#### RATE_LIMIT_TTL

**Purpose**: Time window for rate limiting (in seconds)

**Type**: Number

**Required**: No (defaults to 60)

**Example**:
```bash
RATE_LIMIT_TTL=60  # 1 minute window
```

#### RATE_LIMIT_MAX

**Purpose**: Maximum requests per time window

**Type**: Number

**Required**: No (defaults to 100)

**Example**:
```bash
RATE_LIMIT_MAX=100  # 100 requests per window
```

**Recommended Settings**:

API-wide:
```bash
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

Authentication endpoints:
```bash
AUTH_RATE_LIMIT_TTL=60
AUTH_RATE_LIMIT_MAX=5
```

---

## Environment-Specific Configurations

### Development Environment

```bash
# .env.development
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth-dev
JWT_SECRET=dev-secret-key-change-in-production-at-least-32-chars
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=dev-refresh-secret-different-from-jwt-secret-32-chars
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=1000
```

### Test Environment

```bash
# .env.test
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth-test
JWT_SECRET=test-secret-key-for-testing-purposes-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=test-refresh-secret-different-32-characters-long
JWT_REFRESH_EXPIRES_IN=7d
PORT=3001
NODE_ENV=test
LOG_LEVEL=error
CORS_ORIGIN=*
```

### Production Environment

```bash
# .env.production (example - use actual secrets)
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/easygenerator-auth?retryWrites=true&w=majority
JWT_SECRET=production-secret-generated-with-openssl-or-crypto
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=production-refresh-secret-different-from-jwt-secret
JWT_REFRESH_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100
```

---

## Loading Environment Variables

### NestJS Configuration Module

The application uses `@nestjs/config` to load environment variables:

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validate,
    }),
  ],
})
export class AppModule {}
```

### Validation Schema

Environment variables are validated at startup using class-validator:

```typescript
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
  Staging = 'staging',
}

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Debug = 'debug',
  Verbose = 'verbose',
}

export class EnvironmentVariables {
  @IsString()
  @IsNotEmpty()
  MONGODB_URI: string;

  @IsString()
  @MinLength(32, {
    message: 'JWT_SECRET must be at least 32 characters long',
  })
  JWT_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhdwy]$/, {
    message: 'JWT_EXPIRES_IN must be a valid time string (e.g., 1h, 30m, 7d)',
  })
  @Transform(({ value }) => value || '1h')
  JWT_EXPIRES_IN: string = '1h';

  @IsString()
  @MinLength(32, {
    message: 'JWT_REFRESH_SECRET must be at least 32 characters long',
  })
  JWT_REFRESH_SECRET: string;

  @IsString()
  @Matches(/^\d+[smhdwy]$/, {
    message: 'JWT_REFRESH_EXPIRES_IN must be a valid time string',
  })
  @Transform(({ value }) => value || '7d')
  JWT_REFRESH_EXPIRES_IN: string = '7d';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Transform(({ value }) => parseInt(String(value), 10) || 3000)
  PORT: number = 3000;

  @IsEnum(Environment)
  @Transform(({ value }) => value || 'development')
  NODE_ENV: Environment = Environment.Development;

  @IsEnum(LogLevel)
  @Transform(({ value }) => value || 'info')
  LOG_LEVEL: LogLevel = LogLevel.Info;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

### Accessing Environment Variables

In services/controllers:

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(private configService: ConfigService) {}

  getJwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }
}
```

---

## Security Best Practices

### DO ✅

1. **Use `.gitignore`**:
   ```gitignore
   # Environment files
   .env
   .env.local
   .env.*.local
   .env.production
   ```

2. **Use different secrets per environment**

3. **Validate environment variables at startup**

4. **Use strong, random secrets**:
   ```bash
   openssl rand -base64 32
   ```

5. **Document all variables in `.env.example`**

6. **Use environment variable injection in production**:
   - Heroku: Config Vars
   - AWS: Parameter Store, Secrets Manager
   - Docker: Environment variables in docker-compose
   - Kubernetes: ConfigMaps, Secrets

### DON'T ❌

1. **Never commit `.env` files with secrets**

2. **Never hardcode secrets in code**:
   ```typescript
   // ❌ BAD
   const secret = 'my-secret-key';
   
   // ✅ GOOD
   const secret = this.configService.get<string>('JWT_SECRET');
   ```

3. **Never log environment variables**:
   ```typescript
   // ❌ BAD
   console.log(process.env.JWT_SECRET);
   
   // ✅ GOOD
   console.log('JWT configured');
   ```

4. **Never use weak secrets**:
   ```bash
   # ❌ BAD
   JWT_SECRET=secret123
   
   # ✅ GOOD
   JWT_SECRET=Kj8H3nP2vX9mZ7qT4wR6yE1sA5dF0gH2jK4lM8nB3cV7xQ9z
   ```

---

## Platform-Specific Configuration

### Heroku

Set environment variables:
```bash
heroku config:set MONGODB_URI="mongodb+srv://..."
heroku config:set JWT_SECRET="your-secret"
heroku config:set NODE_ENV="production"
```

### Docker / Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - MONGODB_URI=mongodb://mongodb:27017/easygenerator-auth
      - JWT_SECRET=${JWT_SECRET}
      - NODE_ENV=production
    env_file:
      - .env.production
```

### AWS / EC2

Use AWS Systems Manager Parameter Store:
```bash
# Store secret
aws ssm put-parameter \
  --name "/easygenerator/jwt-secret" \
  --value "your-secret" \
  --type "SecureString"

# Retrieve in app
const secret = await ssm.getParameter({ 
  Name: '/easygenerator/jwt-secret',
  WithDecryption: true 
});
```

### Kubernetes

Create secret:
```bash
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret='your-secret' \
  --from-literal=mongodb-uri='mongodb://...'
```

Use in deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
spec:
  template:
    spec:
      containers:
      - name: api
        env:
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
```

---

## Troubleshooting

### Variable Not Loading

**Check**:
1. `.env` file exists in project root
2. Variable name is spelled correctly
3. No quotes around values (unless part of value)
4. Application restarted after changes
5. `@nestjs/config` module imported

### Validation Errors

**Error**: "Environment variable X is required"

**Fix**: Add missing variable to `.env` file

**Error**: "JWT_SECRET must be at least 32 characters"

**Fix**: Use a longer secret key

### MongoDB Connection Failed

**Check**:
1. `MONGODB_URI` format is correct
2. MongoDB is running
3. Credentials are correct
4. Network/firewall allows connection
5. Database name is specified

---

## Checklist for New Environments

When setting up a new environment:

- [ ] Copy `.env.example` to `.env`
- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Generate different `JWT_REFRESH_SECRET` (32+ characters)
- [ ] Verify `JWT_SECRET` ≠ `JWT_REFRESH_SECRET`
- [ ] Set correct `MONGODB_URI`
- [ ] Set appropriate `JWT_EXPIRES_IN` (e.g., 1h)
- [ ] Set appropriate `JWT_REFRESH_EXPIRES_IN` (e.g., 7d)
- [ ] Configure `NODE_ENV`
- [ ] Set `LOG_LEVEL` appropriately
- [ ] Configure `CORS_ORIGIN` (production)
- [ ] Set rate limiting values
- [ ] Validate all required variables are present
- [ ] Test application starts successfully
- [ ] Verify database connection
- [ ] Test authentication flow (signup, signin, refresh)
- [ ] Test refresh token rotation
- [ ] Never commit `.env` file

---

## Additional Resources

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [dotenv Documentation](https://github.com/motdotla/dotenv)
- [12-Factor App: Config](https://12factor.net/config)
- [OWASP: Protect Configuration Files](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
