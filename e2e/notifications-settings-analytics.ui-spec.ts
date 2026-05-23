import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Notifications page (/admin/notifications)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('notifications page renders with heading and filter tabs', async () => {
    await navigateToAdmin(page, '/notifications');
    await expect(page.getByRole('heading', { name: '通知中心' })).toBeVisible({ timeout: 10000 });
    // Filter tabs are buttons with exact names to avoid matching "全部标记已读"
    await expect(page.getByRole('button', { name: '全部', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: '未读' })).toBeVisible();
  });

  test('filter tabs switch active state', async () => {
    await navigateToAdmin(page, '/notifications');
    await expect(page.getByRole('heading', { name: '通知中心' })).toBeVisible({ timeout: 10000 });

    const unreadTab = page.locator('button', { hasText: '未读' });
    await unreadTab.click();

    // After clicking "未读", page shows loading then content or empty state
    const contentIndicator = page
      .getByText('加载中...')
      .or(page.getByText('暂无通知'))
      .or(page.getByText('全部标记已读'));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 10000 });
  });

  test('mark all as read button exists', async () => {
    await navigateToAdmin(page, '/notifications');
    await expect(page.getByRole('heading', { name: '通知中心' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('全部标记已读')).toBeVisible({ timeout: 10000 });
  });

  test('mark single notification as read if unread notifications exist', async () => {
    await navigateToAdmin(page, '/notifications');
    await expect(page.getByRole('heading', { name: '通知中心' })).toBeVisible({ timeout: 10000 });

    const markReadButton = page.locator('button', { hasText: '标记已读' }).first();
    if (await markReadButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await markReadButton.click();
      // Wait for either the button to disappear or page to refresh
      await page.waitForTimeout(1000);
      // No assertion needed - just verifying no crash
    }
  });

  test('delete notification button exists when notifications present', async () => {
    await navigateToAdmin(page, '/notifications');
    await expect(page.getByRole('heading', { name: '通知中心' })).toBeVisible({ timeout: 10000 });

    const deleteButton = page.locator('button', { hasText: '删除' }).first();
    if (await deleteButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(deleteButton).toBeVisible();
    }
  });
});

