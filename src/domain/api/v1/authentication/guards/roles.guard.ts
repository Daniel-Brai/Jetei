import { RequestUser } from '@/interfaces';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles =
      this.reflector.getAllAndMerge<UserRole[]>('roles', [
        context.getClass(),
        context.getHandler(),
      ]) || [];

    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestUser>();
    const user = request['user'];

    if (user && !user.role) {
      return false;
    }

    return roles.some((role) => role === user.role);
  }
}
