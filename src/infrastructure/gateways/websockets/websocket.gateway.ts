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
import { OperationalTransformationService } from '@/common/services/app.services';
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
  private userPreference: {
    id: string;
    name: string;
  } | null = null;
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
        this.userPreference = {
          id: user.id,
          name: user.profile.name,
        };
      }

      socket.data.user = { id: user.id, name: user.profile.name };

      this.connectedUsers[user.id] = socket;
      this.server.emit('userConnected', { socketId: socket.id });
      this.logger.debug(`User: ${socket.data.user.id} connected via WS`);
      this.logger.debug(`Setting user preference to: ${socket.data.user.id}`);
      this.logger.debug(
        `Client connected. Total connections: ${Object.keys(this.connectedUsers).length}`,
      );
      this.server.emit('userCount', {
        users: Object.keys(this.connectedUsers),
        user: { id: user.id, name: user.profile.name, status: 'Active' },
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.USER_VALIDATION_FAILED, {
        context: 'Failed to get user info via ws',
        error: e,
      });
      socket.emit('error', {
        message: this.messageHelpers.USER_VALIDATION_FAILED,
        authorized: false,
      });
      socket.disconnect();
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
      socket.emit('error', {
        message: this.messageHelpers.USER_VALIDATION_FAILED,
      });
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

  @SubscribeMessage('handleUserInfo')
  async handleUserInfo(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { userId: string; color: string },
  ) {
    const data = await this.prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      include: {
        profile: true,
      },
    });
    if (data) {
      socket.emit('receiveUserInfo', {
        id: data.id,
        socketId: socket.id,
        name: data.profile.name,
        color: payload.color,
      });
    } else {
      socket.emit('error', {
        message: 'Failed to receive client info',
      });
    }
  }

  @SubscribeMessage('readMessage')
  async handleReadMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { chatId: string; messageId: string },
  ) {
    try {
      const updateMessage = await this.prisma.message.update({
        where: {
          id: payload.messageId,
          chatId: payload.messageId,
        },
        data: {
          readAt: new Date(Date.now()),
          isRead: true,
        },
      });

      if (!updateMessage) {
        throw new Error('Unable to read message');
      }
    } catch (e) {
      socket.emit('error', {
        message: 'Failed to read message',
      });
    }
  }

  @SubscribeMessage('preloadMessages')
  async handlePreloadMessages(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { chatId: string },
  ) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: {
          id: payload.chatId,
        },
        relationLoadStrategy: 'join',
        include: {
          messages: true,
        },
      });

      if (!chat) {
        throw new Error('Failed to get chat');
      }

      if (chat.messages.length > 0) {
        socket.emit('receivePreloadMessages', { messages: chat.messages });
      }
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to get messages',
        error: e,
      });
      socket.emit('error', {
        message: e?.message,
      });
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: { userId: string; chatId: string; content: string },
  ) {
    try {
      const chat = await this.prisma.chat.findUnique({
        where: {
          id: payload.chatId,
        },
        relationLoadStrategy: 'join',
        include: {
          participants: true,
        },
      });

      if (!chat) {
        throw new Error('Failed to retrieve chat');
      }

      const newMessage = await this.prisma.message.create({
        data: {
          content: payload.content,
          chatId: chat.id,
          senderId: payload.userId,
        },
      });

      if (newMessage) {
        throw new Error('Failed to create message');
      }

      if (chat) {
        const participantIds = chat.participants.map((participant) => {
          return participant.userId || participant.inviteeId;
        });

        participantIds.forEach((participantId) => {
          const socketId = this.connectedUsers[participantId].id;
          if (socketId && socketId !== socket.id) {
            this.server.to(socketId).emit('receiveMessage', newMessage);
          }
        });
      }
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to send message',
        error: e,
      });
      socket.emit('error', {
        message: e?.message,
      });
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
      socket.emit('renderedMarkdown', {
        html: renderedHTML,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to parse markdown',
        error: e,
      });
      socket.emit('error', {
        message: 'Note Preview failed',
      });
    }
  }

  @SubscribeMessage('resolveOp')
  handleMarkdownStream(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: { op: Operation },
  ) {
    const opHistory: Operation[] = [];
    const resolvedOpHistory: Operation[] = [];
    opHistory.push(payload.op);

    let i = 0;

    while (i < opHistory.length - 1) {
      const resolvedOp = this.otService.transformOperation(
        opHistory[i],
        opHistory[i + 1],
      );
      resolvedOpHistory.push(resolvedOp);
      i += 2;
    }

    if (i === opHistory.length - 1) {
      resolvedOpHistory.push(opHistory[opHistory.length - 1]);
    }

    if (resolvedOpHistory.length === 1) {
      this.server.emit('newResolvedOp', {
        ots: resolvedOpHistory[0],
      });
    }

    this.server.emit('newResolvedOp', { ots: resolvedOpHistory });
  }

  @SubscribeMessage('downloadFile')
  async handleDownloadMarkdown(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      content: string;
      noteId: string;
    },
  ) {
    const note = await this.prisma.note.findUnique({
      where: {
        id: payload.noteId,
      },
    });

    if (!note) {
      socket.emit('error', {
        message: 'Unable to find note',
      });
    }
    const fileName = `${note.name}.md`;
    const fileContent = payload.content;

    socket.emit('receiveFileData', {
      filename: fileName,
      filecontent: fileContent,
    });
  }

  @SubscribeMessage('getNoteContent')
  async handleGetNoteContent(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      noteId: string;
    },
  ) {
    const note = await this.prisma.note.findUnique({
      where: {
        id: payload.noteId,
      },
    });

    if (note) {
      socket.emit('foundNoteContent', { markdown: note.markdown });
    }
  }

  @SubscribeMessage('saveMarkdown')
  async handleSaveMarkdown(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    payload: {
      noteId: string;
      content: string;
    },
  ) {
    try {
      const note = await this.prisma.$transaction(async (tx) => {
        const content = payload.content;
        const foundNote = await tx.note.findUnique({
          where: {
            id: payload.noteId,
          },
        });

        if (!foundNote) {
          throw new Error(this.messageHelpers.RETRIEVAL_ACTION_FAILED);
        }

        const text = this.siteHelpers.stripHtmlPreservingStructure(
          this.siteHelpers.markdownToHtml(content),
        );

        if (!text) {
          throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
        }

        const updatedNote = await tx.note.update({
          where: {
            id: foundNote.id,
          },
          data: {
            markdown: content,
            text: text,
            updatedById: socket.data.user.id,
          },
        });

        if (!updatedNote) {
          throw new Error(this.messageHelpers.UNEXPECTED_RESULT);
        }

        return {
          markdown: updatedNote.markdown,
          text: updatedNote.text,
          html: this.siteHelpers.markdownToHtml(updatedNote.markdown),
        };
      });
      socket.emit('savedMarkdown', {
        senderId: socket.data.user.id,
        markdown: note.markdown,
        message: 'Note saved',
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to save note',
        error: e,
      });
      socket.emit('error', {
        message: 'Failed to save note',
      });
    }
  }
}
