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
  MEMBER_UPDATE: 'MEMBER_UPDATE',
  MEMBER_LEVEL_CHANGE: 'MEMBER_LEVEL_CHANGE',
  STAFF_CREATE: 'STAFF_CREATE',
  STAFF_UPDATE: 'STAFF_UPDATE',
  STAFF_ACTIVATE: 'STAFF_ACTIVATE',
  STAFF_DEACTIVATE: 'STAFF_DEACTIVATE',
  STAFF_RESET_PASSWORD: 'STAFF_RESET_PASSWORD',
  LICENSE_UPDATE: 'LICENSE_UPDATE',
  SHOP_UPDATE: 'SHOP_UPDATE',
  COUPON_TEMPLATE_CREATE: 'COUPON_TEMPLATE_CREATE',
  COUPON_TEMPLATE_UPDATE: 'COUPON_TEMPLATE_UPDATE',
  COUPON_ISSUE: 'COUPON_ISSUE',
  COUPON_USE: 'COUPON_USE',
  PASS_CARD_CREATE: 'PASS_CARD_CREATE',
  PASS_CARD_USE: 'PASS_CARD_USE',
  PASS_CARD_REFUND: 'PASS_CARD_REFUND',
  SERVICE_CATEGORY_CREATE: 'SERVICE_CATEGORY_CREATE',
  SERVICE_CATEGORY_UPDATE: 'SERVICE_CATEGORY_UPDATE',
  SERVICE_CATEGORY_DELETE: 'SERVICE_CATEGORY_DELETE',
  SERVICE_ITEM_CREATE: 'SERVICE_ITEM_CREATE',
  SERVICE_ITEM_UPDATE: 'SERVICE_ITEM_UPDATE',
  SERVICE_ITEM_DELETE: 'SERVICE_ITEM_DELETE',
  SERVICE_ITEM_TOGGLE: 'SERVICE_ITEM_TOGGLE',
  RECHARGE_PLAN_CREATE: 'RECHARGE_PLAN_CREATE',
  RECHARGE_PLAN_UPDATE: 'RECHARGE_PLAN_UPDATE',
  RECHARGE_PLAN_TOGGLE: 'RECHARGE_PLAN_TOGGLE',
  MEMBER_LEVEL_CREATE: 'MEMBER_LEVEL_CREATE',
  MEMBER_LEVEL_UPDATE: 'MEMBER_LEVEL_UPDATE',
  MEMBER_LEVEL_DELETE: 'MEMBER_LEVEL_DELETE',
  MEMBER_LEVEL_REORDER: 'MEMBER_LEVEL_REORDER',
  TAG_GROUP_CREATE: 'TAG_GROUP_CREATE',
  TAG_GROUP_UPDATE: 'TAG_GROUP_UPDATE',
  TAG_GROUP_DELETE: 'TAG_GROUP_DELETE',
  TAG_CREATE: 'TAG_CREATE',
  TAG_UPDATE: 'TAG_UPDATE',
  TAG_DELETE: 'TAG_DELETE',
  MEMBER_TAG_ASSIGN: 'MEMBER_TAG_ASSIGN',
  MEMBER_TAG_REMOVE: 'MEMBER_TAG_REMOVE',
} as const;

export type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

export const ACTION_LABELS: Record<string, string> = {
  RECHARGE: '会员充值',
  ORDER_SETTLE: '订单结算',
  ORDER_CANCEL: '订单撤销',
  MEMBER_CREATE: '创建会员',
  MEMBER_UPDATE: '修改会员',
  MEMBER_LEVEL_CHANGE: '会员等级变更',
  STAFF_CREATE: '创建员工',
  STAFF_UPDATE: '修改员工',
  STAFF_ACTIVATE: '启用员工',
  STAFF_DEACTIVATE: '停用员工',
  STAFF_RESET_PASSWORD: '重置密码',
  LICENSE_UPDATE: '许可证更新',
  SHOP_UPDATE: '店铺更新',
  COUPON_TEMPLATE_CREATE: '创建优惠券模板',
  COUPON_TEMPLATE_UPDATE: '修改优惠券模板',
  COUPON_ISSUE: '发放优惠券',
  COUPON_USE: '使用优惠券',
  PASS_CARD_CREATE: '创建次卡',
  PASS_CARD_USE: '使用次卡',
  PASS_CARD_REFUND: '退回次卡',
  SERVICE_CATEGORY_CREATE: '创建服务分类',
  SERVICE_CATEGORY_UPDATE: '修改服务分类',
  SERVICE_CATEGORY_DELETE: '删除服务分类',
  SERVICE_ITEM_CREATE: '创建服务项目',
  SERVICE_ITEM_UPDATE: '修改服务项目',
  SERVICE_ITEM_DELETE: '删除服务项目',
  SERVICE_ITEM_TOGGLE: '上下架服务项目',
  RECHARGE_PLAN_CREATE: '创建充值方案',
  RECHARGE_PLAN_UPDATE: '修改充值方案',
  RECHARGE_PLAN_TOGGLE: '上下架充值方案',
  MEMBER_LEVEL_CREATE: '创建会员等级',
  MEMBER_LEVEL_UPDATE: '修改会员等级',
  MEMBER_LEVEL_DELETE: '删除会员等级',
  MEMBER_LEVEL_REORDER: '调整等级排序',
  TAG_GROUP_CREATE: '创建标签组',
  TAG_GROUP_UPDATE: '修改标签组',
  TAG_GROUP_DELETE: '删除标签组',
  TAG_CREATE: '创建标签',
  TAG_UPDATE: '修改标签',
  TAG_DELETE: '删除标签',
  MEMBER_TAG_ASSIGN: '分配标签',
  MEMBER_TAG_REMOVE: '移除标签',
};

export interface AuditLogFilters {
  action?: string;
  staffId?: string;
  targetId?: string;
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
  if (filters?.targetId) {
    params.append('targetId', filters.targetId);
  }

  const queryString = params.toString();
  const res = await apiFetch<{ code: number; data: AuditLogPagination }>(
    `/audit-logs${queryString ? `?${queryString}` : ''}`
  );
  return res.data;
}