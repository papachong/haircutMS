import { Controller, Get, Patch, Delete, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { QueryNotificationDto } from './dto/notification.dto';

@ApiTags('通知')
@ApiBearerAuth()
@Controller('api/v1/notifications')
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: '获取通知列表' })
  @ApiResponse({ status: 200, description: '成功获取通知列表' })
  async findAll(
    @CurrentShop() shopId: string,
    @Query() query: QueryNotificationDto,
  ) {
    return this.notificationService.findAll(shopId, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: '获取未读通知数量' })
  @ApiResponse({ status: 200, description: '成功获取未读数量' })
  async getUnreadCount(@CurrentShop() shopId: string) {
    return this.notificationService.getUnreadCount(shopId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: '标记所有通知为已读' })
  @ApiResponse({ status: 200, description: '成功标记全部已读' })
  async markAllAsRead(@CurrentShop() shopId: string) {
    return this.notificationService.markAllAsRead(shopId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: '标记单条通知为已读' })
  @ApiResponse({ status: 200, description: '成功标记已读' })
  async markAsRead(
    @CurrentShop() shopId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.markAsRead(shopId, id);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除通知' })
  @ApiResponse({ status: 200, description: '成功删除通知' })
  async remove(
    @CurrentShop() shopId: string,
    @Param('id') id: string,
  ) {
    return this.notificationService.remove(shopId, id);
  }
}
