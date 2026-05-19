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
  // Month-over-month growth rates
  shopGrowthRate: number;
  activeShopGrowthRate: number;
  revenueGrowthRate: number;
  memberGrowthRate: number;
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

export interface ExpiringLicense {
  shopId: string;
  shopName: string;
  shopPhone: string | null;
  licensePlan: string;
  expiresAt: Date;
  daysUntilExpiry: number;
}

@Injectable()
export class PlatformOverviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get platform-wide overview statistics with month-over-month growth rates
   */
  async getOverview(): Promise<PlatformOverview> {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

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

    // Calculate last month's stats for growth rates
    const [
      shopsLastMonth,
      activeShopsLastMonth,
      revenueLastMonthResult,
      membersLastMonthResult,
    ] = await Promise.all([
      // Shops created before this month
      this.prisma.shop.count({
        where: { createdAt: { lt: firstDayOfMonth } },
      }),
      // Active shops last month (shops with orders last month)
      this.prisma.order.groupBy({
        by: ['shopId'],
        where: {
          createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth },
        },
      }).then((groups) => groups.length),
      // Revenue last month
      this.prisma.order.aggregate({
        where: {
          status: 'SETTLED',
          createdAt: { gte: firstDayOfLastMonth, lt: firstDayOfMonth },
        },
        _sum: { paidAmount: true },
      }),
      // Members active before this month (approximation: total minus new this month)
      this.prisma.member.count({
        where: {
          isActive: true,
          createdAt: { lt: firstDayOfMonth },
        },
      }),
    ]);

    const revenueLastMonth = revenueLastMonthResult._sum.paidAmount || 0;
    const membersLastMonth = membersLastMonthResult;

    const calcGrowth = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 10000) / 100;
    };

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
      shopGrowthRate: calcGrowth(totalShops, shopsLastMonth),
      activeShopGrowthRate: calcGrowth(activeShopsThisMonth, activeShopsLastMonth),
      revenueGrowthRate: calcGrowth(revenueThisMonth, revenueLastMonth),
      memberGrowthRate: calcGrowth(totalMembers, membersLastMonth),
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

  /**
   * Get licenses expiring within 15 days
   */
  async getExpiringLicenses(days: number = 15): Promise<ExpiringLicense[]> {
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + days);

    const licenses = await this.prisma.license.findMany({
      where: {
        expiresAt: {
          gt: now,
          lte: warningDate,
        },
      },
      include: {
        shop: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
      orderBy: { expiresAt: 'asc' },
    });

    return licenses.map((license) => ({
      shopId: license.shopId,
      shopName: license.shop.name,
      shopPhone: license.shop.phone,
      licensePlan: license.plan,
      expiresAt: license.expiresAt,
      daysUntilExpiry: Math.ceil(
        (new Date(license.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      ),
    }));
  }
}