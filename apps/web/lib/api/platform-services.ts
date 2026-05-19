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

export async function platformApiFetch<T>(path: string, options?: RequestInit): Promise<{ code: number; data: T; message?: string }> {
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
  return platformApiFetch<any>('/auth/me');
}

// License Management APIs

export type LicensePlan = 'FREE' | 'PRO' | 'ENTERPRISE';
export type LicenseStatus = 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED';

export interface PlanDefaults {
  plans: Array<{
    plan: string;
    staffLimit: number;
    membersLimit: number;
    modules: string[];
  }>;
  availableModules: Array<{
    id: string;
    name: string;
  }>;
}

export interface LicenseListItem {
  id: string;
  shopId: string;
  shopName: string;
  licenseKey: string;
  plan: LicensePlan;
  staffLimit: number;
  membersLimit: number;
  modules: string[];
  expiresAt: string;
  daysUntilExpiry: number;
  isExpiringSoon: boolean;
  isExpired: boolean;
  status: LicenseStatus;
  issuedAt: string;
  createdAt: string;
}

export interface LicenseUsage {
  currentStaffCount: number;
  currentMembersCount: number;
}

export interface LicenseDetail extends LicenseListItem {
  shop: {
    id: string;
    name: string;
    phone: string | null;
    status: string;
  };
  signature: string;
  features: Record<string, unknown>;
  updatedAt: string;
  usage: LicenseUsage;
}

export interface CreateLicenseDto {
  shopId: string;
  plan: LicensePlan;
  durationMonths: number;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface UpdateLicenseDto {
  plan?: LicensePlan;
  durationMonths?: number;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface RenewLicenseDto {
  durationMonths: number;
  plan?: LicensePlan;
  staffLimit?: number;
  membersLimit?: number;
  modules?: string[];
  features?: Record<string, unknown>;
}

export interface ExpiringShopItem {
  id: string;
  name: string;
  phone: string | null;
  licensePlan: LicensePlan;
  expiresAt: string;
  daysUntilExpiry: number;
}

export async function getAllLicenses(): Promise<LicenseListItem[]> {
  const result = await platformApiFetch<LicenseListItem[]>('/licenses');
  return result.data;
}

export async function getLicenseById(id: string): Promise<LicenseDetail> {
  const result = await platformApiFetch<LicenseDetail>(`/licenses/${id}`);
  return result.data;
}

export async function getLicenseByShopId(shopId: string): Promise<LicenseDetail> {
  const result = await platformApiFetch<LicenseDetail>(`/licenses/shop/${shopId}`);
  return result.data;
}

export async function createLicense(data: CreateLicenseDto) {
  return platformApiFetch<{ licenseKey: string; license: LicenseDetail }>('/licenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateLicense(id: string, data: UpdateLicenseDto): Promise<LicenseDetail> {
  const result = await platformApiFetch<LicenseDetail>(`/licenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function renewLicense(id: string, data: RenewLicenseDto): Promise<LicenseDetail> {
  const result = await platformApiFetch<LicenseDetail>(`/licenses/${id}/renew`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function getExpiringShops(): Promise<ExpiringShopItem[]> {
  const result = await platformApiFetch<ExpiringShopItem[]>('/licenses/expiring/list');
  return result.data;
}

export async function getPlanDefaults(): Promise<PlanDefaults> {
  const result = await platformApiFetch<PlanDefaults>('/licenses/plan-defaults');
  return result.data;
}

// Shop Management APIs

export interface ShopListItem {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  license?: {
    id: string;
    plan: LicensePlan;
    expiresAt: string | null;
    isExpired: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export async function getAllShops(): Promise<ShopListItem[]> {
  const result = await platformApiFetch<ShopListItem[]>('/shops');
  return result.data;
}

export async function getShopDetail(id: string) {
  return platformApiFetch<ShopListItem>(`/shops/${id}`);
}

// Stats APIs

export interface PlatformStats {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  archivedShops: number;
  totalRevenue: number;
  totalMembers: number;
  totalOrders: number;
  expiringSoonCount: number;
  expiredCount: number;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const result = await platformApiFetch<PlatformStats>('/stats');
  return result.data;
}