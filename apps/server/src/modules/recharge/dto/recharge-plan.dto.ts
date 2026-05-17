import { IsString, IsInt, IsOptional, IsEnum, IsDateString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RechargePlanType } from '../../../../../../packages/shared/src/types';

export class CreateRechargePlanDto {
  @IsString()
  name!: string;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  amount!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  giftAmount?: number;

  @IsOptional()
  @IsEnum(RechargePlanType)
  type?: RechargePlanType;

  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class UpdateRechargePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

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

  @IsOptional()
  @IsEnum(RechargePlanType)
  type?: RechargePlanType;

  @IsOptional()
  @IsDateString()
  startsAt?: string | null;

  @IsOptional()
  @IsDateString()
  endsAt?: string | null;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

export class QueryRechargePlanDto {
  @IsOptional()
  activeOnly?: boolean;
}
