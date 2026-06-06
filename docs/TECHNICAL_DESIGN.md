# 理发店管理系统 — 技术方案

## 1. 架构总览

### 1.1 架构风格选择

**单体模块化架构（Modular Monolith）+ 多租户**

产品为 SaaS 多租户系统，服务多家理发店。采用模块化单体 + 共享数据库（shopId 隔离）方案，开发简单、运维成本低，适合当前规模。

```
┌──────────────────────────────────────────────────────────┐
│                     客户端层                              │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │           响应式 Web 应用 (Next.js)                 │  │
│  │                                                     │  │
│  │  /admin/*    → 管理后台（桌面优先）                   │  │
│  │  /m/*        → 前台收银（手机优先）                   │  │
│  │  /platform/* → 平台管理后台（桌面）                   │  │
│  └──────────────────────┬─────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────┘
                          │
                          ▼
┌──────────────────────────────────────────────────────────┐
│                   Nginx / CDN                             │
│              (SSL 终止 / 静态资源 / 反向代理)               │
└──────────────────────────┬───────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────┐
│                  后端应用（单体模块化 + 多租户）              │
│                                                          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ 认证模块 │ │ 会员模块 │ │ 订单模块 │ │ 数据分析模块  │  │
│  │ Auth    │ │ Member  │ │ Order   │ │ Analytics    │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────┘  │
│  ┌─────────┐ ┌─────────┐ ┌─────────────┐               │
│  │ 服务项目 │ │ 员工模块 │ │ 平台管理模块 │               │
│  │ Service │ │ Staff   │ │ Platform    │               │
│  └─────────┘ └─────────┘ └─────────────┘               │
│  ┌─────────┐ ┌─────────┐                               │
│  │ License │ │ 店铺设置 │                               │
│  │ License │ │ Shop    │                               │
│  └─────────┘ └─────────┘                               │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              共享基础设施层                        │   │
│  │  租户隔离中间件 / License 校验 / 日志 / 缓存       │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────┬───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌────────────┐   ┌──────────┐    ┌────────────┐
   │ PostgreSQL  │   │  Redis   │    │   OSS/S3   │
   │  (主数据库)  │   │  (缓存)   │    │ (文件存储)  │
   └────────────┘   └──────────┘    └────────────┘
```

### 1.2 为什么不用微服务

| 考量 | 结论 |
|------|------|
| 单店数据量 | 会员数千级、订单数万级，单库轻松承载 |
| 并发量 | 单店前台 1-3 人同时操作，QPS 极低 |
| 运维成本 | 单体部署简单，一个人可维护 |
| 开发效率 | 模块间方法调用比 RPC 快 10 倍 |
| 未来扩展 | 模块边界清晰，需要时可拆分 |

### 1.3 为什么 B/S 而非小程序/原生 App

| 考量 | 结论 |
|------|------|
| 开发维护成本 | 一套 Next.js 代码覆盖所有端，无需维护小程序和 App 两套 |
| 发布自由度 | Web 更新即时生效，不走小程序审核流程 |
| 覆盖面 | 手机浏览器打开即用，无需安装，不限微信/支付宝/DIY 浏览器 |
| Pad 适配 | 同一套响应式代码，收银台可用 Pad + 浏览器操作 |
| PWA 支持 | 支持"添加到主屏幕"，体验接近原生 App |

---

## 2. 多租户设计

### 2.1 隔离策略：共享数据库 + shopId 隔离

所有租户共享同一个 PostgreSQL 数据库，每张业务表通过 `shop_id` 字段隔离数据。

**选择理由：**

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| 独立数据库 | 完全隔离 | 运维成本高、连接池爆炸 | 大客户、强合规 |
| 共享数据库独立 Schema | 中等隔离 | 迁移管理复杂 | 中等规模 |
| **共享数据库 + shopId** | **简单、成本低、易扩展** | **需应用层保证隔离** | **当前阶段最优** |

### 2.2 租户隔离实现

```typescript
// 多租户中间件：从 JWT 中提取 shopId，注入到请求上下文
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user as JwtPayload;
    if (user?.shopId) {
      req['shopId'] = user.shopId;
    }
    next();
  }
}

// Prisma 多租户拦截器：自动注入 shopId 查询条件
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const shopId = request.shopId;

    // Prisma 的 $extends 注入 shopId 过滤
    request.prisma = request.prisma.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query, model }) {
            if (model !== 'Shop' && model !== 'PlatformAdmin') {
              // 自动注入 where: { shop_id: shopId }
              if (!args.where) args.where = {};
              if (!args.where.shop_id) args.where.shop_id = shopId;
            }
            return query(args);
          },
        },
      },
    });

    return next.handle();
  }
}
```

### 2.3 平台管理员 vs 店铺员工

| 角色 | 数据范围 | 登录入口 |
|------|---------|---------|
| 平台管理员 | 可跨店查看所有数据 | /platform |
| 店铺老板/员工 | 仅本店铺数据 | /admin 或 /m |

