import { Controller, Get, Post, Patch, Param, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { StaffService } from './staff.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

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
    @Body() body: { name: string; phone: string; password: string; role?: string; avatar?: string },
  ) {
    return this.staffService.create(shopId, body, operatorId, req.ip);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: { name?: string; phone?: string; role?: string; avatar?: string },
  ) {
    return this.staffService.update(id, shopId, body);
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
    @Body() body: { password: string },
  ) {
    return this.staffService.resetPassword(id, shopId, body.password);
  }
}
