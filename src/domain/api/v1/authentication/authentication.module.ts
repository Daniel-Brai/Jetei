import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { LocalStrategy } from './strategies/local.strategy';
import { AccessTokenJwtStrategy } from './strategies/access-token.strategy';

@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.register({}),
  ],
  controllers: [AuthenticationController],
  providers: [AuthenticationService, LocalStrategy, AccessTokenJwtStrategy],
  exports: [AuthenticationService],
})
export class AuthenticationModule {}
