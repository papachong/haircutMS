import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

const uniqueSuffix = Date.now().toString().slice(-6);

test.describe('Staff Management page', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const newStaffPhone = `13800${uniqueSuffix}`;
  const newStaffName = `E2E员工_${uniqueSuffix}`;
  const newStaffPassword = 'test1234';

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
    await navigateToAdmin(page, '/staff');
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('renders page title and stats cards', async () => {
    await expect(page.getByRole('heading', { name: '员工管理' })).toBeVisible({ timeout: 10000 });

    await expect(page.getByText('在职员工')).toBeVisible();
    // "已停用" appears in stats card and in table rows; use first() + exact
    await expect(page.getByText('已停用', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('发型师', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('员工总数')).toBeVisible();
  });

  test('staff list shows the seed owner account', async () => {
    await page.waitForLoadState('networkidle');

    const ownerRow = page.locator('tr', { hasText: '13900000001' }).first();
    const ownerName = page.locator('td', { hasText: '店主' }).first();
    const ownerInTable = (await ownerRow.count()) > 0 || (await ownerName.count()) > 0;
    expect(ownerInTable).toBeTruthy();
  });

  test('"添加员工" button opens create modal', async () => {
    const addButton = page.getByRole('button', { name: '添加员工' });
    await expect(addButton).toBeVisible({ timeout: 10000 });

    await addButton.click();

    await expect(page.getByRole('heading', { name: '添加员工' })).toBeVisible({ timeout: 5000 });

    await expect(page.getByPlaceholder('请输入姓名')).toBeVisible();
    await expect(page.getByPlaceholder('请输入手机号')).toBeVisible();

    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    const roleSelect = page.locator('select');
    await expect(roleSelect).toBeVisible();

    await page.getByRole('button', { name: '取消' }).click();
    await expect(page.getByRole('heading', { name: '添加员工' })).not.toBeVisible();
  });

  test('create staff: fill form and submit', async () => {
    const addButton = page.getByRole('button', { name: '添加员工' });
    await addButton.click();
    await expect(page.getByRole('heading', { name: '添加员工' })).toBeVisible({ timeout: 5000 });

    await page.getByPlaceholder('请输入姓名').fill(newStaffName);
    await page.getByPlaceholder('请输入手机号').fill(newStaffPhone);

    const passwordInput = page.locator('input[type="password"]');
    await passwordInput.fill(newStaffPassword);

    const roleSelect = page.locator('select');
    await roleSelect.selectOption('STYLIST');

    const confirmButton = page.getByRole('button', { name: '确认' });
    await confirmButton.click();

    const successMessage = page.getByText('员工添加成功');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    await expect(page.getByRole('heading', { name: '添加员工' })).not.toBeVisible();
  });

  test('new staff appears in the staff list', async () => {
    // Hard refresh to ensure the list is fresh
    await page.goto('/admin/staff');
    await page.waitForLoadState('domcontentloaded');

    // The new staff should be visible - check by phone which is unique
    // May need a moment for the API data to load
    const newStaffRow = page.locator('tr', { hasText: newStaffPhone });
    await expect(newStaffRow).toBeVisible({ timeout: 15000 });

    await expect(newStaffRow.locator('td', { hasText: newStaffPhone })).toBeVisible();

    const stylistBadge = newStaffRow.locator('span', { hasText: '发型师' });
    await expect(stylistBadge).toBeVisible();
  });

  test('edit staff: change name and save', async () => {
    const newStaffRow = page.locator('tr', { hasText: newStaffPhone }).first();
    await expect(newStaffRow).toBeVisible({ timeout: 10000 });

    const editButton = newStaffRow.locator('button[title="编辑"]');
    await editButton.click();

    await expect(page.getByRole('heading', { name: '编辑员工' })).toBeVisible({ timeout: 5000 });

    const nameInput = page.getByPlaceholder('请输入姓名');
    await nameInput.clear();
    await nameInput.fill(`${newStaffName}_已编辑`);

    const confirmButton = page.getByRole('button', { name: '确认' });
    await confirmButton.click();

    const successMessage = page.getByText('员工信息更新成功');
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    await expect(page.locator('tr', { hasText: newStaffPhone }).first()).toBeVisible({ timeout: 10000 });
  });

  test('toggle staff active status', async () => {
    const editedName = `${newStaffName}_已编辑`;
    const staffRow = page.locator('tr', { hasText: newStaffPhone }).first();
    await expect(staffRow).toBeVisible({ timeout: 10000 });

    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    const toggleButton = staffRow.locator('button[title="停用"]');
    await toggleButton.click();

    // The success message "已停用「name」" is rendered in a green div; it auto-hides after 3s
    // The text "已停用" also appears in the status column, so match the full message
    const successMessage = page.getByText(`已停用「${editedName}」`);
    await expect(successMessage).toBeVisible({ timeout: 10000 });

    const disabledBadge = staffRow.locator('span', { hasText: '已停用' }).first();
    await expect(disabledBadge).toBeVisible({ timeout: 10000 });

    const reactivateButton = staffRow.locator('button[title="启用"]');
    await reactivateButton.click();

    const reactivateMessage = page.getByText(`已启用「${editedName}」`);
    await expect(reactivateMessage).toBeVisible({ timeout: 10000 });

    const activeBadge = staffRow.locator('span', { hasText: '在职' }).first();
    await expect(activeBadge).toBeVisible({ timeout: 10000 });
  });
});
