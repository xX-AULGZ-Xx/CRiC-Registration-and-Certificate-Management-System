#!/bin/sh
set -e

echo "🚀 [Docker Entrypoint] Checking database connection and running Prisma migrations..."

# Run database migrations
pnpm --filter api prisma migrate deploy || {
  echo "⚠️ [Docker Entrypoint] prisma migrate deploy failed or no migrations found, pushing schema..."
  pnpm --filter api prisma db push
}

# Seed database if not seeded yet
echo "🌱 [Docker Entrypoint] Running database seed..."
pnpm --filter api prisma db seed || echo "⚠️ Seed already applied or skipped."

echo "✅ [Docker Entrypoint] Database setup complete. Starting API server..."
exec node apps/api/dist/index.js
