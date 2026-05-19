import { apiFetch } from './client';

export type StaffRole = 'OWNER' | 'MANAGER' | 'RECEPTIONIST' | 'STYLIST' | 'TECHNICIAN';

export interface Staff {
  id: string;
  name: string;
  phone: string;
  role: StaffRole;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface CreateStaffInput {
  name: string;
  phone: string;
  password: string;
  role?: StaffRole;
  avatar?: string;
}

export interface UpdateStaffInput {
  name?: string;
  phone?: string;
  role?: StaffRole;
  avatar?: string;
}

interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export async function getStaffList(): Promise<Staff[]> {
  const res = await apiFetch<ApiResponse<Staff[]>>('/staff');
  return res.data;
}

export async function getStaffById(id: string): Promise<Staff> {
  const res = await apiFetch<ApiResponse<Staff>>(`/staff/${id}`);
  return res.data;
}

export async function createStaff(data: CreateStaffInput): Promise<Staff> {
  const res = await apiFetch<ApiResponse<Staff>>('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<Staff> {
  const res = await apiFetch<ApiResponse<Staff>>(`/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function toggleStaffStatus(id: string): Promise<Staff> {
  const res = await apiFetch<ApiResponse<Staff>>(`/staff/${id}/toggle`, {
    method: 'PATCH',
  });
  return res.data;
}

export async function resetStaffPassword(id: string, password: string): Promise<{ id: string; message: string }> {
  const res = await apiFetch<ApiResponse<{ id: string; message: string }>>(`/staff/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
  return res.data;
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: '店长',
  MANAGER: '经理',
  RECEPTIONIST: '前台',
  STYLIST: '发型师',
  TECHNICIAN: '技师',
};
