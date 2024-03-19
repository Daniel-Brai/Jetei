import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request, Response } from 'express';

@Injectable()
export class GithubAuthGuard extends AuthGuard('github') {
  // handleRequest(err: any, user: any, info: any, context: ExecutionContext, status: any) {
  //   const http = context.switchToHttp();
  //   const req = http.getRequest<Request>();
  //   const res = http.getResponse<Response>();
    
  //   if (err !== null || !user) {
  //     throw new UnauthorizedException()
  //   }
  //   return super.handleRequest(err, user, info, context, status);
  // }
}
