# Stage 1: Install dependencies and generate Prisma client
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm@9.15.0
RUN pnpm install --frozen-lockfile

# Generate Prisma client for Linux
RUN npm install -g prisma@6
COPY apps/server/prisma ./apps/server/prisma
RUN cd apps/server && prisma generate

# Stage 2: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/server/node_modules:/app/node_modules

RUN apk add --no-cache dumb-init wget
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy all node_modules (includes Prisma generated client with Linux binary)
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy pre-built application
COPY apps/server/dist ./dist
COPY apps/server/prisma ./prisma
COPY packages/shared ./packages/shared

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main"]
