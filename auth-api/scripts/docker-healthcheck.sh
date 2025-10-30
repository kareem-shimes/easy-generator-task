#!/bin/sh
# Docker health check script
# This script checks if the API is responding correctly

set -e

# Try to reach the health endpoint
response=$(wget --no-verbose --tries=1 --spider --timeout=5 http://localhost:3000/health 2>&1 || true)

if echo "$response" | grep -q "200 OK"; then
  echo "Health check passed"
  exit 0
else
  echo "Health check failed"
  exit 1
fi
