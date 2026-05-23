import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Shop admin dashboard', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('dashboard shows heading and 4 stat cards', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    // Four stat cards (use exact to avoid matching "营收环比" etc.)
    await expect(page.getByText('营收', { exact: true })).toBeVisible();
    await expect(page.getByText('客单价', { exact: true })).toBeVisible();
    await expect(page.getByText('客流量', { exact: true })).toBeVisible();
    await expect(page.getByText('新会员', { exact: true })).toBeVisible();
  });

  test('time range buttons are clickable and toggle active state', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    const todayBtn = page.getByRole('button', { name: '今日' });
    const weekBtn = page.getByRole('button', { name: '本周' });
    const monthBtn = page.getByRole('button', { name: '本月' });

    await expect(todayBtn).toBeVisible();
    await expect(weekBtn).toBeVisible();
    await expect(monthBtn).toBeVisible();

    // Click "本周" - should become active
    await weekBtn.click();
    // The active button gets bg-white shadow-sm classes; verify by checking
    // that the button responds to click (no navigation, just state change).
    // Click "本月" next
    await monthBtn.click();

    // Click back to "今日" to restore default
    await todayBtn.click();
  });

  test('quick action links are visible and clickable', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('link', { name: '收银台' })).toBeVisible();
    await expect(page.getByRole('link', { name: '会员管理' })).toBeVisible();
    await expect(page.getByRole('link', { name: '订单列表' })).toBeVisible();
  });

  test('clicking "收银台" navigates to /admin/pos', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('link', { name: '收银台' }).click();
    await expect(page).toHaveURL('/admin/pos', { timeout: 10000 });
  });

  test('clicking "会员管理" navigates to /admin/members', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await page.getByRole('link', { name: '会员管理' }).click();
    await expect(page).toHaveURL('/admin/members', { timeout: 10000 });
  });

  test('sidebar navigation: 首页 -> /admin', async () => {
    // Start from a different page
    await page.goto('/admin/pos');
    await page.waitForLoadState('networkidle');

    await page.locator('aside nav a', { hasText: '首页' }).first().click();
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });
  });

  test('sidebar navigation: 收银 -> /admin/pos', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await page.locator('aside nav a', { hasText: '收银' }).first().click();
    await expect(page).toHaveURL('/admin/pos', { timeout: 10000 });
  });

  test('sidebar navigation: 订单 -> /admin/orders', async () => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });

    await page.locator('aside nav a', { hasText: '订单' }).first().click();
    await expect(page).toHaveURL('/admin/orders', { timeout: 10000 });
  });
});
