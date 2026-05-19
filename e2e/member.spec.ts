/**
 * E2E: Member Management
 *
 * Covers:
 * 1. Create a member → verify created
 * 2. Search by keyword → find the member
 * 3. View member detail → full data
 * 4. Update member info → verify changes
 */

import { test, expect } from '@playwright/test';
import {
  createAuthenticatedContext,
  authHeader,
  uniquePhone,
  uniqueName,
  type ApiResponse,
} from './fixtures';

test.describe('Member CRUD', () => {
  let token: string;
  let staffId: string;

  test.beforeAll(async () => {
    const ctx = await createAuthenticatedContext('13800000001', '123456');
    token = ctx.token;
    staffId = ctx.staffId;
    await ctx.context.dispose();
  });

  let memberId: string;

  test('create a new member', async ({ request }) => {
    const res = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: {
        name: uniqueName('会员'),
        phone: uniquePhone(),
        gender: 'MALE',
      },
    });
    expect(res.status()).toBe(201);

    const json: ApiResponse<{
      id: string;
      name: string;
      phone: string;
      cardNo: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.id).toBeTruthy();
    expect(json.data.cardNo).toBeTruthy();

    memberId = json.data.id;
  });

  test('search members by keyword', async ({ request }) => {
    // First create a member with a known name
    const knownName = uniqueName('搜索');
    const createRes = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: knownName, phone: uniquePhone() },
    });
    const createJson: ApiResponse<{ id: string }> = await createRes.json();
    expect(createJson.code).toBe(0);

    // Search by the unique name
    const searchRes = await request.get(
      `/api/v1/members/search/keyword?keyword=${encodeURIComponent(knownName)}`,
      { headers: authHeader(token) },
    );
    expect(searchRes.status()).toBe(200);

    const searchJson: ApiResponse<Array<{ id: string; name: string }>> =
      await searchRes.json();
    expect(searchJson.code).toBe(0);
    expect(searchJson.data.length).toBeGreaterThanOrEqual(1);
    expect(searchJson.data.some((m) => m.name === knownName)).toBe(true);
  });

  test('get member by id', async ({ request }) => {
    // Create a member first
    const createRes = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('详情'), phone: uniquePhone(), gender: 'FEMALE' },
    });
    const createJson: ApiResponse<{ id: string }> = await createRes.json();
    const id = createJson.data.id;

    const res = await request.get(`/api/v1/members/${id}`, {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{ id: string; memberLevel: { name: string } }> =
      await res.json();
    expect(json.code).toBe(0);
    expect(json.data.id).toBe(id);
    expect(json.data.memberLevel).toBeTruthy();
  });

  test('update member info', async ({ request }) => {
    // Create a member to update
    const createRes = await request.post('/api/v1/members', {
      headers: authHeader(token),
      data: { name: uniqueName('修改前'), phone: uniquePhone() },
    });
    const createJson: ApiResponse<{ id: string; name: string }> =
      await createRes.json();
    const id = createJson.data.id;

    const newName = uniqueName('修改后');
    const updateRes = await request.patch(`/api/v1/members/${id}`, {
      headers: authHeader(token),
      data: { name: newName },
    });
    expect(updateRes.status()).toBe(200);

    const updateJson: ApiResponse<{ id: string; name: string }> =
      await updateRes.json();
    expect(updateJson.code).toBe(0);

    // Verify the change
    const getRes = await request.get(`/api/v1/members/${id}`, {
      headers: authHeader(token),
    });
    const getJson: ApiResponse<{ name: string }> = await getRes.json();
    expect(getJson.data.name).toBe(newName);
  });

  test('list members with pagination', async ({ request }) => {
    const res = await request.get('/api/v1/members?page=1&pageSize=5', {
      headers: authHeader(token),
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      items: unknown[];
      pagination: { total: number; page: number; pageSize: number; hasMore: boolean };
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.data.pagination.page).toBe(1);
    expect(json.data.pagination.pageSize).toBe(5);
    expect(Array.isArray(json.data.items)).toBe(true);
  });
});
