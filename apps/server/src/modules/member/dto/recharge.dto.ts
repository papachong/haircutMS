import { IsString, IsInt, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PayMethod {
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  BANK_CARD = 'BANK_CARD',
  OTHER = 'OTHER',
}

export class RechargeMemberDto {
  @ApiPropertyOptional({ description: '充值方案 ID' })
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ description: '充值金额', example: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: '赠送金额', example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  giftAmount?: number;

  @ApiProperty({ description: '支付方式', enum: PayMethod, example: 'WECHAT' })
  @IsString()
  @IsEnum(PayMethod)
  payMethod!: PayMethod;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class RechargeHistoryQueryDto {
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
