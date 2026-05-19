/**
 * E2E: Login / Authentication
 *
 * Verifies the core login flow:
 * 1. POST /api/v1/auth/login with valid credentials → 200 + tokens
 * 2. Invalid credentials → 401
 * 3. Token refresh → new valid tokens
 */

import { test, expect } from '@playwright/test';
import { env, createAuthenticatedContext, type ApiResponse } from './fixtures';

test.describe('Auth — Login flow', () => {
  test('successful login returns accessToken, refreshToken, staffId, shopId, role', async ({
    request,
  }) => {
    const body: Record<string, string> = {
      phone: env.shopPhoneA,
      password: env.shopPasswordA,
    };
    if (env.shopIdA) {
      body.shopId = env.shopIdA;
    }

    const res = await request.post('/api/v1/auth/login', { data: body });
    expect(res.status()).toBe(200);

    const json: ApiResponse<{
      accessToken: string;
      refreshToken: string;
      staffId: string;
      shopId: string;
      role: string;
    }> = await res.json();

    expect(json.code).toBe(0);
    expect(json.message).toBe('ok');
    expect(json.data.accessToken).toBeTruthy();
    expect(json.data.refreshToken).toBeTruthy();
    expect(json.data.staffId).toBeTruthy();
    expect(json.data.shopId).toBeTruthy();
    expect(json.data.role).toBeTruthy();
  });

  test('login with wrong password returns 401', async ({ request }) => {
    const body: Record<string, string> = {
      phone: env.shopPhoneA,
      password: 'wrong-password',
    };
    if (env.shopIdA) {
      body.shopId = env.shopIdA;
    }

    const res = await request.post('/api/v1/auth/login', { data: body });
    expect(res.status()).toBe(401);

    const json: ApiResponse = await res.json();
    expect(json.code).toBe(401);
    expect(json.data).toBeNull();
  });

  test('login with non-existent phone returns 401', async ({ request }) => {
    const res = await request.post('/api/v1/auth/login', {
      data: { phone: '19900009999', password: 'whatever' },
    });
    expect(res.status()).toBe(401);

    const json: ApiResponse = await res.json();
    expect(json.code).toBe(401);
  });

  test('accessing protected route without token returns 401', async ({ request }) => {
    const res = await request.get('/api/v1/members');
    expect(res.status()).toBe(401);
  });

  test('accessing protected route with valid token returns 200', async () => {
    const { context, token } = await createAuthenticatedContext(
      env.shopPhoneA,
      env.shopPasswordA,
      env.shopIdA || undefined,
    );

    const res = await context.get('/api/v1/members', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status()).toBe(200);

    const json: ApiResponse = await res.json();
    expect(json.code).toBe(0);

    await context.dispose();
  });

  test('refresh token returns new valid tokens', async ({ request }) => {
    const body: Record<string, string> = {
      phone: env.shopPhoneA,
      password: env.shopPasswordA,
    };
    if (env.shopIdA) {
      body.shopId = env.shopIdA;
    }

    const loginRes = await request.post('/api/v1/auth/login', { data: body });
    const loginJson: ApiResponse<{ refreshToken: string }> = await loginRes.json();

    const refreshRes = await request.post('/api/v1/auth/refresh', {
      data: { refreshToken: loginJson.data.refreshToken },
    });
    expect(refreshRes.status()).toBe(200);

    const refreshJson: ApiResponse<{
      accessToken: string;
      refreshToken: string;
    }> = await refreshRes.json();

    expect(refreshJson.code).toBe(0);
    expect(refreshJson.data.accessToken).toBeTruthy();
    expect(refreshJson.data.refreshToken).toBeTruthy();
  });
});
