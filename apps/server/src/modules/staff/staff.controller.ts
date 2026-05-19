import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStaffDto, UpdateStaffDto, ResetPasswordDto } from './dto/staff.dto';

@ApiTags('员工管理')
@ApiBearerAuth()
@Controller('api/v1/staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  @ApiOperation({ summary: '获取员工列表' })
  @ApiResponse({ status: 200, description: '成功获取员工列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@CurrentShop() shopId: string) {
    return this.staffService.findAll(shopId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取员工详情' })
  @ApiResponse({ status: 200, description: '成功获取员工详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '员工不存在' })
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.staffService.findById(id, shopId);
  }

  @Post()
  @ApiOperation({ summary: '创建员工' })
  @ApiResponse({ status: 201, description: '员工创建成功' })
  @ApiResponse({ status: 400, description: '参数错误或超出授权人数限制' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新员工信息' })
  @ApiResponse({ status: 200, description: '员工信息更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '员工不存在' })
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, shopId, dto, operatorId, req.ip);
  }

  @Patch(':id/toggle')
  @ApiOperation({ summary: '切换员工启用/禁用状态' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '员工不存在' })
  async toggle(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.staffService.toggle(id, shopId, operatorId, req.ip);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: '重置员工密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '员工不存在' })
  async resetPassword(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: ResetPasswordDto,
  ) {
    return this.staffService.resetPassword(id, shopId, dto.password, operatorId, req.ip);
  }
}
