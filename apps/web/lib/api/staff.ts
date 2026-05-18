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

export async function getStaffList(): Promise<Staff[]> {
  return apiFetch('/staff');
}

export async function getStaffById(id: string): Promise<Staff | null> {
  return apiFetch(`/staff/${id}`);
}

export async function createStaff(data: CreateStaffInput): Promise<Staff> {
  return apiFetch('/staff', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateStaff(id: string, data: UpdateStaffInput): Promise<Staff> {
  return apiFetch(`/staff/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function toggleStaffStatus(id: string): Promise<Staff> {
  return apiFetch(`/staff/${id}/toggle`, {
    method: 'PATCH',
  });
}

export async function resetStaffPassword(id: string, password: string): Promise<{ id: string; message: string }> {
  return apiFetch(`/staff/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  OWNER: '店长',
  MANAGER: '经理',
  RECEPTIONIST: '前台',
  STYLIST: '发型师',
  TECHNICIAN: '技师',
};