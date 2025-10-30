# GitHub Workflows - CI Pipeline

## Overview

This document provides comprehensive guidance on the GitHub Actions CI workflow for the EasyGenerator project. This workflow is designed for development environments and runs automated tests and validation on every push and pull request.

## GitHub Actions Setup

GitHub Actions provides automated CI pipelines that run on every push and pull request to ensure code quality and functionality.

## Workflow Files Structure

```
.github/
└── workflows/
    └── ci.yml           # Continuous Integration (✅ Active)
```

## CI Focus

This project uses a **development-focused CI workflow** that validates both frontend and backend code quality, runs tests, and verifies Docker builds.

## CI Workflow (ci.yml) ✅

### Purpose

The CI workflow validates code quality and runs comprehensive tests on every push and pull request.

### Triggers
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`

### Jobs

1. **Backend Lint and Test** - Backend linting, unit tests, and E2E tests on Node.js 18 and 20
2. **Frontend Lint and Test** - Frontend linting and build validation on Node.js 18 and 20
3. **Docker Build Test** - Validates Docker images build correctly
4. **CI Success** - Final check gate

### Key Features
- ✅ Multi-version Node.js testing (18, 20)
- ✅ Backend: pnpm with MongoDB service
- ✅ Frontend: npm with Next.js build
- ✅ Code coverage reporting for backend
- ✅ Docker build validation for both services
- ✅ GitHub Actions caching

### Workflow Configuration

See `.github/workflows/ci.yml` for the complete workflow.

**Example structure**:

```yaml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    name: Lint and Test
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    services:
      mongodb:
        image: mongo:6.0
        ports:
          - 27017:27017
        options: >-
          --health-cmd="mongosh --eval 'db.runCommand({ping: 1})'"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
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
      
      - name: Lint code
        run: pnpm run lint
      
      - name: Type check
        run: pnpm run build
      
      - name: Run unit tests
        run: pnpm run test
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret-key-for-ci-pipeline-only
          NODE_ENV: test
      
      - name: Run E2E tests
        run: pnpm run test:e2e
        env:
          MONGODB_URI: mongodb://localhost:27017/test-e2e
          JWT_SECRET: test-secret-key-for-ci-pipeline-only
          NODE_ENV: test
      
      - name: Generate coverage report
        run: pnpm run test:cov
        env:
          MONGODB_URI: mongodb://localhost:27017/test
          JWT_SECRET: test-secret-key-for-ci-pipeline-only
          NODE_ENV: test
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: unittests
          name: codecov-${{ matrix.node-version }}
          fail_ci_if_error: false
      
      - name: Archive coverage artifacts
        uses: actions/upload-artifact@v3
        with:
          name: coverage-report-${{ matrix.node-version }}
          path: coverage/
          retention-days: 7

  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: lint-and-test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
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
      
      - name: Build application
        run: pnpm run build
      
      - name: Archive build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/
          retention-days: 7
```

## Development Workflow

This project focuses on **development environment CI** only. The workflow validates code quality and ensures all tests pass before merging.

## GitHub Secrets Configuration

### Required Secrets

Configure these secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### For CI Workflow
No secrets are strictly required for basic CI functionality. Optional secrets:
- `CODECOV_TOKEN` - Code coverage reports (optional, for private repos)

### How to Add Secrets

```bash
# Using GitHub CLI
gh secret set CODECOV_TOKEN

