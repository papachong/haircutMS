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
import { ServiceCategoryService } from './service-category.service';
import { ServiceItemService } from './service-item.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class ServiceController {
  constructor(
    private categoryService: ServiceCategoryService,
    private itemService: ServiceItemService,
  ) {}

  // --- Categories ---

  @Get('service-categories')
  async findAllCategories(@CurrentShop() shopId: string) {
    return this.categoryService.findAll(shopId);
  }

  @Post('service-categories')
  async createCategory(
    @CurrentShop() shopId: string,
    @Body() body: { name: string; sortOrder?: number },
  ) {
    return this.categoryService.create(shopId, body);
  }

  @Patch('service-categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: { name?: string; sortOrder?: number },
  ) {
    return this.categoryService.update(id, shopId, body);
  }

  @Delete('service-categories/:id')
  async removeCategory(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.categoryService.remove(id, shopId);
  }

  @Post('service-categories/reorder')
  async reorderCategories(
    @CurrentShop() shopId: string,
    @Body() body: { ids: string[] },
  ) {
    return this.categoryService.reorder(shopId, body.ids);
  }

  // --- Items ---

  @Get('service-items')
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
  async createItem(
    @CurrentShop() shopId: string,
    @Body()
    body: {
      categoryId: string;
      name: string;
      price: number;
      duration: number;
      image?: string;
      sortOrder?: number;
    },
  ) {
    return this.itemService.create(shopId, body);
  }

  @Patch('service-items/:id')
  async updateItem(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body()
    body: {
      name?: string;
      price?: number;
      duration?: number;
      image?: string;
      sortOrder?: number;
    },
  ) {
    return this.itemService.update(id, shopId, body);
  }

  @Patch('service-items/:id/toggle')
  async toggleItem(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.itemService.toggle(id, shopId);
  }

  @Post('service-items/reorder')
  async reorderItems(
    @CurrentShop() shopId: string,
    @Body() body: { categoryId: string; ids: string[] },
  ) {
    return this.itemService.reorder(shopId, body.categoryId, body.ids);
  }
}
