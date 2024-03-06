import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import {
  AuthenticationHelpers,
  MessageHelpers,
} from '@/common/helpers/app.helpers';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly messageHelper = MessageHelpers;
  private readonly authHelper = AuthenticationHelpers;
  constructor(private readonly authService: AuthenticationService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const foundUser = await this.authService.validateUser(email);
    const isValid = await this.authHelper.verifyCredential(
      password,
      foundUser.password,
    );

    if (!foundUser || !isValid) {
      throw new Error(this.messageHelper.USER_LOGIN_FAILED);
    }
    return foundUser;
  }
}
