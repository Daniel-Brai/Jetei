import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationModule } from '@/domain/api/v1/authentication/authentication.module';
import { HubsController } from './hubs.controller';
import { HubsService } from './hubs.service';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CloudinaryModule } from '@/lib/cloudinary/cloudinary.module';

@Module({
  imports: [
    JwtModule,
    AuthenticationModule,
    EventEmitterModule.forRoot(),
    CloudinaryModule,
  ],
  controllers: [HubsController],
  providers: [HubsService],
  exports: [HubsService],
})
export class HubsModule {}
