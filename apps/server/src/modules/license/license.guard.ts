import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LicenseService } from './license.service';
import { LICENSE_MODULE_KEY } from './decorators/license-module.decorator';
import { EXPIRY_SAFE_MODULES } from './license.types';

@Injectable()
export class LicenseGuard implements CanActivate {
  private readonly logger = new Logger(LicenseGuard.name);

  constructor(
    private reflector: Reflector,
    private licenseService: LicenseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModules =
      this.reflector.getAllAndOverride<string[]>(LICENSE_MODULE_KEY, [
        context.getHandler(),
        context.getClass(),
      ]);

    // No @LicenseModule decorator => skip license check
    if (!requiredModules || requiredModules.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const shopId: string | undefined = request.shopId;

    // No shop context (e.g. platform admin) => bypass
    if (!shopId) {
      return true;
    }

    const license = await this.licenseService.getLicenseInfo(shopId);

    // If license is expired, only allow expiry-safe modules (basic POS)
    if (license.isExpired) {
      const allSafe = requiredModules.every((m) =>
        EXPIRY_SAFE_MODULES.includes(m),
      );
      if (!allSafe) {
        this.logger.warn(
          `License expired for shop ${shopId}, blocking modules: ${requiredModules.join(', ')}`,
        );
        throw new ForbiddenException(
          'License has expired. Please renew to access this feature.',
        );
      }
      return true;
    }

    // Check if all required modules are included in the license
    const missing = requiredModules.filter(
      (m) => !license.modules.includes(m),
    );
    if (missing.length > 0) {
      this.logger.warn(
        `Shop ${shopId} lacks license modules: ${missing.join(', ')}`,
      );
      throw new ForbiddenException(
        `Your current plan (${license.plan}) does not include: ${missing.join(', ')}. Please upgrade.`,
      );
    }

    return true;
  }
}
