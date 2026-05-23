import { test, expect, type Page } from '@playwright/test';
import { platformLogin } from './helpers/ui-helpers';

test.describe('Platform admin full UI', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await platformLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // 1. Dashboard renders with stat cards
  test('dashboard shows stat cards (总店铺数, 活跃店铺, 总会员数, 总营收)', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('总店铺数')).toBeVisible();
    await expect(page.getByText('活跃店铺')).toBeVisible();
    await expect(page.getByText('总会员数')).toBeVisible();
    await expect(page.getByText('总营收')).toBeVisible();
  });

  // 2. Quick action links visible
  test('dashboard shows quick action links', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: '平台数据总览' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: '店铺管理', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'License 管理', exact: true })).toBeVisible();
  });

  // 3. Overview page renders with data sections
  test('overview page renders with data sections', async () => {
    await page.goto('/platform/overview');
    await expect(page.getByRole('heading', { name: '平台数据总览' })).toBeVisible({ timeout: 10000 });

    // Core metric cards
    await expect(page.getByText('总店铺数')).toBeVisible();
    await expect(page.getByText('总营收')).toBeVisible();
    await expect(page.getByText('总会员数')).toBeVisible();

    // Data sections (charts or empty state)
    await expect(
      page.getByText('店铺营收排行').or(page.getByText('暂无数据'))
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText('各店铺使用量统计').or(page.getByText('暂无店铺数据'))
    ).toBeVisible();
    // Both h2 headings "新增店铺趋势 (近30天)" and "营收趋势 (近30天)" exist simultaneously
    await expect(
      page.getByRole('heading', { name: /新增店铺趋势/ }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  // 4. Shops page renders with shop list and filters
  test('shops page renders with shop list and filters', async () => {
    await page.goto('/platform/shops');
    await expect(page.getByRole('heading', { name: '店铺管理' }).first()).toBeVisible({ timeout: 15000 });

    // Stats cards
    await expect(page.getByText('总店铺数').first()).toBeVisible();

    // Search input
    await expect(page.getByPlaceholder('搜索店铺名称/电话/地址...')).toBeVisible();

    // Status filter
    await expect(page.getByRole('combobox')).toBeVisible();

    // Table or empty state
    await expect(
      page.locator('table').or(page.getByText('暂无店铺数据'))
    ).toBeVisible({ timeout: 10000 });
  });

  // 5. Create shop page renders with form fields
  test('create shop page renders with form fields', async () => {
    await page.goto('/platform/shops/create');
    // Wait for the page to fully load
    await expect(page).toHaveURL('/platform/shops/create', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '创建新店铺' })).toBeVisible({ timeout: 15000 });

    // Form fields using label associations from the actual component
    await expect(page.getByLabel('店铺名称')).toBeVisible();
    await expect(page.getByLabel('店主姓名')).toBeVisible();
    await expect(page.getByLabel('店主手机号')).toBeVisible();
    await expect(page.getByLabel('初始密码')).toBeVisible();
    await expect(page.getByLabel('确认密码')).toBeVisible();

    // Back link
    await expect(page.getByRole('button', { name: /返回店铺列表/ }).or(page.getByRole('link', { name: /返回店铺列表/ }))).toBeVisible();
  });

  // 6. Licenses page renders with license table
  test('licenses page renders with license table', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });

    // Stats cards
    await expect(page.getByText('总License')).toBeVisible();
    await expect(page.getByText('生效中').first()).toBeVisible();
    await expect(page.getByText('即将到期').first()).toBeVisible();
    await expect(page.getByText('已过期').first()).toBeVisible();
  });

  // 7. License filter buttons work
  test('license filter buttons are present and interactive', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });

    // Find the filter bar area (inside the license list card)
    const filterArea = page.locator('.border-b.border-slate-200');
    await expect(filterArea.getByRole('button', { name: '全部' })).toBeVisible({ timeout: 10000 });
    await expect(filterArea.getByRole('button', { name: '生效中' })).toBeVisible();
    await expect(filterArea.getByRole('button', { name: '即将到期' })).toBeVisible();
    await expect(filterArea.getByRole('button', { name: '已过期' })).toBeVisible();

    // Click a filter and verify it activates
    await filterArea.getByRole('button', { name: '生效中' }).click();
    await expect(filterArea.getByRole('button', { name: '生效中' })).toHaveClass(/bg-blue-600/);
  });

  // 8. Create license button exists
  test('licenses page shows create license button', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /分配License/ })).toBeVisible({ timeout: 10000 });
  });

  // 9. Admins page renders with admin list
  test('admins page renders with admin list', async () => {
    await page.goto('/platform/admins');
    await expect(page.getByRole('heading', { name: '管理员管理' })).toBeVisible({ timeout: 10000 });

    // Table with column headers or empty state
    await expect(
      page.getByRole('table').or(page.getByText('暂无管理员'))
    ).toBeVisible({ timeout: 10000 });
  });

  // 10. Create admin button opens form
  test('create admin button opens form modal', async () => {
    await page.goto('/platform/admins');
    await expect(page.getByRole('heading', { name: '管理员管理' })).toBeVisible({ timeout: 10000 });

    // Click the create button
    await page.getByRole('button', { name: /新增管理员/ }).click();

    // Verify modal opens with form
    await expect(page.getByRole('heading', { name: '新增管理员' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('姓名').first()).toBeVisible();
    await expect(page.getByText('手机号').first()).toBeVisible();
    await expect(page.getByText('角色').first()).toBeVisible();
    await expect(page.getByText('登录密码')).toBeVisible();

    // Close modal via cancel button
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '新增管理员' })).not.toBeVisible();
  });

  // 11. Sidebar navigation between all pages works
  test('sidebar navigation between all pages works', async () => {
    // Start at dashboard
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' })).toBeVisible({ timeout: 10000 });

    // Navigate to Overview
    const overviewLink = page.locator('nav a[href="/platform/overview"]');
    await expect(overviewLink).toBeVisible();
    await overviewLink.click();
    await expect(page).toHaveURL('/platform/overview', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '平台数据总览' })).toBeVisible();

    // Navigate to Shops
    const shopsLink = page.locator('nav a[href="/platform/shops"]');
    await shopsLink.click();
    await expect(page).toHaveURL('/platform/shops', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '店铺管理' }).first()).toBeVisible();

    // Navigate to Licenses
    const licensesLink = page.locator('nav a[href="/platform/licenses"]');
    await licensesLink.click();
    await expect(page).toHaveURL('/platform/licenses', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'License管理' })).toBeVisible();

    // Navigate to Admins
    const adminsLink = page.locator('nav a[href="/platform/admins"]');
    await adminsLink.click();
    await expect(page).toHaveURL('/platform/admins', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '管理员管理' })).toBeVisible();

    // Navigate back to Home (dashboard landing)
    const homeLink = page.locator('nav a[href="/platform"]');
    await homeLink.click();
    await expect(page).toHaveURL('/platform', { timeout: 10000 });
    await expect(page.getByText('平台数据看板').or(page.getByText('平台仪表盘'))).toBeVisible();
  });
});
