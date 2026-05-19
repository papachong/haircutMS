import { Controller, Get, Query } from '@nestjs/common';
import {
  DashboardService,
  TimeRange,
  DashboardMetrics,
  DashboardTrendsResponse,
  MemberLevelDistribution,
  MemberConsumptionTrendsResponse,
  DormantMembersStats,
  DormantMembersDetail,
  DailyConsumptionResponse,
  RevenueBreakdown,
  ServiceItemRanking,
} from './dashboard.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class QueryDashboardDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class QueryMemberAnalyticsDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

  @IsOptional()
  dormantDays?: string;
}

export class QueryRankingDto extends QueryDashboardDto {
  @IsOptional()
  limit?: string;
}

@Controller('api/v1/dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  async getMetrics(
    @CurrentShop() shopId: string,
    @Query() query: QueryDashboardDto,
  ): Promise<DashboardMetrics> {
    const { timeRange = TimeRange.TODAY, startDate, endDate } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getMetrics(
      shopId,
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('trends')
  async getTrends(
    @CurrentShop() shopId: string,
    @Query() query: QueryDashboardDto,
  ): Promise<DashboardTrendsResponse> {
    const { timeRange = TimeRange.TODAY, startDate, endDate } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getTrends(
      shopId,
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('members/level-distribution')
  async getMemberLevelDistribution(
    @CurrentShop() shopId: string,
  ): Promise<MemberLevelDistribution[]> {
    return this.dashboardService.getMemberLevelDistribution(shopId);
  }

  @Get('members/consumption-trends')
  async getMemberConsumptionTrends(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberAnalyticsDto,
  ): Promise<MemberConsumptionTrendsResponse> {
    const { timeRange = TimeRange.MONTH, startDate, endDate } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getMemberConsumptionTrends(
      shopId,
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('members/dormant-stats')
  async getDormantMembersStats(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberAnalyticsDto,
  ): Promise<DormantMembersStats> {
    const { dormantDays } = query;
    const days = dormantDays ? parseInt(dormantDays, 10) : 90;
    return this.dashboardService.getDormantMembersStats(shopId, days);
  }

  @Get('members/dormant-detail')
  async getDormantMembersDetail(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberAnalyticsDto,
  ): Promise<DormantMembersDetail> {
    const { dormantDays } = query;
    const days = dormantDays ? parseInt(dormantDays, 10) : 90;
    return this.dashboardService.getDormantMembersDetail(shopId, days);
  }

  @Get('members/daily-consumption')
  async getDailyConsumptionTrends(
    @CurrentShop() shopId: string,
    @Query('days') days?: string,
  ): Promise<DailyConsumptionResponse> {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getDailyConsumptionTrends(shopId, parsedDays);
  }

  @Get('revenue-breakdown')
  async getRevenueBreakdown(
    @CurrentShop() shopId: string,
    @Query() query: QueryDashboardDto,
  ): Promise<RevenueBreakdown> {
    const { timeRange = TimeRange.TODAY, startDate, endDate } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getRevenueBreakdown(
      shopId,
      timeRange,
      startDate,
      endDate,
    );
  }

  @Get('service-ranking')
  async getServiceRanking(
    @CurrentShop() shopId: string,
    @Query() query: QueryRankingDto,
  ): Promise<ServiceItemRanking[]> {
    const { timeRange = TimeRange.TODAY, startDate, endDate, limit } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getServiceRanking(
      shopId,
      timeRange,
      startDate,
      endDate,
      limit ? parseInt(limit, 10) : 10,
    );
  }
}