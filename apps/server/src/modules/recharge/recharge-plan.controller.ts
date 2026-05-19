import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { RechargePlanService } from './recharge-plan.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import {
  CreateRechargePlanDto,
  UpdateRechargePlanDto,
  QueryRechargePlanDto,
} from './dto/recharge-plan.dto';

@Controller('api/v1/recharge-plans')
export class RechargePlanController {
  constructor(private readonly rechargePlanService: RechargePlanService) {}

  @Get()
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryRechargePlanDto,
  ) {
    return this.rechargePlanService.findAll(shopId, query.activeOnly);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @Body() dto: CreateRechargePlanDto,
  ) {
    return this.rechargePlanService.create(shopId, dto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() dto: UpdateRechargePlanDto,
  ) {
    return this.rechargePlanService.update(id, shopId, dto);
  }

  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @CurrentShop() shopId: string) {
    return this.rechargePlanService.toggle(id, shopId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentShop() shopId: string) {
    return this.rechargePlanService.remove(id, shopId);
  }
}
