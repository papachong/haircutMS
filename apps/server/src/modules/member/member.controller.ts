import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { MemberService } from './member.service';
import { RechargeOperationService } from './recharge-operation.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateMemberDto,
  UpdateMemberDto,
  QueryMemberDto,
} from './dto/member.dto';
import { RechargeMemberDto, RechargeHistoryQueryDto } from './dto/recharge.dto';

@Controller('api/v1/members')
export class MemberController {
  constructor(
    private memberService: MemberService,
    private rechargeOperationService: RechargeOperationService,
  ) {}

  @Get()
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberDto,
  ) {
    return this.memberService.findAll(shopId, query);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.memberService.findById(id, shopId);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create(shopId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(id, shopId, dto);
  }

  @Post(':id/recharge')
  async recharge(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('id') operatorId: string,
    @CurrentUser('ip') ip: string,
    @Body() dto: RechargeMemberDto,
  ) {
    return this.rechargeOperationService.recharge(
      memberId,
      shopId,
      operatorId,
      ip,
      dto,
    );
  }

  @Get(':id/recharge-history')
  async getRechargeHistory(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
    @Query() query: RechargeHistoryQueryDto,
  ) {
    return this.rechargeOperationService.getRechargeHistory(
      memberId,
      shopId,
      query,
    );
  }
}
