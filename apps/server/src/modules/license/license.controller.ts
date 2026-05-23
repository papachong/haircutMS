import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { LicenseService } from './license.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@ApiTags('授权信息')
@ApiBearerAuth()
@Controller('license')
export class LicenseController {
  constructor(private readonly licenseService: LicenseService) {}

  @Get()
  @ApiOperation({ summary: '获取当前店铺授权信息' })
  @ApiResponse({ status: 200, description: '成功获取授权信息' })
  @ApiResponse({ status: 401, description: '未授权' })
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
