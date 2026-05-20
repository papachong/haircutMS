import { IsString, IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RechargePlanType } from '@haircut-ms/shared';

export class CreateRechargePlanDto {
  @ApiProperty({ description: '方案名称', example: '充100送10' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '充值金额（分）', example: 10000 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount!: number;

  @ApiPropertyOptional({ description: '赠送金额（分）', example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  giftAmount?: number;

  @ApiPropertyOptional({ description: '方案类型', enum: RechargePlanType })
  @IsOptional()
  @IsEnum(RechargePlanType)
  type?: RechargePlanType;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateRechargePlanDto {
  @ApiPropertyOptional({ description: '方案名称', example: '充100送10' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '充值金额（分）', example: 10000 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: '赠送金额（分）', example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  giftAmount?: number;

  @ApiPropertyOptional({ description: '方案类型', enum: RechargePlanType })
  @IsOptional()
  @IsEnum(RechargePlanType)
  type?: RechargePlanType;

  @ApiPropertyOptional({ description: '开始日期' })
  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @ApiPropertyOptional({ description: '结束日期' })
  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class QueryRechargePlanDto {
  @ApiPropertyOptional({ description: '仅显示启用的方案' })
  @IsOptional()
  activeOnly?: boolean;
}