平台管理员有独立的 `PlatformAdmin` 表，不混入店铺员工表。

---

## 3. 技术选型

### 3.1 确定选型

| 层次 | 技术 | 选型理由 |
|------|------|---------|
| **前端（全端统一）** | Next.js 15 (App Router) + shadcn/ui + Tailwind CSS | 一套代码，响应式适配桌面/手机/Pad |
| **后端** | NestJS (TypeScript) | 模块化架构天然契合、TypeScript 全栈统一类型 |
| **数据库** | PostgreSQL 16 | JSON 支持、事务可靠、免费开源 |
| **ORM** | Prisma | 类型安全、迁移管理方便、与 TS 生态契合 |
| **缓存** | Redis | 会话管理、热数据缓存、排行榜 |
| **文件存储** | 阿里云 OSS / AWS S3 | 会员头像、项目图片 |
| **认证** | JWT + Refresh Token | 无状态、易扩展 |
| **License** | RSA 签名 + 服务端校验 | 安全、离线容忍 |

### 3.2 开发工具链

| 工具 | 用途 |
|------|------|
| pnpm | 包管理器（monorepo） |
| Turborepo | monorepo 构建 |
| ESLint + Prettier | 代码规范 |
| Vitest | 后端单元测试 |
| Playwright | E2E 测试 |
| Docker + Docker Compose | 本地开发环境 + 部署 |
| GitHub Actions | CI/CD |

---

## 4. 项目结构

### 4.1 Monorepo 结构

```
haircutMS/
├── apps/
│   ├── web/                    # 前端应用 (Next.js) — 全端统一
│   │   ├── app/                # App Router 页面
│   │   │   ├── (auth)/         # 登录/注册
│   │   │   ├── admin/          # 管理后台（桌面优先布局）
│   │   │   │   ├── (dashboard)/
│   │   │   │   │   ├── members/      # 会员管理
│   │   │   │   │   ├── services/     # 服务项目
│   │   │   │   │   ├── orders/       # 订单管理
│   │   │   │   │   ├── staff/        # 员工管理
│   │   │   │   │   ├── analytics/    # 数据分析
│   │   │   │   │   └── settings/     # 系统设置
│   │   │   │   └── layout.tsx        # 侧边栏布局
│   │   │   ├── m/              # 移动端操作（手机优先布局）
│   │   │   │   ├── pos/        # 前台收银
│   │   │   │   ├── members/    # 会员查询/新建
│   │   │   │   ├── orders/     # 挂单/结算
│   │   │   │   └── layout.tsx  # 底部导航布局
│   │   │   ├── platform/       # 平台管理（仅平台管理员）
│   │   │   │   ├── shops/      # 店铺管理
│   │   │   │   ├── licenses/   # License 管理
│   │   │   │   ├── overview/   # 平台总览
│   │   │   │   └── layout.tsx  # 平台布局
│   │   │   └── layout.tsx
│   │   ├── components/
│   │   │   ├── ui/             # 基础 UI 组件（shadcn）
│   │   │   ├── desktop/        # 桌面端专用组件
│   │   │   └── mobile/         # 移动端专用组件
│   │   ├── hooks/
│   │   ├── lib/
│   │   └── package.json
│   │
│   └── server/                 # 后端 API (NestJS)
│       ├── src/
│       │   ├── modules/
│       │   │   ├── auth/       # 认证模块
│       │   │   ├── member/     # 会员模块
│       │   │   ├── order/      # 订单/收银模块
│       │   │   ├── service/    # 服务项目模块
│       │   │   ├── staff/      # 员工模块
│       │   │   ├── analytics/  # 数据分析模块
│       │   │   ├── license/    # License 模块
│       │   │   ├── shop/       # 店铺设置模块
│       │   │   └── platform/   # 平台管理模块
│       │   ├── common/         # 共享工具
│       │   │   ├── guards/     # 守卫（认证、License、租户隔离）
│       │   │   ├── middleware/  # 中间件（租户识别）
│       │   │   ├── interceptors/ # 拦截器（租户数据过滤）
│       │   │   └── decorators/ # 自定义装饰器
│       │   └── main.ts
│       ├── prisma/
│       │   ├── schema.prisma   # 数据模型定义
│       │   └── migrations/     # 数据库迁移
│       └── package.json
│
├── packages/
│   ├── shared/                 # 前后端共享
│   │   ├── types/              # TypeScript 类型定义
│   │   ├── constants/          # 常量/枚举
│   │   ├── validators/         # Zod 校验 schema
│   │   └── utils/              # 共享工具函数
│   └── ui/                     # 共享 UI 组件（可选）
│
├── docker/
│   ├── docker-compose.yml      # 开发环境
│   ├── Dockerfile.server       # 后端镜像
│   └── Dockerfile.web          # 前端镜像
│
├── turbo.json                  # Turborepo 配置
├── pnpm-workspace.yaml
└── package.json
```

---

## 5. 数据模型设计

### 5.1 ER 图

