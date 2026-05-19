import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { StaffService } from './staff.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
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
    @Body() dto: CreateStaffDto,
  ) {
    return this.staffService.create(shopId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(id, shopId, dto);
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
    @Body() dto: ResetPasswordDto,
  ) {
    return this.staffService.resetPassword(id, shopId, dto.password);
  }
}
