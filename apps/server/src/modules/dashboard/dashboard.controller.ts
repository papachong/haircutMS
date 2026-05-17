import { Controller, Get, Query } from '@nestjs/common';
import {
  DashboardService,
  TimeRange,
  DashboardMetrics,
  DashboardTrendsResponse,
  RevenueBreakdown,
  ServiceItemRanking,
} from './dashboard.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';

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
    @Query() query: QueryDashboardDto & { limit?: number },
  ): Promise<ServiceItemRanking[]> {
    const { timeRange = TimeRange.TODAY, startDate, endDate, limit = 10 } = query;

    if (timeRange === TimeRange.CUSTOM && (!startDate || !endDate)) {
      throw new Error('startDate and endDate are required for custom time range');
    }

    return this.dashboardService.getServiceItemRanking(
      shopId,
      timeRange,
      startDate,
      endDate,
      limit,
    );
  }
}