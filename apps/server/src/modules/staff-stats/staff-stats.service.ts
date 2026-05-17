import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface StaffRankingItem {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
}

interface ServiceTypeDistribution {
  serviceId: string;
  serviceName: string;
  categoryName: string;
  count: number;
  revenue: number;
}

interface StaffStatsDetail {
  staffId: string;
  staffName: string;
  staffRole: string;
  totalServices: number;
  totalRevenue: number;
  serviceDistribution: ServiceTypeDistribution[];
}

interface PersonalServiceRecord {
  id: string;
  orderNo: string;
  serviceName: string;
  price: number;
  quantity: number;
  subtotal: number;
  memberName: string;
  createdAt: Date;
}

@Injectable()
export class StaffStatsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get staff ranking by total service count (descending)
   * Stylists can only see their own stats
   */
  async getStaffRanking(
    shopId: string,
    currentStaffId?: string,
    currentRole?: string,
  ): Promise<StaffRankingItem[]> {
    // Stylists can only see their own data
    if (currentRole === 'STYLIST' && currentStaffId) {
      const staff = await this.prisma.staff.findUnique({
        where: { id: currentStaffId },
        select: { id: true, name: true, role: true },
      });

      if (!staff) {
        throw new ForbiddenException('Staff not found');
      }

      const stats = await this.prisma.orderItem.groupBy({
        by: ['staffId'],
        where: {
          staffId: currentStaffId,
        },
        _count: { id: true },
        _sum: { finalPrice: true },
      });

      return [
        {
          staffId: staff.id,
          staffName: staff.name,
          staffRole: staff.role,
          totalServices: stats[0]?._count.id ?? 0,
          totalRevenue: stats[0]?._sum.finalPrice ?? 0,
        },
      ];
    }

    // Other roles can see all staff ranking
    const staffList = await this.prisma.staff.findMany({
      where: { shopId, isActive: true },
      select: { id: true, name: true, role: true },
    });

    const staffIds = staffList.map((s) => s.id);

    const stats = await this.prisma.orderItem.groupBy({
      by: ['staffId'],
      where: {
        staffId: { in: staffIds },
      },
      _count: { id: true },
      _sum: { finalPrice: true },
    });

    const statsMap = new Map(
      stats.map((s) => [
        s.staffId,
        { count: s._count.id, revenue: s._sum.finalPrice ?? 0 },
      ]),
    );

    const ranking: StaffRankingItem[] = staffList
      .map((staff) => ({
        staffId: staff.id,
        staffName: staff.name,
        staffRole: staff.role,
        totalServices: statsMap.get(staff.id)?.count ?? 0,
        totalRevenue: statsMap.get(staff.id)?.revenue ?? 0,
      }))
      .sort((a, b) => b.totalServices - a.totalServices);

    return ranking;
  }

  /**
   * Get detailed stats for a specific staff member
   * Includes service type distribution
   */
  async getStaffDetail(
    staffId: string,
    shopId: string,
    currentStaffId?: string,
    currentRole?: string,
  ): Promise<StaffStatsDetail> {
    // Stylists can only see their own data
    if (currentRole === 'STYLIST' && currentStaffId !== staffId) {
      throw new ForbiddenException('You can only view your own statistics');
    }

    // Verify staff belongs to the shop
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, shopId },
      select: { id: true, name: true, role: true },
    });

    if (!staff) {
      throw new ForbiddenException('Staff not found or not in this shop');
    }

    // Get total stats
    const totalStats = await this.prisma.orderItem.aggregate({
      where: { staffId },
      _count: { id: true },
      _sum: { finalPrice: true },
    });

    // Get service type distribution
    const serviceDistribution = await this.prisma.orderItem.groupBy({
      by: ['serviceItemId'],
      where: { staffId },
      _count: { id: true },
      _sum: { finalPrice: true },
    });

    const serviceItemIds = serviceDistribution.map((s) => s.serviceItemId);

    const serviceItems = await this.prisma.serviceItem.findMany({
      where: { id: { in: serviceItemIds } },
      include: { category: true },
    });

    const itemMap = new Map(
      serviceItems.map((item) => [
        item.id,
        { name: item.name, category: item.category?.name ?? '未分类' },
      ]),
    );

    const distribution: ServiceTypeDistribution[] = serviceDistribution.map(
      (stat) => {
        const itemInfo = itemMap.get(stat.serviceItemId);
        return {
          serviceId: stat.serviceItemId,
          serviceName: itemInfo?.name ?? 'Unknown',
          categoryName: itemInfo?.category ?? '未分类',
          count: stat._count.id,
          revenue: stat._sum.finalPrice ?? 0,
        };
      },
    );

    // Sort by count descending
    distribution.sort((a, b) => b.count - a.count);

    return {
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      totalServices: totalStats._count.id,
      totalRevenue: totalStats._sum.finalPrice ?? 0,
      serviceDistribution: distribution,
    };
  }

  /**
   * Get personal service records for a staff member
   * Used by stylists to view their recent work
   */
  async getPersonalServiceRecords(
    staffId: string,
    shopId: string,
    currentStaffId?: string,
    currentRole?: string,
    limit: number = 50,
  ): Promise<PersonalServiceRecord[]> {
    // Stylists can only see their own data
    if (currentRole === 'STYLIST' && currentStaffId !== staffId) {
      throw new ForbiddenException('You can only view your own records');
    }

    // Verify staff belongs to the shop
    const staff = await this.prisma.staff.findFirst({
      where: { id: staffId, shopId },
      select: { id: true },
    });

    if (!staff) {
      throw new ForbiddenException('Staff not found or not in this shop');
    }

    const records = await this.prisma.orderItem.findMany({
      where: { staffId },
      include: {
        order: {
          include: { member: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return records.map((item) => ({
      id: item.id,
      orderNo: item.order.orderNo,
      serviceName: item.serviceName,
      price: item.unitPrice,
      quantity: item.quantity,
      subtotal: item.subtotal,
      memberName: item.order.member?.name ?? '散客',
      createdAt: item.order.createdAt,
    }));
  }
}