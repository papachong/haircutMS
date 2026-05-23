import { Controller, Get, Post, Patch, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

@ApiTags('会员管理')
@ApiBearerAuth()
@Controller('members')
export class MemberController {
  constructor(
    private memberService: MemberService,
    private rechargeOperationService: RechargeOperationService,
  ) {}

  @Get()
  @ApiOperation({ summary: '获取会员列表' })
  @ApiResponse({ status: 200, description: '成功获取会员列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberDto,
  ) {
    return this.memberService.findAll(shopId, query);
  }

  @Get('search/keyword')
  @ApiOperation({ summary: '按关键词搜索会员' })
  @ApiResponse({ status: 200, description: '成功返回搜索结果' })
  @ApiResponse({ status: 401, description: '未授权' })
  async searchByKeyword(
    @Query('keyword') keyword: string,
    @CurrentShop() shopId: string,
  ) {
    return this.memberService.searchByKeyword(shopId, keyword);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取会员详情' })
  @ApiResponse({ status: 200, description: '成功获取会员详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '会员不存在' })
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.memberService.findById(id, shopId);
  }

  @Post()
  @ApiOperation({ summary: '创建会员' })
  @ApiResponse({ status: 201, description: '会员创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateMemberDto,
  ) {
    return this.memberService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新会员信息' })
  @ApiResponse({ status: 200, description: '会员信息更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '会员不存在' })
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
  @ApiOperation({ summary: '会员充值' })
  @ApiResponse({ status: 200, description: '充值成功' })
  @ApiResponse({ status: 400, description: '参数错误或充值失败' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '会员不存在' })
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
  @ApiOperation({ summary: '获取会员充值记录' })
  @ApiResponse({ status: 200, description: '成功获取充值记录' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '会员不存在' })
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
