import { IsString, IsInt, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PassCardStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED_UP = 'USED_UP',
  INACTIVE = 'INACTIVE',
}

export class CreatePassCardDto {
  @ApiProperty({ description: '会员 ID' })
  @IsString()
  memberId!: string;

  @ApiProperty({ description: '次卡名称', example: '剪发10次卡' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '总次数', example: 10 })
  @IsInt()
  @Type(() => Number)
  totalTimes!: number;

  @ApiProperty({ description: '价格（分）', example: 50000 })
  @IsInt()
  @Type(() => Number)
  price!: number;

  @ApiPropertyOptional({ description: '过期时间', example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class QueryPassCardDto {
  @ApiPropertyOptional({ description: '会员 ID' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '次卡状态', enum: PassCardStatus })
  @IsOptional()
  @IsEnum(PassCardStatus)
  status?: PassCardStatus;

  @ApiPropertyOptional({ description: '仅显示可用的次卡' })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  availableOnly?: boolean;

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: '每页数量', example: 20 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number;
}

export class UsePassCardDto {
  @ApiProperty({ description: '次卡 ID' })
  @IsString()
  passCardId!: string;

  @ApiPropertyOptional({ description: '订单项目 ID' })
  @IsOptional()
  @IsString()
  orderItemId?: string;
}
