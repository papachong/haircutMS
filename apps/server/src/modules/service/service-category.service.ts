import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService, AuditActions } from '../audit/audit.service';

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
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(shopId: string) {
    return this.prisma.serviceCategory.findMany({
      where: { shopId },
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { items: true } } },
    });
  }

  async create(shopId: string, data: CreateCategoryData, operatorId?: string, ip?: string) {
    const category = await this.prisma.serviceCategory.create({
      data: {
        shopId,
        name: data.name,
        sortOrder: data.sortOrder ?? 0,
      },
    });

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.SERVICE_CATEGORY_CREATE,
      targetType: 'ServiceCategory',
      targetId: category.id,
      detail: { name: category.name, sortOrder: category.sortOrder },
      ip,
    });

    return category;
  }

  async update(id: string, shopId: string, data: UpdateCategoryData, operatorId?: string, ip?: string) {
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
    }).then(async (updated) => {
      await this.auditService.log({
        shopId,
        staffId: operatorId,
        action: AuditActions.SERVICE_CATEGORY_UPDATE,
        targetType: 'ServiceCategory',
        targetId: id,
        detail: { name: updated.name, changes: data },
        ip,
      });
      return updated;
    });
  }

  async remove(id: string, shopId: string, operatorId?: string, ip?: string) {
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

    await this.auditService.log({
      shopId,
      staffId: operatorId,
      action: AuditActions.SERVICE_CATEGORY_DELETE,
      targetType: 'ServiceCategory',
      targetId: id,
      detail: { name: existing.name },
      ip,
    });

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
