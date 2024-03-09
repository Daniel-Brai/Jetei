import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthenticationHelpers } from '@/common/helpers/app.helpers';

@Injectable()
export class AppMiddleware implements NestMiddleware {
  private readonly authHelpers = AuthenticationHelpers;
  async use(req: Request, res: Response, next: NextFunction) {
    const token: string = req.cookies['accessToken'];
    const tokenId: string = req.cookies['accessTokenId'];
    if (token && tokenId) {
      const decoded = await this.authHelpers.verifyToken(token, tokenId);
      if (
        decoded &&
        (req.originalUrl.includes('login') ||
          req.originalUrl.includes('signup') ||
          req.originalUrl.includes('verification') ||
          req.originalUrl.includes('forgot-password'))
      ) {
        res.redirect('/workspace');
      } else {
        next();
      }
    } else {
      if (
        req.originalUrl.includes('workspace') ||
        req.originalUrl.includes('settings')
      ) {
        res.redirect('/login');
      } else {
        next();
      }
    }
  }
}
