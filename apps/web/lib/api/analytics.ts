import { apiFetch } from './client';
import { TimeRange } from './dashboard';

export interface RevenueComposition {
  offline: number;
  balance: number;
  recharge: number;
  passCard: number;
}

export interface RevenueBreakdown {
  composition: RevenueComposition;
  rechargeIncome: number;
  consumeIncome: number;
}

export interface ServiceItemRanking {
  id: string;
  name: string;
  count: number;
  amount: number;
  averagePrice: number;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function getRevenueBreakdown(
  timeRange: TimeRange = TimeRange.TODAY,
  startDate?: string,
  endDate?: string,
): Promise<RevenueBreakdown> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await apiFetch<ApiResponse<RevenueBreakdown>>(
    `/dashboard/revenue-breakdown?${params.toString()}`,
  );
  return res.data;
}

export async function getServiceRanking(
  timeRange: TimeRange = TimeRange.TODAY,
  startDate?: string,
  endDate?: string,
  limit?: number,
): Promise<ServiceItemRanking[]> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);
  if (limit) params.append('limit', limit.toString());

  const res = await apiFetch<ApiResponse<ServiceItemRanking[]>>(
    `/dashboard/service-ranking?${params.toString()}`,
  );
  return res.data;
}
