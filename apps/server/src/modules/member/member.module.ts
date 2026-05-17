import { Module } from '@nestjs/common';
import { MemberController } from './member.controller';
import { MemberService } from './member.service';
import { MemberLevelService } from './levels/member-level.service';
import { TagModule } from './tags/tag.module';

@Module({
  imports: [TagModule],
  controllers: [MemberController],
  providers: [MemberService, MemberLevelService],
  exports: [MemberService],
})
export class MemberModule {}