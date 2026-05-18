# Multi-stage build for NestJS server application
# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Install dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
RUN pnpm --filter @haircut-ms/shared build

# Stage 3: Build NestJS app
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=shared-builder /app/packages/shared ./packages/shared
COPY . .

# Copy Prisma schema
COPY apps/server/prisma ./apps/server/prisma

# Generate Prisma client
RUN pnpm --filter @haircut-ms/server prisma:generate

# Build the application
ENV NODE_ENV=production
RUN pnpm --filter @haircut-ms/server build

# Stage 4: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling and wget for health checks
RUN apk add --no-cache dumb-init wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/packages/shared ./packages/shared

# Set correct permissions
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

# Run migrations and start the app
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]