```
┌──────────────────┐
│  PlatformAdmin   │
│ (平台管理员)       │
└──────────────────┘

┌─────────────┐       ┌──────────────────┐
│    Shop      │ 1───∞ │    Staff         │
│  (店铺)      │       │  (员工)          │
└──────┬───────┘       └───────┬──────────┘
       │                       │
       │ 1                     │ ∞（通过 OrderItem）
       │                       ▼
       │              ┌──────────────────┐
       │              │   Order          │
       │              │  (订单)          │
       │              ├──────────────────┤
       │              │ order_items      │──┐
       │              │ payments         │──┐│
       │              └──────────────────┘  ││
       │                                     ││
       │ 1              ┌──────────────────┐ ││
       ├───────────────>│   Member         │ ││
       │                │  (会员)          │ ││
       │                ├──────────────────┤ ││
       │                │ recharge_records │ ││
       │                │ member_tags      │ ││
       │                │ coupon_instances │ ││
       │                │ pass_cards       │ ││
       │                └──────────────────┘ ││
       │                                     ││
       │ 1              ┌──────────────────┐ ││
       ├───────────────>│  MemberLevel     │ ││
       │                │ (会员等级)        │ ││
       │                └──────────────────┘ ││
       │                                     ││
       │ 1              ┌──────────────────┐ ││
       ├───────────────>│  ServiceCategory │ ││
       │                │ (服务分类)        │ ││
       │                └───────┬──────────┘ ││
       │                        │ 1          ││
       │                        ▼ ∞          ││
       │                ┌──────────────────┐ ││
       │                │  ServiceItem     │◄─┘│
       │                │ (服务项目)        │   │
       │                └──────────────────┘   │
       │                                        │
       │ 1              ┌──────────────────┐   │
       ├───────────────>│ RechargePlan     │   │
       │                │ (充值方案)        │   │
       │                └──────────────────┘   │
       │                                        │
       │ 1              ┌──────────────────┐   │
       ├───────────────>│  License         │   │
       │                │ (授权)           │   │
       │                └──────────────────┘   │
       │                                        │
       │ 1              ┌──────────────────┐   │
       └───────────────>│  AuditLog        │   │
                        │ (操作日志)        │   │
                        └──────────────────┘   │
                                                │
                                        ┌───────┴───────┐
                                        │ OrderItem      │
                                        │ (含 staff_id)  │
                                        └───────────────┘
                                        ┌───────────────┐
                                        │ Payment       │
                                        │ (支付记录)     │
                                        └───────────────┘
```

### 5.2 Prisma Schema（核心模型）

