/**
 * E2E: Recharge Flow
 *
 * Covers:
 * 1. Create a recharge plan
 * 2. Recharge a member with the plan → verify balance increment
 * 3. Recharge a member with custom amount → verify balance increment
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Recharge flow', () => {
  let token: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    await ctx.context.dispose();
  });

  /** Helper: create a test member via Playwright request context */
  async function createTestMember(request: APIRequestContext): Promise<string> {
    const res = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('充值'), phone: uniquePhone() },
    });
    const json: ApiResponse<{ id: string }> = await res.json();
    expect(json.code).toBe(0);
    return json.data.id;
  }

  /** Helper: get member balance */
  async function getMemberBalance(
    request: APIRequestContext,
    memberId: string,
  ): Promise<{ principalBalance: number; giftBalance: number }> {
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

  let planId: string;

  test('create a recharge plan', async ({ request }) => {
    const res = await request.post('/api/v1/recharge-plans', {
      headers: authHeader(token),
      data: {
        name: `E2E方案_${Date.now()}`,
        amount: 50000, // ¥500
        giftAmount: 5000, // ¥50 gift
        type: 'GIFT',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{ id: string; amount: number; giftAmount: number }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.amount).toBe(50000);
    expect(json.data.giftAmount).toBe(5000);

    planId = json.data.id;
  });

  test('recharge member using plan → balance increases', async ({ request }) => {
    const memberId = await createTestMember(request);
    const before = await getMemberBalance(request, memberId);

    const res = await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: {
        planId,
        payMethod: 'CASH',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await res.json();
    expect(json.code).toBe(0);

    // Verify balance change: +50000 principal, +5000 gift
    expect(json.data.principalBalance).toBe(before.principalBalance + 50000);
    expect(json.data.giftBalance).toBe(before.giftBalance + 5000);
  });

  test('recharge member with custom amount → balance increases', async ({
    request,
  }) => {
    const memberId = await createTestMember(request);
    const before = await getMemberBalance(request, memberId);

    const customAmount = 20000; // ¥200
    const customGift = 1000; // ¥10

    const res = await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: {
        amount: customAmount,
        giftAmount: customGift,
        payMethod: 'WECHAT',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await res.json();
    expect(json.code).toBe(0);

    expect(json.data.principalBalance).toBe(before.principalBalance + customAmount);
    expect(json.data.giftBalance).toBe(before.giftBalance + customGift);
  });

  test('recharge history is recorded', async ({ request }) => {
    const memberId = await createTestMember(request);

    // Perform a recharge first
    await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 10000, payMethod: 'ALIPAY' },
    });

    // Check history
    const res = await request.get(
      `/api/v1/members/${memberId}/recharge-history?page=1&pageSize=10`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{ amount: number; payMethod: string }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);
    expect(json.data.items[0].amount).toBe(10000);
  });
});
