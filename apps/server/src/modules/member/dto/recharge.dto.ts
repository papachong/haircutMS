import { IsString, IsInt, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PayMethod {
  CASH = 'CASH',
  WECHAT = 'WECHAT',
  ALIPAY = 'ALIPAY',
  BANK_CARD = 'BANK_CARD',
  OTHER = 'OTHER',
}

export class RechargeMemberDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  giftAmount?: number;

  @IsString()
  @IsEnum(PayMethod)
  payMethod!: PayMethod;

  @IsOptional()
  @IsString()
  remark?: string;
}

export class RechargeHistoryQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pageSize?: number;
}