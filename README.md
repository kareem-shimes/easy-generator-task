# EasyGenerator Task - Full Stack Authentication Application

A modern full-stack authentication application built with **Next.js** (frontend) and **NestJS** (backend), featuring JWT authentication, MongoDB database, and complete Docker support for development.

## 🎯 Project Overview

This project consists of two main components:

- **Backend** (NestJS): RESTful API with JWT authentication, user management, and MongoDB integration
- **Frontend** (Next.js): Modern React application with TypeScript, TailwindCSS, and shadcn/ui components

Both services are containerized using Docker for easy development and consistent environments.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: Version 20.10 or later
- **Docker Compose**: Version 2.0 or later
- **Git**: For cloning the repository

Optional (for running without Docker):
- **Node.js**: Version 18 or 20
- **pnpm**: Version 8+ (for backend)
- **npm**: Latest version (for frontend)
- **MongoDB**: Version 6.0 or later

## ⚡ Quick Start (TL;DR)

```bash
# Clone and navigate
git clone https://github.com/kareem-shimes/easy-generator-task.git
cd easy-generator-task

# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your configuration

# Start all services
npm start

# View logs
npm run logs

# Stop services
npm stop
```

Visit: **Frontend** → http://localhost:3001 | **API** → http://localhost:3000 | **API Docs** → http://localhost:3000/api/docs

---

## 🚀 Detailed Setup with Docker

### 1. Clone the Repository

```bash
git clone https://github.com/kareem-shimes/easy-generator-task.git
cd easy-generator-task
```

### 2. Set Up Environment Variables

#### Backend Environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and configure:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://mongodb:27017/easygenerator-auth

# JWT Configuration (generate secure secrets)
JWT_SECRET=your-very-secure-secret-key-min-32-characters
JWT_REFRESH_SECRET=your-different-secure-refresh-secret-min-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# CORS Configuration
CORS_ORIGIN=http://localhost:3001
```

**Generate secure JWT secrets:**

```bash
# macOS/Linux
openssl rand -base64 32
```

#### Frontend Environment

```bash
cd ../frontend
cp .env.example .env
```

Edit `frontend/.env` and configure:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Start All Services

Return to the project root and start all services with Docker Compose:

```bash
cd ..

# Option 1: Using npm scripts (recommended)
npm start

# Option 2: Using docker-compose directly
docker-compose up -d
```

This will start:
- **MongoDB** on port `27017`
- **Backend API** on port `3000`
- **Frontend App** on port `3001`

### 4. Access the Application

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api/docs
- **Health Check**: http://localhost:3000/health

### 5. View Logs

```bash
# View all logs
npm run logs

# View specific service logs
npm run logs:backend
npm run logs:frontend
npm run logs:mongodb

# Or using docker-compose
docker-compose logs -f
docker-compose logs -f backend
```

### 6. Stop Services

```bash
# Stop all services
npm stop

# Stop and remove volumes (clean database)
npm run clean

# Or using docker-compose
docker-compose down
docker-compose down -v
```

## 📁 Project Structure

```
easy-generator-task/
├── backend/                    # NestJS Backend API
│   ├── src/                   # Source code
│   │   ├── auth/             # Authentication module
│   │   ├── users/            # User management module
│   │   ├── config/           # Configuration
│   │   ├── common/           # Shared utilities
│   │   └── health/           # Health check module
│   ├── test/                 # E2E tests
│   ├── docs/                 # Backend documentation
│   ├── Dockerfile.dev        # Development Docker image
│   ├── package.json          # Backend dependencies
│   └── .env                  # Backend environment variables
│
├── frontend/                  # Next.js Frontend App
│   ├── src/                  # Source code
│   │   ├── app/             # Next.js app directory
│   │   ├── components/      # React components
│   │   └── lib/             # Utilities
│   ├── public/              # Static assets
│   ├── Dockerfile.dev       # Development Docker image
│   ├── package.json         # Frontend dependencies
│   └── .env                 # Frontend environment variables
│
├── .github/                  # GitHub Actions workflows
│   └── workflows/
│       └── ci.yml           # CI pipeline
├── docker-compose.yml        # Docker Compose configuration
├── package.json             # Root package.json (Docker scripts)
└── README.md                # This file
```

## 🛠️ Development Without Docker

### Backend Setup

```bash
cd backend

# Enable pnpm
corepack enable
corepack prepare pnpm@latest --activate

# Install dependencies
pnpm install

# Start MongoDB (local installation required)
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod

# Update .env to use local MongoDB
# MONGODB_URI=mongodb://localhost:27017/easygenerator-auth

# Start development server
pnpm run start:dev

# API will be available at http://localhost:3000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Update .env for local backend
# NEXT_PUBLIC_API_URL=http://localhost:3000

# Start development server
npm run dev

# App will be available at http://localhost:3000
# (or next available port if 3000 is taken)
```

## 🧪 Running Tests

### Backend Tests

```bash
cd backend

# Unit tests
pnpm run test

# E2E tests (requires MongoDB)
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Frontend Tests

```bash
cd frontend

# Run linting
npm run lint

# Build test
npm run build
```

