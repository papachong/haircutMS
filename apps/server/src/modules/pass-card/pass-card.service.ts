import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService, AuditActions } from '../audit/audit.service';

export enum PassCardStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED_UP = 'USED_UP',
  INACTIVE = 'INACTIVE',
}

interface CreatePassCardData {
  memberId: string;
  name: string;
  totalTimes: number;
  price: number;
  expiresAt?: Date;
  isActive?: boolean;
}

interface QueryPassCardData {
  memberId?: string;
  keyword?: string;
  status?: PassCardStatus;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class PassCardService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(shopId: string, query: QueryPassCardData) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = {
      member: { shopId },
    };

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    // Build AND conditions to avoid multiple top-level OR conflicts
    const andConditions: Record<string, unknown>[] = [];

    if (query.keyword) {
      andConditions.push({
        OR: [
          { name: { contains: query.keyword, mode: 'insensitive' } },
          { member: { name: { contains: query.keyword, mode: 'insensitive' } } },
          { member: { phone: { contains: query.keyword, mode: 'insensitive' } } },
        ],
      });
    }

    if (query.availableOnly) {
      andConditions.push({
        isActive: true,
        remainingTimes: { gt: 0 },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      });
    }

    if (query.status) {
      if (query.status === PassCardStatus.EXPIRED) {
        where.expiresAt = { lt: new Date() };
      } else if (query.status === PassCardStatus.USED_UP) {
        where.remainingTimes = 0;
      } else if (query.status === PassCardStatus.INACTIVE) {
        where.isActive = false;
      } else if (query.status === PassCardStatus.ACTIVE) {
        andConditions.push({
          isActive: true,
          remainingTimes: { gt: 0 },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        });
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const [items, total] = await Promise.all([
      this.prisma.passCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cardNo: true,
              phone: true,
              memberLevel: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          usages: {
            orderBy: { usedAt: 'desc' },
            take: 5,
            include: {
              orderItem: {
                select: {
                  id: true,
                  serviceName: true,
                  finalPrice: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.passCard.count({ where }),
    ]);

    // 计算每个次卡的状态
    const itemsWithStatus = items.map((item) => ({
      ...item,
      status: this.calculateStatus(item),
    }));

    return {
      items: itemsWithStatus,
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async findById(id: string, shopId: string) {
    const passCard = await this.prisma.passCard.findFirst({
      where: {
        id,
        member: { shopId },
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cardNo: true,
            phone: true,
            avatar: true,
            memberLevel: {
              select: {
                id: true,
                name: true,
                discount: true,
              },
            },
          },
        },
        usages: {
          orderBy: { usedAt: 'desc' },
          include: {
            orderItem: {
              select: {
                id: true,
                serviceName: true,
                staffName: true,
                finalPrice: true,
                order: {
                  select: {
                    orderNo: true,
                    settledAt: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    return {
      ...passCard,
      status: this.calculateStatus(passCard),
    };
  }

  async getUsages(passCardId: string, shopId: string, page = 1, pageSize = 20) {
    const passCard = await this.prisma.passCard.findFirst({
      where: { id: passCardId, member: { shopId } },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    const where = { passCardId };
    const [items, total] = await Promise.all([
      this.prisma.passCardUsage.findMany({
        where,
        orderBy: { usedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          orderItem: {
            select: {
              id: true,
              serviceName: true,
              staffName: true,
              finalPrice: true,
              order: {
                select: {
                  orderNo: true,
                  settledAt: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.passCardUsage.count({ where }),
    ]);

    return {
      items,
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async create(shopId: string, data: CreatePassCardData, operatorId?: string, ip?: string) {
    // 验证会员是否存在
    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, shopId },
      include: { memberLevel: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 创建次卡
    const passCard = await this.prisma.passCard.create({
      data: {
        memberId: data.memberId,
        name: data.name,
        totalTimes: data.totalTimes,
        remainingTimes: data.totalTimes,
        price: data.price,
        expiresAt: data.expiresAt,
        isActive: data.isActive ?? true,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            cardNo: true,
            phone: true,
            memberLevel: {
              select: {
                id: true,
                name: true,
                discount: true,
              },
            },
          },
        },
      },
    });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.PASS_CARD_CREATE,
      targetType: 'PassCard',
      targetId: passCard.id,
      detail: {
        name: data.name,
        totalTimes: data.totalTimes,
        price: data.price,
        memberId: data.memberId,
        memberName: passCard.member.name,
      },
      ip,
    });

    return passCard;
  }

  async use(passCardId: string, shopId: string, orderItemId?: string, operatorId?: string, ip?: string) {
    const passCard = await this.prisma.passCard.findFirst({
      where: { id: passCardId, member: { shopId } },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    if (!passCard.isActive) {
      throw new BadRequestException('Pass card is inactive');
    }

    if (passCard.expiresAt && new Date() > passCard.expiresAt) {
      throw new BadRequestException('Pass card has expired');
    }

    if (passCard.remainingTimes <= 0) {
      throw new BadRequestException('Pass card has no remaining times');
    }

    // 检查订单项是否已关联
    if (orderItemId) {
      const existingUsage = await this.prisma.passCardUsage.findUnique({
        where: { orderItemId },
      });

      if (existingUsage) {
        throw new BadRequestException('Order item already linked to a pass card');
      }
    }

    // 扣减次数并创建使用记录
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.passCard.update({
        where: { id: passCardId },
        data: { remainingTimes: { decrement: 1 } },
      });

      const usage = await tx.passCardUsage.create({
        data: {
          passCardId,
          orderItemId,
        },
        include: {
          orderItem: {
            select: {
              serviceName: true,
              finalPrice: true,
            },
          },
        },
      });

      return { passCard: updated, usage };
    });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.PASS_CARD_USE,
      targetType: 'PassCard',
      targetId: passCardId,
      detail: {
        orderItemId,
        remainingTimes: (await this.prisma.passCard.findUnique({ where: { id: passCardId } }))?.remainingTimes,
      },
      ip,
    });
  }

  async refundUsage(passCardId: string, usageId: string, shopId: string, operatorId?: string, ip?: string) {
    const passCard = await this.prisma.passCard.findFirst({
      where: { id: passCardId, member: { shopId } },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    const usage = await this.prisma.passCardUsage.findUnique({
      where: { id: usageId },
    });

    if (!usage) {
      throw new NotFoundException('Pass card usage not found');
    }

    if (usage.passCardId !== passCardId) {
      throw new BadRequestException('Usage does not belong to this pass card');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.passCard.update({
        where: { id: passCardId },
        data: { remainingTimes: { increment: 1 } },
      });

      return tx.passCardUsage.delete({
        where: { id: usageId },
      });
    });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.PASS_CARD_REFUND,
      targetType: 'PassCard',
      targetId: passCardId,
      detail: {
        usageId,
        passCardName: passCard.name,
      },
      ip,
    });

    return result;
  }

  async deactivate(id: string, shopId: string) {
    const passCard = await this.prisma.passCard.findFirst({
      where: { id, member: { shopId } },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    return this.prisma.passCard.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activate(id: string, shopId: string) {
    const passCard = await this.prisma.passCard.findFirst({
      where: { id, member: { shopId } },
    });

    if (!passCard) {
      throw new NotFoundException('Pass card not found');
    }

    return this.prisma.passCard.update({
      where: { id },
      data: { isActive: true },
    });
  }

  private calculateStatus(passCard: { isActive: boolean; remainingTimes: number; expiresAt: Date | null }): PassCardStatus {
    if (!passCard.isActive) {
      return PassCardStatus.INACTIVE;
    }

    if (passCard.expiresAt && new Date() > passCard.expiresAt) {
      return PassCardStatus.EXPIRED;
    }

    if (passCard.remainingTimes <= 0) {
      return PassCardStatus.USED_UP;
    }

    return PassCardStatus.ACTIVE;
  }
}
