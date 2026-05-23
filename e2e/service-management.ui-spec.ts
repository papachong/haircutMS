import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Service management UI', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // -------------------------------------------------------------------
  // 1. Services page renders with category sidebar and items area
  // -------------------------------------------------------------------
  test('services page renders with category sidebar and items area', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Left sidebar heading -- wait longer since this page loads data client-side
    await expect(page.getByText('服务分类')).toBeVisible({ timeout: 15000 });
    // The sidebar shows categories, and "管理分类" is a button in the sidebar
    await expect(page.getByText('管理分类')).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------
  // 2. Category sidebar shows categories (or empty state)
  // -------------------------------------------------------------------
  test('category sidebar shows categories or empty state', async () => {
    await navigateToAdmin(page, '/settings/services');

    // The sidebar either lists category buttons, or shows the empty message
    const categoryButton = page.locator('aside button[type="button"]').filter({ hasText: /管理分类/ }).first();
    await expect(categoryButton).toBeVisible({ timeout: 10000 });

    // If there are categories, at least one sidebar button exists; otherwise the
    // "暂无分类" text is shown inside the sidebar.
    const hasCategories = await page.locator('aside nav button[type="button"]').filter({ hasNotText: '管理分类' }).count();
    if (hasCategories === 0) {
      await expect(page.getByText('暂无分类，请先创建')).toBeVisible();
    }
  });

  // -------------------------------------------------------------------
  // 3. "新增项目" button opens create dialog with name/price/duration fields
  // -------------------------------------------------------------------
  test('new service button opens create dialog with form fields', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Ensure a category is selected first (if none, go to categories page to create one)
    const hasSelectedCategory = await page.locator('aside nav button.bg-primary').count();
    if (hasSelectedCategory === 0) {
      // No category selected -- navigate to categories, create one, then come back
      await page.goto('/admin/settings/services/categories');
      await page.waitForLoadState('networkidle');

      const newCatButton = page.getByRole('button', { name: /新增分类/ });
      await expect(newCatButton).toBeVisible({ timeout: 10000 });
      await newCatButton.click();

      const catNameInput = page.getByPlaceholder('分类名称');
      await expect(catNameInput).toBeVisible();
      await catNameInput.fill('E2E测试分类');
      await page.getByRole('button', { name: '创建', exact: true }).click();

      // Wait for the new category to appear in the list
      await expect(page.getByText('E2E测试分类')).toBeVisible({ timeout: 10000 });

      // Navigate back to services page
      await navigateToAdmin(page, '/settings/services');
    }

    // Click "新增项目" button
    const newServiceButton = page.getByRole('button', { name: /新增项目/ });
    await expect(newServiceButton).toBeVisible({ timeout: 10000 });
    await newServiceButton.click();

    // Verify dialog fields
    await expect(page.getByText('新增服务项目')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('项目名称')).toBeVisible();
    await expect(page.getByText('价格 (元)')).toBeVisible();
    await expect(page.getByText('时长 (分钟)')).toBeVisible();

    // Close dialog
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('新增服务项目')).not.toBeVisible();
  });

  // -------------------------------------------------------------------
  // 4. Create a service item: fill fields, submit
  // -------------------------------------------------------------------
  test('create a service item with name, price, and duration', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Make sure a category is selected
    const categoryButtons = page.locator('aside nav button[type="button"]').filter({ hasNotText: '管理分类' });
    const count = await categoryButtons.count();
    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForLoadState('networkidle');
    }

    const newServiceButton = page.getByRole('button', { name: /新增项目/ });
    await expect(newServiceButton).toBeVisible({ timeout: 10000 });
    await newServiceButton.click();

    await expect(page.getByText('新增服务项目')).toBeVisible({ timeout: 10000 });

    // Fill form fields
    const nameInput = page.locator('div:has(>label:text-is("项目名称")) input[type="text"]');
    await nameInput.fill('E2E测试理发');

    const priceInput = page.locator('div:has(>label:text-is("价格 (元)")) input[type="number"]');
    await priceInput.fill('68');

    const durationInput = page.locator('div:has(>label:text-is("时长 (分钟)")) input[type="number"]');
    await durationInput.fill('45');

    // Submit
    await page.getByRole('button', { name: '创建', exact: true }).click();

    // Dialog should close
    await expect(page.getByText('新增服务项目')).not.toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------
  // 5. Service appears in the list
  // -------------------------------------------------------------------
  test('created service appears in the list', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Click the category that should contain our test service
    const categoryButtons = page.locator('aside nav button[type="button"]').filter({ hasNotText: '管理分类' });
    const count = await categoryButtons.count();
    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText('E2E测试理发', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('时长: 45分钟').first()).toBeVisible();
    await expect(page.getByText('价格: ¥68.00').first()).toBeVisible();
  });

  // -------------------------------------------------------------------
  // 6. Edit service: click edit, change name, save
  // -------------------------------------------------------------------
  test('edit service and change name', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Select the category containing our service
    const categoryButtons = page.locator('aside nav button[type="button"]').filter({ hasNotText: '管理分类' });
    const count = await categoryButtons.count();
    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForLoadState('networkidle');
    }

    // Wait for our service item to appear
    await expect(page.getByText('E2E测试理发', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Find the row containing our service and click its edit button
    const serviceRow = page.locator('div.flex.group, div.border.rounded-lg').filter({ hasText: 'E2E测试理发' }).first();
    await serviceRow.getByRole('button', { name: '编辑' }).click();

    // Verify the edit dialog opens
    await expect(page.getByText('编辑服务项目')).toBeVisible({ timeout: 10000 });

    // Change the name
    const nameInput = page.locator('div:has(>label:text-is("项目名称")) input[type="text"]');
    await nameInput.clear();
    await nameInput.fill('E2E测试理发-已编辑');

    // Save
    await page.getByRole('button', { name: '保存' }).click();

    // Dialog should close and the updated name should be visible
    await expect(page.getByText('编辑服务项目')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E测试理发-已编辑')).toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------
  // 7. Toggle service active/inactive
  // -------------------------------------------------------------------
  test('toggle service active/inactive', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Select the category
    const categoryButtons = page.locator('aside nav button[type="button"]').filter({ hasNotText: '管理分类' });
    const count = await categoryButtons.count();
    if (count > 0) {
      await categoryButtons.first().click();
      await page.waitForLoadState('networkidle');
    }

    await expect(page.getByText('E2E测试理发-已编辑')).toBeVisible({ timeout: 10000 });

    // Find the row and click the toggle (eye) button
    const serviceRow = page.locator('div.flex.group, div.border.rounded-lg').filter({ hasText: 'E2E测试理发-已编辑' }).first();

    // Click the toggle active/inactive button (eye icon with title "下架")
    await serviceRow.getByRole('button', { name: '下架' }).click();

    // Should now show "已下架" text
    await expect(page.getByText('已下架')).toBeVisible({ timeout: 10000 });

    // Toggle back to active (eye-off icon with title "上架")
    await serviceRow.getByRole('button', { name: '上架' }).click();

    // "已下架" should disappear
    await expect(page.getByText('E2E测试理发-已编辑').locator('..').locator('..').getByText('已下架')).not.toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------
  // 8. Navigate to categories page, verify CRUD controls
  // -------------------------------------------------------------------
  test('navigate to categories page and verify CRUD controls', async () => {
    await navigateToAdmin(page, '/settings/services');

    // Click the "管理分类" link in the sidebar
    const manageLink = page.getByRole('button', { name: /管理分类/ });
    await expect(manageLink).toBeVisible({ timeout: 10000 });
    await manageLink.click();

    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL('/admin/settings/services/categories', { timeout: 10000 });

    // Verify page heading
    await expect(page.getByRole('heading', { name: '服务分类' })).toBeVisible({ timeout: 10000 });

    // Verify the "新增分类" button exists
    await expect(page.getByRole('button', { name: /新增分类/ })).toBeVisible();

    // Each category row should have edit and delete buttons
    const categoryRows = page.locator('div.group, div.flex.items-center.gap-3').filter({ hasText: 'E2E测试分类' });
    const rowCount = await categoryRows.count();
    if (rowCount > 0) {
      const row = categoryRows.first();
      await expect(row.getByRole('button', { name: '编辑' })).toBeVisible();
      await expect(row.getByRole('button', { name: '删除' })).toBeVisible();
    }
  });

  // -------------------------------------------------------------------
  // 9. Create a new category
  // -------------------------------------------------------------------
  test('create a new service category', async () => {
    await navigateToAdmin(page, '/settings/services/categories');

    await expect(page.getByRole('heading', { name: '服务分类' })).toBeVisible({ timeout: 10000 });

    // Click "新增分类"
    await page.getByRole('button', { name: /新增分类/ }).click();

    // Dialog should appear
    await expect(page.getByText('新增服务分类')).toBeVisible({ timeout: 10000 });
    await expect(page.getByPlaceholder('分类名称')).toBeVisible();

    // Fill in category name
    await page.getByPlaceholder('分类名称').fill('E2E新增分类');

    // Submit
    await page.getByRole('button', { name: '创建', exact: true }).click();

    // Dialog should close and new category should be in the list
    await expect(page.getByText('新增服务分类')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('E2E新增分类').first()).toBeVisible({ timeout: 10000 });
  });
});
