import { apiFetch } from './client';
import { TimeRange } from './dashboard';

export interface RevenueComposition {
  offline: number; // 线下支付
  balance: number; // 余额支付
  recharge: number; // 充值收入
  passCard: number; // 次卡收入
}

export interface RevenueBreakdown {
  composition: RevenueComposition;
  rechargeIncome: number; // 当期充值
  consumeIncome: number; // 当期消费
}

export interface ServiceItemRanking {
  id: string;
  name: string;
  count: number;
  amount: number;
  averagePrice: number;
}

export async function getRevenueBreakdown(
  timeRange: TimeRange = TimeRange.TODAY,
  startDate?: string,
  endDate?: string,
): Promise<RevenueBreakdown> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return apiFetch(`/dashboard/revenue-breakdown?${params.toString()}`);
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

  return apiFetch(`/dashboard/service-ranking?${params.toString()}`);
}