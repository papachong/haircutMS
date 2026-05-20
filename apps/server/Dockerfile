# Lightweight production image for NestJS server
# Requires: dist/ already built locally before docker build
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/server/package.json ./apps/server/
COPY packages/shared/package.json ./packages/shared/

RUN npm install -g pnpm@9.15.0
RUN pnpm install --frozen-lockfile --prod
RUN npm install -g prisma@6

COPY apps/server/prisma ./apps/server/prisma
RUN cd apps/server && prisma generate

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NODE_PATH=/app/apps/server/node_modules:/app/node_modules

RUN apk add --no-cache dumb-init wget
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/server/node_modules ./apps/server/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules

# Copy Prisma generated client (linux-musl) into @prisma/client
COPY --from=deps /app/apps/server/src/generated/prisma /app/apps/server/node_modules/@prisma/client/

# Copy pre-built application and shared package
COPY apps/server/dist ./dist
COPY apps/server/prisma ./prisma
COPY packages/shared ./packages/shared

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/apps/server/src/main"]
