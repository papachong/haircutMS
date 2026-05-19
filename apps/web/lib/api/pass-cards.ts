import { apiFetch } from './client';

export interface PassCardUsage {
  id: string;
  passCardId: string;
  orderItemId: string | null;
  usedAt: string;
  orderItem?: {
    id: string;
    serviceName: string;
    finalPrice: number;
    staffName?: string;
    order?: {
      orderNo: string;
      settledAt: string;
    };
  };
}

export interface PassCard {
  id: string;
  memberId: string;
  name: string;
  totalTimes: number;
  remainingTimes: number;
  price: number;
  expiresAt: string | null;
  isActive: boolean;
  status: 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  member?: {
    id: string;
    name: string;
    cardNo: string;
    phone: string;
    memberLevel?: {
      id: string;
      name: string;
      discount: number;
    };
  };
  usages?: PassCardUsage[];
}

export interface CreatePassCardInput {
  memberId: string;
  name: string;
  totalTimes: number;
  price: number;
  expiresAt?: string;
  isActive?: boolean;
}

export interface QueryPassCardsParams {
  memberId?: string;
  keyword?: string;
  status?: 'ACTIVE' | 'EXPIRED' | 'USED_UP' | 'INACTIVE';
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface PaginatedPassCardsResponse {
  items: PassCard[];
  pagination: PaginationMeta;
}

export interface UsePassCardInput {
  passCardId: string;
  orderItemId?: string;
}

export interface PassCardUsageResult {
  passCard: PassCard;
  usage: PassCardUsage;
}

export async function getPassCards(
  params?: QueryPassCardsParams,
): Promise<PaginatedPassCardsResponse> {
  const query = new URLSearchParams();
  if (params?.memberId) query.append('memberId', params.memberId);
  if (params?.keyword) query.append('keyword', params.keyword);
  if (params?.status) query.append('status', params.status);
  if (params?.availableOnly) query.append('availableOnly', 'true');
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));

  const path = `/pass-cards${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiFetch<{ code: number; data: PaginatedPassCardsResponse }>(path);
  return res.data;
}

export async function getPassCardById(id: string): Promise<PassCard> {
  const res = await apiFetch<{ code: number; data: PassCard }>(`/pass-cards/${id}`);
  return res.data;
}

export async function getPassCardUsages(
  passCardId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: PassCardUsage[]; pagination: PaginationMeta }> {
  const res = await apiFetch<{ code: number; data: { items: PassCardUsage[]; pagination: PaginationMeta } }>(
    `/pass-cards/${passCardId}/usages?page=${page}&pageSize=${pageSize}`,
  );
  return res.data;
}

export async function createPassCard(data: CreatePassCardInput): Promise<PassCard> {
  const res = await apiFetch<{ code: number; data: PassCard }>('/pass-cards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function usePassCard(data: UsePassCardInput): Promise<PassCardUsageResult> {
  const res = await apiFetch<{ code: number; data: PassCardUsageResult }>(
    `/pass-cards/${data.passCardId}/use`,
    {
      method: 'POST',
      body: JSON.stringify({ orderItemId: data.orderItemId }),
    },
  );
  return res.data;
}

export async function refundPassCardUsage(
  passCardId: string,
  usageId: string,
): Promise<{ success: boolean }> {
  const res = await apiFetch<{ code: number; data: { success: boolean } }>(
    `/pass-cards/${passCardId}/refund/${usageId}`,
    { method: 'POST' },
  );
  return res.data;
}

export async function deactivatePassCard(passCardId: string): Promise<PassCard> {
  const res = await apiFetch<{ code: number; data: PassCard }>(
    `/pass-cards/${passCardId}/deactivate`,
    { method: 'POST' },
  );
  return res.data;
}

export async function activatePassCard(passCardId: string): Promise<PassCard> {
  const res = await apiFetch<{ code: number; data: PassCard }>(
    `/pass-cards/${passCardId}/activate`,
    { method: 'POST' },
  );
  return res.data;
}

export function getPassCardStatusLabel(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return '有效';
    case 'EXPIRED':
      return '已过期';
    case 'USED_UP':
      return '已用完';
    case 'INACTIVE':
      return '已停用';
    default:
      return '未知';
  }
}

export function getPassCardStatusColor(status: string): string {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'EXPIRED':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
    case 'USED_UP':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'INACTIVE':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
}

export function isPassCardUsable(passCard: PassCard): boolean {
  return (
    passCard.isActive &&
    passCard.remainingTimes > 0 &&
    (!passCard.expiresAt || new Date(passCard.expiresAt) > new Date())
  );
}
