import { IsString, IsNumber, IsOptional, Min, Max, MaxLength, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMemberLevelDto {
  @ApiProperty({ description: '等级名称', example: '金卡会员' })
  @IsString()
  @MaxLength(50)
  name!: string;

  @ApiProperty({ description: '折扣比例（0.1~1.0）', example: 0.9 })
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Type(() => Number)
  discount!: number;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}

export class UpdateMemberLevelDto {
  @ApiPropertyOptional({ description: '等级名称', example: '金卡会员' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '折扣比例（0.1~1.0）', example: 0.9 })
  @IsOptional()
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @Type(() => Number)
  discount?: number;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  sortOrder?: number;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  remark?: string;
}

class SortItemDto {
  @ApiProperty({ description: '等级 ID' })
  @IsString()
  id!: string;

  @ApiProperty({ description: '排序值' })
  @IsNumber()
  @Type(() => Number)
  sortOrder!: number;
}

export class BatchSortDto {
  @ApiProperty({ description: '排序项列表', type: [SortItemDto], isArray: true })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  items!: SortItemDto[];
}
