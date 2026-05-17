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

export async function getMemberLevelDistribution(): Promise<MemberLevelDistribution[]> {
  return apiFetch('/dashboard/members/level-distribution');
}

export async function getMemberConsumptionTrends(
  timeRange: TimeRange = TimeRange.MONTH,
  startDate?: string,
  endDate?: string,
): Promise<MemberConsumptionTrends> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  return apiFetch(`/dashboard/members/consumption-trends?${params.toString()}`);
}

export async function getDormantMembersStats(days: number = 90): Promise<DormantMembersStats> {
  const params = new URLSearchParams({ dormantDays: days.toString() });
  return apiFetch(`/dashboard/members/dormant-stats?${params.toString()}`);
}