```prisma
// ==================== 平台管理员 ====================

model PlatformAdmin {
  id        String   @id @default(cuid())
  name      String   @db.VarChar(50)
  phone     String   @db.VarChar(20) @unique
  password  String   // bcrypt hash
  role      PlatformAdminRole @default(ADMIN)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("platform_admins")
}

enum PlatformAdminRole {
  SUPER_ADMIN  // 超级管理员
  ADMIN        // 管理员
  OPERATOR     // 运营
}

// ==================== 店铺 ====================

model Shop {
  id            String   @id @default(cuid())
  name          String   @db.VarChar(100)
  address       String?  @db.VarChar(200)
  phone         String?  @db.VarChar(20)
  businessHours String?  @db.VarChar(100) // JSON: { open: "09:00", close: "21:00" }
  logo          String?  // OSS URL
  status        ShopStatus @default(ACTIVE)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  staff          Staff[]
  members        Member[]
  memberLevels   MemberLevel[]
  serviceCategories ServiceCategory[]
  orders         Order[]
  rechargePlans  RechargePlan[]
  couponTemplates CouponTemplate[]
  license        License?
  auditLogs      AuditLog[]
  tags           MemberTagGroup[]

  @@map("shops")
}

enum ShopStatus {
  ACTIVE      // 正常
  SUSPENDED   // 暂停
  ARCHIVED    // 归档
}

// ==================== 认证与员工 ====================

model Staff {
  id        String   @id @default(cuid())
  shopId    String   @map("shop_id")
  name      String   @db.VarChar(50)
  phone     String   @db.VarChar(20)
  password  String   // bcrypt hash
  role      StaffRole @default(STYLIST)
  avatar    String?  // OSS URL
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  shop      Shop     @relation(fields: [shopId], references: [id])
  orderItems OrderItem[]

  @@unique([shopId, phone])
  @@map("staff")
}

enum StaffRole {
  OWNER        // 店主
  MANAGER      // 店长
  RECEPTIONIST // 前台
  STYLIST      // 发型师
  TECHNICIAN   // 技师
}

// ==================== 会员等级 ====================

model MemberLevel {
  id          String   @id @default(cuid())
  shopId      String   @map("shop_id")
  name        String   @db.VarChar(50)
  discount    Decimal  @db.Decimal(3, 2) @default(1.00) // 折扣 0.10~1.00
  sortOrder   Int      @default(0)
  remark      String?  @db.VarChar(200)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  shop        Shop     @relation(fields: [shopId], references: [id])
  members     Member[]

  @@map("member_levels")
}

// ==================== 会员 ====================

model Member {
  id              String   @id @default(cuid())
  shopId          String   @map("shop_id")
  cardNo          String   @db.VarChar(30) // 会员卡号
  name            String   @db.VarChar(50)
  phone           String   @db.VarChar(20)
  gender          Gender?
  birthday        DateTime? @db.Date
  avatar          String?
  memberLevelId   String   @map("member_level_id")
  principalBalance Int     @default(0) // 本金余额（分）
  giftBalance     Int      @default(0) // 赠送余额（分）
  totalRecharge   Int      @default(0) // 累计充值（分）
  totalConsume    Int      @default(0) // 累计消费（分）
  visitCount      Int      @default(0)
  lastVisitAt     DateTime?
  remark          String?  @db.Text
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  shop            Shop          @relation(fields: [shopId], references: [id])
  memberLevel     MemberLevel   @relation(fields: [memberLevelId], references: [id])
  tagRelations    MemberTagRelation[]
  rechargeRecords RechargeRecord[]
  passCards       PassCard[]
  couponInstances CouponInstance[]
  orders          Order[]

  @@unique([shopId, cardNo])
  @@index([shopId, phone])
  @@index([shopId, lastVisitAt])
  @@map("members")
}

enum Gender {
  MALE
  FEMALE
  OTHER
}

// ==================== 会员标签 ====================

model MemberTagGroup {
  id        String   @id @default(cuid())
  shopId    String   @map("shop_id")
  name      String   @db.VarChar(50)
  createdAt DateTime @default(now())

  shop      Shop     @relation(fields: [shopId], references: [id])
  tags      MemberTag[]

  @@map("member_tag_groups")
}

model MemberTag {
  id        String   @id @default(cuid())
  groupId   String   @map("group_id")
  name      String   @db.VarChar(30)
  createdAt DateTime @default(now())

  group     MemberTagGroup @relation(fields: [groupId], references: [id], onDelete: Cascade)
  memberRelations MemberTagRelation[]

  @@map("member_tags")
}

model MemberTagRelation {
  memberId  String   @map("member_id")
  tagId     String   @map("tag_id")
  createdAt DateTime @default(now())

  member    Member   @relation(fields: [memberId], references: [id], onDelete: Cascade)
  tag       MemberTag @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([memberId, tagId])
  @@map("member_tag_relations")
}

// ==================== 充值 ====================

model RechargePlan {
  id          String    @id @default(cuid())
  shopId      String    @map("shop_id")
  name        String    @db.VarChar(100)
  amount      Int       // 充值金额（分）
  giftAmount  Int       @default(0) // 赠送金额（分）
  type        RechargePlanType @default(DIRECT)
  isActive    Boolean   @default(true)
  startsAt    DateTime?
  endsAt      DateTime?
  sortOrder   Int       @default(0)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  shop        Shop      @relation(fields: [shopId], references: [id])
  rechargeRecords RechargeRecord[]

  @@map("recharge_plans")
}

enum RechargePlanType {
  DIRECT      // 直充
  GIFT        // 固定赠送
  PERCENTAGE  // 百分比赠送
  TIMED       // 限时活动
}

model RechargeRecord {
  id            String   @id @default(cuid())
  memberId      String   @map("member_id")
  operatorId    String   @map("operator_id")
  planId        String?  @map("plan_id")
  amount        Int      // 实际充值金额（分）
  giftAmount    Int      @default(0)
  payMethod     String   @db.VarChar(20) // 线下支付方式记录
  remark        String?  @db.VarChar(200)
  createdAt     DateTime @default(now())

  member        Member       @relation(fields: [memberId], references: [id])
  operator      Staff        @relation(fields: [operatorId], references: [id])
  plan          RechargePlan? @relation(fields: [planId], references: [id])

  @@index([memberId, createdAt])
  @@map("recharge_records")
}

// ==================== 次卡 ====================

model PassCard {
  id             String    @id @default(cuid())
  memberId       String    @map("member_id")
  name           String    @db.VarChar(100)
  totalTimes     Int
  remainingTimes Int
  price          Int       // 购买价格（分）
  expiresAt      DateTime?
  isActive       Boolean   @default(true)
  createdAt      DateTime  @default(now())

  member         Member   @relation(fields: [memberId], references: [id])
  usages         PassCardUsage[]

  @@map("pass_cards")
}

model PassCardUsage {
  id          String   @id @default(cuid())
  passCardId  String   @map("pass_card_id")
  orderItemId String?  @map("order_item_id")
  usedAt      DateTime @default(now())

  passCard    PassCard @relation(fields: [passCardId], references: [id])

  @@map("pass_card_usages")
}

// ==================== 优惠券 ====================

model CouponTemplate {
  id          String   @id @default(cuid())
  shopId      String   @map("shop_id")
  name        String   @db.VarChar(100)
  type        CouponType
  threshold   Int      @default(0) // 使用门槛（分）
  discount    Int      // 优惠金额（分）或折扣比例
  total       Int      // 发放总量
  issued      Int      @default(0)
  startsAt    DateTime
  endsAt      DateTime
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  instances   CouponInstance[]

  @@map("coupon_templates")
}

enum CouponType {
  FIXED    // 满减
  PERCENT  // 折扣
}

model CouponInstance {
  id          String   @id @default(cuid())
  templateId  String   @map("template_id")
  memberId    String   @map("member_id")
  status      CouponStatus @default(AVAILABLE)
  usedAt      DateTime?
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  template    CouponTemplate @relation(fields: [templateId], references: [id])
  member      Member   @relation(fields: [memberId], references: [id])

  @@map("coupon_instances")
}

enum CouponStatus {
  AVAILABLE
  USED
  EXPIRED
}

// ==================== 服务项目 ====================

model ServiceCategory {
  id        String   @id @default(cuid())
  shopId    String   @map("shop_id")
  name      String   @db.VarChar(50)
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)

  shop      Shop     @relation(fields: [shopId], references: [id])
  items     ServiceItem[]

  @@map("service_categories")
}

model ServiceItem {
  id          String   @id @default(cuid())
  categoryId  String   @map("category_id")
  name        String   @db.VarChar(100)
  price       Int      // 价格（分）
  duration    Int      // 标准时长（分钟）
  image       String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  category    ServiceCategory @relation(fields: [categoryId], references: [id])
  orderItems  OrderItem[]

  @@map("service_items")
}

// ==================== 订单/收银 ====================

model Order {
  id             String   @id @default(cuid())
  shopId         String   @map("shop_id")
  orderNo        String   @db.VarChar(30) @unique
  memberId       String   @map("member_id")
  status         OrderStatus @default(PENDING)
  originalAmount Int      // 原价总额（分）
  discountAmount Int      @default(0) // 折扣减免（分）
  couponAmount   Int      @default(0) // 优惠券减免（分）
  payableAmount  Int      // 应付金额（分）
  paidAmount     Int      @default(0) // 实付金额（分）
  remark         String?  @db.Text
  settledAt      DateTime?
  cancelledAt    DateTime?
  cancelReason   String?  @db.VarChar(200)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  shop           Shop     @relation(fields: [shopId], references: [id])
  member         Member   @relation(fields: [memberId], references: [id])
  items          OrderItem[]
  payments       Payment[]

  @@index([shopId, createdAt])
  @@index([memberId, createdAt])
  @@index([status])
  @@map("orders")
}

enum OrderStatus {
  PENDING    // 待结算（挂单）
  SETTLED    // 已结算
  CANCELLED  // 已撤销
  REFUNDED   // 已退款
}

model OrderItem {
  id            String   @id @default(cuid())
  orderId       String   @map("order_id")
  serviceItemId String   @map("service_item_id")
  staffId       String   @map("staff_id") // 服务员工
  serviceName   String   @db.VarChar(100) // 快照：服务项目名称
  staffName     String   @db.VarChar(50)  // 快照：员工姓名
  unitPrice     Int      // 快照：单价（分）
  quantity      Int      @default(1)
  subtotal      Int      // 小计（分）
  discountRate  Decimal  @db.Decimal(3, 2) @default(1.00) // 快照：折扣率
  finalPrice    Int      // 最终价格（分）

  order         Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  serviceItem   ServiceItem @relation(fields: [serviceItemId], references: [id])
  staff         Staff    @relation(fields: [staffId], references: [id])
  passCardUsage PassCardUsage?

  @@index([staffId]) // 员工服务统计查询
  @@map("order_items")
}

model Payment {
  id          String   @id @default(cuid())
  orderId     String   @map("order_id")
  method      PaymentMethod
  amount      Int      // 支付金额（分）
  detail      String?  @db.VarChar(100) // 线下支付方式描述
  createdAt   DateTime @default(now())

  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)

  @@map("payments")
}

enum PaymentMethod {
  BALANCE       // 余额支付（本金+赠送）
  PASS_CARD     // 次卡核销
  OFFLINE       // 线下支付（记录）
  COUPON        // 优惠券抵扣
}

// ==================== License ====================

model License {
  id           String   @id @default(cuid())
  shopId       String   @unique @map("shop_id")
  licenseKey   String   @db.VarChar(30) @unique
  plan         LicensePlan
  staffLimit   Int      @default(2)
  membersLimit Int      @default(200)
  modules      String[] // ["pos","member","service","analytics"]
  features     Json     // { "data_export": true }
  issuedAt     DateTime
  expiresAt    DateTime
  signature    String   @db.Text // RSA 签名
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  shop         Shop     @relation(fields: [shopId], references: [id])

  @@map("licenses")
}

enum LicensePlan {
  FREE
  PRO
  ENTERPRISE
}

// ==================== 操作日志 ====================

model AuditLog {
  id          String   @id @default(cuid())
  shopId      String   @map("shop_id")
  staffId     String?  @map("staff_id")
  action      String   @db.VarChar(50) // RECHARGE, ORDER_SETTLE, MEMBER_CREATE ...
  targetType  String?  @db.VarChar(30)
  targetId    String?  @db.VarChar(30)
  detail      Json?
  ip          String?  @db.VarChar(45)
  createdAt   DateTime @default(now())

  shop        Shop     @relation(fields: [shopId], references: [id])

  @@index([shopId, createdAt])
  @@index([action])
  @@map("audit_logs")
}
```

