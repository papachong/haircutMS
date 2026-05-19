import { IsString, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTagGroupDto {
  @ApiProperty({ description: '标签组名称', example: '客户偏好' })
  @IsString()
  name: string;
}

export class CreateTagDto {
  @ApiProperty({ description: '标签名称', example: '烫发' })
  @IsString()
  name: string;
}

export class SetMemberTagsDto {
  @ApiProperty({ description: '标签 ID 列表', example: ['tag-id-1', 'tag-id-2'], isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tagIds: string[];
}

export class AddMemberTagDto {
  @ApiProperty({ description: '标签 ID' })
  @IsString()
  tagId: string;
}

export class RemoveMemberTagDto {
  @ApiProperty({ description: '标签 ID' })
  @IsString()
  tagId: string;
}

export class UpdateTagGroupDto {
  @ApiPropertyOptional({ description: '标签组名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '标签列表', isArray: true })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: Array<{ id?: string; name: string }>;
}

export class UpdateTagDto {
  @ApiProperty({ description: '标签名称', example: '染发' })
  @IsString()
  name: string;
}

export class QueryTagsDto {
  @ApiPropertyOptional({ description: '标签组 ID' })
  @IsOptional()
  @IsString()
  groupId?: string;
}
