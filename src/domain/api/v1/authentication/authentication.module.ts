import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './strategies/local.strategy';
import { AccessTokenJwtStrategy } from './strategies/access-token.strategy';
import { AppEventHandler } from '@/common/events/app.events';
import { GithubStrategy } from './strategies/github.strategy';

@Global()
@Module({
  imports: [
    PassportModule.register({
      defaultStrategy: ['jwt', 'github'],
      session: false,
    }),
    JwtModule.register({}),
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    LocalStrategy,
    AccessTokenJwtStrategy,
    GithubStrategy,
    AppEventHandler,
  ],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