# Or via GitHub UI:
# 1. Go to repository Settings
# 2. Click "Secrets and variables" > "Actions"
# 3. Click "New repository secret"
# 4. Enter name and value
# 5. Click "Add secret"
```

## Branch Protection Rules

### Recommended Settings

1. Go to `Settings > Branches`
2. Add rule for `main` branch:
   - ✅ Require pull request before merging
   - ✅ Require approvals (1+)
   - ✅ Require status checks to pass before merging
     - Select: `lint-and-test`
     - Select: `build`
   - ✅ Require branches to be up to date
   - ✅ Do not allow bypassing settings

## Workflow Status Badges

### Add badges to README.md

```markdown
[![CI Pipeline](https://github.com/username/repo/workflows/CI%20Pipeline/badge.svg)](https://github.com/username/repo/actions)
```

## Caching Strategy

### pnpm Cache

```yaml
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18.x'
          cache: 'pnpm' # Automatically caches pnpm store
```

### Custom Cache

```yaml
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: |
            ~/.pnpm-store
            node_modules
          key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-
```

## Debugging Workflows

### Enable Debug Logging

1. Go to `Settings > Secrets and variables > Actions`
2. Add new variable:
   - Name: `ACTIONS_STEP_DEBUG`
   - Value: `true`
3. Re-run workflow

### SSH into Runner

```yaml
      - name: Setup tmate session
        if: failure()
        uses: mxschmitt/action-tmate@v3
        timeout-minutes: 15
```

## Best Practices

### 1. Use Matrix Strategy

Test on multiple Node.js versions:

```yaml
strategy:
  matrix:
    node-version: [18.x, 20.x]
    os: [ubuntu-latest, windows-latest]
```

### 2. Fail Fast

```yaml
strategy:
  fail-fast: true # Stop all jobs if one fails
```

### 3. Conditional Steps

```yaml
      - name: Deploy
        if: github.ref == 'refs/heads/main' && success()
        run: pnpm run deploy
```

### 4. Timeout Jobs

```yaml
jobs:
  test:
    timeout-minutes: 10
```

### 5. Concurrency Control

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

## Cost Optimization

### GitHub Actions Minutes

- **Free tier**: 2,000 minutes/month for private repos
- **Public repos**: Unlimited

### Optimization Tips

1. **Cache dependencies** (saves ~30-60 seconds)
2. **Use matrix sparingly** (each combination = separate job)
3. **Cancel redundant runs** (concurrency control)
4. **Limit workflow triggers** (avoid running on every commit)

## Monitoring & Analytics

### View Workflow Insights

1. Go to `Actions` tab
2. Click on workflow name
3. View:
   - Success/failure rates
   - Run duration
   - Resource usage

### Workflow Metrics

Track:
- Build time trends
- Test execution time
- Deployment frequency
- Failure rates

## Troubleshooting

### Common Issues

**1. pnpm not found**
```yaml
- name: Setup pnpm
  uses: pnpm/action-setup@v2
  with:
    version: 8
```

**2. MongoDB connection fails**
```yaml
services:
  mongodb:
    image: mongo:6.0
    options: --health-cmd="mongosh --eval 'db.runCommand({ping: 1})'"
```

**3. Tests fail in CI but pass locally**
- Check environment variables
- Verify MongoDB service is running
- Ensure correct Node.js version

**4. Deployment fails**
- Verify secrets are set correctly
- Check deployment service status
- Review deployment logs

## Example: Complete Workflow Setup

### Step-by-Step Guide

1. **Create workflow directory**:
   ```bash
   mkdir -p .github/workflows
   ```

2. **Create CI workflow**:
   ```bash
   touch .github/workflows/ci.yml
   # Paste CI configuration
   ```

3. **Create deployment workflow**:
   ```bash
   touch .github/workflows/deploy.yml
   # Paste deployment configuration
   ```

4. **Configure secrets**:
   ```bash
   gh secret set HEROKU_API_KEY
   gh secret set JWT_SECRET_TEST
   gh secret set MONGODB_URI_TEST
   ```

5. **Commit and push**:
   ```bash
   git add .github/
   git commit -m "ci: add GitHub Actions workflows"
   git push origin main
   ```

6. **Verify workflows**:
   - Go to Actions tab
   - Check workflow runs
   - View logs and results

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [pnpm GitHub Actions](https://pnpm.io/continuous-integration#github-actions)
- [Workflow Syntax](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions)
- [Environment Variables](https://docs.github.com/en/actions/learn-github-actions/environment-variables)
