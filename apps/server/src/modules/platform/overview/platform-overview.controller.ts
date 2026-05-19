import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PlatformOverviewService } from './platform-overview.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

@ApiTags('平台-总览')
@ApiBearerAuth()
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
  @ApiOperation({ summary: '获取平台总览统计数据' })
  @ApiResponse({ status: 200, description: '成功获取平台总览数据' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取营收排名前 N 的店铺' })
  @ApiResponse({ status: 200, description: '成功获取营收排名数据' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量，默认 10' })
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
  @ApiOperation({ summary: '获取各店铺使用量统计' })
  @ApiResponse({ status: 200, description: '成功获取使用量统计' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '获取新增店铺趋势' })
  @ApiResponse({ status: 200, description: '成功获取新增店铺趋势' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'days', required: false, description: '统计天数，默认 30' })
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
  @ApiOperation({ summary: '获取营收趋势' })
  @ApiResponse({ status: 200, description: '成功获取营收趋势' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'days', required: false, description: '统计天数，默认 30' })
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
  @ApiOperation({ summary: '获取即将到期的授权列表' })
  @ApiResponse({ status: 200, description: '成功获取到期授权列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'days', required: false, description: '到期天数阈值，默认 15' })
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