---

## 6. API 设计

### 6.1 设计规范

- RESTful 风格，资源名用复数
- 统一响应格式
- 分页用 offset + limit
- 错误码用业务前缀
- 所有店铺级接口自动注入 `shopId`（从 JWT 提取）

**统一响应格式：**

```typescript
{
  "code": 0,
  "data": { ... },
  "message": "ok"
}

{
  "code": 0,
  "data": {
    "items": [ ... ],
    "pagination": { "total": 120, "page": 1, "pageSize": 20, "hasMore": true }
  }
}

{
  "code": 40001,
  "data": null,
  "message": "会员手机号已存在"
}
```

### 6.2 API 路由一览

```
基础路径: /api/v1

认证
  POST   /auth/login                    # 员工登录（店铺级）
  POST   /auth/refresh                   # 刷新 Token
  POST   /auth/logout                    # 登出

平台认证
  POST   /platform/auth/login            # 平台管理员登录

会员
  GET    /members                        # 会员列表（支持搜索/筛选/分页）
  POST   /members                        # 创建会员
  GET    /members/:id                    # 会员详情
  PATCH  /members/:id                    # 更新会员信息
  PATCH  /members/:id/level              # 调整会员等级
  GET    /members/:id/transactions       # 会员交易流水

会员等级
  GET    /member-levels                  # 等级列表
  POST   /member-levels                  # 创建等级
  PATCH  /member-levels/:id              # 修改等级
  DELETE /member-levels/:id              # 删除等级

会员标签
  GET    /member-tags/groups             # 标签组列表
  POST   /member-tags/groups             # 创建标签组
  POST   /member-tags/groups/:id/tags    # 创建标签
  PATCH  /members/:id/tags               # 设置会员标签

充值
  GET    /recharge-plans                 # 充值方案列表
  POST   /recharge-plans                 # 创建充值方案
  PATCH  /recharge-plans/:id             # 修改充值方案
  DELETE /recharge-plans/:id             # 删除充值方案
  POST   /members/:id/recharge           # 执行充值

次卡
  POST   /members/:id/pass-cards         # 购买次卡
  GET    /members/:id/pass-cards         # 次卡列表

优惠券
  GET    /coupon-templates               # 优惠券模板列表
  POST   /coupon-templates               # 创建优惠券模板
  POST   /coupon-templates/:id/issue     # 发放优惠券
  GET    /members/:id/coupons            # 会员优惠券列表

服务项目
  GET    /service-categories             # 分类列表
  POST   /service-categories             # 创建分类
  PATCH  /service-categories/:id         # 修改分类
  DELETE /service-categories/:id         # 删除分类
  GET    /service-items                  # 项目列表
  POST   /service-items                  # 创建项目
  PATCH  /service-items/:id              # 修改项目
  PATCH  /service-items/:id/toggle       # 上下架

订单/收银
  POST   /orders                         # 创建订单（开单）
  GET    /orders                         # 订单列表
  GET    /orders/:id                     # 订单详情
  POST   /orders/:id/settle              # 结算
  POST   /orders/:id/cancel              # 撤销
  GET    /orders/pending                 # 挂单列表

员工
  GET    /staff                          # 员工列表
  POST   /staff                          # 添加员工
  PATCH  /staff/:id                      # 修改员工
  PATCH  /staff/:id/password             # 修改密码
  DELETE /staff/:id                      # 停用员工
  GET    /staff/:id/service-stats        # 员工服务统计（次数+类型分布）

数据分析
  GET    /analytics/dashboard            # 首页看板数据
  GET    /analytics/revenue              # 营收数据（支持时间范围）
  GET    /analytics/members              # 会员分析
  GET    /analytics/staff-services       # 员工服务统计
  GET    /analytics/services             # 项目热度
  GET    /analytics/trends               # 趋势数据

店铺设置
  GET    /shop                           # 店铺信息
  PATCH  /shop                           # 更新店铺信息
  GET    /shop/payment-methods           # 线下支付方式选项
  PATCH  /shop/payment-methods           # 配置线下支付方式选项

License
  GET    /license                        # 当前授权信息

平台管理（/api/v1/platform）
  GET    /platform/shops                 # 店铺列表
  POST   /platform/shops                 # 创建店铺
  GET    /platform/shops/:id             # 店铺详情
  PATCH  /platform/shops/:id             # 修改店铺
  POST   /platform/shops/:id/licenses    # 为店铺分配/更新 License
  GET    /platform/overview              # 平台总览数据
  GET    /platform/licenses              # 所有 License 列表
  GET    /platform/stats/usage           # 各店铺使用量统计
```

