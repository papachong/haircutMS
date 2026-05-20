import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Gender } from '@haircut-ms/shared';

export class CreateMemberDto {
  @ApiProperty({ description: '会员姓名', example: '张三' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '手机号', example: '13800138000' })
  @IsString()
  phone!: string;

  @ApiPropertyOptional({ description: '性别', enum: Gender, example: 'MALE' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: '生日', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ description: '会员等级 ID' })
  @IsOptional()
  @IsString()
  memberLevelId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class UpdateMemberDto {
  @ApiPropertyOptional({ description: '会员姓名', example: '张三' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '手机号', example: '13800138000' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '性别', enum: Gender, example: 'MALE' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: '生日', example: '1990-01-01' })
  @IsOptional()
  @IsDateString()
  birthday?: string;

  @ApiPropertyOptional({ description: '会员等级 ID' })
  @IsOptional()
  @IsString()
  memberLevelId?: string;

  @ApiPropertyOptional({ description: '备注' })
  @IsOptional()
  @IsString()
  remark?: string;
}

export class QueryMemberDto {
  @ApiPropertyOptional({ description: '搜索关键词（姓名/手机号）' })
  @IsOptional()
  @IsString()
  keyword?: string;

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
