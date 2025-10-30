# Deployment Guide

## Overview

This guide covers deployment strategies and best practices for the EasyGenerator Authentication API.

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Monitoring setup
- [ ] Error tracking configured
- [ ] Documentation updated

## Build for Production

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build TypeScript
pnpm run build

# Test production build
pnpm run start:prod
```

## Deployment Options

### Option 1: Heroku

**Setup**:
```bash
# Login to Heroku
heroku login

# Create app
heroku create easygenerator-auth-api

# Add MongoDB addon
heroku addons:create mongolab

# Set environment variables
heroku config:set JWT_SECRET="your-secret"
heroku config:set NODE_ENV="production"

# Deploy
git push heroku main
```

**Procfile**:
```
web: pnpm run start:prod
```

### Option 2: AWS EC2

**Steps**:
1. Launch EC2 instance (Ubuntu 22.04)
2. Install Node.js and MongoDB
3. Clone repository
4. Configure environment variables
5. Use PM2 for process management
6. Setup nginx as reverse proxy
7. Configure SSL with Let's Encrypt

**PM2 Commands**:
```bash
# Install PM2
pnpm add -g pm2

# Start app
pm2 start dist/main.js --name easygenerator-api

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Option 3: Docker

**Dockerfile**:
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

**docker-compose.yml**:
```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
    depends_on:
      - mongodb
  
  mongodb:
    image: mongo:6.0
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

**Deploy**:
```bash
docker-compose up -d
```

### Option 4: Kubernetes

**Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: easygenerator-auth-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
```

## Environment Configuration

**Production .env**:
```bash
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=1h
PORT=3000
NODE_ENV=production
LOG_LEVEL=warn
```

## Database Setup

### MongoDB Atlas

1. Create cluster
2. Configure network access (IP whitelist)
3. Create database user
4. Get connection string
5. Update MONGODB_URI

### Self-Hosted MongoDB

1. Install MongoDB
2. Enable authentication
3. Create database and user
4. Configure firewall
5. Setup regular backups

## SSL/HTTPS

### Let's Encrypt (Free)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d api.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### nginx Configuration

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring

### Health Check Endpoint

```typescript
@Get('health')
healthCheck() {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}
```

### Monitoring Services

- **Datadog**: Application monitoring
- **New Relic**: Performance monitoring
- **Sentry**: Error tracking
- **LogDNA**: Log management

## CI/CD Pipeline

### GitHub Actions

**.github/workflows/ci.yml** (CI Pipeline):
```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Lint
        run: pnpm run lint
      
      - name: Type check
        run: pnpm run build
      
      - name: Run tests
        run: pnpm run test:cov
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella
```

**.github/workflows/deploy.yml** (Deployment):
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'pnpm'
      
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
      
      - name: Build
        run: pnpm run build
      
      - name: Run tests
        run: pnpm run test
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{secrets.HEROKU_API_KEY}}
          heroku_app_name: "easygenerator-auth-api"
          heroku_email: "your-email@example.com"
```

## Scaling

### Horizontal Scaling

- Use load balancer (nginx, AWS ALB)
- Run multiple instances with PM2
- Use container orchestration (Kubernetes)

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Implement caching (Redis)

## Backup Strategy

### Database Backups

```bash
# Automated daily backups
mongodump --uri="$MONGODB_URI" --out=/backups/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="$MONGODB_URI" /backups/20251029
```

### Application Backups

- Code: Git repository
- Environment: Secure secrets manager
- Logs: Centralized logging service

## Security in Production

- [ ] HTTPS enabled
- [ ] Security headers configured (Helmet)
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Environment variables secured
- [ ] Database authentication enabled
- [ ] Regular security updates
- [ ] Monitoring and alerts setup

## Rollback Plan

If deployment fails:

1. **Immediate**: Revert to previous version
   ```bash
   heroku rollback
   # or
   git revert <commit>
   git push
   ```

2. **Database**: Restore from backup if needed

3. **Notify**: Inform users of issues

4. **Debug**: Review logs to identify problem

## Post-Deployment

- [ ] Verify health check endpoint
- [ ] Test authentication flow
- [ ] Check logs for errors
- [ ] Monitor performance metrics
- [ ] Verify database connectivity
- [ ] Test API endpoints
- [ ] Update documentation

## Troubleshooting

### App won't start
- Check environment variables
- Verify database connection
- Review logs

### High memory usage
- Check for memory leaks
- Optimize queries
- Increase resources

### Slow response times
- Enable caching
- Optimize database indexes
- Use CDN for static assets

## Useful Commands

```bash
# View logs
heroku logs --tail

# Restart app
heroku restart

# Run migrations
heroku run pnpm run migrate

# Scale dynos
heroku ps:scale web=2

# Database backup
heroku pg:backups:capture
```
