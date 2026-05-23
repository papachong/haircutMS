import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export const AuditActions = {
  RECHARGE: 'RECHARGE',
  ORDER_SETTLE: 'ORDER_SETTLE',
  ORDER_CANCEL: 'ORDER_CANCEL',
  MEMBER_CREATE: 'MEMBER_CREATE',
  MEMBER_UPDATE: 'MEMBER_UPDATE',
  MEMBER_FREEZE: 'MEMBER_FREEZE',
  MEMBER_UNFREEZE: 'MEMBER_UNFREEZE',
  MEMBER_DELETE: 'MEMBER_DELETE',
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

type AuditAction = (typeof AuditActions)[keyof typeof AuditActions];

interface LogParams {
  shopId: string;
  staffId?: string;
  action: AuditAction;
  targetType?: string;
  targetId?: string;
  detail?: Record<string, unknown>;
  ip?: string;
}

interface QueryAuditLog {
  action?: string;
  staffId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: LogParams) {
    return this.prisma.auditLog.create({
      data: {
        shopId: params.shopId,
        staffId: params.staffId,
        action: params.action,
        targetType: params.targetType,
        targetId: params.targetId,
        detail: params.detail as any ?? undefined,
        ip: params.ip,
      },
    });
  }

  async findAll(shopId: string, query: QueryAuditLog) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = { shopId };

    if (query.action) {
      where.action = query.action;
    }
    if (query.staffId) {
      where.staffId = query.staffId;
    }
    if (query.targetId) {
      where.targetId = query.targetId;
    }
    if (query.startDate || query.endDate) {
      const createdAt: Record<string, Date> = {};
      if (query.startDate) {
        createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        createdAt.lte = new Date(query.endDate);
      }
      where.createdAt = createdAt;
    }

    const [items, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          staff: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    };
  }
}
