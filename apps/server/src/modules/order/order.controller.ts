import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto } from './dto/order.dto';

@Controller('api/v1/orders')
export class OrderController {
  constructor(private orderService: OrderService) {}

  @Get()
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryOrderDto,
  ) {
    return this.orderService.findAll(shopId, query);
  }

  @Get('pending')
  async getPendingOrders(@CurrentShop() shopId: string) {
    return this.orderService.getPendingOrders(shopId);
  }

  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.orderService.findById(id, shopId);
  }

  @Post()
  async create(
    @CurrentShop() shopId: string,
    @Body() body: CreateOrderDto,
  ) {
    return this.orderService.create(shopId, body);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: UpdateOrderDto,
  ) {
    return this.orderService.update(id, shopId, body);
  }
}