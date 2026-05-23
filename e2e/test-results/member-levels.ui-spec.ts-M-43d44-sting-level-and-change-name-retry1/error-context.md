# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: member-levels.ui-spec.ts >> Member levels UI >> edit existing level and change name
- Location: e2e/member-levels.ui-spec.ts:99:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('普通会员', { exact: true }).first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText('普通会员', { exact: true }).first()

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
    - heading "会员等级管理" [level=1]
    - paragraph: 管理会员等级、折扣比例和排序。拖拽行可调整顺序，排序第一的等级为新会员默认等级。
    - button "新增等级":
      - img
      - text: 新增等级
    - table:
      - rowgroup:
        - row "等级名称 折扣 关联会员 备注 操作":
          - columnheader
          - columnheader "等级名称"
          - columnheader "折扣"
          - columnheader "关联会员"
          - columnheader "备注"
          - columnheader "操作"
      - rowgroup:
        - row "普通会员-已编辑 默认 无折扣 33 -":
          - cell:
            - img
          - cell "普通会员-已编辑 默认"
          - cell "无折扣"
          - cell "33":
            - img
            - text: "33"
          - cell "-"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
        - row "E2E银卡会员 8.5折 0 E2E测试等级":
          - cell:
            - img
          - cell "E2E银卡会员"
          - cell "8.5折"
          - cell "0":
            - img
            - text: "0"
          - cell "E2E测试等级"
          - cell:
            - button "编辑":
              - img
            - button "删除":
              - img
    - text: 默认 标记表示新会员自动关联该等级。拖拽行调整顺序，排序第一的等级为默认等级。
