import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateCouponTemplateData {
  name: string;
  type: 'FIXED' | 'PERCENT';
  threshold: number;
  discount: number;
  total: number;
  startsAt: string;
  endsAt: string;
  isActive?: boolean;
}

interface UpdateCouponTemplateData {
  name?: string;
  type?: 'FIXED' | 'PERCENT';
  threshold?: number;
  discount?: number;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

interface CalculateCouponDiscountData {
  amount: number;
  couponInstanceId: string;
}

interface CouponDiscountResult {
  canUse: boolean;
  discount: number;
  finalAmount: number;
  reason?: string;
}

@Injectable()
export class CouponService {
  constructor(private prisma: PrismaService) {}

  async findTemplates(shopId: string, query: {
    type?: 'FIXED' | 'PERCENT';
    isActive?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = { shopId };

    if (query.type) {
      where.type = query.type;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.couponTemplate.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: {
              instances: {
                where: {
                  status: 'AVAILABLE',
                  expiresAt: { gt: new Date() },
                },
              },
            },
          },
        },
      }),
      this.prisma.couponTemplate.count({ where }),
    ]);

    return {
      items: items.map(item => ({
        ...item,
        availableCount: item._count.instances,
        _count: undefined,
      })),
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async findTemplateById(id: string, shopId: string) {
    const template = await this.prisma.couponTemplate.findFirst({
      where: { id, shopId },
      include: {
        _count: {
          select: {
            instances: true,
          },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Coupon template not found');
    }

    const availableCount = await this.prisma.couponInstance.count({
      where: {
        templateId: id,
        status: 'AVAILABLE',
        expiresAt: { gt: new Date() },
      },
    });

    const usedCount = await this.prisma.couponInstance.count({
      where: {
        templateId: id,
        status: 'USED',
      },
    });

    return {
      ...template,
      availableCount,
      usedCount,
      _count: undefined,
    };
  }

  async createTemplate(shopId: string, data: CreateCouponTemplateData) {
    const startsAt = new Date(data.startsAt);
    const endsAt = new Date(data.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException('End date must be after start date');
    }

    if (data.type === 'PERCENT' && (data.discount < 1 || data.discount > 100)) {
      throw new BadRequestException('Percentage discount must be between 1 and 100');
    }

    if (data.type === 'FIXED' && data.threshold > 0 && data.discount >= data.threshold) {
      throw new BadRequestException('Fixed discount must be less than threshold');
    }

    const template = await this.prisma.couponTemplate.create({
      data: {
        shopId,
        name: data.name,
        type: data.type,
        threshold: data.threshold,
        discount: data.discount,
        total: data.total,
        issued: 0,
        startsAt,
        endsAt,
        isActive: data.isActive ?? true,
      },
    });

    return template;
  }

  async updateTemplate(id: string, shopId: string, data: UpdateCouponTemplateData) {
    const existing = await this.prisma.couponTemplate.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Coupon template not found');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.type !== undefined) {
      updateData.type = data.type;
    }

    if (data.threshold !== undefined) {
      updateData.threshold = data.threshold;
    }

    if (data.discount !== undefined) {
      updateData.discount = data.discount;

      if (data.type === 'PERCENT' && (data.discount < 1 || data.discount > 100)) {
        throw new BadRequestException('Percentage discount must be between 1 and 100');
      }

      if (data.type === 'FIXED' && data.threshold && data.discount >= data.threshold) {
        throw new BadRequestException('Fixed discount must be less than threshold');
      }
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.startsAt !== undefined) {
      updateData.startsAt = new Date(data.startsAt);
    }

    if (data.endsAt !== undefined) {
      updateData.endsAt = new Date(data.endsAt);
    }

    if (data.startsAt && data.endsAt) {
      if (new Date(data.endsAt) <= new Date(data.startsAt)) {
        throw new BadRequestException('End date must be after start date');
      }
    }

    return this.prisma.couponTemplate.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteTemplate(id: string, shopId: string) {
    const template = await this.prisma.couponTemplate.findFirst({
      where: { id, shopId },
    });

    if (!template) {
      throw new NotFoundException('Coupon template not found');
    }

    const issuedCount = await this.prisma.couponInstance.count({
      where: { templateId: id },
    });

    if (issuedCount > 0) {
      throw new ConflictException('Cannot delete template with issued coupons');
    }

    await this.prisma.couponTemplate.delete({
      where: { id },
    });

    return { success: true };
  }

  async issueCoupons(templateId: string, shopId: string, memberIds: string[]) {
    const template = await this.prisma.couponTemplate.findFirst({
      where: { id: templateId, shopId },
    });

    if (!template) {
      throw new NotFoundException('Coupon template not found');
    }

    if (!template.isActive) {
      throw new BadRequestException('Coupon template is inactive');
    }

    if (template.issued + memberIds.length > template.total) {
      throw new BadRequestException('Not enough coupons available');
    }

    const members = await this.prisma.member.findMany({
      where: {
        id: { in: memberIds },
        shopId,
        isActive: true,
      },
    });

    if (members.length !== memberIds.length) {
      throw new BadRequestException('Some members not found or inactive');
    }

    const results = await this.prisma.$transaction(async (tx) => {
      await tx.couponTemplate.update({
        where: { id: templateId },
        data: { issued: { increment: memberIds.length } },
      });

      const instances = await tx.couponInstance.createMany({
        data: memberIds.map((memberId) => ({
          templateId,
          memberId,
          status: 'AVAILABLE',
          expiresAt: template.endsAt,
        })),
      });

      const createdInstances = await tx.couponInstance.findMany({
        where: {
          templateId,
          memberId: { in: memberIds },
          createdAt: { gte: new Date(Date.now() - 10000) },
        },
        include: {
          member: {
            select: {
              id: true,
              name: true,
              cardNo: true,
            },
          },
        },
      });

      return {
        issued: instances.count,
        coupons: createdInstances,
      };
    });

    return results;
  }

  async findMemberCoupons(memberId: string, shopId: string, query: {
    status?: 'AVAILABLE' | 'USED' | 'EXPIRED';
    page?: number;
    pageSize?: number;
  }) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = { memberId };

    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await Promise.all([
      this.prisma.couponInstance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          template: {
            select: {
              id: true,
              name: true,
              type: true,
              threshold: true,
              discount: true,
            },
          },
        },
      }),
      this.prisma.couponInstance.count({ where }),
    ]);

    const now = new Date();
    const filteredItems = items.map(item => {
      if (item.status === 'AVAILABLE' && item.expiresAt < now) {
        return { ...item, status: 'EXPIRED' };
      }
      return item;
    });

    return {
      items: filteredItems,
      pagination: { total, page, pageSize, hasMore: page * pageSize < total },
    };
  }

  async calculateDiscount(data: CalculateCouponDiscountData, shopId: string) {
    const coupon = await this.prisma.couponInstance.findFirst({
      where: {
        id: data.couponInstanceId,
        member: {
          shopId,
        },
      },
      include: {
        template: true,
      },
    });

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const now = new Date();

    if (coupon.status !== 'AVAILABLE') {
      return {
        canUse: false,
        discount: 0,
        finalAmount: data.amount,
        reason: 'Coupon has been used',
      } satisfies CouponDiscountResult;
    }

    if (coupon.expiresAt < now) {
      return {
        canUse: false,
        discount: 0,
        finalAmount: data.amount,
        reason: 'Coupon has expired',
      } satisfies CouponDiscountResult;
    }

    const template = coupon.template;

    if (!template.isActive) {
      return {
        canUse: false,
        discount: 0,
        finalAmount: data.amount,
        reason: 'Coupon template is inactive',
      } satisfies CouponDiscountResult;
    }

    if (data.amount < template.threshold) {
      return {
        canUse: false,
        discount: 0,
        finalAmount: data.amount,
        reason: `Minimum spend ${template.threshold} required`,
      } satisfies CouponDiscountResult;
    }

    let discount = 0;
    if (template.type === 'FIXED') {
      discount = template.discount;
    } else {
      discount = Math.floor(data.amount * template.discount / 100);
    }

    const finalAmount = Math.max(0, data.amount - discount);

    return {
      canUse: true,
      discount,
      finalAmount,
    } satisfies CouponDiscountResult;
  }

  async getAvailableCoupons(memberId: string, shopId: string, amount: number) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const now = new Date();

    const coupons = await this.prisma.couponInstance.findMany({
      where: {
        memberId,
        status: 'AVAILABLE',
        expiresAt: { gt: now },
      },
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const availableCoupons = coupons
      .filter(c => c.template.isActive)
      .map(coupon => {
        const template = coupon.template!;
        const canUse = amount >= template.threshold;
        let discount = 0;
        let finalAmount = amount;

        if (canUse) {
          if (template.type === 'FIXED') {
            discount = template.discount;
          } else {
            discount = Math.floor(amount * template.discount / 100);
          }
          finalAmount = Math.max(0, amount - discount);
        }

        return {
          ...coupon,
          template,
          canUse,
          discount,
          finalAmount,
        };
      });

    return availableCoupons;
  }

  async getMemberSummary(memberId: string, shopId: string) {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    const now = new Date();

    const [available, used, expired] = await Promise.all([
      this.prisma.couponInstance.count({
        where: {
          memberId,
          status: 'AVAILABLE',
          expiresAt: { gt: now },
        },
      }),
      this.prisma.couponInstance.count({
        where: {
          memberId,
          status: 'USED',
        },
      }),
      this.prisma.couponInstance.count({
        where: {
          memberId,
          OR: [
            { status: 'EXPIRED' },
            { status: 'AVAILABLE', expiresAt: { lte: now } },
          ],
        },
      }),
    ]);

    const recentCoupons = await this.prisma.couponInstance.findMany({
      where: { memberId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        template: {
          select: {
            name: true,
            type: true,
            threshold: true,
            discount: true,
          },
        },
      },
    });

    return {
      available,
      used,
      expired,
      recentCoupons: recentCoupons.map(c => ({
        ...c,
        status: c.status === 'AVAILABLE' && c.expiresAt < now ? 'EXPIRED' : c.status,
      })),
    };
  }
}