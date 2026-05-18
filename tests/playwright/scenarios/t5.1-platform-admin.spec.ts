/**
 * T5.1: 平台管理全流程测试
 *
 * 测试流程：
 * 1. 平台管理员登录
 * 2. 创建新店铺
 * 3. 分配License
 * 4. 查看平台概览数据
 * 5. 查看店铺列表
 * 6. 管理店铺状态
 */

import { test, expect } from 'playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { DatabaseHelper } from '../../helpers/database.helper';

test.describe('T5.1 平台管理全流程', () => {
  let dbHelper: DatabaseHelper;
  let platformApiHelper: ApiHelper;

  test.beforeAll(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.connect();

    // Clean up test data
    await dbHelper.clearDatabase();

    // Create platform admin
    await dbHelper.createPlatformAdmin({
      name: '平台管理员',
      phone: '18800008888',
      password: 'admin123',
    });

    platformApiHelper = new ApiHelper();
    await platformApiHelper.platformLogin('18800008888', 'admin123');
  });

  test.afterAll(async () => {
    await dbHelper.disconnect();
  });

  test('平台管理员登录', async ({ page }) => {
    await page.goto('/platform/login');
    await page.waitForLoadState('networkidle');

    // Fill login form
    await page.fill('[data-testid="platform-phone-input"]', '18800008888');
    await page.fill('[data-testid="platform-password-input"]', 'admin123');

    // Submit login
    await page.click('[data-testid="platform-login-button"]');

    // Verify redirect to dashboard
    await page.waitForURL('/platform/dashboard');
    await expect(page.locator('[data-testid="platform-dashboard"]')).toBeVisible({ timeout: 5000 });

    // Verify tokens stored
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeTruthy();
  });

  test('创建新店铺', async ({ page }) => {
    await page.goto('/platform/login');
    await page.fill('[data-testid="platform-phone-input"]', '18800008888');
    await page.fill('[data-testid="platform-password-input"]', 'admin123');
    await page.click('[data-testid="platform-login-button"]');

    await page.waitForURL('/platform/dashboard');

    // Navigate to shop management
    await page.click('[data-testid="platform-shops-nav"]');
    await page.waitForURL('/platform/shops');
    await expect(page.locator('[data-testid="platform-shops-page"]')).toBeVisible({ timeout: 5000 });

    // Click create shop button
    await page.click('[data-testid="create-shop-button"]');
    await page.waitForSelector('[data-testid="shop-create-modal"]', { timeout: 5000 });

    // Fill shop information
    const shopName = `测试店铺-${Date.now()}`;
    await page.fill('[data-testid="shop-name-input"]', shopName);
    await page.fill('[data-testid="shop-phone-input"]', '021-12345678');
    await page.fill('[data-testid="shop-address-input"]', '上海市浦东新区测试路1号');
    await page.fill('[data-testid="shop-hours-input"]', '09:00-21:00');

    // Submit
    await page.click('[data-testid="shop-save-button"]');

    // Verify success message
    await expect(page.locator('text=店铺创建成功')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("确定")');

    // Verify shop appears in list
    await expect(page.locator(`text=${shopName}`)).toBeVisible({ timeout: 5000 });
  });

  test('分配License给店铺', async ({ page }) => {
    // First create a shop
    const newShop = await platformApiHelper.createShop({
      name: 'License测试店铺',
      phone: '021-88888888',
      address: '上海市徐汇区测试路8号',
    });

    expect(newShop.code).toBe(0);
    expect(newShop.data).toBeTruthy();

    await page.goto('/platform/login');
    await page.fill('[data-testid="platform-phone-input"]', '18800008888');
    await page.fill('[data-testid="platform-password-input"]', 'admin123');
    await page.click('[data-testid="platform-login-button"]');

    await page.waitForURL('/platform/dashboard');

    // Navigate to shop management
    await page.goto('/platform/shops');

    // Find the created shop and click assign license button
    await page.click(`[data-testid="shop-${newShop.data.id}-assign-license"]`);
    await page.waitForSelector('[data-testid="license-assign-modal"]', { timeout: 5000 });

    // Fill license information
    await page.selectOption('[data-testid="license-plan-select"]', 'PRO');
    await page.fill('[data-testid="staff-limit-input"]', '5');
    await page.fill('[data-testid="members-limit-input"]', '100');

    // Select modules
    await page.check('[data-testid="module-member"]');
    await page.check('[data-testid="module-order"]');
    await page.check('[data-testid="module-recharge"]');
    await page.check('[data-testid="module-coupon"]');

    // Set expiry date (1 year from now)
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    await page.fill('[data-testid="license-expires-at"]', expiryDate.toISOString().split('T')[0]);

    // Submit
    await page.click('[data-testid="license-save-button"]');

    // Verify success message
    await expect(page.locator('text=License分配成功')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("确定")');

    // Verify license status in shop list
    await expect(page.locator(`[data-testid="shop-${newShop.data.id}-license-status"]`)).toBeVisible();
    await expect(page.locator('text=PRO')).toBeVisible();
  });

  test('查看平台概览数据', async ({ page }) => {
    // Create some test data first
    const shop1 = await platformApiHelper.createShop({
      name: '概览测试店铺1',
      phone: '021-11111111',
    });

    const shop2 = await platformApiHelper.createShop({
      name: '概览测试店铺2',
      phone: '021-22222222',
    });

    // Assign licenses
    await platformApiHelper.assignLicense(shop1.data.id, {
      plan: 'PRO',
      staffLimit: 5,
      modules: ['member', 'order'],
    });

    await platformApiHelper.assignLicense(shop2.data.id, {
      plan: 'FREE',
      staffLimit: 2,
      modules: ['member', 'order'],
    });

    await page.goto('/platform/login');
    await page.fill('[data-testid="platform-phone-input"]', '18800008888');
    await page.fill('[data-testid="platform-password-input"]', 'admin123');
    await page.click('[data-testid="platform-login-button"]');

    await page.waitForURL('/platform/dashboard');

    // Verify overview statistics
    await expect(page.locator('[data-testid="total-shops"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-shops"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-members"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-revenue"]')).toBeVisible();

    // Verify charts/trends are visible
    await expect(page.locator('[data-testid="new-shops-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();

    // Verify top revenue shops table
    await expect(page.locator('[data-testid="top-revenue-shops"]')).toBeVisible();
  });

  test('查看店铺列表及状态管理', async ({ page }) => {
    // Create shops with different statuses
    const activeShop = await platformApiHelper.createShop({
      name: '活跃店铺',
      phone: '021-33333333',
    });

    await platformApiHelper.assignLicense(activeShop.data.id, {
      plan: 'PRO',
      staffLimit: 5,
      modules: ['member', 'order'],
    });

    await page.goto('/platform/login');
    await page.fill('[data-testid="platform-phone-input"]', '18800008888');
    await page.fill('[data-testid="platform-password-input"]', 'admin123');
    await page.click('[data-testid="platform-login-button"]');

    await page.waitForURL('/platform/dashboard');

    // Navigate to shop management
    await page.goto('/platform/shops');

    // Verify shop list structure
    await expect(page.locator('[data-testid="shops-table"]')).toBeVisible();
    await expect(page.locator('text=店铺名称')).toBeVisible();
    await expect(page.locator('text=状态')).toBeVisible();
    await expect(page.locator('text=员工数')).toBeVisible();
    await expect(page.locator('text=会员数')).toBeVisible();
    await expect(page.locator('text=订单数')).toBeVisible();
    await expect(page.locator('text=营业额')).toBeVisible();

    // Verify status badges
    await expect(page.locator('[data-testid="shop-status-ACTIVE"]')).toBeVisible();

    // Click shop detail
    await page.click(`[data-testid="shop-${activeShop.data.id}-detail"]`);
    await page.waitForSelector('[data-testid="shop-detail-modal"]', { timeout: 5000 });

    // Verify shop detail information
    await expect(page.locator('text=店铺信息')).toBeVisible();
    await expect(page.locator('text=License信息')).toBeVisible();
    await expect(page.locator('text=数据统计')).toBeVisible();

    // Close modal
    await page.click('[data-testid="close-modal-button"]');

    // Search shop
    await page.fill('[data-testid="shop-search-input"]', '活跃店铺');
    await page.press('[data-testid="shop-search-input"]', 'Enter');
    await page.waitForTimeout(500);

    // Verify search result
    await expect(page.locator('text=活跃店铺')).toBeVisible();
  });

  test('平台API数据获取验证', async () => {
    // Get platform overview via API
    const overview = await platformApiHelper.getPlatformOverview();

    expect(overview.code).toBe(0);
    expect(overview.data).toHaveProperty('totalShops');
    expect(overview.data).toHaveProperty('activeShops');
    expect(overview.data).toHaveProperty('totalMembers');
    expect(overview.data).toHaveProperty('totalOrders');
    expect(overview.data).toHaveProperty('totalRevenue');

    // Get top revenue shops
    const topShops = await platformApiHelper.request('GET', '/overview/top-revenue?limit=10');

    expect(topShops.code).toBe(0);
    expect(Array.isArray(topShops.data)).toBeTruthy();

    // Get shop usage stats
    const shopUsage = await platformApiHelper.request('GET', '/overview/shop-usage');

    expect(shopUsage.code).toBe(0);
    expect(Array.isArray(shopUsage.data)).toBeTruthy();
  });

  test('平台权限验证', async ({ page }) => {
    // Create shop staff account
    const shop = await platformApiHelper.createShop({
      name: '权限测试店铺',
      phone: '021-44444444',
    });

    await platformApiHelper.assignLicense(shop.data.id, {
      plan: 'PRO',
      staffLimit: 5,
      modules: ['member', 'order'],
    });

    const dbHelperLocal = new DatabaseHelper();
    await dbHelperLocal.connect();

    await dbHelperLocal.createStaff(shop.data.id, {
      name: '普通店员',
      phone: '13800138400',
      password: 'password123',
      role: 'STYLIST',
    });

    await dbHelperLocal.disconnect();

    // Try to access platform admin with shop staff
    await page.goto('/platform/login');
    await page.fill('[data-testid="platform-phone-input"]', '13800138400');
    await page.fill('[data-testid="platform-password-input"]', 'password123');
    await page.click('[data-testid="platform-login-button"]');

    // Should fail or redirect to shop login
    await page.waitForTimeout(1000);
    const currentUrl = page.url();

    expect(currentUrl).toContain('/login') || expect(page.locator('text=权限不足')).toBeVisible();
  });
});