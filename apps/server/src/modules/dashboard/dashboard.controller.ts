import { Controller, Get, Query } from '@nestjs/common';
import {
  DashboardService,
  TimeRange,
  DashboardMetrics,
  DashboardTrendsResponse,
  MemberLevelDistribution,
  MemberConsumptionTrendsResponse,
  DormantMembersStats,
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
}