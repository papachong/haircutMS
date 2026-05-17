import { Controller, Get, Param, Query } from '@nestjs/common';
import { StaffStatsService } from './staff-stats.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('api/v1/staff-stats')
export class StaffStatsController {
  constructor(private readonly staffStatsService: StaffStatsService) {}

  /**
   * Get staff ranking by total service count (descending)
   * Stylists can only see their own stats
   */
  @Get('ranking')
  async getRanking(
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('staffId') staffId?: string,
    @CurrentUser('role') role?: string,
  ) {
    const ranking = await this.staffStatsService.getStaffRanking(
      shopId,
      staffId,
      role,
    );
    return { code: 0, data: ranking };
  }

  /**
   * Get detailed stats for a specific staff member
   * Includes service type distribution table
   */
  @Get('staff/:id')
  async getStaffDetail(
    @Param('id') id: string,
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('staffId') staffId?: string,
    @CurrentUser('role') role?: string,
  ) {
    const detail = await this.staffStatsService.getStaffDetail(
      id,
      shopId,
      staffId,
      role,
    );
    return { code: 0, data: detail };
  }

  /**
   * Get personal service records for a staff member
   * Used by stylists to view their recent work
   */
  @Get('personal')
  async getPersonalRecords(
    @CurrentUser('shopId') shopId: string,
    @CurrentUser('staffId') staffId: string,
    @CurrentUser('role') role?: string,
    @Query('limit') limit?: string,
  ) {
    const records = await this.staffStatsService.getPersonalServiceRecords(
      staffId,
      shopId,
      staffId,
      role,
      limit ? parseInt(limit, 10) : 50,
    );
    return { code: 0, data: records };
  }
}