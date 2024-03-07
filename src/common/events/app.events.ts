import { Global, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@/lib/mailer/mailer.service';
import { IMailerBody } from '@/lib/mailer/mailer.interface';

export class MailerEvent {
  constructor(
    readonly provider: 'base' | 'brevo',
    readonly body: IMailerBody,
  ) {}
}

@Global()
@Injectable()
export class AppEventHandler {
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('user.email')
  public async handleUserEmail(event: MailerEvent) {
    const { provider, body } = event;
    await this.mailerService.sendEmail(provider, body);
  }
}
