import { IsString, IsOptional, IsIn, MinLength } from 'class-validator';

const STAFF_ROLES = ['OWNER', 'MANAGER', 'RECEPTIONIST', 'STYLIST', 'TECHNICIAN'] as const;

export class CreateStaffDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateStaffDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(STAFF_ROLES)
  role?: string;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  password!: string;
}
