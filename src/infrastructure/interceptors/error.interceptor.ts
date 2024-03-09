import { APIResponse } from '@/types';
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class AllExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const status = exception.getStatus();

    if (status === 401) {
      return res.redirect('/page/unauthorized');
    } else if (status === 403) {
      return res.redirect('/page/access-denied');
    } else if (status === 404) {
      return res.redirect('/page/not-found');
    } else if (status === 500) {
      return res.redirect('/page/internal-server-error');
    } else {
      res.status(status).json({
        type: 'error',
        status_code: status,
        api_message: exception.message,
        details: {
          timestamp: new Date().toISOString(),
          path: req.url,
        },
      } as APIResponse<any>);
    }
  }
}
