import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService, AuditActions } from '../audit/audit.service';
import { CreateRechargePlanDto, UpdateRechargePlanDto } from './dto/recharge-plan.dto';

@Injectable()
export class RechargePlanService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(shopId: string, activeOnly?: boolean) {
    const where: Record<string, unknown> = { shopId };

    if (activeOnly) {
      where.isActive = true;

      // Filter out expired timed plans (plans with endsAt in the past)
      const now = new Date();
      where.OR = [
        { endsAt: null },
        { endsAt: { gte: now } },
      ];
    }

    return this.prisma.rechargePlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(shopId: string, data: CreateRechargePlanDto, operatorId?: string, ip?: string) {
    // Validate TIMED plans require date range
    if (data.type === 'TIMED' && !data.startsAt && !data.endsAt) {
      throw new BadRequestException('限时活动方案必须设置活动时间范围');
    }

    // Validate date range consistency
    if (data.startsAt && data.endsAt) {
      const start = new Date(data.startsAt);
      const end = new Date(data.endsAt);
      if (start >= end) {
        throw new BadRequestException('结束时间必须晚于开始时间');
      }
    }

    const createData: Record<string, unknown> = {
      shopId,
      name: data.name,
      amount: data.amount,
      giftAmount: data.giftAmount ?? 0,
      type: data.type ?? 'DIRECT',
      sortOrder: data.sortOrder ?? 0,
    };

    if (data.startsAt) {
      createData.startsAt = new Date(data.startsAt);
    }
    if (data.endsAt) {
      createData.endsAt = new Date(data.endsAt);
    }

    return this.prisma.rechargePlan.create({ data: createData as any }).then(async (plan) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.RECHARGE_PLAN_CREATE,
        targetType: 'RechargePlan',
        targetId: plan.id,
        detail: {
          name: plan.name,
          amount: plan.amount,
          giftAmount: plan.giftAmount,
          type: plan.type,
        },
        ip,
      });
      return plan;
    });
  }

  async update(id: string, shopId: string, data: UpdateRechargePlanDto, operatorId?: string, ip?: string) {
    const existing = await this.prisma.rechargePlan.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException(`Recharge plan ${id} not found`);
    }

    // Determine effective type after update
    const effectiveType = data.type ?? existing.type;
    const effectiveStartsAt = data.startsAt !== undefined
      ? (data.startsAt ? new Date(data.startsAt) : null)
      : existing.startsAt;
    const effectiveEndsAt = data.endsAt !== undefined
      ? (data.endsAt ? new Date(data.endsAt) : null)
      : existing.endsAt;

    // Validate TIMED plans require date range
    if (effectiveType === 'TIMED' && !effectiveStartsAt && !effectiveEndsAt) {
      throw new BadRequestException('限时活动方案必须设置活动时间范围');
    }

    // Validate date range consistency
    if (effectiveStartsAt && effectiveEndsAt && effectiveStartsAt >= effectiveEndsAt) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }

    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.giftAmount !== undefined) updateData.giftAmount = data.giftAmount;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    if (data.startsAt !== undefined) {
      updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null;
    }
    if (data.endsAt !== undefined) {
      updateData.endsAt = data.endsAt ? new Date(data.endsAt) : null;
    }

    return this.prisma.rechargePlan.update({
      where: { id },
      data: updateData,
    }).then(async (updated) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.RECHARGE_PLAN_UPDATE,
        targetType: 'RechargePlan',
        targetId: id,
        detail: { name: updated.name, changes: data },
        ip,
      });
      return updated;
    });
  }

  async remove(id: string, shopId: string) {
    const existing = await this.prisma.rechargePlan.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException(`Recharge plan ${id} not found`);
    }

    return this.prisma.rechargePlan.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggle(id: string, shopId: string, operatorId?: string, ip?: string) {
    const existing = await this.prisma.rechargePlan.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException(`Recharge plan ${id} not found`);
    }

    // Prevent activating expired timed plans
    if (!existing.isActive && existing.endsAt && new Date(existing.endsAt) < new Date()) {
      throw new BadRequestException('已结束的限时活动无法重新上架，请修改活动时间后重试');
    }

    return this.prisma.rechargePlan.update({
      where: { id },
      data: { isActive: !existing.isActive },
    }).then(async (updated) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.RECHARGE_PLAN_TOGGLE,
        targetType: 'RechargePlan',
        targetId: id,
        detail: { name: updated.name, isActive: updated.isActive },
        ip,
      });
      return updated;
    });
  }
}
