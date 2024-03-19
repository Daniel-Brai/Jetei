import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyFunctionWithRequest } from 'passport-google-oauth2';
import { AppConfig } from '@/lib/config/config.provider';
import { Request } from 'express';
import { AuthenticationService } from '../authentication.service';
import { SocialAuthenticationPayload } from '@/types';

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly authService: AuthenticationService) {
    super({
      clientID: AppConfig.authentication.GOOGLE_CLIENT_ID,
      clientSecret: AppConfig.authentication.GOOGLE_CLIENT_SECRET,
      callbackURL: AppConfig.authentication.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
      scope: ['profile', 'email'],
    });
  }

  async validate(
    req: Request,
    _accessToken: string,
    _refreshToken: string,
    profile: any,
  ): Promise<any> {
    console.log('User profile: ', profile);
    const { id, name, email, photos } = profile;

    const user: SocialAuthenticationPayload = {
      provider: 'google',
      providerId: id,
      email: email,
      name: `${name.givenName} ${name.familyName}`,
      picture: photos[0].value,
    };

    req.user = user;
    return user;
  }
}
