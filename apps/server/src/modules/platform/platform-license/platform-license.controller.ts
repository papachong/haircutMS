/**
 * Platform License Management Controller
 * API endpoints for license distribution, renewal, and validation
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, IsArray, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PlatformLicenseService } from './platform-license.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { LicensePlan } from '@prisma/client';
import {
  PLAN_DEFAULTS,
  LicensePlanType,
  LicenseModuleId,
} from '../../license/license.types';

// Swagger-documented DTOs for license management

class CreateLicenseBodyDto {
  @ApiProperty({ description: '店铺 ID' })
  @IsString()
  shopId!: string;

  @ApiProperty({ description: '授权方案', enum: LicensePlan, example: 'PRO' })
  @IsEnum(LicensePlan)
  plan!: LicensePlan;

  @ApiProperty({ description: '授权时长（月）', example: 12 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonths!: number;

  @ApiPropertyOptional({ description: '员工人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  staffLimit?: number;

  @ApiPropertyOptional({ description: '会员人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  membersLimit?: number;

  @ApiPropertyOptional({ description: '启用的模块 ID 列表', isArray: true })
  @IsOptional()
  @IsArray()
  modules?: string[];
}

class UpdateLicenseBodyDto {
  @ApiPropertyOptional({ description: '授权方案', enum: LicensePlan })
  @IsOptional()
  @IsEnum(LicensePlan)
  plan?: LicensePlan;

  @ApiPropertyOptional({ description: '授权时长（月）' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonths?: number;

  @ApiPropertyOptional({ description: '员工人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  staffLimit?: number;

  @ApiPropertyOptional({ description: '会员人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  membersLimit?: number;

  @ApiPropertyOptional({ description: '启用的模块 ID 列表', isArray: true })
  @IsOptional()
  @IsArray()
  modules?: string[];
}

class RenewLicenseBodyDto {
  @ApiProperty({ description: '续期时长（月）', example: 12 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  durationMonths!: number;

  @ApiPropertyOptional({ description: '授权方案', enum: LicensePlan })
  @IsOptional()
  @IsEnum(LicensePlan)
  plan?: LicensePlan;

  @ApiPropertyOptional({ description: '员工人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  staffLimit?: number;

  @ApiPropertyOptional({ description: '会员人数限制' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  membersLimit?: number;

  @ApiPropertyOptional({ description: '启用的模块 ID 列表', isArray: true })
  @IsOptional()
  @IsArray()
  modules?: string[];
}

@ApiTags('平台-授权管理')
@ApiBearerAuth()
@Controller('platform/licenses')
@UseGuards(PlatformJwtAuthGuard, PlatformRolesGuard)
export class PlatformLicenseController {
  constructor(
    private readonly platformLicenseService: PlatformLicenseService,
  ) {}

  /**
   * Get plan defaults and available modules
   */
  @Get('plan-defaults')
  @ApiOperation({ summary: '获取授权方案默认值和可用模块' })
  @ApiResponse({ status: 200, description: '成功获取方案配置' })
  @ApiResponse({ status: 401, description: '未授权' })
  getPlanDefaults() {
    return {
      plans: Object.entries(PLAN_DEFAULTS).map(([key, value]) => ({
        plan: key,
        staffLimit: value.staffLimit,
        membersLimit: value.membersLimit,
        modules: value.modules,
      })),
      availableModules: Object.entries(LicenseModuleId).map(([key, value]) => ({
        id: value,
        name: key,
      })),
    };
  }

  /**
   * Get all licenses with expiry status
   */
  @Get()
  @ApiOperation({ summary: '获取所有授权列表（含到期状态）' })
  @ApiResponse({ status: 200, description: '成功获取授权列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll() {
    return this.platformLicenseService.findAll();
  }

  /**
   * Get license detail by ID
   */
  @Get(':id')
  @ApiOperation({ summary: '获取授权详情' })
  @ApiResponse({ status: 200, description: '成功获取授权详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '授权不存在' })
  async findById(@Param('id') id: string) {
    return this.platformLicenseService.findById(id);
  }

  /**
   * Get license by shop ID
   */
  @Get('shop/:shopId')
  @ApiOperation({ summary: '根据店铺 ID 获取授权信息' })
  @ApiResponse({ status: 200, description: '成功获取授权信息' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '授权不存在' })
  async findByShopId(@Param('shopId') shopId: string) {
    return this.platformLicenseService.findByShopId(shopId);
  }

  /**
   * Get shops with expiring licenses (within 15 days or recently expired)
   */
  @Get('expiring/list')
  @ApiOperation({ summary: '获取即将到期或已过期的授权列表' })
  @ApiResponse({ status: 200, description: '成功获取到期授权列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getExpiringShops() {
    return this.platformLicenseService.getExpiringShops();
  }

  /**
   * Create and issue a new license for a shop
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Post()
  @ApiOperation({ summary: '创建并签发新授权（需管理员权限）' })
  @ApiResponse({ status: 201, description: '授权创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  async create(@Body() data: CreateLicenseBodyDto) {
    return this.platformLicenseService.create(data);
  }

  /**
   * Update an existing license
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新授权信息（需管理员权限）' })
  @ApiResponse({ status: 200, description: '授权更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '授权不存在' })
  async update(@Param('id') id: string, @Body() data: UpdateLicenseBodyDto) {
    return this.platformLicenseService.update(id, data);
  }

  /**
   * Renew a license with extended duration
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Patch(':id/renew')
  @ApiOperation({ summary: '续期授权（需管理员权限）' })
  @ApiResponse({ status: 200, description: '授权续期成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 403, description: '权限不足' })
  @ApiResponse({ status: 404, description: '授权不存在' })
  async renew(@Param('id') id: string, @Body() data: RenewLicenseBodyDto) {
    return this.platformLicenseService.renew(id, data);
  }

  /**
   * Validate a license key
   */
  @Post('validate')
  @UseGuards(PlatformJwtAuthGuard)
  @ApiOperation({ summary: '验证授权密钥' })
  @ApiResponse({ status: 200, description: '验证完成' })
  @ApiResponse({ status: 401, description: '未授权' })
  async validateLicense(@Body('licenseKey') licenseKey: string) {
    return this.platformLicenseService.validateLicense(licenseKey);
  }
}
