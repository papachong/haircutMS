import { IsString, IsArray, IsOptional, IsInt, Min, IsEnum, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
  @ApiProperty({ description: '服务项目 ID' })
  @IsString()
  serviceItemId!: string;

  @ApiProperty({ description: '服务员工 ID' })
  @IsString()
  staffId!: string;

  @ApiPropertyOptional({ description: '数量', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity = 1;
}

export class CreateOrderDto {
  @ApiProperty({ description: '会员 ID' })
  @IsString()
  memberId!: string;

  @ApiProperty({ description: '订单项目列表', type: [CreateOrderItemDto], isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}

export class UpdateOrderDto {
  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;

  @ApiPropertyOptional({ description: '取消原因' })
  @IsOptional()
  @IsString()
  cancelReason?: string;
}

export class QueryOrderDto {
  @ApiPropertyOptional({ description: '会员 ID' })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: '订单状态', enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '开始日期', example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束日期', example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

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

export class PaymentDto {
  @ApiProperty({ description: '支付方式', enum: PaymentMethod, example: 'BALANCE' })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ description: '支付金额', example: 100 })
  @IsInt()
  @Min(1)
  amount!: number;

  @ApiPropertyOptional({ description: '支付详情' })
  @IsOptional()
  @IsString()
  detail?: string;

  @ApiPropertyOptional({ description: '次卡 ID（支付方式为 PASS_CARD 时必填）' })
  @IsOptional()
  @IsString()
  passCardId?: string;

  @ApiPropertyOptional({ description: '优惠券实例 ID（支付方式为 COUPON 时必填）' })
  @IsOptional()
  @IsString()
  couponInstanceId?: string;
}

export class SettleOrderDto {
  @ApiProperty({ description: '支付明细列表', type: [PaymentDto], isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentDto)
  payments!: PaymentDto[];
}
