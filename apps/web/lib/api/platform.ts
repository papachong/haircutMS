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