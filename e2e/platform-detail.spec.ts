import { test, expect, type APIRequestContext } from '@playwright/test';
import { authHeader, uniquePhone, type ApiResponse } from './fixtures';

const platformPhone = process.env.E2E_PLATFORM_PHONE ?? '13800000000';
const platformPassword = process.env.E2E_PLATFORM_PASSWORD ?? 'admin123';

async function loginPlatform(request: APIRequestContext): Promise<string> {
  const res = await request.post('/api/v1/platform/auth/login', {
    data: { phone: platformPhone, password: platformPassword },
  });
  const json: ApiResponse<{ accessToken: string }> = await res.json();
  expect(json.code).toBe(0);
  return json.data.accessToken;
}

test.describe.configure({ mode: 'serial' });

test.describe('Platform detail endpoints', () => {
  let token: string;

  test.beforeAll(async ({ request }) => {
    token = await loginPlatform(request);
  });

  test('overview returns all stat fields', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      totalShops: number;
      activeShops: number;
      suspendedShops: number;
      archivedShops: number;
      totalMembers: number;
      totalOrders: number;
      totalRevenue: number;
      revenueThisMonth: number;
      ordersThisMonth: number;
      activeShopsThisMonth: number;
      shopGrowthRate: number;
      activeShopGrowthRate: number;
      revenueGrowthRate: number;
      memberGrowthRate: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.totalShops).toBe('number');
    expect(typeof json.data.activeShops).toBe('number');
    expect(typeof json.data.suspendedShops).toBe('number');
    expect(typeof json.data.archivedShops).toBe('number');
    expect(typeof json.data.totalMembers).toBe('number');
    expect(typeof json.data.totalOrders).toBe('number');
    expect(typeof json.data.totalRevenue).toBe('number');
    expect(typeof json.data.revenueThisMonth).toBe('number');
    expect(typeof json.data.ordersThisMonth).toBe('number');
    expect(typeof json.data.activeShopsThisMonth).toBe('number');
    expect(typeof json.data.shopGrowthRate).toBe('number');
    expect(typeof json.data.activeShopGrowthRate).toBe('number');
    expect(typeof json.data.revenueGrowthRate).toBe('number');
    expect(typeof json.data.memberGrowthRate).toBe('number');
    expect(json.data.totalShops).toBeGreaterThanOrEqual(0);
    expect(json.data.activeShops).toBeGreaterThanOrEqual(0);
  });

  test('top revenue shops returns array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview/top-revenue?limit=5', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      shopId: string;
      shopName: string;
      totalRevenue: number;
      orderCount: number;
      memberCount: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      expect(typeof json.data[0].shopId).toBe('string');
      expect(typeof json.data[0].shopName).toBe('string');
      expect(typeof json.data[0].totalRevenue).toBe('number');
      expect(typeof json.data[0].orderCount).toBe('number');
      expect(typeof json.data[0].memberCount).toBe('number');
    }
  });

  test('shop usage statistics returns array with expected fields', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview/shop-usage', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      shopId: string;
      shopName: string;
      phone: string | null;
      status: string;
      staffCount: number;
      memberCount: number;
      orderCount: number;
      totalRevenue: number;
      storageUsage: number;
      lastActiveAt: string | null;
      createdAt: string;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      const shop = json.data[0];
      expect(typeof shop.shopId).toBe('string');
      expect(typeof shop.shopName).toBe('string');
      expect(typeof shop.status).toBe('string');
      expect(typeof shop.staffCount).toBe('number');
      expect(typeof shop.memberCount).toBe('number');
      expect(typeof shop.orderCount).toBe('number');
      expect(typeof shop.totalRevenue).toBe('number');
      expect(typeof shop.storageUsage).toBe('number');
    }
  });

  test('new shops trend returns date/count array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview/trend/new-shops?days=30', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ date: string; count: number }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(30);
    const entry = json.data[0];
    expect(typeof entry.date).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)).toBe(true);
    expect(typeof entry.count).toBe('number');
  });

  test('revenue trend returns date/revenue array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview/trend/revenue?days=30', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      date: string;
      revenue: number;
      orderCount: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBe(30);
    const entry = json.data[0];
    expect(typeof entry.date).toBe('string');
    expect(/^\d{4}-\d{2}-\d{2}$/.test(entry.date)).toBe(true);
    expect(typeof entry.revenue).toBe('number');
    expect(typeof entry.orderCount).toBe('number');
  });

  test('expiring licenses returns array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/overview/expiring-licenses?days=15', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      shopId: string;
      shopName: string;
      shopPhone: string | null;
      licensePlan: string;
      expiresAt: string;
      daysUntilExpiry: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      const item = json.data[0];
      expect(typeof item.shopId).toBe('string');
      expect(typeof item.shopName).toBe('string');
      expect(typeof item.licensePlan).toBe('string');
      expect(typeof item.daysUntilExpiry).toBe('number');
    }
  });

  test('list all licenses returns array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/licenses', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      id: string;
      shopId: string;
      shopName: string;
      licenseKey: string;
      plan: string;
      staffLimit: number;
      membersLimit: number;
      modules: string[];
      expiresAt: string;
      daysUntilExpiry: number;
      isExpiringSoon: boolean;
      isExpired: boolean;
      status: string;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      const lic = json.data[0];
      expect(typeof lic.id).toBe('string');
      expect(typeof lic.shopId).toBe('string');
      expect(typeof lic.plan).toBe('string');
      expect(typeof lic.status).toBe('string');
      expect(['ACTIVE', 'EXPIRING_SOON', 'EXPIRED']).toContain(lic.status);
    }
  });

  test('plan defaults returns plan configuration', async ({ request }) => {
    const res = await request.get('/api/v1/platform/licenses/plan-defaults', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      plans: Array<{
        plan: string;
        staffLimit: number;
        membersLimit: number;
        modules: string[];
      }>;
      availableModules: Array<{ id: string; name: string }>;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.plans)).toBe(true);
    expect(json.data.plans.length).toBeGreaterThan(0);
    const plan = json.data.plans[0];
    expect(typeof plan.plan).toBe('string');
    expect(typeof plan.staffLimit).toBe('number');
    expect(typeof plan.membersLimit).toBe('number');
    expect(Array.isArray(plan.modules)).toBe(true);
    expect(Array.isArray(json.data.availableModules)).toBe(true);
    if (json.data.availableModules.length > 0) {
      expect(typeof json.data.availableModules[0].id).toBe('string');
      expect(typeof json.data.availableModules[0].name).toBe('string');
    }
  });

  test('expiring shops list returns array', async ({ request }) => {
    const res = await request.get('/api/v1/platform/licenses/expiring/list', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      id: string;
      name: string;
      phone: string | null;
      licensePlan: string;
      expiresAt: string;
      daysUntilExpiry: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      const item = json.data[0];
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.licensePlan).toBe('string');
      expect(typeof item.daysUntilExpiry).toBe('number');
    }
  });

  test('platform stats returns summary', async ({ request }) => {
    const res = await request.get('/api/v1/platform/stats', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      totalShops: number;
      activeShops: number;
      suspendedShops: number;
      archivedShops: number;
      totalRevenue: number;
      totalMembers: number;
      totalOrders: number;
      expiringSoonCount: number;
      expiredCount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.totalShops).toBe('number');
    expect(typeof json.data.activeShops).toBe('number');
    expect(typeof json.data.suspendedShops).toBe('number');
    expect(typeof json.data.archivedShops).toBe('number');
    expect(typeof json.data.totalRevenue).toBe('number');
    expect(typeof json.data.totalMembers).toBe('number');
    expect(typeof json.data.totalOrders).toBe('number');
    expect(typeof json.data.expiringSoonCount).toBe('number');
    expect(typeof json.data.expiredCount).toBe('number');
    expect(json.data.totalShops).toBeGreaterThanOrEqual(0);
  });

  test('shop list returns data, total, and stats', async ({ request }) => {
    const res = await request.get('/api/v1/platform/shops', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{
        id: string;
        name: string;
        phone: string | null;
        status: string;
        staffCount: number;
        memberCount: number;
        licenseStatus: string;
        createdAt: string;
        updatedAt: string;
      }>;
      total: number;
      stats: {
        total: number;
        active: number;
        suspended: number;
        archived: number;
      };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(typeof json.data.total).toBe('number');
    expect(typeof json.data.stats.total).toBe('number');
    expect(typeof json.data.stats.active).toBe('number');
    expect(typeof json.data.stats.suspended).toBe('number');
    expect(typeof json.data.stats.archived).toBe('number');
    if (json.data.data.length > 0) {
      const shop = json.data.data[0];
      expect(typeof shop.id).toBe('string');
      expect(typeof shop.name).toBe('string');
      expect(['ACTIVE', 'SUSPENDED', 'ARCHIVED']).toContain(shop.status);
      expect(['FREE', 'PAID', 'EXPIRED']).toContain(shop.licenseStatus);
    }
  });
});

