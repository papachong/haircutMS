import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

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
    @Body() body: { name: string; phone: string; password: string; role?: string; avatar?: string },
  ) {
    return this.staffService.create(shopId, body);
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
  ) {
    return this.staffService.toggle(id, shopId);
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
