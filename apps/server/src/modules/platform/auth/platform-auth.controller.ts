import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformAuthGuard } from './guards/platform-auth.guard';

interface PlatformRequest extends Request {
  user?: {
    adminId: string;
    role: string;
    type: string;
  };
}

@Controller('api/v1/platform/auth')
export class PlatformAuthController {
  constructor(private platformAuthService: PlatformAuthService) {}

  @Post('login')
  async login(@Body() body: { phone: string; password: string }) {
    const result = await this.platformAuthService.login(body.phone, body.password);
    return {
      code: 0,
      message: 'Login successful',
      data: result,
    };
  }

  @Post('refresh')
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
  async me(@Request() req: PlatformRequest) {
    const admin = await this.platformAuthService.validateAdmin(req.user?.adminId || '');
    return {
      code: 0,
      message: 'Success',
      data: admin,
    };
  }
}
