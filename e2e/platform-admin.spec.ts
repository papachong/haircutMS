/**
 * E2E: Platform Admin Flow
 *
 * Covers:
 * 1. Login as platform admin
 * 2. Create a new shop
 * 3. Verify shop appears in shop list
 * 4. Assign a license to the shop
 * 5. View shop details (member count, staff count)
 * 6. Suspend a shop
 * 7. Verify suspended shop's staff cannot login
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  type ApiResponse,
} from './fixtures';

/** Platform admin credentials from env or defaults */
const platformPhone = process.env.E2E_PLATFORM_PHONE ?? '18800000001';
const platformPassword =
  process.env.E2E_PLATFORM_PASSWORD ?? 'admin123456';

test.describe('Platform admin flow', () => {
  let platformToken: string;

  /** Helper: login as platform admin and return token */
  async function loginPlatformAdmin(request: APIRequestContext) {
    const res = await request.post('/api/v1/platform/auth/login', {
      data: { phone: platformPhone, password: platformPassword },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.accessToken).toBeTruthy();
    return json.data.accessToken;
  }

  test('login as platform admin', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    // Verify token works by accessing /me
    const meRes = await request.get('/api/v1/platform/auth/me', {
      headers: authHeader(platformToken),
    });
    expect(meRes.status()).toBe(200);

    const meJson: ApiResponse<{
      id: string;
      name: string;
      role: string;
    }> = await meRes.json();
    expect(meJson.code).toBe(0);
    expect(meJson.data.id).toBeTruthy();
  });

  let shopId: string;
  const shopName = `E2E测试店铺_${Date.now()}`;
  const ownerPhone = uniquePhone();

  test('create a new shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.post('/platform/shops', {
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

    const json: ApiResponse<{
      id: string;
      name: string;
      status: string;
    }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toBe(shopName);
    expect(json.data.status).toBe('ACTIVE');

    shopId = json.data.id;
  });

  test('verify shop appears in shop list', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get('/platform/shops', {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{ id: string; name: string; status: string }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    const found = json.data.items.find((s) => s.id === shopId);
    expect(found).toBeTruthy();
    expect(found!.name).toBe(shopName);
    expect(found!.status).toBe('ACTIVE');
  });

  test('assign a license to the shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    // Get plan defaults first
    const defaultsRes = await request.get('/platform/licenses/plan-defaults', {
      headers: authHeader(platformToken),
    });
    expect(defaultsRes.status()).toBe(200);

    const defaultsJson: ApiResponse<{
      plans: Array<{
        plan: string;
        staffLimit: number;
        membersLimit: number;
        modules: string[];
      }>;
      availableModules: Array<{ id: string; name: string }>;
    }> = await defaultsJson.json();
    expect(defaultsJson.code).toBe(0);

    // Create license
    const res = await request.post('/platform/licenses', {
      headers: authHeader(platformToken),
      data: {
        shopId,
        plan: 'PRO',
        staffLimit: 10,
        membersLimit: 200,
        modules: ['member', 'order', 'recharge', 'pass-card', 'coupon'],
        durationDays: 365,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      shopId: string;
      plan: string;
      status: string;
    }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.shopId).toBe(shopId);
    expect(json.data.plan).toBe('PRO');
  });

  test('view shop details with member and staff count', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get(`/platform/shops/${shopId}`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      name: string;
      status: string;
      staffCount: number;
      memberCount: number;
      license: { plan: string; status: string };
      owner: { id: string; name: string; phone: string; isActive: boolean };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBe(shopId);
    expect(json.data.name).toBe(shopName);
    expect(json.data.license).toBeTruthy();
    expect(json.data.license.plan).toBe('PRO');
    // New shop should have 0 or 1 members (owner account created)
    expect(json.data.memberCount).toBeGreaterThanOrEqual(0);
    expect(json.data.staffCount).toBeGreaterThanOrEqual(0);
  });

  test('suspend a shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.patch(`/platform/shops/${shopId}/suspend`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('SUSPENDED');
  });

  test('suspended shop staff cannot login', async ({ request }) => {
    // The shop owner was created with ownerPhone / test1234
    const res = await request.post('/api/v1/auth/login', {
      data: { phone: ownerPhone, password: 'test1234' },
    });
    // Should fail with 401/403 because the shop is suspended
    expect(res.status()).toBeGreaterThanOrEqual(400);

    const json: ApiResponse = await res.json();
    expect(json.code).not.toBe(0);
  });

  test('activate the suspended shop', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.patch(`/platform/shops/${shopId}/activate`, {
      headers: authHeader(platformToken),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('ACTIVE');
  });

  test('platform overview statistics are accessible', async ({ request }) => {
    platformToken = await loginPlatformAdmin(request);

    const res = await request.get('/platform/overview', {
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
    expect(json.data.totalShops).toBeGreaterThanOrEqual(0);
    expect(json.data.activeShops).toBeGreaterThanOrEqual(0);
  });

  test('refresh platform admin token', async ({ request }) => {
    // Login first to get a refresh token
    const loginRes = await request.post('/api/v1/platform/auth/login', {
      data: { phone: platformPhone, password: platformPassword },
    });
    const loginJson: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = await loginRes.json();

    // Refresh
    const refreshRes = await request.post('/api/v1/platform/auth/refresh', {
      data: { refreshToken: loginJson.data.refreshToken },
    });
    expect(refreshRes.status()).toBe(200);

    const refreshJson: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = await refreshRes.json();

    expect(refreshJson.code).toBe(0);
    expect(refreshJson.data.accessToken).toBeTruthy();
  });
});
