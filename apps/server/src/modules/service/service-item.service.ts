import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService, AuditActions } from '../audit/audit.service';

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
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

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

  async create(shopId: string, data: CreateServiceItemData, operatorId?: string, ip?: string) {
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
    }).then(async (item) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.SERVICE_ITEM_CREATE,
        targetType: 'ServiceItem',
        targetId: item.id,
        detail: {
          name: item.name,
          price: item.price,
          duration: item.duration,
          categoryId: data.categoryId,
          categoryName: category.name,
        },
        ip,
      });
      return item;
    });
  }

  async update(id: string, shopId: string, data: UpdateServiceItemData, operatorId?: string, ip?: string) {
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
    }).then(async (updated) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.SERVICE_ITEM_UPDATE,
        targetType: 'ServiceItem',
        targetId: id,
        detail: { name: updated.name, changes: data },
        ip,
      });
      return updated;
    });
  }

  async toggle(id: string, shopId: string, operatorId?: string, ip?: string) {
    const existing = await this.prisma.serviceItem.findFirst({
      where: { id, category: { shopId } },
    });

    if (!existing) {
      throw new NotFoundException('Service item not found');
    }

    return this.prisma.serviceItem.update({
      where: { id },
      data: { isActive: !existing.isActive },
    }).then(async (updated) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.SERVICE_ITEM_TOGGLE,
        targetType: 'ServiceItem',
        targetId: id,
        detail: { name: updated.name, isActive: updated.isActive },
        ip,
      });
      return updated;
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

  async remove(id: string, shopId: string, operatorId?: string, ip?: string) {
    const existing = await this.prisma.serviceItem.findFirst({
      where: { id, category: { shopId } },
    });

    if (!existing) {
      throw new NotFoundException('Service item not found');
    }

    await this.prisma.serviceItem.delete({ where: { id } });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.SERVICE_ITEM_DELETE,
      targetType: 'ServiceItem',
      targetId: id,
      detail: { name: existing.name },
      ip,
    });

    return { id };
  }
}
