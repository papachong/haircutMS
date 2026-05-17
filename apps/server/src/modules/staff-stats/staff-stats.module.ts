import { Module } from '@nestjs/common';
import { StaffStatsController } from './staff-stats.controller';
import { StaffStatsService } from './staff-stats.service';
import { PrismaModule } from '../../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StaffStatsController],
  providers: [StaffStatsService],
  exports: [StaffStatsService],
})
export class StaffStatsModule {}