import { Controller, Get, Post, Patch, Body, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { AuthService } from './auth.service';
import { CurrentShop } from '../../common/decorators/current-shop.decorator';
import { Public } from '../../common/decorators/public.decorator';

class UpdateShopDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  businessHours?: string;

  @IsOptional()
  @IsString()
  logo?: string;
}

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('shop')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取门店信息' })
  @ApiResponse({ status: 200, description: '返回当前门店信息' })
  async getShopInfo(@CurrentShop() shopId: string) {
    return this.authService.getShopInfo(shopId);
  }

  @Patch('shop')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新门店信息' })
  @ApiResponse({ status: 200, description: '门店信息更新成功' })
  @ApiResponse({ status: 401, description: '未授权' })
  async updateShopInfo(
    @CurrentShop() shopId: string,
    @Body() dto: UpdateShopDto,
  ) {
    return this.authService.updateShopInfo(shopId, dto);
  }

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: '员工登录' })
  @ApiResponse({ status: 200, description: '登录成功，返回 JWT token' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '手机号或密码错误' })
  async login(@Body() body: { phone: string; password: string; shopId?: string }) {
    if (body.shopId) {
      return this.authService.loginWithShopId(body.phone, body.password, body.shopId);
    }
    return this.authService.login(body.phone, body.password);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @HttpCode(200)
  @ApiOperation({ summary: '刷新 Token' })
  @ApiResponse({ status: 200, description: '刷新成功，返回新的 JWT token' })
  @ApiResponse({ status: 401, description: 'refreshToken 无效或已过期' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: '退出登录' })
  @ApiResponse({ status: 200, description: '退出成功' })
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
