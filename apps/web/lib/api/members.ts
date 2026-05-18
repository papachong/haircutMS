import { apiFetch } from './client';

export interface Member {
  id: string;
  cardNo: string;
  name: string;
  phone: string;
  gender?: string;
  birthday?: string;
  avatar?: string;
  memberLevelId: string;
  memberLevel: {
    id: string;
    name: string;
    discount: number;
  };
  principalBalance: number;
  giftBalance: number;
  totalRecharge: number;
  totalConsume: number;
  visitCount: number;
  lastVisitAt?: string;
  remark?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  tagRelations?: Array<{
    id: string;
    tag: {
      id: string;
      name: string;
      group: {
        id: string;
        name: string;
      };
    };
  }>;
  rechargeRecords?: Array<{
    id: string;
    amount: number;
    giftAmount: number;
    type: string;
    operator: {
      name: string;
    };
    createdAt: string;
  }>;
  orders?: Array<{
    id: string;
    orderNo: string;
    payableAmount: number;
    status: string;
    createdAt: string;
    items: Array<{
      serviceName: string;
      quantity: number;
    }>;
  }>;
  passCards?: Array<{
    id: string;
    name: string;
    totalTimes: number;
    remainingTimes: number;
    expiresAt?: string;
    createdAt: string;
  }>;
}

export interface MemberLevel {
  id: string;
  name: string;
  discount: number;
  sortOrder: number;
  remark?: string;
}

export interface MemberListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface MemberListResponse {
  items: Member[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export interface CreateMemberInput {
  name: string;
  phone: string;
  gender?: string;
  birthday?: string;
  memberLevelId?: string;
  remark?: string;
}

export interface UpdateMemberInput {
  name?: string;
  phone?: string;
  gender?: string;
  birthday?: string;
  memberLevelId?: string;
  remark?: string;
}

export async function getMembers(params?: MemberListParams): Promise<MemberListResponse> {
  const query = new URLSearchParams();
  if (params?.keyword) query.append('keyword', params.keyword);
  if (params?.page) query.append('page', String(params.page));
  if (params?.pageSize) query.append('pageSize', String(params.pageSize));

  const path = `/members${query.toString() ? `?${query.toString()}` : ''}`;
  const res = await apiFetch<{ code: number; data: MemberListResponse }>(path);
  return res.data;
}

export async function getMemberById(id: string): Promise<Member> {
  const res = await apiFetch<{ code: number; data: Member }>(`/members/${id}`);
  return res.data;
}

export async function searchMembers(keyword: string): Promise<Member[]> {
  const res = await apiFetch<{ code: number; data: Member[] }>(
    `/members/search/keyword?keyword=${encodeURIComponent(keyword)}`
  );
  return res.data;
}

export async function createMember(data: CreateMemberInput): Promise<Member> {
  const res = await apiFetch<{ code: number; data: Member }>('/members', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function updateMember(id: string, data: UpdateMemberInput): Promise<Member> {
  const res = await apiFetch<{ code: number; data: Member }>(`/members/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.data;
}

export async function getMemberLevels(): Promise<MemberLevel[]> {
  const res = await apiFetch<{ code: number; data: MemberLevel[] }>('/member-levels');
  return res.data;
}