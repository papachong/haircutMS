import { apiFetch } from './client';

export interface MemberLevel {
  id: string;
  name: string;
  discount: number;
  sortOrder: number;
  remark?: string;
}

export interface CreateMemberLevelInput {
  name: string;
  discount: number;
  sortOrder?: number;
  remark?: string;
}

export interface UpdateMemberLevelInput {
  name?: string;
  discount?: number;
  sortOrder?: number;
  remark?: string;
}

export async function getMemberLevels(): Promise<MemberLevel[]> {
  const res = await apiFetch<{ code: number; data: MemberLevel[] }>('/member-levels');
  return res.data;
}

export async function createMemberLevel(data: CreateMemberLevelInput): Promise<MemberLevel> {
  const res = await apiFetch<{ code: number; data: MemberLevel }>('/member-levels', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateMemberLevel(id: string, data: UpdateMemberLevelInput): Promise<MemberLevel> {
  const res = await apiFetch<{ code: number; data: MemberLevel }>(`/member-levels/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function deleteMemberLevel(id: string): Promise<void> {
  await apiFetch<{ code: number }>(`/member-levels/${id}`, {
    method: 'DELETE',
  });
}

export async function reorderMemberLevels(ids: string[]): Promise<void> {
  await apiFetch<{ code: number }>('/member-levels/reorder', {
    method: 'PATCH',
    body: JSON.stringify({ ids }),
  });
}