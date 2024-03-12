import { Injectable } from '@nestjs/common';
import { AppConfig } from '@/lib/config/config.provider';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github';
import { PrismaService } from '@/infrastructure/gateways/database/prisma/prisma.service';
import { JwtPayload } from '@/types';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  private readonly prisma = new PrismaService();
  constructor() {
    super({
      clientID: AppConfig.authentication.GITHUB_CLIENT_ID,
      clientSecret: AppConfig.authentication.GITHUB_CLIENT_SECRET,
      callbackURL: AppConfig.authentication.GITHUB_CALLBACK_URL,
      scope: ['public_profile'],
    });
  }

  async validate(
    accessToken: string,
    _refreshToken: string,
    profile: Profile,
  ): Promise<JwtPayload> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: profile.emails[0].value || profile.emails[1].value,
      },
      include: {
        profile: true,
      },
    });

    if (!user) {
      const newUser = await this.prisma.user.create({
        data: {
          id: profile.id,
          email: profile.emails[0].value || profile.emails[1].value,
          isVerified: true,
          isSocialAuth: true,
          profile: {
            create: {
              name: profile.displayName,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      return {
        sub: newUser.id,
        email: newUser.email,
        name: newUser.profile.name,
        role: newUser.role,
      };
    }

    if (user) {
      return {
        sub: user.id,
        email: user.email,
        name: user.profile.name,
        role: user.role,
      };
    }
  }
}
