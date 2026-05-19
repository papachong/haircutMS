/**
 * E2E: Order → Settlement → Cancellation flow
 *
 * Full lifecycle:
 * 1. Create prerequisites: member with balance, service category + item, staff
 * 2. Create order with service items → verify PENDING status
 * 3. Settle order with BALANCE payment → verify SETTLED status + balance deducted
 * 4. Cancel (refund) the same-day order → verify REFUNDED status + balance restored
 */

import { test, expect } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Order lifecycle', () => {
  let token: string;
  let staffId: string;
  let memberId: string;
  let serviceItemId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    staffId = ctx.staffId;

    // Create a member and recharge them so they have balance
    const memberRes = await ctx.context.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('订单'), phone: uniquePhone() },
    });
    const memberJson: ApiResponse<{ id: string }> = await memberRes.json();
    memberId = memberJson.data.id;

    // Recharge the member with enough balance (¥1000 = 100000 分)
    await ctx.context.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 100000, payMethod: 'CASH' },
    });

    // Create a service category + item
    const catRes = await ctx.context.post('/service-categories', {
      headers: authHeader(token),
      data: { name: `E2E类目_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    const categoryId = catJson.data.id;

    const itemRes = await ctx.context.post('/service-items', {
      headers: authHeader(token),
      data: {
        categoryId,
        name: `E2E服务_${Date.now()}`,
        price: 5000, // ¥50
        duration: 30,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    serviceItemId = itemJson.data.id;

    await ctx.context.dispose();
  });

  test('create order → status is PENDING', async ({ request }) => {
    const res = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 2 }],
        remark: 'E2E test order',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      orderNo: string;
      status: string;
      originalAmount: number;
      payableAmount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.status).toBe('PENDING');
    expect(json.data.orderNo).toBeTruthy();
    // 2 items x 5000 = 10000
    expect(json.data.originalAmount).toBe(10000);
  });

  test('settle order with BALANCE payment → SETTLED + balance deducted', async ({
    request,
  }) => {
    // Create a fresh order for this test
    const createRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const createJson: ApiResponse<{
      id: string;
      payableAmount: number;
    }> = await createRes.json();
    const orderId = createJson.data.id;
    const payableAmount = createJson.data.payableAmount;

    // Get member balance before settlement
    const memberBeforeRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const memberBefore: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await memberBeforeRes.json();
    const balanceBefore =
      memberBefore.data.principalBalance + memberBefore.data.giftBalance;

    // Settle with balance
    const settleRes = await request.post(`/api/v1/orders/${orderId}/settle`, {
      headers: authHeader(token),
      data: {
        payments: [{ method: 'BALANCE', amount: payableAmount }],
      },
    });
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string; paidAmount: number }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
    expect(settleJson.data.paidAmount).toBe(payableAmount);

    // Verify balance deducted
    const memberAfterRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const memberAfter: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await memberAfterRes.json();
    const balanceAfter =
      memberAfter.data.principalBalance + memberAfter.data.giftBalance;

    expect(balanceBefore - balanceAfter).toBe(payableAmount);
  });

  test('cancel same-day settled order → REFUNDED + balance restored', async ({
    request,
  }) => {
    // Create and settle an order
    const createRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const createJson: ApiResponse<{ id: string; payableAmount: number }> =
      await createRes.json();
    const orderId = createJson.data.id;
    const payableAmount = createJson.data.payableAmount;

    await request.post(`/api/v1/orders/${orderId}/settle`, {
      headers: authHeader(token),
      data: {
        payments: [{ method: 'BALANCE', amount: payableAmount }],
      },
    });

    // Get member balance after settlement (before cancel)
    const beforeCancelRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const beforeCancel: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await beforeCancelRes.json();
    const balanceBeforeCancel =
      beforeCancel.data.principalBalance + beforeCancel.data.giftBalance;

    // Cancel the order
    const cancelRes = await request.post(`/api/v1/orders/${orderId}/cancel`, {
      headers: authHeader(token),
      data: { reason: 'E2E test cancel' },
    });
    expect(cancelRes.status()).toBe(200);

    const cancelJson: ApiResponse<{ status: string; paidAmount: number }> =
      await cancelRes.json();
    expect(cancelJson.code).toBe(0);
    expect(cancelJson.data.status).toBe('REFUNDED');
    expect(cancelJson.data.paidAmount).toBe(0);

    // Verify balance restored
    const afterCancelRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const afterCancel: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await afterCancelRes.json();
    const balanceAfterCancel =
      afterCancel.data.principalBalance + afterCancel.data.giftBalance;

    expect(balanceAfterCancel - balanceBeforeCancel).toBe(payableAmount);
  });

  test('settle with OFFLINE payment → SETTLED, balance unchanged', async ({
    request,
  }) => {
    // Get balance before
    const beforeRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const before: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await beforeRes.json();
    const balanceBefore =
      before.data.principalBalance + before.data.giftBalance;

    // Create order
    const createRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const createJson: ApiResponse<{ id: string; payableAmount: number }> =
      await createRes.json();

    // Settle with OFFLINE payment
    const settleRes = await request.post(
      `/api/v1/orders/${createJson.data.id}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [
            { method: 'OFFLINE', amount: createJson.data.payableAmount },
          ],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string }> = await settleRes.json();
    expect(settleJson.data.status).toBe('SETTLED');

    // Verify balance unchanged
    const afterRes = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const after: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await afterRes.json();
    const balanceAfter =
      after.data.principalBalance + after.data.giftBalance;

    expect(balanceAfter).toBe(balanceBefore);
  });

  test('get pending orders list', async ({ request }) => {
    // Create a pending order
    await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });

    const res = await request.get('/api/v1/orders/pending', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<Array<{ status: string }>> = await res.json();
    expect(json.code).toBe(0);
    expect(Array.isArray(json.data)).toBe(true);
    // All returned orders should be PENDING
    for (const order of json.data) {
      expect(order.status).toBe('PENDING');
    }
  });

  test('list orders with status filter', async ({ request }) => {
    const res = await request.get('/api/v1/orders?status=PENDING&page=1&pageSize=5', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{ status: string }>;
      pagination: { total: number; page: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    for (const item of json.data.items) {
      expect(item.status).toBe('PENDING');
    }
  });
});
