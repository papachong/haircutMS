import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationScheduler } from './notification.scheduler';

@Module({
  imports: [PrismaModule, DashboardModule],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationScheduler],
  exports: [NotificationService],
})
export class NotificationModule {}
