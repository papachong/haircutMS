import { test, expect, type Page } from '@playwright/test';

const PLATFORM_PHONE = '13800000000';
const PLATFORM_PASSWORD = 'admin123';

test.describe('Platform management UI', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/platform/login');
    await page.getByPlaceholder('请输入手机号').fill(PLATFORM_PHONE);
    await page.getByPlaceholder('请输入密码').fill(PLATFORM_PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/platform\/(dashboard|overview|shops|licenses)/, { timeout: 10000 });
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('dashboard stat cards render', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('总店铺数')).toBeVisible();
    await expect(page.getByText('活跃店铺')).toBeVisible();
    await expect(page.getByText('总会员数')).toBeVisible();
    await expect(page.getByText('总营收')).toBeVisible();
  });

  test('platform overview page renders', async () => {
    await page.goto('/platform/overview');
    await expect(page.getByRole('heading', { name: '平台数据总览' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('总店铺数')).toBeVisible();
    await expect(page.getByText('总营收')).toBeVisible();
    await expect(page.getByText('总会员数')).toBeVisible();
  });

  test('overview shows data sections', async () => {
    await page.goto('/platform/overview');
    await expect(page.getByRole('heading', { name: '平台数据总览' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('店铺营收排行').or(page.getByText('暂无数据'))).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('各店铺使用量统计').or(page.getByText('暂无店铺数据'))).toBeVisible();
    // Both h2 headings "新增店铺趋势 (近30天)" and "营收趋势 (近30天)" exist simultaneously
    await expect(
      page.getByRole('heading', { name: /新增店铺趋势/ }).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('shops page renders', async () => {
    await page.goto('/platform/shops');
    await expect(page.getByRole('heading', { name: '店铺管理' }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('总店铺数').first()).toBeVisible();
  });

  test('shops page shows create button', async () => {
    await page.goto('/platform/shops');
    await expect(page.getByRole('heading', { name: '店铺管理' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: /创建店铺/ })).toBeVisible({ timeout: 10000 });
  });

  test('create shop page renders', async () => {
    await page.goto('/platform/shops/create');
    await expect(page).toHaveURL('/platform/shops/create', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '创建新店铺' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByLabel('店铺名称')).toBeVisible();
    await expect(page.getByLabel('店主姓名')).toBeVisible();
    await expect(page.getByLabel('店主手机号')).toBeVisible();
    await expect(page.getByLabel('初始密码')).toBeVisible();
    await expect(page.getByLabel('确认密码')).toBeVisible();
    await expect(page.getByRole('button', { name: /返回店铺列表/ }).or(page.getByRole('link', { name: /返回店铺列表/ }))).toBeVisible();
  });

  test('licenses page renders', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('总License')).toBeVisible();
    await expect(page.getByText('生效中').first()).toBeVisible();
    await expect(page.getByText('即将到期').first()).toBeVisible();
    await expect(page.getByText('已过期').first()).toBeVisible();
  });

  test('licenses page shows filter buttons', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });
    const filterBar = page.locator('.divide-y').first().locator('..');
    await expect(filterBar.getByRole('button', { name: '全部' })).toBeVisible({ timeout: 10000 });
    await expect(filterBar.getByRole('button', { name: '生效中' })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: '即将到期' })).toBeVisible();
    await expect(filterBar.getByRole('button', { name: '已过期' })).toBeVisible();
  });

  test('licenses page shows create button', async () => {
    await page.goto('/platform/licenses');
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /分配License/ })).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation to shops', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' }).first()).toBeVisible({ timeout: 10000 });
    const shopsLink = page.locator('nav a[href="/platform/shops"]');
    await expect(shopsLink).toBeVisible();
    await shopsLink.click();
    await expect(page).toHaveURL('/platform/shops', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '店铺管理' }).first()).toBeVisible();
  });

  test('sidebar navigation to licenses', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' }).first()).toBeVisible({ timeout: 10000 });
    const licensesLink = page.locator('nav a[href="/platform/licenses"]');
    await expect(licensesLink).toBeVisible();
    await licensesLink.click();
    await expect(page).toHaveURL('/platform/licenses', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: 'License管理' }).first()).toBeVisible();
  });
});
