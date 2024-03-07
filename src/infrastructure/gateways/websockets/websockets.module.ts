import { OperationalTransformationService } from '@/common/services/app.services';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { WebsocketGateway } from './websocket.gateway';

@Module({
  imports: [JwtModule],
  providers: [OperationalTransformationService, WebsocketGateway],
  exports: [WebsocketGateway],
})
export class WebsocketModule {}
