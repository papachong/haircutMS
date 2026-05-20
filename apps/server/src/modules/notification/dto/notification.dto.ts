import { IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

enum NotificationType {
  LICENSE_EXPIRY = 'LICENSE_EXPIRY',
  PASS_CARD_EXPIRY = 'PASS_CARD_EXPIRY',
  MEMBER_BIRTHDAY = 'MEMBER_BIRTHDAY',
  ABNORMAL_ORDER = 'ABNORMAL_ORDER',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
}

export class QueryNotificationDto {
  @ApiPropertyOptional({ description: '通知类型', enum: NotificationType })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiPropertyOptional({ description: '是否已读' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isRead?: boolean;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}
