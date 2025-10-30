# Docker Setup Guide

This guide covers the Docker setup for the development environment.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Environment](#development-environment)
- [Docker Files Explained](#docker-files-explained)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)

## Overview

The project includes Docker configuration for development with hot-reload, debugging support, and easy database management.

**Note**: This project is configured for **development only**. Production Docker files have been removed to simplify the setup.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose v2.0 or later
- Make (optional, for convenience commands)

## Quick Start

### Using Docker Compose (from root directory)

```bash
# Start all services (backend, frontend, mongodb)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Note**: The docker-compose.yml file is located in the project root and manages both frontend and backend services.

## Development Environment

### Features

- ✅ **Hot Reload**: Code changes automatically reflected
- ✅ **Debug Port**: Port 9229 exposed for debugging
- ✅ **Mongo Express**: Web-based MongoDB UI (http://localhost:8081)
- ✅ **Volume Mounts**: Source code mounted for live updates
- ✅ **Dev Dependencies**: All dev tools available

### Starting Development

```bash
# Using Make
make dev-up

# Or using Docker Compose
docker-compose up -d
```

### Services


### Environment Variables

The development environment uses `.env` file. Key variables:

```env
NODE_ENV=development
LOG_LEVEL=debug
MONGODB_URI=mongodb://mongodb:27017/easygenerator-auth
PORT=3000
```

Note: For development, MongoDB authentication is disabled for simplicity.

### Development Workflow

1. **Start the environment**:
   ```bash
{{ ... }}
   make dev-up
   ```

2. **View logs**:
   ```bash
   make dev-logs
   ```

3. **Make code changes** - they will be automatically reflected

4. **Access Mongo Express** for database inspection:
   - URL: http://localhost:8081
   - Username: `admin`
   - Password: `admin123`

5. **Run tests**:
   ```bash
   make test
   ```

6. **Access shell**:
   ```bash
   make dev-shell
   ```

### Debugging

The debug port (9229) is exposed. To attach a debugger:

**VS Code (launch.json)**:
```json
{
  "type": "node",
  "request": "attach",
  "name": "Docker: Attach to Node",
  "port": 9229,
  "address": "localhost",
  "localRoot": "${workspaceFolder}",
  "remoteRoot": "/app",
  "protocol": "inspector"
}
```

## Production Environment

### Features

- ✅ **Multi-stage Build**: Optimized image size
- ✅ **Non-root User**: Security hardening
- ✅ **Health Checks**: Automatic health monitoring
- ✅ **Resource Limits**: CPU and memory constraints
- ✅ **Nginx Reverse Proxy**: Load balancing and rate limiting
- ✅ **Logging**: Structured logging with rotation

### Pre-deployment Checklist

1. **Create production environment file**:
   ```bash
   cp .env.production.example .env
   ```

2. **Update environment variables** in `.env`:
   - Change `JWT_SECRET` and `JWT_REFRESH_SECRET` (use `openssl rand -base64 32`)
   - Update `MONGO_USERNAME` and `MONGO_PASSWORD` (strong passwords)
   - Set `MONGODB_URI` with authentication credentials
   - Set `CORS_ORIGIN` to your domain(s)
   - Update `PORT` if needed (default: 3000)

3. **SSL Certificates** (if using Nginx):
   - Place SSL certificates in `nginx/ssl/`
   - Update paths in `nginx/nginx.conf`

4. **Build production image**:
   ```bash
   make prod-build
   ```

### Starting Production

```bash
# Using Make
make prod-up

# Or using Docker Compose
docker-compose -f docker-compose.prod.yml up -d
```

### Services

- **API** (via Nginx): http://localhost:80 or https://localhost:443
- **API Direct**: http://localhost:{PORT} (default: 3000)
- **MongoDB**: localhost:{MONGODB_PORT} (default: 27017, should not be exposed in true production)

### Production Configuration

The production setup includes:

1. **Nginx Reverse Proxy**:
   - Rate limiting
   - SSL termination
   - Security headers
   - Gzip compression

2. **Resource Limits**:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 1G
   ```

3. **Health Checks**:
   - API: Every 30s
   - MongoDB: Every 30s

### Scaling

Scale the API service:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

## Docker Files Explained

### Dockerfile (Production)

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
# ... build steps ...

FROM node:18-alpine
# ... production runtime ...
```

**Key features**:
- Multi-stage build for smaller image
- Non-root user for security
- Health checks
- Signal handling with dumb-init

### Dockerfile.dev

```dockerfile
FROM node:18-alpine
# ... dev setup with all dependencies ...
CMD ["pnpm", "run", "start:dev"]
```

**Key features**:
- All dev dependencies
- Hot reload support
- No optimization (for faster builds)

### docker-compose.yml

Development configuration (default):
- Volume mounts for hot reload
- Mongo Express for DB management
- Debug port exposed

### docker-compose.prod.yml

Production-specific configuration:
- Resource limits
- Health checks
- Nginx reverse proxy
- Logging configuration

## Common Tasks

### Database Operations

**Backup database**:
```bash
make db-backup
```

**Restore database**:
```bash
make db-restore BACKUP_DIR=backup-20250130-025221
```

**Access MongoDB shell**:
```bash
make db-shell
```

### Testing

**Run unit tests**:
```bash
make test
```

**Run e2e tests**:
```bash
make test-e2e
```

**Run tests with coverage**:
```bash
make test-cov
```

### Building Images

**Build development image**:
```bash
make build-dev
```

**Build production image**:
```bash
make build-prod
```

### Viewing Logs

**Development logs**:
```bash
make dev-logs
```

**Production logs**:
```bash
make prod-logs
```

**Specific service logs**:
```bash
docker-compose logs -f mongodb
```

### Cleanup

**Remove stopped containers**:
```bash
make clean
```

**Remove all unused Docker resources** (⚠️ use with caution):
```bash
make prune
```

## Troubleshooting

### Port Already in Use

If port 3000 or 27017 is already in use:

1. Find the process:
   ```bash
   lsof -i :3000
   ```

2. Stop it or change the port in docker-compose file:
   ```yaml
   ports:
     - '3001:3000'  # Map to different host port
   ```

### Container Won't Start

1. **Check logs**:
   ```bash
   docker-compose logs api
   ```

2. **Check container status**:
   ```bash
   docker ps -a
   ```

3. **Remove and rebuild**:
   ```bash
   make clean
   make dev-build
   make dev-up
   ```

### MongoDB Connection Issues

1. **Verify MongoDB is running**:
   ```bash
   docker ps | grep mongodb
   ```

2. **Check MongoDB health**:
   ```bash
   docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"
   ```

3. **Verify connection string** in your environment variables

### Hot Reload Not Working

1. **Verify volume mounts**:
   ```bash
   docker-compose exec api ls -la /app/src
   ```

2. **Restart container**:
   ```bash
   make dev-restart
   ```

3. **Check file system events** (MacOS users):
   - May need to reduce number of files being watched
   - Consider using Docker Desktop with VirtioFS

### Permission Issues

If you encounter permission errors:

```bash
# Fix ownership
sudo chown -R $USER:$USER .

# Or run with elevated privileges (not recommended)
sudo docker-compose up
```

### Image Too Large

Production image should be ~200-300MB. If larger:

1. Check `.dockerignore` includes unnecessary files
2. Ensure multi-stage build is used
3. Run `docker image ls` to check size

### Memory Issues

If containers are killed due to memory:

1. **Increase Docker memory limit** (Docker Desktop → Settings → Resources)
2. **Reduce resource limits** in docker-compose.prod.yml
3. **Check for memory leaks** in application

## Best Practices

### Development

- ✅ Use volume mounts for hot reload
- ✅ Use Mongo Express for DB inspection
- ✅ Keep `.env.example` committed (no secrets)
- ✅ Never commit `.env` file with actual credentials
- ✅ Use `make` commands for consistency
- ❌ Don't run production builds for development

### Production

- ✅ Use environment variables for secrets
- ✅ Enable health checks
- ✅ Set resource limits
- ✅ Use non-root user
- ✅ Enable logging
- ✅ Use Nginx for SSL and rate limiting
- ✅ Enable MongoDB authentication in production
- ❌ Never commit `.env` file with real credentials
- ❌ Don't expose MongoDB port publicly
- ❌ Don't use default passwords or secrets from examples

### Security

- 🔐 Change default MongoDB password
- 🔐 Generate strong JWT secrets (at least 32 characters)
- 🔐 Use SSL certificates in production
- 🔐 Set proper CORS origins
- 🔐 Keep images updated
- 🔐 Scan images for vulnerabilities:
  ```bash
  docker scan easygenerator-auth-api:latest
  ```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Docker Guide](https://docs.nestjs.com/recipes/docker)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)

## Support

For issues or questions:
1. Check this documentation
2. Review logs: `make dev-logs` or `make prod-logs`
3. Check Docker status: `docker ps -a`
4. Open an issue in the repository
