/* eslint-disable @typescript-eslint/no-unused-vars */
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  AuthenticationHelpers,
  MessageHelpers,
} from '@/common/helpers/app.helpers';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { Operation } from '@/interfaces';

@WebSocketGateway()
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WebsocketGateway.name);
  private readonly authHelpers = AuthenticationHelpers;
  private readonly messageHelpers = MessageHelpers;
  private readonly connectedUsers: { [userId: string]: Socket } = {};
  private readonly operationHistory: Operation[] = [];
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  @WebSocketServer()
  server: Server;

  public async handleConnection(socket: Socket) {
    this.logger.log('Creating user in WS Connection');
    try {
      const cookies = socket.handshake.headers.cookie;
      const parsedCookies = this.authHelpers.parseAccessCookies(cookies);
      const token = parsedCookies.accessToken;
      const tokenId = parsedCookies.accessTokenId;
      const payload = await this.jwtService.verifyAsync(token, {
        jwtid: tokenId,
      });
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          profile: true,
        },
      });
      const { password, ...userWithoutPassword } = user;
      socket.data.user = userWithoutPassword;
      this.connectedUsers[user.id] = socket;
      this.server.emit('userConnected', user);
    } catch (e) {
      this.logger.error(this.messageHelpers.USER_VALIDATION_FAILED, {
        context: 'Failed to get user info via ws',
        error: e,
      });
      socket.disconnect();
      throw new WsException(this.messageHelpers.USER_VALIDATION_FAILED);
    }
  }

  handleDisconnect(socket: Socket) {
    this.logger.log('Disconnecting user from WS Connection');
    try {
      const user = socket.data.user;
      delete this.connectedUsers[user.id];
      this.server.emit('userDisconnected', user.profile.name);
    } catch (e) {
      this.logger.error(this.messageHelpers.UNEXPECTED_RESULT, {
        context: 'Failed to disconnect user',
        error: e,
      });
      throw new WsException(this.messageHelpers.UNEXPECTED_RESULT);
    }
  }

  @SubscribeMessage('send-markdown')
  listenForMessages(@MessageBody() markdownText: string) {
    this.server.sockets.emit('receiveMd', markdownText);
  }
}
