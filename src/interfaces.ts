import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AllowedMimeTypes, Document } from './types';

/**
 * Describes an interface for site locals
 */
export interface ISiteLocals {
  arrayLengthInString?: (arr: Array<object>) => string;
  formatDistanceToNow?: (date: Date | string) => string;
  getFullYear: () => number;
  genId: () => string;
  isAuthenticated: () => boolean;
  generateProfileName: () => string;
  generateInitials: () => string;
  subString?: (text: string, end: string | number) => string;
  htmlToText?: (htmlString: string) => string;
  stringLength: (text: string) => number;
  authenticatedUser: () => any;
  stripMarkdownToString?: (markdown: string) => string;
}

/**
 * Describe the properities of a user request
 */
export interface RequestUser extends Request {
  user: {
    sub: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

/**
 * The OT Operation types
 */
export enum OperationType {
  INSERT = 'insert',
  DELETE = 'delete',
}

/**
 * The OT Operation
 */
export interface Operation {
  readonly bnoteId: string;
  type: OperationType;
  userId: string;
  preferredUserId: string;
  content: string;
  position: number;
  replaceLength?: number;
}

/**
 * Describe the interface for a file
 */
export interface IsFileOptions {
  mime: AllowedMimeTypes[]
}