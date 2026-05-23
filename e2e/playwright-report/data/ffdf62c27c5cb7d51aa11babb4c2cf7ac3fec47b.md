# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.ui-spec.ts >> Shop login flow >> invalid credentials show error message
- Location: e2e/auth.ui-spec.ts:61:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText(/错误|失败|Invalid/)
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByText(/错误|失败|Invalid/)

```

```yaml
- heading "HaircutMS" [level=1]
- paragraph: 理发店管理系统
- button "店铺登录"
- button "平台登录"
- text: 请求过于频繁，请稍后再试 手机号
- textbox "手机号":
  - /placeholder: 请输入手机号
  - text: "00000000000"
- text: 密码
- textbox "密码":
  - /placeholder: 请输入密码
  - text: wrongpassword
- button "登录"
- alert
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import {
  3   |   shopLogin,
  4   |   platformLogin,
  5   |   SHOP_PHONE,
  6   |   SHOP_PASSWORD,
  7   |   PLATFORM_PHONE,
  8   |   PLATFORM_PASSWORD,
  9   | } from './helpers/ui-helpers';
  10  | 
  11  | test.describe('Login page rendering and defaults', () => {
  12  |   test('renders with shop tab active, shows phone/password inputs', async ({ page }) => {
  13  |     await page.goto('/login');
  14  |     await page.waitForLoadState('networkidle');
  15  | 
  16  |     // Shop tab is active by default
  17  |     const shopTab = page.getByText('店铺登录');
  18  |     await expect(shopTab).toBeVisible();
  19  |     const platformTab = page.getByText('平台登录');
  20  |     await expect(platformTab).toBeVisible();
  21  | 
  22  |     // Shop-specific data-testid inputs are visible
  23  |     await expect(page.getByTestId('shop-phone-input')).toBeVisible();
  24  |     await expect(page.getByTestId('shop-password-input')).toBeVisible();
  25  |     await expect(page.getByTestId('shop-login-button')).toBeVisible();
  26  |   });
  27  | 
  28  |   test('default shows shop tab (shop inputs present)', async ({ page }) => {
  29  |     await page.goto('/login');
  30  |     await page.waitForLoadState('networkidle');
  31  | 
  32  |     // The shop phone input has data-testid="shop-phone-input" only when shop tab is active
  33  |     await expect(page.getByTestId('shop-phone-input')).toBeVisible();
  34  |     await expect(page.getByTestId('shop-password-input')).toBeVisible();
  35  |     await expect(page.getByTestId('shop-login-button')).toBeVisible();
  36  |     // Platform inputs should NOT be present
  37  |     await expect(page.getByTestId('platform-phone-input')).not.toBeVisible();
  38  |     await expect(page.getByTestId('platform-password-input')).not.toBeVisible();
  39  |     await expect(page.getByTestId('platform-login-button')).not.toBeVisible();
  40  |   });
  41  | });
  42  | 
  43  | test.describe('Shop login flow', () => {
  44  |   test('valid credentials redirect to /admin and store token', async ({ page }) => {
  45  |     await page.goto('/login');
  46  |     await page.waitForLoadState('networkidle');
  47  | 
  48  |     await page.getByTestId('shop-phone-input').fill(SHOP_PHONE);
  49  |     await page.getByTestId('shop-password-input').fill(SHOP_PASSWORD);
  50  |     await page.getByTestId('shop-login-button').click();
  51  | 
  52  |     await expect(page).toHaveURL('/admin', { timeout: 10000 });
  53  | 
  54  |     const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  55  |     expect(token).toBeTruthy();
  56  | 
  57  |     const authType = await page.evaluate(() => localStorage.getItem('authType'));
  58  |     expect(authType).toBe('shop');
  59  |   });
  60  | 
  61  |   test('invalid credentials show error message', async ({ page }) => {
  62  |     await page.goto('/login');
  63  |     await page.waitForLoadState('networkidle');
  64  | 
  65  |     await page.getByTestId('shop-phone-input').fill('00000000000');
  66  |     await page.getByTestId('shop-password-input').fill('wrongpassword');
  67  |     await page.getByTestId('shop-login-button').click();
  68  | 
> 69  |     await expect(page.getByText(/错误|失败|Invalid/)).toBeVisible({ timeout: 10000 });
      |                                                   ^ Error: expect(locator).toBeVisible() failed
  70  |     // Should still be on login page
  71  |     await expect(page).toHaveURL('/login');
  72  |   });
  73  | });
  74  | 
  75  | test.describe('Platform tab switch and login', () => {
  76  |   test('switching to platform tab shows platform inputs, hides shop inputs', async ({ page }) => {
  77  |     await page.goto('/login');
  78  |     await page.waitForLoadState('networkidle');
  79  | 
  80  |     // Shop inputs visible initially
  81  |     await expect(page.getByTestId('shop-phone-input')).toBeVisible();
  82  | 
  83  |     // Switch to platform tab
  84  |     await page.getByText('平台登录').click();
  85  | 
  86  |     // Now platform inputs should be visible, shop inputs hidden
  87  |     await expect(page.getByTestId('platform-phone-input')).toBeVisible();
  88  |     await expect(page.getByTestId('platform-password-input')).toBeVisible();
  89  |     await expect(page.getByTestId('platform-login-button')).toBeVisible();
  90  |     await expect(page.getByTestId('shop-phone-input')).not.toBeVisible();
  91  |     await expect(page.getByTestId('shop-password-input')).not.toBeVisible();
  92  |   });
  93  | 
  94  |   test('platform login via /platform/login redirects to platform dashboard with authType', async ({ page }) => {
  95  |     await page.goto('/platform/login');
  96  |     await page.waitForLoadState('networkidle');
  97  | 
  98  |     await page.getByPlaceholder('请输入手机号').fill(PLATFORM_PHONE);
  99  |     await page.getByPlaceholder('请输入密码').fill(PLATFORM_PASSWORD);
  100 |     await page.locator('button[type="submit"]').click();
  101 | 
  102 |     await expect(page).toHaveURL(/\/platform\/(dashboard|overview|shops|licenses)/, { timeout: 10000 });
  103 | 
  104 |     const token = await page.evaluate(() => localStorage.getItem('accessToken'));
  105 |     expect(token).toBeTruthy();
  106 | 
  107 |     const authType = await page.evaluate(() => localStorage.getItem('authType'));
  108 |     expect(authType).toBe('platform');
  109 |   });
  110 | });
  111 | 
  112 | test.describe('Auth guard - unauthenticated access', () => {
  113 |   test('unauthenticated /admin redirects to /login', async ({ page }) => {
  114 |     await page.goto('/admin');
  115 |     await page.waitForLoadState('networkidle');
  116 | 
  117 |     await expect(page).toHaveURL('/login', { timeout: 10000 });
  118 |   });
  119 | 
  120 |   test('unauthenticated /platform/dashboard redirects to /platform/login', async ({ page }) => {
  121 |     await page.goto('/platform/dashboard');
  122 |     await page.waitForLoadState('networkidle');
  123 | 
  124 |     await expect(page).toHaveURL('/platform/login', { timeout: 10000 });
  125 |   });
  126 | });
  127 | 
  128 | test.describe('Shop session management', () => {
  129 |   test.describe.configure({ mode: 'serial' });
  130 | 
  131 |   let page: Page;
  132 | 
  133 |   test.beforeAll(async ({ browser }) => {
  134 |     page = await browser.newPage();
  135 |     await shopLogin(page);
  136 |   });
  137 | 
  138 |   test.afterAll(async () => {
  139 |     await page.close();
  140 |   });
  141 | 
  142 |   test('shop logout clears localStorage and redirects to login', async () => {
  143 |     // Verify we are authenticated
  144 |     await page.goto('/admin');
  145 |     await page.waitForLoadState('networkidle');
  146 |     await expect(page.getByRole('heading', { name: '工作台' })).toBeVisible({ timeout: 10000 });
  147 | 
  148 |     // Clear localStorage manually (mimics logout behavior)
  149 |     await page.evaluate(() => {
  150 |       localStorage.removeItem('accessToken');
  151 |       localStorage.removeItem('refreshToken');
  152 |       localStorage.removeItem('authType');
  153 |       localStorage.removeItem('shopId');
  154 |       localStorage.removeItem('staffId');
  155 |       localStorage.removeItem('role');
  156 |     });
  157 | 
  158 |     // Navigate to admin - should redirect to login
  159 |     await page.goto('/admin');
  160 |     await page.waitForLoadState('networkidle');
  161 |     await expect(page).toHaveURL('/login', { timeout: 10000 });
  162 |   });
  163 | 
  164 |   test('invalid token in localStorage redirects to login on navigation', async ({ browser }) => {
  165 |     const freshPage = await browser.newPage();
  166 | 
  167 |     // Set an invalid token
  168 |     await freshPage.goto('/login');
  169 |     await freshPage.evaluate(() => {
```