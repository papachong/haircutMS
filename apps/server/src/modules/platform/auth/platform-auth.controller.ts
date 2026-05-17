import { Controller, Post, Body } from '@nestjs/common';
import { PlatformAuthService } from './platform-auth.service';

@Controller('api/v1/platform/auth')
export class PlatformAuthController {
  constructor(private platformAuthService: PlatformAuthService) {}

  @Post('login')
  async login(@Body() body: { phone: string; password: string }) {
    return this.platformAuthService.login(body.phone, body.password);
  }
}
