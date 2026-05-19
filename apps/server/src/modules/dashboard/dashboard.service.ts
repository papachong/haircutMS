import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export enum TimeRange {
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
  CUSTOM = 'custom',
}

export type Granularity = 'day' | 'week' | 'month';

export interface DashboardMetrics {
  revenue: number;
  visitorCount: number;
  averageTicket: number;
  newMembers: number;
  periodStart: Date;
  periodEnd: Date;
  previousPeriodRevenue?: number;
  revenueGrowth?: number;
}

export interface TrendDataPoint {
  date: string;
  revenue: number;
  visitors: number;
}

export interface DashboardTrendsResponse {
  data: TrendDataPoint[];
  granularity: Granularity;
  totalRevenue: number;
  totalVisitors: number;
}

export interface MemberLevelDistribution {
  levelId: string;
  levelName: string;
  count: number;
  percentage: number;
}

export interface MemberConsumptionTrendData {
  date: string;
  recharge: number;
  consume: number;
}

export interface MemberConsumptionTrendsResponse {
  data: MemberConsumptionTrendData[];
  totalRecharge: number;
  totalConsume: number;
  granularity: Granularity;
}

export interface DormantMembersStats {
  totalCount: number;
  dormantCount: number;
  dormantPercentage: number;
}

export interface DormantMemberDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface DormantMembersDetail extends DormantMembersStats {
  distribution: DormantMemberDistribution[];
}

export interface DailyConsumptionData {
  date: string;
  amount: number;
  count: number;
}

export interface DailyConsumptionResponse {
  data: DailyConsumptionData[];
  totalAmount: number;
  totalCount: number;
}

export interface RevenueComposition {
  offline: number;
  balance: number;
  recharge: number;
  passCard: number;
}

export interface RevenueBreakdown {
  composition: RevenueComposition;
  rechargeIncome: number;
  consumeIncome: number;
}

export interface ServiceItemRanking {
  id: string;
  name: string;
  count: number;
  amount: number;
  averagePrice: number;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getMetrics(shopId: string, timeRange: TimeRange = TimeRange.TODAY, startDate?: string, endDate?: string): Promise<DashboardMetrics> {
    const { current, previous } = this.getDateRanges(timeRange, startDate, endDate);

    const [currentOrders, previousOrders, currentMembers, currentVisitors] = await Promise.all([
      this.getOrdersStats(shopId, current.start, current.end),
      this.getOrdersStats(shopId, previous.start, previous.end),
      this.getNewMembersCount(shopId, current.start, current.end),
      this.getVisitorCount(shopId, current.start, current.end),
    ]);

    const revenue = currentOrders.totalRevenue;
    const visitorCount = currentVisitors;
    const averageTicket = visitorCount > 0 ? Math.round(revenue / visitorCount) : 0;
    const newMembers = currentMembers;

    const previousRevenue = previousOrders.totalRevenue;
    const revenueGrowth = previousRevenue > 0
      ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    return {
      revenue,
      visitorCount,
      averageTicket,
      newMembers,
      periodStart: current.start,
      periodEnd: current.end,
      previousPeriodRevenue: previousRevenue,
      revenueGrowth,
    };
  }

  async getTrends(
    shopId: string,
    timeRange: TimeRange = TimeRange.TODAY,
    startDate?: string,
    endDate?: string,
  ): Promise<DashboardTrendsResponse> {
    const { current } = this.getDateRanges(timeRange, startDate, endDate);

    const granularity = this.determineGranularity(timeRange, current.start, current.end);
    const dataPoints = await this.generateTrendData(shopId, current.start, current.end, granularity);

    const totalRevenue = dataPoints.reduce((sum, p) => sum + p.revenue, 0);
    const totalVisitors = dataPoints.reduce((sum, p) => sum + p.visitors, 0);

    return {
      data: dataPoints,
      granularity,
      totalRevenue,
      totalVisitors,
    };
  }

