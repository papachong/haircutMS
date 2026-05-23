import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Member levels UI', () => {
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
  // 1. Levels page renders with existing seeded level "普通会员"
  // -------------------------------------------------------------------
  test('levels page renders with existing level', async () => {
    await navigateToAdmin(page, '/settings/levels');

    await expect(
      page.getByRole('heading', { name: '会员等级管理' }),
    ).toBeVisible({ timeout: 10000 });

    // The seeded level "普通会员" should be visible
    await expect(page.getByText('普通会员').first()).toBeVisible({ timeout: 10000 });
    // Discount 1.0 renders as "无折扣"
    await expect(page.getByText('无折扣').first()).toBeVisible();
    // The first level gets a "默认" badge
    await expect(page.getByText('默认').first()).toBeVisible();
  });

  // -------------------------------------------------------------------
  // 2. "新增等级" opens create dialog
  // -------------------------------------------------------------------
  test('new level button opens create dialog', async () => {
    await navigateToAdmin(page, '/settings/levels');

    const newLevelButton = page.getByRole('button', { name: /新增等级/ });
    await expect(newLevelButton).toBeVisible({ timeout: 10000 });
    await newLevelButton.click();

    // Verify dialog
    await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('label', { hasText: '等级名称' })).toBeVisible();
    await expect(page.getByText(/折扣/).first()).toBeVisible();
    await expect(page.getByText('备注').first()).toBeVisible();

    // Close dialog via cancel
    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByText('新增会员等级')).not.toBeVisible();
  });

  // -------------------------------------------------------------------
  // 3. Create new level with name and discount, submit
  // -------------------------------------------------------------------
  test('create a new member level', async () => {
    await navigateToAdmin(page, '/settings/levels');

    await page.getByRole('button', { name: /新增等级/ }).click();
    await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });

    // Fill in level name
    const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
    await nameInput.fill('E2E银卡会员');

    // Set discount via the number input (0.85 = 八五折)
    const discountInput = page.locator('input[type="number"][min="0.1"][max="1.0"]');
    await discountInput.fill('0.85');

    // Fill in remark
    const remarkInput = page.getByPlaceholder('选填，如：消费满500自动升级');
    await remarkInput.fill('E2E测试等级');

    // Submit
    await page.getByRole('button', { name: '保存' }).click();

    // Dialog should close
    await expect(page.getByText('新增会员等级')).not.toBeVisible({ timeout: 10000 });
  });

  // -------------------------------------------------------------------
  // 4. New level appears in list
  // -------------------------------------------------------------------
  test('newly created level appears in the list', async () => {
    await navigateToAdmin(page, '/settings/levels');

    await expect(page.getByText('E2E银卡会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    // 0.85 should render as "8.5折"
    await expect(page.getByText('8.5折').first()).toBeVisible();
  });

  // -------------------------------------------------------------------
  // 5. Edit existing level, change name, save
  // -------------------------------------------------------------------
  test('edit existing level and change name', async () => {
    await navigateToAdmin(page, '/settings/levels');

    // Wait for the table to render
    await expect(page.getByText('普通会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });

    // Find the row containing "普通会员" and click its edit button.
    // Desktop view uses a table; the edit button has title="编辑".
    const levelRow = page.locator('tr', { hasText: '普通会员' }).first();
    const rowCount = await levelRow.count();

    if (rowCount > 0) {
      // Desktop table layout
      await levelRow.getByRole('button', { name: '编辑' }).click();
    } else {
      // Mobile card layout fallback
      const card = page.locator('div.p-4, div.divide-y > div').filter({ hasText: '普通会员' }).first();
      await card.getByRole('button', { name: '编辑' }).click();
    }

    // Edit dialog should open
    await expect(page.getByText('编辑会员等级')).toBeVisible({ timeout: 10000 });

    // Change the name
    const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
    await nameInput.clear();
    await nameInput.fill('普通会员-已编辑');

    // Save
    await page.getByRole('button', { name: '保存' }).click();

    // Dialog should close and updated name visible
    await expect(page.getByText('编辑会员等级')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText('普通会员-已编辑')).toBeVisible({ timeout: 10000 });
  });
});
