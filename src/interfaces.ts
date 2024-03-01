import { Request } from 'express';
import { User } from '@prisma/client';

/**
 * Describes an interface for site locals
 */
export interface ISiteLocals {
  arrayLengthInString?: (arr: Array<object>) => string;
  formatDistanceToNow?: (date: Date | string) => string;
  getFullYear: () => number;
  genId: () => string;
  isAuthenticated: () => boolean;
  subString?: (text: string, end: string | number) => string;
  stringLength: (text: string) => number;
  authenticatedUser: () => any;
  stripMarkdownToString?: (markdown: string) => string;
}

/**
 * Describe the properities of a user request
 */
export interface RequestUser extends Request {
  user: User;
}