test.describe('Shop archive flow', () => {
  let token: string;
  let shopId: string;

  test.beforeAll(async ({ request }) => {
    token = await loginPlatform(request);
  });

  test('create a shop for archive test', async ({ request }) => {
    const res = await request.post('/api/v1/platform/shops', {
      headers: authHeader(token),
      data: {
        name: `E2E_Archive_${Date.now()}`,
        phone: '021-00001111',
        address: 'Archive Test Address',
        businessHours: '10:00-20:00',
        ownerName: 'ArchiveOwner',
        ownerPhone: uniquePhone(),
        ownerPassword: 'test1234',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ id: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.id).toBeTruthy();
    expect(json.data.status).toBe('ACTIVE');
    shopId = json.data.id;
  });

  test('archive the shop', async ({ request }) => {
    const res = await request.patch(`/platform/shops/${shopId}/archive`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; status: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.status).toBe('ARCHIVED');
  });

  test('verify archived shop appears with ARCHIVED status', async ({ request }) => {
    const res = await request.get('/platform/shops?status=ARCHIVED', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{ id: string; status: string }>;
      total: number;
      stats: { archived: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    const found = json.data.data.find((s) => s.id === shopId);
    expect(found).toBeTruthy();
    expect(found!.status).toBe('ARCHIVED');
  });
});

test.describe('Platform endpoints auth guard', () => {
  const protectedEndpoints: Array<{ method: 'GET' | 'PATCH' | 'POST'; url: string; body?: Record<string, unknown> }> = [
    { method: 'GET', url: '/api/v1/platform/overview' },
    { method: 'GET', url: '/api/v1/platform/overview/top-revenue?limit=5' },
    { method: 'GET', url: '/api/v1/platform/overview/shop-usage' },
    { method: 'GET', url: '/api/v1/platform/overview/trend/new-shops?days=7' },
    { method: 'GET', url: '/api/v1/platform/overview/trend/revenue?days=7' },
    { method: 'GET', url: '/api/v1/platform/overview/expiring-licenses?days=15' },
    { method: 'GET', url: '/api/v1/platform/licenses' },
    { method: 'GET', url: '/api/v1/platform/licenses/plan-defaults' },
    { method: 'GET', url: '/api/v1/platform/licenses/expiring/list' },
    { method: 'GET', url: '/api/v1/platform/stats' },
    { method: 'GET', url: '/api/v1/platform/shops' },
  ];

  for (const endpoint of protectedEndpoints) {
    test(`${endpoint.method} ${endpoint.url} returns 401 without token`, async ({ request }) => {
      let res;
      if (endpoint.method === 'GET') {
        res = await request.get(endpoint.url);
      } else if (endpoint.method === 'PATCH') {
        res = await request.patch(endpoint.url, { data: endpoint.body });
      } else {
        res = await request.post(endpoint.url, { data: endpoint.body });
      }
      expect(res.status()).toBe(401);
    });
  }
});
