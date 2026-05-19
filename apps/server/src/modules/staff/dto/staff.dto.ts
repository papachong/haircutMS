import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

const STAFF_ROLES = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'STYLIST', 'TECHNICIAN'] as const;

export class CreateStaffDto {
  @ApiProperty({ description: '员工姓名', example: '李师傅' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '手机号', example: '13800138001' })
  @IsString()
  phone!: string;

  @ApiProperty({ description: '登录密码（至少6位）', example: '123456' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ description: '角色', enum: STAFF_ROLES, example: 'STYLIST' })
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateStaffDto {
  @ApiPropertyOptional({ description: '员工姓名' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '手机号' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '角色', enum: STAFF_ROLES })
  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '新密码（至少6位）', example: '654321' })
  @IsString()
  @MinLength(6)
  password!: string;
}
