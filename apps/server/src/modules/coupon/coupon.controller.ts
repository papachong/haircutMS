import { Controller, Get, Post, Patch, Delete, Param, Body, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateCouponTemplateDto,
  UpdateCouponTemplateDto,
  IssueCouponsDto,
  QueryCouponTemplateDto,
  QueryMemberCouponsDto,
  CalculateCouponDiscountDto,
} from './dto/coupon.dto';

@ApiTags('优惠券管理')
@ApiBearerAuth()
@Controller('api/v1/coupons')
export class CouponController {
  constructor(private couponService: CouponService) {}

  @Get('templates')
  @ApiOperation({ summary: '获取优惠券模板列表' })
  @ApiResponse({ status: 200, description: '成功获取优惠券模板列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findTemplates(
    @CurrentShop() shopId: string,
    @Query() query: QueryCouponTemplateDto,
  ) {
    return this.couponService.findTemplates(shopId, query);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: '获取优惠券模板详情' })
  @ApiResponse({ status: 200, description: '成功获取优惠券模板详情' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '优惠券模板不存在' })
  async findTemplateById(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.findTemplateById(id, shopId);
  }

  @Post('templates')
  @ApiOperation({ summary: '创建优惠券模板' })
  @ApiResponse({ status: 201, description: '优惠券模板创建成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async createTemplate(
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: CreateCouponTemplateDto,
  ) {
    return this.couponService.createTemplate(shopId, body, operatorId, req.ip);
  }

  @Patch('templates/:id')
  @ApiOperation({ summary: '更新优惠券模板' })
  @ApiResponse({ status: 200, description: '优惠券模板更新成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '优惠券模板不存在' })
  async updateTemplate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: UpdateCouponTemplateDto,
  ) {
    return this.couponService.updateTemplate(id, shopId, body, operatorId, req.ip);
  }

  @Delete('templates/:id')
  @ApiOperation({ summary: '删除优惠券模板' })
  @ApiResponse({ status: 200, description: '优惠券模板删除成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '优惠券模板不存在' })
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.deleteTemplate(id, shopId);
  }

  @Post('templates/:templateId/issue')
  @ApiOperation({ summary: '向指定会员发放优惠券' })
  @ApiResponse({ status: 200, description: '优惠券发放成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  @ApiResponse({ status: 404, description: '优惠券模板或会员不存在' })
  async issueCoupons(
    @Param('templateId') templateId: string,
    @CurrentShop() shopId: string,
    @CurrentUser('staffId') operatorId: string,
    @Req() req: Request,
    @Body() body: IssueCouponsDto,
  ) {
    return this.couponService.issueCoupons(templateId, shopId, body.memberIds, operatorId, req.ip);
  }

  @Get('members/:memberId')
  @ApiOperation({ summary: '获取会员的优惠券列表' })
  @ApiResponse({ status: 200, description: '成功获取会员优惠券列表' })
  @ApiResponse({ status: 401, description: '未授权' })
  async findMemberCoupons(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
    @Query() query: QueryMemberCouponsDto,
  ) {
    return this.couponService.findMemberCoupons(memberId, shopId, query);
  }

  @Get('members/:memberId/summary')
  @ApiOperation({ summary: '获取会员优惠券汇总' })
  @ApiResponse({ status: 200, description: '成功获取会员优惠券汇总' })
  @ApiResponse({ status: 401, description: '未授权' })
  async getMemberSummary(
    @Param('memberId') memberId: string,
    @CurrentShop() shopId: string,
  ) {
    return this.couponService.getMemberSummary(memberId, shopId);
  }

  @Get('members/:memberId/available')
  @ApiOperation({ summary: '获取会员可用优惠券（根据金额筛选）' })
  @ApiResponse({ status: 200, description: '成功获取可用优惠券列表' })
  @ApiResponse({ status: 401, description: '未授权' })
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
  @ApiOperation({ summary: '计算优惠券折扣金额' })
  @ApiResponse({ status: 200, description: '成功计算折扣金额' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '未授权' })
  async calculateDiscount(
    @CurrentShop() shopId: string,
    @Body() body: CalculateCouponDiscountDto,
  ) {
    return this.couponService.calculateDiscount(body, shopId);
  }
}
