import { test, expect, type Page } from '@playwright/test';

const SHOP_PHONE = '13900000001';
const SHOP_PASSWORD = 'owner123';

test.describe('Shop login page', () => {
  test('renders correctly', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'HaircutMS' })).toBeVisible();
    await expect(page.getByText('店铺登录')).toBeVisible();
    await expect(page.getByText('平台登录')).toBeVisible();
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error on wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder('请输入手机号').fill('00000000000');
    await page.locator('input[type="password"]').fill('wrong');
    await page.getByTestId('shop-login-button').click();
    await expect(page.getByText(/错误|失败|Invalid/)).toBeVisible();
  });
});

test.describe('Shop admin authenticated flow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('login and redirect to admin dashboard', async () => {
    await page.goto('/login');
    await page.getByPlaceholder('请输入手机号').fill(SHOP_PHONE);
    await page.locator('input[type="password"]').fill(SHOP_PASSWORD);
    await page.getByTestId('shop-login-button').click();

    await expect(page).toHaveURL('/admin', { timeout: 10000 });

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeTruthy();
  });

  test('admin dashboard shows heading and stat cards', async () => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    // Use exact: true to avoid matching sidebar nav text or other occurrences
    await expect(page.getByText('营收', { exact: true })).toBeVisible();
    await expect(page.getByText('客流量', { exact: true })).toBeVisible();
    await expect(page.getByText('客单价', { exact: true })).toBeVisible();
    await expect(page.getByText('新会员', { exact: true })).toBeVisible();
  });

  test('admin dashboard shows quick action links', async () => {
    await page.goto('/admin');
    await expect(page.getByRole('link', { name: '收银台' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('link', { name: '会员管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: '订单列表' })).toBeVisible();
  });

  test('members page renders', async () => {
    await page.goto('/admin/members');
    await expect(page.getByRole('heading', { name: '会员管理' })).toBeVisible({ timeout: 10000 });
    const searchInput = page.getByPlaceholder('搜索姓名/手机号/卡号');
    await expect(searchInput).toBeVisible();
    // Use getByText with exact match and first() to avoid strict mode violation from multiple matches
    const contentIndicator = page
      .getByText('会员总数', { exact: true })
      .or(page.getByText('暂无会员数据', { exact: true }))
      .or(page.getByText('加载中...', { exact: true }));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('orders page renders', async () => {
    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible({ timeout: 10000 });
    // Use getByRole for tab buttons since "全部"/"待结算" are status tab labels
    const contentIndicator = page
      .getByRole('button', { name: '全部', exact: true })
      .or(page.getByText('加载中...'))
      .or(page.getByText('暂无订单数据'));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('staff page renders', async () => {
    await page.goto('/admin/staff');
    await expect(page.getByRole('heading', { name: '员工管理' })).toBeVisible({ timeout: 10000 });
    const contentIndicator = page
      .getByText('在职员工', { exact: true })
      .or(page.getByText('加载中...'))
      .or(page.getByText('暂无员工数据'));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('POS page renders', async () => {
    await page.goto('/admin/pos');
    // POS page has headings for each panel; use getByRole to avoid strict mode
    const posIndicator = page
      .getByRole('heading', { name: '服务项目' })
      .or(page.getByRole('heading', { name: '订单明细' }))
      .or(page.getByRole('heading', { name: '会员信息' }));
    await expect(posIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('settings services page renders', async () => {
    await page.goto('/admin/settings/services');
    // Services page loads client-side; wait for the sidebar to appear
    await expect(page.getByText('服务分类')).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: /管理分类/ }).first()).toBeVisible({ timeout: 10000 });
  });

  test('settings levels page renders', async () => {
    await page.goto('/admin/settings/levels');
    const levelsIndicator = page
      .getByText('会员等级管理')
      .or(page.getByText('加载中'))
      .or(page.getByText('暂无'));
    await expect(levelsIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('settings recharge page renders', async () => {
    await page.goto('/admin/settings/recharge');
    const rechargeIndicator = page
      .getByRole('heading', { name: '充值方案管理' })
      .or(page.getByText('加载中'))
      .or(page.getByText('暂无'));
    await expect(rechargeIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation works', async () => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await page.locator('aside nav a', { hasText: '收银' }).first().click();
    await expect(page).toHaveURL('/admin/pos', { timeout: 10000 });

    await page.locator('aside nav a', { hasText: '会员' }).first().click();
    await expect(page).toHaveURL('/admin/members', { timeout: 10000 });

    await page.locator('aside nav a', { hasText: '订单' }).first().click();
    await expect(page).toHaveURL('/admin/orders', { timeout: 10000 });

    await page.locator('aside nav a', { hasText: '首页' }).first().click();
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
  });
});

test.describe('Shop auth guard', () => {
  test('unauthenticated access redirects to login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/login', { timeout: 10000 });
  });
});
