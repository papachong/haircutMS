import { test, expect } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Staff Management & Statistics', () => {
  let token: string;
  let ownerStaffId: string;
  let createdStaffId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13900000001', 'owner123');
    token = ctx.token;
    ownerStaffId = ctx.staffId;
    await ctx.context.dispose();
  });

  test('list staff — should have at least the owner', async ({ request }) => {
    const res = await request.get('/api/v1/staff', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      id: string;
      name: string;
      phone: string;
      role: string;
      isActive: boolean;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data.some(s => s.role === 'OWNER')).toBe(true);
  });

  test('create a new stylist staff member', async ({ request }) => {
    const res = await request.post('/api/v1/staff', {
      headers: authHeader(token),
      data: {
        name: '测试发型师',
        phone: uniquePhone(),
        password: 'test1234',
        role: 'STYLIST',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      phone: string;
      role: string;
      isActive: boolean;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBeTruthy();
    expect(json.data.name).toBe('测试发型师');
    expect(json.data.role).toBe('STYLIST');
    expect(json.data.isActive).toBe(true);

    createdStaffId = json.data.id;
  });

  test('get staff detail by id', async ({ request }) => {
    const res = await request.get(`/api/v1/staff/${createdStaffId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      name: string;
      phone: string;
      role: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBe(createdStaffId);
    expect(json.data.name).toBe('测试发型师');
    expect(json.data.role).toBe('STYLIST');
    expect(json.data.isActive).toBe(true);
    expect(json.data.createdAt).toBeTruthy();
  });

  test('update staff name', async ({ request }) => {
    const newName = uniqueName('发型师');
    const res = await request.patch(`/api/v1/staff/${createdStaffId}`, {
      headers: authHeader(token),
      data: { name: newName },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      name: string;
      role: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.name).toBe(newName);

    const verify = await request.get(`/api/v1/staff/${createdStaffId}`, {
      headers: authHeader(token),
    });
    const verifyJson: ApiResponse<{ name: string }> = await verify.json();
    expect(verifyJson.data.name).toBe(newName);
  });

  test('toggle staff inactive', async ({ request }) => {
    const res = await request.patch(`/api/v1/staff/${createdStaffId}/toggle`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      name: string;
      isActive: boolean;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.isActive).toBe(false);
  });

  test('toggle staff back to active', async ({ request }) => {
    const res = await request.patch(`/api/v1/staff/${createdStaffId}/toggle`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      name: string;
      isActive: boolean;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.isActive).toBe(true);
  });

  test('reset staff password', async ({ request }) => {
    const res = await request.post(`/api/v1/staff/${createdStaffId}/reset-password`, {
      headers: authHeader(token),
      data: { password: 'newpass123' },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; message: string }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBe(createdStaffId);
  });

  test('get staff stats list', async ({ request }) => {
    const res = await request.get('/api/v1/staff-stats', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      staffId: string;
      staffName: string;
      staffRole: string;
      totalServices: number;
      totalRevenue: number;
      serviceTypeDistribution: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        revenue: number;
      }>;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data[0]).toHaveProperty('staffId');
    expect(json.data[0]).toHaveProperty('staffName');
    expect(json.data[0]).toHaveProperty('staffRole');
    expect(typeof json.data[0].totalServices).toBe('number');
    expect(typeof json.data[0].totalRevenue).toBe('number');
    expect(Array.isArray(json.data[0].serviceTypeDistribution)).toBe(true);
  });

  test('get staff stats list with date range', async ({ request }) => {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = now.toISOString().split('T')[0];

    const res = await request.get(`/api/v1/staff-stats?startDate=${startDate}&endDate=${endDate}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      staffId: string;
      totalServices: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
  });

  test('get individual staff stats', async ({ request }) => {
    const res = await request.get(`/api/v1/staff-stats/staff/${ownerStaffId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      staffId: string;
      staffName: string;
      staffRole: string;
      totalServices: number;
      totalRevenue: number;
      serviceTypeDistribution: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        revenue: number;
      }>;
    } | null> = await res.json();

    expect(json.code).toBe(0);
    if (json.data) {
      expect(json.data.staffId).toBe(ownerStaffId);
      expect(typeof json.data.totalServices).toBe('number');
      expect(typeof json.data.totalRevenue).toBe('number');
      expect(Array.isArray(json.data.serviceTypeDistribution)).toBe(true);
    }
  });

  test('get individual staff stats for created staff', async ({ request }) => {
    const res = await request.get(`/api/v1/staff-stats/staff/${createdStaffId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      staffId: string;
      staffName: string;
      totalServices: number;
      totalRevenue: number;
    } | null> = await res.json();

    expect(json.code).toBe(0);
    if (json.data) {
      expect(json.data.staffId).toBe(createdStaffId);
      expect(typeof json.data.totalServices).toBe('number');
    }
  });

  test('get my summary', async ({ request }) => {
    const res = await request.get('/api/v1/staff-stats/my/summary', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      staffId: string;
      staffName: string;
      staffRole: string;
      totalServices: number;
      totalRevenue: number;
      serviceTypeDistribution: Array<{
        categoryId: string;
        categoryName: string;
        count: number;
        revenue: number;
      }>;
    } | null> = await res.json();

    expect(json.code).toBe(0);
    if (json.data) {
      expect(json.data.staffId).toBe(ownerStaffId);
      expect(typeof json.data.totalServices).toBe('number');
      expect(typeof json.data.totalRevenue).toBe('number');
      expect(Array.isArray(json.data.serviceTypeDistribution)).toBe(true);
    }
  });

  test('get my trends', async ({ request }) => {
    const res = await request.get('/api/v1/staff-stats/my/trends?timeRange=week', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{
      date: string;
      count: number;
      revenue: number;
    }>> = await res.json();

    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    if (json.data.length > 0) {
      expect(json.data[0]).toHaveProperty('date');
      expect(typeof json.data[0].count).toBe('number');
      expect(typeof json.data[0].revenue).toBe('number');
    }
  });

  test('cleanup — toggle test staff inactive', async ({ request }) => {
    const res = await request.patch(`/api/v1/staff/${createdStaffId}/toggle`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; isActive: boolean }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.isActive).toBe(false);
  });
});
