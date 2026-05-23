import { test, expect, type Page } from '@playwright/test';
import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';

test.describe('Member management flow', () => {
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  const createdMemberPhone = `13999${Date.now().toString().slice(-6)}`;
  const createdMemberName = `E2E测试会员_${Date.now()}`;
  let createdMemberId: string | null = null;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await shopLogin(page);
  });

  test.afterAll(async () => {
    await page.close();
  });

  // ── 1. Members page renders with title, search, stats ──────────────────

  test('members page renders with title, search, and stats cards', async () => {
    await navigateToAdmin(page, '/members');

    // Title
    await expect(
      page.getByRole('heading', { name: '会员管理' }),
    ).toBeVisible({ timeout: 10000 });

    // Search input
    await expect(
      page.getByPlaceholder('搜索姓名/手机号/卡号'),
    ).toBeVisible({ timeout: 10000 });

    // Stats cards - use exact match to avoid strict mode violations
    await expect(page.getByText('会员总数', { exact: true })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('本金余额', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('赠送余额', { exact: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('今日新增', { exact: true })).toBeVisible({ timeout: 10000 });
  });

  // ── 2. Search filters member list ──────────────────────────────────────

  test('search filters member list', async () => {
    await navigateToAdmin(page, '/members');

    const searchInput = page.getByPlaceholder('搜索姓名/手机号/卡号');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Type a nonsense keyword that won't match any member
    await searchInput.fill('ZZZZZ_NOT_A_MEMBER_9999');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Should show either "未找到匹配的会员" or "暂无会员数据"
    const noResultIndicator = page
      .getByText('未找到匹配的会员')
      .or(page.getByText('暂无会员数据'))
      .first();

    await expect(noResultIndicator).toBeVisible({ timeout: 10000 });

    // Clear search
    await searchInput.clear();
    await page.waitForTimeout(500);
  });

  // ── 3. Create member dialog opens with form fields ─────────────────────

  test('create member dialog opens with form fields', async () => {
    await navigateToAdmin(page, '/members');

    // Click "新建会员" button
    const createBtn = page.getByRole('button', { name: /新建会员|新建/ });
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Dialog should appear with heading
    await expect(
      page.getByRole('heading', { name: '新建会员' }),
    ).toBeVisible({ timeout: 10000 });

    // Form fields should be visible
    await expect(
      page.getByPlaceholder('请输入会员姓名'),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByPlaceholder('请输入手机号'),
    ).toBeVisible({ timeout: 10000 });

    // Gender select
    await expect(
      page.locator('select').filter({ has: page.getByText('请选择') }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Submit and cancel buttons
    await expect(
      page.getByRole('button', { name: '创建' }),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByRole('button', { name: '取消' }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 4. Fill name + phone, submit -> success, member appears in list ────

  test('create a new member with name and phone', async () => {
    // Dialog should still be open from previous test (serial mode)
    // If not, re-open it
    const dialogHeading = page.getByRole('heading', { name: '新建会员' });
    if (!(await dialogHeading.isVisible().catch(() => false))) {
      await navigateToAdmin(page, '/members');
      const createBtn = page.getByRole('button', { name: /新建会员|新建/ });
      await createBtn.click();
      await expect(dialogHeading).toBeVisible({ timeout: 10000 });
    }

    // Fill form
    await page.getByPlaceholder('请输入会员姓名').fill(createdMemberName);
    await page.getByPlaceholder('请输入手机号').fill(createdMemberPhone);

    // Submit
    await page.getByRole('button', { name: '创建' }).click();

    // After success, dialog closes and the new member appears in the list
    // Wait for the dialog to close
    await expect(dialogHeading).not.toBeVisible({ timeout: 10000 });

    // The member should now appear in the list
    await expect(
      page.getByText(createdMemberName).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 5. Edit member -> click edit button, change name, save ─────────────

  test('edit member changes name', async () => {
    await navigateToAdmin(page, '/members');

    // Find the row with the created member
    const memberRow = page.locator('a[href^="/admin/members/"]').filter({
      hasText: createdMemberName,
    }).first();
    await expect(memberRow).toBeVisible({ timeout: 10000 });

    // Extract the member ID from the href
    const href = await memberRow.getAttribute('href');
    createdMemberId = href?.replace('/admin/members/', '') ?? null;
    expect(createdMemberId).toBeTruthy();

    // Click the "编辑" button within the row (stop propagation, so it won't navigate)
    const editBtn = memberRow.getByRole('button', { name: '编辑' });
    await expect(editBtn).toBeVisible({ timeout: 10000 });
    await editBtn.click();

    // Edit dialog should appear with heading "编辑会员"
    await expect(
      page.getByRole('heading', { name: '编辑会员' }),
    ).toBeVisible({ timeout: 10000 });

    // Change name
    const nameInput = page.getByPlaceholder('请输入会员姓名');
    await nameInput.clear();
    await nameInput.fill(`${createdMemberName}_已编辑`);

    // Submit
    await page.getByRole('button', { name: '保存' }).click();

    // Dialog closes
    await expect(
      page.getByRole('heading', { name: '编辑会员' }),
    ).not.toBeVisible({ timeout: 10000 });

    // Edited name appears in the list
    await expect(
      page.getByText(`${createdMemberName}_已编辑`).first(),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 6. Click member row -> navigates to detail page ────────────────────

  test('click member row navigates to detail page', async () => {
    await navigateToAdmin(page, '/members');

    // Use the edited name to find the member
    const memberLink = page.locator('a[href^="/admin/members/"]').filter({
      hasText: `${createdMemberName}_已编辑`,
    }).first();
    await expect(memberLink).toBeVisible({ timeout: 10000 });

    // Click the link (not the edit button)
    await memberLink.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/admin\/members\/[\w-]+/, { timeout: 10000 });
  });

  // ── 7. Detail page shows profile card and balance ──────────────────────

  test('detail page shows profile card and balance info', async () => {
    // Already on detail page from previous test

    // Page heading
    await expect(
      page.getByRole('heading', { name: '会员详情' }),
    ).toBeVisible({ timeout: 10000 });

    // Member name visible in the profile card
    await expect(
      page.getByText(`${createdMemberName}_已编辑`),
    ).toBeVisible({ timeout: 10000 });

    // Balance labels visible
    await expect(page.getByText('本金余额')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('赠送余额')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('账户总余额')).toBeVisible({ timeout: 10000 });

    // Statistics labels
    await expect(page.getByText('总消费')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('消费次数')).toBeVisible({ timeout: 10000 });

    // Tabs visible
    await expect(page.getByText('基本信息')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('消费记录')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('充值记录')).toBeVisible({ timeout: 10000 });

    // Recharge button
    await expect(
      page.getByRole('button', { name: /充值/ }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 8. Back to members list from detail ────────────────────────────────

  test('navigate back to members list from detail', async () => {
    // Click the back arrow link
    const backLink = page.locator('a[href="/admin/members"]').first();
    await expect(backLink).toBeVisible({ timeout: 10000 });
    await backLink.click();

    await expect(page).toHaveURL('/admin/members', { timeout: 10000 });
    await expect(
      page.getByRole('heading', { name: '会员管理' }),
    ).toBeVisible({ timeout: 10000 });
  });

  // ── 9. Export button exists on members page ────────────────────────────

  test('export button exists on members page', async () => {
    await navigateToAdmin(page, '/members');

    // Export button with Download icon
    const exportBtn = page.getByRole('button', { name: /导出/ });
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
  });

  // ── 10. Import link exists on members page ─────────────────────────────

  test('import link exists on members page', async () => {
    await navigateToAdmin(page, '/members');

    // Import link points to /admin/members/import
    const importLink = page.locator('a[href="/admin/members/import"]');
    await expect(importLink).toBeVisible({ timeout: 10000 });
  });

  // ── 11. Member level info visible on list ──────────────────────────────

  test('member level and balance info visible in list', async () => {
    await navigateToAdmin(page, '/members');

    // Column headers
    await expect(page.getByText('会员信息')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('会员等级')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('余额')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('操作')).toBeVisible({ timeout: 10000 });

    // The seed has "普通会员" level - it should appear in the list
    await expect(
      page.getByText('普通会员'),
    ).toBeVisible({ timeout: 10000 });
  });
});
