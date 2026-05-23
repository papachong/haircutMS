import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiPropertyOptional({ description: '时间范围', enum: TimeRange, example: 'TODAY' })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional({ description: '开始日期（timeRange 为 CUSTOM 时必填）', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（timeRange 为 CUSTOM 时必填）', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class QueryMemberAnalyticsDto {
  @ApiPropertyOptional({ description: '时间范围', enum: TimeRange, example: 'MONTH' })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange;

  @ApiPropertyOptional({ description: '开始日期（timeRange 为 CUSTOM 时必填）', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期（timeRange 为 CUSTOM 时必填）', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ description: '沉睡天数阈值', example: '90' })
  @IsOptional()
  dormantDays?: string;
}

export class QueryRankingDto extends QueryDashboardDto {
  @ApiPropertyOptional({ description: '返回数量限制', example: '10' })
  @IsOptional()
  limit?: string;
}

@ApiTags('数据面板')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('metrics')
  @ApiOperation({ summary: '获取经营指标概览' })
  @ApiResponse({ status: 200, description: '成功获取经营指标' })
  @ApiResponse({ status: 400, description: '参数错误（CUSTOM 时间范围需要 startDate 和 endDate）' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取经营趋势数据' })
  @ApiResponse({ status: 200, description: '成功获取趋势数据' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取会员等级分布' })
  @ApiResponse({ status: 200, description: '成功获取会员等级分布' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getMemberLevelDistribution(
    @CurrentShop() shopId: string,
  ): Promise<MemberLevelDistribution[]> {
    return this.dashboardService.getMemberLevelDistribution(shopId);
  }

  @Get('members/consumption-trends')
  @ApiOperation({ summary: '获取会员消费趋势' })
  @ApiResponse({ status: 200, description: '成功获取消费趋势' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取沉睡会员统计' })
  @ApiResponse({ status: 200, description: '成功获取沉睡会员统计' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getDormantMembersStats(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberAnalyticsDto,
  ): Promise<DormantMembersStats> {
    const { dormantDays } = query;
    const days = dormantDays ? parseInt(dormantDays, 10) : 90;
    return this.dashboardService.getDormantMembersStats(shopId, days);
  }

  @Get('members/dormant-detail')
  @ApiOperation({ summary: '获取沉睡会员详细数据' })
  @ApiResponse({ status: 200, description: '成功获取沉睡会员详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getDormantMembersDetail(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberAnalyticsDto,
  ): Promise<DormantMembersDetail> {
    const { dormantDays } = query;
    const days = dormantDays ? parseInt(dormantDays, 10) : 90;
    return this.dashboardService.getDormantMembersDetail(shopId, days);
  }

  @Get('members/daily-consumption')
  @ApiOperation({ summary: '获取每日消费趋势' })
  @ApiResponse({ status: 200, description: '成功获取每日消费趋势' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getDailyConsumptionTrends(
    @CurrentShop() shopId: string,
    @Query('days') days?: string,
  ): Promise<DailyConsumptionResponse> {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getDailyConsumptionTrends(shopId, parsedDays);
  }

  @Get('revenue-breakdown')
  @ApiOperation({ summary: '获取收入构成分析' })
  @ApiResponse({ status: 200, description: '成功获取收入构成数据' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取服务项目排行' })
  @ApiResponse({ status: 200, description: '成功获取服务项目排行' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
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
