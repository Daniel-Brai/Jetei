import {
  MessageHelpers,
  AuthenticationHelpers,
} from '@/common/helpers/app.helpers';
import { PrismaService } from '@/infrastructure/gateways/database/prisma/prisma.service';
import { RequestUser } from '@/interfaces';
import { APIResponse } from '@/types';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Hub, Invitee, Prisma } from '@prisma/client';
import { InviteeToHubDto } from './dtos/hubs.dtos';

@Injectable()
export class HubsService {
  private readonly logger = new Logger(HubsService.name);
  private readonly messageHelpers = MessageHelpers;
  private readonly authHelpers = AuthenticationHelpers;
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a hub for an authenticated user;
   * @param {RequestUser} req The request object
   * @param {Prisma.HubCreateWithoutInviteeInput} data The data needed to create a hub
   */
  public async createHubByUserId(
    req: RequestUser,
    data: Prisma.HubCreateWithoutInviteeInput,
  ): Promise<Partial<APIResponse<Hub>>> {
    this.logger.log(`Create hubs for user: ${req.user.id}`);

    try {
      if (!req.user) {
        throw new UnauthorizedException(this.messageHelpers.HTTP_UNAUTHORIZED);
      }

      const hub = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.id,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }
        const newHub = await tx.hub.create({
          select: {
            id: true,
            name: true,
            description: true,
            user: true,
          },
          data: {
            name: data.name,
            description: data.description,
            userId: foundUser.id,
          },
        });

        if (!newHub) {
          throw new Error(this.messageHelpers.CREATE_ACTION_FAILED);
        }
        return newHub;
      });
      return {
        status_code: 201,
        api_message: `Your Hub ${hub.name} was created successfully`,
        data: {
          id: hub.id,
          name: hub.name,
          description: hub.description,
        },
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Create a hub for user ${req.user.id}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * Invite a user by email to hub
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @param {InviteeToHubDto} data The data passed
   * @returns {Promise<Partial<APIResponse<Invitee>>>}
   */
  public async inviteToHubByIdAssignees(
    req: RequestUser,
    hubId: string,
    data: InviteeToHubDto,
  ): Promise<Partial<APIResponse<Invitee>>> {
    this.logger.log(`Invite a invitee to hub ${hubId}`);
    try {
      const invitee = await this.prisma.$transaction(async (tx) => {
        const foundHub = await tx.hub.findUnique({
          where: { id: hubId, userId: req.user.id },
        });

        if (!foundHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }
        const existingInvite = await tx.invitee.findFirst({
          where: {
            email: data.email,
            hubId: hubId,
          },
        });
        if (!existingInvite) {
          throw new Error(this.messageHelpers.USER_ALREADY_IN_HUB);
        }
        const newInvitee = await tx.invitee.create({
          data: {
            email: data.email,
            role: data.role,
            hub: { connect: { id: foundHub.id } },
          },
        });

        if (!newInvitee) {
          throw new Error(this.messageHelpers.CREATE_ACTION_FAILED);
        }

        const expiryTimeInSecs = 14400;

        const expiryTimeInSecondstoElaspedFromNow =
          this.authHelpers.getEpochSecondsFromCreatedAt(
            new Date().toISOString(),
          ) + expiryTimeInSecs;

        const jwtToken = await this.authHelpers.signPayload(
          { id: newInvitee.id, email: newInvitee.email },
          {
            expiry_time_in_secs: expiryTimeInSecs,
            subject: 'Jetei Invitee JWT Token',
          },
        );

        if (!jwtToken) {
          throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
        }

        const tokenName = `invitee_token:${newInvitee.id}`;

        const updateInviteeWithAuthToken = await tx.invitee.update({
          where: {
            id: newInvitee.id,
          },
          data: {
            tokens: {
              create: [
                {
                  name: tokenName,
                  content: jwtToken,
                  expiryTimeInSecsToBeElaspedFromNow:
                    expiryTimeInSecondstoElaspedFromNow,
                },
              ],
            },
          },
          include: {
            tokens: true,
          },
        });
        if (!updateInviteeWithAuthToken) {
          throw new Error(this.messageHelpers.UPDATE_ACTION_FAILED);
        }
        return updateInviteeWithAuthToken;
      });
      return {
        status_code: 201,
        api_message: `${invitee.email} was invited to your hub successfully`,
        data: {
          id: invitee.id,
          hubId: invitee.hubId,
          email: invitee.email,
          role: invitee.role,
        },
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Invite user to hub ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }
}
