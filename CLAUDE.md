# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant barber shop management system with:
- **Server**: NestJS backend with PostgreSQL and Prisma ORM
- **Web**: Next.js 15 frontend with App Router, Tailwind CSS, and Radix UI components
- **Architecture**: Monorepo managed with pnpm workspaces and Turborepo

## Commands

### Development
```bash
pnpm dev              # Start both server (port 4000) and web (port 3000) in watch mode
pnpm build            # Build all packages
pnpm lint             # Lint all packages
pnpm format           # Format all files with Prettier
```

### Server (apps/server)
```bash
pnpm --filter @haircut-ms/server dev
pnpm --filter @haircut-ms/server build
pnpm --filter @haircut-ms/server lint
pnpm --filter @haircut-ms/server type-check
pnpm --filter @haircut-ms/server prisma:generate  # Generate Prisma client
pnpm --filter @haircut-ms/server prisma:migrate    # Run migrations
pnpm --filter @haircut-ms/server prisma:seed       # Seed database
```

### Web (apps/web)
```bash
pnpm --filter @haircut-ms/web dev
pnpm --filter @haircut-ms/web build
pnpm --filter @haircut-ms/web lint
```

### Database
Prisma schema is at `apps/server/prisma/schema.prisma`. After schema changes:
```bash
cd apps/server && pnpm prisma:migrate
```

## Architecture

### Multi-Tenancy
The system is multi-tenant by design. All shop-scoped data is automatically filtered by `shopId`.

- **TenantMiddleware**: Injects `shopId` from JWT payload into request context
- **@CurrentShop() decorator**: Extracts `shopId` from request in controller methods
- All module services automatically include `where: { shopId }` in queries

### Server Modules (apps/server/src/modules/)

Each module follows NestJS conventions: `*.module.ts`, `*.service.ts`, `*.controller.ts`, `dto/*.dto.ts`

| Module | Purpose |
|--------|---------|
| `auth` | JWT authentication, login/refresh/logout, `JwtAuthGuard` |
| `license` | License validation, module permissions, staff limits |
| `member` | Member CRUD, levels, tags, recharge operations |
| `recharge` | Recharge plan management |
| `service` | Service categories and items |
| `staff` | Staff management with license limit checks |
| `order` | Order creation, settlement, cancellation (balance/pass card/coupon support) |
| `pass-card` | Pass card CRUD, usage tracking |
| `coupon` | Coupon templates, issuance, validation |
| `audit` | Audit logging for key operations |
| `platform/*` | Platform admin features (auth, shop management, license management, overview) |
| `dashboard` | Business analytics (revenue, member data, trends) |
| `staff-stats` | Staff performance statistics |

### Common Utilities (apps/server/src/common/)

- `decorators/`: `@CurrentShop()`, `@CurrentUser()`, `@CurrentPlatformAdmin()`
- `guards/`: `JwtAuthGuard`, `PlatformAuthGuard`, `PlatformRolesGuard`, `LicenseModuleGuard`
- `filters/`: `AllExceptionsFilter` - unified error response format
- `interceptors/`: `TransformInterceptor` - wraps responses with `{ code, message, data }`
- `middleware/`: `TenantMiddleware` - injects shopId into request
- `prisma/`: PrismaService singleton

### Frontend Structure (apps/web/app/)

- `/admin/*`: Desktop admin dashboard (dashboard, POS, members, staff, service settings)
- `/m/*`: Mobile-optimized pages (POS, members, analytics)
- `/platform/*`: Platform admin pages (login, dashboard, shop/license management)
- `lib/api/*`: API client modules
- `components/`: Reusable UI components

### Key Data Models

Multi-tenant core models (all have `shopId`):
- `Shop` - Tenant entity with License
- `Member` - Customer with balance, level, tags, pass cards, coupons
- `Staff` - Employees with roles (OWNER, MANAGER, RECEPTIONIST, STYLIST, TECHNICIAN)
- `Order` - Transactions with items and payments
- `ServiceItem` - Services with prices and durations

Payment methods: `BALANCE` (gift balance first, then principal), `PASS_CARD`, `OFFLINE`, `COUPON`

Order settlement workflow:
1. Create order with items → status: PENDING
2. Settle with payment mix → status: SETTLED, balances updated
3. Cancel (same-day only) → status: REFUNDED, balances restored

## Module Creation Pattern

When creating a new module:
1. Create directory: `apps/server/src/modules/your-module/`
2. Create: `your-module.module.ts`, `your-module.service.ts`, `your-module.controller.ts`, `dto/your-module.dto.ts`
3. Register module in `apps/server/src/app.module.ts` imports
4. Use `@CurrentShop()` decorator in controller methods to get tenant context
5. Query with `where: { shopId }` for all data access

## Worktree Development

Use git worktrees for parallel feature development:
```bash
git worktree add -b feature/your-feature .claude/worktrees/your-feature
# Work in the worktree directory
# When done: commit, push, merge to main, then remove worktree
git worktree remove .claude/worktrees/your-feature
```