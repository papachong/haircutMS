import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@ApiTags('操作日志')
@ApiBearerAuth()
@Controller('api/v1/audit-logs')
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: '获取操作日志列表' })
  @ApiResponse({ status: 200, description: '成功获取操作日志列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiQuery({ name: 'action', required: false, description: '操作类型筛选' })
  @ApiQuery({ name: 'staffId', required: false, description: '操作员工 ID' })
  @ApiQuery({ name: 'targetId', required: false, description: '目标对象 ID' })
  @ApiQuery({ name: 'startDate', required: false, description: '开始日期' })
  @ApiQuery({ name: 'endDate', required: false, description: '结束日期' })
  @ApiQuery({ name: 'page', required: false, description: '页码' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页数量' })
  async findAll(
    @CurrentShop() shopId: string,
    @Query('action') action?: string,
    @Query('staffId') staffId?: string,
    @Query('targetId') targetId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.auditService.findAll(shopId, {
      action,
      staffId,
      targetId,
      startDate,
      endDate,
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
    });
  }
}
