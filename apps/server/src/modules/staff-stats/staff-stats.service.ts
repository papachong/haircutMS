import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface StaffStats {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
  serviceTypeDistribution: ServiceTypeStat[];
}

export interface ServiceTypeStat {
  categoryId: string;
  categoryName: string;
  count: number;
  revenue: number;
}

export interface PersonalServiceRecord {
  id: string;
  orderNo: string;
  memberName: string;
  memberPhone: string;
  serviceName: string;
  category: string;
  price: number;
  quantity: number;
  subtotal: number;
  discountRate: string;
  finalPrice: number;
  completedAt: string;
}

export interface ServiceTrend {
  date: string;
  count: number;
  revenue: number;
}

@Injectable()
export class StaffStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * 获取店内所有员工统计数据（管理员用）
   */
  async getShopStaffStats(shopId: string) {
    const staffList = await this.prisma.staff.findMany({
      where: { shopId, isActive: true },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    const stats = await Promise.all(
      staffList.map(async (staff) => {
        const orderItems = await this.prisma.orderItem.findMany({
          where: {
            staffId: staff.id,
            order: {
              shopId,
              status: { in: ['SETTLED'] },
            },
          },
          include: {
            serviceItem: {
              include: {
                category: true,
              },
            },
          },
        });

        const totalServices = orderItems.reduce((sum, item) => sum + item.quantity, 0);
        const totalRevenue = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);

        const serviceTypeMap = new Map<string, ServiceTypeStat>();

        orderItems.forEach((item) => {
          const category = item.serviceItem.category;
          if (!category) return;

          const key = category.id;
          const existing = serviceTypeMap.get(key);

          if (existing) {
            existing.count += item.quantity;
            existing.revenue += item.finalPrice;
          } else {
            serviceTypeMap.set(key, {
              categoryId: category.id,
              categoryName: category.name,
              count: item.quantity,
              revenue: item.finalPrice,
            });
          }
        });

        return {
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          totalServices,
          totalRevenue,
          serviceTypeDistribution: Array.from(serviceTypeMap.values()).sort(
            (a, b) => b.count - a.count,
          ),
        };
      }),
    );

    return stats.sort((a, b) => b.totalServices - a.totalServices);
  }

  /**
   * 获取指定员工的详细统计数据
   */
  async getStaffDetailStats(shopId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, shopId },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!staff) {
      return null;
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        staffId: staffId,
        order: {
          shopId,
          status: { in: ['SETTLED'] },
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
      },
    });

    const totalServices = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);

    const serviceTypeMap = new Map<string, ServiceTypeStat>();

    orderItems.forEach((item) => {
      const category = item.serviceItem.category;
      if (!category) return;

      const key = category.id;
      const existing = serviceTypeMap.get(key);

      if (existing) {
        existing.count += item.quantity;
        existing.revenue += item.finalPrice;
      } else {
        serviceTypeMap.set(key, {
          categoryId: category.id,
          categoryName: category.name,
          count: item.quantity,
          revenue: item.finalPrice,
        });
      }
    });

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      totalServices,
      totalRevenue,
      serviceTypeDistribution: Array.from(serviceTypeMap.values()).sort(
        (a, b) => b.count - a.count,
      ),
    };
  }

  /**
   * 获取员工的服务记录（支持日期范围筛选）
   */
  async getPersonalServiceRecords(
    shopId: string,
    staffId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: string,
    endDate?: string,
  ) {
    const skip = (page - 1) * limit;

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
      // Include the entire end date
      dateFilter.lte.setHours(23, 59, 59, 999);
    }

    const [orderItems, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where: {
          staffId,
          order: {
            shopId,
            status: { in: ['SETTLED'] },
            ...(Object.keys(dateFilter).length > 0 && {
              settledAt: dateFilter,
            }),
          },
        },
        include: {
          serviceItem: {
            include: {
              category: true,
            },
          },
          order: {
            include: {
              member: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: {
          order: {
            settledAt: 'desc',
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.orderItem.count({
        where: {
          staffId,
          order: {
            shopId,
            status: { in: ['SETTLED'] },
            ...(Object.keys(dateFilter).length > 0 && {
              settledAt: dateFilter,
            }),
          },
        },
      }),
    ]);

    const records = orderItems.map((item) => ({
      id: item.id,
      orderNo: item.order.orderNo,
      memberName: item.order.member?.name || '散客',
      memberPhone: item.order.member?.phone || '-',
      serviceName: item.serviceItem.name,
      category: item.serviceItem.category?.name || '其他',
      price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      discountRate: (1 - Number(item.discountRate)) * 100 + '%',
      finalPrice: item.finalPrice,
      completedAt: item.order.settledAt?.toISOString() || item.order.createdAt.toISOString(),
    }));

    return {
      records,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 获取员工服务趋势数据（按日/周/月）
   */
  async getStaffServiceTrends(
    shopId: string,
    staffId: string,
    timeRange: 'day' | 'week' | 'month',
    startDate?: string,
    endDate?: string,
  ): Promise<ServiceTrend[]> {
    // Default date range based on timeRange
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (!startDate || !endDate) {
      switch (timeRange) {
        case 'day':
          start = new Date(now);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
          break;
        case 'week':
          start = new Date(now);
          start.setDate(now.getDate() - 6);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
          break;
        case 'month':
          start = new Date(now);
          start.setDate(1);
          start.setHours(0, 0, 0, 0);
          end = new Date(now);
          end.setHours(23, 59, 59, 999);
          break;
      }
    } else {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        staffId,
        order: {
          shopId,
          status: { in: ['SETTLED'] },
          settledAt: {
            gte: start,
            lte: end,
          },
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
      },
      orderBy: {
        order: {
          settledAt: 'asc',
        },
      },
    });

    // Group by date based on timeRange
    const groupedByDate = new Map<string, { count: number; revenue: number }>();

    orderItems.forEach((item) => {
      const settledAt = item.order.settledAt || item.order.createdAt;
      let dateKey: string;

      switch (timeRange) {
        case 'day':
          // Group by hour for day view
          dateKey = settledAt.getHours().toString().padStart(2, '0') + ':00';
          break;
        case 'week':
          dateKey = settledAt.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
          break;
        case 'month':
          dateKey = settledAt.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
          break;
        default:
          dateKey = settledAt.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
      }

      const existing = groupedByDate.get(dateKey);
      if (existing) {
        existing.count += item.quantity;
        existing.revenue += item.finalPrice;
      } else {
        groupedByDate.set(dateKey, { count: item.quantity, revenue: item.finalPrice });
      }
    });

    // Convert to array and ensure proper ordering
    const trends: ServiceTrend[] = Array.from(groupedByDate.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: Math.round(data.revenue),
    }));

    return trends;
  }

  /**
   * 获取当前员工的个人统计摘要（发型师用）
   */
  async getPersonalStatsSummary(shopId: string, staffId: string) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, shopId },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!staff) {
      return null;
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        staffId,
        order: {
          shopId,
          status: { in: ['SETTLED'] },
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
      },
    });

    const totalServices = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);

    const serviceTypeMap = new Map<string, ServiceTypeStat>();

    orderItems.forEach((item) => {
      const category = item.serviceItem.category;
      if (!category) return;

      const key = category.id;
      const existing = serviceTypeMap.get(key);

      if (existing) {
        existing.count += item.quantity;
        existing.revenue += item.finalPrice;
      } else {
        serviceTypeMap.set(key, {
          categoryId: category.id,
          categoryName: category.name,
          count: item.quantity,
          revenue: item.finalPrice,
        });
      }
    });

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      totalServices,
      totalRevenue,
      serviceTypeDistribution: Array.from(serviceTypeMap.values()).sort(
        (a, b) => b.count - a.count,
      ),
    };
  }

  /**
   * 获取指定员工在指定时间范围内的详细统计数据
   */
  async getStaffDetailStatsWithDate(
    shopId: string,
    staffId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, shopId },
      select: {
        id: true,
        name: true,
        role: true,
      },
    });

    if (!staff) {
      return null;
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      dateFilter.lte = new Date(endDate);
      dateFilter.lte.setHours(23, 59, 59, 999);
    }

    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        staffId,
        order: {
          shopId,
          status: { in: ['SETTLED'] },
          ...(Object.keys(dateFilter).length > 0 && {
            settledAt: dateFilter,
          }),
        },
      },
      include: {
        serviceItem: {
          include: {
            category: true,
          },
        },
      },
    });

    const totalServices = orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const totalRevenue = orderItems.reduce((sum, item) => sum + item.finalPrice, 0);

    const serviceTypeMap = new Map<string, ServiceTypeStat>();

    orderItems.forEach((item) => {
      const category = item.serviceItem.category;
      if (!category) return;

      const key = category.id;
      const existing = serviceTypeMap.get(key);

      if (existing) {
        existing.count += item.quantity;
        existing.revenue += item.finalPrice;
      } else {
        serviceTypeMap.set(key, {
          categoryId: category.id,
          categoryName: category.name,
          count: item.quantity,
          revenue: item.finalPrice,
        });
      }
    });

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      totalServices,
      totalRevenue,
      serviceTypeDistribution: Array.from(serviceTypeMap.values()).sort(
        (a, b) => b.count - a.count,
      ),
    };
  }
}