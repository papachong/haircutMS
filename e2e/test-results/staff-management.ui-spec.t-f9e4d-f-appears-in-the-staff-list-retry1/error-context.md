# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: staff-management.ui-spec.ts >> Staff Management page >> new staff appears in the staff list
- Location: e2e/staff-management.ui-spec.ts:87:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('tr').filter({ hasText: '13800384445' })
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for locator('tr').filter({ hasText: '13800384445' })

```

```yaml
- alert
- complementary:
  - text: HaircutMS
  - navigation:
    - link "📊 首页":
      - /url: /admin
    - link "💰 收银":
      - /url: /admin/pos
    - link "📋 订单":
      - /url: /admin/orders
    - link "👥 会员":
      - /url: /admin/members
    - link "💵 收入分析":
      - /url: /admin/revenue-analytics
    - link "📈 会员分析":
      - /url: /admin/members/analytics
    - link "✂️ 服务":
      - /url: /admin/settings/services
    - link "👤 员工":
      - /url: /admin/staff
    - link "📈 员工统计":
      - /url: /admin/staff-stats
    - link "💳 充值方案":
      - /url: /admin/settings/recharge
    - link "⚙️ 设置":
      - /url: /admin/settings
- main:
  - button:
    - img
  - main:
    - heading "员工管理" [level=1]
    - paragraph: 管理店铺员工信息、角色和权限
    - button "添加员工":
      - img
      - text: 添加员工
    - img
    - text: 在职员工
    - paragraph: "10"
    - img
    - text: 已停用
    - paragraph: "13"
    - img
    - text: 发型师
    - paragraph: "9"
    - img
    - text: 员工总数
    - paragraph: "23"
    - img
    - textbox "搜索姓名/手机号/角色"
    - table:
      - rowgroup:
        - row "姓名 角色 手机号 状态 入职时间 操作":
          - columnheader "姓名"
          - columnheader "角色"
          - columnheader "手机号"
          - columnheader "状态"
          - columnheader "入职时间"
          - columnheader "操作"
      - rowgroup:
        - row "E E2E员工_736571_已编辑 发型师 13800736571 在职 2026/5/23":
          - cell "E E2E员工_736571_已编辑"
          - cell "发型师"
          - cell "13800736571"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_474065_已编辑 发型师 13800474065 在职 2026/5/23":
          - cell "E E2E员工_474065_已编辑"
          - cell "发型师"
          - cell "13800474065"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_470779_已编辑 发型师 13800470779 在职 2026/5/23":
          - cell "E E2E员工_470779_已编辑"
          - cell "发型师"
          - cell "13800470779"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_318718_已编辑 发型师 13800318718 在职 2026/5/23":
          - cell "E E2E员工_318718_已编辑"
          - cell "发型师"
          - cell "13800318718"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_315436_已编辑 发型师 13800315436 在职 2026/5/23":
          - cell "E E2E员工_315436_已编辑"
          - cell "发型师"
          - cell "13800315436"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_159013_已编辑 发型师 13800159013 在职 2026/5/23":
          - cell "E E2E员工_159013_已编辑"
          - cell "发型师"
          - cell "13800159013"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_155170_已编辑 发型师 13800155170 在职 2026/5/23":
          - cell "E E2E员工_155170_已编辑"
          - cell "发型师"
          - cell "13800155170"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_987582_已编辑 发型师 13800987582 在职 2026/5/23":
          - cell "E E2E员工_987582_已编辑"
          - cell "发型师"
          - cell "13800987582"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_983744_已编辑 发型师 13800983744 在职 2026/5/23":
          - cell "E E2E员工_983744_已编辑"
          - cell "发型师"
          - cell "13800983744"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
        - row "E E2E员工_582388_已编辑 发型师 13800582388 已停用 2026/5/23":
          - cell "E E2E员工_582388_已编辑"
          - cell "发型师"
          - cell "13800582388"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_579024_已编辑 发型师 13800579024 已停用 2026/5/23":
          - cell "E E2E员工_579024_已编辑"
          - cell "发型师"
          - cell "13800579024"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_370874_已编辑 发型师 13800370874 已停用 2026/5/23":
          - cell "E E2E员工_370874_已编辑"
          - cell "发型师"
          - cell "13800370874"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_367805_已编辑 发型师 13800367805 已停用 2026/5/23":
          - cell "E E2E员工_367805_已编辑"
          - cell "发型师"
          - cell "13800367805"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_131196_已编辑 发型师 13800131196 已停用 2026/5/23":
          - cell "E E2E员工_131196_已编辑"
          - cell "发型师"
          - cell "13800131196"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_128033_已编辑 发型师 13800128033 已停用 2026/5/23":
          - cell "E E2E员工_128033_已编辑"
          - cell "发型师"
          - cell "13800128033"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_873542_已编辑 发型师 13800873542 已停用 2026/5/23":
          - cell "E E2E员工_873542_已编辑"
          - cell "发型师"
          - cell "13800873542"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_870473_已编辑 发型师 13800870473 已停用 2026/5/23":
          - cell "E E2E员工_870473_已编辑"
          - cell "发型师"
          - cell "13800870473"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_388573_已编辑 发型师 13800388573 已停用 2026/5/23":
          - cell "E E2E员工_388573_已编辑"
          - cell "发型师"
          - cell "13800388573"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_385704_已编辑 发型师 13800385704 已停用 2026/5/23":
          - cell "E E2E员工_385704_已编辑"
          - cell "发型师"
          - cell "13800385704"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_053078_已编辑 发型师 13800053078 已停用 2026/5/23":
          - cell "E E2E员工_053078_已编辑"
          - cell "发型师"
          - cell "13800053078"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_049775_已编辑 发型师 13800049775 已停用 2026/5/23":
          - cell "E E2E员工_049775_已编辑"
          - cell "发型师"
          - cell "13800049775"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "E E2E员工_505191_已编辑 发型师 13800505191 已停用 2026/5/23":
          - cell "E E2E员工_505191_已编辑"
          - cell "发型师"
          - cell "13800505191"
          - cell "已停用":
            - img
            - text: 已停用
          - cell "2026/5/23"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "启用":
              - img
        - row "店 店主 店长 13900000001 在职 2026/5/21":
          - cell "店 店主"
          - cell "店长"
          - cell "13900000001"
          - cell "在职":
            - img
            - text: 在职
          - cell "2026/5/21"
          - cell:
            - button "编辑":
              - img
            - button "重置密码":
              - img
            - button "停用":
              - img
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import { shopLogin, navigateToAdmin } from './helpers/ui-helpers';
  3   | 
  4   | const uniqueSuffix = Date.now().toString().slice(-6);
  5   | 
  6   | test.describe('Staff Management page', () => {
  7   |   test.describe.configure({ mode: 'serial' });
  8   | 
  9   |   let page: Page;
  10  |   const newStaffPhone = `13800${uniqueSuffix}`;
  11  |   const newStaffName = `E2E员工_${uniqueSuffix}`;
  12  |   const newStaffPassword = 'test1234';
  13  | 
  14  |   test.beforeAll(async ({ browser }) => {
  15  |     page = await browser.newPage();
  16  |     await shopLogin(page);
  17  |     await navigateToAdmin(page, '/staff');
  18  |   });
  19  | 
  20  |   test.afterAll(async () => {
  21  |     await page.close();
  22  |   });
  23  | 
  24  |   test('renders page title and stats cards', async () => {
  25  |     await expect(page.getByRole('heading', { name: '员工管理' })).toBeVisible({ timeout: 10000 });
  26  | 
  27  |     await expect(page.getByText('在职员工')).toBeVisible();
  28  |     // "已停用" appears in stats card and in table rows; use first() + exact
  29  |     await expect(page.getByText('已停用', { exact: true }).first()).toBeVisible();
  30  |     await expect(page.getByText('发型师', { exact: true }).first()).toBeVisible();
  31  |     await expect(page.getByText('员工总数')).toBeVisible();
  32  |   });
  33  | 
  34  |   test('staff list shows the seed owner account', async () => {
  35  |     await page.waitForLoadState('networkidle');
  36  | 
  37  |     const ownerRow = page.locator('tr', { hasText: '13900000001' }).first();
  38  |     const ownerName = page.locator('td', { hasText: '店主' }).first();
  39  |     const ownerInTable = (await ownerRow.count()) > 0 || (await ownerName.count()) > 0;
  40  |     expect(ownerInTable).toBeTruthy();
  41  |   });
  42  | 
  43  |   test('"添加员工" button opens create modal', async () => {
  44  |     const addButton = page.getByRole('button', { name: '添加员工' });
  45  |     await expect(addButton).toBeVisible({ timeout: 10000 });
  46  | 
  47  |     await addButton.click();
  48  | 
  49  |     await expect(page.getByRole('heading', { name: '添加员工' })).toBeVisible({ timeout: 5000 });
  50  | 
  51  |     await expect(page.getByPlaceholder('请输入姓名')).toBeVisible();
  52  |     await expect(page.getByPlaceholder('请输入手机号')).toBeVisible();
  53  | 
  54  |     const passwordInput = page.locator('input[type="password"]');
  55  |     await expect(passwordInput).toBeVisible();
  56  | 
  57  |     const roleSelect = page.locator('select');
  58  |     await expect(roleSelect).toBeVisible();
  59  | 
  60  |     await page.getByRole('button', { name: '取消' }).click();
  61  |     await expect(page.getByRole('heading', { name: '添加员工' })).not.toBeVisible();
  62  |   });
  63  | 
  64  |   test('create staff: fill form and submit', async () => {
  65  |     const addButton = page.getByRole('button', { name: '添加员工' });
  66  |     await addButton.click();
  67  |     await expect(page.getByRole('heading', { name: '添加员工' })).toBeVisible({ timeout: 5000 });
  68  | 
  69  |     await page.getByPlaceholder('请输入姓名').fill(newStaffName);
  70  |     await page.getByPlaceholder('请输入手机号').fill(newStaffPhone);
  71  | 
  72  |     const passwordInput = page.locator('input[type="password"]');
  73  |     await passwordInput.fill(newStaffPassword);
  74  | 
  75  |     const roleSelect = page.locator('select');
  76  |     await roleSelect.selectOption('STYLIST');
  77  | 
  78  |     const confirmButton = page.getByRole('button', { name: '确认' });
  79  |     await confirmButton.click();
  80  | 
  81  |     const successMessage = page.getByText('员工添加成功');
  82  |     await expect(successMessage).toBeVisible({ timeout: 10000 });
  83  | 
  84  |     await expect(page.getByRole('heading', { name: '添加员工' })).not.toBeVisible();
  85  |   });
  86  | 
  87  |   test('new staff appears in the staff list', async () => {
  88  |     // Hard refresh to ensure the list is fresh
  89  |     await page.goto('/admin/staff');
  90  |     await page.waitForLoadState('domcontentloaded');
  91  | 
  92  |     // The new staff should be visible - check by phone which is unique
  93  |     // May need a moment for the API data to load
  94  |     const newStaffRow = page.locator('tr', { hasText: newStaffPhone });
> 95  |     await expect(newStaffRow).toBeVisible({ timeout: 15000 });
      |                               ^ Error: expect(locator).toBeVisible() failed
  96  | 
  97  |     await expect(newStaffRow.locator('td', { hasText: newStaffPhone })).toBeVisible();
  98  | 
  99  |     const stylistBadge = newStaffRow.locator('span', { hasText: '发型师' });
  100 |     await expect(stylistBadge).toBeVisible();
  101 |   });
  102 | 
  103 |   test('edit staff: change name and save', async () => {
  104 |     const newStaffRow = page.locator('tr', { hasText: newStaffPhone }).first();
  105 |     await expect(newStaffRow).toBeVisible({ timeout: 10000 });
  106 | 
  107 |     const editButton = newStaffRow.locator('button[title="编辑"]');
  108 |     await editButton.click();
  109 | 
  110 |     await expect(page.getByRole('heading', { name: '编辑员工' })).toBeVisible({ timeout: 5000 });
  111 | 
  112 |     const nameInput = page.getByPlaceholder('请输入姓名');
  113 |     await nameInput.clear();
  114 |     await nameInput.fill(`${newStaffName}_已编辑`);
  115 | 
  116 |     const confirmButton = page.getByRole('button', { name: '确认' });
  117 |     await confirmButton.click();
  118 | 
  119 |     const successMessage = page.getByText('员工信息更新成功');
  120 |     await expect(successMessage).toBeVisible({ timeout: 10000 });
  121 | 
  122 |     await expect(page.locator('tr', { hasText: newStaffPhone }).first()).toBeVisible({ timeout: 10000 });
  123 |   });
  124 | 
  125 |   test('toggle staff active status', async () => {
  126 |     const editedName = `${newStaffName}_已编辑`;
  127 |     const staffRow = page.locator('tr', { hasText: newStaffPhone }).first();
  128 |     await expect(staffRow).toBeVisible({ timeout: 10000 });
  129 | 
  130 |     page.on('dialog', async (dialog) => {
  131 |       await dialog.accept();
  132 |     });
  133 | 
  134 |     const toggleButton = staffRow.locator('button[title="停用"]');
  135 |     await toggleButton.click();
  136 | 
  137 |     // The success message "已停用「name」" is rendered in a green div; it auto-hides after 3s
  138 |     // The text "已停用" also appears in the status column, so match the full message
  139 |     const successMessage = page.getByText(`已停用「${editedName}」`);
  140 |     await expect(successMessage).toBeVisible({ timeout: 10000 });
  141 | 
  142 |     const disabledBadge = staffRow.locator('span', { hasText: '已停用' }).first();
  143 |     await expect(disabledBadge).toBeVisible({ timeout: 10000 });
  144 | 
  145 |     const reactivateButton = staffRow.locator('button[title="启用"]');
  146 |     await reactivateButton.click();
  147 | 
  148 |     const reactivateMessage = page.getByText(`已启用「${editedName}」`);
  149 |     await expect(reactivateMessage).toBeVisible({ timeout: 10000 });
  150 | 
  151 |     const activeBadge = staffRow.locator('span', { hasText: '在职' }).first();
  152 |     await expect(activeBadge).toBeVisible({ timeout: 10000 });
  153 |   });
  154 | });
  155 | 
```