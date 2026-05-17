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
import {
  ShopManagementService,
  CreateShopDto,
  UpdateShopDto,
  ShopListFilters,
} from './shop-management.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';

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
  async findAll(@Query() query: ShopListFilters) {
    return this.shopManagementService.findAll(query);
  }

  /**
   * Get shop detail by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.shopManagementService.findById(id);
  }

  /**
   * Create a new shop with owner account
   */
  @Post()
  async create(@Body() data: CreateShopDto) {
    return this.shopManagementService.create(data);
  }

  /**
   * Update shop information
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateShopDto) {
    return this.shopManagementService.update(id, data);
  }

  /**
   * Suspend a shop
   */
  @Patch(':id/suspend')
  async suspend(@Param('id') id: string) {
    return this.shopManagementService.suspend(id);
  }

  /**
   * Activate a suspended shop
   */
  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.shopManagementService.activate(id);
  }

  /**
   * Archive a shop
   */
  @Patch(':id/archive')
  async archive(@Param('id') id: string) {
    return this.shopManagementService.archive(id);
  }
}