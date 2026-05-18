import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { PlatformLicenseController } from './platform-license.controller';
import { PlatformLicenseService } from './platform-license.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlatformLicenseController],
  providers: [PlatformLicenseService],
  exports: [PlatformLicenseService],
})
export class PlatformLicenseModule {}