import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../common/prisma/prisma.module';
import { ShopManagementController } from './shop-management.controller';
import { ShopManagementService } from './shop-management.service';

@Module({
  imports: [PrismaModule],
  controllers: [ShopManagementController],
  providers: [ShopManagementService],
  exports: [ShopManagementService],
})
export class ShopManagementModule {}