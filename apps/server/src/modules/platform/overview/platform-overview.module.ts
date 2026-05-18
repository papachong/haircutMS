import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PlatformOverviewController } from './platform-overview.controller';
import { PlatformOverviewService } from './platform-overview.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformOverviewController],
  providers: [PlatformOverviewService],
  exports: [PlatformOverviewService],
})
export class PlatformOverviewModule {}