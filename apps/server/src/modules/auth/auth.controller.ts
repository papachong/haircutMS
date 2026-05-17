import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { phone: string; password: string; shopId?: string }) {
    if (body.shopId) {
      return this.authService.loginWithShopId(body.phone, body.password, body.shopId);
    }
    return this.authService.login(body.phone, body.password);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(200)
  async logout() {
    return { message: 'Logged out successfully' };
  }
}
