import { Controller, Get, Param, Query } from '@nestjs/common';
import { MemberProfileService } from './member-profile.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';

@Controller('members')
export class MemberProfileController {
  constructor(private profileService: MemberProfileService) {}

  @Get(':id/profile')
  async getProfile(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.profileService.getProfile(memberId, shopId);
  }

  @Get(':id/recommendations')
  async getRecommendations(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.profileService.getRecommendations(memberId, shopId);
  }

  @Get(':id/consumption-chart')
  async getConsumptionChart(
    @Param('id') memberId: string,
    @CurrentShop() shopId: string,
    @Query('months') months?: string,
  ) {
    const parsedMonths = months ? parseInt(months, 10) : 12;
    return this.profileService.getConsumptionChart(
      memberId,
      shopId,
      isNaN(parsedMonths) ? 12 : parsedMonths,
    );
  }
}
