import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StaffStatsService, StaffStats, ServiceTypeStat, PersonalServiceRecord, ServiceTrend } from './staff-stats.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('员工统计')
@ApiBearerAuth()
@Controller('staff-stats')
export class StaffStatsController {
  constructor(private staffStatsService: StaffStatsService) {}

  /**
   * 获取店内所有员工统计数据（管理员用，支持日期筛选）
   */
  @Get()
  @ApiOperation({ summary: '获取店内所有员工统计（管理员用）' })
  @ApiResponse({ status: 200, description: '成功获取员工统计数据' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取指定员工详细统计' })
  @ApiResponse({ status: 200, description: '成功获取员工详细统计' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '员工不存在' })
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
  @ApiOperation({ summary: '获取当前员工服务记录（发型师用）' })
  @ApiResponse({ status: 200, description: '成功获取服务记录' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取指定员工服务记录（管理员用）' })
  @ApiResponse({ status: 200, description: '成功获取服务记录' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取当前员工统计摘要（发型师用）' })
  @ApiResponse({ status: 200, description: '成功获取统计摘要' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取当前员工服务趋势（发型师用）' })
  @ApiResponse({ status: 200, description: '成功获取服务趋势' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['day', 'week', 'month'], description: '时间粒度' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取指定员工服务趋势' })
  @ApiResponse({ status: 200, description: '成功获取服务趋势' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['day', 'week', 'month'], description: '时间粒度' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
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
  @ApiOperation({ summary: '获取指定员工统计摘要（支持日期筛选）' })
  @ApiResponse({ status: 200, description: '成功获取统计摘要' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  async getStaffSummaryWithDate(
    @Param('staffId') staffId: string,
    @CurrentShop() shopId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<StaffStats | null> {
    return this.staffStatsService.getStaffDetailStatsWithDate(shopId, staffId, startDate, endDate);
  }
}
