import { test, expect } from '@playwright/test';
import { createAuthenticatedContext, authHeader, type ApiResponse } from './fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard Analytics', () => {
  let token: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13900000001', 'owner123');
    token = ctx.token;
    await ctx.context.dispose();
  });

  test('GET /dashboard/metrics returns correct structure', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/metrics?timeRange=today', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      revenue: number;
      visitorCount: number;
      averageTicket: number;
      newMembers: number;
      revenueGrowth: number;
      periodStart: string;
      periodEnd: string;
      previousPeriodRevenue: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.revenue).toBe('number');
    expect(typeof json.data.visitorCount).toBe('number');
    expect(typeof json.data.averageTicket).toBe('number');
    expect(typeof json.data.newMembers).toBe('number');
    expect(typeof json.data.revenueGrowth).toBe('number');
    expect(json.data.revenue).toBeGreaterThanOrEqual(0);
    expect(json.data.visitorCount).toBeGreaterThanOrEqual(0);
    expect(json.data.newMembers).toBeGreaterThanOrEqual(0);
  });

  test('GET /dashboard/metrics works for different time ranges', async ({ request }) => {
    const ranges = ['today', 'week', 'month'];

    for (const range of ranges) {
      const res = await request.get(`/api/v1/dashboard/metrics?timeRange=${range}`, {
        headers: authHeader(token),
      });
      expect(res.status()).toBe(200);

      const json: ApiResponse<{ revenue: number; visitorCount: number }> = await res.json();
      expect(json.code).toBe(0);
      expect(typeof json.data.revenue).toBe('number');
      expect(typeof json.data.visitorCount).toBe('number');
    }
  });

  test('GET /dashboard/trends returns array of data points', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/trends?timeRange=week', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{ date: string; revenue: number; visitors: number }>;
      granularity: string;
      totalRevenue: number;
      totalVisitors: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(typeof json.data.granularity).toBe('string');
    expect(typeof json.data.totalRevenue).toBe('number');
    expect(typeof json.data.totalVisitors).toBe('number');

    if (json.data.data.length > 0) {
      const point = json.data.data[0];
      expect(typeof point.date).toBe('string');
      expect(typeof point.revenue).toBe('number');
      expect(typeof point.visitors).toBe('number');
    }
  });

  test('GET /dashboard/revenue-breakdown returns categorized revenue data', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/revenue-breakdown?timeRange=month', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      composition: {
        offline: number;
        balance: number;
        recharge: number;
        passCard: number;
      };
      rechargeIncome: number;
      consumeIncome: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.composition.offline).toBe('number');
    expect(typeof json.data.composition.balance).toBe('number');
    expect(typeof json.data.composition.recharge).toBe('number');
    expect(typeof json.data.composition.passCard).toBe('number');
    expect(typeof json.data.rechargeIncome).toBe('number');
    expect(typeof json.data.consumeIncome).toBe('number');
    expect(json.data.composition.offline).toBeGreaterThanOrEqual(0);
    expect(json.data.composition.balance).toBeGreaterThanOrEqual(0);
    expect(json.data.composition.recharge).toBeGreaterThanOrEqual(0);
    expect(json.data.composition.passCard).toBeGreaterThanOrEqual(0);
  });

  test('GET /dashboard/service-ranking returns service performance data', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/service-ranking?timeRange=month', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      id: string;
      name: string;
      count: number;
      amount: number;
      averagePrice: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);

    if (json.data.length > 0) {
      const item = json.data[0];
      expect(typeof item.id).toBe('string');
      expect(typeof item.name).toBe('string');
      expect(typeof item.count).toBe('number');
      expect(typeof item.amount).toBe('number');
      expect(typeof item.averagePrice).toBe('number');
      expect(item.count).toBeGreaterThanOrEqual(0);
      expect(item.amount).toBeGreaterThanOrEqual(0);
    }
  });

  test('GET /dashboard/members/level-distribution returns level counts', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/level-distribution', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      levelId: string;
      levelName: string;
      count: number;
      percentage: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);

    if (json.data.length > 0) {
      const level = json.data[0];
      expect(typeof level.levelId).toBe('string');
      expect(typeof level.levelName).toBe('string');
      expect(typeof level.count).toBe('number');
      expect(typeof level.percentage).toBe('number');
      expect(level.count).toBeGreaterThanOrEqual(0);
      expect(level.percentage).toBeGreaterThanOrEqual(0);
    }
  });

  test('GET /dashboard/members/consumption-trends returns time series', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/consumption-trends?timeRange=month', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{ date: string; recharge: number; consume: number }>;
      totalRecharge: number;
      totalConsume: number;
      granularity: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(typeof json.data.totalRecharge).toBe('number');
    expect(typeof json.data.totalConsume).toBe('number');
    expect(typeof json.data.granularity).toBe('string');

    if (json.data.data.length > 0) {
      const point = json.data.data[0];
      expect(typeof point.date).toBe('string');
      expect(typeof point.recharge).toBe('number');
      expect(typeof point.consume).toBe('number');
    }
  });

  test('GET /dashboard/members/dormant-stats returns dormant member count', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/dormant-stats', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      totalCount: number;
      dormantCount: number;
      dormantPercentage: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.totalCount).toBe('number');
    expect(typeof json.data.dormantCount).toBe('number');
    expect(typeof json.data.dormantPercentage).toBe('number');
    expect(json.data.totalCount).toBeGreaterThanOrEqual(0);
    expect(json.data.dormantCount).toBeGreaterThanOrEqual(0);
    expect(json.data.dormantPercentage).toBeGreaterThanOrEqual(0);
  });

  test('GET /dashboard/members/dormant-stats respects dormantDays parameter', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/dormant-stats?dormantDays=30', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      totalCount: number;
      dormantCount: number;
      dormantPercentage: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(typeof json.data.totalCount).toBe('number');
    expect(typeof json.data.dormantCount).toBe('number');
    expect(typeof json.data.dormantPercentage).toBe('number');
  });

  test('GET /dashboard/members/daily-consumption returns daily breakdown', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/daily-consumption?days=7', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{ date: string; amount: number; count: number }>;
      totalAmount: number;
      totalCount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(typeof json.data.totalAmount).toBe('number');
    expect(typeof json.data.totalCount).toBe('number');
    expect(json.data.totalAmount).toBeGreaterThanOrEqual(0);
    expect(json.data.totalCount).toBeGreaterThanOrEqual(0);

    if (json.data.data.length > 0) {
      const day = json.data.data[0];
      expect(typeof day.date).toBe('string');
      expect(typeof day.amount).toBe('number');
      expect(typeof day.count).toBe('number');
      expect(day.amount).toBeGreaterThanOrEqual(0);
      expect(day.count).toBeGreaterThanOrEqual(0);
    }
  });

  test('GET /dashboard/members/daily-consumption defaults to 30 days', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/members/daily-consumption', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      data: Array<{ date: string; amount: number; count: number }>;
      totalAmount: number;
      totalCount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data.data)).toBe(true);
    expect(json.data.data.length).toBeLessThanOrEqual(30);
  });

  test('GET /dashboard/metrics rejects unauthenticated requests', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/metrics?timeRange=today');
    expect(res.status()).toBe(401);
  });

  test('GET /dashboard/trends rejects unauthenticated requests', async ({ request }) => {
    const res = await request.get('/api/v1/dashboard/trends?timeRange=week');
    expect(res.status()).toBe(401);
  });
});
