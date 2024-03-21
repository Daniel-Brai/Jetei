import { Response, Request } from 'express';
import { formatDistanceToNow } from 'date-fns';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as markdownit from 'markdown-it';
import { markdownItTable } from 'markdown-it-table';
import * as milli from 'markdown-it-linkify-images';
import * as sanitizeHtml from 'sanitize-html';
import { v4 as uuidv4 } from 'uuid';
import { ISiteLocals, RequestUser } from '@/interfaces';
import { JwtPayload, JwtOptions, FeatureFlagObject } from '@/types';
import { AppConfig, SiteConfig } from '@/lib/config/config.provider';

const salt = AppConfig.authentication.HASHING_SALT_OR_ROUNDS;
const secret_key = AppConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY;
const issuer = SiteConfig.name;
const md = new markdownit({
  html: true,
  linkify: true,
  breaks: true,
});
md.use(milli, {
  target: '_blank',
  linkClass: 'preview-link-for-img',
  imgClass: 'preview-image',
});
md.use(markdownItTable, {});

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
    if (!date) {
      return '';
    }

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
   * Split a array on the occurences of a character
   * @param {string} str The string you want to split
   * @param {string} char THe character you want to split at
   * @returns {string[]} A array of string
   */
  splitAtFirstOccurrenceRegex: (str: string, char: string): string[] => {
    return str.split(char);
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
    if (arr.length === 0 || typeof arr === 'undefined' || arr === null) {
      return '0';
    }
    return `${arr.length}`;
  },
  /**
   * Generate an anonymous profile name
   * @returns {string} The generated profile name
   */
  generateAnonymousProfileName: (): string => {
    const adjectives: string[] = [
      'Curious',
      'Adventurous',
      'Creative',
      'Reliable',
      'Enthusiastic',
      'Thoughtful',
      'Insightful',
      'Vigilant',
      'Serene',
    ];

    const nouns: string[] = [
      'Explorer',
      'Learner',
      'Builder',
      'Observer',
      'Trailblazer',
      'Analyst',
      'Navigator',
      'Strategist',
      'Dreamer',
      'Catalyst',
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    const profileName = `${randomAdjective}-${randomNoun}`;

    const randomNumber = Math.floor(Math.random() * 1000);
    const finalName = `${profileName}-${randomNumber}`;

    return finalName;
  },
  /**
   * Generate a random colour
   * @returns {string} The generated colour
   */
  randomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  },
  /**
   * Generate user initials
   * @param {RequestUser} req The request object
   * @returns {string} The genrated user initials
   */
  genInitials: (req: RequestUser): string => {
    const words = req.user.name.trim().split(/\s+/);

    const initials = words.map((word) => word.charAt(0).toUpperCase());

    return initials.join('');
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
   * Formats date per timezone
   * @param {Date} dateTime The date passed
   * @returns The formatted date
   */
  formatDateTimeWithTimezone: (dateTime: Date | number | string): string => {
    // Create a new Date object from the input dateTime
    const date = new Date(dateTime);

    // Get the browser's timezone offset
    const timezoneOffset = date.getTimezoneOffset() * 60 * 1000;

    // Adjust the date by the timezone offset to get the correct local time
    const adjustedDate = new Date(date.getTime() + timezoneOffset);

    const month = String(adjustedDate.getMonth() + 1).padStart(2, '0');
    const day = String(adjustedDate.getDate()).padStart(2, '0');
    const year = adjustedDate.getFullYear();
    const hours = String(adjustedDate.getHours()).padStart(2, '0');
    const minutes = String(adjustedDate.getMinutes()).padStart(2, '0');
    const ampm = adjustedDate.getHours() >= 12 ? 'PM' : 'AM';

    return `${month}/${day}/${year} ${hours}:${minutes} ${ampm}`;
  },
  /**
   * Strips HTML to text
   * @param {string} htmlString The HTML String
   * @returns {string} The normalized text
   */
  stripHtmlPreservingStructure: (htmlString: string): string => {
    const tagRegex = /<[^>]+(>|$)/g;

    const strippedText = htmlString.replace(tagRegex, ' ');

    const normalizedText = strippedText.replace(/\s+/g, ' ');

    const lineBreakReplaced = normalizedText.replace(/(\r?\n|\r)/g, ' ');

    return lineBreakReplaced.trim();
  },
  /**
   * Parse the flags from the environment variables
   * @returns {FeatureFlags} The allowed features
   */
  parseFlagsFromEnv: () => {
    const DEFAULT_FLAGS = {
      USE_SOCIAL_AUTH: false,
      USE_SMTP: false,
    } as FeatureFlagObject;

    const flagsStr = AppConfig.environment.FLAGS;

    const flags: Record<string, boolean> = { ...DEFAULT_FLAGS };

    flagsStr.split(';').forEach((flag) => {
      const [key, value] = flag.split('=');
      if (key && value !== undefined) {
        flags[key] = value.toLowerCase() === 'true';
      }
    });

    return {
      useSocialAuth: flags.USE_SOCIAL_AUTH,
      useSmtp: flags.USE_SMTP,
    };
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
      generateProfileName: () => SiteHelpers.generateAnonymousProfileName(),
      htmlToText: (htmlString: string) =>
        SiteHelpers.stripHtmlPreservingStructure(htmlString),
      genId: () => uuidv4(),
      getFlags: () => SiteHelpers.parseFlagsFromEnv(),
      generateInitials: () => SiteHelpers.genInitials(req as RequestUser),
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
    if (!req.user) {
      return false;
    }
    return true;
  },
  /**
   * Hashes a credential
   * @param {string} text The credential string
   * @returns {Promise<string>} The hashed credential string
   */
  hashCredential: async (text: string): Promise<string> => {
    try {
      const rounds = await bcrypt.genSalt(Number(salt));
      return await bcrypt.hash(text, rounds);
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
   * @param {string} jwtToken The JWT Token
   * @param {string} jwtId The JWT Token id
   * @returns {Promise<any>} The decoded payload
   */
  verifyToken: async (jwtToken: string, jwtId: string): Promise<JwtPayload> => {
    try {
      const decoded = (await jwt.verify(jwtToken, secret_key, {
        jwtid: jwtId,
      })) as JwtPayload;
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
  /**
   * Parses the cookies in the request
   * @param inputString The request cookie
   * @returns The parsed cookies
   */
  parseAccessCookies: (
    inputString: string,
  ): { accessToken: string; accessTokenId: string } => {
    const accessTokenRegex = /accessToken=([^;]+)/;
    const accessTokenIdRegex = /accessTokenId=([^;]+)/;

    const accessTokenMatch = accessTokenRegex.exec(inputString);
    const accessTokenIdMatch = accessTokenIdRegex.exec(inputString);

    if (!accessTokenMatch) {
      throw new Error('accessToken not found in the request cookie.');
    }
    if (!accessTokenIdMatch) {
      throw new Error('accessTokenId not found in the request cookie.');
    }

    return {
      accessToken: accessTokenMatch[1],
      accessTokenId: accessTokenIdMatch[1],
    };
  },
};
