import { IsString, IsOptional, MinLength, Matches, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterBodyDto {
  @ApiProperty({ description: '店铺名称', example: '潮流发型工作室' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '店主姓名', example: '王老板' })
  @IsString()
  ownerName!: string;

  @ApiProperty({ description: '店主手机号', example: '13800138000' })
  @IsString()
  @Matches(/^1[3-9]\d{9}$/, { message: '请输入有效的手机号' })
  ownerPhone!: string;

  @ApiProperty({ description: '登录密码（至少6位）', example: '123456' })
  @IsString()
  @MinLength(6, { message: '密码至少需要6个字符' })
  ownerPassword!: string;

  @ApiPropertyOptional({
    description: '数据模板：SMALL_SHOP 或 LARGE_SHOP',
    enum: ['SMALL_SHOP', 'LARGE_SHOP'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['SMALL_SHOP', 'LARGE_SHOP'], { message: '无效的模板类型' })
  template?: string;
}
