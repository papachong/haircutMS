import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
        detail: params.detail ?? undefined,
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
