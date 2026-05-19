import { apiFetch } from './client';

export interface RechargePlan {
  id: string;
  name: string;
  amount: number;
  giftAmount: number;
  type: 'DIRECT' | 'GIFT' | 'PERCENTAGE' | 'TIMED';
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface RechargeRecord {
  id: string;
  amount: number;
  giftAmount: number;
  payMethod: string;
  remark: string | null;
  createdAt: string;
  operator: {
    id: string;
    name: string;
  };
  plan?: {
    id: string;
    name: string;
  } | null;
}

export interface RechargeHistoryResponse {
  items: RechargeRecord[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export enum PayMethod {
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  BANK_CARD = 'BANK_CARD',
  OTHER = 'OTHER',
}

export const PAY_METHOD_LABELS: Record<PayMethod, string> = {
  [PayMethod.CASH]: '现金',
  [PayMethod.WECHAT]: '微信支付',
  [PayMethod.ALIPAY]: '支付宝',
  [PayMethod.BANK_CARD]: '银行卡',
  [PayMethod.OTHER]: '其他',
};

export const RECHARGE_PLAN_TYPE_LABELS: Record<RechargePlan['type'], string> = {
  DIRECT: '直充',
  GIFT: '充赠',
  PERCENTAGE: '阶梯',
  TIMED: '限时活动',
};

export async function getActiveRechargePlans(): Promise<RechargePlan[]> {
  return apiFetch<{ code: number; data: RechargePlan[]; message: string }>(
    '/recharge-plans?activeOnly=true',
  ).then((res) => res.data);
}

export async function getAllRechargePlans(): Promise<RechargePlan[]> {
  return apiFetch<{ code: number; data: RechargePlan[]; message: string }>(
    '/recharge-plans',
  ).then((res) => res.data);
}

export async function createRechargePlan(data: {
  name: string;
  amount: number;
  giftAmount?: number;
  type?: RechargePlan['type'];
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}): Promise<RechargePlan> {
  return apiFetch<{ code: number; data: RechargePlan; message: string }>(
    '/recharge-plans',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
  ).then((res) => res.data);
}

export async function updateRechargePlan(
  id: string,
  data: {
    name?: string;
    amount?: number;
    giftAmount?: number;
    type?: RechargePlan['type'];
    startsAt?: string | null;
    endsAt?: string | null;
    sortOrder?: number;
  },
): Promise<RechargePlan> {
  return apiFetch<{ code: number; data: RechargePlan; message: string }>(
    `/recharge-plans/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
    },
  ).then((res) => res.data);
}

export async function toggleRechargePlan(id: string): Promise<RechargePlan> {
  return apiFetch<{ code: number; data: RechargePlan; message: string }>(
    `/recharge-plans/${id}/toggle`,
    {
      method: 'PATCH',
    },
  ).then((res) => res.data);
}

export async function deleteRechargePlan(id: string): Promise<void> {
  await apiFetch<{ code: number; message: string }>(`/recharge-plans/${id}`, {
    method: 'DELETE',
  });
}

export async function rechargeMember(
  memberId: string,
  data: {
    planId?: string;
    amount?: number;
    giftAmount?: number;
    payMethod: PayMethod;
    remark?: string;
  },
) {
  return apiFetch(`/members/${memberId}/recharge`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getRechargeHistory(
  memberId: string,
  page = 1,
  pageSize = 20,
): Promise<RechargeHistoryResponse> {
  return apiFetch<{ code: number; data: RechargeHistoryResponse; message: string }>(
    `/members/${memberId}/recharge-history?page=${page}&pageSize=${pageSize}`,
  ).then((res) => res.data);
}