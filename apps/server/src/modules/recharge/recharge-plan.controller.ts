import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { RechargePlanService } from './recharge-plan.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateRechargePlanDto,
  UpdateRechargePlanDto,
  QueryRechargePlanDto,
} from './dto/recharge-plan.dto';

@ApiTags('充值方案')
@ApiBearerAuth()
@Controller('api/v1/recharge-plans')
export class RechargePlanController {
  constructor(private readonly rechargePlanService: RechargePlanService) {}

  @Get()
  @ApiOperation({ summary: '获取充值方案列表' })
  @ApiResponse({ status: 200, description: '成功获取充值方案列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryRechargePlanDto,
  ) {
    return this.rechargePlanService.findAll(shopId, query.activeOnly);
  }

  @Post()
  @ApiOperation({ summary: '创建充值方案' })
  @ApiResponse({ status: 201, description: '充值方案创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateRechargePlanDto,
  ) {
    return this.rechargePlanService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新充值方案' })
  @ApiResponse({ status: 200, description: '充值方案更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '充值方案不存在' })
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateRechargePlanDto,
  ) {
    return this.rechargePlanService.update(id, shopId, dto, operatorId, req.ip);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '切换充值方案启用/禁用状态' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '充值方案不存在' })
  async toggle(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.rechargePlanService.toggle(id, shopId, operatorId, req.ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除充值方案' })
  @ApiResponse({ status: 200, description: '充值方案删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '充值方案不存在' })
  async remove(@Param('id') id: string, @CurrentShop() shopId: string) {
    return this.rechargePlanService.remove(id, shopId);
  }
}
