import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { PassCardService } from './pass-card.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import {
  CreatePassCardDto,
  QueryPassCardDto,
  UsePassCardDto,
} from './dto/pass-card.dto';

@Controller('api/v1/pass-cards')
export class PassCardController {
  constructor(private passCardService: PassCardService) {}

  @Get()
  findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryPassCardDto,
  ) {
    return this.passCardService.findAll(shopId, query);
  }

  @Get(':id')
  findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.findById(id, shopId);
  }

  @Get(':id/usages')
  getUsages(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.passCardService.getUsages(id, shopId, page, pageSize);
  }

  @Post()
  create(
    @CurrentShop() shopId: string,
    @Body() body: CreatePassCardDto,
  ) {
    return this.passCardService.create(shopId, {
      ...body,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
  }

  @Post(':id/use')
  async use(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: UsePassCardDto,
  ) {
    return this.passCardService.use(id, shopId, body.orderItemId);
  }

  @Post(':id/refund/:usageId')
  async refundUsage(
    @Param('id') id: string,
    @Param('usageId') usageId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.refundUsage(id, usageId, shopId);
  }

  @Post(':id/deactivate')
  async deactivate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.deactivate(id, shopId);
  }

  @Post(':id/activate')
  async activate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.passCardService.activate(id, shopId);
  }
}
