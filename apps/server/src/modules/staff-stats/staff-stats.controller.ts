import { Controller, Get, Param, Query } from '@nestjs/common';
import { StaffStatsService, StaffStats, ServiceTypeStat, PersonalServiceRecord, ServiceTrend } from './staff-stats.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/staff-stats')
export class StaffStatsController {
  constructor(private staffStatsService: StaffStatsService) {}

  /**
   * 获取店内所有员工统计数据（管理员用，支持日期筛选）
   */
  @Get()
  async getShopStats(
    @CurrentShop() shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StaffStats[]> {
    return this.staffStatsService.getShopStaffStats(shopId, startDate, endDate);
  }

  /**
   * 获取指定员工的详细统计数据
   */
  @Get('staff/:staffId')
  async getStaffDetail(
    @Param('staffId') staffId: string,
    @CurrentShop() shopId: string,
  ): Promise<StaffStats | null> {
    return this.staffStatsService.getStaffDetailStats(shopId, staffId);
  }

  /**
   * 获取当前员工的服务记录（发型师用）
   */
  @Get('my/records')
  async getMyRecords(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') staffId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.staffStatsService.getPersonalServiceRecords(
      shopId,
      staffId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      startDate,
      endDate,
    );
  }

  /**
   * 获取指定员工的服务记录（管理员用）
   */
  @Get('staff/:staffId/records')
  async getStaffRecords(
    @Param('staffId') staffId: string,
    @CurrentShop() shopId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.staffStatsService.getPersonalServiceRecords(
      shopId,
      staffId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      startDate,
      endDate,
    );
  }

  /**
   * 获取当前员工的统计摘要（发型师用，支持日期筛选）
   */
  @Get('my/summary')
  async getMySummary(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') staffId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StaffStats | null> {
    return this.staffStatsService.getPersonalStatsSummary(shopId, staffId, startDate, endDate);
  }

  /**
   * 获取当前员工的服务趋势（发型师用）
   */
  @Get('my/trends')
  async getMyTrends(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') staffId: string,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'week',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ServiceTrend[]> {
    return this.staffStatsService.getStaffServiceTrends(shopId, staffId, timeRange, startDate, endDate);
  }

  /**
   * 获取员工服务趋势
   */
  @Get('staff/:staffId/trends')
  async getStaffTrends(
    @Param('staffId') staffId: string,
    @CurrentShop() shopId: string,
    @Query('timeRange') timeRange: 'day' | 'week' | 'month' = 'week',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ServiceTrend[]> {
    return this.staffStatsService.getStaffServiceTrends(shopId, staffId, timeRange, startDate, endDate);
  }

  /**
   * 获取指定员工在指定时间范围内的统计摘要
   */
  @Get('staff/:staffId/summary')
  async getStaffSummaryWithDate(
    @Param('staffId') staffId: string,
    @CurrentShop() shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StaffStats | null> {
    return this.staffStatsService.getStaffDetailStatsWithDate(shopId, staffId, startDate, endDate);
  }
}