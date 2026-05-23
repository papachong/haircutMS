import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

const platformPhone = process.env.E2E_PLATFORM_PHONE ?? '13800000000';
const platformPassword = process.env.E2E_PLATFORM_PASSWORD ?? 'admin123';

test.describe('Platform admin flow', () => {
  test.describe.configure({ mode: 'serial' });

  let platformToken: string;
  let shopId: string;
  const shopName = `E2E测试店铺_${Date.now()}`;
  const ownerPhone = uniquePhone();

  async function loginPlatformAdmin(request: APIRequestContext) {
    const res = await request.post('/api/v1/platform/auth/login', {
      data: { phone: platformPhone, password: platformPassword },
    });
    expect([200, 201]).toContain(res.status());
    const json: ApiResponse<{ accessToken: string; refreshToken: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.accessToken).toBeTruthy();
    return json.data.accessToken;
  }

  test('login as platform admin', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const meRes = await request.get('/api/v1/platform/auth/me', {
      headers: authHeader(platformToken),
    });
    expect(meRes.status()).toBe(200);
    const meJson: ApiResponse<{ id: string; role: string }> = await meRes.json();
    expect(meJson.code).toBe(0);
    expect(meJson.data.id).toBeTruthy();
  });

  test('create a new shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.post('/api/v1/platform/shops', {
      headers: authHeader(platformToken),
      data: {
        name: shopName,
        phone: '021-98765432',
        address: '上海市测试区E2E路1号',
        businessHours: '09:00-21:00',
        ownerName: 'E2E店主',
        ownerPhone,
        ownerPassword: 'test1234',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ id: string; name: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toBe(shopName);
    expect(json.data.status).toBe('ACTIVE');
    shopId = json.data.id;
  });

  test('verify shop appears in shop list', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get('/api/v1/platform/shops', {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ data: Array<{ id: string; name: string; status: string }>; total: number }> = await res.json();
    expect(json.code).toBe(0);

    const shops = Array.isArray(json.data) ? json.data : (json.data as any).data;
    const found = shops.find((s: any) => s.id === shopId);
    expect(found).toBeTruthy();
    expect(found!.name).toBe(shopName);
    expect(found!.status).toBe('ACTIVE');
  });

  test('assign a license to the shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const defaultsRes = await request.get('/api/v1/platform/licenses/plan-defaults', {
      headers: authHeader(platformToken),
    });
    expect(defaultsRes.status()).toBe(200);

    const defaultsJson: ApiResponse<{
      plans: Array<{ plan: string; staffLimit: number; membersLimit: number; modules: string[] }>;
      availableModules: Array<{ id: string; name: string }>;
    }> = await defaultsRes.json();
    expect(defaultsJson.code).toBe(0);

    const res = await request.post('/api/v1/platform/licenses', {
      headers: authHeader(platformToken),
      data: {
        shopId,
        plan: 'PRO',
        staffLimit: 10,
        membersLimit: 200,
        modules: ['member', 'order', 'recharge', 'pass-card', 'coupon'],
        durationMonths: 12,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ shopId: string; plan: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.shopId).toBe(shopId);
    expect(json.data.plan).toBe('PRO');
  });

  test('view shop details', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get(`/api/v1/platform/shops/${shopId}`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; name: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.id).toBe(shopId);
    expect(json.data.name).toBe(shopName);
  });

  test('suspend a shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.patch(`/api/v1/platform/shops/${shopId}/suspend`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('SUSPENDED');
  });

  test('suspended shop staff cannot login', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { phone: ownerPhone, password: 'test1234' },
    });
    expect(res.status()).toBeGreaterThanOrEqual(400);

    const json: ApiResponse = await res.json();
    expect(json.code).not.toBe(0);
  });

  test('activate the suspended shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.patch(`/api/v1/platform/shops/${shopId}/activate`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('ACTIVE');
  });

  test('archive a shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.patch(`/api/v1/platform/shops/${shopId}/archive`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('ARCHIVED');
  });

  test('platform overview statistics', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get('/api/v1/platform/overview', {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      totalShops: number;
      activeShops: number;
      totalMembers: number;
      totalOrders: number;
      totalRevenue: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.totalShops).toBe('number');
    expect(typeof json.data.activeShops).toBe('number');
  });

  test('refresh platform admin token', async ({ request }) => {
    const loginRes = await request.post('/api/v1/platform/auth/login', {
      data: { phone: platformPhone, password: platformPassword },
    });
    const loginJson: ApiResponse<{ accessToken: string; refreshToken: string }> = await loginRes.json();

    const refreshRes = await request.post('/api/v1/platform/auth/refresh', {
      data: { refreshToken: loginJson.data.refreshToken },
    });
    expect(refreshRes.status()).toBe(200);

    const refreshJson: ApiResponse<{ accessToken: string; refreshToken: string }> = await refreshRes.json();
    expect(refreshJson.code).toBe(0);
    expect(refreshJson.data.accessToken).toBeTruthy();
  });
});
