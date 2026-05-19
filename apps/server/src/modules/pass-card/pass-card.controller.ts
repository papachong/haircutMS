import { Controller, Get, Post, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PassCardService } from './pass-card.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreatePassCardDto,
  QueryPassCardDto,
  UsePassCardDto,
} from './dto/pass-card.dto';

@ApiTags('次卡管理')
@ApiBearerAuth()
@Controller('api/v1/pass-cards')
export class PassCardController {
  constructor(private passCardService: PassCardService) {}

  @Get()
  @ApiOperation({ summary: '获取次卡列表' })
  @ApiResponse({ status: 200, description: '成功获取次卡列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryPassCardDto,
  ) {
    return this.passCardService.findAll(shopId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取次卡详情' })
  @ApiResponse({ status: 200, description: '成功获取次卡详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡不存在' })
  findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.findById(id, shopId);
  }

  @Get(':id/usages')
  @ApiOperation({ summary: '获取次卡使用记录' })
  @ApiResponse({ status: 200, description: '成功获取使用记录' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡不存在' })
  getUsages(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.passCardService.getUsages(id, shopId, page, pageSize);
  }

  @Post()
  @ApiOperation({ summary: '创建次卡' })
  @ApiResponse({ status: 201, description: '次卡创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: CreatePassCardDto,
  ) {
    return this.passCardService.create(shopId, {
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    }, operatorId, req.ip);
  }

  @Post(':id/use')
  @ApiOperation({ summary: '使用次卡（扣减一次）' })
  @ApiResponse({ status: 200, description: '使用成功' })
  @ApiResponse({ status: 400, description: '参数错误或次卡已用完/已过期' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡不存在' })
  async use(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: UsePassCardDto,
  ) {
    return this.passCardService.use(id, shopId, body.orderItemId, operatorId, req.ip);
  }

  @Post(':id/refund/:usageId')
  @ApiOperation({ summary: '退回次卡使用次数' })
  @ApiResponse({ status: 200, description: '退回成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡或使用记录不存在' })
  async refundUsage(
    @Param('id') id: string,
    @Param('usageId') usageId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.passCardService.refundUsage(id, usageId, shopId, operatorId, req.ip);
  }

  @Post(':id/deactivate')
  @ApiOperation({ summary: '停用次卡' })
  @ApiResponse({ status: 200, description: '停用成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡不存在' })
  async deactivate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.deactivate(id, shopId);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: '启用次卡' })
  @ApiResponse({ status: 200, description: '启用成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '次卡不存在' })
  async activate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.activate(id, shopId);
  }
}
