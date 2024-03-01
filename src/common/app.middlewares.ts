import { AuthenticationService } from '@/domain/api/v1/authentication/authentication.service';
import { RequestUser } from '@/interfaces';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AppMiddleware implements NestMiddleware {
  private readonly authService: AuthenticationService;
  async use(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      await this.authService.setUserToken(req as RequestUser, res);
      next();
    }
  }
}
