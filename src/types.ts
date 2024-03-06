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
