import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationModule } from '@/domain/api/v1/authentication/authentication.module';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [JwtModule, AuthenticationModule, EventEmitterModule.forRoot()],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
