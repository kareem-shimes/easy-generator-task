.PHONY: help dev-up dev-down dev-logs dev-restart prod-up prod-down prod-logs prod-restart build-dev build-prod clean prune

# Colors for terminal output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
NC := \033[0m # No Color

help: ## Show this help message
	@echo "$(BLUE)Available commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'

# Development commands
dev-up: ## Start development environment
	@echo "$(BLUE)Starting development environment...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Development environment is running$(NC)"
	@echo "$(YELLOW)API: http://localhost:3000$(NC)"
	@echo "$(YELLOW)Mongo Express: http://localhost:8081 (admin/admin123)$(NC)"

dev-down: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Development environment stopped$(NC)"

dev-logs: ## View development logs
	docker-compose logs -f api

dev-restart: ## Restart development environment
	@echo "$(BLUE)Restarting development environment...$(NC)"
	docker-compose restart api
	@echo "$(GREEN)✓ Development environment restarted$(NC)"

dev-build: ## Build development images
	@echo "$(BLUE)Building development images...$(NC)"
	docker-compose build --no-cache
	@echo "$(GREEN)✓ Development images built$(NC)"

dev-shell: ## Open shell in development container
	docker-compose exec api sh

# Production commands
prod-up: ## Start production environment
	@echo "$(BLUE)Starting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml up -d
	@echo "$(GREEN)✓ Production environment is running$(NC)"
	@echo "$(YELLOW)API: http://localhost:3000$(NC)"

prod-down: ## Stop production environment
	@echo "$(BLUE)Stopping production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml down
	@echo "$(GREEN)✓ Production environment stopped$(NC)"

prod-logs: ## View production logs
	docker-compose -f docker-compose.prod.yml logs -f api

prod-restart: ## Restart production environment
	@echo "$(BLUE)Restarting production environment...$(NC)"
	docker-compose -f docker-compose.prod.yml restart api
	@echo "$(GREEN)✓ Production environment restarted$(NC)"

prod-build: ## Build production images
	@echo "$(BLUE)Building production images...$(NC)"
	docker-compose -f docker-compose.prod.yml build --no-cache
	@echo "$(GREEN)✓ Production images built$(NC)"

prod-shell: ## Open shell in production container
	docker-compose -f docker-compose.prod.yml exec api sh

# Build commands
build-dev: ## Build development Docker image
	@echo "$(BLUE)Building development image...$(NC)"
	docker build -f Dockerfile.dev -t easygenerator-auth-api:dev .
	@echo "$(GREEN)✓ Development image built$(NC)"

build-prod: ## Build production Docker image
	@echo "$(BLUE)Building production image...$(NC)"
	docker build -f Dockerfile -t easygenerator-auth-api:latest .
	@echo "$(GREEN)✓ Production image built$(NC)"

# Database commands
db-shell: ## Open MongoDB shell
	docker-compose exec mongodb mongosh -u admin -p password123

db-backup: ## Backup MongoDB database
	@echo "$(BLUE)Creating database backup...$(NC)"
	@mkdir -p backups
	docker-compose exec -T mongodb mongodump --uri="mongodb://admin:password123@localhost:27017/easygenerator-auth?authSource=admin" --out=/backups/backup-$(shell date +%Y%m%d-%H%M%S)
	@echo "$(GREEN)✓ Database backup created$(NC)"

db-restore: ## Restore MongoDB database (specify BACKUP_DIR)
	@if [ -z "$(BACKUP_DIR)" ]; then \
		echo "$(YELLOW)Usage: make db-restore BACKUP_DIR=backup-YYYYMMDD-HHMMSS$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)Restoring database from $(BACKUP_DIR)...$(NC)"
	docker-compose exec -T mongodb mongorestore --uri="mongodb://admin:password123@localhost:27017" --drop /backups/$(BACKUP_DIR)
	@echo "$(GREEN)✓ Database restored$(NC)"

# Cleanup commands
clean: ## Remove stopped containers and unused images
	@echo "$(BLUE)Cleaning up...$(NC)"
	docker-compose down -v
	docker-compose -f docker-compose.prod.yml down -v
	@echo "$(GREEN)✓ Cleanup complete$(NC)"

prune: ## Remove all unused Docker resources (use with caution)
	@echo "$(YELLOW)This will remove all unused Docker resources. Are you sure? [y/N]$(NC)" && read ans && [ $${ans:-N} = y ]
	docker system prune -af --volumes
	@echo "$(GREEN)✓ Docker system pruned$(NC)"

# Testing commands
test: ## Run tests in container
	docker-compose exec api pnpm test

test-e2e: ## Run e2e tests in container
	docker-compose exec api pnpm test:e2e

test-cov: ## Run tests with coverage
	docker-compose exec api pnpm test:cov

# Health check
health: ## Check service health
	@echo "$(BLUE)Checking service health...$(NC)"
	@curl -f http://localhost:3000/health && echo "$(GREEN)✓ API is healthy$(NC)" || echo "$(YELLOW)✗ API is not responding$(NC)"
