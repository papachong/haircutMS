/**
 * API Helper for E2E Tests
 * Provides direct API access for backend testing
 */

const API_BASE_URL = 'http://localhost:4000/api/v1';
const PLATFORM_API_BASE_URL = 'http://localhost:4000/api/v1/platform';

export class ApiHelper {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private platformAccessToken: string | null = null;

  setAuthTokens(accessToken: string, refreshToken?: string) {
    this.accessToken = accessToken;
    if (refreshToken) this.refreshToken = refreshToken;
  }

  setPlatformAuthToken(token: string) {
    this.platformAccessToken = token;
  }

  clearAuthTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.platformAccessToken = null;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {},
    isPlatform = false,
  ): Promise<T> {
    const baseUrl = isPlatform ? PLATFORM_API_BASE_URL : API_BASE_URL;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (isPlatform && this.platformAccessToken) {
      headers.Authorization = `Bearer ${this.platformAccessToken}`;
    } else if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // ==================== Platform Admin APIs ====================

  async platformLogin(phone: string, password: string) {
    const response = await this.request<{ code: number; data: { accessToken: string; refreshToken: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      },
      true,
    );

    if (response.code === 0 && response.data) {
      this.setPlatformAuthToken(response.data.accessToken);
    }

    return response;
  }

  async createShop(data: { name: string; phone?: string; address?: string }) {
    return this.request<{ code: number; data: any; message: string }>(
      '/shops',
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      true,
    );
  }

  async assignLicense(shopId: string, licenseData: { plan: string; staffLimit: number; modules: string[] }) {
    return this.request<{ code: number; data: any; message: string }>(
      `/shops/${shopId}/license`,
      {
        method: 'POST',
        body: JSON.stringify(licenseData),
      },
      true,
    );
  }

  async getPlatformOverview() {
    return this.request<{ code: number; data: any; message: string }>('/overview', {}, true);
  }

  // ==================== Shop Admin APIs ====================

  async shopLogin(phone: string, password: string) {
    const response = await this.request<{ code: number; data: { accessToken: string; refreshToken: string } }>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      },
    );

    if (response.code === 0 && response.data) {
      this.setAuthTokens(response.data.accessToken, response.data.refreshToken);
    }

    return response;
  }

  async createMember(data: { name: string; phone: string; gender?: string; memberLevelId?: string }) {
    return this.request<{ code: number; data: any; message: string }>('/members', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getMemberById(id: string) {
    return this.request<{ code: number; data: any; message: string }>(`/members/${id}`);
  }

  async searchMembers(keyword: string) {
    return this.request<{ code: number; data: any[]; message: string }>(
      `/members/search/keyword?keyword=${encodeURIComponent(keyword)}`,
    );
  }

  async getMemberLevels() {
    return this.request<{ code: number; data: any[]; message: string }>('/member-levels');
  }

  async rechargeMember(
    memberId: string,
    data: { amount?: number; giftAmount?: number; payMethod: string; planId?: string; remark?: string },
  ) {
    return this.request<{ code: number; data: any; message: string }>(`/members/${memberId}/recharge`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async createRechargePlan(data: { name: string; amount: number; giftAmount: number; type: string }) {
    return this.request<{ code: number; data: any; message: string }>('/recharge-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getServiceCategories() {
    return this.request<{ code: number; data: any[]; message: string }>('/service/categories');
  }

  async getServiceItems(categoryId?: string) {
    const query = categoryId ? `?categoryId=${categoryId}` : '?activeOnly=true';
    return this.request<{ code: number; data: any[]; message: string }>(`/service/items${query}`);
  }

  async getStaff() {
    return this.request<{ code: number; data: any[]; message: string }>('/staff');
  }

  async createOrder(data: { memberId: string; items: Array<{ serviceItemId: string; staffId: string; quantity: number }>; remark?: string }) {
    return this.request<{ code: number; data: any; message: string }>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrders(params?: { memberId?: string; status?: string; page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.memberId) query.append('memberId', params.memberId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const queryString = query.toString();
    return this.request<{ code: number; data: any; message: string }>(`/orders${queryString ? `?${queryString}` : ''}`);
  }

  async settleOrder(orderId: string, payments: Array<{ method: string; amount: number; detail?: string; passCardId?: string; couponInstanceId?: string }>) {
    return this.request<{ code: number; data: any; message: string }>(`/orders/${orderId}/settle`, {
      method: 'POST',
      body: JSON.stringify({ payments }),
    });
  }

  async cancelOrder(orderId: string, reason: string) {
    return this.request<{ code: number; data: any; message: string }>(`/orders/${orderId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async createPassCard(data: { memberId: string; name: string; totalTimes: number; price: number; expiresAt?: string }) {
    return this.request<{ code: number; data: any; message: string }>('/pass-cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPassCards(params?: { memberId?: string; availableOnly?: boolean }) {
    const query = new URLSearchParams();
    if (params?.memberId) query.append('memberId', params.memberId);
    if (params?.availableOnly) query.append('availableOnly', 'true');

    const queryString = query.toString();
    return this.request<{ code: number; data: any; message: string }>(`/pass-cards${queryString ? `?${queryString}` : ''}`);
  }

  async createCouponTemplate(data: { name: string; type: string; threshold: number; discount: number; total: number; startsAt: string; endsAt: string }) {
    return this.request<{ code: number; data: any; message: string }>('/coupons/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async issueCoupon(templateId: string, memberId: string) {
    return this.request<{ code: number; data: any; message: string }>(`/coupons/templates/${templateId}/issue`, {
      method: 'POST',
      body: JSON.stringify({ memberId }),
    });
  }

  async getAvailableCoupons(memberId: string, amount: number) {
    return this.request<{ code: number; data: any[]; message: string }>(
      `/coupons/members/${memberId}/available?amount=${amount}`,
    );
  }

  async createStaff(data: { name: string; phone: string; password: string; role?: string }) {
    return this.request<{ code: number; data: any; message: string }>('/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getLicenseInfo() {
    return this.request<{ code: number; data: any; message: string }>('/license');
  }

  async getAuditLogs(params?: { action?: string; targetType?: string; page?: number; pageSize?: number }) {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.targetType) query.append('targetType', params.targetType);
    if (params?.page) query.append('page', String(params.page));
    if (params?.pageSize) query.append('pageSize', String(params.pageSize));

    const queryString = query.toString();
    return this.request<{ code: number; data: any; message: string }>(`/audit${queryString ? `?${queryString}` : ''}`);
  }
}