```

# Test source

```ts
  3   | 
  4   | test.describe('Member levels UI', () => {
  5   |   test.describe.configure({ mode: 'serial' });
  6   | 
  7   |   let page: Page;
  8   | 
  9   |   test.beforeAll(async ({ browser }) => {
  10  |     page = await browser.newPage();
  11  |     await shopLogin(page);
  12  |   });
  13  | 
  14  |   test.afterAll(async () => {
  15  |     await page.close();
  16  |   });
  17  | 
  18  |   // -------------------------------------------------------------------
  19  |   // 1. Levels page renders with existing seeded level "普通会员"
  20  |   // -------------------------------------------------------------------
  21  |   test('levels page renders with existing level', async () => {
  22  |     await navigateToAdmin(page, '/settings/levels');
  23  | 
  24  |     await expect(
  25  |       page.getByRole('heading', { name: '会员等级管理' }),
  26  |     ).toBeVisible({ timeout: 10000 });
  27  | 
  28  |     // The seeded level "普通会员" should be visible
  29  |     await expect(page.getByText('普通会员').first()).toBeVisible({ timeout: 10000 });
  30  |     // Discount 1.0 renders as "无折扣"
  31  |     await expect(page.getByText('无折扣').first()).toBeVisible();
  32  |     // The first level gets a "默认" badge
  33  |     await expect(page.getByText('默认').first()).toBeVisible();
  34  |   });
  35  | 
  36  |   // -------------------------------------------------------------------
  37  |   // 2. "新增等级" opens create dialog
  38  |   // -------------------------------------------------------------------
  39  |   test('new level button opens create dialog', async () => {
  40  |     await navigateToAdmin(page, '/settings/levels');
  41  | 
  42  |     const newLevelButton = page.getByRole('button', { name: /新增等级/ });
  43  |     await expect(newLevelButton).toBeVisible({ timeout: 10000 });
  44  |     await newLevelButton.click();
  45  | 
  46  |     // Verify dialog
  47  |     await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });
  48  |     await expect(page.locator('label', { hasText: '等级名称' })).toBeVisible();
  49  |     await expect(page.getByText(/折扣/).first()).toBeVisible();
  50  |     await expect(page.getByText('备注').first()).toBeVisible();
  51  | 
  52  |     // Close dialog via cancel
  53  |     await page.getByRole('button', { name: '取消' }).click();
  54  |     await expect(page.getByText('新增会员等级')).not.toBeVisible();
  55  |   });
  56  | 
  57  |   // -------------------------------------------------------------------
  58  |   // 3. Create new level with name and discount, submit
  59  |   // -------------------------------------------------------------------
  60  |   test('create a new member level', async () => {
  61  |     await navigateToAdmin(page, '/settings/levels');
  62  | 
  63  |     await page.getByRole('button', { name: /新增等级/ }).click();
  64  |     await expect(page.getByText('新增会员等级')).toBeVisible({ timeout: 10000 });
  65  | 
  66  |     // Fill in level name
  67  |     const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
  68  |     await nameInput.fill('E2E银卡会员');
  69  | 
  70  |     // Set discount via the number input (0.85 = 八五折)
  71  |     const discountInput = page.locator('input[type="number"][min="0.1"][max="1.0"]');
  72  |     await discountInput.fill('0.85');
  73  | 
  74  |     // Fill in remark
  75  |     const remarkInput = page.getByPlaceholder('选填，如：消费满500自动升级');
  76  |     await remarkInput.fill('E2E测试等级');
  77  | 
  78  |     // Submit
  79  |     await page.getByRole('button', { name: '保存' }).click();
  80  | 
  81  |     // Dialog should close
  82  |     await expect(page.getByText('新增会员等级')).not.toBeVisible({ timeout: 10000 });
  83  |   });
  84  | 
  85  |   // -------------------------------------------------------------------
  86  |   // 4. New level appears in list
  87  |   // -------------------------------------------------------------------
  88  |   test('newly created level appears in the list', async () => {
  89  |     await navigateToAdmin(page, '/settings/levels');
  90  | 
  91  |     await expect(page.getByText('E2E银卡会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });
  92  |     // 0.85 should render as "8.5折"
  93  |     await expect(page.getByText('8.5折').first()).toBeVisible();
  94  |   });
  95  | 
  96  |   // -------------------------------------------------------------------
  97  |   // 5. Edit existing level, change name, save
  98  |   // -------------------------------------------------------------------
  99  |   test('edit existing level and change name', async () => {
  100 |     await navigateToAdmin(page, '/settings/levels');
  101 | 
  102 |     // Wait for the table to render
> 103 |     await expect(page.getByText('普通会员', { exact: true }).first()).toBeVisible({ timeout: 10000 });
      |                                                                   ^ Error: expect(locator).toBeVisible() failed
  104 | 
  105 |     // Find the row containing "普通会员" and click its edit button.
  106 |     // Desktop view uses a table; the edit button has title="编辑".
  107 |     const levelRow = page.locator('tr', { hasText: '普通会员' }).first();
  108 |     const rowCount = await levelRow.count();
  109 | 
  110 |     if (rowCount > 0) {
  111 |       // Desktop table layout
  112 |       await levelRow.getByRole('button', { name: '编辑' }).click();
  113 |     } else {
  114 |       // Mobile card layout fallback
  115 |       const card = page.locator('div.p-4, div.divide-y > div').filter({ hasText: '普通会员' }).first();
  116 |       await card.getByRole('button', { name: '编辑' }).click();
  117 |     }
  118 | 
  119 |     // Edit dialog should open
  120 |     await expect(page.getByText('编辑会员等级')).toBeVisible({ timeout: 10000 });
  121 | 
  122 |     // Change the name
  123 |     const nameInput = page.getByPlaceholder('如：普通会员、银卡、金卡');
  124 |     await nameInput.clear();
  125 |     await nameInput.fill('普通会员-已编辑');
  126 | 
  127 |     // Save
  128 |     await page.getByRole('button', { name: '保存' }).click();
  129 | 
  130 |     // Dialog should close and updated name visible
  131 |     await expect(page.getByText('编辑会员等级')).not.toBeVisible({ timeout: 10000 });
  132 |     await expect(page.getByText('普通会员-已编辑')).toBeVisible({ timeout: 10000 });
  133 |   });
  134 | });
  135 | 
```