import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RechargePlanService } from './recharge-plan.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: CreateRechargePlanDto,
  ) {
    return this.rechargePlanService.create(shopId, dto, operatorId, req.ip);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() dto: UpdateRechargePlanDto,
  ) {
    return this.rechargePlanService.update(id, shopId, dto, operatorId, req.ip);
  }

  @Patch(':id/toggle')
  async toggle(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
  ) {
    return this.rechargePlanService.toggle(id, shopId, operatorId, req.ip);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @CurrentShop() shopId: string) {
    return this.rechargePlanService.remove(id, shopId);
  }
}
