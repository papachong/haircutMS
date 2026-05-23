import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToMobile } from './helpers/ui-helpers';

test.describe('Mobile flow', () => {
  test.describe.configure({ mode: 'serial' });
  test.use({ viewport: { width: 375, height: 812 } });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // 1. Mobile dashboard renders with metric cards
  test('mobile dashboard renders with metric cards', async () => {
    await navigateToMobile(page, '/dashboard');
    await expect(page.getByRole('heading', { name: '数据看板' })).toBeVisible({ timeout: 10000 });

    // 2x2 metric cards - use exact match to avoid strict mode (e.g., "营业额" appears in card and button)
    await expect(page.getByText('营业额', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('客流量', { exact: true })).toBeVisible();
    await expect(page.getByText('客单价', { exact: true })).toBeVisible();
    await expect(page.getByText('新增会员', { exact: true })).toBeVisible();

    // Quick action shortcuts (also exist in bottom nav, so use .first())
    await expect(page.getByRole('link', { name: '收银' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '会员' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: '订单' }).first()).toBeVisible();
  });

  // 2. Bottom navigation shows 4 tabs
  test('bottom navigation shows 4 tabs (首页/收银/会员/分析)', async () => {
    // Navigate to a page where bottom nav is visible (not /m/pos which hides it)
    await navigateToMobile(page, '/dashboard');

    const bottomNav = page.locator('nav[aria-label="Mobile navigation"]');
    await expect(bottomNav).toBeVisible({ timeout: 10000 });

    await expect(bottomNav.getByText('首页')).toBeVisible();
    await expect(bottomNav.getByText('收银')).toBeVisible();
    await expect(bottomNav.getByText('会员')).toBeVisible();
    await expect(bottomNav.getByText('分析')).toBeVisible();
  });

  // 3. Mobile POS renders with step-based layout
  test('mobile POS renders with step-based layout', async () => {
    await page.goto('/m/pos');
    await page.waitForLoadState('networkidle');

    // Step indicator labels
    await expect(page.getByText('会员').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('项目')).toBeVisible();
    await expect(page.getByText('确认')).toBeVisible();

    // Member search heading and input (step 1 is active by default)
    await expect(page.getByRole('heading', { name: '选择会员' })).toBeVisible();
    await expect(page.getByPlaceholder('搜索会员...')).toBeVisible();
  });

  // 4. Mobile members renders with search and member cards
  test('mobile members renders with search and member cards', async () => {
    await navigateToMobile(page, '/members');

    // Search input
    await expect(page.getByPlaceholder('搜索姓名/手机号/卡号')).toBeVisible({ timeout: 10000 });

    // Stats buttons
    await expect(page.getByText('会员总数')).toBeVisible();
    await expect(page.getByText('总余额')).toBeVisible();
    await expect(page.getByText('今日新增')).toBeVisible();

    // Loading state, empty state, or member content
    const contentIndicator = page
      .getByText('暂无会员数据')
      .or(page.getByText('加载中'))
      .or(page.getByText('已显示全部会员'))
      .or(page.locator('.space-y-3').first());
    await expect(contentIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  // 5. Mobile orders renders with status tabs
  test('mobile orders renders with status tabs', async () => {
    await navigateToMobile(page, '/orders');

    // Page header
    await expect(page.getByRole('heading', { name: '订单记录' })).toBeVisible({ timeout: 10000 });

    // Status tabs: 全部, 待结算, 已结算, 已退款
    await expect(page.getByRole('button', { name: '全部' })).toBeVisible();
    await expect(page.getByRole('button', { name: '待结算' })).toBeVisible();
    await expect(page.getByRole('button', { name: '已结算' })).toBeVisible();
    await expect(page.getByRole('button', { name: '已退款' })).toBeVisible();

    // Search input
    await expect(page.getByPlaceholder('搜索订单号/会员/卡号')).toBeVisible();

    // Stats summary row
    await expect(page.getByText('今日订单')).toBeVisible();
    await expect(page.getByText('今日营收')).toBeVisible();
    await expect(page.getByText('待结算').first()).toBeVisible();
  });

  // 6. Mobile analytics renders with charts or empty state
  test('mobile analytics renders with charts or empty state', async () => {
    await navigateToMobile(page, '/analytics');

    // Page header
    await expect(page.getByRole('heading', { name: '会员分析' })).toBeVisible({ timeout: 10000 });

    // Summary metric cards
    await expect(page.getByText('总会员数')).toBeVisible();
    await expect(page.getByText('活跃会员')).toBeVisible();

    // Data sections (charts or empty states)
    await expect(
      page.getByText('等级分布').or(page.getByText('暂无数据'))
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText('充值消费趋势').or(page.getByText('暂无数据'))
    ).toBeVisible();
  });
});
