import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { AuthenticationHelpers } from '@/common/helpers/app.helpers';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  private readonly authHelpers = AuthenticationHelpers;
  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    return this.authHelpers.isAuthenticated(req);
  }
}
