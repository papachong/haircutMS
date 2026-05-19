/**
 * Shared E2E test fixtures.
 *
 * All tests operate against the NestJS server at localhost:4000 using raw
 * API requests (no browser).  Test accounts and shop IDs are read from
 * environment variables with sensible defaults that match the seed data.
 *
 * Amount unit: **分 (integer)** — e.g. 10000 = ¥100.00
 */

import { APIRequestContext, request } from '@playwright/test';

/* ------------------------------------------------------------------ */
/*  Environment helpers                                                */
/* ------------------------------------------------------------------ */

const env = {
  /** Shop A (primary test shop) */
  shopIdA: process.env.E2E_SHOP_ID_A ?? '',
  shopPhoneA: process.env.E2E_SHOP_PHONE_A ?? '13800000001',
  shopPasswordA: process.env.E2E_SHOP_PASSWORD_A ?? '123456',

  /** Shop B (secondary — used for tenant isolation tests) */
  shopIdB: process.env.E2E_SHOP_ID_B ?? '',
  shopPhoneB: process.env.E2E_SHOP_PHONE_B ?? '13800000002',
  shopPasswordB: process.env.E2E_SHOP_PASSWORD_B ?? '123456',
};

/* ------------------------------------------------------------------ */
/*  API response wrapper                                               */
/* ------------------------------------------------------------------ */

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

/* ------------------------------------------------------------------ */
/*  Authenticated API context factory                                  */
/* ------------------------------------------------------------------ */

export async function createAuthenticatedContext(
  phone: string,
  password: string,
  shopId?: string,
): Promise<{ context: APIRequestContext; token: string; staffId: string }> {
  const context = await request.newContext({
    baseURL: 'http://localhost:4000',
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  });

  const body: Record<string, string> = { phone, password };
  if (shopId) {
    body.shopId = shopId;
  }

  const res = await context.post('/api/v1/auth/login', { data: body });
  const json: ApiResponse<{
    accessToken: string;
    staffId: string;
    shopId: string;
    role: string;
  }> = await res.json();

  if (json.code !== 0) {
    throw new Error(`Login failed: ${json.message}`);
  }

  return {
    context,
    token: json.data.accessToken,
    staffId: json.data.staffId,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: build Authorization headers                                */
/* ------------------------------------------------------------------ */

export function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

/* ------------------------------------------------------------------ */
/*  Shared test data generators                                        */
/* ------------------------------------------------------------------ */

let counter = Date.now();

/** Generate a unique phone number for test members. */
export function uniquePhone(): string {
  counter += 1;
  return `139${String(counter).slice(-8)}`;
}

/** Generate a unique card number for test members. */
export function uniqueCardNo(): string {
  counter += 1;
  return `E2E${String(counter).slice(-6)}`;
}

/** Generate a unique name. */
export function uniqueName(prefix = '测试'): string {
  counter += 1;
  return `${prefix}${String(counter).slice(-6)}`;
}

/* ------------------------------------------------------------------ */
/*  Seed helpers — create prerequisite test data via API               */
/* ------------------------------------------------------------------ */

export interface TestDataRefs {
  /** Shop A context */
  ctxA: { context: APIRequestContext; token: string; staffId: string };
  /** Shop B context */
  ctxB: { context: APIRequestContext; token: string; staffId: string };
}

/**
 * Perform full login for both shops and return authenticated contexts.
 * If shop IDs are not provided via env vars, discover them from login.
 */
export async function setupTestShops(): Promise<TestDataRefs> {
  const ctxA = await createAuthenticatedContext(env.shopPhoneA, env.shopPasswordA, env.shopIdA || undefined);
  const ctxB = await createAuthenticatedContext(env.shopPhoneB, env.shopPasswordB, env.shopIdB || undefined);
  return { ctxA, ctxB };
}

/* ------------------------------------------------------------------ */
/*  Export env for direct use in tests                                 */
/* ------------------------------------------------------------------ */

export { env };
