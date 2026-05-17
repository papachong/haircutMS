import { apiFetch } from './client';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export interface DashboardMetrics {
  revenue: number;
  visitorCount: number;
  averageTicket: number;
  newMembers: number;
  periodStart: string;
  periodEnd: string;
  previousPeriodRevenue?: number;
  revenueGrowth?: number;
}

export interface TrendDataPoint {
  date: string;
  revenue: number;
  visitors: number;
}

export interface DashboardTrends {
  data: TrendDataPoint[];
  granularity: 'day' | 'week' | 'month';
  totalRevenue: number;
  totalVisitors: number;
}

export async function getDashboardMetrics(
  timeRange: TimeRange = TimeRange.TODAY,
  startDate?: string,
  endDate?: string,
): Promise<DashboardMetrics> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return apiFetch(`/dashboard/metrics?${params.toString()}`);
}

export async function getDashboardTrends(
  timeRange: TimeRange = TimeRange.TODAY,
  startDate?: string,
  endDate?: string,
): Promise<DashboardTrends> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return apiFetch(`/dashboard/trends?${params.toString()}`);
}