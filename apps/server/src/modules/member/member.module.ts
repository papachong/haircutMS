import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { RechargeOperationService } from './recharge-operation.service';
import { MemberLevelService } from './levels/member-level.service';
import { TagModule } from './tags/tag.module';
import { RechargeModule } from '../recharge/recharge.module';

@Module({
  imports: [TagModule, RechargeModule],
  controllers: [MemberController],
  providers: [MemberService, RechargeOperationService, MemberLevelService],
  exports: [MemberService],
})
export class MemberModule {}