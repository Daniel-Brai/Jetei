import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppConfig } from '@/lib/config/config.provider';
import { AllExceptionFilter } from '@/infra/interceptors/error.interceptor';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
import * as nunjucks from 'nunjucks';
import * as PgStore from 'connect-pg-simple';
import * as express from 'express';
import * as session from 'express-session';
import * as passport from 'passport';
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
  const reflector = app.get(Reflector);
  const port = AppConfig.environment.PORT || 3000;
  const node_env = AppConfig.environment.NODE_ENV;
  const secret_key = AppConfig.authentication.SESSION_SECRET_KEY;
  const cookie_max_age = AppConfig.authentication.COOKIE_MAX_AGE;
  const database_connection_string = AppConfig.database.pg.PG_URL;
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
  app.flushLogs();
  app.enableShutdownHooks();

  // pipes, filters and interceptors
  app.useGlobalInterceptors(
    new LoggerErrorInterceptor(),
    new ClassSerializerInterceptor(reflector),
  );
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
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(
    session({
      store: new (PgStore(session))({
        conObject: {
          connectionString: `${database_connection_string}`,
          ssl: node_env === 'production' ? true : false,
        },
        createTableIfMissing: true,
        tableName: 'user_sessions',
      }),
      secret: `${secret_key}`,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: cookie_max_age,
        httpOnly: true,
        sameSite: 'strict',
      },
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(compression({ level: 5, compression: 512 }));

  await app.listen(port, async () => {
    logger.log(
      `Nest application is up and running at -> ${await app.getUrl()}`,
      { node_environment: node_env },
    );
  });
}
bootstrap();