---

## 7. 核心业务逻辑

### 7.1 收银结算流程

```
前端提交结算请求
  │
  ▼
OrderService.settle(orderId, settleRequest)
  │
  ├── 1. 事务开始
  │
  ├── 2. 校验订单状态（必须是 PENDING）
  │
  ├── 3. 计算应付金额
  │     ├── 遍历 orderItems，按会员等级折扣计算 finalPrice
  │     ├── originalAmount = Σ(unitPrice × quantity)
  │     ├── discountAmount = originalAmount - Σ(finalPrice)
  │     ├── 如果使用优惠券，校验有效性，计算 couponAmount
  │     └── payableAmount = originalAmount - discountAmount - couponAmount
  │
  ├── 4. 处理支付
  │     ├── 余额支付：先扣 giftBalance，再扣 principalBalance
  │     ├── 次卡核销：检查有效期，扣减 remainingTimes
  │     └── 线下支付：仅记录 Payment(method=OFFLINE, detail="微信转账")
  │
  ├── 5. 更新会员统计
  │     ├── totalConsume += payableAmount
  │     ├── visitCount += 1
  │     └── lastVisitAt = now()
  │
  ├── 6. 核销优惠券（如使用）
  │
  ├── 7. 更新订单状态为 SETTLED
  │
  ├── 8. 记录操作日志
  │
  └── 9. 事务提交
```

