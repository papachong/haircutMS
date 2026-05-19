import { apiFetch } from './client';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export interface MemberLevelDistribution {
  levelId: string;
  levelName: string;
  count: number;
  percentage: number;
}

export interface MemberConsumptionTrendData {
  date: string;
  recharge: number;
  consume: number;
}

export interface MemberConsumptionTrends {
  data: MemberConsumptionTrendData[];
  totalRecharge: number;
  totalConsume: number;
  granularity: 'day' | 'week' | 'month';
}

export interface DormantMembersStats {
  totalCount: number;
  dormantCount: number;
  dormantPercentage: number;
}

export interface DormantMemberDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface DormantMembersDetail extends DormantMembersStats {
  distribution: DormantMemberDistribution[];
}

export interface DailyConsumptionData {
  date: string;
  amount: number;
  count: number;
}

export interface DailyConsumptionResponse {
  data: DailyConsumptionData[];
  totalAmount: number;
  totalCount: number;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function getMemberLevelDistribution(): Promise<MemberLevelDistribution[]> {
  const res = await apiFetch<ApiResponse<MemberLevelDistribution[]>>('/dashboard/members/level-distribution');
  return res.data;
}

export async function getMemberConsumptionTrends(
  timeRange: TimeRange = TimeRange.MONTH,
  startDate?: string,
  endDate?: string,
): Promise<MemberConsumptionTrends> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const res = await apiFetch<ApiResponse<MemberConsumptionTrends>>(
    `/dashboard/members/consumption-trends?${params.toString()}`,
  );
  return res.data;
}

export async function getDormantMembersStats(days: number = 90): Promise<DormantMembersStats> {
  const params = new URLSearchParams({ dormantDays: days.toString() });
  const res = await apiFetch<ApiResponse<DormantMembersStats>>(
    `/dashboard/members/dormant-stats?${params.toString()}`,
  );
  return res.data;
}

export async function getDormantMembersDetail(days: number = 90): Promise<DormantMembersDetail> {
  const params = new URLSearchParams({ dormantDays: days.toString() });
  const res = await apiFetch<ApiResponse<DormantMembersDetail>>(
    `/dashboard/members/dormant-detail?${params.toString()}`,
  );
  return res.data;
}

export async function getDailyConsumptionTrends(days: number = 30): Promise<DailyConsumptionResponse> {
  const params = new URLSearchParams({ days: days.toString() });
  const res = await apiFetch<ApiResponse<DailyConsumptionResponse>>(
    `/dashboard/members/daily-consumption?${params.toString()}`,
  );
  return res.data;
}
