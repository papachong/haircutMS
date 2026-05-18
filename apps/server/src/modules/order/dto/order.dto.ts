import { IsString, IsArray, IsOptional, IsInt, Min, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

enum OrderStatus {
  PENDING = 'PENDING',
  SETTLED = 'SETTLED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

enum PaymentMethod {
  BALANCE = 'BALANCE',
  PASS_CARD = 'PASS_CARD',
  OFFLINE = 'OFFLINE',
  COUPON = 'COUPON',
}

export class CreateOrderItemDto {
  @IsString()
  serviceItemId!: string;

  @IsString()
  staffId!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity = 1;
}

export class CreateOrderDto {
  @IsString()
  memberId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class UpdateOrderDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  remark?: string;

  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class QueryOrderDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;

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

export class PaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsInt()
  @Min(1)
  amount!: number;

  @IsOptional()
  @IsString()
  detail?: string;

  @IsOptional()
  @IsString()
  passCardId?: string;

  @IsOptional()
  @IsString()
  couponInstanceId?: string;
}

export class SettleOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments!: PaymentDto[];
}