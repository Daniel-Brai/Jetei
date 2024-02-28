import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionSerializer } from './serializers/session.serializer';

@Global()
@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, LocalStrategy, SessionSerializer],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
