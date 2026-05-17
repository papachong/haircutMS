import { Module } from '@nestjs/common';
import { StaffStatsController } from './staff-stats.controller';
import { StaffStatsService } from './staff-stats.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StaffStatsController],
  providers: [StaffStatsService],
  exports: [StaffStatsService],
})
export class StaffStatsModule {}