/**
 * E2E: Coupon Full Flow
 *
 * Covers:
 * 1. Create a coupon template (FIXED type: spend >= 20000, discount 3000)
 * 2. Issue the coupon to a member
 * 3. Verify the coupon appears in member's coupon list
 * 4. Create an order with total > 20000
 * 5. Settle the order using the coupon + balance payment
 * 6. Verify the coupon is marked as USED
 * 7. Verify the discount amount is correct
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Coupon full flow', () => {
  let token: string;
  let staffId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    staffId = ctx.staffId;
    await ctx.context.dispose();
  });

  /** Helper: create a test member via Playwright request context */
  async function createTestMember(request: APIRequestContext) {
    const res = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('优惠券'), phone: uniquePhone() },
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

  let templateId: string;
  let memberId: string;
  let serviceItemId: string;

  test.beforeAll(async ({ request }) => {
    // Create a member and recharge them
    memberId = await createTestMember(request);

    // Recharge member with enough balance (300000 = 3000 yuan)
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 300000, payMethod: 'CASH' },
    });

    // Create service category + item with price = 25000 (250 yuan)
    const catRes = await request.post('/service-categories', {
      headers: authHeader(token),
      data: { name: `CouponCat_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    expect(catJson.code).toBe(0);

    const itemRes = await request.post('/service-items', {
      headers: authHeader(token),
      data: {
        categoryId: catJson.data.id,
        name: `CouponSvc_${Date.now()}`,
        price: 25000, // 250 yuan
        duration: 60,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    expect(itemJson.code).toBe(0);
    serviceItemId = itemJson.data.id;
  });

  test('create a coupon template (FIXED: spend >= 20000, discount 3000)', async ({
    request,
  }) => {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const res = await request.post('/api/v1/coupons/templates', {
      headers: authHeader(token),
      data: {
        name: `满减券_${Date.now()}`,
        type: 'FIXED',
        threshold: 20000, // spend >= 200 yuan
        discount: 3000, // discount 30 yuan
        total: 100,
        startsAt: now.toISOString(),
        endsAt: futureDate.toISOString(),
        isActive: true,
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      type: string;
      threshold: number;
      discount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.type).toBe('FIXED');
    expect(json.data.threshold).toBe(20000);
    expect(json.data.discount).toBe(3000);

    templateId = json.data.id;
  });

  let couponInstanceId: string;

  test('issue the coupon to a member', async ({ request }) => {
    const res = await request.post(
      `/api/v1/coupons/templates/${templateId}/issue`,
      {
        headers: authHeader(token),
        data: { memberIds: [memberId] },
      },
    );
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ issued: number }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.issued).toBeGreaterThanOrEqual(1);
  });

  test('verify coupon appears in member coupon list', async ({ request }) => {
    const res = await request.get(
      `/api/v1/coupons/members/${memberId}?status=AVAILABLE`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{
        id: string;
        status: string;
        template: { threshold: number; discount: number };
      }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);

    const coupon = json.data.items.find(
      (c) => c.template.threshold === 20000 && c.template.discount === 3000,
    );
    expect(coupon).toBeTruthy();
    expect(coupon!.status).toBe('AVAILABLE');

    couponInstanceId = coupon!.id;
  });

  let orderId: string;
  let payableAmount: number;

  test('create an order with total > 20000 (200 yuan)', async ({ request }) => {
    const res = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      status: string;
      originalAmount: number;
      payableAmount: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.status).toBe('PENDING');
    expect(json.data.originalAmount).toBe(25000);
    expect(json.data.payableAmount).toBe(25000);

    orderId = json.data.id;
    payableAmount = json.data.payableAmount;
  });

  test('settle order using coupon + balance payment', async ({ request }) => {
    // First calculate the coupon discount
    const calcRes = await request.post('/api/v1/coupons/calculate-discount', {
      headers: authHeader(token),
      data: {
        amount: payableAmount,
        couponInstanceId,
      },
    });
    const calcJson: ApiResponse<{ discount: number; finalAmount: number }> =
      await calcRes.json();
    expect(calcJson.code).toBe(0);
    expect(calcJson.data.discount).toBe(3000);

    const afterCoupon = payableAmount - 3000;
    const balanceBefore = await getMemberBalance(request, memberId);

    // Settle with coupon + balance
    const settleRes = await request.post(`/api/v1/orders/${orderId}/settle`, {
      headers: authHeader(token),
      data: {
        payments: [
          {
            method: 'COUPON',
            amount: 3000,
            couponInstanceId,
          },
          {
            method: 'BALANCE',
            amount: afterCoupon,
          },
        ],
      },
    });
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{
      status: string;
      paidAmount: number;
    }> = await settleRes.json();

    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
    expect(settleJson.data.paidAmount).toBe(payableAmount);

    // Verify balance deducted by afterCoupon amount
    const balanceAfter = await getMemberBalance(request, memberId);
    const totalBalanceBefore =
      balanceBefore.principalBalance + balanceBefore.giftBalance;
    const totalBalanceAfter =
      balanceAfter.principalBalance + balanceAfter.giftBalance;
    expect(totalBalanceBefore - totalBalanceAfter).toBe(afterCoupon);
  });

  test('verify coupon is marked as USED after settlement', async ({
    request,
  }) => {
    const res = await request.get(
      `/api/v1/coupons/members/${memberId}?status=USED`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{ id: string; status: string }>;
    }> = await res.json();

    expect(json.code).toBe(0);
    const usedCoupon = json.data.items.find((c) => c.id === couponInstanceId);
    expect(usedCoupon).toBeTruthy();
    expect(usedCoupon!.status).toBe('USED');
  });

  test('verify order details show correct discount', async ({ request }) => {
    const res = await request.get(`/api/v1/orders/${orderId}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      originalAmount: number;
      discountAmount: number;
      payableAmount: number;
      paidAmount: number;
      status: string;
      payments: Array<{ method: string; amount: number }>;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.originalAmount).toBe(25000);
    expect(json.data.discountAmount).toBe(3000);
    expect(json.data.paidAmount).toBe(25000);
    expect(json.data.status).toBe('SETTLED');
  });

  test('verify member coupon summary', async ({ request }) => {
    const res = await request.get(
      `/api/v1/coupons/members/${memberId}/summary`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      total: number;
      available: number;
      used: number;
      expired: number;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.used).toBeGreaterThanOrEqual(1);
  });
});
