import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppConfig } from '@/lib/config/config.provider';
import { AllExceptionFilter } from '@/infra/interceptors/error.interceptor';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import * as nunjucks from 'nunjucks';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import * as compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { cwd } from 'process';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(Logger);
  const port = AppConfig.environment.PORT;
  const node_env = AppConfig.environment.NODE_ENV;
  const nunjucks_options: nunjucks.ConfigureOptions = {
    autoescape: true,
    throwOnUndefined: false,
    trimBlocks: false,
    lstripBlocks: false,
    watch: true,
    noCache: node_env === 'development' ? true : false,
    express: app,
  };
  const templates_path = join(cwd(), 'public/ui');
  const nunjucks_environment = nunjucks.configure(
    templates_path,
    nunjucks_options,
  ).render;

  app.useLogger(logger);
  app.enableCors();
  app.flushLogs();
  app.enableShutdownHooks();
  app.useWebSocketAdapter(new IoAdapter());

  // pipes, filters and interceptors
  app.useGlobalInterceptors(new LoggerErrorInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionFilter());

  // assets and templates
  app.useStaticAssets(join(cwd(), 'public/assets'), {
    prefix: '/assets/',
  });
  app.engine('html', nunjucks_environment);
  app.setViewEngine('html');
  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // middlewares
  app.use(cookieParser());
  app.use(compression({ level: 7, compression: 512 }));
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  await app.listen(port, async () => {
    logger.log(
      `Nest application is up and running at -> ${await app.getUrl()}`,
      { config: node_env === 'development' ? AppConfig : null },
    );
  });
}
bootstrap();
