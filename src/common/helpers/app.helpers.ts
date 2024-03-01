import { Response, Request } from 'express';
import { formatDistanceToNow } from 'date-fns';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as markdownit from 'markdown-it';
import * as sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import { ISiteLocals, RequestUser } from '@/interfaces';
import { JwtPayload, JwtOptions } from '@/types';
import { AppConfig, SiteConfig } from '@/lib/config/config.provider';

const salt = AppConfig.authentication.HASHING_SALT_OR_ROUNDS;
const secret_key = AppConfig.authentication.SESSION_SECRET_KEY;
const issuer = SiteConfig.name;
const md = new markdownit({
  html: true,
  linkify: true,
  breaks: true,
});

/**
 * Helpers for default messages given an action occurs
 */
export const MessageHelpers = {
  CREATE_ACTION_FAILED: 'Failed to create resource',
  DELETE_ACTION_FAILED: 'Failed to create resource',
  EMAIL_SUCCESS: 'Email successfuly sent',
  EMAIL_TRANSPORT_FAILED: 'Email failed to send',
  EXPIRED_TOKEN: 'Your account has not been verified.',
  HUB_NOT_FOUND: 'Hub was not found',
  HTTP_BAD_REQUEST: 'Bad Request',
  HTTP_UNAUTHORIZED: 'You are not authorized',
  HTTP_ACCESS_DENIED: 'You are forbidden to access this resource',
  HTTP_NOT_FOUND: 'Resource was not found',
  HTTP_INTERNAL_SERVER_ERROR: 'Internal Server Error',
  INVALID_TOKEN: 'Invalid token',
  UNEXPECTED_RESULT: 'Something went wrong, try again',
  RETRIEVAL_ACTION_FAILED: 'Failed to fetch resource',
  UPDATE_ACTION_FAILED: 'Failed to update resource',
  USER_FORGOT_PASSWORD_FAILED: 'Failed to complete forgot password action',
  USER_ACCOUNT_NOT_EXISTING: 'Account does not exist',
  USER_REGISTER_SUCCESS: 'Account created successfully',
  USER_REGISTER_FAILED: 'Account with email already exists',
  USER_LOGIN_SUCCESS: 'Account login successful',
  USER_LOGIN_FAILED: 'Invalid email or password',
  USER_LOGOUT_FAILED: 'Unable to logout user',
  USER_VALIDATION_FAILED: 'Account validation failed',
  USER_VERIFICATION_FAILED: 'Your account is not verified yet',
  USER_ALREADY_IN_HUB: 'User already invited to this hub',
};

/**
 * Generic Helpers used in the templates
 */
export const SiteHelpers = {
  /**
   * Generates a nonce base64 for script security
   * @returns {string} The generated base64 string
   */
  generateNonce: (): string => {
    return crypto.randomBytes(64).toString('base64');
  },
  /**
   * Formate a data or date string to an appropriate distance in time
   * @param {Date | string} date
   * @returns {string} The distance in time
   */
  formatDistanceToNow: (date: Date | string): string => {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
    });
  },
  /**
   * Get a substring from `text`
   * @param {string} text The text passed it
   * @param {number} end The length where the string should be cut off
   * @returns {string} The substring from the length from `end`
   */
  subString: (text: string, end: string | number): string => {
    if (typeof end === 'string') {
      end = parseInt(end);
    }
    return text.substring(0, end);
  },
  /**
   * Get a string length
   * @param text The text passed
   * @returns {number} The text length
   */
  stringLength: (text: string): number => {
    return text.length;
  },
  /**
   * Get array length in string
   * @param {Array<object>} arr - THe array passed
   * @returns {string} The length of the array in string
   */
  arrayLengthInString: (arr: Array<object>): string => {
    if (arr.length === 0) {
      return '0';
    }
    return `${arr.length}`;
  },
  /**
   * Get the text in the markdown
   * @param {string} markdownText The markdown edit
   * @returns {string} The string in the markdown
   */
  stripMarkdown: (markdownText: string): string => {
    markdownText = markdownText.replace(
      /(\*|_)(.*?)(\*|_)/g,
      (match, p1, p2, p3) => `${p1}${p2}${p3}`,
    );
    markdownText = markdownText.replace(
      /\[(.*?)\]\((.*?)\)/g,
      (match, p1, p2) => `${p1} (${p2})`,
    );
    markdownText = markdownText.replace(/`(.*?)`/g, (match, p1) => p1);
    markdownText = markdownText.replace(
      /`(.*?)`/gs,
      (match, p1) => `\n${p1}\n`,
    );

    markdownText = markdownText.replace(
      /(?<=^|\n)(#+)(.*?)\n/gm,
      (match, p1, p2) => `${p2}\n`,
    );

    markdownText = markdownText.replace(
      /(?<=^|\n)([-*+]\s+)(.*?)\n/gm,
      (match, p1, p2) => `${p2}\n`,
    );

    markdownText = markdownText.replace(
      /(?<=^|\n)>(.*?)\n/gm,
      (match, p1) => `${p1}\n`,
    );

    markdownText = markdownText.replace(
      /(?<=^|\n)(---|\*\*\*|\−{3,})\n/gm,
      '\n',
    );

    markdownText = markdownText.replace(
      /(?<=^|\n)\| (.*?)\|\n(.*?)\|\n/gm,
      (match, p1, p2) => `${p1}\n${p2}\n`,
    );

    markdownText = markdownText.replace(
      /!\[(.*?)\]\((.*?)\)/g,
      (match, p1, p2) => (p1 ? `${p1}` : ''),
    );

    return markdownText;
  },
  /**
   * Coverts markdown string to a santized html
   * @param {string} markdownText The markdown source text
   * @returns {Promise<string>} The html string
   */
  markdownToHtml: (markdownText: string): string => {
    const html = md.render(markdownText);
    const cleanHTML = sanitizeHtml(html);
    return cleanHTML;
  },
  /**
   * Get the canoncial url of the site
   * @param {Request} req - The request object
   * @returns {string} The full request url
   */
  getCanonicalUrl: (req: Request): string => {
    return req.protocol + '://' + req.get('host') + req.originalUrl;
  },
  /**
   * Sets locals for request and response
   * @param {Request} req The request object
   * @param {Response} res The response object
   */
  setLocals: (req: Request | RequestUser, res: Response) => {
    const locals: ISiteLocals = {
      arrayLengthInString: (arr) => SiteHelpers.arrayLengthInString(arr),
      formatDistanceToNow: (date) => SiteHelpers.formatDistanceToNow(date),
      getFullYear: () => new Date().getFullYear(),
      genId: () => uuidv4(),
      isAuthenticated: () => AuthenticationHelpers.isAuthenticated(req),
      subString: (text, end) => SiteHelpers.subString(text, end),
      stringLength: (text) => SiteHelpers.stringLength(text),
      authenticatedUser: () => req.user,
    };

    res.locals = locals;
  },
};

