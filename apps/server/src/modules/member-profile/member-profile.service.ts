import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

// ---------- Response Types ----------

export interface SpendingBreakdown {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  totalCount: number;
  percentage: number;
}

export interface VisitFrequency {
  dayOfWeek: number;
  dayLabel: string;
  count: number;
  percentage: number;
}

export interface PreferredStylist {
  staffId: string;
  staffName: string;
  visitCount: number;
  lastVisitAt: string | null;
}

export type SpendingTrend = 'increasing' | 'decreasing' | 'stable';

export interface ServicePreference {
  serviceItemId: string;
  serviceName: string;
  categoryId: string;
  categoryName: string;
  count: number;
  totalAmount: number;
}

export interface MemberProfile {
  memberId: string;
  memberName: string;
  membershipDuration: number; // days
  totalVisits: number;
  totalSpent: number;
  averageSpendingPerVisit: number;
  spendingBreakdown: SpendingBreakdown[];
  visitFrequency: VisitFrequency[];
  preferredStylist: PreferredStylist | null;
  spendingTrend: SpendingTrend;
  servicePreferences: ServicePreference[];
  loyaltyScore: number;
}

export interface Recommendation {
  type: 'service' | 'recharge' | 'comeback';
  title: string;
  description: string;
  serviceItemId?: string;
  serviceName?: string;
  suggestedAmount?: number;
  priority: number;
}

export interface MonthlySpending {
  month: string;
  amount: number;
  count: number;
}

export interface ConsumptionChart {
  monthlySpending: MonthlySpending[];
  serviceTypeDistribution: SpendingBreakdown[];
  visitFrequencyByDay: VisitFrequency[];
  avgMemberSpending: number;
  memberSpending: number;
}

// ---------- Service ----------

const DAY_LABELS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

@Injectable()
export class MemberProfileService {
  constructor(private prisma: PrismaService) {}

