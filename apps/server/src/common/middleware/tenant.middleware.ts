import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const user = req.user as { shopId?: string; type?: string } | undefined;
    if (user?.type === 'shop' && user.shopId) {
      (req as any).shopId = user.shopId;
    }
    next();
  }
}
