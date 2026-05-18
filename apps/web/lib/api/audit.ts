import { apiFetch } from './client';

export interface AuditLog {
  id: string;
  shopId: string;
  staffId?: string | null;
  staff?: {
    id: string;
    name: string;
    phone: string;
  } | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  detail?: Record<string, unknown> | null;
  ip?: string | null;
  createdAt: string;
}

export interface AuditLogPagination {
  items: AuditLog[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
  };
}

export const AuditActions = {
  RECHARGE: 'RECHARGE',
  ORDER_SETTLE: 'ORDER_SETTLE',
  ORDER_CANCEL: 'ORDER_CANCEL',
  MEMBER_CREATE: 'MEMBER_CREATE',
  MEMBER_LEVEL_CHANGE: 'MEMBER_LEVEL_CHANGE',
  STAFF_CREATE: 'STAFF_CREATE',
  STAFF_DEACTIVATE: 'STAFF_DEACTIVATE',
  LICENSE_UPDATE: 'LICENSE_UPDATE',
  SHOP_UPDATE: 'SHOP_UPDATE',
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export const ACTION_LABELS: Record<string, string> = {
  RECHARGE: '会员充值',
  ORDER_SETTLE: '订单结算',
  ORDER_CANCEL: '订单取消',
  MEMBER_CREATE: '创建会员',
  MEMBER_LEVEL_CHANGE: '会员等级变更',
  STAFF_CREATE: '创建员工',
  STAFF_DEACTIVATE: '停用员工',
  LICENSE_UPDATE: '许可证更新',
  SHOP_UPDATE: '店铺更新',
};

export interface AuditLogFilters {
  action?: string;
  staffId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getAuditLogs(filters?: AuditLogFilters): Promise<AuditLogPagination> {
  const params = new URLSearchParams();

  if (filters?.action) {
    params.append('action', filters.action);
  }
  if (filters?.staffId) {
    params.append('staffId', filters.staffId);
  }
  if (filters?.startDate) {
    params.append('startDate', filters.startDate);
  }
  if (filters?.endDate) {
    params.append('endDate', filters.endDate);
  }
  if (filters?.page) {
    params.append('page', filters.page.toString());
  }
  if (filters?.pageSize) {
    params.append('pageSize', filters.pageSize.toString());
  }

  const queryString = params.toString();
  return apiFetch(`/audit-logs${queryString ? `?${queryString}` : ''}`);
}