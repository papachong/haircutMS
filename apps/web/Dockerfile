# Multi-stage build for Next.js web application
# Stage 1: Install all dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy workspace root package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for web and shared
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install pnpm
RUN npm install -g pnpm@9.15.0

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Stage 2: Build shared package
FROM node:20-alpine AS shared-builder
WORKDIR /app
RUN npm install -g pnpm@9.15.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY packages/shared ./packages/shared
COPY pnpm-workspace.yaml package.json ./

RUN pnpm --filter @haircut-ms/shared build

# Stage 3: Build Next.js application
FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm@9.15.0

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy built shared package
COPY --from=shared-builder /app/packages/shared ./packages/shared

# Copy full source for build context
COPY . .

# API proxy target: in Docker this is the server service name;
# for local dev it defaults to localhost
ARG API_PROXY_URL=http://localhost:4000
ENV API_PROXY_URL=$API_PROXY_URL

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application (output: standalone)
RUN pnpm --filter @haircut-ms/web build

# Stage 4: Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install wget for health checks
RUN apk add --no-cache wget

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone server output from Next.js build
# Next.js standalone mode outputs to apps/web/.next/standalone/
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Set correct ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

# Next.js standalone mode starts from the standalone server.js
# The server.js is at the root of the standalone output
CMD ["node", "apps/web/server.js"]