/**
 * Helpers used for authentication
 */
export const AuthenticationHelpers = {
  /**
   * Checks whether a user is authenticated
   * @returns {boolean} A true or false value
   */
  isAuthenticated: (req: Request): boolean => {
    return req.isAuthenticated();
  },
  /**
   * Hashes a credential
   * @param {string} text The credential string
   * @returns {Promise<string>} The hashed credential string
   */
  hashCredential: async (text: string): Promise<string> => {
    try {
      return await bcrypt.hash(text, salt);
    } catch (e) {
      throw new Error(e);
    }
  },
  /**
   * Verify a credential
   * @param hashedText The hashed credential
   * @param text  The original credential
   * @returns {Promise<boolean>} A true or false boolean value
   */
  verifyCredential: async (
    text: string,
    hashedText: string,
  ): Promise<boolean> => {
    try {
      return await bcrypt.compare(text, hashedText);
    } catch (e) {
      throw new Error(e);
    }
  },
  /**
   * Sign a payload into a jwt token
   * @param {JwtPayload} data The payload
   * @param {string | null} secret The secret key used to sign the payload, otherwise the one set from the enviroment varaible is used
   * @param {JwtOptions} options The options used to sign the payload
   * @returns {Promise<string>} The generated JWT token
   */
  signPayload: async (
    data: JwtPayload,
    options: JwtOptions,
    secret?: string,
  ): Promise<string> => {
    try {
      const token = await jwt.sign(data, secret || secret_key, {
        expiresIn: options.expiry_time_in_secs,
        issuer: options.issuer || issuer,
        subject: options.subject,
      });
      return token;
    } catch (e) {
      throw new Error(e);
    }
  },
  /**
   * Verify a jwt token signature
   * @param {string} token The JWT Token
   * @param {string | null} secret The secret key used to sign the payload, otherwise the one set from the enviroment varaible is used
   * @returns {Promise<any>} The decoded payload
   */
  verifyToken: async (token: string, secret?: string): Promise<any> => {
    try {
      const decoded = await jwt.verify(token, secret || secret_key);
      return decoded;
    } catch (e) {
      throw new Error(e);
    }
  },
  /**
   * Checks whether a decoded token is expired
   * @param {number} exp The token expiry time in seconds
   * @returns {boolean} A true or false value
   */
  isTokenExpired: (exp: number): boolean => {
    const now = AuthenticationHelpers.getEpochSecondsFromCreatedAt(
      new Date().toISOString(),
    );
    return now > exp;
  },
  /**
   * Get the number of seconds elapsed
   * @param {Date} createdAt The date for database
   * @returns {number} The seconds from the createdAt Date
   */
  getEpochSecondsFromCreatedAt: (createdAt: Date | string): number => {
    const jsDate = new Date(createdAt);
    const differenceInMilliseconds = jsDate.getTime() - Date.UTC(1970, 0, 1);
    return Math.floor(differenceInMilliseconds / 1000);
  },
};
