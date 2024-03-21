import {
  MessageHelpers,
  AuthenticationHelpers,
  SiteHelpers,
} from '@/common/helpers/app.helpers';
import { MailerEvent } from '@/common/events/app.events';
import { PrismaService } from '@/infrastructure/gateways/database/prisma/prisma.service';
import { AuthenticationService } from '@/domain/api/v1/authentication/authentication.service';
import { RequestUser } from '@/interfaces';
import { APIResponse, HubDocument } from '@/types';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Hub, Invitee, Note, Prisma } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { v4, validate } from 'uuid';
import {
  CreateHubDto,
  CreateHubNoteDto,
  CreateNoteLinkDto,
  InviteeToHubDto,
  UpdateHubDto,
  UpdateHubInviteeDto,
} from './dtos/hubs.dtos';
import { AppConfig } from '@/lib/config/config.provider';
import { CloudinaryService } from '@/lib/cloudinary/cloudinary.service';

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
    private readonly cloudinaryService: CloudinaryService,
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
            documents: [],
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
        api_message: `Hub was created successfully`,
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

        const existingInvite = await tx.invitee.findUnique({
          where: {
            email: data.email,
            hubId: data.hubId,
          },
        });

        if (existingInvite) {
          throw new Error(this.messageHelpers.USER_ALREADY_IN_HUB);
        }

        const newInvitee = await tx.invitee.create({
          data: {
            name: data.name,
            email: data.email,
            role: data.role,
            hubId: foundHub.id,
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
          2419200,
        );

        if (!accessToken) {
          throw new Error(
            `${this.messageHelpers.CREATE_ACTION_FAILED} - Token`,
          );
        }

        const tokenName = `invitee_access_token:${newInvitee.id}`;

        const updateInviteeWithAuthToken = await tx.authToken.create({
          data: {
            name: tokenName,
            content: `${accessToken}--${tokenId}`,
            expiryInMilliSecs: '2419200000',
            inviteeId: newInvitee.id,
          },
        });
        if (!updateInviteeWithAuthToken) {
          throw new Error(this.messageHelpers.UPDATE_ACTION_FAILED);
        }

        return {
          token: `${accessToken}--${tokenId}`,
          hubId: newInvitee.hubId,
          hubName: foundHub.name,
          email: newInvitee.email,
          name: newInvitee.name,
        };
      });
      this.eventEmitter.emit(
        'user.email',
        new MailerEvent('base', {
          subject: 'Jetei Invitation to Hub',
          to: invitee.email,
          templatePath: './invitee-to-hub',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/login?type=member&token=${invitee.token}&to=${invitee.hubId}` : `${this.appConfig.environment.PROD_URL}/login?type=member&token=${invitee.token}&to=${invitee.hubId}`}`,
            hub: invitee.hubName,
          },
        }),
      );
      return {
        type: 'success',
        status_code: 201,
        api_message: `${invitee.name} invited successfully`,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Invite user to hub ${data.hubId}`,
        error: e,
      });
      throw new BadRequestException(e);
    }
  }

  /**
   * Get invitee details
   * @param {string} hubId The id of the hub
   * @param {string} inviteeId The id of the invitee
   * @returns {Promise<APIResponse<any>>} The API Response
   */
  public async getInviteeDetails(
    hubId: string,
    inviteeId: string,
  ): Promise<APIResponse<any>> {
    this.logger.log(`Get invitee details`);
    try {
      const existingInvitee = await this.prisma.invitee.findUnique({
        where: {
          id: inviteeId,
          hubId: hubId,
        },
      });

      if (!existingInvitee) {
        throw new Error('User not in hub');
      }

      return {
        type: 'success',
        status_code: 200,
        data: {
          id: existingInvitee.id,
          email: existingInvitee.email,
          name: existingInvitee.name,
          role: existingInvitee.role,
        },
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        context: `Get invitee for ${hubId}`,
        error: e,
      });
      throw new BadRequestException(e);
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
      await this.prisma.$transaction(async (tx) => {
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

        if (!deleteInvitee) {
          throw new Error('Failed to delete invitee');
        }
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
   * Upload file from user
   * @param {RequestUser} req The request object
   * @param {string} hubId The id of the hub
   * @param {Express.Multer.File} file The file to uploaded
   * @returns {string} The url of the uploaded file
   */
  public async userHubUploadFile(
    req: RequestUser,
    file: Express.Multer.File,
    hubId?: string,
    to?: string,
  ): Promise<{ url: string }> {
    this.logger.log(
      `Uploading file: ${file.originalname} from user ${req.user.sub}`,
    );

    try {
      let uploadedFileUrl: { url: string };
      let extIcon: string;

      if (file.size > 25 * 1024 * 1024) {
        throw new Error('File size exceeds 25MB');
      }

      if (
        hubId !== null &&
        validate(hubId) &&
        to !== null &&
        to === 'documents'
      ) {
        const foundUserHub = await this.prisma.hub.findUnique({
          where: {
            id: hubId,
          },
        });

        if (!foundUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const uploadedFile =
          await this.cloudinaryService.uploadFileByContentType(
            req.user.sub,
            [
              'image/jpeg',
              'image/png',
              'image/webp',
              'application/pdf',
              'text/markdown',
              'text/plain',
            ],
            file,
          );

        const image_icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file-image"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><circle cx="10" cy="12" r="2"/><path d="m20 17-1.296-1.296a2.41 2.41 0 0 0-3.408 0L9 22"/></svg>';
        const file_icon =
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>';

        const pathParts = uploadedFile.split('/');
        const fileName = pathParts[pathParts.length - 1];
        const [name, ext] = fileName.split('.');

        if (
          ext === 'jpeg' ||
          ext === 'png' ||
          ext === 'jpeg' ||
          ext === 'webp'
        ) {
          extIcon = image_icon;
        } else {
          extIcon = file_icon;
        }

        const data: HubDocument[] = [
          {
            key: name,
            fileName: fileName,
            url: uploadedFile,
            extIcon: extIcon,
          },
        ];

        let foundDocuments = foundUserHub.documents as Prisma.JsonArray;

        foundDocuments =
          foundDocuments.length === 0 ? [] : (foundDocuments as HubDocument[]);

        const newDocuments = foundDocuments.concat(data);

        const updatedHubDocuments = await this.prisma.hub.update({
          where: {
            id: foundUserHub.id,
          },
          data: {
            documents: newDocuments,
          },
        });

        if (!updatedHubDocuments) {
          throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
        }

        uploadedFileUrl = { url: uploadedFile };
      } else {
        if (file.size > 25 * 1024 * 1024) {
          throw new Error('File size exceeds 25MB');
        }

        const uploadedFile =
          await this.cloudinaryService.uploadFileByContentType(
            req.user.sub,
            [
              'image/jpeg',
              'image/png',
              'image/webp',
              'application/pdf',
              'text/markdown',
              'text/plain',
            ],
            file,
          );
        uploadedFileUrl = { url: uploadedFile };
      }
      return uploadedFileUrl;
    } catch (e) {
      this.logger.error('Failed to upload file', {
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Delete a file from a user hub
   * @param {RequestUser} req The request obj
   * @param {string} hubId The id of the hub
   * @param {string} fileId The public id of the file on cloudinary
   * @param {string} from The place deletion should take place
   * @return {Promise<{message: string}>} The API response if successful
   */
  public async deleteFileFromHub(
    req: RequestUser,
    hubId: string,
    fileId: string,
    from: string,
  ) {
    this.logger.log(`Deleting file ${fileId}...`);

    try {
      let result: { message: string };
      if (from !== null && from === 'documents') {
        const foundUserHub = await this.prisma.hub.findUnique({
          where: {
            id: hubId,
          },
        });

        if (!foundUserHub) {
          throw new Error(this.messageHelpers.HUB_NOT_FOUND);
        }

        const deletedFile = await this.cloudinaryService.deleteFileByPublicId(
          req.user.sub,
          fileId,
        );

        const foundDocuments = foundUserHub.documents as Prisma.JsonArray;

        if (foundDocuments.length === 0) {
          throw new Error('No documents found');
        }

        const updatedDocuments = foundDocuments.filter(
          (doc: HubDocument) => doc.key !== fileId,
        ) as HubDocument[];

        const updatedHubDocuments = await this.prisma.hub.update({
          where: {
            id: foundUserHub.id,
          },
          data: {
            documents: updatedDocuments,
          },
        });

        if (!updatedHubDocuments) {
          throw new Error('Failed to update hubs documents');
        }

        result = deletedFile;
      } else {
        const deletedFile = await this.cloudinaryService.deleteFileByPublicId(
          req.user.sub,
          fileId,
        );
        result = deletedFile;
      }
      return result;
    } catch (e) {
      this.logger.error('Failed to delete file', {
        error: e,
      });
      throw new BadRequestException('Failed to delete file');
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
            notes: {
              orderBy: {
                updatedAt: 'desc',
              },
            },
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
        details: {
          path: req.url.split('/api/v1')[1],
        },
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
   * GEt the latest chats and notes
   * @param req The request object
   * @returns {Promise<APIResponse<{notes: any[], chats: any[]}>>} The latest two notes and chats
   */
  public async getUserLatestNotesAndChats(
    req: RequestUser,
  ): Promise<APIResponse<{ notes: any[]; chats: any[] }>> {
    this.logger.log(
      `Get the latest two notes and chats for user: ${req.user.sub}`,
    );
    try {
      const data = await this.prisma.$transaction(async (tx) => {
        const userId = req.user.sub;
        const foundUserNotes = await tx.hub.findMany({
          distinct: ['id'],
          take: 2,
          orderBy: {
            notes: {
              _count: 'desc',
            },
          },
          include: {
            notes: {
              take: 1,
              orderBy: {
                updatedAt: 'desc',
              },
            },
          },
        });

        const chatsWithMessages = await tx.chatParticipant.findMany({
          distinct: ['id'],
          where: { userId: userId },
          include: {
            chats: {
              include: {
                messages: {
                  include: {
                    sender: {
                      include: {
                        user: {
                          select: {
                            id: true,
                            email: true,
                            profile: true,
                          },
                        },
                        invitee: {
                          select: { id: true, email: true, name: true },
                        },
                      },
                    },
                  },
                },
              },
            },
            user: {
              select: {
                id: true,
                email: true,
                profile: true,
              },
            },
            invitee: { select: { id: true, email: true, name: true } },
          },
        });
        return { hubs: foundUserNotes, chats: chatsWithMessages };
      });
      return {
        type: 'success',
        status_code: 200,
        data: data,
      };
    } catch (e) {
      console.log('Error: ', e);
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        context: `Get latest notes and chat for user: ${req.user.sub}`,
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
  public async createHubNoteById(
    req: RequestUser,
    hubId: string,
    data: CreateHubNoteDto,
  ): Promise<Partial<APIResponse<Note>>> {
    this.logger.log(
      `Create a note for hub with userId ${req.user.sub} and hubId ${hubId}`,
    );
    try {
      const note = await this.prisma.$transaction(async (tx) => {
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
                updatedById: foundUser.id,
              },
            },
          },
        });

        if (!updatedUserHubWithNote) {
          throw new Error(
            `${this.messageHelpers.HUB_NOT_FOUND} - unable to create note`,
          );
        }

        const newHubNote = await tx.note.findMany({
          where: {
            hubId: foundUserHub.id,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        });

        if (!newHubNote) {
          throw new Error(this.messageHelpers.RETRIEVAL_ACTION_FAILED);
        }

        return newHubNote;
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Your note was successfully created`,
        data: note,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        context: `Updated user hub with id ${hubId}`,
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * Create a note link
   * @param {RequestUser} req The request object
   * @param {CreateNoteLinkDto} data The data passed to create a note link
   * @returns {Promise<APIResponse<any>>} The API Response
   */
  public async createNoteLink(
    req: RequestUser,
    data: CreateNoteLinkDto,
  ): Promise<APIResponse<any>> {
    this.logger.log(
      `Creating note link for user ${req.user.sub} on note ${data.sourceNoteId}`,
    );

    try {
      const foundLink = await this.prisma.link.findUnique({
        where: {
          sourceNoteId: data.sourceNoteId,
          targetNoteId: data.targetNoteId,
        },
      });

      if (foundLink) {
        throw new Error('Notes are already linked');
      }

      const newLink = await this.prisma.link.create({
        data: {
          sourceNoteId: data.sourceNoteId,
          targetNoteId: data.targetNoteId,
          createdById: req.user.sub,
        },
      });

      if (!newLink) {
        throw new Error('Failed to create note link');
      }

      return {
        status_code: 200,
        type: 'success',
        api_message: 'Link created',
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.CREATE_ACTION_FAILED, {
        error: e,
      });
      throw new BadRequestException(this.messageHelpers.CREATE_ACTION_FAILED);
    }
  }

  /**
   * Get the note links
   * @param {string} hubId The id of the hub
   * @param {string} noteId The id of the note
   * @returns {Promise<APIResponse<any>>} The API Response
   */
  public async getNoteLinks(
    req: RequestUser,
    noteId: string,
  ): Promise<APIResponse<any>> {
    this.logger.log(`Get the links for note ${noteId}`);

    try {
      const foundLinks = await this.prisma.note.findUnique({
        where: {
          id: noteId,
          OR: [{ createdById: req.user.sub }, { updatedById: req.user.sub }],
        },
        include: {
          links: {
            include: {
              targetNote: true,
            },
          },
        },
      });

      if (!foundLinks) {
        throw new Error('Failed to fetch note links');
      }

      return {
        status_code: 200,
        type: 'success',
        data: foundLinks,
      };
    } catch (e) {
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        error: e,
      });
      throw new BadRequestException(
        this.messageHelpers.RETRIEVAL_ACTION_FAILED,
      );
    }
  }
}
