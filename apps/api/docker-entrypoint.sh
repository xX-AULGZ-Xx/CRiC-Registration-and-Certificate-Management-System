#!/bin/sh
set -e

echo "🚀 [Docker Entrypoint] Starting Registration & Certificate Management API..."

# Ensure storage directories exist
mkdir -p /app/storage/certificates /app/storage/signatures /app/storage/logos

# Wait for database connection and apply Prisma schema
PRISMA_CLI="node /app/apps/api/node_modules/prisma/build/index.js"
PRISMA_SCHEMA="/app/apps/api/prisma/schema.prisma"

echo "⏳ [Docker Entrypoint] Waiting for database connection and syncing schema..."
MAX_TRIES=20
COUNT=0

while [ $COUNT -lt $MAX_TRIES ]; do
  if $PRISMA_CLI db push --schema="$PRISMA_SCHEMA" --skip-generate --accept-data-loss; then
    echo "✅ [Docker Entrypoint] Database schema pushed successfully!"
    break
  fi
  COUNT=$((COUNT + 1))
  echo "⚠️ [Docker Entrypoint] Database not ready yet (attempt $COUNT/$MAX_TRIES). Waiting 3 seconds..."
  sleep 3
done

if [ $COUNT -eq $MAX_TRIES ]; then
  echo "❌ [Docker Entrypoint] Warning: Could not push Prisma schema after $MAX_TRIES attempts."
  echo "⚠️ Proceeding to start API server so install wizard / healthcheck can report status."
fi

# Check if SEED_DATABASE is requested (default: false to allow Install Wizard /install)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 [Docker Entrypoint] SEED_DATABASE=true detected, attempting database seed..."
  if [ -f "/app/apps/api/prisma/seed.ts" ] && [ -f "/app/apps/api/node_modules/.bin/tsx" ]; then
    /app/apps/api/node_modules/.bin/tsx /app/apps/api/prisma/seed.ts || echo "⚠️ Seed skipped or failed."
  fi
fi

echo "✅ [Docker Entrypoint] Launching API server on port ${PORT:-5060}..."
exec node /app/apps/api/dist/index.js
