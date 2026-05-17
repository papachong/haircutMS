import { apiFetch } from './client';

export interface CouponTemplate {
  id: string;
  shopId: string;
  name: string;
  type: 'FIXED' | 'PERCENT';
  threshold: number;
  discount: number;
  total: number;
  issued: number;
  availableCount?: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
}

export interface CouponInstance {
  id: string;
  templateId: string;
  memberId: string;
  status: 'AVAILABLE' | 'USED' | 'EXPIRED';
  usedAt: string | null;
  expiresAt: string;
  createdAt: string;
  template?: {
    id: string;
    name: string;
    type: 'FIXED' | 'PERCENT';
    threshold: number;
    discount: number;
  };
}

export interface CreateCouponTemplateDto {
  name: string;
  type: 'FIXED' | 'PERCENT';
  threshold: number;
  discount: number;
  total: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

export interface UpdateCouponTemplateDto {
  name?: string;
  type?: 'FIXED' | 'PERCENT';
  threshold?: number;
  discount?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationMeta;
}

export async function getCouponTemplates(params?: {
  type?: 'FIXED' | 'PERCENT';
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<PaginatedResponse<CouponTemplate>> {
  const query = new URLSearchParams();
  if (params?.type) query.append('type', params.type);
  if (params?.isActive !== undefined) query.append('isActive', String(params.isActive));
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));

  return apiFetch(`/coupons/templates?${query.toString()}`);
}

export async function getCouponTemplate(id: string): Promise<CouponTemplate> {
  return apiFetch(`/coupons/templates/${id}`);
}

export async function createCouponTemplate(data: CreateCouponTemplateDto): Promise<CouponTemplate> {
  return apiFetch('/coupons/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCouponTemplate(id: string, data: UpdateCouponTemplateDto): Promise<CouponTemplate> {
  return apiFetch(`/coupons/templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteCouponTemplate(id: string): Promise<{ success: boolean }> {
  return apiFetch(`/coupons/templates/${id}`, {
    method: 'DELETE',
  });
}

export async function issueCoupons(templateId: string, memberIds: string[]): Promise<{
  issued: number;
  coupons: CouponInstance[];
}> {
  return apiFetch(`/coupons/templates/${templateId}/issue`, {
    method: 'POST',
    body: JSON.stringify({ memberIds }),
  });
}

export async function getMemberCoupons(
  memberId: string,
  params?: {
    status?: 'AVAILABLE' | 'USED' | 'EXPIRED';
    page?: number;
    pageSize?: number;
  },
): Promise<PaginatedResponse<CouponInstance>> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));

  return apiFetch(`/coupons/members/${memberId}?${query.toString()}`);
}

export async function getMemberCouponSummary(memberId: string): Promise<{
  available: number;
  used: number;
  expired: number;
  recentCoupons: CouponInstance[];
}> {
  return apiFetch(`/coupons/members/${memberId}/summary`);
}

export async function getAvailableCoupons(memberId: string, amount?: number): Promise<Array<CouponInstance & {
  template: CouponTemplate;
  canUse: boolean;
  discount: number;
  finalAmount: number;
}>> {
  const query = new URLSearchParams();
  if (amount !== undefined) query.append('amount', String(amount));

  return apiFetch(`/coupons/members/${memberId}/available?${query.toString()}`);
}

export async function calculateCouponDiscount(
  couponInstanceId: string,
  amount: number,
): Promise<{
  canUse: boolean;
  discount: number;
  finalAmount: number;
  reason?: string;
}> {
  return apiFetch('/coupons/calculate-discount', {
    method: 'POST',
    body: JSON.stringify({ couponInstanceId, amount }),
  });
}