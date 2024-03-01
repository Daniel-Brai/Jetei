import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('send-markdown')
  listenForMessages(@MessageBody() markdownText: string) {
    this.server.sockets.emit('receive-markdown', markdownText);
  }
}
