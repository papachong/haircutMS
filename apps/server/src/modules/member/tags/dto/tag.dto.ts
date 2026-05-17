import { IsString, IsArray, IsOptional, ArrayNotEmpty } from 'class-validator';

export class CreateTagGroupDto {
  @IsString()
  name: string;
}

export class CreateTagDto {
  @IsString()
  name: string;
}

export class SetMemberTagsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  tagIds: string[];
}

export class AddMemberTagDto {
  @IsString()
  tagId: string;
}

export class RemoveMemberTagDto {
  @IsString()
  tagId: string;
}

export class UpdateTagGroupDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: Array<{ id?: string; name: string }>;
}

export class UpdateTagDto {
  @IsString()
  name: string;
}

export class QueryTagsDto {
  @IsOptional()
  @IsString()
  groupId?: string;
}