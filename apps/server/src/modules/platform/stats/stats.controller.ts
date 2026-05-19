import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatsService, PlatformStats } from './stats.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

@ApiTags('平台-统计')
@ApiBearerAuth()
@Controller('platform/stats')
@UseGuards(PlatformJwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: '获取平台统计数据' })
  @ApiResponse({ status: 200, description: '成功获取平台统计数据' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getStats(): Promise<PlatformStats> {
    return this.statsService.getStats();
  }
}
