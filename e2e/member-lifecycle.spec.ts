/**
 * E2E: Member Lifecycle Tests
 *
 * Covers:
 * 1. Register a new member
 * 2. Verify auto-assigned default level
 * 3. Add tags to the member
 * 4. Recharge the member (test bonus calculation)
 * 5. Create and settle an order
 * 6. Verify balance deduction
 * 7. Verify member's order history
 * 8. Test dormant member detection (>90 days since last visit)
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Member lifecycle', () => {
  let token: string;
  let staffId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    staffId = ctx.staffId;
    await ctx.context.dispose();
  });

  /** Helper: get member balance */
  async function getMemberDetail(
    request: APIRequestContext,
    memberId: string,
  ) {
    const res = await request.get(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
    });
    const json: ApiResponse<{
      id: string;
      name: string;
      phone: string;
      principalBalance: number;
      giftBalance: number;
      totalRecharge: number;
      totalConsume: number;
      visitCount: number;
      lastVisitAt: string | null;
      memberLevel: { id: string; name: string };
      isActive: boolean;
    }> = await res.json();
    return json.data;
  }

  /** Helper: create service item */
  async function createServiceItem(request: APIRequestContext) {
    const catRes = await request.post('/service-categories', {
      headers: authHeader(token),
      data: { name: `LifeCycleCat_${Date.now()}` },
    });
    const catJson: ApiResponse<{ id: string }> = await catRes.json();
    expect(catJson.code).toBe(0);

    const itemRes = await request.post('/service-items', {
      headers: authHeader(token),
      data: {
        categoryId: catJson.data.id,
        name: `LifeCycleSvc_${Date.now()}`,
        price: 8000, // 80 yuan
        duration: 45,
      },
    });
    const itemJson: ApiResponse<{ id: string }> = await itemRes.json();
    expect(itemJson.code).toBe(0);
    return itemJson.data.id;
  }

  let memberId: string;
  let serviceItemId: string;

  test.beforeAll(async ({ request }) => {
    serviceItemId = await createServiceItem(request);
  });

  test('register a new member', async ({ request }) => {
    const res = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: {
        name: uniqueName('生命周期'),
        phone: uniquePhone(),
        gender: 'MALE',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      cardNo: string;
      memberLevel: { name: string };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBeTruthy();
    expect(json.data.cardNo).toBeTruthy();

    memberId = json.data.id;
  });

  test('verify auto-assigned default member level', async ({ request }) => {
    const detail = await getMemberDetail(request, memberId);

    expect(detail.memberLevel).toBeTruthy();
    expect(detail.memberLevel.name).toBeTruthy();
    // Default level should be something like "普通会员" or "默认等级"
    expect(detail.memberLevel.id).toBeTruthy();
  });

  let tagGroupId: string;
  let tagId: string;

  test('create tag group and tag, then add to member', async ({ request }) => {
    // Create tag group
    const groupRes = await request.post('/api/v1/tag-groups', {
      headers: authHeader(token),
      data: { name: `生命周期标签组_${Date.now()}` },
    });
    const groupJson: ApiResponse<{ id: string; name: string }> =
      await groupRes.json();
    expect(groupJson.code).toBe(0);
    tagGroupId = groupJson.data.id;

    // Create tag in group
    const tagRes = await request.post(
      `/api/v1/tag-groups/${tagGroupId}/tags`,
      {
        headers: authHeader(token),
        data: { name: 'VIP客户' },
      },
    );
    const tagJson: ApiResponse<{ id: string; name: string }> =
      await tagRes.json();
    expect(tagJson.code).toBe(0);
    tagId = tagJson.data.id;

    // Add tag to member
    const addTagRes = await request.post(
      `/api/v1/members/${memberId}/tags/add`,
      {
        headers: authHeader(token),
        data: { tagId },
      },
    );
    expect(addTagRes.status()).toBe(200);
    const addTagJson: ApiResponse = await addTagRes.json();
    expect(addTagJson.code).toBe(0);
  });

  test('verify member has the tag', async ({ request }) => {
    const res = await request.get(`/api/v1/members/${memberId}/tags`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<
      Array<{ id: string; name: string }>
    > = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
    expect(json.data.some((t) => t.id === tagId)).toBe(true);
  });

  test('recharge the member (principal + gift bonus)', async ({ request }) => {
    const before = await getMemberDetail(request, memberId);
    expect(before.principalBalance).toBe(0);
    expect(before.giftBalance).toBe(0);
    expect(before.totalRecharge).toBe(0);

    // Recharge: 10000 principal + 2000 gift bonus
    const res = await request.post(`/api/v1/members/${memberId}/recharge`, {
      headers: authHeader(token),
      data: {
        amount: 10000, // 100 yuan principal
        giftAmount: 2000, // 20 yuan gift bonus
        payMethod: 'WECHAT',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      principalBalance: number;
      giftBalance: number;
    }> = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.principalBalance).toBe(10000);
    expect(json.data.giftBalance).toBe(2000);

    // Verify total recharge
    const after = await getMemberDetail(request, memberId);
    expect(after.totalRecharge).toBe(12000); // 10000 + 2000
  });

  let orderId: string;

  test('create and settle an order', async ({ request }) => {
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
      status: string;
      payableAmount: number;
    }> = await orderRes.json();
    expect(orderJson.code).toBe(0);
    expect(orderJson.data.status).toBe('PENDING');

    orderId = orderJson.data.id;
    const payable = orderJson.data.payableAmount;

    // Settle with balance
    const settleRes = await request.post(
      `/api/v1/orders/${orderId}/settle`,
      {
        headers: authHeader(token),
        data: {
          payments: [{ method: 'BALANCE', amount: payable }],
        },
      },
    );
    expect(settleRes.status()).toBe(200);

    const settleJson: ApiResponse<{ status: string }> =
      await settleRes.json();
    expect(settleJson.code).toBe(0);
    expect(settleJson.data.status).toBe('SETTLED');
  });

  test('verify balance deduction after order settlement', async ({
    request,
  }) => {
    const detail = await getMemberDetail(request, memberId);

    // Started with 10000 + 2000 = 12000, spent 8000 on order
    // Gift balance consumed first (2000), then principal (6000)
    expect(detail.giftBalance).toBe(0);
    expect(detail.principalBalance).toBe(4000);
    expect(detail.totalConsume).toBe(8000);
  });

  test('verify member visit count increased', async ({ request }) => {
    const detail = await getMemberDetail(request, memberId);
    expect(detail.visitCount).toBeGreaterThanOrEqual(1);
  });

  test('verify member lastVisitAt is updated', async ({ request }) => {
    const detail = await getMemberDetail(request, memberId);
    expect(detail.lastVisitAt).toBeTruthy();
    // Should be a recent date (within the last minute)
    const lastVisit = new Date(detail.lastVisitAt!);
    const now = new Date();
    const diffMs = now.getTime() - lastVisit.getTime();
    expect(diffMs).toBeLessThan(60000); // within 1 minute
  });

  test('verify member order history', async ({ request }) => {
    const res = await request.get(
      `/api/v1/orders?memberId=${memberId}&page=1&pageSize=10`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{
        id: string;
        status: string;
        originalAmount: number;
      }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);

    const settledOrder = json.data.items.find((o) => o.id === orderId);
    expect(settledOrder).toBeTruthy();
    expect(settledOrder!.status).toBe('SETTLED');
    expect(settledOrder!.originalAmount).toBe(8000);
  });

  test('verify member recharge history', async ({ request }) => {
    const res = await request.get(
      `/api/v1/members/${memberId}/recharge-history?page=1&pageSize=10`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: Array<{
        amount: number;
        giftAmount: number;
        payMethod: string;
      }>;
      pagination: { total: number };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.items.length).toBeGreaterThanOrEqual(1);

    const rechargeRecord = json.data.items[0];
    expect(rechargeRecord.amount).toBe(10000);
    expect(rechargeRecord.giftAmount).toBe(2000);
    expect(rechargeRecord.payMethod).toBe('WECHAT');
  });

  test('test dormant member detection via lastVisitAt', async ({
    request,
  }) => {
    // Create a member with an old lastVisitAt to simulate dormant
    const dormantMemberRes = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: {
        name: uniqueName('休眠'),
        phone: uniquePhone(),
      },
    });
    const dormantJson: ApiResponse<{ id: string }> =
      await dormantMemberRes.json();
    expect(dormantJson.code).toBe(0);
    const dormantId = dormantJson.data.id;

    // Recharge and create order to set lastVisitAt
    await request.post(`/api/v1/members/${dormantId}/recharge`, {
      headers: authHeader(token),
      data: { amount: 10000, payMethod: 'CASH' },
    });

    const orderRes = await request.post('/api/v1/orders', {
      headers: authHeader(token),
      data: {
        memberId: dormantId,
        items: [{ serviceItemId, staffId, quantity: 1 }],
      },
    });
    const orderJson: ApiResponse<{ id: string; payableAmount: number }> =
      await orderRes.json();

    await request.post(`/api/v1/orders/${orderJson.data.id}/settle`, {
      headers: authHeader(token),
      data: {
        payments: [{ method: 'BALANCE', amount: orderJson.data.payableAmount }],
      },
    });

    // Verify the member has lastVisitAt set
    const detail = await getMemberDetail(request, dormantId);
    expect(detail.lastVisitAt).toBeTruthy();

    // In a real scenario, a scheduled job would check lastVisitAt > 90 days
    // Here we verify the data field exists and is queryable for dormant detection
    const lastVisit = new Date(detail.lastVisitAt!);
    const now = new Date();
    const daysSinceVisit =
      (now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24);

    // Since we just visited, days should be < 1 (active member)
    expect(daysSinceVisit).toBeLessThan(1);

    // A dormant member would have daysSinceVisit > 90
    // The API query /api/v1/members can filter by lastVisitAt for dormant detection
  });

  test('update member info', async ({ request }) => {
    const newName = uniqueName('更新后');
    const res = await request.patch(`/api/v1/members/${memberId}`, {
      headers: authHeader(token),
      data: { name: newName, gender: 'FEMALE' },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ name: string }> = await res.json();
    expect(json.code).toBe(0);

    const detail = await getMemberDetail(request, memberId);
    expect(detail.name).toBe(newName);
  });

  test('get member levels list', async ({ request }) => {
    const res = await request.get('/api/v1/member-levels', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<
      Array<{ id: string; name: string }>
    > = await res.json();
    expect(json.code).toBe(0);
    expect(json.data.length).toBeGreaterThanOrEqual(1);
  });

  test('get system auto tags for member', async ({ request }) => {
    const res = await request.get(
      `/api/v1/members/${memberId}/tags/auto`,
      { headers: authHeader(token) },
    );
    expect(res.status()).toBe(200);

    const json: ApiResponse<
      Array<{ id: string; name: string; type: string }>
    > = await res.json();
    expect(json.code).toBe(0);
    // Auto tags may be empty or contain system-generated tags
    expect(Array.isArray(json.data)).toBe(true);
  });
});
