import { type Page } from '@playwright/test';

export const SHOP_PHONE = '13900000001';
export const SHOP_PASSWORD = 'owner123';
export const PLATFORM_PHONE = '13800000000';
export const PLATFORM_PASSWORD = 'admin123';

const API = 'http://localhost:4000/api/v1';

async function apiLogin(
  page: Page,
  endpoint: string,
  payload: Record<string, string>,
): Promise<Record<string, unknown>> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await page.request.post(`${API}${endpoint}`, { data: payload });
    const body = await res.json();
    if (body.code === 0) return body.data;
    if (res.status() === 429 && attempt < 2) {
      await page.waitForTimeout(3000);
      continue;
    }
    throw new Error(`Login failed (${endpoint}): ${body.message}`);
  }
  throw new Error(`Login failed after retries (${endpoint})`);
}

export async function shopLogin(page: Page) {
  const data = await apiLogin(page, '/auth/login', {
    phone: SHOP_PHONE,
    password: SHOP_PASSWORD,
  });

  await page.goto('/login');
  await page.evaluate((d) => {
    localStorage.setItem('accessToken', d.accessToken as string);
    localStorage.setItem('refreshToken', d.refreshToken as string);
    localStorage.setItem('staffId', d.staffId as string);
    localStorage.setItem('shopId', d.shopId as string);
    localStorage.setItem('role', d.role as string);
  }, data);
  await page.goto('/admin');
  await page.waitForLoadState('networkidle');
}

export async function platformLogin(page: Page) {
  const data = await apiLogin(page, '/platform/auth/login', {
    phone: PLATFORM_PHONE,
    password: PLATFORM_PASSWORD,
  });

  await page.goto('/platform/login');
  await page.evaluate((d) => {
    localStorage.setItem('accessToken', d.accessToken as string);
    localStorage.setItem('refreshToken', d.refreshToken as string);
    localStorage.setItem('adminId', (d.adminId ?? '') as string);
    localStorage.setItem('role', d.role as string);
    localStorage.setItem('authType', 'platform');
  }, data);
  await page.goto('/platform/dashboard');
  await page.waitForLoadState('networkidle');
}

export async function navigateToAdmin(page: Page, path: string) {
  await page.goto(`/admin${path}`);
  await page.waitForLoadState('networkidle');
}

export async function navigateToMobile(page: Page, path: string) {
  await page.goto(`/m${path}`);
  await page.waitForLoadState('networkidle');
}
