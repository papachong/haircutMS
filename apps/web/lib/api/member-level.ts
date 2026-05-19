import { apiFetch } from './client';

export interface MemberLevel {
  id: string;
  shopId: string;
  name: string;
  discount: number;
  sortOrder: number;
  remark: string | null;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export async function getAllMemberLevels(): Promise<MemberLevel[]> {
  return apiFetch<{ code: number; data: MemberLevel[]; message: string }>(
    '/member-levels',
  ).then((res) => res.data);
}

export async function createMemberLevel(data: {
  name: string;
  discount: number;
  sortOrder?: number;
  remark?: string;
}): Promise<MemberLevel> {
  return apiFetch<{ code: number; data: MemberLevel; message: string }>(
    '/member-levels',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  ).then((res) => res.data);
}

export async function updateMemberLevel(
  id: string,
  data: {
    name?: string;
    discount?: number;
    sortOrder?: number;
    remark?: string;
  },
): Promise<MemberLevel> {
  return apiFetch<{ code: number; data: MemberLevel; message: string }>(
    `/member-levels/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  ).then((res) => res.data);
}

export async function deleteMemberLevel(id: string): Promise<{ id: string }> {
  return apiFetch<{ code: number; data: { id: string }; message: string }>(
    `/member-levels/${id}`,
    {
      method: 'DELETE',
    },
  ).then((res) => res.data);
}

export async function batchSortMemberLevels(
  items: { id: string; sortOrder: number }[],
): Promise<MemberLevel[]> {
  return apiFetch<{ code: number; data: MemberLevel[]; message: string }>(
    '/member-levels/sort',
    {
      method: 'PATCH',
      body: JSON.stringify({ items }),
    },
  ).then((res) => res.data);
}
