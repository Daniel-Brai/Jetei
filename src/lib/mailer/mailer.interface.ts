/**
 * Describes the result of sending a mail
 */
export interface MailResult {
  readonly status: 'COMPLETED' | 'FAILED';
  readonly message: string;
}

/**
 * Describes an interface for a mail body
 */
export interface IMailerBody {
  readonly to: string;
  readonly from?: string;
  readonly subject: string;
  readonly text?: string;
  readonly html?: string;
  readonly templatePath?: string;
  readonly data?: {
    name_or_email?: string;
    url?: string;
    hub?: string;
  };
}

/**
 * Describes methods used by the mailer
 */
export interface IMailerService {
  /**
   * Sends an email
   */
  sendEmail(provider: 'base' | 'brevo', body: IMailerBody): Promise<MailResult>;
}
