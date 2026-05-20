import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MemberLevelService } from './member-level.service';
import { CurrentShop } from '../../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import {
  CreateMemberLevelDto,
  UpdateMemberLevelDto,
  BatchSortDto,
} from './dto/member-level.dto';

@ApiTags('会员等级')
@ApiBearerAuth()
@Controller('api/v1/member-levels')
export class MemberLevelController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  @Get()
  @ApiOperation({ summary: '获取所有会员等级' })
  @ApiResponse({ status: 200, description: '成功获取会员等级列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@CurrentShop() shopId: string) {
    return this.memberLevelService.findAll(shopId);
  }

  @Post()
  @ApiOperation({ summary: '创建会员等级' })
  @ApiResponse({ status: 201, description: '会员等级创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateMemberLevelDto,
  ) {
    return this.memberLevelService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch('sort')
  @ApiOperation({ summary: '批量排序会员等级' })
  @ApiResponse({ status: 200, description: '排序成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async batchSort(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: BatchSortDto,
  ) {
    return this.memberLevelService.batchSort(shopId, dto.items, operatorId, req.ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新会员等级' })
  @ApiResponse({ status: 200, description: '会员等级更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '等级不存在' })
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateMemberLevelDto,
  ) {
    return this.memberLevelService.update(id, shopId, dto, operatorId, req.ip);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除会员等级' })
  @ApiResponse({ status: 200, description: '会员等级删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '等级不存在' })
  async remove(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.memberLevelService.remove(id, shopId, operatorId, req.ip);
  }
}
