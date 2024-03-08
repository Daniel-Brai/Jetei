import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { MailerService as NodemailerService } from '@nestjs-modules/mailer';
import { AppConfig } from '@/lib/config/config.provider';
import { MAILER_QUEUE, SEND_MAIL } from './mailer.consts';
import { IMailerBody } from './mailer.interface';

@Injectable()
@Processor(MAILER_QUEUE)
export class MailerProcessor {
  private readonly logger = new Logger(MailerProcessor.name);
  private readonly appConfig = AppConfig;

  constructor(private readonly nodemailerService: NodemailerService) {}

  @OnQueueActive()
  public onActive(job: Job) {
    this.logger.debug(`Processing job ${job.id} of type ${job.name}`);
  }

  @OnQueueCompleted()
  public onComplete(job: Job) {
    this.logger.debug(`Completed job ${job.id} of type ${job.name}`);
  }

  @OnQueueFailed()
  public onError(job: Job<any>, error: any) {
    this.logger.error(
      `Failed job ${job.id} of type ${job.name}: ${error.message}`,
      error.stack,
    );
  }

  @Process(SEND_MAIL)
  public async handleMailTransport(job: Job<IMailerBody>) {
    try {
      return this.nodemailerService.sendMail({
        to: job.data.to,
        from: this.appConfig.services.smtp.SMTP_EMAIL_ADDRESS,
        subject: job.data.subject,
        template: job.data.templatePath,
        context: {
          url: job.data.data.url,
          to: job.data.to,
          hub: job.data.data.hub,
        },
      });
    } catch (e) {
      this.logger.error(`Failed to send email to '${job.data.to}'`);
      throw new Error(e);
    }
  }
}
