import { Controller, Get, Post, Patch, Delete, Body, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { MemberLevelService } from './member-level.service';
import { CurrentShop } from '../../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
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
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateMemberLevelDto,
  ) {
    return this.memberLevelService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch('sort')
  async batchSort(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: BatchSortDto,
  ) {
    return this.memberLevelService.batchSort(shopId, dto.items, operatorId, req.ip);
  }

  @Patch(':id')
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
  async remove(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.memberLevelService.remove(id, shopId, operatorId, req.ip);
  }
}
