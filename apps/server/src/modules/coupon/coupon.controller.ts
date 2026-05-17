import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import {
  CreateCouponTemplateDto,
  UpdateCouponTemplateDto,
  IssueCouponsDto,
  QueryCouponTemplateDto,
  QueryMemberCouponsDto,
  CalculateCouponDiscountDto,
} from './dto/coupon.dto';

@Controller('api/v1/coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Get('templates')
  async findTemplates(
    @CurrentShop() shopId: string,
    @Query() query: QueryCouponTemplateDto,
  ) {
    return this.couponService.findTemplates(shopId, query);
  }

  @Get('templates/:id')
  async findTemplateById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.findTemplateById(id, shopId);
  }

  @Post('templates')
  async createTemplate(
    @CurrentShop() shopId: string,
    @Body() body: CreateCouponTemplateDto,
  ) {
    return this.couponService.createTemplate(shopId, body);
  }

  @Patch('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @Body() body: UpdateCouponTemplateDto,
  ) {
    return this.couponService.updateTemplate(id, shopId, body);
  }

  @Delete('templates/:id')
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.deleteTemplate(id, shopId);
  }

  @Post('templates/:templateId/issue')
  async issueCoupons(
    @Param('templateId') templateId: string,
    @CurrentShop() shopId: string,
    @Body() body: IssueCouponsDto,
  ) {
    return this.couponService.issueCoupons(templateId, shopId, body.memberIds);
  }

  @Get('members/:memberId')
  async findMemberCoupons(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberCouponsDto,
  ) {
    return this.couponService.findMemberCoupons(memberId, shopId, query);
  }

  @Get('members/:memberId/summary')
  async getMemberSummary(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.getMemberSummary(memberId, shopId);
  }

  @Get('members/:memberId/available')
  async getAvailableCoupons(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Query('amount') amount?: string,
  ) {
    return this.couponService.getAvailableCoupons(
      memberId,
      shopId,
      amount ? parseInt(amount, 10) : 0,
    );
  }

  @Post('calculate-discount')
  async calculateDiscount(
    @CurrentShop() shopId: string,
    @Body() body: CalculateCouponDiscountDto,
  ) {
    return this.couponService.calculateDiscount(body, shopId);
  }
}