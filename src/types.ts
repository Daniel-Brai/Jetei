import { UserRole } from '@prisma/client';
import { OperationType } from './interfaces';

/**
 * Describes a response for the client to consume
 */
export type APIResponse<T> = {
  type: 'success' | 'error';
  status_code: number;
  api_message?: string;
  api_description?: string;
  details?: {
    timestamp?: string;
    path?: string;
  };
  data?: Array<T> | object;
};

/**
 * Describes the payload passed
 */
export type JwtPayload = {
  sub: string;
  name?: string;
  email: string;
  role: UserRole;
};

/**
 * Describes JWT options to be used
 */
export type JwtOptions = {
  issuer?: string;
  subject: string;
  expiry_time_in_secs: number;
};

/**
 * Describes a document to be operated on
 */
export class Document {
  private content: string;

  constructor(content: string = '') {
    this.content = content;
  }

  /**
   * Gets the document content
   * @returns {string} The cotent of the document
   */
  public getContent(): string {
    return this.content;
  }
}

/**
 * Describes a chat message
 */
export type Message = {
  content: string;
  sent: string;
};

/**
 * Describes the mimetype
 */
export type AllowedMimeTypes =
  | 'image/png'
  | 'image/jpeg'
  | 'image/jpg'
  | 'image/webp'
  | 'application/pdf'
  | 'text/markdown'
  | 'text/plain';

/**
 * Describes the document in hub
 */
export type HubDocument = {
  key: string;
  fileName: string;
  url: string;
  extIcon: string;
};

/**
 * Describes the payload from social providers
 */
export type SocialAuthenticationPayload = {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  picture: string;
};
