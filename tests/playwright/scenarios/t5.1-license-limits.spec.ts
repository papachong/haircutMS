/**
 * T5.1: License 限制验证测试
 *
 * 测试流程：
 * 1. 免费版功能限制验证
 * 2. 员工数限制验证
 * 3. 模块权限验证
 * 4. License 过期验证
 */

import { test, expect } from 'playwright/test';
import { ApiHelper } from '../../helpers/api.helper';
import { DatabaseHelper } from '../../helpers/database.helper';

test.describe('T5.1 License 限制验证', () => {
  let dbHelper: DatabaseHelper;
  let apiHelper: ApiHelper;
  let freeShop: any;
  let proShop: any;
  let freeStaff: any;

  test.beforeAll(async () => {
    dbHelper = new DatabaseHelper();
    await dbHelper.connect();

    // Clean up test data
    await dbHelper.clearDatabase();

    // Create platform admin
    await dbHelper.createPlatformAdmin({
      name: '测试管理员',
      phone: '18800008888',
      password: 'admin123',
    });

    // Create FREE tier shop
    freeShop = await dbHelper.createShop({
      name: '免费版店铺',
      phone: '021-11111111',
      address: '上海市浦东新区测试路1号',
    });

    // Create PRO tier shop for comparison
    proShop = await dbHelper.createShop({
      name: '专业版店铺',
      phone: '021-22222222',
      address: '上海市黄浦区测试路2号',
    });

    // Create FREE license with limited features
    await dbHelper.createLicense(freeShop.id, {
      plan: 'FREE',
      staffLimit: 2,
      membersLimit: 50,
      modules: ['member', 'order'],
    });

    // Create PRO license with full features
    await dbHelper.createLicense(proShop.id, {
      plan: 'PRO',
      staffLimit: 10,
      membersLimit: 200,
      modules: ['member', 'order', 'recharge', 'pass-card', 'coupon', 'staff-stats'],
    });

    // Create default member levels
    const freeMemberLevel = await dbHelper.createDefaultMemberLevel(freeShop.id);
    const proMemberLevel = await dbHelper.createDefaultMemberLevel(proShop.id);

    // Create staff for FREE shop (will hit limit)
    freeStaff = await dbHelper.createStaff(freeShop.id, {
      name: '店员1',
      phone: '13800138100',
      password: 'password123',
      role: 'MANAGER',
    });

    await dbHelper.createStaff(freeShop.id, {
      name: '店员2',
      phone: '13800138101',
      password: 'password123',
      role: 'STYLIST',
    });
  });

  test.beforeEach(async () => {
    apiHelper = new ApiHelper();
    await apiHelper.shopLogin('13800138100', 'password123');
  });

  test.afterAll(async () => {
    await dbHelper.disconnect();
  });

  test('免费版员工数限制验证', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138100');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Navigate to staff management
    await page.goto('/admin/staff');
    await page.waitForLoadState('networkidle');

    // Check staff count display
    const staffCountText = await page.locator('[data-testid="staff-count"]').textContent();
    expect(staffCountText).toContain('2');

    // Try to create third staff (should fail or show limit warning)
    await page.click('[data-testid="create-staff-button"]');
    await page.waitForSelector('[data-testid="staff-create-modal"]', { timeout: 5000 });

    await page.fill('[data-testid="staff-name-input"]', '店员3');
    await page.fill('[data-testid="staff-phone-input"]', '13800138102');
    await page.fill('[data-testid="staff-password-input"]', 'password123');

    await page.click('[data-testid="staff-save-button"]');

    // Should show license limit error
    await expect(page.locator('text=员工数已达上限')).toBeVisible({ timeout: 5000 });

    // Verify staff count didn't increase
    const finalStaffCount = await dbHelper.getStaffCount(freeShop.id);
    expect(finalStaffCount).toBe(2);
  });

  test('免费版功能模块限制验证', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138100');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Try to access recharge module (not available in FREE)
    await page.goto('/admin/recharge-plans');

    // Should redirect or show not authorized
    await page.waitForTimeout(1000);
    const currentUrl = page.url();
    expect(currentUrl).toContain('unauthorized') || expect(page.locator('text=功能不可用')).toBeVisible();

    // Try to access coupon module (not available in FREE)
    await page.goto('/admin/coupons');

    await page.waitForTimeout(1000);
    expect(page.locator('text=功能不可用')).toBeVisible();

    // Try to access staff-stats module (not available in FREE)
    await page.goto('/admin/staff-stats');

    await page.waitForTimeout(1000);
    expect(page.locator('text=功能不可用')).toBeVisible();
  });

  test('API级别的License限制验证', async () => {
    // Try to create recharge plan (should fail for FREE)
    const rechargePlan = await apiHelper.createRechargePlan({
      name: '测试充值方案',
      amount: 500,
      giftAmount: 50,
      type: 'GIFT',
    });

    expect(rechargePlan.code).not.toBe(0);
    expect(rechargePlan.message).toContain('license') || expect(rechargePlan.message).toContain('module');

    // Try to create coupon template (should fail for FREE)
    const couponTemplate = await apiHelper.createCouponTemplate({
      name: '测试优惠券',
      type: 'FIXED',
      threshold: 0,
      discount: 50,
      total: 10,
      startsAt: new Date().toISOString(),
      endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    expect(couponTemplate.code).not.toBe(0);
    expect(couponTemplate.message).toContain('license') || expect(couponTemplate.message).toContain('module');
  });

  test('License信息正确显示', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138100');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Navigate to settings/license page
    await page.goto('/admin/settings/license');
    await page.waitForLoadState('networkidle');

    // Verify license plan display
    await expect(page.locator('text=免费版')).toBeVisible();

    // Verify staff limit display
    await expect(page.locator('text=2人')).toBeVisible();

    // Verify member limit display
    await expect(page.locator('text=50人')).toBeVisible();

    // Verify enabled modules
    await expect(page.locator('text=会员管理')).toBeVisible();
    await expect(page.locator('text=订单管理')).toBeVisible();

    // Verify disabled modules
    await expect(page.locator('text=充值管理')).not.toBeVisible();
    await expect(page.locator('text=优惠券')).not.toBeVisible();
  });

  test('专业版功能模块可用', async ({ page }) => {
    // Login to PRO shop
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138200');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    // First create a staff for PRO shop
    const dbHelperLocal = new DatabaseHelper();
    await dbHelperLocal.connect();

    await dbHelperLocal.createStaff(proShop.id, {
      name: '专业版店员',
      phone: '13800138200',
      password: 'password123',
      role: 'MANAGER',
    });

    await dbHelperLocal.disconnect();

    await page.fill('input[type="tel"]', '13800138200');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Access recharge module (should be available)
    await page.goto('/admin/recharge-plans');
    await expect(page.locator('[data-testid="recharge-plans-page"]')).toBeVisible({ timeout: 5000 });

    // Access coupon module (should be available)
    await page.goto('/admin/coupons');
    await expect(page.locator('[data-testid="coupons-page"]')).toBeVisible({ timeout: 5000 });

    // Access staff-stats module (should be available)
    await page.goto('/admin/staff-stats');
    await expect(page.locator('[data-testid="staff-stats-page"]')).toBeVisible({ timeout: 5000 });
  });

  test('License过期验证', async () => {
    // Create shop with expired license
    const expiredShop = await dbHelper.createShop({
      name: '过期店铺',
      phone: '021-33333333',
      address: '上海市静安区测试路3号',
    });

    // Create expired license
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    await dbHelper.createLicense(expiredShop.id, {
      plan: 'PRO',
      staffLimit: 10,
      modules: ['member', 'order', 'recharge'],
    });

    // Manually set expiresAt to past date
    await dbHelper.prisma.license.update({
      where: { shopId: expiredShop.id },
      data: { expiresAt: expiredDate },
    });

    // Create staff for expired shop
    await dbHelper.createStaff(expiredShop.id, {
      name: '过期店员',
      phone: '13800138300',
      password: 'password123',
      role: 'MANAGER',
    });

    const expiredApiHelper = new ApiHelper();
    await expiredApiHelper.shopLogin('13800138300', 'password123');

    // Try to access any protected resource
    const result = await expiredApiHelper.getMemberLevels();

    // Should fail with license expired error
    expect(result.code).not.toBe(0);
    expect(result.message).toContain('过期') || expect(result.message).toContain('expired');
  });

  test('员工数接近上限提示', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="tel"]', '13800138100');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('/admin/dashboard');

    // Navigate to staff page
    await page.goto('/admin/staff');
    await page.waitForLoadState('networkidle');

    // Should show warning when staff count is close to limit
    await expect(page.locator('[data-testid="staff-limit-warning"]')).toBeVisible();
    await expect(page.locator('text=员工数已达上限')).toBeVisible();
  });
});