# GitHub Workflows & CI/CD

## Overview

This document provides comprehensive guidance on the GitHub Actions workflows for continuous integration and deployment of the EasyGenerator Authentication API.

The project uses **separate, isolated workflows** for CI and deployment, following best practices for maintainability and security.

## GitHub Actions Setup

GitHub Actions provides automated CI/CD pipelines that run on every push, pull request, or on a schedule.

## Workflow Files Structure

```
.github/
└── workflows/
    ├── ci.yml           # Continuous Integration (✅ Active)
    ├── deploy.yml       # Docker Build & Deployment (✅ Active)
    ├── README.md        # Workflow documentation
    └── docker.yml.old   # Legacy combined workflow (backup)
```

## Workflow Separation

### ✅ Why Separate Workflows?

**Benefits:**
- **Isolation**: CI runs independently from deployment
- **Security**: Different permissions for different tasks
- **Speed**: CI runs on all PRs, deployment only on specific branches
- **Control**: Manual deployment triggers available
- **Clarity**: Each workflow has a single, clear purpose

### Workflow Relationship

```
Pull Request → CI Workflow → Tests & Validation
                    ↓
              Merge to main/develop
                    ↓
            Deploy Workflow → Build & Push Images
```

## CI Workflow (ci.yml) ✅

### Purpose

The CI workflow validates code quality and runs comprehensive tests on every push and pull request.

### Triggers
- Push to `main`, `develop`, or `feature/**` branches
- Pull requests to `main` or `develop`

### Jobs

1. **Lint** - ESLint and Prettier checks
2. **Test** - Unit tests on Node.js 18 and 20
3. **Test E2E** - End-to-end tests with Docker
4. **Security Scan** - npm audit and Snyk
5. **Docker Build Test** - Validates Docker images build
6. **CI Success** - Final check gate

### Key Features
- ✅ Multi-version Node.js testing (18, 20)
- ✅ Docker-based E2E tests
- ✅ Code coverage reporting
- ✅ Security vulnerability scanning
- ✅ Docker build validation
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

## Deploy Workflow (deploy.yml) ✅

### Purpose

The deployment workflow builds Docker images, pushes them to GitHub Container Registry, and performs security scanning.

### Triggers
- Push to `main` branch (production)
- Push to `develop` branch (staging)
- Version tags (e.g., `v1.0.0`)
- Manual dispatch via GitHub UI

### Jobs

1. **Build and Push** - Multi-arch Docker images
   - Production image (`Dockerfile`)
   - Development image (`Dockerfile.dev`)
   - Platforms: linux/amd64, linux/arm64
2. **Security Scan** - Trivy vulnerability scanning
3. **Create Release** - GitHub release for version tags
4. **Notify Deployment** - Summary and notifications

### Key Features
- ✅ Multi-architecture builds (amd64, arm64)
- ✅ Automated image tagging strategy
- ✅ Security scanning with Trivy
- ✅ GitHub Container Registry integration
- ✅ Manual deployment option
- ✅ Release creation for tags
- ✅ Deployment summaries

### Image Tagging Strategy

**Production Image:**
```
ghcr.io/[owner]/[repo]:latest          # Latest main
ghcr.io/[owner]/[repo]:develop         # Latest develop
ghcr.io/[owner]/[repo]:v1.0.0          # Version tag
ghcr.io/[owner]/[repo]:main-abc1234    # Branch + SHA
```

**Development Image:**
```
ghcr.io/[owner]/[repo]-dev:latest
ghcr.io/[owner]/[repo]-dev:develop
ghcr.io/[owner]/[repo]-dev:v1.0.0
```

### Workflow Configuration

See `.github/workflows/deploy.yml` for the complete workflow.

**Example structure**:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch: # Allows manual trigger

jobs:
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://your-api-domain.com
    
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
      
      - name: Run tests
        run: pnpm run test
        env:
          MONGODB_URI: ${{ secrets.MONGODB_URI_TEST }}
          JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}
          NODE_ENV: test
      
      - name: Build application
        run: pnpm run build
      
      - name: Deploy to Heroku
        uses: akhileshns/heroku-deploy@v3.12.12
        with:
          heroku_api_key: ${{ secrets.HEROKU_API_KEY }}
          heroku_app_name: ${{ secrets.HEROKU_APP_NAME }}
          heroku_email: ${{ secrets.HEROKU_EMAIL }}
      
      - name: Notify deployment success
        if: success()
        run: echo "Deployment successful!"
      
      - name: Notify deployment failure
        if: failure()
        run: echo "Deployment failed!"
```

### Alternative: Deploy to AWS

```yaml
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Build and push Docker image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          ECR_REPOSITORY: easygenerator-auth-api
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
```

## Security Audit Workflow (security.yml)

### Automated Security Scanning

Create `.github/workflows/security.yml`:

```yaml
name: Security Audit

on:
  schedule:
    - cron: '0 0 * * 0' # Weekly on Sunday at midnight
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  audit:
    name: Dependency Audit
    runs-on: ubuntu-latest
    
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
      
      - name: Run pnpm audit
        run: pnpm audit --audit-level moderate
        continue-on-error: true
      
      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high
```

## GitHub Secrets Configuration

### Required Secrets

Configure these secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):

#### For CI Workflow
- `SNYK_TOKEN` - Snyk security scanning (optional but recommended)
- `CODECOV_TOKEN` - Code coverage reports (optional, for private repos)

#### For Deploy Workflow
- `GITHUB_TOKEN` - Automatically provided by GitHub (for Container Registry)

**Note:** The deploy workflow uses GitHub Container Registry (GHCR), which doesn't require additional secrets. The `GITHUB_TOKEN` is automatically available.

#### Optional Notifications
- `SLACK_WEBHOOK_URL` - For Slack notifications (if enabled)

### How to Add Secrets

```bash
# Using GitHub CLI
gh secret set HEROKU_API_KEY

# Or via GitHub UI:
# 1. Go to repository Settings
# 2. Click "Secrets and variables" > "Actions"
# 3. Click "New repository secret"
# 4. Enter name and value
# 5. Click "Add secret"
```

## Environment Protection Rules

### Setup Production Environment

1. Go to `Settings > Environments`
2. Click "New environment"
3. Name it "production"
4. Configure protection rules:
   - ✅ Required reviewers (1-6 people)
   - ✅ Wait timer (optional)
   - ✅ Deployment branches (only main)

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
[![Deploy](https://github.com/username/repo/workflows/Deploy%20to%20Production/badge.svg)](https://github.com/username/repo/actions)
[![codecov](https://codecov.io/gh/username/repo/branch/main/graph/badge.svg)](https://codecov.io/gh/username/repo)
```

## Notifications

### Slack Notifications

Add to your workflow:

```yaml
      - name: Notify Slack on failure
        if: failure()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: 'CI Pipeline failed!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

GitHub automatically sends email notifications for workflow failures to:
- Committer
- Repository owner
- Configured in Settings > Notifications

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
