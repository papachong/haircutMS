import { apiFetch } from './client';

export type TimeRange = 'day' | 'week' | 'month';

export interface ServiceTypeStat {
  categoryId: string;
  categoryName: string;
  count: number;
  revenue: number;
}

export interface StaffStats {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
  serviceTypeDistribution: ServiceTypeStat[];
}

export interface PersonalServiceRecord {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  serviceName: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  discountRate: string;
  finalPrice: number;
  completedAt: string;
}

export interface PaginatedServiceRecords {
  records: PersonalServiceRecord[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceTrend {
  date: string;
  count: number;
  revenue: number;
}

export async function getShopStaffStats(): Promise<StaffStats[]> {
  return apiFetch('/staff-stats');
}

export async function getStaffDetailStats(staffId: string): Promise<StaffStats | null> {
  return apiFetch(`/staff-stats/staff/${staffId}`);
}

export async function getStaffDetailStatsWithDate(
  staffId: string,
  startDate?: string,
  endDate?: string,
): Promise<StaffStats | null> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const queryString = params.toString();
  return apiFetch(`/staff-stats/staff/${staffId}/summary${queryString ? '?' + queryString : ''}`);
}

export async function getStaffRecords(
  staffId: string,
  page: number = 1,
  limit: number = 20,
  startDate?: string,
  endDate?: string,
): Promise<PaginatedServiceRecords> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return apiFetch(`/staff-stats/staff/${staffId}/records?${params.toString()}`);
}

export async function getStaffServiceTrends(
  staffId: string,
  timeRange: TimeRange = 'week',
  startDate?: string,
  endDate?: string,
): Promise<ServiceTrend[]> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return apiFetch(`/staff-stats/staff/${staffId}/trends?${params.toString()}`);
}

export async function getMyServiceRecords(
  page: number = 1,
  limit: number = 20,
  startDate?: string,
  endDate?: string,
): Promise<PaginatedServiceRecords> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  return apiFetch(`/staff-stats/my/records?${params.toString()}`);
}

export async function getMyStatsSummary(): Promise<StaffStats | null> {
  return apiFetch('/staff-stats/my/summary');
}