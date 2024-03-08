/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  AuthenticationHelpers,
  MessageHelpers,
  SiteHelpers,
} from '@/common/helpers/app.helpers';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { Operation, OperationType } from '@/interfaces';
import { Document, JwtPayload, Message } from '@/types';
import { Chat, Note } from '@prisma/client';
import { OperationalTransformationService } from '@/common/services/app.services';
import { v4 } from 'uuid';
import { AppConfig } from '@/lib/config/config.provider';

@WebSocketGateway(AppConfig.environment.WS_PORT, {
  cors: {
    origin: ['*'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly authHelpers = AuthenticationHelpers;
  private readonly siteHelpers = SiteHelpers;
  private readonly messageHelpers = MessageHelpers;
  private connectedUsers: { [userId: string]: Socket } = {};
  private userPreference: { id: string; name: string } | null = null;
  private MAX_CONNECTIONS = 2;
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly otService: OperationalTransformationService,
  ) {}

  @WebSocketServer()
  server: Server;

  public async handleConnection(@ConnectedSocket() socket: Socket) {
    this.logger.log('Creating user in WS Connection');
    try {
      if (Object.keys(this.connectedUsers).length >= this.MAX_CONNECTIONS) {
        socket.emit(
          'error',
          'Maximum connections reached. Please try again later.',
        );
        socket.disconnect();
        return;
      }

      const cookies = socket.handshake.headers.cookie;
      const parsedCookies = this.authHelpers.parseAccessCookies(cookies);
      const token = parsedCookies.accessToken;
      const tokenId = parsedCookies.accessTokenId;
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        jwtid: tokenId,
        secret: AppConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          profile: true,
        },
      });

      if (!user) {
        throw new Error(this.messageHelpers.USER_ACCOUNT_NOT_EXISTING);
      }

      if (!this.userPreference) {
        this.userPreference = { id: user.id, name: user.profile.name };
      }

      socket.data.user = { id: user.id, name: user.profile.name };

      this.connectedUsers[user.id] = socket;
      this.server.emit('connectedUser', socket.data.user);
      this.logger.debug(`User: ${socket.data.user.id} connected via WS`);
      this.logger.debug(`Setting user preference to: ${socket.data.user.id}`);
      this.logger.debug(
        `Client connected. Total connections: ${Object.keys(this.connectedUsers).length}`,
      );
    } catch (e) {
      this.logger.error(this.messageHelpers.USER_VALIDATION_FAILED, {
        context: 'Failed to get user info via ws',
        error: e,
      });
      socket.disconnect();
      throw new WsException(this.messageHelpers.USER_VALIDATION_FAILED);
    }
  }

  handleDisconnect(@ConnectedSocket() socket: Socket) {
    this.logger.log('Disconnecting user from WS Connection');
    try {
      const user: { id: string; name: string } = socket.data.user;
      delete this.connectedUsers[user.id];
      this.server.emit('userDisconnected', user);
      this.logger.debug(`User: ${user.id} disconnected from WS`);
      this.logger.debug(
        `Client disconnected. Total connections: ${Object.keys(this.connectedUsers).length}`,
      );
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to disconnect user',
        error: e,
      });
      throw new WsException(this.messageHelpers.UNEXPECTED_RESULT);
    }
  }

  @SubscribeMessage('viewMessage')
  async handleViewMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { userId: string; userName: string; message: string },
  ) {
    socket.emit('newMessage', {
      userId: payload.userId,
      userName: payload.userName,
      content: payload.message,
      isRead: false,
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { message: string; chatId: string | null; participantId: string },
  ) {
    try {
      const message: Message = await this.prisma.$transaction(async (tx) => {
        let newChat: Chat | null;
        // Check if chat exist between user and participant else create
        const existingChat = await tx.chat.findFirst({
          where: {
            userId: socket.data.user.id,
            chatParticipant: {
              some: {
                participantId: payload.participantId,
                chatId: payload.chatId,
              },
            },
          },
        });

        if (!existingChat) {
          newChat = await tx.chat.create({
            data: {
              userId: socket.data.user.id,
              chatParticipant: {
                create: {
                  participantId: payload.participantId,
                },
              },
            },
          });
        }

        const newMessage = await tx.message.create({
          data: {
            content: payload.message,
            chatId: existingChat.id || newChat.id,
            senderId: socket.data.user.id,
          },
        });

        return {
          content: newMessage.content,
          sent: this.siteHelpers.formatDateTimeWithTimezone(
            newMessage.createdAt,
          ),
        };
      });
      socket.broadcast.emit('sendNewMessage', {
        sender: socket.data.user.name,
        payload: message,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to send message',
        error: e,
      });
      throw new WsException(this.messageHelpers.UNEXPECTED_RESULT);
    }
  }

  @SubscribeMessage('sendMarkdown')
  async handleMarkdown(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { markdown: string },
  ) {
    try {
      const document = new Document(payload.markdown);
      const renderedHTML = this.siteHelpers.markdownToHtml(
        document.getContent(),
      );
      this.server.emit('renderedMarkdown', {
        html: renderedHTML,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to parse markdown',
        error: e,
      });
      throw new WsException(this.messageHelpers.UNEXPECTED_RESULT);
    }
  }

  @SubscribeMessage('saveMarkdown')
  async handleSaveMarkdown(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      noteId: string;
      markdown: string;
      opType: OperationType | null;
      posInDocument: number | null;
    },
  ) {
    try {
      let note: { markdown: string; text: string; html: string };
      const document = new Document(payload.markdown);
      if (Object.keys(this.connectedUsers).length === 1) {
        note = await this.prisma.$transaction(async (tx) => {
          const foundNote = await tx.note.findUnique({
            where: {
              id: payload.noteId,
            },
          });

          if (!foundNote) {
            throw new Error(this.messageHelpers.RETRIEVAL_ACTION_FAILED);
          }

          const text = this.siteHelpers.stripHtmlPreservingStructure(
            this.siteHelpers.markdownToHtml(document.getContent()),
          );

          if (!text) {
            throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
          }

          const updatedNote = await tx.note.update({
            where: {
              id: payload.noteId,
            },
            data: {
              markdown: document.getContent(),
              text: text,
              updatedById: socket.data.user.id,
            },
          });

          if (!updatedNote) {
            throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
          }

          return {
            markdown: document.getContent(),
            text: updatedNote.text,
            html: this.siteHelpers.markdownToHtml(document.getContent()),
          };
        });
      } else if (Object.keys(this.connectedUsers).length === 2) {
        let opArr: Operation[];
        for (const userId of Object.keys(this.connectedUsers)) {
          const op: Operation = {
            id: v4(),
            document: document,
            type: payload.opType,
            position: payload.posInDocument,
            preferredUserId: this.userPreference.id,
            userId: userId,
          };
          opArr.push(op);
        }
        const otOp = await this.otService.transformOperation(
          opArr[0],
          opArr[1],
        );
        note = {
          markdown: otOp.document.getContent(),
          html: this.siteHelpers.markdownToHtml(otOp.document.getContent()),
          text: this.siteHelpers.stripHtmlPreservingStructure(
            this.siteHelpers.markdownToHtml(otOp.document.getContent()),
          ),
        };
        await this.prisma.note.update({
          where: {
            id: payload.noteId,
          },
          data: {
            markdown: note.markdown,
            text: note.text,
            updatedById: socket.data.user.id,
          },
        });
      }
      socket.broadcast.emit('savedMarkdown', {
        senderId: socket.data.user.id,
        payload: note,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to save markdown',
        error: e,
      });
      throw new WsException(this.messageHelpers.UNEXPECTED_RESULT);
    }
  }
}
