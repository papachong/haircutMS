import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { CreateMemberLevelDto, UpdateMemberLevelDto, BatchSortDto } from './dto/member-level.dto';

@Injectable()
export class MemberLevelService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string) {
    const levels = await this.prisma.memberLevel.findMany({
      where: { shopId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { members: true } },
      },
    });

    return levels.map(({ _count, ...level }) => ({
      ...level,
      memberCount: _count.members,
    }));
  }

  async create(shopId: string, data: CreateMemberLevelDto) {
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

  async update(id: string, shopId: string, data: UpdateMemberLevelDto) {
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
        `该等级下有 ${existing._count.members} 位关联会员，无法删除。请先将会员迁移到其他等级。`,
      );
    }

    await this.prisma.memberLevel.delete({ where: { id } });
    return { id };
  }

  async batchSort(shopId: string, items: BatchSortDto['items']) {
    // Verify all items belong to this shop
    const levelIds = items.map((item) => item.id);
    const levels = await this.prisma.memberLevel.findMany({
      where: { id: { in: levelIds }, shopId },
      select: { id: true },
    });

    if (levels.length !== levelIds.length) {
      throw new NotFoundException('One or more member levels not found');
    }

    await this.prisma.$transaction(
      items.map((item) =>
        this.prisma.memberLevel.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    return this.findAll(shopId);
  }
}