  async getProfile(memberId: string, shopId: string): Promise<MemberProfile> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const membershipDuration = Math.floor(
      (Date.now() - member.createdAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    const settledOrders = await this.prisma.order.findMany({
      where: {
        memberId,
        shopId,
        status: 'SETTLED',
      },
      select: {
        id: true,
        payableAmount: true,
        createdAt: true,
        settledAt: true,
        items: {
          include: {
            serviceItem: {
              include: { category: true },
            },
            staff: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const totalVisits = settledOrders.length;
    const totalSpent = settledOrders.reduce((sum, o) => sum + o.payableAmount, 0);
    const averageSpendingPerVisit = totalVisits > 0 ? Math.round(totalSpent / totalVisits) : 0;

    const spendingBreakdown = this.computeSpendingBreakdown(settledOrders);
    const visitFrequency = this.computeVisitFrequency(settledOrders);
    const preferredStylist = this.computePreferredStylist(settledOrders);
    const spendingTrend = this.computeSpendingTrend(settledOrders);
    const servicePreferences = this.computeServicePreferences(settledOrders);
    const loyaltyScore = this.computeLoyaltyScore(
      totalVisits,
      membershipDuration,
      settledOrders,
    );

    return {
      memberId: member.id,
      memberName: member.name,
      membershipDuration,
      totalVisits,
      totalSpent,
      averageSpendingPerVisit,
      spendingBreakdown,
      visitFrequency,
      preferredStylist,
      spendingTrend,
      servicePreferences,
      loyaltyScore,
    };
  }

  async getRecommendations(
    memberId: string,
    shopId: string,
  ): Promise<Recommendation[]> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const recommendations: Recommendation[] = [];

    const settledOrders = await this.prisma.order.findMany({
      where: { memberId, shopId, status: 'SETTLED' },
      select: {
        payableAmount: true,
        createdAt: true,
        items: {
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const categoriesUsed = new Set<string>();
    const serviceCountMap = new Map<string, { name: string; count: number; categoryId: string }>();

    for (const order of settledOrders) {
      for (const item of order.items) {
        const cat = item.serviceItem.category;
        if (cat) categoriesUsed.add(cat.id);
        const key = item.serviceItemId;
        const existing = serviceCountMap.get(key);
        if (existing) {
          existing.count += item.quantity;
        } else {
          serviceCountMap.set(key, {
            name: item.serviceName,
            count: item.quantity,
            categoryId: item.serviceItem.categoryId,
          });
        }
      }
    }

    const sortedServices = Array.from(serviceCountMap.entries()).sort(
      (a, b) => b[1].count - a[1].count,
    );

    // Rule 1: Come-back offer
    const lastVisitAt = member.lastVisitAt;
    if (lastVisitAt) {
      const daysSinceLastVisit = Math.floor(
        (Date.now() - lastVisitAt.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLastVisit >= 60 && sortedServices.length > 0) {
        const topService = sortedServices[0];
        recommendations.push({
          type: 'comeback',
          title: '好久不见，欢迎回来',
          description: `您已 ${daysSinceLastVisit} 天未到店，推荐您体验熟悉的「${topService[1].name}」`,
          serviceItemId: topService[0],
          serviceName: topService[1].name,
          priority: 100,
        });
      } else if (daysSinceLastVisit >= 30 && daysSinceLastVisit < 60 && sortedServices.length > 0) {
        recommendations.push({
          type: 'comeback',
          title: '温馨提示',
          description: `您已 ${daysSinceLastVisit} 天未到店，做个护理放松一下吧`,
          priority: 80,
        });
      }
    }

    // Rule 2: Cross-sell different service category
    const allCategories = await this.prisma.serviceCategory.findMany({
      where: { shopId, isActive: true },
      include: {
        items: {
          where: { isActive: true },
          select: { id: true, name: true, price: true },
          take: 1,
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    for (const category of allCategories) {
      if (!categoriesUsed.has(category.id) && category.items.length > 0) {
        const item = category.items[0];
        recommendations.push({
          type: 'service',
          title: `尝试「${category.name}」`,
          description: `您还未体验过${category.name}类服务，推荐试试「${item.name}」`,
          serviceItemId: item.id,
          serviceName: item.name,
          priority: 60,
        });
        break; // Only suggest one new category
      }
    }

    // Rule 3: Premium upsell based on spending trend
    if (settledOrders.length >= 3) {
      const recentSpending = settledOrders
        .slice(0, 3)
        .reduce((sum, o) => sum + o.payableAmount, 0);
      const avgRecent = recentSpending / 3;
      const olderOrders = settledOrders.slice(3);
      if (olderOrders.length > 0) {
        const olderAvg =
          olderOrders.reduce((sum, o) => sum + o.payableAmount, 0) / olderOrders.length;
        if (avgRecent > olderAvg * 1.2) {
          // Spending increasing - suggest premium
          const premiumItems = await this.prisma.serviceItem.findMany({
            where: {
              isActive: true,
              price: { gt: avgRecent },
              category: { shopId },
            },
            include: { category: true },
            orderBy: { price: 'asc' },
            take: 1,
          });
          if (premiumItems.length > 0) {
            recommendations.push({
              type: 'service',
              title: '品质升级推荐',
              description: `您最近的消费有所提升，推荐体验更高端的「${premiumItems[0].name}」`,
              serviceItemId: premiumItems[0].id,
              serviceName: premiumItems[0].name,
              priority: 50,
            });
          }
        }
      }
    }

    // Rule 4: Recharge recommendation
    const totalBalance = member.principalBalance + member.giftBalance;
    const avgSpendingPerVisit =
      settledOrders.length > 0
        ? settledOrders.reduce((sum, o) => sum + o.payableAmount, 0) / settledOrders.length
        : 0;

    if (totalBalance < avgSpendingPerVisit * 2) {
      const suggestedAmount = Math.ceil(avgSpendingPerVisit * 5 / 100) * 100; // Round to nearest 100 cents
      const rechargePlans = await this.prisma.rechargePlan.findMany({
        where: { shopId, isActive: true },
        orderBy: { amount: 'asc' },
      });

      // Find the plan closest to suggested amount
      let bestPlan = rechargePlans.length > 0 ? rechargePlans[0] : null;
      for (const plan of rechargePlans) {
        if (plan.amount >= suggestedAmount) {
          bestPlan = plan;
          break;
        }
        bestPlan = plan;
      }

      recommendations.push({
        type: 'recharge',
        title: '余额不足提醒',
        description: bestPlan
          ? `推荐充值「${bestPlan.name}」，到账 ${((bestPlan.amount + bestPlan.giftAmount) / 100).toFixed(0)} 元`
          : `建议充值 ${Math.max(Math.round(suggestedAmount / 100), 100)} 元，保障后续消费`,
        suggestedAmount: bestPlan ? bestPlan.amount : Math.max(suggestedAmount, 10000),
        priority: 90,
      });
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  async getConsumptionChart(
    memberId: string,
    shopId: string,
    months: number = 12,
  ): Promise<ConsumptionChart> {
    const member = await this.prisma.member.findFirst({
      where: { id: memberId, shopId },
    });

    if (!member) {
      throw new NotFoundException('会员不存在');
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);

    const settledOrders = await this.prisma.order.findMany({
      where: {
        memberId,
        shopId,
        status: 'SETTLED',
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        payableAmount: true,
        createdAt: true,
        items: {
          include: {
            serviceItem: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Monthly spending
    const monthlyMap = new Map<string, { amount: number; count: number }>();
    const current = new Date(startDate);
    while (current <= endDate) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      monthlyMap.set(key, { amount: 0, count: 0 });
      current.setMonth(current.getMonth() + 1);
    }

    for (const order of settledOrders) {
      const key = `${order.createdAt.getFullYear()}-${String(order.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const entry = monthlyMap.get(key);
      if (entry) {
        entry.amount += order.payableAmount;
        entry.count += 1;
      }
    }

    const monthlySpending: MonthlySpending[] = Array.from(monthlyMap.entries()).map(
      ([month, data]) => ({ month, ...data }),
    );

    // Service type distribution
    const serviceTypeDistribution = this.computeSpendingBreakdown(settledOrders);

    // Visit frequency by day of week
    const visitFrequencyByDay = this.computeVisitFrequency(settledOrders);

    // Shop average spending
    const shopAvgResult = await this.prisma.order.aggregate({
      where: {
        shopId,
        status: 'SETTLED',
        createdAt: { gte: startDate, lte: endDate },
      },
      _avg: { payableAmount: true },
    });

    const memberSpending =
      settledOrders.length > 0
        ? Math.round(settledOrders.reduce((s, o) => s + o.payableAmount, 0) / settledOrders.length)
        : 0;

    return {
      monthlySpending,
      serviceTypeDistribution,
      visitFrequencyByDay,
      avgMemberSpending: Math.round(shopAvgResult._avg.payableAmount ?? 0),
      memberSpending,
    };
  }

  // ---------- Private Helpers ----------

  private computeSpendingBreakdown(
    orders: Array<{
      payableAmount: number;
      items: Array<{
        finalPrice: number;
        quantity: number;
        serviceItem: { category: { id: string; name: string } | null };
      }>;
    }>,
  ): SpendingBreakdown[] {
    const categoryMap = new Map<
      string,
      { categoryName: string; totalAmount: number; totalCount: number }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const cat = item.serviceItem.category;
        if (!cat) continue;

        const existing = categoryMap.get(cat.id);
        if (existing) {
          existing.totalAmount += item.finalPrice;
          existing.totalCount += item.quantity;
        } else {
          categoryMap.set(cat.id, {
            categoryName: cat.name,
            totalAmount: item.finalPrice,
            totalCount: item.quantity,
          });
        }
      }
    }

    const totalAmount = Array.from(categoryMap.values()).reduce(
      (sum, v) => sum + v.totalAmount,
      0,
    );

    return Array.from(categoryMap.entries())
      .map(([categoryId, data]) => ({
        categoryId,
        categoryName: data.categoryName,
        totalAmount: data.totalAmount,
        totalCount: data.totalCount,
        percentage: totalAmount > 0 ? Math.round((data.totalAmount / totalAmount) * 100) : 0,
      }))
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  private computeVisitFrequency(
    orders: Array<{ createdAt: Date }>,
  ): VisitFrequency[] {
    const dayMap = new Map<number, number>();
    for (let i = 0; i < 7; i++) dayMap.set(i, 0);

    for (const order of orders) {
      const dow = order.createdAt.getDay();
      dayMap.set(dow, (dayMap.get(dow) ?? 0) + 1);
    }

    const total = orders.length || 1;

    return Array.from(dayMap.entries())
      .map(([dayOfWeek, count]) => ({
        dayOfWeek,
        dayLabel: DAY_LABELS[dayOfWeek],
        count,
        percentage: Math.round((count / total) * 100),
      }))
      .sort((a, b) => a.dayOfWeek - b.dayOfWeek);
  }

  private computePreferredStylist(
    orders: Array<{
      items: Array<{
        staff: { id: string; name: string };
      }>;
      settledAt: Date | null;
      createdAt: Date;
    }>,
  ): PreferredStylist | null {
    const stylistMap = new Map<
      string,
      { staffName: string; visitCount: number; lastVisitAt: Date }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const staff = item.staff;
        const existing = stylistMap.get(staff.id);
        const visitDate = order.settledAt ?? order.createdAt;
        if (existing) {
          existing.visitCount += 1;
          if (visitDate > existing.lastVisitAt) {
            existing.lastVisitAt = visitDate;
          }
        } else {
          stylistMap.set(staff.id, {
            staffName: staff.name,
            visitCount: 1,
            lastVisitAt: visitDate,
          });
        }
      }
    }

    const sorted = Array.from(stylistMap.entries()).sort(
      (a, b) => b[1].visitCount - a[1].visitCount,
    );

    if (sorted.length === 0) return null;

    const [staffId, data] = sorted[0];
    return {
      staffId,
      staffName: data.staffName,
      visitCount: data.visitCount,
      lastVisitAt: data.lastVisitAt.toISOString(),
    };
  }

  private computeSpendingTrend(
    orders: Array<{ payableAmount: number; createdAt: Date }>,
  ): SpendingTrend {
    if (orders.length < 3) return 'stable';

    const half = Math.floor(orders.length / 2);
    const olderOrders = orders.slice(0, half);
    const recentOrders = orders.slice(half);

    const olderAvg = olderOrders.reduce((s, o) => s + o.payableAmount, 0) / olderOrders.length;
    const recentAvg = recentOrders.reduce((s, o) => s + o.payableAmount, 0) / recentOrders.length;

    if (olderAvg === 0) return 'stable';
    const changeRate = (recentAvg - olderAvg) / olderAvg;

    if (changeRate > 0.15) return 'increasing';
    if (changeRate < -0.15) return 'decreasing';
    return 'stable';
  }

  private computeServicePreferences(
    orders: Array<{
      items: Array<{
        serviceItemId: string;
        serviceName: string;
        finalPrice: number;
        quantity: number;
        serviceItem: { categoryId: string; category: { id: string; name: string } | null };
      }>;
    }>,
  ): ServicePreference[] {
    const serviceMap = new Map<
      string,
      {
        serviceName: string;
        categoryId: string;
        categoryName: string;
        count: number;
        totalAmount: number;
      }
    >();

    for (const order of orders) {
      for (const item of order.items) {
        const existing = serviceMap.get(item.serviceItemId);
        if (existing) {
          existing.count += item.quantity;
          existing.totalAmount += item.finalPrice;
        } else {
          serviceMap.set(item.serviceItemId, {
            serviceName: item.serviceName,
            categoryId: item.serviceItem.categoryId,
            categoryName: item.serviceItem.category?.name ?? '其他',
            count: item.quantity,
            totalAmount: item.finalPrice,
          });
        }
      }
    }

    return Array.from(serviceMap.entries())
      .map(([serviceItemId, data]) => ({
        serviceItemId,
        ...data,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private computeLoyaltyScore(
    totalVisits: number,
    membershipDuration: number,
    orders: Array<{ createdAt: Date }>,
  ): number {
    if (totalVisits === 0) return 0;

    // Visit frequency score (0-40 points)
    const visitsPerMonth =
      membershipDuration > 0 ? (totalVisits / membershipDuration) * 30 : 0;
    const frequencyScore = Math.min(40, Math.round(visitsPerMonth * 8));

    // Recency score (0-30 points)
    if (orders.length === 0) return frequencyScore;
    const lastOrderDate = orders[orders.length - 1].createdAt;
    const daysSinceLastVisit = Math.floor(
      (Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    let recencyScore = 30;
    if (daysSinceLastVisit > 90) recencyScore = 5;
    else if (daysSinceLastVisit > 60) recencyScore = 10;
    else if (daysSinceLastVisit > 30) recencyScore = 20;

    // Consistency score (0-30 points) - based on how regular the visits are
    let consistencyScore = 0;
    if (orders.length >= 2) {
      const intervals: number[] = [];
      for (let i = 1; i < orders.length; i++) {
        const diff = Math.floor(
          (orders[i].createdAt.getTime() - orders[i - 1].createdAt.getTime()) /
            (1000 * 60 * 60 * 24),
        );
        intervals.push(diff);
      }
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const variance =
        intervals.reduce((s, v) => s + Math.pow(v - avgInterval, 2), 0) / intervals.length;
      const stdDev = Math.sqrt(variance);

      // Lower standard deviation = more consistent = higher score
      const cv = avgInterval > 0 ? stdDev / avgInterval : 1;
      consistencyScore = Math.min(30, Math.round((1 - Math.min(cv, 1)) * 30));
    }

    return Math.min(100, frequencyScore + recencyScore + consistencyScore);
  }
}
