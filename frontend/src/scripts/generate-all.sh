#!/bin/bash

# OpenAPI Type Generation Script
# Generates TypeScript types from all backend OpenAPI schemas
# Usage: ./generate-all.sh [base_url]
# Example: ./generate-all.sh http://localhost:5000

set -e

# Load configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh" "$1"

echo -e "${GREEN}🔄 Generating OpenAPI types from backend services...${NC}"
echo -e "${YELLOW}Using API URL: ${AUTH_API_URL}${NC}"

# Function to generate types
generate_types() {
    local url=$1
    local service_name=$2
    local output_file="$TYPES_DIR/${service_name}.ts"
    local temp_file="$TEMP_DIR/${service_name}_schema.json"
    
    echo -e "${YELLOW}Generating types for $service_name...${NC}"
    
    # Fetch and validate JSON first
    if ! curl -s "$url" > "$temp_file" || ! jq empty "$temp_file" 2>/dev/null; then
        echo -e "${RED}✗ Invalid or empty JSON response from $service_name at $url${NC}"
        return 1
    fi
    
    # Generate types
    if npx openapi-typescript "$temp_file" -o "$output_file"; then
        # Format the generated file (optional)
        if command -v pnpm &> /dev/null && pnpm exec prettier --version &> /dev/null; then
            pnpm exec prettier --write "$output_file" 2>/dev/null || echo -e "${YELLOW}  (skipping prettier formatting)${NC}"
        elif command -v npx &> /dev/null && npx prettier --version &> /dev/null 2>&1; then
            npx prettier --write "$output_file" 2>/dev/null || echo -e "${YELLOW}  (skipping prettier formatting)${NC}"
        fi
        
        echo -e "${GREEN}✓ Successfully generated types for $service_name at $output_file${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to generate types for $service_name${NC}"
        return 1
    fi
}

# Generate types for all services

# Auth Service
if check_service "$AUTH_API_URL" "Auth Service"; then
    generate_types "$AUTH_API_URL" "auth_service.types"
else
    echo -e "${YELLOW}⚠ Skipping Auth Service type generation${NC}"
    echo -e "${YELLOW}  Start the auth service with: cd backend && npm run start:auth${NC}"
fi

# Add more services here as needed
# Example:
# if check_service "$OTHER_SERVICE_URL" "Other Service"; then
#     generate_types "$OTHER_SERVICE_URL" "other_service.types"
# fi

# Generate Course Service types (when available)
# if check_service "http://localhost:3002/documentation/json" "Course Service"; then
#     generate_types "http://localhost:3002/documentation/json" "course_service.types"
# fi

# Generate User Service types (when available)
# if check_service "http://localhost:3003/documentation/json" "User Service"; then
#     generate_types "http://localhost:3003/documentation/json" "user_service.types"
# fi

# Generate index file
echo -e "${YELLOW}Creating index file...${NC}"
cat > "$TYPES_DIR/index.ts" << 'EOF'
/**
 * OpenAPI Generated Types
 * Auto-generated TypeScript types from backend OpenAPI schemas
 * 
 * @see src/scripts/generate-all.sh
 */

export type { paths as AuthPaths, components as AuthComponents } from './auth_service.types';
// export type { paths as CoursePaths, components as CourseComponents } from './course_service.types';
// export type { paths as UserPaths, components as UserComponents } from './user_service.types';
EOF

echo -e "${GREEN}✅ OpenAPI type generation complete!${NC}"
echo -e "${YELLOW}📝 Generated files:${NC}"
echo -e "   - $TYPES_DIR/auth_service.types.ts"
echo -e "   - $TYPES_DIR/index.ts"
