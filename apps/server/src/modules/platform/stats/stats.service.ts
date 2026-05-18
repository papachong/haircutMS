import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service';

export interface PlatformStats {
  totalShops: number;
  activeShops: number;
  suspendedShops: number;
  archivedShops: number;
  totalRevenue: number;
  totalMembers: number;
  totalOrders: number;
  expiringSoonCount: number;
  expiredCount: number;
}

const EXPIRY_WARNING_DAYS = 15;

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getStats(): Promise<PlatformStats> {
    const now = new Date();
    const warningDate = new Date(now);
    warningDate.setDate(warningDate.getDate() + EXPIRY_WARNING_DAYS);

    const [
      totalShops,
      activeShops,
      suspendedShops,
      archivedShops,
      totalMembers,
      totalOrders,
      allLicenses,
    ] = await Promise.all([
      this.prisma.shop.count(),
      this.prisma.shop.count({ where: { status: 'ACTIVE' } }),
      this.prisma.shop.count({ where: { status: 'SUSPENDED' } }),
      this.prisma.shop.count({ where: { status: 'ARCHIVED' } }),
      this.prisma.member.count({ where: { isActive: true } }),
      this.prisma.order.count(),
      this.prisma.license.findMany({
        select: {
          expiresAt: true,
        },
      }),
    ]);

    // Calculate expiring and expired counts
    let expiringSoonCount = 0;
    let expiredCount = 0;

    for (const license of allLicenses) {
      const expiresAt = new Date(license.expiresAt);
      if (expiresAt < now) {
        expiredCount++;
      } else if (expiresAt <= warningDate) {
        expiringSoonCount++;
      }
    }

    // Calculate total revenue from settled orders
    const revenueResult = await this.prisma.payment.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        order: {
          status: 'SETTLED',
        },
      },
    });

    const totalRevenue = revenueResult._sum.amount || 0;

    return {
      totalShops,
      activeShops,
      suspendedShops,
      archivedShops,
      totalRevenue,
      totalMembers,
      totalOrders,
      expiringSoonCount,
      expiredCount,
    };
  }
}