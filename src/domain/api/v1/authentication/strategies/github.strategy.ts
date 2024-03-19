import { Injectable, Logger } from '@nestjs/common';
import { AppConfig } from '@/lib/config/config.provider';
import { PassportStrategy } from '@nestjs/passport';
import {
  Profile, StrategyOptionsWithRequest, Strategy, StrategyOptions
} from 'passport-github2';
import { Request } from 'express';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly logger = new Logger(GithubStrategy.name);
  constructor() {
    super({
      clientID: AppConfig.authentication.GITHUB_CLIENT_ID,
      clientSecret: AppConfig.authentication.GITHUB_CLIENT_SECRET,
      callbackURL: AppConfig.authentication.GITHUB_CALLBACK_URL,
      scope: ['user:email'],
    })
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: any, user: any, info?: any) => void,
  ): Promise<any> {
    const { id, username, emails } = profile;
    const user = {
      githubId: id,
      username: username,
      email: emails[0].value,
    };
    done(null, profile);
  }
}
