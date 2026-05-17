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
}