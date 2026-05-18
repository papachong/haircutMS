# E2E 测试文档

## 概述

本目录包含理发店管理系统的端到端（E2E）测试，使用 Playwright 框架编写。

## 测试场景

### T5.1 端到端业务验证

1. **新客户到店全流程** (`t5.1-new-customer-full-flow.spec.ts`)
   - 新客户注册/创建会员
   - 会员充值
   - 创建订单
   - 结算订单（余额支付）
   - 查看订单记录
   - 验证余额变动

2. **老客户充值全流程** (`t5.1-old-customer-recharge.spec.ts`)
   - 查询会员信息
   - 执行充值操作
   - 验证余额变动
   - 查看充值记录

3. **混合支付验证** (`t5.1-mixed-payment.spec.ts`)
   - 余额 + 线下组合支付
   - 余额 + 优惠券组合支付
   - 次卡支付验证
   - 多种支付方式组合

4. **多租户隔离验证** (`t5.1-multi-tenant-isolation.spec.ts`)
   - 创建两个独立店铺
   - 店铺A创建会员、订单
   - 店铺B无法访问店铺A的数据
   - 店铺B创建自己的数据
   - 验证两个店铺数据完全隔离

5. **License 限制验证** (`t5.1-license-limits.spec.ts`)
   - 免费版功能限制验证
   - 员工数限制验证
   - 模块权限验证
   - License 过期验证

6. **平台管理全流程** (`t5.1-platform-admin.spec.ts`)
   - 平台管理员登录
   - 创建新店铺
   - 分配License
   - 查看平台概览数据
   - 查看店铺列表
   - 管理店铺状态

## 项目结构

```
tests/playwright/
├── fixtures/           # Playwright 测试夹具
│   ├── auth.fixture.ts       # 认证夹具
│   └── database.fixture.ts   # 数据库夹具
├── helpers/            # 测试辅助类
│   ├── auth.helper.ts        # 认证辅助类
│   ├── api.helper.ts         # API 辅助类
│   └── database.helper.ts    # 数据库辅助类
├── scenarios/          # 测试场景
│   ├── t5.1-new-customer-full-flow.spec.ts
│   ├── t5.1-old-customer-recharge.spec.ts
│   ├── t5.1-mixed-payment.spec.ts
│   ├── t5.1-multi-tenant-isolation.spec.ts
│   ├── t5.1-license-limits.spec.ts
│   └── t5.1-platform-admin.spec.ts
└── README.md
```

## 运行测试

### 前置条件

1. 确保服务端和前端服务已启动
2. 确保数据库已配置并迁移完成
3. 安装 Playwright 浏览器

### 安装依赖

```bash
cd apps/e2e
pnpm install
pnpm run test:install
```

### 运行所有测试

```bash
# 在项目根目录
pnpm --filter @haircut-ms/e2e test

# 或在 e2e 目录
pnpm test
```

### 运行特定测试

```bash
# 运行单个测试文件
pnpm --filter @haircut-ms/e2e test t5.1-new-customer-full-flow.spec.ts

# 运行特定测试场景
pnpm --filter @haircut-ms/e2e test -g "新客户到店全流程"
```

### 调试模式

```bash
# UI 模式（可视化测试）
pnpm --filter @haircut-ms/e2e test:ui

# 调试模式（逐步执行）
pnpm --filter @haircut-ms/e2e test:debug

# 有头模式（显示浏览器窗口）
pnpm --filter @haircut-ms/e2e test:headed
```

### 查看测试报告

```bash
pnpm --filter @haircut-ms/e2e test:report
```

## 环境变量

创建 `.env.test` 文件：

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/haircut_ms_test
```

## 测试数据管理

测试使用独立的测试数据库，确保测试数据不会影响生产环境。

### 测试前准备

每个测试套件执行前会清理测试数据，确保测试环境干净。

### 测试后清理

测试数据会在测试完成后保留，便于调试。如需自动清理，可在 `afterAll` 中添加清理逻辑。

## 编写新测试

### 1. 创建测试文件

在 `scenarios/` 目录下创建新的测试文件：

```typescript
import { test, expect } from '../../fixtures/auth.fixture';
import { ApiHelper } from '../../helpers/api.helper';

test.describe('测试场景名称', () => {
  let apiHelper: ApiHelper;

  test.beforeEach(async () => {
    apiHelper = new ApiHelper();
    // 设置测试环境
  });

  test('测试用例名称', async ({ page }) => {
    // 测试逻辑
    await page.goto('/some-page');
    await expect(page.locator('text=期望的文本')).toBeVisible();
  });
});
```

### 2. 使用辅助类

```typescript
// API 辅助类
const member = await apiHelper.createMember({
  name: '测试会员',
  phone: '13800138000',
});

// 认证辅助类
await authHelper.loginShop('13800138001', 'password123');

// 数据库辅助类
await dbHelper.clearDatabase();
```

### 3. 测试夹具

使用预定义的测试夹具：

```typescript
import { test } from '../../fixtures/auth.fixture';
// 提供了 authHelper 和自动登录功能
```

## 测试最佳实践

1. **独立性**：每个测试用例应独立运行，不依赖其他测试
2. **清理**：使用 `afterEach` 或 `afterAll` 清理测试数据
3. **断言**：使用明确的断言验证预期结果
4. **等待**：使用 `waitForSelector` 或 `waitForLoadState` 确保页面加载完成
5. **重试**：配置合理的重试次数，避免偶发性失败

## 常见问题

### 测试超时

增加超时时间：

```typescript
test('测试用例', async ({ page }) => {
  await page.goto('/some-page', { timeout: 60000 });
});
```

### 元素未找到

确保使用正确的选择器，优先使用 `data-testid` 属性：

```typescript
await page.click('[data-testid="submit-button"]');
```

### 数据库连接失败

检查数据库 URL 配置和数据库服务状态。

## CI/CD 集成

在 CI 环境中运行测试：

```yaml
- name: Run E2E Tests
  run: |
    cd apps/e2e
    pnpm test:install
    pnpm test --reporter=json
```

## 贡献指南

提交新测试时，请确保：

1. 测试文件命名清晰
2. 添加必要的注释
3. 覆盖核心业务流程
4. 测试通过后再提交
5. 更新本文档说明