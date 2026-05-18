import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateCategoryData {
  name: string;
  sortOrder?: number;
}

interface UpdateCategoryData {
  name?: string;
  sortOrder?: number;
}

@Injectable()
export class ServiceCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { shopId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async create(shopId: string, data: CreateCategoryData) {
    return this.prisma.serviceCategory.create({
      data: {
        shopId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, shopId: string, data: UpdateCategoryData) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: { id, shopId },
    });

    if (!existing) {
      throw new NotFoundException('Service category not found');
    }

    return this.prisma.serviceCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async remove(id: string, shopId: string) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: { id, shopId },
      include: { _count: { select: { items: true } } },
    });

    if (!existing) {
      throw new NotFoundException('Service category not found');
    }

    if (existing._count.items > 0) {
      throw new BadRequestException(
        'Cannot delete category that has service items',
      );
    }

    await this.prisma.serviceCategory.delete({ where: { id } });
    return { id };
  }

  async reorder(shopId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.serviceCategory.updateMany({
          where: { id, shopId },
          data: { sortOrder: index },
        })
      )
    );
    return { success: true };
  }
}
