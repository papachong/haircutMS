import { Controller, Get, UseGuards } from '@nestjs/common';
import { StatsService, PlatformStats } from './stats.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

@Controller('platform/stats')
@UseGuards(PlatformJwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getStats(): Promise<PlatformStats> {
    return this.statsService.getStats();
  }
}