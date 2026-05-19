/**
 * E2E: Mixed Payment Detailed Tests
 *
 * Covers:
 * 1. Balance only (gift first, then principal)
 * 2. Balance + offline mixed payment
 * 3. Pass card + offline mixed
 * 4. Coupon + balance mixed
 * 5. All three (coupon + balance + offline)
 * 6. Insufficient balance falls back to mixed
 * 7. Verify each payment record in order details
 * 8. Verify balance changes are correct
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Mixed payment detailed tests', () => {
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
      data: { name: uniqueName('混合'), phone: uniquePhone() },
    });
    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
    return json.data.id;
  }

  /** Helper: get member balance */
  async function getMemberBalance(
    request: APIRequestContext,
    memberId: string,
  ) {
    const res = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const json: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await res.json();
    return {
      principalBalance: json.data.principalBalance,
      giftBalance: json.data.giftBalance,
    };
  }

  /** Helper: create service item and return its id */
  async function createServiceItem(request: APIRequestContext) {
    const catRes = await request.post('/service-categories', {
      headers: authHeader(token),
      data: { name: `MixPayCat_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    expect(catJson.code).toBe(0);

    const itemRes = await request.post('/service-items', {
      headers: authHeader(token),
      data: {
        categoryId: catJson.data.id,
        name: `MixPaySvc_${Date.now()}`,
        price: 5000, // 50 yuan
        duration: 30,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    expect(itemJson.code).toBe(0);
    return itemJson.data.id;
  }

  let serviceItemId: string;

  test.beforeAll(async ({ request }) => {
    serviceItemId = await createServiceItem(request);
  });

  test('balance only payment (gift balance consumed first, then principal)', async ({
    request,
  }) => {
    const memberId = await createTestMember(request);

    // Recharge with principal + gift
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: {
        amount: 10000, // 100 yuan principal
        giftAmount: 3000, // 30 yuan gift
        payMethod: 'CASH',
      },
    });

    const before = await getMemberBalance(request, memberId);
    expect(before.principalBalance).toBe(10000);
    expect(before.giftBalance).toBe(3000);

    // Create order with amount = 5000 (50 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();

    // Settle with balance
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            { method: 'BALANCE', amount: orderJson.data.payableAmount },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string; paidAmount: number }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');

    const after = await getMemberBalance(request, memberId);

    // Gift balance should be consumed first (3000), then principal (2000)
    expect(after.giftBalance).toBe(0);
    expect(after.principalBalance).toBe(8000);
  });

  test('balance + offline mixed payment', async ({ request }) => {
    const memberId = await createTestMember(request);

    // Recharge with limited balance
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 3000, payMethod: 'CASH' }, // only 30 yuan
    });

    const before = await getMemberBalance(request, memberId);
    const balanceAmount = 3000;
    const offlineAmount = 2000; // need 20 yuan more offline

    // Create order with amount = 5000 (50 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();
    expect(orderJson.data.payableAmount).toBe(5000);

    // Settle with balance (3000) + offline (2000)
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            { method: 'BALANCE', amount: balanceAmount },
            { method: 'OFFLINE', amount: offlineAmount },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{
      status: string;
      paidAmount: number;
    }> = await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');

    // Verify balance deducted
    const after = await getMemberBalance(request, memberId);
    expect(before.principalBalance - after.principalBalance).toBe(balanceAmount);
  });

  test('pass card + offline mixed payment', async ({ request }) => {
    const memberId = await createTestMember(request);

    // Create pass card
    const passCardRes = await request.post('/api/v1/pass-cards', {
      headers: authHeader(token),
      data: {
        memberId,
        name: '混合支付次卡',
        totalTimes: 5,
        price: 20000,
      },
    });
    const passCardJson: ApiResponse<{ id: string }> = await passCardRes.json();
    expect(passCardJson.code).toBe(0);
    const passCardId = passCardJson.data.id;

    // Create order with 2 items = 10000 (100 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 2 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();

    // Use pass card for first item (5000) + offline for second item (5000)
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            {
              method: 'PASS_CARD',
              amount: 5000,
              passCardId,
            },
            { method: 'OFFLINE', amount: 5000 },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');

    // Verify pass card remaining times decreased
    const pcRes = await request.get(`/api/v1/pass-cards/${passCardId}`, {
      headers: authHeader(token),
    });
    const pcJson: ApiResponse<{ remainingTimes: number }> = await pcRes.json();
    expect(pcJson.data.remainingTimes).toBe(4);
  });

  test('coupon + balance mixed payment', async ({ request }) => {
    const memberId = await createTestMember(request);

    // Recharge with enough balance
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 50000, payMethod: 'CASH' },
    });

    // Create coupon template (discount 2000 = 20 yuan)
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const tplRes = await request.post('/api/v1/coupons/templates', {
      headers: authHeader(token),
      data: {
        name: `混付券_${Date.now()}`,
        type: 'FIXED',
        threshold: 0,
        discount: 2000,
        total: 10,
        startsAt: now.toISOString(),
        endsAt: future.toISOString(),
      },
    });
    const tplJson: ApiResponse<{ id: string }> = await tplRes.json();
    expect(tplJson.code).toBe(0);

    // Issue to member
    await request.post(`/api/v1/coupons/templates/${tplJson.data.id}/issue`, {
      headers: authHeader(token),
      data: { memberIds: [memberId] },
    });

    // Get available coupons
    const availRes = await request.get(
      `/api/v1/coupons/members/${memberId}/available?amount=5000`,
      { headers: authHeader(token) },
    );
    const availJson: ApiResponse<
      Array<{ id: string; status: string }>
    > = await availRes.json();
    expect(availJson.data.length).toBeGreaterThanOrEqual(1);
    const couponId = availJson.data[0].id;

    const before = await getMemberBalance(request, memberId);

    // Create order (5000 = 50 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();

    // Settle: coupon 2000 + balance 3000
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            { method: 'COUPON', amount: 2000, couponInstanceId: couponId },
            { method: 'BALANCE', amount: 3000 },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string; paidAmount: number }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
    expect(settleJson.data.paidAmount).toBe(5000);

    // Verify balance deducted by 3000 only
    const after = await getMemberBalance(request, memberId);
    const totalBefore = before.principalBalance + before.giftBalance;
    const totalAfter = after.principalBalance + after.giftBalance;
    expect(totalBefore - totalAfter).toBe(3000);
  });

  test('all three payment methods combined (coupon + balance + offline)', async ({
    request,
  }) => {
    const memberId = await createTestMember(request);

    // Recharge
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 10000, giftAmount: 0, payMethod: 'CASH' },
    });

    // Create coupon
    const now = new Date();
    const future = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const tplRes = await request.post('/api/v1/coupons/templates', {
      headers: authHeader(token),
      data: {
        name: `三方券_${Date.now()}`,
        type: 'FIXED',
        threshold: 0,
        discount: 1000, // 10 yuan
        total: 10,
        startsAt: now.toISOString(),
        endsAt: future.toISOString(),
      },
    });
    const tplJson: ApiResponse<{ id: string }> = await tplRes.json();
    expect(tplJson.code).toBe(0);

    await request.post(`/api/v1/coupons/templates/${tplJson.data.id}/issue`, {
      headers: authHeader(token),
      data: { memberIds: [memberId] },
    });

    const availRes = await request.get(
      `/api/v1/coupons/members/${memberId}/available?amount=15000`,
      { headers: authHeader(token) },
    );
    const availJson: ApiResponse<
      Array<{ id: string }>
    > = await availRes.json();
    const couponId = availJson.data[0]?.id;
    expect(couponId).toBeTruthy();

    const before = await getMemberBalance(request, memberId);

    // Create order with 3 items = 15000 (150 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 3 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();
    expect(orderJson.data.payableAmount).toBe(15000);

    // Settle: coupon 1000 + balance 5000 + offline 9000
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            {
              method: 'COUPON',
              amount: 1000,
              couponInstanceId: couponId,
            },
            { method: 'BALANCE', amount: 5000 },
            { method: 'OFFLINE', amount: 9000 },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{
      status: string;
      paidAmount: number;
    }> = await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
    expect(settleJson.data.paidAmount).toBe(15000);

    // Verify balance deducted by 5000
    const after = await getMemberBalance(request, memberId);
    const totalBefore = before.principalBalance + before.giftBalance;
    const totalAfter = after.principalBalance + after.giftBalance;
    expect(totalBefore - totalAfter).toBe(5000);

    // Verify order detail shows all three payment records
    const detailRes = await request.get(
      `/api/v1/orders/${orderJson.data.id}`,
      { headers: authHeader(token) },
    );
    const detailJson: ApiResponse<{
      payments: Array<{ method: string; amount: number }>;
    }> = await detailRes.json();
    expect(detailJson.code).toBe(0);

    const methods = detailJson.data.payments.map((p) => p.method);
    expect(methods).toContain('COUPON');
    expect(methods).toContain('BALANCE');
    expect(methods).toContain('OFFLINE');
  });

  test('insufficient balance falls back to mixed payment', async ({
    request,
  }) => {
    const memberId = await createTestMember(request);

    // Recharge with small balance
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 2000, payMethod: 'CASH' }, // only 20 yuan
    });

    // Create order with 2 items = 10000 (100 yuan)
    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 2 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();
    expect(orderJson.data.payableAmount).toBe(10000);

    const before = await getMemberBalance(request, memberId);

    // Settle: use all balance (2000) + offline for the rest (8000)
    const settleRes = await request.post(
      `/api/v1/orders/${orderJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            { method: 'BALANCE', amount: 2000 },
            { method: 'OFFLINE', amount: 8000 },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{
      status: string;
      paidAmount: number;
    }> = await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
    expect(settleJson.data.paidAmount).toBe(10000);

    // Verify balance is now 0
    const after = await getMemberBalance(request, memberId);
    expect(after.principalBalance + after.giftBalance).toBe(
      before.principalBalance + before.giftBalance - 2000,
    );
  });
});
