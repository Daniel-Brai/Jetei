import { Injectable, Logger } from '@nestjs/common';
import { IMailerBody, IMailerService, MailResult } from './mailer.interface';
import { MailerAdapter } from './mailer.adapters';

@Injectable()
export class MailerService implements IMailerService {
  private readonly logger = new Logger(MailerService.name);

  constructor(private readonly mailerAdapter: MailerAdapter) {}

  public async sendEmail(
    provider: 'brevo' | 'base',
    body: IMailerBody,
  ): Promise<MailResult> {
    this.logger.log(`Send an email to ${body.to}`);
    try {
      if (provider === 'brevo') {
        return await this.mailerAdapter.sendEmailThroughBrevo(body);
      } else if (provider === 'base') {
        return await this.mailerAdapter.sendEmailThroughBaseSMTP(body);
      }
    } catch (e) {
      throw new Error(e);
    }
  }
}
