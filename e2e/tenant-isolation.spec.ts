/**
 * E2E: Multi-tenant isolation
 *
 * Verifies that two shops cannot access each other's data:
 * 1. Members created in Shop A are invisible to Shop B
 * 2. Orders from Shop A are invisible to Shop B
 * 3. Service items from Shop A are invisible to Shop B
 *
 * Requirements: two shop accounts must exist in the database.
 *   E2E_SHOP_PHONE_A / E2E_SHOP_PASSWORD_A  (default 13800000001 / 123456)
 *   E2E_SHOP_PHONE_B / E2E_SHOP_PASSWORD_B  (default 13800000002 / 123456)
 */

import { test, expect } from '@playwright/test';
import {
  env,
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Multi-tenant isolation', () => {
  let tokenA: string;
  let tokenB: string;
  let staffIdA: string;
  let staffIdB: string;

  test.beforeAll(async () => {
    const ctxA = await createAuthenticatedContext(
      env.shopPhoneA,
      env.shopPasswordA,
      env.shopIdA || undefined,
    );
    const ctxB = await createAuthenticatedContext(
      env.shopPhoneB,
      env.shopPasswordB,
      env.shopIdB || undefined,
    );
    tokenA = ctxA.token;
    staffIdA = ctxA.staffId;
    tokenB = ctxB.token;
    staffIdB = ctxB.staffId;
    await ctxA.context.dispose();
    await ctxB.context.dispose();
  });

  test('member created in Shop A is invisible to Shop B', async ({ request }) => {
    const uniqueTag = `ISOLATE_${Date.now()}`;
    const memberName = uniqueName('隔离A');

    // Create member in Shop A
    const createRes = await request.post('/api/v1/members', {
      headers: authHeader(tokenA),
      data: { name: memberName, phone: uniquePhone() },
    });
    const createJson: ApiResponse<{ id: string }> = await createRes.json();
    expect(createJson.code).toBe(0);
    const memberId = createJson.data.id;

    // Shop A can find it
    const getARes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(tokenA),
    });
    expect(getARes.status()).toBe(200);

    // Shop B cannot find it (should 404 or return not-found)
    const getBRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(tokenB),
    });
    expect(getBRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('member search in Shop B does not return Shop A members', async ({
    request,
  }) => {
    const uniqueKeyword = `ISOLATED_${Date.now()}`;
    const memberName = `${uniqueKeyword}_A`;

    // Create member in Shop A with a unique keyword
    await request.post('/api/v1/members', {
      headers: authHeader(tokenA),
      data: { name: memberName, phone: uniquePhone() },
    });

    // Search in Shop B with the same keyword
    const searchBRes = await request.get(
      `/api/v1/members/search/keyword?keyword=${encodeURIComponent(uniqueKeyword)}`,
      { headers: authHeader(tokenB) },
    );
    const searchBJson: ApiResponse<Array<{ id: string }>> =
      await searchBRes.json();

    expect(searchBJson.code).toBe(0);
    expect(searchBJson.data.length).toBe(0);
  });

  test('service items from Shop A are invisible to Shop B', async ({
    request,
  }) => {
    // Create category + item in Shop A
    const catRes = await request.post('/service-categories', {
      headers: authHeader(tokenA),
      data: { name: `E2E隔离类目_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    expect(catJson.code).toBe(0);

    const itemRes = await request.post('/service-items', {
      headers: authHeader(tokenA),
      data: {
        categoryId: catJson.data.id,
        name: `E2E隔离服务_${Date.now()}`,
        price: 3000,
        duration: 30,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    expect(itemJson.code).toBe(0);
    const itemId = itemJson.data.id;

    // Shop A can see its items
    const itemsARes = await request.get('/service-items', {
      headers: authHeader(tokenA),
    });
    const itemsAJson: ApiResponse<Array<{ id: string }>> =
      await itemsARes.json();
    expect(itemsAJson.data.some((i) => i.id === itemId)).toBe(true);

    // Shop B cannot see Shop A's items
    const itemsBRes = await request.get('/service-items', {
      headers: authHeader(tokenB),
    });
    const itemsBJson: ApiResponse<Array<{ id: string }>> =
      await itemsBRes.json();
    expect(itemsBJson.data.some((i) => i.id === itemId)).toBe(false);
  });

  test('orders from Shop A are invisible to Shop B', async ({ request }) => {
    // Create member + order in Shop A
    const memberRes = await request.post('/api/v1/members', {
      headers: authHeader(tokenA),
      data: { name: uniqueName('隔离订单'), phone: uniquePhone() },
    });
    const memberJson: ApiResponse<{ id: string }> = await memberRes.json();
    const memberAId = memberJson.data.id;

    // Need a service item for Shop A
    const catRes = await request.post('/service-categories', {
      headers: authHeader(tokenA),
      data: { name: `隔离Cat_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();

    const itemRes = await request.post('/service-items', {
      headers: authHeader(tokenA),
      data: {
        categoryId: catJson.data.id,
        name: `隔离Svc_${Date.now()}`,
        price: 5000,
        duration: 30,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();

    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(tokenA),
      data: {
        memberId: memberAId,
        items: [{ serviceItemId: itemJson.data.id, staffId: staffIdA, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string }> = await orderRes.json();
    const orderId = orderJson.data.id;

    // Shop A can see its order
    const getARes = await request.get(`/api/v1/orders/${orderId}`, {
      headers: authHeader(tokenA),
    });
    expect(getARes.status()).toBe(200);

    // Shop B cannot see Shop A's order
    const getBRes = await request.get(`/api/v1/orders/${orderId}`, {
      headers: authHeader(tokenB),
    });
    expect(getBRes.status()).toBeGreaterThanOrEqual(400);
  });
});
