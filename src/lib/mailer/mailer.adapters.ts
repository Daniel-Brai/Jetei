import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AppConfig } from '@/lib/config/config.provider';
import { MessageHelpers } from '@/common/helpers/app.helpers';
import * as Brevo from '@getbrevo/brevo';
import { IMailerBody, MailResult } from './mailer.interface';
import { MAILER_QUEUE, SEND_MAIL } from './mailer.consts';

@Injectable()
export class MailerAdapter {
  private readonly appConfig = AppConfig;
  private readonly messageHelpers = MessageHelpers;

  constructor(@InjectQueue(MAILER_QUEUE) private readonly mailerQueue: Queue) {}

  public async sendEmailThroughBrevo(body: IMailerBody): Promise<MailResult> {
    try {
      const brevoClient = new Brevo.TransactionalEmailsApi();

      brevoClient.setApiKey(
        Brevo.TransactionalEmailsApiApiKeys.apiKey,
        this.appConfig.services.sendwave.SENDWAVE_API_KEY,
      );
      const sendSmtpEmail = new Brevo.SendSmtpEmail();
      sendSmtpEmail.subject = '{{params.subject}}';
      sendSmtpEmail.htmlContent = `${body.html}`;
      sendSmtpEmail.sender = { name: 'Jetei', email: `${body.from}` };
      sendSmtpEmail.to = [
        { email: `${body.to}`, name: `${body.data.name_or_email}` },
      ];
      sendSmtpEmail.params = {
        subject: body.subject,
        url: body.data.url,
        receiver: body.to,
      };
      const data = await brevoClient.sendTransacEmail(sendSmtpEmail);
      return {
        status: 'COMPLETED',
        message: `Email sent ${data.body.messageId ? `to ${data.body.messageId}` : ''} successfully`,
      };
    } catch (e) {
      throw new Error(this.messageHelpers.EMAIL_TRANSPORT_FAILED);
    }
  }

  public async sendEmailThroughBaseSMTP(
    body: IMailerBody,
  ): Promise<MailResult> {
    try {
      await this.mailerQueue.add(SEND_MAIL, body, {
        attempts: 5,
        removeOnComplete: true,
        jobId: `send-to-${body.to}`,
      });
      return {
        status: 'COMPLETED',
        message: `Email sent to ${body.to} successfully`,
      };
    } catch (e) {
      throw new Error(this.messageHelpers.EMAIL_TRANSPORT_FAILED);
    }
  }
}
