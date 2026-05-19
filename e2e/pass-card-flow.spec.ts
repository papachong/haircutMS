/**
 * E2E: Pass Card Full Flow
 *
 * Covers:
 * 1. Create a pass card for a member (haircut 10-time card)
 * 2. Verify pass card appears in member's pass card list
 * 3. Verify remaining count is 10
 * 4. Create an order and settle using pass card payment
 * 5. Verify remaining count decreases to 9
 * 6. Test pass card with expired date cannot be used
 * 7. Test refunding a pass card usage
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Pass card full flow', () => {
  let token: string;
  let staffId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    staffId = ctx.staffId;
    await ctx.context.dispose();
  });

  /** Helper: create a test member */
  async function createTestMember(request: APIRequestContext) {
    const res = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('次卡'), phone: uniquePhone() },
    });
    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
    return json.data.id;
  }

  let memberId: string;
  let serviceItemId: string;

  test.beforeAll(async ({ request }) => {
    memberId = await createTestMember(request);

    // Create service category + item
    const catRes = await request.post('/service-categories', {
      headers: authHeader(token),
      data: { name: `PassCardCat_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    expect(catJson.code).toBe(0);

    const itemRes = await request.post('/service-items', {
      headers: authHeader(token),
      data: {
        categoryId: catJson.data.id,
        name: `PassCardSvc_${Date.now()}`,
        price: 5000, // 50 yuan
        duration: 30,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    expect(itemJson.code).toBe(0);
    serviceItemId = itemJson.data.id;
  });

  let passCardId: string;

  test('create a pass card for a member (10-time haircut card)', async ({
    request,
  }) => {
    const res = await request.post('/api/v1/pass-cards', {
      headers: authHeader(token),
      data: {
        memberId,
        name: '剪发10次卡',
        totalTimes: 10,
        price: 40000, // 400 yuan for 10 times
        isActive: true,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      totalTimes: number;
      remainingTimes: number;
      status: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.name).toBe('剪发10次卡');
    expect(json.data.totalTimes).toBe(10);
    expect(json.data.remainingTimes).toBe(10);
    expect(json.data.status).toBe('ACTIVE');

    passCardId = json.data.id;
  });

  test('verify pass card appears in member pass card list', async ({
    request,
  }) => {
    const res = await request.get(
      `/api/v1/pass-cards?memberId=${memberId}`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{
        id: string;
        name: string;
        totalTimes: number;
        remainingTimes: number;
        status: string;
      }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);

    const card = json.data.items.find((c) => c.id === passCardId);
    expect(card).toBeTruthy();
    expect(card!.remainingTimes).toBe(10);
    expect(card!.status).toBe('ACTIVE');
  });

  test('get pass card detail shows remaining count is 10', async ({
    request,
  }) => {
    const res = await request.get(`/api/v1/pass-cards/${passCardId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      id: string;
      remainingTimes: number;
      totalTimes: number;
      status: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.remainingTimes).toBe(10);
    expect(json.data.totalTimes).toBe(10);
  });

  test('create order and settle using pass card payment', async ({
    request,
  }) => {
    // Create order
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    expect(orderRes.status()).toBe(201);

    const orderJson: ApiResponse<{
      id: string;
      payableAmount: number;
    }> = await orderRes.json();
    expect(orderJson.code).toBe(0);

    // Settle using pass card
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            {
              method: 'PASS_CARD',
              amount: orderJson.data.payableAmount,
              passCardId,
            },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
  });

  test('verify remaining count decreases to 9 after usage', async ({
    request,
  }) => {
    const res = await request.get(`/api/v1/pass-cards/${passCardId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ remainingTimes: number }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.remainingTimes).toBe(9);
  });

  let expiredPassCardId: string;

  test('create an expired pass card', async ({ request }) => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const res = await request.post('/api/v1/pass-cards', {
      headers: authHeader(token),
      data: {
        memberId,
        name: '过期次卡',
        totalTimes: 5,
        price: 20000,
        expiresAt: pastDate,
        isActive: true,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      remainingTimes: number;
      status: string;
    }> = await res.json();
    expect(json.code).toBe(0);

    expiredPassCardId = json.data.id;
  });

  test('expired pass card cannot be used for settlement', async ({
    request,
  }) => {
    // Create order
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();
    expect(orderJson.code).toBe(0);

    // Try to settle with expired pass card — should fail
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            {
              method: 'PASS_CARD',
              amount: orderJson.data.payableAmount,
              passCardId: expiredPassCardId,
            },
          ],
        },
      },
    );
    // Expect failure (400 or 409 or similar)
    expect(settleRes.status()).toBeGreaterThanOrEqual(400);
  });

  test('verify pass card usages are tracked', async ({ request }) => {
    const res = await request.get(`/api/v1/pass-cards/${passCardId}/usages`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{
        id: string;
        passCardId: string;
      }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);

    // Store the usage ID for refund test
    const usageId = json.data.items[0].id;

    // Refund the usage
    const refundRes = await request.post(
      `/api/v1/pass-cards/${passCardId}/refund/${usageId}`,
      { headers: authHeader(token) },
    );
    expect(refundRes.status()).toBe(200);

    const refundJson: ApiResponse<{
      remainingTimes: number;
    }> = await refundRes.json();
    expect(refundJson.code).toBe(0);

    // After refund, remaining should go back to 10
    expect(refundJson.data.remainingTimes).toBe(10);
  });
});
