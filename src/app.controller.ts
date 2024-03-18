import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RequestUser } from '@/interfaces';
import { AppService } from './app.service';
import { AccessTokenGuard } from './domain/api/v1/authentication/guards/access-token.guard';
import { Roles } from './domain/api/v1/authentication/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './domain/api/v1/authentication/guards/roles.guard';
import { GithubAuthGuard } from './domain/api/v1/authentication/guards/github.guard';
import { AuthenticationService } from './domain/api/v1/authentication/authentication.service';
import { AppConfig } from './lib/config/config.provider';

@Controller()
export class AppController {
  private readonly appConfig = AppConfig;
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthenticationService,
  ) {}

  @Get()
  async getIndex(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getIndex(req, res);
  }

  @Get('/page/unauthorized')
  async get401(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getUnauthorized(req, res);
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
  async getSignup(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getSignup(req, res);
  }

  @Get('/privacy')
  async getPrivacy(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getPrivacy(req, res);
  }

  @Get('/terms')
  async getTerms(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getTerms(req, res);
  }

  @UseGuards(GithubAuthGuard)
  @Get('/auth/github')
  public githubAuth() {}

  @UseGuards(GithubAuthGuard)
  @Get('/auth/github/callback')
  public async githubAuthCallback(@Req() req: Request) {
    const user = req.user;
    console.log('User object in controller:', user);
    if (!user) {
      return { message: 'Authentication failed' };
    }
    return { message: 'Authentication successful', user: user };
  }

  @UseGuards(AccessTokenGuard)
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

  @Get('/settings')
  async getSettings(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getUserSettings(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace')
  async getWorkspace(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspace(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/bookmarks')
  async searchWorkspaceBookmarkmarks(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceBookmarks(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/search')
  async searchWorkspaceByRevelance() {}

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/chats/:chatId')
  async getWorkspaceChatsById(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceChatById(chatId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs')
  async getWorkspaceHubs(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspaceHubs(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/new')
  async getWorkspaceHubsCreate(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspaceHubsCreate(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/add-invitee')
  async getWorkspaceAddHubInvitee(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubAddInvitee(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId')
  async getWorkspaceHubById(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubById(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId/edit')
  async getWorkspaceHubsEdit(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubsEdit(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId/notes/new')
  async getWorkspaceHubByIdAddNewNote(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubCreateNewNote(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole['OWNER'], UserRole['EDITOR'])
  @Get('/workspace/hubs/:hubId/notes/:noteId/edit')
  async getWorkspaceHubByIdNoteByIdEdit(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubByIdNoteByIdEdit(
      hubId,
      noteId,
      req,
      res,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId/invitees/:inviteeId/edit')
  async getWorkspaceHubInviteeEdit(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Param('inviteeId', ParseUUIDPipe) inviteeId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubInviteeEdit(
      hubId,
      inviteeId,
      req,
      res,
    );
  }
}
