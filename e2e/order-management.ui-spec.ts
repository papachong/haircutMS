import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Order Management page', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
    await navigateToAdmin(page, '/orders');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('renders page title and status tabs', async () => {
    await expect(page.getByRole('heading', { name: '订单管理' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('button', { name: '全部' })).toBeVisible();
    await expect(page.getByRole('button', { name: '待结算' })).toBeVisible();
    await expect(page.getByRole('button', { name: '已结算' })).toBeVisible();
    await expect(page.getByRole('button', { name: '已退款' })).toBeVisible();
  });

  test('status tab switching works', async () => {
    const tabAll = page.getByRole('button', { name: '全部' });
    const tabPending = page.getByRole('button', { name: '待结算' });
    const tabSettled = page.getByRole('button', { name: '已结算' });
    const tabRefunded = page.getByRole('button', { name: '已退款' });

    await tabPending.click();
    await page.waitForLoadState('networkidle');
    await expect(tabPending).toHaveClass(/border-primary/);

    await tabSettled.click();
    await page.waitForLoadState('networkidle');
    await expect(tabSettled).toHaveClass(/border-primary/);

    await tabRefunded.click();
    await page.waitForLoadState('networkidle');
    await expect(tabRefunded).toHaveClass(/border-primary/);

    await tabAll.click();
    await page.waitForLoadState('networkidle');
    await expect(tabAll).toHaveClass(/border-primary/);
  });

  test('search input is present and accepts input', async () => {
    const searchInput = page.getByPlaceholder('搜索订单号/会员姓名');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    await searchInput.fill('测试订单');
    await expect(searchInput).toHaveValue('测试订单');

    await searchInput.clear();
    await expect(searchInput).toHaveValue('');
  });

  test('stats cards render with expected labels', async () => {
    await expect(page.getByText('今日订单')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('今日营业额')).toBeVisible();
    // "待结算" appears in both stats card and status tab button; use exact + first
    await expect(page.getByText('待结算', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('订单总数')).toBeVisible();
  });

  test('date filter button exists and toggles panel', async () => {
    const dateFilterButton = page.getByRole('button', { name: /日期筛选/ });
    await expect(dateFilterButton).toBeVisible({ timeout: 10000 });

    await dateFilterButton.click();
    await expect(page.getByText('开始日期')).toBeVisible();
    await expect(page.getByText('结束日期')).toBeVisible();

    await dateFilterButton.click();
    await expect(page.getByText('开始日期')).not.toBeVisible();
  });

  test('export button exists', async () => {
    const exportButton = page.locator('button', { hasText: '导出Excel' });
    await expect(exportButton).toBeVisible({ timeout: 10000 });
  });

  test('order rows display or empty state is shown', async () => {
    await page.getByRole('button', { name: '全部' }).click();
    await page.waitForLoadState('networkidle');

    const tableBody = page.locator('.bg-card.border.rounded-lg.overflow-hidden .grid.grid-cols-12');
    const emptyState = page.getByText('暂无订单数据');
    const loadingState = page.getByText('加载中...');

    const hasOrders = await tableBody.count();
    const hasEmpty = await emptyState.count();
    const hasLoading = await loadingState.count();

    expect(hasOrders > 0 || hasEmpty > 0 || hasLoading > 0).toBeTruthy();
  });

  test('clicking order row navigates to detail page', async () => {
    await page.getByRole('button', { name: '全部' }).click();
    await page.waitForLoadState('networkidle');

    const firstOrderLink = page.locator('a[href^="/admin/orders/"]').first();
    const hasOrder = (await firstOrderLink.count()) > 0;

    if (hasOrder) {
      await firstOrderLink.click();
      await expect(page).toHaveURL(/\/admin\/orders\/[^/]+$/, { timeout: 10000 });
    }
  });
});