  private getDateRanges(
    timeRange: TimeRange,
    startDate?: string,
    endDate?: string,
  ): { current: { start: Date; end: Date }; previous: { start: Date; end: Date } } {
    const now = new Date();
    let currentStart: Date;
    let currentEnd: Date;
    let previousStart: Date;
    let previousEnd: Date;

    if (timeRange === TimeRange.CUSTOM && startDate && endDate) {
      currentStart = this.getStartOfDay(new Date(startDate));
      currentEnd = this.getEndOfDay(new Date(endDate));
      const duration = currentEnd.getTime() - currentStart.getTime();
      previousEnd = new Date(currentStart.getTime() - 1);
      previousEnd.setHours(23, 59, 59, 999);
      previousStart = new Date(previousEnd.getTime() - duration);
    } else {
      switch (timeRange) {
        case TimeRange.TODAY:
          currentStart = this.getStartOfDay(now);
          currentEnd = this.getEndOfDay(now);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          previousStart = this.getStartOfDay(previousEnd);
          break;

        case TimeRange.WEEK:
          currentStart = this.getStartOfWeek(now);
          currentEnd = this.getEndOfDay(now);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          previousStart = this.getStartOfWeek(previousEnd);
          break;

        case TimeRange.MONTH:
          currentStart = this.getStartOfMonth(now);
          currentEnd = this.getEndOfDay(now);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          previousStart = this.getStartOfMonth(previousEnd);
          break;

        default:
          currentStart = this.getStartOfDay(now);
          currentEnd = this.getEndOfDay(now);
          previousEnd = new Date(currentStart.getTime() - 1);
          previousEnd.setHours(23, 59, 59, 999);
          previousStart = this.getStartOfDay(previousEnd);
      }
    }

    return {
      current: { start: currentStart, end: currentEnd },
      previous: { start: previousStart, end: previousEnd },
    };
  }

