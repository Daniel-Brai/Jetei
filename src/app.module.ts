import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TerminusModule } from '@nestjs/terminus';
import { LoggerModule, Params } from 'nestjs-pino';
import { AppMiddleware } from '@/common/middlewares/app.middlewares';
import { UserInterceptor } from '@/common/interceptors/app.interceptors';
import { AppConfig, SiteConfig } from '@/lib/config/config.provider';
import { APIV1Module } from '@/domain/api/v1/api-v1.module';
import { PrismaModule } from '@/infra/gateways/database/prisma/prisma.module';
import { WebsocketModule } from '@/infra/gateways/websockets/websockets.module';
import { MailerModule } from '@/lib/mailer/mailer.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

const site_name = SiteConfig.name;
const node_env = AppConfig.environment.NODE_ENV;

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: [
        {
          name: site_name,
          level: node_env !== 'production' ? 'debug' : 'info',
          transport:
            node_env !== 'production' ? { target: 'pino-pretty' } : undefined,
        },
      ],
    } as Params),
    PrismaModule,
    APIV1Module,
    WebsocketModule,
    MailerModule,
    TerminusModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    {
      provide: APP_INTERCEPTOR,
      useClass: UserInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AppMiddleware)
      .forRoutes(
        { path: '/login', method: RequestMethod.GET },
        { path: '/signup', method: RequestMethod.GET },
        { path: '/account/verification', method: RequestMethod.GET },
        { path: '/account/forget-password', method: RequestMethod.GET },
        { path: '/account/forget-password/started', method: RequestMethod.GET },
        { path: '/workspace', method: RequestMethod.GET },
      );
  }
}
