import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRechargePlanDto, UpdateRechargePlanDto } from './dto/recharge-plan.dto';

@Injectable()
export class RechargePlanService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, activeOnly?: boolean) {
    const where: Record<string, unknown> = { shopId };

    if (activeOnly) {
      where.isActive = true;
    }

    return this.prisma.rechargePlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async create(shopId: string, data: CreateRechargePlanDto) {
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

    return this.prisma.rechargePlan.create({ data: createData as any });
  }

  async update(id: string, shopId: string, data: UpdateRechargePlanDto) {
    const existing = await this.prisma.rechargePlan.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException(`Recharge plan ${id} not found`);
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
}
