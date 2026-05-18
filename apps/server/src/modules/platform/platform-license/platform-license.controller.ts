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
  PlatformLicenseService,
  CreateLicenseDto,
  UpdateLicenseDto,
  RenewLicenseDto,
} from './platform-license.service';
import { PlatformJwtAuthGuard } from '../auth/guards/platform-jwt-auth.guard';
import { PlatformRolesGuard } from '../auth/guards/platform-roles.guard';
import { PlatformAdminRole } from '@prisma/client';

@Controller('platform/licenses')
@UseGuards(PlatformJwtAuthGuard, PlatformRolesGuard)
export class PlatformLicenseController {
  constructor(
    private readonly platformLicenseService: PlatformLicenseService,
  ) {}

  /**
   * Get all licenses with expiry status
   */
  @Get()
  async findAll() {
    return this.platformLicenseService.findAll();
  }

  /**
   * Get license detail by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.platformLicenseService.findById(id);
  }

  /**
   * Get license by shop ID
   */
  @Get('shop/:shopId')
  async findByShopId(@Param('shopId') shopId: string) {
    return this.platformLicenseService.findByShopId(shopId);
  }

  /**
   * Get shops with expiring licenses (within 15 days or recently expired)
   */
  @Get('expiring/list')
  async getExpiringShops() {
    return this.platformLicenseService.getExpiringShops();
  }

  /**
   * Create and issue a new license for a shop
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Post()
  async create(@Body() data: CreateLicenseDto) {
    return this.platformLicenseService.create(data);
  }

  /**
   * Update an existing license
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Patch(':id')
  async update(@Param('id') id: string, @Body() data: UpdateLicenseDto) {
    return this.platformLicenseService.update(id, data);
  }

  /**
   * Renew a license with extended duration
   * Requires ADMIN or SUPER_ADMIN role
   */
  @Patch(':id/renew')
  async renew(@Param('id') id: string, @Body() data: RenewLicenseDto) {
    return this.platformLicenseService.renew(id, data);
  }

  /**
   * Validate a license key
   */
  @Post('validate')
  @UseGuards(PlatformJwtAuthGuard)
  async validateLicense(@Body('licenseKey') licenseKey: string) {
    return this.platformLicenseService.validateLicense(licenseKey);
  }
}