import { ConfigService } from '@nestjs/config';
import { IAppConfig, ISiteConfig } from './config.interface';
import * as dotenv from 'dotenv';

dotenv.config();

const configService = new ConfigService();

/**
 * The application configuration
 */
export const AppConfig: IAppConfig = {
  environment: {
    NODE_ENV: configService.getOrThrow<string>('NODE_ENV'),
    PORT: Number(configService.get<number>('PORT') || 3000),
    WS_PORT: Number(configService.get<number>('WS_PORT') || 3001),
    PROD_URL: configService.get<string>('PROD_URL') || 'http://16.171.141.105',
    FLAGS: configService.get<string>('FLAGS'),
  },
  authentication: {
    HASHING_SALT_OR_ROUNDS: configService.get<string | number>(
      'HASHING_SALT_OR_ROUNDS',
    ),
    ACCESS_JWT_TOKEN_SECRET_KEY: configService.getOrThrow<string>(
      'ACCESS_JWT_TOKEN_SECRET_KEY',
    ),
    GOOGLE_CLIENT_ID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
    GOOGLE_CLIENT_SECRET: configService.getOrThrow<string>(
      'GOOGLE_CLIENT_SECRET',
    ),
    GOOGLE_CALLBACK_URL: configService.getOrThrow<string>(
      'GOOGLE_CALLBACK_URL',
    ),
  },
  database: {
    pg: {
      PG_URL: configService.getOrThrow<string>('PG_URL'),
    },
    redis: {
      REDIS_HOST: configService.get<string>('REDIS_HOST') || 'localhost',
      REDIS_PORT: Number(configService.get<number>('REDIS_PORT') || 6379),
      REDIS_PASSWORD: configService.get<string>('REDIS_PASSWORD'),
    },
  },
  services: {
    sendwave: {
      SENDWAVE_API_KEY: configService.get<string>('SENDWAVE_API_KEY'),
    },
    smtp: {
      SMTP_HOST: configService.getOrThrow<string>('SMTP_HOST'),
      SMTP_PORT: Number(configService.getOrThrow<number>('SMTP_PORT')),
      SMTP_EMAIL_ADDRESS:
        configService.getOrThrow<string>('SMTP_EMAIL_ADDRESS'),
      SMTP_PASSWORD: configService.getOrThrow<string>('SMTP_PASSWORD'),
    },
    cloudinary: {
      CLOUD_API_KEY: configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      CLOUD_BUCKET_NAME: configService.getOrThrow<string>(
        'CLOUDINARY_BUCKET_NAME',
      ),
      CLOUD_SECRET_KEY: configService.getOrThrow<string>(
        'CLOUDINARY_SECRET_KEY',
      ),
    },
  },
};

/**
 * The site configuration
 */
export const SiteConfig: ISiteConfig = {
  name: 'Jetei',
  description:
    'Jetei - a powerful and dynamic real-time collaborative knowledge base application designed to empower teams, communities, and individuals to collect, share, and organize information seamlessly',
  ogImagePath: 'assets/images/og-image.png',
  links: {
    github: 'https://github.com/Daniel-Brai/Jetei',
  },
  author: {
    name: 'Daniel Brai',
    email: 'danielbrai.dev@gmail.com',
  },
  year: new Date().getFullYear(),
};
