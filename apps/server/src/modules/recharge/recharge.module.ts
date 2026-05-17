import { Module } from '@nestjs/common';
import { RechargePlanController } from './recharge-plan.controller';
import { RechargePlanService } from './recharge-plan.service';

@Module({
  controllers: [RechargePlanController],
  providers: [RechargePlanService],
  exports: [RechargePlanService],
})
export class RechargeModule {}