### 7.2 余额扣减策略

```typescript
function deductBalance(member: Member, amount: number): BalanceDeduction {
  const giftDeduct = Math.min(member.giftBalance, amount);
  const remaining = amount - giftDeduct;
  const principalDeduct = Math.min(member.principalBalance, remaining);

  if (giftDeduct + principalDeduct < amount) {
    throw new InsufficientBalanceError();
  }

  return { giftDeduct, principalDeduct, totalDeduct: giftDeduct + principalDeduct };
}
```

### 7.3 员工服务统计查询

```sql
-- 员工服务次数和类型分布
SELECT
  s.name AS staff_name,
  oi.service_name,
  COUNT(*) AS service_count,
  SUM(oi.final_price) AS total_revenue
FROM order_items oi
JOIN staff s ON s.id = oi.staff_id
JOIN orders o ON o.id = oi.order_id
WHERE o.shop_id = $1
  AND o.status = 'SETTLED'
  AND o.settled_at BETWEEN $2 AND $3
GROUP BY s.name, oi.service_name
ORDER BY s.name, service_count DESC;

-- 员工服务汇总
SELECT
  s.name AS staff_name,
  COUNT(*) AS total_services,
  SUM(oi.final_price) AS total_revenue
FROM order_items oi
JOIN staff s ON s.id = oi.staff_id
JOIN orders o ON o.id = oi.order_id
WHERE o.shop_id = $1
  AND o.status = 'SETTLED'
  AND o.settled_at BETWEEN $2 AND $3
GROUP BY s.name
ORDER BY total_services DESC;
```

### 7.4 License 校验中间件

```typescript
@Injectable()
export class LicenseGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const shop = request.shop;

    const license = this.licenseService.getLicense(shop.id);

    if (!this.verifySignature(license)) {
      throw new LicenseInvalidException();
    }

    if (new Date() > license.expiresAt) {
      throw new LicenseExpiredException();
    }

    const requiredModule = this.reflector.get('module', context.getHandler());
    if (requiredModule && !license.modules.includes(requiredModule)) {
      throw new ModuleNotAuthorizedException(requiredModule);
    }

    request.license = license;
    return true;
  }
}
```

---

## 8. 认证与权限

### 8.1 认证流程

```
员工登录（手机号 + 密码 + 店铺标识）
  │
  ▼
  验证密码（bcrypt）+ 验证店铺归属
  │
  ▼
  生成 Token 对
  ├── Access Token（JWT，15min）
  │   payload: { staffId, shopId, role, type: 'shop' }
  └── Refresh Token（7天，存 Redis）
  │
  ▼
  返回给前端

平台管理员登录
  │
  ▼
  生成 Token
  │   payload: { adminId, role, type: 'platform' }
```

### 8.2 RBAC 权限矩阵

**店铺级权限：**

| 操作 | OWNER | MANAGER | RECEPTIONIST | STYLIST |
|------|-------|---------|-------------|---------|
| 查看数据面板 | 全部 | 全部 | 今日概览 | 个人服务记录 |
| 会员管理 | 全部 | 全部 | 全部 | 查看 |
| 充值操作 | 全部 | 全部 | 全部 | - |
| 调整会员等级 | 全部 | 全部 | - | - |
| 收银开单 | 全部 | 全部 | 全部 | - |
| 订单撤销 | 全部 | 全部 | 当日 | - |
| 服务项目配置 | 全部 | 查看 | 查看 | 查看 |
| 员工管理 | 全部 | - | - | - |
| 系统设置 | 全部 | - | - | - |
| License 管理 | 全部 | - | - | - |

