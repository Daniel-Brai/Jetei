import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { User } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { MessageHelpers } from '@/common/helpers/app.helpers';
import { AuthenticationService } from '../authentication.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  private readonly messageHelper = MessageHelpers;
  constructor(private readonly authService: AuthenticationService) {
    super({
      usernameField: 'email',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    return await this.authService.validate(email, password);
  }
}
