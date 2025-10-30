#!/bin/bash

# OpenAPI Generation Configuration

# Color codes for output
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export RED='\033[0;31m'
export NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export TYPES_DIR="$PROJECT_ROOT/src/types/openapi"
export TEMP_DIR="$PROJECT_ROOT/.tmp"

# Backend service URLs
# Use provided base URL or default to localhost:5000
BASE_URL="${1:-http://localhost:5000}"
export AUTH_API_URL="${BASE_URL}/api/docs-json"

# Create necessary directories
mkdir -p "$TYPES_DIR"
mkdir -p "$TEMP_DIR"

# Function to check if a service is running
check_service() {
    local url=$1
    local service_name=$2
    
    if curl -s -f -o /dev/null "$url"; then
        echo -e "${GREEN}✓ $service_name is running${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ $service_name is not running at $url${NC}"
        return 1
    fi
}
