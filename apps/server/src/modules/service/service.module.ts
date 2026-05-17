import { Module } from '@nestjs/common';
import { ServiceCategoryService } from './service-category.service';
import { ServiceItemService } from './service-item.service';
import { ServiceController } from './service.controller';

@Module({
  controllers: [ServiceController],
  providers: [ServiceCategoryService, ServiceItemService],
  exports: [ServiceCategoryService, ServiceItemService],
})
export class ServiceModule {}
