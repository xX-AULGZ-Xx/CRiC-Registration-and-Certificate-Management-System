# syntax=docker/dockerfile:1

# Stage 1: Base & Dependencies
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Stage 2: Dependencies
FROM base AS dependencies
WORKDIR /app

# Copy workspace configs and lockfiles
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma/

# Install dependencies including devDependencies for build
RUN pnpm install --frozen-lockfile

# Generate Prisma Client
RUN pnpm --filter api prisma:generate

# Stage 3: Builder
FROM base AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api ./apps/api

# Build TypeScript to dist
RUN pnpm --filter api build

# Stage 4: Production Runner
FROM node:20-alpine AS runner
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5060

# Install OpenSSL for Prisma engine compatibility on Alpine
RUN apk add --no-cache openssl libc6-compat

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backend

# Copy necessary files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY apps/api/docker-entrypoint.sh ./apps/api/docker-entrypoint.sh

# Ensure storage directory exists and has correct permissions
RUN mkdir -p /app/storage/certificates /app/storage/signatures /app/storage/logos && \
    chmod +x /app/apps/api/docker-entrypoint.sh && \
    chown -R backend:nodejs /app

USER backend

EXPOSE 5060

ENTRYPOINT ["/app/apps/api/docker-entrypoint.sh"]
