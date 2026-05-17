import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface PlatformOverview {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  archivedShops: number;
  totalMembers: number;
  totalOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  activeShopsThisMonth: number;
}

export interface ShopRevenue {
  shopId: string;
  shopName: string;
  totalRevenue: number;
  orderCount: number;
  memberCount: number;
}

export interface ShopUsage {
  shopId: string;
  shopName: string;
  phone: string | null;
  status: string;
  staffCount: number;
  memberCount: number;
  orderCount: number;
  totalRevenue: number;
  storageUsage: number; // in bytes
  lastActiveAt: Date | null;
  createdAt: Date;
}

export interface NewShopsTrend {
  date: string;
  count: number;
}

@Injectable()
export class PlatformOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get platform-wide overview statistics
   */
  async getOverview(): Promise<PlatformOverview> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get basic shop counts
    const [totalShops, activeShops, suspendedShops, archivedShops] =
      await Promise.all([
        this.prisma.shop.count(),
        this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
        this.prisma.shop.count({ where: { status: 'SUSPENDED' } }),
        this.prisma.shop.count({ where: { status: 'ARCHIVED' } }),
      ]);

    // Get total members and orders
    const [totalMembers, totalOrders] = await Promise.all([
      this.prisma.member.count({ where: { isActive: true } }),
      this.prisma.order.count(),
    ]);

    // Get total revenue (from settled orders)
    const revenueResult = await this.prisma.order.aggregate({
      where: { status: 'SETTLED' },
      _sum: { paidAmount: true },
    });
    const totalRevenue = revenueResult._sum.paidAmount || 0;

    // Get this month's stats
    const [revenueThisMonthResult, ordersThisMonthResult] = await Promise.all([
      this.prisma.order.aggregate({
        where: {
          status: 'SETTLED',
          createdAt: { gte: firstDayOfMonth },
        },
        _sum: { paidAmount: true },
      }),
      this.prisma.order.count({
        where: {
          createdAt: { gte: firstDayOfMonth },
        },
      }),
    ]);
    const revenueThisMonth = revenueThisMonthResult._sum.paidAmount || 0;
    const ordersThisMonth = ordersThisMonthResult;

    // Get active shops this month (shops with orders this month)
    const activeShopsThisMonth = await this.prisma.order.groupBy({
      by: ['shopId'],
      where: {
        createdAt: { gte: firstDayOfMonth },
      },
    }).then((groups) => groups.length);

    return {
      totalShops,
      activeShops,
      suspendedShops,
      archivedShops,
      totalMembers,
      totalOrders,
      totalRevenue,
      revenueThisMonth,
      ordersThisMonth,
      activeShopsThisMonth,
    };
  }

  /**
   * Get shops ranked by revenue
   */
  async getTopShopsByRevenue(limit: number = 10): Promise<ShopRevenue[]> {
    const shops = await this.prisma.shop.findMany({
      select: {
        id: true,
        name: true,
        orders: {
          where: { status: 'SETTLED' },
          select: {
            paidAmount: true,
          },
        },
        _count: {
          select: {
            members: { where: { isActive: true } },
            orders: true,
          },
        },
      },
    });

    const shopRevenues: ShopRevenue[] = shops
      .map((shop) => ({
        shopId: shop.id,
        shopName: shop.name,
        totalRevenue: shop.orders.reduce(
          (sum, order) => sum + order.paidAmount,
          0,
        ),
        orderCount: shop._count.orders,
        memberCount: shop._count.members,
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, limit);

    return shopRevenues;
  }

  /**
   * Get usage statistics for all shops
   */
  async getShopUsageStats(): Promise<ShopUsage[]> {
    const shops = await this.prisma.shop.findMany({
      include: {
        orders: {
          select: {
            paidAmount: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            staff: { where: { isActive: true } },
            members: { where: { isActive: true } },
            orders: true,
          },
        },
        license: {
          select: {
            staffLimit: true,
            membersLimit: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get last active date for each shop (from member visits)
    const memberVisits = await this.prisma.member.findMany({
      where: {
        lastVisitAt: { not: null },
      },
      select: {
        shopId: true,
        lastVisitAt: true,
      },
      orderBy: { lastVisitAt: 'desc' },
    });

    // Build map of shopId -> last active date
    const lastActiveMap = new Map<string, Date>();
    for (const visit of memberVisits) {
      if (
        !lastActiveMap.has(visit.shopId) ||
        visit.lastVisitAt! > lastActiveMap.get(visit.shopId)!
      ) {
        lastActiveMap.set(visit.shopId, visit.lastVisitAt!);
      }
    }

    return shops.map((shop) => {
      const totalRevenue = shop.orders.reduce(
        (sum, order) => sum + order.paidAmount,
        0,
      );

      // Estimate storage usage (rough estimate based on data volume)
      const staffUsage = shop._count.staff * 1000; // 1KB per staff record
      const memberUsage = shop._count.members * 2000; // 2KB per member record
      const orderUsage = shop._count.orders * 500; // 500B per order
      const storageUsage = staffUsage + memberUsage + orderUsage;

      return {
        shopId: shop.id,
        shopName: shop.name,
        phone: shop.phone,
        status: shop.status,
        staffCount: shop._count.staff,
        memberCount: shop._count.members,
        orderCount: shop._count.orders,
        totalRevenue,
        storageUsage,
        lastActiveAt: lastActiveMap.get(shop.id) || null,
        createdAt: shop.createdAt,
      };
    });
  }

  /**
   * Get new shops trend for the last N days
   */
  async getNewShopsTrend(days: number = 30): Promise<NewShopsTrend[]> {
    const now = new Date();
    const trends: NewShopsTrend[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await this.prisma.shop.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    return trends;
  }

  /**
   * Get revenue trend for the last N days
   */
  async getRevenueTrend(days: number = 30): Promise<
    Array<{ date: string; revenue: number; orderCount: number }>
  > {
    const now = new Date();
    const trends: Array<{ date: string; revenue: number; orderCount: number }>
      = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const result = await this.prisma.order.aggregate({
        where: {
          status: 'SETTLED',
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
        _sum: { paidAmount: true },
        _count: true,
      });

      trends.push({
        date: date.toISOString().split('T')[0],
        revenue: result._sum.paidAmount || 0,
        orderCount: result._count,
      });
    }

    return trends;
  }
}