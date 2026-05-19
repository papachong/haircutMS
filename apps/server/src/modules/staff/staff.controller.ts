import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { StaffService } from './staff.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateStaffDto, UpdateStaffDto, ResetPasswordDto } from './dto/staff.dto';

@Controller('api/v1/staff')
export class StaffController {
  constructor(private staffService: StaffService) {}

  @Get()
  async findAll(@CurrentShop() shopId: string) {
    return this.staffService.findAll(shopId);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.staffService.findById(id, shopId);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
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
  async toggle(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.staffService.toggle(id, shopId, operatorId, req.ip);
  }

  @Post(':id/reset-password')
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
