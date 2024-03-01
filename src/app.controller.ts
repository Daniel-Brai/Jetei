import {
  Controller,
  Get,
  Req,
  Res,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthenticatedGuard } from '@/domain/api/v1/authentication/guards/authenticated.guard';
import { RequestUser } from '@/interfaces';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getIndex(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getIndex(req, res);
  }

  @Get('/page/access-denied')
  async get403(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getForbidden(req, res);
  }

  @Get('/page/not-found')
  async get404(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getNotFound(req, res);
  }

  @Get('/page/internal-server-error')
  async get500(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getInternalServerError(req, res);
  }

  @Get('/login')
  async getLogin(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getLogin(req, res);
  }

  @Get('/signup')
  async getSignup(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return await this.appService.getSignup(req, res);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/account/logout')
  async getLogout(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getLogout(req, res);
  }

  @Get('/account/signup-successful')
  async getSignupSuccessful(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getSignUpSuccessful(req, res);
  }

  @Get('/account/verification-successful')
  async getVerificationSuccessful(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getVerificationSuccessful(req, res);
  }

  @Get('/account/verification')
  async getVerification(
    @Req() req: Request,
    @Res() res: Response,
    @Query('token') token: string,
  ) {
    return await this.appService.getVerification(req, res, token);
  }

  @Get('/account/forgot-password')
  async getForgotPassword(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getForgotPassword(req, res);
  }

  @Get('/account/forgot-password/started')
  async getForgotPasswordStarted(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getForgotPasswordStarted(req, res);
  }

  @Get('/account/reset-password')
  async getResetPasswordByToken(
    @Req() req: Request,
    @Res() res: Response,
    @Query('token') token: string,
  ) {
    return await this.appService.getResetPasswordByToken(req, res, token);
  }

  @Get('/account/reset-confirmed')
  async getResetPasswordConfirmed(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getResetPasswordConfirmed(req, res);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/workspace')
  async getWorkspace(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspace(req, res);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/workspace/hubs')
  async getWorkspaceHubs(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspaceHubs(req, res);
  }

  @UseGuards(AuthenticatedGuard)
  @Get('/workspace/hubs/new')
  async getWorkspaceHubsCreate(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspaceHubsCreate(req, res);
  }
}
