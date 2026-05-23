import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Recharge plans management UI', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const uniqueSuffix = Date.now();

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('recharge plans page renders with existing plan', async () => {
    await navigateToAdmin(page, '/settings/recharge');

    await expect(
      page.getByRole('heading', { name: '充值方案管理' })
    ).toBeVisible({ timeout: 10000 });

    // The seed data plan should be visible
    await expect(page.getByText('充1000送100').first()).toBeVisible({ timeout: 10000 });

    // Verify the table headers are present
    await expect(
      page.getByRole('columnheader', { name: '方案名称' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: '充值金额' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: '赠送金额' })
    ).toBeVisible();
    await expect(
      page.getByRole('columnheader', { name: '状态' })
    ).toBeVisible();
  });

  test('filter tabs switch views correctly', async () => {
    await navigateToAdmin(page, '/settings/recharge');

    // The seed plan "充1000送100" is active by default, so it should show in
    // both "全部" and "上架中" tabs.

    // Click "上架中" tab
    const activeTab = page.locator('button', { hasText: /^上架中/ });
    await expect(activeTab).toBeVisible({ timeout: 10000 });
    await activeTab.click();

    // The seed plan should still be visible
    await expect(page.getByText('充1000送100').first()).toBeVisible({ timeout: 10000 });

    // Click "已下架" tab -- there should be no plans
    const inactiveTab = page.locator('button', { hasText: /^已下架/ });
    await inactiveTab.click();

    // Either the empty state message or an empty table (no plan rows with the seed plan)
    const emptyOrNoSeed = page
      .getByText('暂无已下架的方案')
      .or(page.getByText('暂无充值方案'))
      .or(page.getByText('暂无数据'));
    const emptyVisible = await emptyOrNoSeed.first().isVisible({ timeout: 5000 }).catch(() => false);

    // If no explicit empty state, just verify the seed plan is not in this view
    if (!emptyVisible) {
      await expect(page.getByText('充1000送100')).not.toBeVisible({ timeout: 5000 });
    }

    // The seed plan should NOT be visible in the inactive view
    await expect(page.getByText('充1000送100')).not.toBeVisible();

    // Click "全部" tab to go back
    const allTab = page.locator('button', { hasText: /^全部/ });
    await allTab.click();

    // The seed plan should reappear
    await expect(page.getByText('充1000送100').first()).toBeVisible({ timeout: 10000 });
  });

  test('"新增方案" opens create dialog with fields', async () => {
    await navigateToAdmin(page, '/settings/recharge');

    // Click the "新增方案" button
    await page.getByRole('button', { name: /新增方案/ }).click();

    // The modal should appear with the "新增充值方案" heading
    await expect(
      page.getByRole('heading', { name: '新增充值方案' })
    ).toBeVisible({ timeout: 10000 });

    // Verify the form fields are present
    await expect(
      page.getByLabel('方案名称').or(page.locator('label', { hasText: '方案名称' }))
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: '方案类型' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: '充值金额' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: '赠送金额' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: '开始时间' })
    ).toBeVisible();
    await expect(
      page.locator('label', { hasText: '结束时间' })
    ).toBeVisible();

    // Close the dialog without saving
    await page
      .locator('button', { hasText: '取消' })
      .last()
      .click();
    await expect(
      page.getByRole('heading', { name: '新增充值方案' })
    ).not.toBeVisible({ timeout: 10000 });
  });

  test('create new plan and submit', async () => {
    const planName = `E2E测试方案_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/recharge');

    // Click the "新增方案" button
    await page.getByRole('button', { name: /新增方案/ }).click();
    await expect(
      page.getByRole('heading', { name: '新增充值方案' })
    ).toBeVisible({ timeout: 10000 });

    // Fill in the plan name
    const nameInput = page.getByPlaceholder('如：充100送10');
    await nameInput.fill(planName);

    // Select GIFT type (充赠)
    await page.locator('select').selectOption('GIFT');

    // Fill in the amount (displayed in yuan, internally converted to fen)
    // The amount input uses formData.amount / 100 for display
    const amountInput = page.locator('input[type="number"]').first();
    await amountInput.clear();
    await amountInput.fill('200');

    // Fill in gift amount
    const giftInput = page.locator('input[type="number"]').nth(1);
    await giftInput.clear();
    await giftInput.fill('20');

    // Submit the form - use the save button inside the dialog
    const dialog = page.locator('.fixed.inset-0');
    const saveButton = dialog.locator('button', { hasText: '保存' });
    await saveButton.click();

    // The modal should close and the new plan should appear in the list
    await expect(
      page.getByRole('heading', { name: '新增充值方案' })
    ).not.toBeVisible({ timeout: 10000 });

    // Verify the new plan is visible in the list
    await expect(page.getByText(planName).first()).toBeVisible({ timeout: 10000 });

    // Verify the gift amount shows correctly (should show +¥20.00 or +20)
    await expect(
      page.locator('tr', { hasText: planName }).locator('span', { hasText: /\+¥?20/ })
    ).toBeVisible();
  });

  test('toggle plan active/inactive', async () => {
    const planName = `E2E测试方案_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/recharge');

    // Find the row with the newly created plan (may have duplicates from prior runs)
    const planRow = page.locator('tr', { hasText: planName }).first();
    await expect(planRow).toBeVisible({ timeout: 10000 });

    // The plan should currently be active ("进行中" status)
    await expect(planRow.getByText('进行中').first()).toBeVisible();

    // Click the eye toggle button to deactivate the plan
    // The toggle is the first button in the actions column
    const toggleButton = planRow.locator('button[title="下架"]');
    await toggleButton.click();

    // Wait for the status to change to "已下架"
    await expect(planRow.getByText('已下架')).toBeVisible({ timeout: 10000 });

    // Switch to "已下架" filter to verify it shows there
    await page.locator('button', { hasText: /^已下架/ }).click();
    await expect(page.getByText(planName)).toBeVisible({ timeout: 10000 });

    // Switch back to "全部" and reactivate the plan
    await page.locator('button', { hasText: /^全部/ }).click();
    await expect(planRow).toBeVisible({ timeout: 10000 });

    // Now the toggle should show "上架" as the title
    const reactivateButton = planRow.locator('button[title="上架"]');
    await reactivateButton.click();

    // Wait for the status to change back to "进行中"
    await expect(planRow.getByText('进行中')).toBeVisible({ timeout: 10000 });
  });
});
