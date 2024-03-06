import { RequestUser } from '@/interfaces';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const User = createParamDecorator(
  (_data: any, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (req.user) {
      return req as RequestUser;
    }
    return null;
  },
);
