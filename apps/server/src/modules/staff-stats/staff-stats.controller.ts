import { Controller, Get, Param, Query } from '@nestjs/common';
import { StaffStatsService, StaffStats, ServiceTypeStat, PersonalServiceRecord } from './staff-stats.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/staff-stats')
export class StaffStatsController {
  constructor(private staffStatsService: StaffStatsService) {}

  /**
   * 获取店内所有员工统计数据（管理员用）
   */
  @Get()
  async getShopStats(@CurrentShop() shopId: string): Promise<StaffStats[]> {
    return this.staffStatsService.getShopStaffStats(shopId);
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
  ) {
    return this.staffStatsService.getPersonalServiceRecords(
      shopId,
      staffId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  /**
   * 获取当前员工的统计摘要（发型师用）
   */
  @Get('my/summary')
  async getMySummary(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') staffId: string,
  ): Promise<StaffStats | null> {
    return this.staffStatsService.getPersonalStatsSummary(shopId, staffId);
  }
}