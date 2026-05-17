import { createParamDecorator, ExecutionContext } from '@nestjs/common';

type User = {
  staffId?: string;
  shopId?: string;
  role?: string;
  type?: string;
};

export const CurrentUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as User | undefined;
    return data ? user?.[data] : user;
  },
);
