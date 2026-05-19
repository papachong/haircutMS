import { Controller, Get, Post, Patch, Param, Body, Query, Res, HttpStatus, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Request, Response } from 'express';
import { OrderService } from './order.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrderDto, UpdateOrderDto, QueryOrderDto, SettleOrderDto } from './dto/order.dto';
import * as XLSX from 'xlsx';

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

  @Get('stats')
  async getStats(@CurrentShop() shopId: string) {
    return this.orderService.getStats(shopId);
  }

  @Get('pending')
  async getPendingOrders(@CurrentShop() shopId: string) {
    return this.orderService.getPendingOrders(shopId);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Get('export')
  async exportOrders(
    @CurrentShop() shopId: string,
    @Query() query: QueryOrderDto,
    @Res() res: Response,
  ) {
    const orders = await this.orderService.exportOrders(shopId, query);

    const statusMap: Record<string, string> = {
      PENDING: '待结算',
      SETTLED: '已结算',
      CANCELLED: '已取消',
      REFUNDED: '已退款',
    };

    const workbook = XLSX.utils.book_new();
    const worksheetData = [
      ['订单号', '会员姓名', '会员卡号', '手机号', '会员等级', '订单状态', '原价', '优惠金额', '应付金额', '实付金额', '服务项目', '支付方式', '备注', '创建时间', '结算时间', '取消时间'],
      ...orders.map((order) => [
        order.orderNo,
        order.memberName,
        order.memberCardNo,
        order.memberPhone,
        order.memberLevel,
        statusMap[order.status] || order.status,
        order.originalAmount,
        order.discountAmount,
        order.payableAmount,
        order.paidAmount,
        order.services,
        order.paymentMethods,
        order.remark,
        order.createdAt,
        order.settledAt,
        order.cancelledAt,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, '订单数据');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `orders_${dateStr}.xlsx`;
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Length', buffer.length);

    res.status(HttpStatus.OK).send(buffer);
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

  @Post(':id/settle')
  async settle(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: SettleOrderDto,
  ) {
    return this.orderService.settle(id, shopId, body, operatorId, req.ip);
  }

  @Post(':id/cancel')
  async cancel(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body?: { reason?: string },
  ) {
    return this.orderService.cancel(id, shopId, body?.reason, operatorId, req.ip);
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
