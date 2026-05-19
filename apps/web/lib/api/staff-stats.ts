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

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function getShopStaffStats(
  startDate?: string,
  endDate?: string,
): Promise<StaffStats[]> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  const res = await apiFetch<ApiResponse<StaffStats[]>>(
    `/staff-stats${qs ? '?' + qs : ''}`,
  );
  return res.data;
}

export async function getStaffDetailStats(staffId: string): Promise<StaffStats | null> {
  const res = await apiFetch<ApiResponse<StaffStats | null>>(
    `/staff-stats/staff/${staffId}`,
  );
  return res.data;
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
  const res = await apiFetch<ApiResponse<StaffStats | null>>(
    `/staff-stats/staff/${staffId}/summary${queryString ? '?' + queryString : ''}`,
  );
  return res.data;
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
  const res = await apiFetch<ApiResponse<PaginatedServiceRecords>>(
    `/staff-stats/staff/${staffId}/records?${params.toString()}`,
  );
  return res.data;
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
  const res = await apiFetch<ApiResponse<ServiceTrend[]>>(
    `/staff-stats/staff/${staffId}/trends?${params.toString()}`,
  );
  return res.data;
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
  const res = await apiFetch<ApiResponse<PaginatedServiceRecords>>(
    `/staff-stats/my/records?${params.toString()}`,
  );
  return res.data;
}

export async function getMyStatsSummary(
  startDate?: string,
  endDate?: string,
): Promise<StaffStats | null> {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const qs = params.toString();
  const res = await apiFetch<ApiResponse<StaffStats | null>>(
    `/staff-stats/my/summary${qs ? '?' + qs : ''}`,
  );
  return res.data;
}

export async function getMyServiceTrends(
  timeRange: TimeRange = 'week',
  startDate?: string,
  endDate?: string,
): Promise<ServiceTrend[]> {
  const params = new URLSearchParams({ timeRange });
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  const res = await apiFetch<ApiResponse<ServiceTrend[]>>(
    `/staff-stats/my/trends?${params.toString()}`,
  );
  return res.data;
}