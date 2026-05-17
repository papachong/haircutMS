import { apiFetch } from './client';

export interface StaffRankingItem {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
}

export interface ServiceTypeDistribution {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  count: number;
  revenue: number;
}

export interface StaffStatsDetail {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
  serviceDistribution: ServiceTypeDistribution[];
}

export interface PersonalServiceRecord {
  id: string;
  orderNo: string;
  serviceName: string;
  price: number;
  quantity: number;
  subtotal: number;
  memberName: string;
  createdAt: string;
}

export async function getStaffRanking(): Promise<StaffRankingItem[]> {
  const res = await apiFetch<{ code: number; data: StaffRankingItem[] }>(
    '/staff-stats/ranking',
  );
  if (res.code !== 0) {
    throw new Error('Failed to fetch staff ranking');
  }
  return res.data;
}

export async function getStaffDetail(staffId: string): Promise<StaffStatsDetail> {
  const res = await apiFetch<{ code: number; data: StaffStatsDetail }>(
    `/staff-stats/staff/${staffId}`,
  );
  if (res.code !== 0) {
    throw new Error('Failed to fetch staff detail');
  }
  return res.data;
}

export async function getPersonalRecords(
  limit: number = 50,
): Promise<PersonalServiceRecord[]> {
  const res = await apiFetch<{ code: number; data: PersonalServiceRecord[] }>(
    `/staff-stats/personal?limit=${limit}`,
  );
  if (res.code !== 0) {
    throw new Error('Failed to fetch personal records');
  }
  return res.data;
}

export const STAFF_ROLE_LABELS: Record<string, string> = {
  OWNER: '店长',
  MANAGER: '经理',
  RECEPTIONIST: '前台',
  STYLIST: '发型师',
  TECHNICIAN: '技师',
};

export const STAFF_ROLE_ICONS: Record<string, string> = {
  OWNER: '👑',
  MANAGER: '👔',
  RECEPTIONIST: '👋',
  STYLIST: '✂️',
  TECHNICIAN: '🔧',
};