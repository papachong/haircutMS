import {
  Controller,
  Get,
  Query,
  Res,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { ExportService, ExportFormat } from './export.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@Controller('export')
export class ExportController {
  constructor(private exportService: ExportService) {}

  @Get('members')
  async exportMembers(
    @CurrentShop() shopId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ) {
    const exportFormat = this.validateFormat(format);
    const buffer = await this.exportService.exportMembers(shopId, exportFormat);
    const fileName = this.exportService.generateFileName('会员列表', exportFormat);

    this.sendFile(res, buffer, fileName, exportFormat);
  }

  @Get('orders')
  async exportOrders(
    @CurrentShop() shopId: string,
    @Query('format') format: string = 'xlsx',
    @Query('startDate') startDate: string = '',
    @Query('endDate') endDate: string = '',
    @Res() res: Response,
  ) {
    const exportFormat = this.validateFormat(format);
    const buffer = await this.exportService.exportOrders(
      shopId,
      exportFormat,
      startDate || undefined,
      endDate || undefined,
    );
    const fileName = this.exportService.generateFileName('订单数据', exportFormat);

    this.sendFile(res, buffer, fileName, exportFormat);
  }

  @Get('recharge-records')
  async exportRechargeRecords(
    @CurrentShop() shopId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ) {
    const exportFormat = this.validateFormat(format);
    const buffer = await this.exportService.exportRechargeRecords(shopId, exportFormat);
    const fileName = this.exportService.generateFileName('充值记录', exportFormat);

    this.sendFile(res, buffer, fileName, exportFormat);
  }

  @Get('staff-stats')
  async exportStaffStats(
    @CurrentShop() shopId: string,
    @Query('format') format: string = 'xlsx',
    @Res() res: Response,
  ) {
    const exportFormat = this.validateFormat(format);
    const buffer = await this.exportService.exportStaffStats(shopId, exportFormat);
    const fileName = this.exportService.generateFileName('员工统计', exportFormat);

    this.sendFile(res, buffer, fileName, exportFormat);
  }

  private validateFormat(format: string): ExportFormat {
    if (format !== 'xlsx' && format !== 'csv') {
      throw new BadRequestException('format must be xlsx or csv');
    }
    return format;
  }

  private sendFile(
    res: Response,
    buffer: Buffer,
    fileName: string,
    format: ExportFormat,
  ): void {
    res.setHeader(
      'Content-Type',
      this.exportService.getContentType(format),
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader('Content-Length', buffer.length);
    res.status(HttpStatus.OK).send(buffer);
  }
}
