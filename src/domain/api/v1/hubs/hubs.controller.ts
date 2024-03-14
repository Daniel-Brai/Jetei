import {
  Body,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { PrefixedController } from '@/common/decorators/app.decorators';
import { RequestUser } from '@/interfaces';
import { HubsService } from './hubs.service';
import {
  CreateHubDto,
  CreateHubNoteDto,
  InviteeToHubDto,
  UpdateHubDto,
  UpdateHubInviteeDto,
} from './dtos/hubs.dtos';
import { AccessTokenGuard } from '../authentication/guards/access-token.guard';

@PrefixedController('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/add-invitee')
  public async addInviteeToHubByHubId(
    @Req() req: RequestUser,
    @Body() body: InviteeToHubDto,
  ) {
    return await this.hubsService.inviteToHubByIdAssignees(req, body);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/latest-notes-and-chats')
  public async getLatestNotesAndChats(@Req() req: RequestUser) {
    return await this.hubsService.getUserLatestNotesAndChats(req);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  public async getUserHubs(@Req() req: RequestUser) {
    return await this.hubsService.getUserHubs(req);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createHubByUserId(
    @Req() req: RequestUser,
    @Body() body: CreateHubDto,
  ) {
    return await this.hubsService.createHubByUserId(req, body);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Get('/:hubId')
  public async getUserHubById(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
  ) {
    return await this.hubsService.getUserHubDetailsById(req, hubId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Patch('/:hubId')
  public async editUserHubById(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Body() body: UpdateHubDto,
  ) {
    return await this.hubsService.editUserHubDetailsById(req, hubId, body);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Delete('/:hubId')
  public async deleteHubById(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
  ) {
    return await this.hubsService.deleteUserHubById(req, hubId);
  }

  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post('/:hubId/notes')
  public async createHubNoteByHubId(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Body() body: CreateHubNoteDto,
  ) {
    return await this.hubsService.createHubNoteById(req, hubId, body);
  }

  @UseGuards(AccessTokenGuard)
  @Patch('/:hubId/invitees/:inviteeId')
  @HttpCode(HttpStatus.OK)
  public async editHubInviteeByHubId(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Param('inviteeId', ParseUUIDPipe) inviteeId: string,
    @Body() body: UpdateHubInviteeDto,
  ) {
    return await this.hubsService.updateAssigneeToHubById(
      req,
      hubId,
      inviteeId,
      body,
    );
  }

  @UseGuards(AccessTokenGuard)
  @Delete('/:hubId/invitees/:inviteeId')
  @HttpCode(HttpStatus.OK)
  public async deleteHubInviteeByHubId(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Param('inviteeId', ParseUUIDPipe) inviteeId: string,
  ) {
    return await this.hubsService.deleteAssigneeToHubById(
      req,
      hubId,
      inviteeId,
    );
  }
}
