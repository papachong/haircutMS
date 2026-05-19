import { Controller, Get, Post, Patch, Delete, Body, Param } from '@nestjs/common';
import { MemberLevelService } from './member-level.service';
import { CurrentShop } from '../../../common/decorators/current-shop.decorator';
import {
  CreateMemberLevelDto,
  UpdateMemberLevelDto,
  BatchSortDto,
} from './dto/member-level.dto';

@Controller('api/v1/member-levels')
export class MemberLevelController {
  constructor(private readonly memberLevelService: MemberLevelService) {}

  @Get()
  async findAll(@CurrentShop() shopId: string) {
    return this.memberLevelService.findAll(shopId);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @Body() dto: CreateMemberLevelDto,
  ) {
    return this.memberLevelService.create(shopId, dto);
  }

  @Patch('sort')
  async batchSort(
    @CurrentShop() shopId: string,
    @Body() dto: BatchSortDto,
  ) {
    return this.memberLevelService.batchSort(shopId, dto.items);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateMemberLevelDto,
  ) {
    return this.memberLevelService.update(id, shopId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentShop() shopId: string) {
    return this.memberLevelService.remove(id, shopId);
  }
}
