import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

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
  status?: PassCardStatus;
  availableOnly?: boolean;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class PassCardService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, query: QueryPassCardData) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = {
      member: { shopId },
    };

    if (query.memberId) {
      where.memberId = query.memberId;
    }

    if (query.availableOnly) {
      where.isActive = true;
      where.remainingTimes = { gt: 0 };
      where.OR = [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ];
    }

    if (query.status) {
      if (query.status === PassCardStatus.EXPIRED) {
        where.expiresAt = { lt: new Date() };
      } else if (query.status === PassCardStatus.USED_UP) {
        where.remainingTimes = 0;
      } else if (query.status === PassCardStatus.INACTIVE) {
        where.isActive = false;
      } else if (query.status === PassCardStatus.ACTIVE) {
        where.isActive = true;
        where.remainingTimes = { gt: 0 };
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      }
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

  async create(shopId: string, data: CreatePassCardData) {
    // 验证会员是否存在
    const member = await this.prisma.member.findFirst({
      where: { id: data.memberId, shopId },
      include: { memberLevel: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // 创建次卡
    return this.prisma.passCard.create({
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
  }

  async use(passCardId: string, orderItemId?: string) {
    const passCard = await this.prisma.passCard.findUnique({
      where: { id: passCardId },
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
  }

  async refundUsage(passCardId: string, usageId: string) {
    const usage = await this.prisma.passCardUsage.findUnique({
      where: { id: usageId },
      include: { passCard: true },
    });

    if (!usage) {
      throw new NotFoundException('Pass card usage not found');
    }

    if (usage.passCardId !== passCardId) {
      throw new BadRequestException('Usage does not belong to this pass card');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.passCard.update({
        where: { id: passCardId },
        data: { remainingTimes: { increment: 1 } },
      });

      return tx.passCardUsage.delete({
        where: { id: usageId },
      });
    });
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