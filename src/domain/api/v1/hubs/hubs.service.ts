import {
  MessageHelpers,
  AuthenticationHelpers,
  SiteHelpers,
} from '@/common/helpers/app.helpers';
import { MailerEvent } from '@/common/events/app.events';
import { PrismaService } from '@/infrastructure/gateways/database/prisma/prisma.service';
import { AuthenticationService } from '@/domain/api/v1/authentication/authentication.service';
import { RequestUser } from '@/interfaces';
import { APIResponse } from '@/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Hub, Invitee } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import {
  CreateHubDto,
  CreateHubNoteDto,
  InviteeToHubDto,
  UpdateHubDto,
  UpdateHubInviteeDto,
} from './dtos/hubs.dtos';
import { AppConfig } from '@/lib/config/config.provider';

@Injectable()
export class HubsService {
  private readonly logger = new Logger(HubsService.name);
  private readonly appConfig = AppConfig;
  private readonly siteHelpers = SiteHelpers;
  private readonly messageHelpers = MessageHelpers;
  private readonly authHelpers = AuthenticationHelpers;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly eventEmitter: EventEmitter2,
    private readonly authService: AuthenticationService,
  ) {}

  /**
   * Create a hub for an authenticated user;
   * @param {RequestUser} req The request object
   * @param {CreateHubDto} data The data needed to create a hub
   * @returns {Promise<Partial<APIResponse<Hub>>>} The returned hub
   */
  public async createHubByUserId(
    req: RequestUser,
    data: CreateHubDto,
  ): Promise<Partial<APIResponse<Hub>>> {
    this.logger.log(`Create hubs for user: ${req.user.sub}`);

    try {
      if (!req.user) {
        throw new UnauthorizedException(this.messageHelpers.HTTP_UNAUTHORIZED);
      }

      const hub = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
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
        type: 'success',
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
        context: `Create a hub for user ${req.user.sub}`,
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
    data: InviteeToHubDto,
  ): Promise<Partial<APIResponse<Invitee>>> {
    this.logger.log(`Invite a invitee to hub ${data.hubId}`);
    try {
      const invitee = await this.prisma.$transaction(async (tx) => {
        const foundHub = await tx.hub.findUnique({
          where: { id: data.hubId, userId: req.user.sub },
        });

        if (!foundHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const existingInvite = await tx.invitee.findFirst({
          where: {
            email: data.email,
            hubId: data.hubId,
          },
        });
        if (!existingInvite) {
          throw new Error(this.messageHelpers.USER_ALREADY_IN_HUB);
        }
        const newInvitee = await tx.invitee.create({
          data: {
            name: data.name,
            email: data.email,
            role: data.role,
            hub: { connect: { id: foundHub.id } },
          },
        });

        if (!newInvitee) {
          throw new Error(this.messageHelpers.CREATE_ACTION_FAILED);
        }

        const tokenId = v4();

        const accessToken = await this.authService.createToken(
          {
            sub: newInvitee.id,
            email: newInvitee.email,
            role: newInvitee.role,
          },
          tokenId,
          14400,
        );

        if (!accessToken) {
          throw new Error(
            `${this.messageHelpers.CREATE_ACTION_FAILED} - Token`,
          );
        }

        const tokenName = `invitee_access_token:${newInvitee.id}`;

        const updateInviteeWithAuthToken = await tx.invitee.update({
          where: {
            id: newInvitee.id,
          },
          data: {
            tokens: {
              create: [
                {
                  name: tokenName,
                  content: `${accessToken}--${tokenId}`,
                  expiryInMilliSecs: 14400000,
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

        return {
          token: accessToken,
          tokenId: tokenId,
          hubId: updateInviteeWithAuthToken.hubId,
          email: updateInviteeWithAuthToken.email,
        };
      });
      this.eventEmitter.emit(
        'user.email',
        new MailerEvent('base', {
          subject: 'Jetei Invitation to Hub',
          to: invitee.email,
          templatePath: './invitee-to-hub',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/login?type=invitee&token=${invitee.token}&tokenId=${invitee.tokenId}&redirectId=${invitee.hubId}` : `${this.appConfig.environment.NODE_ENV}/login?token=${invitee.token}&tokenId=${invitee.tokenId}&redirectId=${invitee.hubId}`}`,
          },
        }),
      );
      return {
        type: 'success',
        status_code: 201,
        api_message: `${invitee.email} was invited to your hub successfully`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Invite user to hub ${data.hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * Update an invitee to a hub
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @param {string} inviteeId The id of the invitee
   * @param {UpdateHubInviteeDto} data The data passed
   * @returns {Promise<Partial<APIResponse<any>>>}
   */
  public async updateAssigneeToHubById(
    req: RequestUser,
    hubId: string,
    inviteeId: string,
    data: UpdateHubInviteeDto,
  ): Promise<Partial<APIResponse<Invitee>>> {
    this.logger.log(`Update a invitee in hub ${data.hubId}`);
    try {
      const invitee = await this.prisma.$transaction(async (tx) => {
        const foundHub = await tx.hub.findUnique({
          where: { id: hubId, userId: req.user.sub },
        });

        if (!foundHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const existingInvitee = await tx.invitee.findUnique({
          where: {
            id: inviteeId,
            hubId: hubId,
          },
        });

        if (!existingInvitee) {
          throw new Error('User not in hub');
        }

        const updatedInvitee = await tx.invitee.update({
          where: {
            id: existingInvitee.id,
          },
          data: {
            name: data.name || existingInvitee.name,
            email: data.email || existingInvitee.email,
            role: data.role || existingInvitee.role,
          },
        });

        return updatedInvitee;
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `${invitee.name} details were updated successfully`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Update invitee user in hub ${data.hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * delete an invitee to a hub
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @param {string} inviteeId The id of the invitee
   * @param {UpdateHubInviteeDto} data The data passed
   * @returns {Promise<Partial<APIResponse<any>>>}
   */
  public async deleteAssigneeToHubById(
    req: RequestUser,
    hubId: string,
    inviteeId: string,
  ): Promise<Partial<APIResponse<Invitee>>> {
    this.logger.log(`Delete an invitee in hub ${hubId}`);
    try {
      const invitee = await this.prisma.$transaction(async (tx) => {
        const foundHub = await tx.hub.findUnique({
          where: { id: hubId, userId: req.user.sub },
        });

        if (!foundHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const existingInvitee = await tx.invitee.findUnique({
          where: {
            id: inviteeId,
            hubId: hubId,
          },
        });

        if (!existingInvitee) {
          throw new Error('User not in hub');
        }

        const deleteInvitee = await tx.invitee.delete({
          where: {
            id: existingInvitee.id,
          },
        });

        return deleteInvitee;
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Invitee deleted successfully`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Delete invitee user in hub ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * Get the authenticated user hubs
   * @param req The request object
   * @returns {Promise<Partial<APIResponse<Array<Hub>>>>} The user hubs
   */
  public async getUserHubs(
    req: RequestUser,
  ): Promise<Partial<APIResponse<Array<Hub>>>> {
    this.logger.log(`Get user hubs by userId ${req.user.sub}`);
    try {
      const hubs = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
          },
          include: {
            hubs: true,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }

        if (!foundUser.hubs) {
          return null;
        }
        return foundUser.hubs;
      });
      return {
        type: 'success',
        status_code: 200,
        data: hubs,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        context: `Get user hubs by userId ${req.user.sub}`,
        error: e,
      });
      throw new BadRequestException(
        this.messageHelpers.RETRIEVAL_ACTION_FAILED,
      );
    }
  }

  /**
   * Get a user hub details by id
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @returns {Promise<Partial<APIResponse<Hub>>>} The matched hub with its details
   */
  public async getUserHubDetailsById(
    req: RequestUser,
    hubId: string,
  ): Promise<Partial<APIResponse<Hub>>> {
    this.logger.log(
      `Get the details of a user hub with userId ${req.user.sub} and hubId ${hubId}`,
    );
    try {
      const hub = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }

        const foundUserHub = await tx.hub.findUnique({
          where: {
            userId: foundUser.id,
            id: hubId,
          },
          include: {
            invitee: true,
          },
        });

        if (!foundUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }
        return foundUserHub;
      });
      return {
        type: 'success',
        status_code: 200,
        data: hub,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        context: `Get user hub with id ${hubId}`,
        error: e,
      });
      throw new BadRequestException(
        this.messageHelpers.RETRIEVAL_ACTION_FAILED,
      );
    }
  }

  /**
   * Edit a user hub details by id
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @returns {Promise<Partial<APIResponse<any>>>} The matched hub with its details
   */
  public async editUserHubDetailsById(
    req: RequestUser,
    hubId: string,
    data: UpdateHubDto,
  ): Promise<Partial<APIResponse<any>>> {
    this.logger.log(
      `Edit the details of a user hub with userId ${req.user.sub} and hubId ${hubId}`,
    );
    try {
      const hub = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }

        const foundUserHub = await tx.hub.findUnique({
          where: {
            userId: foundUser.id,
            id: hubId,
          },
        });

        if (!foundUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const updatedUserHub = await tx.hub.update({
          where: {
            id: foundUserHub.id,
          },
          data: {
            name: data.name || foundUserHub.name,
            description: data.description || foundUserHub.description,
          },
        });

        if (!updatedUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }
        return updatedUserHub;
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Your Hub ${hub.name} was successfully updated`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.UPDATE_ACTION_FAILED, {
        context: `Update user hub with id ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.UPDATE_ACTION_FAILED);
    }
  }

  /**
   * Removes a user hub
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of hub
   * @returns {Promise<Partial<APIResponse<any>>>}
   */
  public async deleteUserHubById(
    req: RequestUser,
    hubId: string,
  ): Promise<Partial<APIResponse<any>>> {
    this.logger.log(
      `Delete hub with userid ${req.user.sub} and hubId ${hubId}`,
    );
    try {
      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }

        const foundUserHubToBeDeleted = await tx.hub.delete({
          where: {
            userId: foundUser.id,
            id: hubId,
          },
        });

        if (!foundUserHubToBeDeleted) {
          throw new Error(
            `${this.messageHelpers.RETRIEVAL_ACTION_FAILED} and ${this.messageHelpers.DELETE_ACTION_FAILED}`,
          );
        }
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: 'Your hub has been deleted successfully',
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.DELETE_ACTION_FAILED, {
        context: `Delete user hub with id ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.DELETE_ACTION_FAILED);
    }
  }

  /**
   * Edit a user hub details by id
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @returns {Promise<Partial<APIResponse<any>>>} The matched hub with its details
   */
  public async createHubNoteById(
    req: RequestUser,
    hubId: string,
    data: CreateHubNoteDto,
  ): Promise<Partial<APIResponse<any>>> {
    this.logger.log(
      `Create a note for hub with userId ${req.user.sub} and hubId ${hubId}`,
    );
    try {
      const hub = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
        }

        const foundUserHub = await tx.hub.findUnique({
          where: {
            userId: foundUser.id,
            id: hubId,
          },
        });

        if (!foundUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const updatedUserHubWithNote = await tx.hub.update({
          where: {
            id: foundUserHub.id,
          },
          data: {
            notes: {
              create: {
                name: data.name,
                createdById: foundUser.id,
              },
            },
          },
        });

        if (!updatedUserHubWithNote) {
          throw new Error(
            `${this.messageHelpers.HUB_NOT_FOUND} - unable to create note`,
          );
        }
        return updatedUserHubWithNote;
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Your Hub ${hub.name} was successfully updated`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Updated user hub with id ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }
}