**平台级权限：**

| 操作 | SUPER_ADMIN | ADMIN | OPERATOR |
|------|-------------|-------|----------|
| 店铺管理 | 全部 | 全部 | 查看 |
| License 分发 | 全部 | 全部 | 查看 |
| 平台数据总览 | 全部 | 全部 | 查看 |
| 平台设置 | 全部 | - | - |

---

## 9. 部署方案

### 9.1 推荐部署架构

```
┌─────────────────────────────────────────┐
│            阿里云 / 腾讯云               │
│                                         │
│  ┌───────────┐   ┌───────────────────┐  │
│  │   CDN     │   │   ECS (2C4G)      │  │
│  │ (静态资源) │   │                   │  │
│  └─────┬─────┘   │  ┌─────────────┐  │  │
│        │         │  │   Nginx     │  │  │
│        │         │  └──────┬──────┘  │  │
│        │         │         │         │  │
│        │         │  ┌──────▼──────┐  │  │
│        │         │  │  Next.js   │  │  │
│        │         │  └──────┬──────┘  │  │
│        │         │         │         │  │
│        │         │  ┌──────▼──────┐  │  │
│        │         │  │  NestJS    │  │  │
│        │         │  └──────┬──────┘  │  │
│        │         │         │         │  │
│        │         │  ┌──────▼──────┐  │  │
│        │         │  │ PostgreSQL │  │  │
│        │         │  └─────────────┘  │  │
│        │         │  ┌─────────────┐  │  │
│        │         │  │   Redis     │  │  │
│        │         │  └─────────────┘  │  │
│        │         └───────────────────┘  │
│        │         ┌───────────────────┐  │
│        └────────>│   OSS (文件存储)   │  │
│                  └───────────────────┘  │
└─────────────────────────────────────────┘
```

### 9.2 部署清单

| 资源 | 规格 | 月费用（参考） |
|------|------|--------------|
| ECS | 2C4G | ¥100-200 |
| PostgreSQL | 同机部署 | 含在 ECS 内 |
| Redis | 同机部署 | 含在 ECS 内 |
| OSS | 按量付费 | ¥10-30 |
| CDN | 按流量 | ¥10-20 |
| 域名 + SSL | - | ¥100/年 |
| **合计** | | **¥150-300/月** |

### 9.3 CI/CD 流程

```
git push to main
  │
  ▼
GitHub Actions
  ├── lint + type-check
  ├── unit tests
  ├── build (server + web)
  ├── Docker image build
  └── deploy to ECS (SSH)
       ├── docker compose pull
       ├── docker compose up -d
       └── health check
```

---

## 10. 金额处理规范

系统所有金额以**分（整数）**存储和计算，前端展示时转换为元。

```typescript
export function yuanToFen(yuan: number): number {
  return Math.round(yuan * 100);
}

export function fenToYuan(fen: number): number {
  return fen / 100;
}

export function formatPrice(fen: number): string {
  return `¥${(fen / 100).toFixed(2)}`;
}
```

---

## 11. 安全设计

| 层次 | 措施 |
|------|------|
| 传输层 | HTTPS 强制，TLS 1.2+ |
| 认证 | JWT + bcrypt，Refresh Token 轮转 |
| 授权 | RBAC 中间件，接口级权限控制 |
| 租户隔离 | API 层强制 shopId 过滤 + Prisma 拦截器自动注入 |
| 数据 | 手机号脱敏展示，密码不可逆加密 |
| 输入 | Zod schema 校验所有入参 |
| SQL | Prisma 参数化查询，杜绝注入 |
| 日志 | 敏感操作审计日志 |
| 限流 | 接口级 rate limiting（Redis 滑动窗口） |
| License | RSA 签名防篡改，离线容忍 3 天 |

---

## 12. 开发阶段规划

### Phase 1：MVP（第 1-10 周）

| 周 | 目标 |
|----|------|
| 1-2 | 项目脚手架、多租户基础架构、认证模块 |
| 3-4 | 会员管理（档案 + 等级 + 标签） |
| 5-6 | 服务项目管理 + 充值管理 |
| 7-8 | 收银开单（含服务员工记录） |
| 9 | 基础数据面板 + 员工服务统计 |
| 10 | License 框架 + 平台管理基础 + 集成测试 |

### Phase 2：完善（第 11-16 周）

| 周 | 目标 |
|----|------|
| 11-12 | 员工管理优化 + 服务统计增强 |
| 13-14 | 通知系统 + 小票打印 |
| 15-16 | 高级数据分析面板 + 平台管理完善 |

### Phase 3：增强（第 17-24 周）

| 周 | 目标 |
|----|------|
| 17-18 | 次卡 + 优惠券 |
| 19-20 | 数据导出 + 营销自动化 |
| 21-22 | 移动端体验优化 |
| 23-24 | 开放 API + 压力测试 + 上线 |