  private async getOrdersStats(shopId: string, startDate: Date, endDate: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        payableAmount: true,
      },
    });

    const totalRevenue = orders.reduce((sum, order) => sum + order.payableAmount, 0);

    return { totalRevenue };
  }

  private async getNewMembersCount(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.member.count({
      where: {
        shopId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  private async getVisitorCount(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    const orders = await this.prisma.order.groupBy({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      by: ['memberId'],
    });

    return orders.length;
  }

  private determineGranularity(timeRange: TimeRange, startDate: Date, endDate: Date): Granularity {
    const dayDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayDiff <= 1) {
      return 'day';
    } else if (dayDiff <= 14) {
      return 'day';
    } else if (dayDiff <= 60) {
      return 'week';
    } else {
      return 'month';
    }
  }

  private async generateTrendData(
    shopId: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity,
  ): Promise<TrendDataPoint[]> {
    const dataPoints: TrendDataPoint[] = [];

    if (granularity === 'day') {
      const days = this.getDateRange(startDate, endDate, 'day');

      for (const day of days) {
        const { start, end } = day;
        const [revenue, visitors] = await Promise.all([
          this.getDayRevenue(shopId, start, end),
          this.getDayVisitors(shopId, start, end),
        ]);

        dataPoints.push({
          date: start.toISOString().split('T')[0],
          revenue,
          visitors,
        });
      }
    } else if (granularity === 'week') {
      const weeks = this.getDateRange(startDate, endDate, 'week');

      for (const week of weeks) {
        const { start, end } = week;
        const [revenue, visitors] = await Promise.all([
          this.getDayRevenue(shopId, start, end),
          this.getDayVisitors(shopId, start, end),
        ]);

        const weekLabel = `${start.toISOString().split('T')[0]}`;
        dataPoints.push({
          date: weekLabel,
          revenue,
          visitors,
        });
      }
    } else {
      const months = this.getDateRange(startDate, endDate, 'month');

      for (const month of months) {
        const { start, end } = month;
        const [revenue, visitors] = await Promise.all([
          this.getDayRevenue(shopId, start, end),
          this.getDayVisitors(shopId, start, end),
        ]);

        const monthLabel = start.toISOString().slice(0, 7);
        dataPoints.push({
          date: monthLabel,
          revenue,
          visitors,
        });
      }
    }

    return dataPoints;
  }

  private getDateRange(
    startDate: Date,
    endDate: Date,
    granularity: 'day' | 'week' | 'month',
  ): Array<{ start: Date; end: Date }> {
    const ranges: Array<{ start: Date; end: Date }> = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      let start: Date;
      let end: Date;

      if (granularity === 'day') {
        start = this.getStartOfDay(current);
        end = this.getEndOfDay(current);
        current.setDate(current.getDate() + 1);
      } else if (granularity === 'week') {
        start = this.getStartOfDay(current);
        const weekEnd = new Date(current);
        weekEnd.setDate(current.getDate() + (6 - current.getDay()));
        end = this.getEndOfDay(weekEnd);
        current = new Date(end);
        current.setDate(current.getDate() + 1);
      } else {
        start = this.getStartOfDay(current);
        end = this.getEndOfMonth(current);
        current = new Date(end);
        current.setDate(current.getDate() + 1);
      }

      if (start > endDate) break;

      ranges.push({ start, end });
    }

    return ranges;
  }

  private async getDayRevenue(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        payableAmount: true,
      },
    });

    return result._sum.payableAmount ?? 0;
  }

  private async getDayVisitors(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    return this.prisma.order.groupBy({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      by: ['memberId'],
    }).then(orders => orders.length);
  }

  private getStartOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  private getEndOfDay(date: Date): Date {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
  }

  private getStartOfWeek(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay();
    const diff = result.getDate() - day + (day === 0 ? -6 : 1);
    result.setDate(diff);
    return this.getStartOfDay(result);
  }

  private getStartOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setDate(1);
    return this.getStartOfDay(result);
  }

  private getEndOfMonth(date: Date): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + 1, 0);
    return this.getEndOfDay(result);
  }

  async getMemberLevelDistribution(shopId: string): Promise<MemberLevelDistribution[]> {
    const distribution = await this.prisma.member.groupBy({
      where: {
        shopId,
        isActive: true,
      },
      by: ['memberLevelId'],
      _count: {
        id: true,
      },
    });

    const totalMembers = distribution.reduce((sum, d) => sum + d._count.id, 0);

    const levels = await this.prisma.memberLevel.findMany({
      where: {
        shopId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const result: MemberLevelDistribution[] = levels.map((level) => {
      const group = distribution.find((d) => d.memberLevelId === level.id);
      const count = group?._count.id ?? 0;
      return {
        levelId: level.id,
        levelName: level.name,
        count,
        percentage: totalMembers > 0 ? Math.round((count / totalMembers) * 100) : 0,
      };
    });

    return result.sort((a, b) => b.count - a.count);
  }

  async getMemberConsumptionTrends(
    shopId: string,
    timeRange: TimeRange = TimeRange.MONTH,
    startDate?: string,
    endDate?: string,
  ): Promise<MemberConsumptionTrendsResponse> {
    const { current } = this.getDateRanges(timeRange, startDate, endDate);
    const granularity = this.determineGranularity(timeRange, current.start, current.end);
    const dataPoints = await this.generateConsumptionTrendData(shopId, current.start, current.end, granularity);

    const totalRecharge = dataPoints.reduce((sum, p) => sum + p.recharge, 0);
    const totalConsume = dataPoints.reduce((sum, p) => sum + p.consume, 0);

    return {
      data: dataPoints,
      totalRecharge,
      totalConsume,
      granularity,
    };
  }

  async getDormantMembersStats(shopId: string, days: number = 90): Promise<DormantMembersStats> {
    const dormantThreshold = new Date();
    dormantThreshold.setDate(dormantThreshold.getDate() - days);
    dormantThreshold.setHours(0, 0, 0, 0);

    const [total, dormant] = await Promise.all([
      this.prisma.member.count({
        where: {
          shopId,
          isActive: true,
        },
      }),
      this.prisma.member.count({
        where: {
          shopId,
          isActive: true,
          OR: [
            { lastVisitAt: null },
            { lastVisitAt: { lt: dormantThreshold } },
          ],
        },
      }),
    ]);

    const dormantPercentage = total > 0 ? Math.round((dormant / total) * 100) : 0;

    return {
      totalCount: total,
      dormantCount: dormant,
      dormantPercentage,
    };
  }

  private async generateConsumptionTrendData(
    shopId: string,
    startDate: Date,
    endDate: Date,
    granularity: Granularity,
  ): Promise<MemberConsumptionTrendData[]> {
    const dataPoints: MemberConsumptionTrendData[] = [];

    if (granularity === 'day') {
      const days = this.getDateRange(startDate, endDate, 'day');

      for (const day of days) {
        const { start, end } = day;
        const [recharge, consume] = await Promise.all([
          this.getRechargeAmount(shopId, start, end),
          this.getConsumeAmount(shopId, start, end),
        ]);

        dataPoints.push({
          date: start.toISOString().split('T')[0],
          recharge,
          consume,
        });
      }
    } else if (granularity === 'week') {
      const weeks = this.getDateRange(startDate, endDate, 'week');

      for (const week of weeks) {
        const { start, end } = week;
        const [recharge, consume] = await Promise.all([
          this.getRechargeAmount(shopId, start, end),
          this.getConsumeAmount(shopId, start, end),
        ]);

        const weekLabel = `${start.toISOString().split('T')[0]}`;
        dataPoints.push({
          date: weekLabel,
          recharge,
          consume,
        });
      }
    } else {
      const months = this.getDateRange(startDate, endDate, 'month');

      for (const month of months) {
        const { start, end } = month;
        const [recharge, consume] = await Promise.all([
          this.getRechargeAmount(shopId, start, end),
          this.getConsumeAmount(shopId, start, end),
        ]);

        const monthLabel = start.toISOString().slice(0, 7);
        dataPoints.push({
          date: monthLabel,
          recharge,
          consume,
        });
      }
    }

    return dataPoints;
  }

  async getRevenueBreakdown(
    shopId: string,
    timeRange: TimeRange = TimeRange.TODAY,
    startDate?: string,
    endDate?: string,
  ): Promise<RevenueBreakdown> {
    const { current } = this.getDateRanges(timeRange, startDate, endDate);

    const [payments, rechargeAmount] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['method'],
        where: {
          order: {
            shopId,
            status: 'SETTLED',
            createdAt: { gte: current.start, lte: current.end },
          },
        },
        _sum: { amount: true },
      }),
      this.getRechargeAmount(shopId, current.start, current.end),
    ]);

    const composition: RevenueComposition = {
      offline: 0,
      balance: 0,
      recharge: rechargeAmount,
      passCard: 0,
    };

    for (const payment of payments) {
      const amount = payment._sum.amount ?? 0;
      switch (payment.method) {
        case 'OFFLINE':
          composition.offline = amount;
          break;
        case 'BALANCE':
          composition.balance = amount;
          break;
        case 'PASS_CARD':
          composition.passCard = amount;
          break;
      }
    }

    const consumeIncome = composition.offline + composition.balance + composition.passCard;

    return {
      composition,
      rechargeIncome: rechargeAmount,
      consumeIncome,
    };
  }

  async getServiceRanking(
    shopId: string,
    timeRange: TimeRange = TimeRange.TODAY,
    startDate?: string,
    endDate?: string,
    limit: number = 10,
  ): Promise<ServiceItemRanking[]> {
    const { current } = this.getDateRanges(timeRange, startDate, endDate);

    const items = await this.prisma.orderItem.groupBy({
      by: ['serviceItemId', 'serviceName'],
      where: {
        order: {
          shopId,
          status: 'SETTLED',
          createdAt: { gte: current.start, lte: current.end },
        },
      },
      _sum: { finalPrice: true },
      _count: { id: true },
      orderBy: { _sum: { finalPrice: 'desc' } },
      take: limit,
    });

    return items.map((item) => ({
      id: item.serviceItemId,
      name: item.serviceName,
      count: item._count.id,
      amount: item._sum.finalPrice ?? 0,
      averagePrice: item._count.id > 0 ? Math.round((item._sum.finalPrice ?? 0) / item._count.id) : 0,
    }));
  }

  private async getRechargeAmount(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.rechargeRecord.aggregate({
      where: {
        member: {
          shopId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        amount: true,
      },
    });

    return result._sum.amount ?? 0;
  }

  private async getConsumeAmount(shopId: string, startDate: Date, endDate: Date): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        paidAmount: true,
      },
    });

    return result._sum.paidAmount ?? 0;
  }

  async getDormantMembersDetail(shopId: string, days: number = 90): Promise<DormantMembersDetail> {
    const basicStats = await this.getDormantMembersStats(shopId, days);

    if (basicStats.dormantCount === 0) {
      return { ...basicStats, distribution: [] };
    }

    const dormantThreshold = new Date();
    dormantThreshold.setDate(dormantThreshold.getDate() - days);
    dormantThreshold.setHours(0, 0, 0, 0);

    const dormantMembers = await this.prisma.member.findMany({
      where: {
        shopId,
        isActive: true,
        OR: [
          { lastVisitAt: null },
          { lastVisitAt: { lt: dormantThreshold } },
        ],
      },
      select: { lastVisitAt: true },
    });

    const now = new Date();
    const ranges: Array<{ label: string; minDays: number | null; maxDays: number | null }> = [
      { label: '从未到店', minDays: null, maxDays: null },
      { label: `${days}天以上`, minDays: null, maxDays: days },
    ];

    for (let i = Math.floor(days / 30); i >= 1; i--) {
      const lower = i * 30;
      const upper = (i + 1) * 30;
      if (upper <= days) {
        ranges.splice(1, 0, {
          label: `${lower}-${upper}天`,
          minDays: lower,
          maxDays: upper,
        });
      }
    }

    const distribution: DormantMemberDistribution[] = ranges.map((range) => {
      const count = dormantMembers.filter((m) => {
        if (range.minDays === null && range.maxDays === null) {
          return m.lastVisitAt === null;
        }
        if (m.lastVisitAt === null) return false;
        const daysSince = Math.floor(
          (now.getTime() - m.lastVisitAt.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (range.minDays === null) return daysSince >= (range.maxDays as number);
        return daysSince >= range.minDays && daysSince < (range.maxDays as number);
      }).length;

      return {
        range: range.label,
        count,
        percentage: basicStats.dormantCount > 0
          ? Math.round((count / basicStats.dormantCount) * 100)
          : 0,
      };
    });

    return { ...basicStats, distribution };
  }

  async getDailyConsumptionTrends(shopId: string, days: number = 30): Promise<DailyConsumptionResponse> {
    const endDate = this.getEndOfDay(new Date());
    const startDate = this.getStartOfDay(new Date());
    startDate.setDate(startDate.getDate() - (days - 1));

    const orders = await this.prisma.order.findMany({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        paidAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dailyMap = new Map<string, { amount: number; count: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, { amount: 0, count: 0 });
    }

    for (const order of orders) {
      const key = order.createdAt.toISOString().split('T')[0];
      const entry = dailyMap.get(key);
      if (entry) {
        entry.amount += order.paidAmount;
        entry.count += 1;
      }
    }

    const data: DailyConsumptionData[] = [];
    let totalAmount = 0;
    let totalCount = 0;

    dailyMap.forEach((value, date) => {
      data.push({ date, ...value });
      totalAmount += value.amount;
      totalCount += value.count;
    });

    return { data, totalAmount, totalCount };
  }
}