import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/lib/config/config.provider';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  Profile,
  StrategyOptionsWithRequest,
} from 'passport-github2';
import { AuthenticationService } from '../authentication.service';
import { Request } from 'express';

const githubOptions: StrategyOptionsWithRequest = {
  clientID: AppConfig.authentication.GITHUB_CLIENT_ID,
  clientSecret: AppConfig.authentication.GITHUB_CLIENT_SECRET,
  callbackURL: AppConfig.authentication.GITHUB_CALLBACK_URL,
  passReqToCallback: true,
  scope: ['user:email'],
};

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);
  constructor(private readonly authService: AuthenticationService) {
    super(githubOptions);
  }

  async validate(
    req: Request,
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<any> {
    try {
      console.log('GitHub Profile:', profile);
      const user = await this.authService.validateGithubUser(profile);
      console.log('User object from AuthService:', user);
      if (!user) {
        console.log('No user found');
        return null;
      }
      console.log('User object passed to done callback:', user);
      return user;
    } catch (err) {
      this.logger.error('Failed to validate github authentication', {
        error: err,
      });
      throw new Error(err);
    }
  }
}
