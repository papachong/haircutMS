import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

interface CreateMemberLevelData {
  name: string;
  discount: number;
  sortOrder?: number;
  remark?: string;
}

interface UpdateMemberLevelData {
  name?: string;
  discount?: number;
  sortOrder?: number;
  remark?: string;
}

@Injectable()
export class MemberLevelService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string) {
    return this.prisma.memberLevel.findMany({
      where: { shopId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async create(shopId: string, data: CreateMemberLevelData) {
    if (data.discount < 0.1 || data.discount > 1.0) {
      throw new BadRequestException('Discount must be between 0.10 and 1.00');
    }

    return this.prisma.memberLevel.create({
      data: {
        shopId,
        name: data.name,
        discount: data.discount,
        sortOrder: data.sortOrder ?? 0,
        remark: data.remark,
      },
    });
  }

  async update(id: string, shopId: string, data: UpdateMemberLevelData) {
    const existing = await this.prisma.memberLevel.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Member level not found');
    }

    if (data.discount !== undefined && (data.discount < 0.1 || data.discount > 1.0)) {
      throw new BadRequestException('Discount must be between 0.10 and 1.00');
    }

    return this.prisma.memberLevel.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.discount !== undefined && { discount: data.discount }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.remark !== undefined && { remark: data.remark }),
      },
    });
  }

  async remove(id: string, shopId: string) {
    const existing = await this.prisma.memberLevel.findFirst({
      where: { id, shopId },
      include: { _count: { select: { members: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Member level not found');
    }

    if (existing._count.members > 0) {
      throw new BadRequestException(
        'Cannot delete member level that is in use by members',
      );
    }

    await this.prisma.memberLevel.delete({ where: { id } });
    return { id };
  }

  async reorder(ids: string[], shopId: string) {
    await this.$transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx.memberLevel.updateMany({
          where: { id: ids[i], shopId },
          data: { sortOrder: i },
        });
      }
    });
  }

  private $transaction(fn: (tx: any) => Promise<void>) {
    return this.prisma.$transaction(fn);
  }
}
