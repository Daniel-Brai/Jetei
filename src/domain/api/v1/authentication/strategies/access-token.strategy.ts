import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtPayload } from 'jsonwebtoken';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfig } from '@/lib/config/config.provider';
import { MessageHelpers } from '@/common/helpers/app.helpers';
import { Request } from 'express';

let req: Request;

@Injectable()
export class AccessTokenJwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: any) => {
          const data = request?.cookies['accessToken'];
          if (!data) {
            return null;
          }
          return data;
        },
      ]),
      jwtid: req?.cookies['accessTokenId'],
      secretOrKey: AppConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY,
      passReqToCallback: true,
    });
  }
  async validate(req: Request, payload: JwtPayload) {
    if (!payload) {
      throw new UnauthorizedException(MessageHelpers.HTTP_UNAUTHORIZED);
    }
    req.user = payload;
    return payload;
  }
}
