import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface PlatformJwtPayload {
  type: 'platform';
  adminId: string;
  role: string;
}

@Injectable()
export class PlatformJwtStrategy extends PassportStrategy(Strategy, 'platform-jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'dev-secret'),
    });
  }

  async validate(payload: PlatformJwtPayload) {
    if (payload.type !== 'platform') {
      throw new UnauthorizedException('Invalid token type');
    }

    return {
      type: 'platform',
      adminId: payload.adminId,
      role: payload.role,
    };
  }
}