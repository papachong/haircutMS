import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PlatformOverviewService } from './platform-overview.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

@Controller('platform/overview')
@UseGuards(PlatformJwtAuthGuard)
export class PlatformOverviewController {
  constructor(
    private readonly platformOverviewService: PlatformOverviewService,
  ) {}

  /**
   * Get platform overview statistics
   */
  @Get()
  async getOverview() {
    const data =
      await this.platformOverviewService.getOverview();
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }

  /**
   * Get top shops by revenue
   */
  @Get('top-revenue')
  async getTopShopsByRevenue(@Query('limit') limit: string = '10') {
    const data = await this.platformOverviewService.getTopShopsByRevenue(
      parseInt(limit, 10) || 10,
    );
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }

  /**
   * Get usage statistics for all shops
   */
  @Get('shop-usage')
  async getShopUsageStats() {
    const data = await this.platformOverviewService.getShopUsageStats();
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }

  /**
   * Get new shops trend
   */
  @Get('trend/new-shops')
  async getNewShopsTrend(@Query('days') days: string = '30') {
    const data = await this.platformOverviewService.getNewShopsTrend(
      parseInt(days, 10) || 30,
    );
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }

  /**
   * Get revenue trend
   */
  @Get('trend/revenue')
  async getRevenueTrend(@Query('days') days: string = '30') {
    const data = await this.platformOverviewService.getRevenueTrend(
      parseInt(days, 10) || 30,
    );
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }

  /**
   * Get licenses expiring within 15 days
   */
  @Get('expiring-licenses')
  async getExpiringLicenses(@Query('days') days: string = '15') {
    const data = await this.platformOverviewService.getExpiringLicenses(
      parseInt(days, 10) || 15,
    );
    return {
      code: 0,
      data,
      message: 'Success',
    };
  }
}