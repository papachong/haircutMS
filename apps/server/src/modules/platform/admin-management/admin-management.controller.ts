import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength, IsIn } from 'class-validator';
import { AdminManagementService } from './admin-management.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PLATFORM_ROLES_KEY, PlatformAdminRole } from '../auth/guards/platform-roles.guard';
import { SetMetadata } from '@nestjs/common';

export const PlatformRoles = (...roles: string[]) => SetMetadata(PLATFORM_ROLES_KEY, roles);

class CreateAdminDto {
  @IsString()
  name!: string;

  @IsString()
  phone!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'OPERATOR'])
  role!: string;
}

class UpdateAdminDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @IsIn(['SUPER_ADMIN', 'ADMIN', 'OPERATOR'])
  role?: string;
}

class ResetPasswordDto {
  @IsString()
  @MinLength(6)
  newPassword!: string;
}

@ApiTags('平台-管理员管理')
@ApiBearerAuth()
@Controller('platform/admins')
@UseGuards(PlatformJwtAuthGuard, PlatformRolesGuard)
@PlatformRoles(PlatformAdminRole.SUPER_ADMIN, PlatformAdminRole.ADMIN)
export class AdminManagementController {
  constructor(private readonly service: AdminManagementService) {}

  @Get()
  @ApiOperation({ summary: '获取管理员列表' })
  async findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取管理员详情' })
  async findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  @ApiOperation({ summary: '创建管理员' })
  async create(@Body() dto: CreateAdminDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新管理员信息' })
  async update(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.service.update(id, dto);
  }

  @Patch(':id/reset-password')
  @ApiOperation({ summary: '重置管理员密码' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, dto.newPassword);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: '启用/停用管理员' })
  async toggleActive(@Param('id') id: string) {
    return this.service.toggleActive(id);
  }
}
