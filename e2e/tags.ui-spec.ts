import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Tags management UI', () => {
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

  test('tags page renders with tag management heading', async () => {
    await navigateToAdmin(page, '/settings/tags');
    await expect(page.getByRole('heading', { name: '标签管理' })).toBeVisible({
      timeout: 10000,
    });
    await expect(
      page.getByText('标签可以用来分类和标记会员')
    ).toBeVisible();
  });

  test('tags page shows create group button', async () => {
    await navigateToAdmin(page, '/settings/tags');
    await expect(
      page.getByRole('button', { name: /新建标签组/ })
    ).toBeVisible({ timeout: 10000 });
  });

  test('create a new tag group', async () => {
    await navigateToAdmin(page, '/settings/tags');

    // Click the create group button
    await page.getByRole('button', { name: /新建标签组/ }).click();

    // The dialog should appear with the "新建标签组" heading
    await expect(
      page.getByRole('heading', { name: '新建标签组' })
    ).toBeVisible({ timeout: 10000 });

    // Fill in the group name
    const groupName = `E2E测试标签组_${uniqueSuffix}`;
    await page.getByPlaceholder('例如：客户偏好').fill(groupName);

    // Submit the form
    await page
      .locator('form')
      .locator('button[type="submit"]', { hasText: '保存' })
      .click();

    // Dialog closes and the new group appears in the list
    await expect(page.getByText(groupName)).toBeVisible({ timeout: 10000 });
  });

  test('new group appears in the list with zero tags', async () => {
    const groupName = `E2E测试标签组_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/tags');

    // The group should show up with "0 个标签" count
    const groupRow = page.locator('div', { hasText: groupName }).first();
    await expect(groupRow).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(`${groupName}`)).toBeVisible();
  });

  test('add a tag within the group', async () => {
    const groupName = `E2E测试标签组_${uniqueSuffix}`;
    const tagName = `E2E标签_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/tags');

    // Find the group row and click it to expand (click the group name area)
    const groupRow = page
      .locator('div.bg-card.border.rounded-lg')
      .filter({ hasText: groupName });
    await expect(groupRow).toBeVisible({ timeout: 10000 });

    // Expand the group by clicking on it
    await groupRow.locator('div.cursor-pointer').first().click();

    // Wait for the expanded content to show "添加标签" button
    await expect(
      groupRow.getByRole('button', { name: /添加标签/ })
    ).toBeVisible({ timeout: 10000 });

    // Click "添加标签" to open the tag dialog
    await groupRow.getByRole('button', { name: /添加标签/ }).click();

    // The tag dialog should appear
    await expect(
      page.getByRole('heading', { name: '新建标签' })
    ).toBeVisible({ timeout: 10000 });

    // Fill in the tag name
    await page.getByPlaceholder('例如：喜欢短发').fill(tagName);

    // Submit the form
    await page
      .locator('form')
      .locator('button[type="submit"]', { hasText: '保存' })
      .click();

    // Wait for the dialog to close
    await expect(page.getByRole('heading', { name: '新建标签' })).not.toBeVisible({ timeout: 10000 });

    // After save, loadTagGroups() resets expanded state to first 3 groups.
    // Re-expand the group if needed, then check for the tag.
    await groupRow.locator('div.cursor-pointer').first().click();

    // The new tag should appear within the expanded group
    await expect(groupRow.getByText(tagName)).toBeVisible({ timeout: 10000 });
  });

  test('edit tag name', async () => {
    const groupName = `E2E测试标签组_${uniqueSuffix}`;
    const tagName = `E2E标签_${uniqueSuffix}`;
    const editedTagName = `E2E编辑标签_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/tags');

    // Find the group row and expand it
    const groupRow = page
      .locator('div.bg-card.border.rounded-lg')
      .filter({ hasText: groupName });
    await expect(groupRow).toBeVisible({ timeout: 10000 });
    await groupRow.locator('div.cursor-pointer').first().click();

    // Wait for the tag to appear
    const tagRow = groupRow
      .locator('div.flex.items-center.justify-between')
      .filter({ hasText: tagName });
    await expect(tagRow).toBeVisible({ timeout: 10000 });

    // Click the edit (pencil) button for the tag -- it's the first pencil
    // icon inside the tag row
    await tagRow.locator('button').first().click();

    // The edit tag dialog should appear
    await expect(
      page.getByRole('heading', { name: '编辑标签' })
    ).toBeVisible({ timeout: 10000 });

    // Clear existing name and type new one
    const nameInput = page.getByPlaceholder('例如：喜欢短发');
    await nameInput.clear();
    await nameInput.fill(editedTagName);

    // Submit the form
    await page
      .locator('form')
      .locator('button[type="submit"]', { hasText: '保存' })
      .click();

    // Wait for dialog to close
    await expect(page.getByRole('heading', { name: '编辑标签' })).not.toBeVisible({ timeout: 10000 });

    // Re-expand the group (loadTagGroups resets expanded state after save)
    await groupRow.locator('div.cursor-pointer').first().click();

    // The edited tag name should appear
    await expect(groupRow.getByText(editedTagName)).toBeVisible({
      timeout: 10000,
    });
  });

  test('delete a tag', async () => {
    const groupName = `E2E测试标签组_${uniqueSuffix}`;
    const editedTagName = `E2E编辑标签_${uniqueSuffix}`;
    await navigateToAdmin(page, '/settings/tags');

    // Find the group row and expand it
    const groupRow = page
      .locator('div.bg-card.border.rounded-lg')
      .filter({ hasText: groupName });
    await expect(groupRow).toBeVisible({ timeout: 10000 });
    await groupRow.locator('div.cursor-pointer').first().click();

    // Wait for the tag to appear
    const tagRow = groupRow
      .locator('div.flex.items-center.justify-between')
      .filter({ hasText: editedTagName });
    await expect(tagRow).toBeVisible({ timeout: 10000 });

    // Accept the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    // Click the delete (trash) button for the tag -- it's the last button
    // inside the tag row
    const deleteButtons = tagRow.locator('button');
    const deleteButton = deleteButtons.nth(1);
    await deleteButton.click();

    // The tag should disappear from the group
    await expect(groupRow.getByText(editedTagName)).not.toBeVisible({
      timeout: 10000,
    });
  });
});
