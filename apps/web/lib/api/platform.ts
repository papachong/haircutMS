const BASE_URL = '/api/v1/platform';

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  const authType = localStorage.getItem('authType');

  if (!refreshToken || authType !== 'platform') return null;

  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json();
    if (data.code === 0) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      return data.data.accessToken;
    }
  } catch {}
  return null;
}

export async function platformApiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('accessToken');
  const authType = localStorage.getItem('authType');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };

  if (token && authType === 'platform') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
    } else {
      localStorage.clear();
      window.location.href = '/platform/login';
      throw new Error('Session expired');
    }
  }

  return res.json();
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  adminId: string;
  role: string;
}

export async function platformLogin(data: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await res.json();

  if (result.code !== 0) {
    throw new Error(result.message || 'Login failed');
  }

  return result.data;
}

export async function getPlatformProfile() {
  return platformApiFetch<{ code: number; data: any }>('/auth/me');
}

// Platform Overview API
export interface PlatformOverview {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  archivedShops: number;
  totalMembers: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  activeShopsThisMonth: number;
  // Month-over-month growth rates
  shopGrowthRate: number;
  activeShopGrowthRate: number;
  revenueGrowthRate: number;
  memberGrowthRate: number;
}

export interface ShopRevenue {
  shopId: string;
  shopName: string;
  totalRevenue: number;
  orderCount: number;
  memberCount: number;
}

export interface ShopUsage {
  shopId: string;
  shopName: string;
  phone: string | null;
  status: string;
  staffCount: number;
  memberCount: number;
  orderCount: number;
  totalRevenue: number;
  storageUsage: number;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface NewShopsTrend {
  date: string;
  count: number;
}

export interface RevenueTrend {
  date: string;
  revenue: number;
  orderCount: number;
}

export async function getPlatformOverview(): Promise<{
  code: number;
  data: PlatformOverview;
  message: string;
}> {
  return platformApiFetch('/overview');
}

export async function getTopShopsByRevenue(
  limit: number = 10,
): Promise<{ code: number; data: ShopRevenue[]; message: string }> {
  return platformApiFetch(`/overview/top-revenue?limit=${limit}`);
}

export async function getShopUsageStats(): Promise<{
  code: number;
  data: ShopUsage[];
  message: string;
}> {
  return platformApiFetch('/overview/shop-usage');
}

export async function getNewShopsTrend(
  days: number = 30,
): Promise<{ code: number; data: NewShopsTrend[]; message: string }> {
  return platformApiFetch(`/overview/trend/new-shops?days=${days}`);
}

export async function getRevenueTrend(
  days: number = 30,
): Promise<{ code: number; data: RevenueTrend[]; message: string }> {
  return platformApiFetch(`/overview/trend/revenue?days=${days}`);
}

export interface ExpiringLicense {
  shopId: string;
  shopName: string;
  shopPhone: string | null;
  licensePlan: string;
  expiresAt: string;
  daysUntilExpiry: number;
}

export async function getExpiringLicenses(
  days: number = 15,
): Promise<{ code: number; data: ExpiringLicense[]; message: string }> {
  return platformApiFetch(`/overview/expiring-licenses?days=${days}`);
}