import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DashboardGateway } from '../dashboard/dashboard.gateway';
import { CreateNotificationParams } from './notification.types';
import { QueryNotificationDto } from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private prisma: PrismaService,
    private dashboardGateway: DashboardGateway,
  ) {}

  async create(params: CreateNotificationParams) {
    const notification = await this.prisma.notification.create({
      data: {
        shopId: params.shopId,
        type: params.type,
        title: params.title,
        content: params.content,
        relatedEntityId: params.relatedEntityId,
        relatedEntityType: params.relatedEntityType,
      },
    });

    this.dashboardGateway.emitNotification(params.shopId, notification);

    return notification;
  }

  async findAll(shopId: string, query: QueryNotificationDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const where: Record<string, unknown> = { shopId };

    if (query.type) {
      where.type = query.type;
    }
    if (query.isRead !== undefined) {
      where.isRead = query.isRead;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      pagination: {
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      },
    };
  }

  async markAsRead(shopId: string, id: string) {
    return this.prisma.notification.update({
      where: { id, shopId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(shopId: string) {
    return this.prisma.notification.updateMany({
      where: { shopId, isRead: false },
      data: { isRead: true },
    });
  }

  async remove(shopId: string, id: string) {
    return this.prisma.notification.delete({
      where: { id, shopId },
    });
  }

  async getUnreadCount(shopId: string) {
    const count = await this.prisma.notification.count({
      where: { shopId, isRead: false },
    });
    return { count };
  }
}
