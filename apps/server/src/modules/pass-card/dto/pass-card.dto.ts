import { IsString, IsInt, IsOptional, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export enum PassCardStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  USED_UP = 'USED_UP',
  INACTIVE = 'INACTIVE',
}

export class CreatePassCardDto {
  @IsString()
  memberId!: string;

  @IsString()
  name!: string;

  @IsInt()
  @Type(() => Number)
  totalTimes!: number;

  @IsInt()
  @Type(() => Number)
  price!: number;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isActive?: boolean;
}

export class QueryPassCardDto {
  @IsOptional()
  @IsString()
  memberId?: string;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsEnum(PassCardStatus)
  status?: PassCardStatus;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  availableOnly?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pageSize?: number;
}

export class UsePassCardDto {
  @IsString()
  passCardId!: string;

  @IsOptional()
  @IsString()
  orderItemId?: string;
}