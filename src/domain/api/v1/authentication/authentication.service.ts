import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';
import { RequestUser } from '@/interfaces';
import { APIResponse } from '@/types';
import {
  AuthenticationHelpers,
  MessageHelpers,
} from '@/common/helpers/app.helpers';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { MailerService } from '@/lib/mailer/mailer.service';
import {
  UserResetPasswordDto,
  UserVerifyAccountDto,
} from './dtos/authentication.dtos';
import { AppConfig } from '@/lib/config/config.provider';
import { Response } from 'express';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly appConfig = AppConfig;
  private readonly authHelper = AuthenticationHelpers;
  private readonly messageHelper = MessageHelpers;

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * validates the existence of the user
   * @param email The email of the user
   * @param password The password of the user
   * @returns {Promise<User>} The user
   */
  async validate(email: string, password: string): Promise<User> {
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUniqueOrThrow({
          where: {
            email: email,
          },
        });

        const isValid = await this.authHelper.verifyCredential(
          password,
          foundUser.password,
        );

        if (!foundUser || !isValid) {
          throw new BadRequestException(this.messageHelper.USER_LOGIN_FAILED);
        }

        if (!foundUser && !foundUser.isVerified) {
          throw new BadRequestException(
            this.messageHelper.USER_VERIFICATION_FAILED,
          );
        }

        return foundUser;
      });
      return user;
    } catch (e) {
      this.logger.error(this.messageHelper.USER_VALIDATION_FAILED, {
        error: e,
        user: { email: email },
      });
      throw new BadRequestException(this.messageHelper.UNEXPECTED_RESULT, {
        description: e?.message,
      });
    }
  }

  /**
   * Register a user by email and password
   * @param {Prisma.UserCreateInput} data The request data
   * @returns {Promise<APIResponse<any>>} Redirects to signup success page if successful
   */
  public async signup(data: Prisma.UserCreateInput): Promise<APIResponse<any>> {
    this.logger.log('Register user with email and password');
    try {
      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            email: data.email,
          },
        });

        if (foundUser) {
          throw new Error(this.messageHelper.USER_REGISTER_FAILED);
        }

        const hashedPassword = await this.authHelper.hashCredential(
          data.password,
        );

        if (!hashedPassword) {
          throw new Error('Password Hashing failed');
        }

        const newUser = await tx.user.create({
          select: {
            id: true,
            email: true,
            password: true,
          },
          data: {
            email: data.email,
            password: hashedPassword,
          },
        });

        const expiryTimeInSecs = 14400;

        const expiryTimeInSecondstoElaspedFromNow =
          this.authHelper.getEpochSecondsFromCreatedAt(
            new Date().toISOString(),
          ) + expiryTimeInSecs;

        const jwtToken = await this.authHelper.signPayload(
          { id: newUser.id, email: newUser.email },
          {
            expiry_time_in_secs: expiryTimeInSecs,
            subject: 'Jetei Verification JWT Token',
          },
        );

        if (!jwtToken) {
          throw new Error(
            `${this.messageHelper.UNEXPECTED_RESULT} for JWT Token Creation`,
          );
        }

        const newUserToken = await tx.user.update({
          where: {
            id: newUser.id,
          },
          data: {
            tokens: {
              create: [
                {
                  name: `user_tokens:${newUser.id}`,
                  content: jwtToken,
                  expiryTimeInSecsToBeElaspedFromNow: Number(
                    expiryTimeInSecondstoElaspedFromNow,
                  ),
                },
              ],
            },
          },
        });

        if (!newUserToken) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }

        // await this.mailerService.sendEmail('base', {
        //   subject: 'Jetei Account Created',
        //   to: newUser.email,
        //   templatePath: './registration-successful',
        //   data: {
        //     url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/account/verification?token=${jwtToken}` : `${this.appConfig.environment.NODE_ENV}/verification?token=${jwtToken}`}`,
        //   },
        // });
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Signup successful`,
        api_description: 'Please check your email',
      };
    } catch (e) {
      this.logger.error(this.messageHelper.UNEXPECTED_RESULT, {
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Log in a user
   * @param {RequestUser} req The request user
   * @returns {void} Passes the user to request object
   */
  public async login(req: RequestUser, res: Response): Promise<void> {
    this.logger.log(`Log in user`);
    try {
      // if (!req.user.isVerified) {
      //   throw new Error(this.messageHelper.USER_VERIFICATION_FAILED);
      // }
      return res.redirect('/workspace');
    } catch (e) {
      this.logger.error(this.messageHelper.USER_LOGIN_FAILED, {
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Verify a user by token
   * @param token The token passed via the request
   * @returns {Promise<APIResponse<any>>} Redirects to login page if successful
   */
  public async verify(params: UserVerifyAccountDto): Promise<APIResponse<any>> {
    this.logger.log('Verify user account by token');
    try {
      await this.prisma.$transaction(async (tx) => {
        const authToken = await tx.authToken.findFirst({
          where: {
            content: params.token,
          },
        });

        if (!authToken) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const foundUser = await tx.user.findFirst({
          where: {
            id: authToken.userId,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING);
        }

        const decoded = await this.authHelper.verifyToken(authToken.content);

        if (!decoded) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const isTokenExpired = await this.authHelper.isTokenExpired(
          authToken.expiryTimeInSecsToBeElaspedFromNow,
        );

        if (!isTokenExpired) {
          throw new Error(this.messageHelper.EXPIRED_TOKEN);
        }

        const updatedUser = await tx.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            isVerified: true,
            tokens: {
              update: {
                where: {
                  id: authToken.id,
                },
                data: {
                  isBlackListed: true,
                },
              },
            },
          },
        });

        if (!updatedUser) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }
        await this.mailerService.sendEmail('base', {
          subject: 'Jetei Account Verification',
          to: foundUser.email,
          templatePath: './verification-successful',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/login` : `${this.appConfig.environment.NODE_ENV}/login`}`,
          },
        });
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Account Verification successful`,
        api_description: 'Please proceed to login',
      };
    } catch (e) {
      this.logger.error(this.messageHelper.USER_VERIFICATION_FAILED, {
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Forgot password by email
   * @param {Prisma.UserWhereUniqueInput} data The data passed
   * @returns {Promise<void>} Sends a email if the user account exists
   */

  public async forgotPassword(
    data: Prisma.UserWhereUniqueInput,
  ): Promise<APIResponse<any>> {
    this.logger.log(`Forget password of user with email: ${data.email}`);
    try {
      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUniqueOrThrow({
          where: {
            email: data.email,
            ...data,
          },
        });
        if (!foundUser) {
          throw new Error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING);
        }

        const expiryTimeInSecs = 14400;

        const expiryTimeInSecondstoElaspedFromNow =
          this.authHelper.getEpochSecondsFromCreatedAt(
            new Date().toISOString(),
          ) + expiryTimeInSecs;

        const jwtToken = await this.authHelper.signPayload(
          { id: foundUser.id, email: foundUser.email },
          {
            expiry_time_in_secs: expiryTimeInSecs,
            subject: 'Jetei Reset Password JWT Token',
          },
        );

        if (!jwtToken) {
          throw new Error(this.messageHelper.UNEXPECTED_RESULT);
        }
        const updatedUser = await tx.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            tokens: {
              create: [
                {
                  name: `user_tokens:${foundUser.id}`,
                  content: jwtToken,
                  expiryTimeInSecsToBeElaspedFromNow:
                    expiryTimeInSecondstoElaspedFromNow,
                },
              ],
            },
          },
        });
        if (!updatedUser) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }
        await this.mailerService.sendEmail('base', {
          subject: 'Jetei Account Reset Password',
          to: updatedUser.email,
          templatePath: './reset-password-started',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/account/reset-password?token=${jwtToken}` : `${this.appConfig.environment.NODE_ENV}/account/reset-password?token=${jwtToken}`}`,
          },
        });
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Forgot password started`,
        api_description: "We've sent you a reset link to your email",
      };
    } catch (e) {
      this.logger.error(this.messageHelper.USER_FORGOT_PASSWORD_FAILED, {
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Reset a user
   * @param {string} token The jwt token for reset password
   * @param {UserResetPasswordDto} data The data passed
   * @returns {Promise<APIResponse<any>>} redirects to account reset confirmed page if successful
   */
  public async ResetPasswordByToken(
    token: string,
    data: UserResetPasswordDto,
  ): Promise<APIResponse<any>> {
    this.logger.log(`Reset password of user with email: ${data.email}`);
    try {
      await this.prisma.$transaction(async (tx) => {
        const foundToken = await tx.authToken.findFirstOrThrow({
          where: {
            content: token,
          },
        });

        if (!foundToken) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const decoded = await this.authHelper.verifyToken(foundToken.content);

        if (!decoded) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const isTokenExpired = await this.authHelper.isTokenExpired(
          foundToken.expiryTimeInSecsToBeElaspedFromNow,
        );

        if (!isTokenExpired) {
          throw new Error(this.messageHelper.EXPIRED_TOKEN);
        }

        const hashedPassword = await this.authHelper.hashCredential(
          data.new_password,
        );

        if (!hashedPassword) {
          throw new Error(this.messageHelper.UNEXPECTED_RESULT);
        }

        const updatedUser = await tx.user.update({
          where: {
            id: foundToken.userId,
          },
          data: {
            password: hashedPassword,
            tokens: {
              update: {
                where: {
                  id: foundToken.id,
                },
                data: {
                  isBlackListed: true,
                },
              },
            },
          },
        });
        if (!updatedUser) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }
        await this.mailerService.sendEmail('base', {
          subject: 'Jetei Account Reset Password Done',
          to: updatedUser.email,
          templatePath: './reset-password-done',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/login` : `${this.appConfig.environment.NODE_ENV}/login`}`,
          },
        });
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Password reset successfully`,
        api_description: 'Your account has been recovered successfully',
      };
    } catch (e) {
      this.logger.error(this.messageHelper.USER_FORGOT_PASSWORD_FAILED, {
        error: e,
        user: {
          email: data.email,
        },
      });
      throw new BadRequestException(this.messageHelper.INVALID_TOKEN);
    }
  }

  /**
   * Set the user token per login
   * @param {RequestUser} req The request object
   * @return {Promise<void>}
   */
  public async setUserToken(req: RequestUser, res: Response) {
    this.logger.log(`Set the user jwt token for websocket concnetion`);
    try {
      if (!req.user.id) {
        throw new Error(this.messageHelper.USER_VALIDATION_FAILED);
      }
      const token = await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.id,
          },
        });
        if (!foundUser) {
          throw new Error(this.messageHelper.RETRIEVAL_ACTION_FAILED);
        }

        const expiryTimeInSecondstoElaspedFromNow =
          this.authHelper.getEpochSecondsFromCreatedAt(
            new Date().toISOString(),
          ) + this.appConfig.authentication.COOKIE_MAX_AGE;

        /**
         * Note: JWT Token expiry would be the max age of a cookie so that Websocket connection will persist
         */
        const jwtToken = await this.authHelper.signPayload(
          {
            id: foundUser.id,
            email: foundUser.email,
          },
          {
            expiry_time_in_secs: this.appConfig.authentication.COOKIE_MAX_AGE,
            subject: 'Jetei Session Persist JWT Token',
          },
        );

        if (!jwtToken) {
          throw new Error(
            `${this.messageHelper.UNEXPECTED_RESULT} for JWT Token Creation`,
          );
        }

        const updatedUser = await tx.user.update({
          where: {
            id: foundUser.id,
          },
          data: {
            tokens: {
              create: [
                {
                  name: `user_tokens:${foundUser.id}`,
                  content: jwtToken,
                  expiryTimeInSecsToBeElaspedFromNow: Number(
                    expiryTimeInSecondstoElaspedFromNow,
                  ),
                },
              ],
            },
          },
        });

        if (!updatedUser) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }

        const foundToken = await tx.authToken.findFirst({
          where: {
            content: jwtToken,
          },
        });

        if (!foundToken) {
          throw new Error(this.messageHelper.RETRIEVAL_ACTION_FAILED);
        }

        return foundToken;
      });
      res.set('Authorization', `Bearer ${token.content} ${token.id}`);
    } catch (e) {
      this.logger.error(this.messageHelper.UPDATE_ACTION_FAILED, {
        context: `Set user token for user ${req.user.id}`,
        error: e,
      });
      throw new Error(e);
    }
  }
  /**
   * Invalidate user token on logout or expiry time
   * @param req The request object
   * @returns {Promise<void>}
   */
  public async invalidateUserToken(req: RequestUser, res: Response) {
    this.logger.log(`Invalidate token for user ${req.user.id}`);
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new Error(this.messageHelper.HTTP_UNAUTHORIZED);
      }

      const tokenId = authHeader.split(' ')[2];

      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.id,
          },
        });
        if (!foundUser) {
          throw new Error(this.messageHelper.RETRIEVAL_ACTION_FAILED);
        }
        const updatedToken = await tx.authToken.update({
          where: {
            id: tokenId,
          },
          data: {
            isBlackListed: true,
          },
        });

        if (!updatedToken) {
          throw new Error(this.messageHelper.UPDATE_ACTION_FAILED);
        }
      });
      return res.set('Authorization', 'Bearer ');
    } catch (e) {
      this.logger.error(this.messageHelper.UPDATE_ACTION_FAILED, {
        context: `Failed to invalidate token for user ${req.user.id}`,
        error: e,
      });
      throw new Error(e);
    }
  }
}
