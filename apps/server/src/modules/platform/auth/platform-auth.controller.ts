import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAuthGuard } from './guards/platform-auth.guard';

interface PlatformRequest extends Request {
  user?: {
    adminId: string;
    role: string;
    type: string;
  };
}

@ApiTags('平台认证')
@Controller('api/v1/platform/auth')
export class PlatformAuthController {
  constructor(private platformAuthService: PlatformAuthService) {}

  @Post('login')
  @ApiOperation({ summary: '平台管理员登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 400, description: '参数错误' })
  @ApiResponse({ status: 401, description: '手机号或密码错误' })
  async login(@Body() body: { phone: string; password: string }) {
    const result = await this.platformAuthService.login(body.phone, body.password);
    return {
      code: 0,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新平台 Token' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: 'refreshToken 无效或已过期' })
  async refresh(@Body() body: { refreshToken: string }) {
    const result = await this.platformAuthService.refresh(body.refreshToken);
    return {
      code: 0,
      message: 'Token refreshed',
      data: result,
    };
  }

  @Get('me')
  @UseGuards(PlatformAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前平台管理员信息' })
  @ApiResponse({ status: 200, description: '成功获取管理员信息' })
  @ApiResponse({ status: 401, description: '未授权' })
  async me(@Request() req: PlatformRequest) {
    const admin = await this.platformAuthService.validateAdmin(req.user?.adminId || '');
    return {
      code: 0,
      message: 'Success',
      data: admin,
    };
  }
}
