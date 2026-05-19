import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ServiceCategoryService } from './service-category.service';
import { ServiceItemService } from './service-item.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

// Inline DTOs for Swagger documentation
class CreateCategoryBodyDto {
  @ApiProperty({ description: '分类名称', example: '剪发' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

class UpdateCategoryBodyDto {
  @ApiPropertyOptional({ description: '分类名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

class ReorderBodyDto {
  @ApiProperty({ description: 'ID 列表（按顺序排列）', example: ['id-1', 'id-2', 'id-3'], isArray: true })
  @IsArray()
  ids!: string[];
}

class CreateItemBodyDto {
  @ApiProperty({ description: '服务分类 ID' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ description: '服务名称', example: '男士精剪' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '价格（分）', example: 3800 })
  @IsInt()
  @Type(() => Number)
  price!: number;

  @ApiProperty({ description: '时长（分钟）', example: 30 })
  @IsInt()
  @Type(() => Number)
  duration!: number;

  @ApiPropertyOptional({ description: '图片 URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

class UpdateItemBodyDto {
  @ApiPropertyOptional({ description: '服务名称' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '价格（分）' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  price?: number;

  @ApiPropertyOptional({ description: '时长（分钟）' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  duration?: number;

  @ApiPropertyOptional({ description: '图片 URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: '排序值' })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  sortOrder?: number;
}

class ReorderItemsBodyDto {
  @ApiProperty({ description: '分类 ID' })
  @IsString()
  categoryId!: string;

  @ApiProperty({ description: '服务项目 ID 列表（按顺序排列）', isArray: true })
  @IsArray()
  ids!: string[];
}

@ApiTags('服务项目')
@ApiBearerAuth()
@Controller()
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(
    private categoryService: ServiceCategoryService,
    private itemService: ServiceItemService,
  ) {}

  // --- Categories ---

  @Get('service-categories')
  @ApiOperation({ summary: '获取服务分类列表' })
  @ApiResponse({ status: 200, description: '成功获取分类列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllCategories(@CurrentShop() shopId: string) {
    return this.categoryService.findAll(shopId);
  }

  @Post('service-categories')
  @ApiOperation({ summary: '创建服务分类' })
  @ApiResponse({ status: 201, description: '分类创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createCategory(
    @CurrentShop() shopId: string,
    @Body() body: CreateCategoryBodyDto,
  ) {
    return this.categoryService.create(shopId, body);
  }

  @Patch('service-categories/:id')
  @ApiOperation({ summary: '更新服务分类' })
  @ApiResponse({ status: 200, description: '分类更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  async updateCategory(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: UpdateCategoryBodyDto,
  ) {
    return this.categoryService.update(id, shopId, body);
  }

  @Delete('service-categories/:id')
  @ApiOperation({ summary: '删除服务分类' })
  @ApiResponse({ status: 200, description: '分类删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '分类不存在' })
  async removeCategory(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.categoryService.remove(id, shopId);
  }

  @Post('service-categories/reorder')
  @ApiOperation({ summary: '服务分类重新排序' })
  @ApiResponse({ status: 200, description: '排序成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async reorderCategories(
    @CurrentShop() shopId: string,
    @Body() body: ReorderBodyDto,
  ) {
    return this.categoryService.reorder(shopId, body.ids);
  }

  // --- Items ---

  @Get('service-items')
  @ApiOperation({ summary: '获取服务项目列表' })
  @ApiResponse({ status: 200, description: '成功获取服务项目列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findAllItems(
    @CurrentShop() shopId: string,
    @Query('categoryId') categoryId?: string,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.itemService.findAll(shopId, {
      categoryId: categoryId || undefined,
      activeOnly: activeOnly === 'true',
    });
  }

  @Post('service-items')
  @ApiOperation({ summary: '创建服务项目' })
  @ApiResponse({ status: 201, description: '服务项目创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createItem(
    @CurrentShop() shopId: string,
    @Body() body: CreateItemBodyDto,
  ) {
    return this.itemService.create(shopId, body);
  }

  @Patch('service-items/:id')
  @ApiOperation({ summary: '更新服务项目' })
  @ApiResponse({ status: 200, description: '服务项目更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '服务项目不存在' })
  async updateItem(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: UpdateItemBodyDto,
  ) {
    return this.itemService.update(id, shopId, body);
  }

  @Patch('service-items/:id/toggle')
  @ApiOperation({ summary: '切换服务项目启用/禁用状态' })
  @ApiResponse({ status: 200, description: '状态切换成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '服务项目不存在' })
  async toggleItem(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.itemService.toggle(id, shopId);
  }

  @Delete('service-items/:id')
  @ApiOperation({ summary: '删除服务项目' })
  @ApiResponse({ status: 200, description: '服务项目删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '服务项目不存在' })
  async removeItem(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.itemService.remove(id, shopId);
  }

  @Post('service-items/reorder')
  @ApiOperation({ summary: '服务项目重新排序' })
  @ApiResponse({ status: 200, description: '排序成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async reorderItems(
    @CurrentShop() shopId: string,
    @Body() body: ReorderItemsBodyDto,
  ) {
    return this.itemService.reorder(shopId, body.categoryId, body.ids);
  }
}