## 🐳 Docker Commands

### Rebuild Services

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend
docker-compose build frontend
```

### Execute Commands in Containers

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh
```

### Clean Up Docker Resources

```bash
# Remove stopped containers
docker-compose down

# Remove containers and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a
```

## 🔧 Available Scripts

### Root Scripts (Docker Management)

```bash
npm start               # Start all services with Docker
npm stop                # Stop all services
npm run restart         # Restart all services
npm run logs            # View logs from all services
npm run logs:backend    # View backend logs only
npm run logs:frontend   # View frontend logs only
npm run logs:mongodb    # View MongoDB logs only
npm run build           # Rebuild all Docker images
npm run build:backend   # Rebuild backend image only
npm run build:frontend  # Rebuild frontend image only
npm run clean           # Stop services and remove volumes
npm run ps              # List running containers
npm run shell:backend   # Open shell in backend container
npm run shell:frontend  # Open shell in frontend container
npm run shell:mongodb   # Open MongoDB shell
```

### Backend Scripts (inside backend directory)

```bash
pnpm run start          # Start application
pnpm run start:dev      # Development mode with hot-reload
pnpm run start:debug    # Debug mode
pnpm run build          # Build for production
pnpm run lint           # Lint code
pnpm run format         # Format code with Prettier
pnpm run test           # Run unit tests
pnpm run test:e2e       # Run E2E tests
pnpm run test:cov       # Test coverage
```

### Frontend Scripts (inside frontend directory)

```bash
npm run dev             # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Lint code
```

## 📚 API Documentation

The backend API is fully documented using Swagger/OpenAPI. Once the backend is running, visit:

**http://localhost:3000/api/docs**

### Key Endpoints

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update user profile
- `GET /health` - Health check

For detailed API documentation, see [Backend API Endpoints](./backend/docs/technical/api-endpoints.md).

## 🔐 Security Features

### Backend Security
- JWT authentication with refresh token rotation
- HttpOnly cookies for refresh tokens
- Password hashing with bcrypt
- Input validation with class-validator
- CORS configuration
- Environment-based secrets

### Frontend Security
- Secure token storage
- Protected routes
- CSRF protection via SameSite cookies
- Environment variable validation

## 🔄 CI/CD Pipeline

The project includes a GitHub Actions CI pipeline that runs on every push and pull request:

- **Backend**: Linting, unit tests, E2E tests, coverage reports (Node.js 18 & 20)
- **Frontend**: Linting, type checking, build validation (Node.js 18 & 20)
- **Docker**: Build validation for both services

View workflow: `.github/workflows/ci.yml`

## 📖 Additional Documentation

- **Backend Documentation**: [./backend/README.md](./backend/README.md)
- **Frontend Documentation**: [./frontend/README.md](./frontend/README.md)
- **Docker Guide**: [./backend/docs/development/docker.md](./backend/docs/development/docker.md)
- **API Endpoints**: [./backend/docs/technical/api-endpoints.md](./backend/docs/technical/api-endpoints.md)
- **Architecture**: [./backend/docs/technical/architecture.md](./backend/docs/technical/architecture.md)
- **GitHub Workflows**: [./backend/docs/development/github-workflows.md](./backend/docs/development/github-workflows.md)

## 🐛 Troubleshooting

### Docker Issues

**Port already in use**
```bash
# Check what's using the port
lsof -i :3000
lsof -i :3001
lsof -i :27017

# Change ports in docker-compose.yml if needed
```

**Services not starting**
```bash
# Check logs
docker-compose logs

# Rebuild images
docker-compose build --no-cache

# Clean and restart
docker-compose down -v
docker-compose up -d
```

**Permission issues**
```bash
# Fix file permissions
sudo chown -R $USER:$USER .
```

### Backend Issues

**MongoDB connection error**
```bash
# Ensure MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in backend/.env
```

**JWT errors**
```bash
# Ensure JWT secrets are at least 32 characters
# Ensure JWT_SECRET and JWT_REFRESH_SECRET are different
# Check backend/.env configuration
```

### Frontend Issues

**Cannot connect to backend**
```bash
# Verify NEXT_PUBLIC_API_URL in frontend/.env
# Ensure backend is running: docker-compose ps backend
# Check CORS configuration in backend
```

**Build errors**
```bash
# Clear Next.js cache
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

## 📝 Environment Variables Reference

### Backend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://mongodb:27017/easygenerator-auth` | Yes |
| `JWT_SECRET` | Access token secret (min 32 chars) | - | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret (min 32 chars) | - | Yes |
| `JWT_EXPIRES_IN` | Access token expiration | `1h` | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | No |
| `PORT` | Server port | `3000` | No |
| `NODE_ENV` | Environment mode | `development` | No |
| `LOG_LEVEL` | Logging level | `debug` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `*` | No |

### Frontend (.env)

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API URL | `http://localhost:3000` | Yes |
| `NODE_ENV` | Environment mode | `development` | No |

## 📄 License

This project is MIT licensed.

## 👨‍💻 Author

Kareem Shimes - [GitHub](https://github.com/kareem-shimes)

---

**Happy Coding! 🚀**
