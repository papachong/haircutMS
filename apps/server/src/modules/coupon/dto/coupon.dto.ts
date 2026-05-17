import { IsString, IsInt, Min, IsEnum, IsOptional, IsArray, IsBoolean, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

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
  @IsString()
  name!: string;

  @IsEnum(CouponType)
  type!: CouponType;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  threshold = 0;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  discount!: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  total!: number;

  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateCouponTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  threshold?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;
}

export class IssueCouponsDto {
  @IsArray()
  @IsString({ each: true })
  memberIds!: string[];
}

export class QueryCouponTemplateDto {
  @IsOptional()
  @IsEnum(CouponType)
  type?: CouponType;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

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

export class QueryMemberCouponsDto {
  @IsOptional()
  @IsEnum(CouponStatus)
  status?: CouponStatus;

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

export class CalculateCouponDiscountDto {
  @IsInt()
  @Min(0)
  @Type(() => Number)
  amount!: number;

  @IsString()
  couponInstanceId!: string;
}