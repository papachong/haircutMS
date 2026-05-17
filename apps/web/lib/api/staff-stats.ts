import { apiFetch } from './client';

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

export async function getShopStaffStats(): Promise<StaffStats[]> {
  return apiFetch('/staff-stats');
}

export async function getStaffDetailStats(staffId: string): Promise<StaffStats | null> {
  return apiFetch(`/staff-stats/staff/${staffId}`);
}

export async function getMyServiceRecords(
  page: number = 1,
  limit: number = 20,
): Promise<PaginatedServiceRecords> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  return apiFetch(`/staff-stats/my/records?${params.toString()}`);
}

export async function getMyStatsSummary(): Promise<StaffStats | null> {
  return apiFetch('/staff-stats/my/summary');
}