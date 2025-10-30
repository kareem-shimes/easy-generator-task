#!/bin/sh
# Docker entrypoint script
# Handles initialization tasks before starting the application

set -e

echo "🚀 Starting EasyGenerator Auth API..."

# Wait for MongoDB to be ready
if [ -n "$MONGODB_URI" ]; then
  echo "⏳ Waiting for MongoDB to be ready..."
  
  # Extract host and port from MongoDB URI
  MONGO_HOST=$(echo "$MONGODB_URI" | sed -e 's|mongodb://||' -e 's|/.*||' -e 's|.*@||' -e 's|:.*||')
  MONGO_PORT=$(echo "$MONGODB_URI" | sed -e 's|mongodb://||' -e 's|/.*||' -e 's|.*@||' -e 's|.*:||' -e 's|?.*||')
  
  # Default to 27017 if port not found
  MONGO_PORT=${MONGO_PORT:-27017}
  
  # Wait for MongoDB
  timeout=30
  counter=0
  while ! nc -z "$MONGO_HOST" "$MONGO_PORT" > /dev/null 2>&1; do
    counter=$((counter + 1))
    if [ $counter -gt $timeout ]; then
      echo "❌ Timeout waiting for MongoDB"
      exit 1
    fi
    echo "  Waiting for MongoDB at $MONGO_HOST:$MONGO_PORT... ($counter/$timeout)"
    sleep 1
  done
  
  echo "✓ MongoDB is ready!"
fi

# Run any pending migrations (if you add migrations in the future)
# echo "🔄 Running database migrations..."
# pnpm run migration:run

echo "✓ Initialization complete!"
echo ""

# Execute the main command
exec "$@"
