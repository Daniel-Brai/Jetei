import { Global, Module } from '@nestjs/common';
import { join } from 'path';
import { cwd } from 'process';
import { BullModule } from '@nestjs/bull';
import { MailerModule as NodemailerModule } from '@nestjs-modules/mailer';
import { AppConfig } from '@/lib/config/config.provider';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerService } from './mailer.service';
import { MailerAdapter } from './mailer.adapters';
import { MAILER_QUEUE } from './mailer.consts';
import { MailerProcessor } from './mailer.processor';

@Global()
@Module({
  imports: [
    NodemailerModule.forRoot({
      transport: {
        host: AppConfig.services.smtp.SMTP_HOST,
        port: AppConfig.services.smtp.SMTP_PORT,
        secure: true,
        auth: {
          user: AppConfig.services.smtp.SMTP_EMAIL_ADDRESS,
          pass: AppConfig.services.smtp.SMTP_PASSWORD,
        },
        pool: true,
      },
      defaults: {
        from: `"No Reply" <${AppConfig.services.smtp.SMTP_EMAIL_ADDRESS}>`,
      },
      preview: true,
      template: {
        dir: join(cwd(), 'public/ui/views/mailer'),
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    }),
    BullModule.registerQueue({
      name: MAILER_QUEUE,
    }),
  ],
  providers: [MailerService, MailerProcessor, MailerAdapter],
  exports: [MailerService],
})
export class MailerModule {}
