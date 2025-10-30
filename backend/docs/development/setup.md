# Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v18.x or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **pnpm** (v8.x or higher)
   - Install: `npm install -g pnpm` or `corepack enable`
   - Verify installation: `pnpm --version`

3. **MongoDB** (v6.0 or higher)
   - Option 1: [Download MongoDB Community Server](https://www.mongodb.com/try/download/community)
   - Option 2: Use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (cloud)
   - Option 3: Use Docker (see below)
   - Verify installation: `mongod --version`

4. **Git**
   - Download from [git-scm.com](https://git-scm.com/)
   - Verify installation: `git --version`

### Optional Tools

- **Docker** & **Docker Compose** (for containerized MongoDB)
- **Postman** or **Insomnia** (for API testing)
- **MongoDB Compass** (GUI for MongoDB)
- **VS Code** (recommended IDE)

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/easygenerator-auth-api.git
cd easygenerator-auth-api
```

### 2. Install Dependencies

Using pnpm:
```bash
pnpm install
```

This will install all required packages listed in `package.json` and generate a `pnpm-lock.yaml` file.

### 3. Set Up MongoDB

Choose one of the following options:

#### Option A: Local MongoDB Installation

1. Start MongoDB service:

**macOS** (using Homebrew):
```bash
brew services start mongodb-community
```

**Linux**:
```bash
sudo systemctl start mongod
```

**Windows**:
```bash
# MongoDB runs as a Windows service automatically
# Or start manually from Services panel
```

2. Verify MongoDB is running:
```bash
mongosh
# You should see the MongoDB shell prompt
```

#### Option B: MongoDB with Docker

1. Create a `docker-compose.yml` file in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: easygenerator-mongodb
    restart: always
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password123
      MONGO_INITDB_DATABASE: easygenerator-auth
    volumes:
      - mongodb_data:/data/db

volumes:
  mongodb_data:
```

2. Start MongoDB container:
```bash
docker-compose up -d
```

3. Verify container is running:
```bash
docker ps
```

#### Option C: MongoDB Atlas (Cloud)

1. Create free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address
5. Get connection string
6. Use the connection string in your `.env` file

### 4. Configure Environment Variables

1. Copy the example environment file:

```bash
cp .env.example .env
```

2. Edit `.env` file with your settings:

```bash
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/easygenerator-auth
# For Docker: mongodb://admin:password123@localhost:27017/easygenerator-auth?authSource=admin
# For Atlas: mongodb+srv://username:password@cluster.mongodb.net/easygenerator-auth

# JWT Configuration
JWT_SECRET=your-super-secret-key-at-least-32-characters-long-change-this
JWT_EXPIRES_IN=1h

# Application Configuration
PORT=3000
NODE_ENV=development

# Logging
LOG_LEVEL=debug
```

**Important**: 
- Generate a strong JWT secret (use `openssl rand -base64 32`)
- Never commit `.env` file to version control
- Use different secrets for different environments

### 5. Initialize the Database (Optional)

If you want to create indexes or seed initial data:

```bash
pnpm run db:init
```

## Running the Application

### Development Mode

Start the application with hot-reload:

```bash
pnpm run start:dev
```

The API will be available at: `http://localhost:3000`

### Production Mode

1. Build the application:
```bash
pnpm run build
```

2. Start the production server:
```bash
pnpm run start:prod
```

### Debug Mode

Start with debugging enabled:

```bash
pnpm run start:debug
```

Then attach your debugger to port 9229.

## Verify Installation

### 1. Health Check

Visit or curl the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-10-29T16:45:00.000Z",
  "uptime": 10,
  "database": "connected"
}
```

### 2. API Documentation

Open Swagger documentation in your browser:

```
http://localhost:3000/api/docs
```

### 3. Test Sign Up

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "SecurePass123!"
  }'
```

Expected: 201 Created with user data and JWT token.

## IDE Setup (VS Code)

### Recommended Extensions

1. **ESLint** - Code linting
2. **Prettier** - Code formatting
3. **REST Client** - Test APIs from VS Code
4. **MongoDB for VS Code** - MongoDB integration
5. **GitLens** - Git supercharged
6. **Thunder Client** - API testing

### VS Code Settings

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

### Debug Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug NestJS",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["run", "start:debug"],
      "port": 9229,
      "restart": true,
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

## Troubleshooting

### MongoDB Connection Issues

**Problem**: Cannot connect to MongoDB

**Solutions**:
1. Verify MongoDB is running: `mongosh`
2. Check connection string in `.env`
3. For Docker: Ensure container is running: `docker ps`
4. Check firewall settings
5. For Atlas: Verify IP whitelist

### Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3000`

**Solutions**:
1. Change port in `.env` file
2. Kill process using port 3000:
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Module Not Found

**Problem**: Cannot find module errors

**Solutions**:
1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules pnpm-lock.yaml
   pnpm install
   ```
2. Clear pnpm cache:
   ```bash
   pnpm store prune
   ```

### TypeScript Errors

**Problem**: TypeScript compilation errors

**Solutions**:
1. Ensure TypeScript is installed: `pnpm add -D typescript`
2. Check `tsconfig.json` configuration
3. Restart TypeScript server in IDE
4. Clean build: `pnpm run build -- --clean`

### Environment Variables Not Loading

**Problem**: Environment variables are undefined

**Solutions**:
1. Verify `.env` file exists in project root
2. Check `.env` file format (no quotes around values)
3. Restart the application
4. Check `@nestjs/config` is installed

## Next Steps

After successful setup:

1. ✅ Read the [API Endpoints Documentation](../technical/api-endpoints.md)
2. ✅ Explore [Features Documentation](../features/authentication.md)
3. ✅ Review [Testing Guide](./testing.md)
4. ✅ Check [Security Best Practices](../technical/security.md)
5. ✅ Set up CI/CD (see [Deployment Guide](./deployment.md))

## Development Workflow

### Typical Development Flow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make changes to code

3. Run tests:
   ```bash
   pnpm run test
   ```

4. Run linter:
   ```bash
   pnpm run lint
   ```

5. Format code:
   ```bash
   pnpm run format
   ```

6. Commit changes:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

7. Push and create pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality Checks

Before committing, ensure:

```bash
# Lint check
pnpm run lint

# Format check
pnpm run format

# Type check
pnpm run build

# Run tests
pnpm run test

# Test coverage
pnpm run test:cov
```

## Database Management

### View Database

Using MongoDB Compass:
1. Open MongoDB Compass
2. Connect to: `mongodb://localhost:27017`
3. Browse `easygenerator-auth` database

Using mongo shell:
```bash
mongosh
use easygenerator-auth
db.users.find().pretty()
```

### Reset Database

**Warning**: This will delete all data!

```bash
mongosh
use easygenerator-auth
db.dropDatabase()
```

### Backup Database

```bash
mongodump --db easygenerator-auth --out ./backup
```

### Restore Database

```bash
mongorestore --db easygenerator-auth ./backup/easygenerator-auth
```

## Performance Optimization

### Development

- Use `pnpm run start:dev` for hot-reload
- Enable source maps for debugging
- Use verbose logging

### Production

- Build with optimizations: `pnpm run build`
- Use production environment variables
- Enable compression
- Implement caching strategies

## Getting Help

If you encounter issues:

1. Check this documentation
2. Review error logs
3. Check [GitHub Issues](https://github.com/your-username/easygenerator-auth-api/issues)
4. Create a new issue with:
   - Error message
   - Steps to reproduce
   - Environment details (OS, Node version, etc.)

## Useful Commands Reference

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run start:dev

# Build for production
pnpm run build

# Start production server
pnpm run start:prod

# Run tests
pnpm run test
pnpm run test:watch
pnpm run test:cov
pnpm run test:e2e

# Linting and formatting
pnpm run lint
pnpm run format

# Database
pnpm run db:init
pnpm run db:seed
pnpm run db:reset

# Docker
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs -f    # View logs
```
