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
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrefixedController } from '@/common/decorators/app.decorators';
import { AuthenticatedGuard } from '@/domain/api/v1/authentication/guards/authenticated.guard';
import { RequestUser } from '@/interfaces';
import { HubsService } from './hubs.service';
import { CreateHubDto, InviteeToHubDto } from './dtos/hubs.dtos';

@PrefixedController('hubs')
export class HubsController {
  constructor(private readonly hubsService: HubsService) {}

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.OK)
  @Get()
  public async getUserHubs(@Req() req: RequestUser) {}

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.OK)
  @Get(':hubId')
  public async getUserHubById(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
  ) {}

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  public async createHubByUserId(
    @Req() req: RequestUser,
    @Body() body: CreateHubDto,
  ) {
    return await this.hubsService.createHubByUserId(
      req,
      body as Prisma.HubCreateInput,
    );
  }

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post(':hubId/invite-users')
  public async addInviteeToHubByHubId(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
    @Body() body: InviteeToHubDto,
  ) {
    return await this.hubsService.inviteToHubByIdAssignees(req, hubId, body);
  }

  @UseGuards(AuthenticatedGuard)
  @HttpCode(HttpStatus.OK)
  @Delete(':hubId')
  public async deleteHubById(
    @Req() req: RequestUser,
    @Param('hubId', ParseUUIDPipe) hubId: string,
  ) {}
}