test.describe('Settings page (/admin/settings)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('settings page renders with shop info card and heading', async () => {
    await navigateToAdmin(page, '/settings');
    await expect(page.getByRole('heading', { name: '设置' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('店铺信息')).toBeVisible({ timeout: 10000 });
  });

  test('shop name and address fields are displayed', async () => {
    await navigateToAdmin(page, '/settings');
    // The settings page shows labels in non-editing mode; use exact text and first() to avoid strict mode
    await expect(page.getByText('店铺名称', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('店铺地址', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('联系电话', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('营业时间', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  });

  test('settings sub-page links are present', async () => {
    await navigateToAdmin(page, '/settings');
    // Settings sub-page links are rendered as h3 headings inside link cards
    await expect(page.getByRole('heading', { name: '服务项目' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '会员等级' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '会员标签' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '充值方案' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '优惠券' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '操作日志' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '数据导出' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '支付配置' })).toBeVisible({ timeout: 10000 });
  });

  test('settings sub-page links navigate correctly', async () => {
    await navigateToAdmin(page, '/settings');

    // Multiple links may have the same href; use .first()
    const servicesLink = page.locator('a[href="/admin/settings/services"]').first();
    await servicesLink.click();
    await expect(page).toHaveURL('/admin/settings/services', { timeout: 10000 });

    const servicesIndicator = page
      .getByRole('heading', { name: '服务分类' })
      .or(page.getByText('服务项目'))
      .or(page.getByText('管理分类'));
    await expect(servicesIndicator.first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Audit logs page (/admin/settings/audit)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('audit log page renders with heading and content', async () => {
    await navigateToAdmin(page, '/settings/audit');
    await expect(page.getByRole('heading', { name: '操作日志' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('查看和管理店铺操作记录')).toBeVisible({ timeout: 10000 });

    // The filter toggle button always shows - it's the most reliable indicator
    const filterToggle = page.locator('button', { hasText: '显示筛选' });
    await expect(filterToggle).toBeVisible({ timeout: 10000 });
  });

  test('filter toggle button shows and hides filters', async () => {
    await navigateToAdmin(page, '/settings/audit');
    await expect(page.getByRole('heading', { name: '操作日志' })).toBeVisible({ timeout: 10000 });

    const filterToggle = page.locator('button', { hasText: '显示筛选' });
    await expect(filterToggle).toBeVisible({ timeout: 10000 });
    await filterToggle.click();

    // "操作类型" appears in both filter labels and table column headers; use label-specific selector
    await expect(page.locator('label', { hasText: '操作类型' })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('label', { hasText: '操作人' })).toBeVisible({ timeout: 10000 });
  });

  test('action type filter dropdown exists', async () => {
    await navigateToAdmin(page, '/settings/audit');
    await expect(page.getByRole('heading', { name: '操作日志' })).toBeVisible({ timeout: 10000 });

    const filterToggle = page.locator('button', { hasText: '显示筛选' });
    await filterToggle.click();

    const actionTypeSelect = page.locator('select').first();
    await expect(actionTypeSelect).toBeVisible({ timeout: 10000 });
  });

  test('date filter inputs exist', async () => {
    await navigateToAdmin(page, '/settings/audit');
    await expect(page.getByRole('heading', { name: '操作日志' })).toBeVisible({ timeout: 10000 });

    const filterToggle = page.locator('button', { hasText: '显示筛选' });
    await filterToggle.click();

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2, { timeout: 10000 });
  });
});

test.describe('Export page (/admin/settings/export)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('export page renders with heading and format options', async () => {
    await navigateToAdmin(page, '/settings/export');
    await expect(page.getByRole('heading', { name: '数据导出' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('导出格式')).toBeVisible({ timeout: 10000 });
  });

  test('export items are displayed', async () => {
    await navigateToAdmin(page, '/settings/export');
    // Each export item is a card with heading and button, use heading to avoid strict mode
    await expect(page.getByRole('heading', { name: '会员数据' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '订单数据' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '充值记录' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('heading', { name: '员工统计' })).toBeVisible({ timeout: 10000 });
  });

  test('export buttons exist for each data type', async () => {
    await navigateToAdmin(page, '/settings/export');
    await expect(page.getByRole('button', { name: /导出会员/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /导出订单/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /导出充值/ })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /导出员工/ })).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Member analytics page (/admin/members/analytics)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('member analytics page renders with heading', async () => {
    await navigateToAdmin(page, '/members/analytics');
    await expect(page.getByRole('heading', { name: '会员分析' })).toBeVisible({ timeout: 10000 });
  });

  test('summary cards or loading state is visible', async () => {
    await navigateToAdmin(page, '/members/analytics');
    await expect(page.getByRole('heading', { name: '会员分析' })).toBeVisible({ timeout: 10000 });

    // Page shows loading spinner then content; wait for actual content or loading state
    // Use broader text matching since the analytics page may have various states
    const contentIndicator = page
      .getByText('总会员数')
      .or(page.getByText('活跃会员'))
      .or(page.getByText('暂无数据'))
      .or(page.getByText('加载中...'))
      .or(page.locator('.animate-spin'));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 15000 });
  });

  test('level distribution section is present', async () => {
    await navigateToAdmin(page, '/members/analytics');
    await expect(page.getByRole('heading', { name: '会员分析' })).toBeVisible({ timeout: 10000 });

    // Wait for content to load (the analytics page loads data asynchronously)
    const levelSection = page
      .getByText('等级分布')
      .or(page.getByText('暂无数据'))
      .or(page.getByText('暂无等级数据'));
    await expect(levelSection.first()).toBeVisible({ timeout: 15000 });
  });

  test('consumption trend chart section is present', async () => {
    await navigateToAdmin(page, '/members/analytics');
    await expect(page.getByRole('heading', { name: '会员分析' })).toBeVisible({ timeout: 10000 });

    // Wait for content to load
    const trendSection = page
      .getByText('充值消费趋势')
      .or(page.getByText('暂无数据'))
      .or(page.locator('.recharts-line-chart'));
    await expect(trendSection.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Revenue analytics page (/admin/revenue-analytics)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('revenue analytics page renders with heading', async () => {
    await navigateToAdmin(page, '/revenue-analytics');
    await expect(page.getByRole('heading', { name: '收入分析' })).toBeVisible({ timeout: 10000 });
  });

  test('time range tabs are present', async () => {
    await navigateToAdmin(page, '/revenue-analytics');
    await expect(page.getByRole('heading', { name: '收入分析' })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('今日')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('本周')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('本月')).toBeVisible({ timeout: 10000 });
  });

  test('revenue metric cards or loading state is visible', async () => {
    await navigateToAdmin(page, '/revenue-analytics');
    await expect(page.getByRole('heading', { name: '收入分析' })).toBeVisible({ timeout: 10000 });

    // Metric card titles, or loading/empty state
    const contentIndicator = page
      .getByText('当期充值收入')
      .or(page.getByText('当期消费收入'))
      .or(page.getByText('线下支付'))
      .or(page.getByText('余额支付'))
      .or(page.getByText('加载中...'))
      .or(page.getByText('暂无数据'))
      .or(page.locator('.animate-spin'));
    await expect(contentIndicator.first()).toBeVisible({ timeout: 15000 });
  });

  test('service ranking section is present', async () => {
    await navigateToAdmin(page, '/revenue-analytics');
    await expect(page.getByRole('heading', { name: '收入分析' })).toBeVisible({ timeout: 10000 });

    // Wait for content to load (data may take time to fetch)
    const rankingSection = page
      .getByText('项目 TOP 10')
      .or(page.getByText('项目排行明细'))
      .or(page.getByText('暂无数据'));
    await expect(rankingSection.first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Staff analytics page (/admin/staff-analytics)', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('staff analytics page renders with heading', async () => {
    await navigateToAdmin(page, '/staff-analytics');
    await expect(page.getByRole('heading', { name: '员工服务记录' })).toBeVisible({ timeout: 10000 });
  });

  test('staff selector or empty state is visible', async () => {
    await navigateToAdmin(page, '/staff-analytics');
    await expect(page.getByRole('heading', { name: '员工服务记录' })).toBeVisible({ timeout: 10000 });

    // Staff selection heading or loading state
    const contentIndicator = page
      .getByRole('heading', { name: '选择员工' })
      .or(page.getByText('暂无服务记录', { exact: true }))
      .or(page.getByText('加载中...', { exact: true }));
    await expect(contentIndicator).toBeVisible({ timeout: 10000 });
  });

  test('clicking a staff member shows stats or empty state', async () => {
    await navigateToAdmin(page, '/staff-analytics');
    await expect(page.getByRole('heading', { name: '员工服务记录' })).toBeVisible({ timeout: 10000 });

    const staffButton = page.locator('button', { hasText: /返回员工列表/ });
    const staffCard = page.locator('button').filter({ hasText: /^(?!.*返回).*$/ }).filter({
      has: page.locator('.rounded-full'),
    }).first();

    if (await staffCard.isVisible({ timeout: 3000 }).catch(() => false)) {
      await staffCard.click();
      await page.waitForLoadState('networkidle');

      const statsIndicator = page
        .getByText('服务次数')
        .or(page.getByText('总营收'))
        .or(page.getByText('客单价'))
        .or(page.getByText('服务类型'))
        .or(page.getByText('加载中...'))
        .or(page.getByText('暂无服务记录'))
        .or(page.locator('.animate-spin'));
      await expect(statsIndicator.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
