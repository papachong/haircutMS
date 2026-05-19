import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
