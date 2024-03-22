import {
  Controller,
  Get,
  Req,
  Res,
  Query,
  Param,
  ParseUUIDPipe,
  UseGuards,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { RequestUser } from '@/interfaces';
import { AppService } from './app.service';
import { AccessTokenGuard } from './domain/api/v1/authentication/guards/access-token.guard';
import { Roles } from './domain/api/v1/authentication/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from './domain/api/v1/authentication/guards/roles.guard';
import { AuthenticationService } from './domain/api/v1/authentication/authentication.service';
import { AppConfig } from './lib/config/config.provider';
import { GoogleAuthGuard } from './domain/api/v1/authentication/guards/google.guard';
import { SocialAuthenticationPayload } from './types';
import { SearchQueryDto } from './common/dtos/app.dtos';

@Controller()
export class AppController {
  private readonly appConfig = AppConfig;
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthenticationService,
  ) {}

  @Get()
  public async getIndex(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getIndex(req, res);
  }

  @Get('/page/unauthorized')
  public async get401(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getUnauthorized(req, res);
  }

  @Get('/page/access-denied')
  public async get403(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getForbidden(req, res);
  }

  @Get('/page/not-found')
  public async get404(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getNotFound(req, res);
  }

  @Get('/page/internal-server-error')
  public async get500(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getInternalServerError(req, res);
  }

  @Get('/login')
  public async getLogin(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getLogin(req, res);
  }

  @Get('/signup')
  public async getSignup(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getSignup(req, res);
  }

  @Get('/privacy')
  public async getPrivacy(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getPrivacy(req, res);
  }

  @Get('/auth/google')
  @UseGuards(GoogleAuthGuard)
  public async githubLogin() {}

  @UseGuards(GoogleAuthGuard)
  @Get('/auth/google/callback')
  public async githubCallback(@Req() req: Request, @Res() res: Response) {
    try {
      return await this.authService.validateSocialAuthUser(
        req.user as SocialAuthenticationPayload,
        res,
      );
    } catch (e) {
      throw new InternalServerErrorException(e);
    }
  }

  @UseGuards(AccessTokenGuard)
  @Get('/account/logout')
  public async getLogout(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getLogout(req, res);
  }

  @Get('/account/signup-successful')
  public async getSignupSuccessful(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getSignUpSuccessful(req, res);
  }

  @Get('/account/verification-successful')
  public async getVerificationSuccessful(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.appService.getVerificationSuccessful(req, res);
  }

  @Get('/account/verification')
  public async getVerification(
    @Req() req: Request,
    @Res() res: Response,
    @Query('token') token: string,
  ) {
    return await this.appService.getVerification(req, res, token);
  }

  @Get('/account/forgot-password')
  public async getForgotPassword(@Req() req: Request, @Res() res: Response) {
    return await this.appService.getForgotPassword(req, res);
  }

  @Get('/account/forgot-password/started')
  public async getForgotPasswordStarted(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.appService.getForgotPasswordStarted(req, res);
  }

  @Get('/account/reset-password')
  public async getResetPasswordByToken(
    @Req() req: Request,
    @Res() res: Response,
    @Query('token') token: string,
  ) {
    return await this.appService.getResetPasswordByToken(req, res, token);
  }

  @Get('/account/reset-confirmed')
  public async getResetPasswordConfirmed(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return await this.appService.getResetPasswordConfirmed(req, res);
  }

  @Get('/settings')
  public async getSettings(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getUserSettings(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace')
  public async getWorkspace(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspace(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/search')
  public async getWorkspaceSearch(
    @Req() req: RequestUser,
    @Query() query: SearchQueryDto,
  ) {
    return await this.appService.getWorkspaceSearchResults(req, query);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/bookmarks')
  public async searchWorkspaceBookmarkmarks(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceBookmarks(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/bookmarks/new')
  public async createWorkspaceBookmarks(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceBookmarksCreate(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/chats/new')
  public async getWorkspaceCreateNewChat(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceChatCreate(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/chats/:chatId')
  public async getWorkspaceChatsById(
    @Param('chatId', ParseUUIDPipe) chatId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceChatById(chatId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/chats/invitees/:inviteeId')
  public async createorFindWorkspaceChatForUserWithInvitee(
    @Req() req: RequestUser,
    @Res() res: Response,
    @Param('inviteeId', ParseUUIDPipe) inviteeId: string,
  ) {
    return await this.appService.createOrFindChatforUserWithInvitee(
      req,
      res,
      inviteeId,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs')
  public async getWorkspaceHubs(@Req() req: RequestUser, @Res() res: Response) {
    return await this.appService.getWorkspaceHubs(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/new')
  public async getWorkspaceHubsCreate(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubsCreate(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/add-invitee')
  public async getWorkspaceAddHubInvitee(
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubAddInvitee(req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId')
  public async getWorkspaceHubById(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubById(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId/edit')
  public async getWorkspaceHubsEdit(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubsEdit(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard)
  @Get('/workspace/hubs/:hubId/notes/new')
  public async getWorkspaceHubByIdAddNewNote(
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Req() req: RequestUser,
    @Res() res: Response,
  ) {
    return await this.appService.getWorkspaceHubCreateNewNote(hubId, req, res);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles(UserRole['OWNER'], UserRole['EDITOR'])
  @Get('/workspace/hubs/:hubId/notes/:noteId/edit')
  public async getWorkspaceHubByIdNoteByIdEdit(
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
  public async getWorkspaceHubInviteeEdit(
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
