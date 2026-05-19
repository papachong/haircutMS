import { Injectable, Logger, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException, ThrottlerModuleOptions, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  private readonly logger = new Logger(CustomThrottlerGuard.name);

  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  protected async getTracker(req: Record<string, any>): Promise<string> {
    const user = req.user as { shopId?: string; type?: string; adminId?: string } | undefined;

    const ip = req.ips?.length > 0 ? req.ips[0] : req.ip || 'unknown';

    // For authenticated shop routes, use shopId + IP for tenant-aware limiting
    if (user?.type === 'shop' && user.shopId) {
      return `shop:${user.shopId}:${ip}`;
    }

    // For platform admin routes, use adminId + IP
    if (user?.type === 'platform' && user.adminId) {
      return `admin:${user.adminId}:${ip}`;
    }

    // For unauthenticated routes, use IP only
    return `ip:${ip}`;
  }

  protected async throwThrottlingException(
    context: ExecutionContext,
    throttlerLimitDetail: Record<string, any>,
  ): Promise<void> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const ip = request.ips?.length > 0 ? request.ips[0] : request.ip || 'unknown';
    const tracker = throttlerLimitDetail.tracker || 'unknown';

    this.logger.warn(
      `Rate limit exceeded for ${tracker} on ${request.method} ${request.url} (IP: ${ip})`,
    );

    // Set Retry-After header (in seconds)
    const retryAfter = Math.ceil(
      (throttlerLimitDetail.timeToExpire || 60000) / 1000,
    );
    response.setHeader('Retry-After', retryAfter);

    throw new ThrottlerException('请求过于频繁，请稍后再试');
  }
}
