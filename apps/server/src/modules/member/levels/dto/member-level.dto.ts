import { IsString, IsOptional, IsNumber, Min, Max, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMemberLevelDto {
  @IsString()
  @MaxLength(50)
  name!: string;

  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Type(() => Number)
  discount!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}

export class UpdateMemberLevelDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Type(() => Number)
  discount?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}

class SortItemDto {
  @IsString()
  id!: string;

  @IsNumber()
  @Type(() => Number)
  sortOrder!: number;
}

export class BatchSortDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  items!: SortItemDto[];
}
