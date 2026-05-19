import { IsString, IsInt, Min, IsEnum, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum CouponType {
  FIXED = 'FIXED',
  PERCENT = 'PERCENT',
}

enum CouponStatus {
  AVAILABLE = 'AVAILABLE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
}

export class CreateCouponTemplateDto {
  @ApiProperty({ description: '优惠券名称', example: '新客立减' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '优惠类型：FIXED=固定金额, PERCENT=折扣百分比', enum: CouponType, example: 'FIXED' })
  @IsEnum(CouponType)
  type!: CouponType;

  @ApiProperty({ description: '使用门槛金额（分），0 表示无门槛', example: 0 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  threshold = 0;

  @ApiProperty({ description: '优惠金额或折扣百分比', example: 1000 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  discount!: number;

  @ApiProperty({ description: '发放总数', example: 100 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  total!: number;

  @ApiProperty({ description: '开始时间', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ description: '结束时间', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponTemplateDto {
  @ApiPropertyOptional({ description: '优惠券名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '优惠类型', enum: CouponType })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional({ description: '使用门槛金额（分）' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  threshold?: number;

  @ApiPropertyOptional({ description: '优惠金额或折扣百分比' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class IssueCouponsDto {
  @ApiProperty({ description: '会员 ID 列表', example: ['member-id-1', 'member-id-2'], isArray: true })
  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}

export class QueryCouponTemplateDto {
  @ApiPropertyOptional({ description: '优惠类型', enum: CouponType })
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @ApiPropertyOptional({ description: '是否启用' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

export class QueryMemberCouponsDto {
  @ApiPropertyOptional({ description: '优惠券状态', enum: CouponStatus })
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

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

export class CalculateCouponDiscountDto {
  @ApiProperty({ description: '订单金额（分）', example: 10000 })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @ApiProperty({ description: '优惠券实例 ID' })
  @IsString()
  couponInstanceId!: string;
}
