import { test, expect, type Page } from '@playwright/test';

const PLATFORM_PHONE = '13800000000';
const PLATFORM_PASSWORD = 'admin123';

test.describe('Platform login page', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/platform/login');
    await expect(page.getByRole('heading', { name: 'HaircutMS 平台管理' })).toBeVisible();
    await expect(page.getByText('手机号')).toBeVisible();
    await expect(page.getByText('密码')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/platform/login');
    await page.getByPlaceholder('请输入手机号').fill('00000000000');
    await page.getByPlaceholder('请输入密码').fill('wrong');
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/错误|失败|Invalid/)).toBeVisible();
  });
});

test.describe('Platform authenticated flow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('login stores token and navigates to dashboard', async () => {
    await page.goto('/platform/login');
    await page.getByPlaceholder('请输入手机号').fill(PLATFORM_PHONE);
    await page.getByPlaceholder('请输入密码').fill(PLATFORM_PASSWORD);
    await page.locator('button[type="submit"]').click();

    await expect(page).toHaveURL(/\/platform\/(dashboard|overview|shops|licenses)/, { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
    const authType = await page.evaluate(() => localStorage.getItem('authType'));
    expect(authType).toBe('platform');
  });

  test('dashboard shows stat cards and quick actions', async () => {
    await page.goto('/platform/dashboard');
    await expect(page.getByRole('heading', { name: '平台仪表盘' })).toBeVisible();

    await expect(page.getByText('总店铺数')).toBeVisible();
    await expect(page.getByText('活跃店铺')).toBeVisible();
    await expect(page.getByText('总会员数')).toBeVisible();
    await expect(page.getByText('总营收')).toBeVisible();

    await expect(page.getByRole('link', { name: '平台数据总览' })).toBeVisible();
    await expect(page.getByRole('link', { name: '店铺管理', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'License 管理', exact: true })).toBeVisible();
  });

  test('sidebar navigation works', async () => {
    await page.getByRole('link', { name: '🏪 店铺管理' }).click();
    await expect(page).toHaveURL('/platform/shops');

    await page.getByRole('link', { name: '🔑 License 管理' }).click();
    await expect(page).toHaveURL('/platform/licenses');
  });

  test('logout clears session and redirects to login', async () => {
    await page.goto('/platform/dashboard');
    await page.getByRole('button', { name: '退出登录' }).click();
    await expect(page).toHaveURL('/platform/login');

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });
});

test.describe('Platform auth guard', () => {
  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/platform/dashboard');
    await expect(page).toHaveURL('/platform/login');
  });
});

test.describe('Shop staff UI', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByPlaceholder(/手机号|phone/i)).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login success', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/手机号|phone/i).fill('13900000001');
    await page.locator('input[type="password"]').fill('owner123');
    await page.getByTestId('shop-login-button').click();

    await expect(page).not.toHaveURL('/login', { timeout: 10000 });
  });
});
