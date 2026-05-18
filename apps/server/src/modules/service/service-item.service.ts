import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface CreateServiceItemData {
  categoryId: string;
  name: string;
  price: number;
  duration: number;
  image?: string;
  sortOrder?: number;
}

interface UpdateServiceItemData {
  name?: string;
  price?: number;
  duration?: number;
  image?: string;
  sortOrder?: number;
}

interface QueryServiceItem {
  categoryId?: string;
  activeOnly?: boolean;
}

@Injectable()
export class ServiceItemService {
  constructor(private prisma: PrismaService) {}

  async findAll(shopId: string, query: QueryServiceItem) {
    const where: Record<string, unknown> = {};

    if (query.categoryId) {
      where.category = { shopId, id: query.categoryId };
    } else {
      where.category = { shopId };
    }

    if (query.activeOnly) {
      where.isActive = true;
    }

    return this.prisma.serviceItem.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      include: { category: { select: { id: true, name: true } } },
    });
  }

  async create(shopId: string, data: CreateServiceItemData) {
    const category = await this.prisma.serviceCategory.findFirst({
      where: { id: data.categoryId, shopId },
    });

    if (!category) {
      throw new NotFoundException('Service category not found');
    }

    return this.prisma.serviceItem.create({
      data: {
        categoryId: data.categoryId,
        name: data.name,
        price: data.price,
        duration: data.duration,
        image: data.image,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(id: string, shopId: string, data: UpdateServiceItemData) {
    const existing = await this.prisma.serviceItem.findFirst({
      where: { id, category: { shopId } },
    });

    if (!existing) {
      throw new NotFoundException('Service item not found');
    }

    return this.prisma.serviceItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
      },
    });
  }

  async toggle(id: string, shopId: string) {
    const existing = await this.prisma.serviceItem.findFirst({
      where: { id, category: { shopId } },
    });

    if (!existing) {
      throw new NotFoundException('Service item not found');
    }

    return this.prisma.serviceItem.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
  }

  async reorder(shopId: string, categoryId: string, ids: string[]) {
    await this.prisma.$transaction(
      ids.map((id, index) =>
        this.prisma.serviceItem.updateMany({
          where: { id, categoryId },
          data: { sortOrder: index },
        })
      )
    );
    return { success: true };
  }
}
