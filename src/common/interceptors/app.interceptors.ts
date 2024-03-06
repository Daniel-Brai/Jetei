import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '@/types';
import { AppConfig } from '@/lib/config/config.provider';

@Injectable()
export class UserInterceptor implements NestInterceptor {
  private readonly appConfig = AppConfig;
  constructor(private readonly jwtService: JwtService) {}
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    let accessCookie: string | null;
    let token: string | null;
    let tokenId: string | null;
    let user: JwtPayload | null;

    try {
      accessCookie = request.cookies['accessToken'];
      token = accessCookie.split('-')[0];
      tokenId = accessCookie.split('-')[1];
      user = this.jwtService.verify(token, {
        jwtid: tokenId,
        secret: this.appConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY,
      });
    } catch (e) {
      accessCookie = null;
      token = null;
      tokenId = null;
    }

    if (!token && !tokenId && !user) {
      request['user'] = null;
    }

    request['user'] = user;

    return next.handle();
  }
}
