# Multi-stage build for NestJS server application
# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for server and shared
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Stage 2: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
RUN npm install -g pnpm@9.15.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY pnpm-workspace.yaml package.json ./

RUN pnpm --filter @haircut-ms/shared build

# Stage 3: Build NestJS server
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9.15.0

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built shared package
COPY --from=shared-builder /app/packages/shared ./packages/shared

# Copy full source for build context
COPY . .

# Generate Prisma client (custom output: src/generated/prisma)
RUN pnpm --filter @haircut-ms/server prisma:generate

# Build the NestJS application
ENV NODE_ENV=production
RUN pnpm --filter @haircut-ms/server build

# Stage 4: Install production-only dependencies
FROM node:20-alpine AS prod-deps
WORKDIR /app
RUN npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile --prod

# Stage 5: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install dumb-init for proper signal handling and wget for health checks
RUN apk add --no-cache dumb-init wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production node_modules
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=prod-deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built application
COPY --from=builder /app/apps/server/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /app/apps/server/prisma ./prisma
COPY --from=builder /app/apps/server/src/generated ./src/generated

# Copy shared package (needed at runtime if imported)
COPY --from=builder /app/packages/shared ./packages/shared

# Set correct ownership
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

# Run migrations then start the server
ENTRYPOINT ["dumb-init", "--"]
CMD ["sh", "-c", "node ./node_modules/.bin/prisma migrate deploy --schema ./prisma/schema.prisma && node dist/main"]
