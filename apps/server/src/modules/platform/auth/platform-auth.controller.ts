import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAuthGuard } from './guards/platform-auth.guard';
import { Public } from '../../../common/decorators/public.decorator';

interface PlatformRequest extends Request {
  user?: {
    adminId: string;
    role: string;
    type: string;
  };
}

@ApiTags('平台认证')
@Controller('platform/auth')
export class PlatformAuthController {
  constructor(private platformAuthService: PlatformAuthService) {}

  @Public()
  @Throttle({ default: { limit: 100, ttl: 60_000 } })
  @Post('login')
  @ApiOperation({ summary: '平台管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '手机号或密码错误' })
  async login(@Body() body: { phone: string; password: string }) {
    return this.platformAuthService.login(body.phone, body.password);
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('refresh')
  @ApiOperation({ summary: '刷新平台 Token' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: 'refreshToken 无效或已过期' })
  async refresh(@Body() body: { refreshToken: string }) {
    return this.platformAuthService.refresh(body.refreshToken);
  }

  @Get('me')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前平台管理员信息' })
  @ApiResponse({ status: 200, description: '成功获取管理员信息' })
  @ApiResponse({ status: 401, description: '未授权' })
  async me(@Request() req: PlatformRequest) {
    return this.platformAuthService.validateAdmin(req.user?.adminId || '');
  }
}
