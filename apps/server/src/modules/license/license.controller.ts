import { Controller, Get } from '@nestjs/common';
import { LicenseService } from './license.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@Controller('api/v1/license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  async getLicense(@CurrentShop() shopId: string) {
    const info = await this.licenseService.getLicenseInfo(shopId);
    return {
      plan: info.plan,
      staffLimit: info.staffLimit,
      membersLimit: info.membersLimit,
      modules: info.modules,
      expiresAt: info.expiresAt,
      isExpired: info.isExpired,
    };
  }
}
