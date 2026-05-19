import { SetMetadata } from '@nestjs/common';

export const SKIP_THROTTLE_KEY = 'skipThrottle';

/**
 * Skip rate limiting for the decorated endpoint.
 * Use on health checks and other public endpoints that should never be throttled.
 *
 * @example
 * @SkipThrottle()
 * @Get('health')
 * health() { ... }
 */
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
