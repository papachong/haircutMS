import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface PlatformJwtPayload {
  adminId: string;
  role: string;
  type: string;
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
      throw new Error('Invalid token type');
    }
    return {
      adminId: payload.adminId,
      role: payload.role,
      type: payload.type,
    };
  }
}