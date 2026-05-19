import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';
import {
  ShopManagementService,
} from './shop-management.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

// Swagger-documented DTOs for shop management

class CreateShopBodyDto {
  @ApiProperty({ description: '店铺名称', example: '潮流发型工作室' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '店铺地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '店铺电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '营业时间' })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiPropertyOptional({ description: '店铺 Logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({ description: '店主姓名', example: '王老板' })
  @IsString()
  ownerName!: string;

  @ApiProperty({ description: '店主手机号', example: '13800138000' })
  @IsString()
  ownerPhone!: string;

  @ApiProperty({ description: '店主登录密码（至少6位）', example: '123456' })
  @IsString()
  @MinLength(6)
  ownerPassword!: string;
}

class UpdateShopBodyDto {
  @ApiPropertyOptional({ description: '店铺名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '店铺地址' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: '店铺电话' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: '营业时间' })
  @IsOptional()
  @IsString()
  businessHours?: string;

  @ApiPropertyOptional({ description: '店铺 Logo URL' })
  @IsOptional()
  @IsString()
  logo?: string;
}

class ShopListFiltersDto {
  @ApiPropertyOptional({ description: '店铺状态筛选', enum: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] })
  @IsOptional()
  status?: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional()
  @IsString()
  search?: string;
}

@ApiTags('平台-店铺管理')
@ApiBearerAuth()
@Controller('platform/shops')
@UseGuards(PlatformJwtAuthGuard)
export class ShopManagementController {
  constructor(
    private readonly shopManagementService: ShopManagementService,
  ) {}

  /**
   * Get all shops with filters
   */
  @Get()
  @ApiOperation({ summary: '获取店铺列表（平台管理员）' })
  @ApiResponse({ status: 200, description: '成功获取店铺列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAll(@Query() query: ShopListFiltersDto) {
    return this.shopManagementService.findAll(query);
  }

  /**
   * Get shop detail by ID
   */
  @Get(':id')
  @ApiOperation({ summary: '获取店铺详情' })
  @ApiResponse({ status: 200, description: '成功获取店铺详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '店铺不存在' })
  async findById(@Param('id') id: string) {
    return this.shopManagementService.findById(id);
  }

  /**
   * Create a new shop with owner account
   */
  @Post()
  @ApiOperation({ summary: '创建新店铺（含店主账号）' })
  @ApiResponse({ status: 201, description: '店铺创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async create(@Body() data: CreateShopBodyDto) {
    return this.shopManagementService.create(data);
  }

  /**
   * Update shop information
   */
  @Patch(':id')
  @ApiOperation({ summary: '更新店铺信息' })
  @ApiResponse({ status: 200, description: '店铺信息更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '店铺不存在' })
  async update(@Param('id') id: string, @Body() data: UpdateShopBodyDto) {
    return this.shopManagementService.update(id, data);
  }

  /**
   * Suspend a shop
   */
  @Patch(':id/suspend')
  @ApiOperation({ summary: '暂停店铺' })
  @ApiResponse({ status: 200, description: '店铺已暂停' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '店铺不存在' })
  async suspend(@Param('id') id: string) {
    return this.shopManagementService.suspend(id);
  }

  /**
   * Activate a suspended shop
   */
  @Patch(':id/activate')
  @ApiOperation({ summary: '恢复暂停的店铺' })
  @ApiResponse({ status: 200, description: '店铺已恢复' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '店铺不存在' })
  async activate(@Param('id') id: string) {
    return this.shopManagementService.activate(id);
  }

  /**
   * Archive a shop
   */
  @Patch(':id/archive')
  @ApiOperation({ summary: '归档店铺' })
  @ApiResponse({ status: 200, description: '店铺已归档' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '店铺不存在' })
  async archive(@Param('id') id: string) {
    return this.shopManagementService.archive(id);
  }
}
