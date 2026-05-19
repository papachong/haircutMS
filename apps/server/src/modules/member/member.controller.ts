import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
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

  @Get('search/keyword')
  async searchByKeyword(
    @Query('keyword') keyword: string,
    @CurrentShop() shopId: string,
  ) {
    return this.memberService.searchByKeyword(shopId, keyword);
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
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.memberService.update(id, shopId, dto, operatorId, req.ip);
  }

  @Post(':id/recharge')
  async recharge(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: RechargeMemberDto,
  ) {
    return this.rechargeOperationService.recharge(
      memberId,
      shopId,
      operatorId,
      req.ip ?? '',
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
