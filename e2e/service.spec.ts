import { test, expect } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe.configure({ mode: 'serial' });

test.describe('Service category and item management', () => {
  let token: string;

  test.beforeAll(async () => {
    try {
      const ctx = await createAuthenticatedContext('13900000001', 'owner123');
      token = ctx.token;
      await ctx.context.dispose();
    } catch {
      const ctx = await createAuthenticatedContext('13800000001', '123456');
      token = ctx.token;
      await ctx.context.dispose();
    }
  });

  let categoryId: string;
  let itemId: string;
  let secondItemId: string;

  test('create a service category', async ({ request }) => {
    const res = await request.post('/api/v1/service-categories', {
      headers: authHeader(token),
      data: { name: uniqueName('剪发类'), sortOrder: 1 },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ id: string; name: string; sortOrder: number }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toContain('剪发类');
    expect(json.data.sortOrder).toBe(1);

    categoryId = json.data.id;
  });

  test('list categories and verify the new one exists', async ({ request }) => {
    const res = await request.get('/api/v1/service-categories', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<
      Array<{ id: string; name: string; sortOrder: number }>
    > = await res.json();
    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);

    const found = json.data.find((c) => c.id === categoryId);
    expect(found).toBeDefined();
    expect(found!.name).toContain('剪发类');
  });

  test('update category name', async ({ request }) => {
    const updatedName = uniqueName('烫染类');
    const res = await request.patch(
      `/api/v1/service-categories/${categoryId}`,
      {
        headers: authHeader(token),
        data: { name: updatedName },
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; name: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toBe(updatedName);
  });

  test('create a service item under the category', async ({ request }) => {
    const res = await request.post('/api/v1/service-items', {
      headers: authHeader(token),
      data: {
        name: '男士精剪',
        categoryId,
        price: 6000,
        duration: 30,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      price: number;
      duration: number;
      isActive: boolean;
      categoryId: string;
    }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toBe('男士精剪');
    expect(json.data.price).toBe(6000);
    expect(json.data.duration).toBe(30);
    expect(json.data.isActive).toBe(true);
    expect(json.data.categoryId).toBe(categoryId);

    itemId = json.data.id;
  });

  test('list service items and verify the new one exists', async ({
    request,
  }) => {
    const res = await request.get('/api/v1/service-items', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<
      Array<{
        id: string;
        name: string;
        price: number;
        category: { id: string; name: string };
      }>
    > = await res.json();
    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);

    const found = json.data.find((i) => i.id === itemId);
    expect(found).toBeDefined();
    expect(found!.name).toBe('男士精剪');
    expect(found!.price).toBe(6000);
    expect(found!.category.id).toBe(categoryId);
  });

  test('filter service items by categoryId', async ({ request }) => {
    const res = await request.get(
      `/api/v1/service-items?categoryId=${categoryId}`,
      {
        headers: authHeader(token),
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ id: string; categoryId: string }>> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    for (const item of json.data) {
      expect(item.categoryId).toBe(categoryId);
    }
  });

  test('update service item price', async ({ request }) => {
    const res = await request.patch(`/api/v1/service-items/${itemId}`, {
      headers: authHeader(token),
      data: { price: 8000, duration: 45 },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      price: number;
      duration: number;
    }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.price).toBe(8000);
    expect(json.data.duration).toBe(45);
  });

  test('toggle service item inactive', async ({ request }) => {
    const res = await request.patch(`/api/v1/service-items/${itemId}/toggle`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; isActive: boolean }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.isActive).toBe(false);
  });

  test('toggle service item back to active', async ({ request }) => {
    const res = await request.patch(`/api/v1/service-items/${itemId}/toggle`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; isActive: boolean }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.isActive).toBe(true);
  });

  test('filter service items by activeOnly', async ({ request }) => {
    const res = await request.get(
      `/api/v1/service-items?categoryId=${categoryId}&activeOnly=true`,
      {
        headers: authHeader(token),
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ id: string; isActive: boolean }>> =
      await res.json();
    expect(json.code).toBe(0);
    for (const item of json.data) {
      expect(item.isActive).toBe(true);
    }
  });

  test('create a second service item, then reorder items', async ({
    request,
  }) => {
    const res = await request.post('/api/v1/service-items', {
      headers: authHeader(token),
      data: {
        name: '女士精剪',
        categoryId,
        price: 8000,
        duration: 60,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ id: string; name: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.name).toBe('女士精剪');

    secondItemId = json.data.id;

    const reorderRes = await request.post('/api/v1/service-items/reorder', {
      headers: authHeader(token),
      data: { categoryId, ids: [secondItemId, itemId] },
    });
    expect(reorderRes.status()).toBe(200);

    const reorderJson: ApiResponse<{ success: boolean }> =
      await reorderRes.json();
    expect(reorderJson.code).toBe(0);
    expect(reorderJson.data.success).toBe(true);
  });

  test('verify reorder changed item order', async ({ request }) => {
    const res = await request.get(
      `/api/v1/service-items?categoryId=${categoryId}`,
      {
        headers: authHeader(token),
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ id: string; sortOrder: number }>> =
      await res.json();
    expect(json.code).toBe(0);

    const first = json.data.find((i) => i.id === secondItemId);
    const second = json.data.find((i) => i.id === itemId);
    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(first!.sortOrder).toBeLessThan(second!.sortOrder);
  });

  test('delete service item', async ({ request }) => {
    const res = await request.delete(`/api/v1/service-items/${itemId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.id).toBe(itemId);
  });

  test('delete second service item', async ({ request }) => {
    const res = await request.delete(`/api/v1/service-items/${secondItemId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
  });

  test('verify items are gone from listing', async ({ request }) => {
    const res = await request.get(
      `/api/v1/service-items?categoryId=${categoryId}`,
      {
        headers: authHeader(token),
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ id: string }>> = await res.json();
    expect(json.code).toBe(0);

    const found = json.data.find(
      (i) => i.id === itemId || i.id === secondItemId,
    );
    expect(found).toBeUndefined();
  });

  test('reorder categories', async ({ request }) => {
    const res = await request.post('/api/v1/service-categories/reorder', {
      headers: authHeader(token),
      data: { ids: [categoryId] },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ success: boolean }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.success).toBe(true);
  });

  test('delete service category', async ({ request }) => {
    const res = await request.delete(
      `/api/v1/service-categories/${categoryId}`,
      {
        headers: authHeader(token),
      },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.id).toBe(categoryId);
  });

  test('verify category is gone from listing', async ({ request }) => {
    const res = await request.get('/api/v1/service-categories', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ id: string }>> = await res.json();
    expect(json.code).toBe(0);

    const found = json.data.find((c) => c.id === categoryId);
    expect(found).toBeUndefined();
  });
});
