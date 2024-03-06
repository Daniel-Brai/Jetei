import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { v4 } from 'uuid';
import { RequestUser } from '@/interfaces';
import { APIResponse, JwtPayload } from '@/types';
import {
  AuthenticationHelpers,
  MessageHelpers,
  SiteHelpers,
} from '@/common/helpers/app.helpers';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { MailerService } from '@/lib/mailer/mailer.service';
import {
  UserForgetPasswordDto,
  UserLoginDto,
  UserResetPasswordDto,
  UserSignUpDto,
  UserVerifyAccountDto,
} from './dtos/authentication.dtos';
import { AppConfig } from '@/lib/config/config.provider';

@Injectable()
export class AuthenticationService {
  private readonly logger = new Logger(AuthenticationService.name);
  private readonly appConfig = AppConfig;
  private readonly authHelper = AuthenticationHelpers;
  private readonly siteHelper = SiteHelpers;
  private readonly messageHelper = MessageHelpers;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailerService: MailerService,
  ) {}

  /**
   * Register a user by email and password
   * @param {UserSignUpDto} data The request data
   * @returns {Promise<APIResponse<any>>} Redirects to signup success page if successful
   */
  public async signup(data: UserSignUpDto): Promise<APIResponse<any>> {
    this.logger.log(`Register user with email: ${data.email}`);
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
          throw new Error(
            `${this.messageHelper.UNEXPECTED_RESULT} - Password Hashing failed`,
          );
        }

        const newUser = await tx.user.create({
          select: {
            id: true,
            email: true,
            password: true,
            role: true,
          },
          data: {
            email: data.email,
            password: hashedPassword,
          },
        });

        if (!newUser) {
          throw new Error(`${this.messageHelper.CREATE_ACTION_FAILED} - User`);
        }

        const newProfile = await tx.profile.create({
          data: {
            name: data.name,
            userId: newUser.id,
          },
        });

        if (!newProfile) {
          throw new Error(
            `${this.messageHelper.CREATE_ACTION_FAILED} - Profile`,
          );
        }

        const tokenId = v4();

        const verificationToken = await this.createToken(
          {
            sub: newUser.id,
            name: newProfile.name,
            email: newUser.email,
            role: newUser.role,
          },
          tokenId,
          14400,
        );

        if (!verificationToken) {
          throw new Error(`${this.messageHelper.CREATE_ACTION_FAILED} - Token`);
        }

        const newUserToken = await tx.authToken.create({
          data: {
            name: `verification_token:${newUser.id}`,
            content: `${verificationToken}-${tokenId}`,
            userId: newUser.id,
            expiryInMilliSecs: 14400000,
          },
        });

        if (!newUserToken) {
          throw new Error(
            `${this.messageHelper.CREATE_ACTION_FAILED} - AuthToken`,
          );
        }

        await this.mailerService.sendEmail('base', {
          subject: 'Jetei Account Creation',
          to: newUser.email,
          templatePath: './registration-successful',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/account/verification?token=${newUserToken.content}` : `${this.appConfig.environment.NODE_ENV}/verification?token=${newUserToken.content}`}`,
          },
        });
      });
      return {
        type: 'success',
        status_code: 200,
        api_message: `Signup successful`,
        api_description: 'Please check your email',
      };
    } catch (e) {
      this.logger.error(this.messageHelper.CREATE_ACTION_FAILED, {
        context: `Failed to create user ${data.email}`,
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Log in a user via email and password
   * @param {UserLoginDto} data The data passed to create the user
   * @param {Response} res The response object
   * @returns {any} Passes the user cookies to response object
   */
  public async login(data: UserLoginDto, res: Response): Promise<any> {
    this.logger.log(`Log in user with email: ${data.email}`);
    try {
      const foundUser = await this.validateUser(data.email);

      if (!foundUser) {
        throw new Error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING);
      }

      const isValid = await this.authHelper.verifyCredential(
        data.password,
        foundUser.password,
      );

      if (!isValid) {
        throw new Error(this.messageHelper.USER_LOGIN_FAILED);
      }

      const tokenId = v4();

      const accessToken = await this.createToken(
        {
          sub: foundUser.id,
          name: foundUser.profile.name,
          email: foundUser.email,
          role: foundUser.role,
        },
        tokenId,
        36000,
      );

      if (!accessToken) {
        throw new Error(`${this.messageHelper.CREATE_ACTION_FAILED} - Token`);
      }

      const newUserToken = await this.prisma.authToken.create({
        data: {
          name: `access_token:${foundUser.id}`,
          content: `${accessToken}-${tokenId}`,
          userId: foundUser.id,
          expiryInMilliSecs: 36000000,
        },
      });

      if (!newUserToken) {
        throw new Error(
          `${this.messageHelper.CREATE_ACTION_FAILED} - AuthToken`,
        );
      }

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure:
          this.appConfig.environment.NODE_ENV === 'production' ? true : false,
        expires: new Date(Date.now() + 36000000),
        sameSite: 'lax',
      });
      res.cookie('accessTokenId', tokenId, {
        httpOnly: true,
        secure:
          this.appConfig.environment.NODE_ENV === 'production' ? true : false,
        expires: new Date(Date.now() + 36000000),
        sameSite: 'lax',
      });
      return res.send({
        status_code: 200,
        type: 'success',
        api_message: 'Login successful',
        api_description: 'Proceeding to your workspace...',
      } as APIResponse<any>);
    } catch (e) {
      this.logger.error(this.messageHelper.USER_LOGIN_FAILED, {
        context: `Unable to login in user :${data.email}`,
        error: e,
      });
      throw new BadRequestException(e?.message);
    }
  }

  /**
   * Verify a user by token
   * @param {UserVerifyAccountDto} query The query passed via the request
   * @returns {Promise<APIResponse<any>>} Redirects to login page if successful
   */
  public async verify(query: UserVerifyAccountDto): Promise<APIResponse<any>> {
    this.logger.log('Verify user account by token');
    try {
      await this.prisma.$transaction(async (tx) => {
        const authToken = await tx.authToken.findFirst({
          where: {
            content: query.token,
          },
        });

        if (!authToken) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const authArr = this.siteHelper.splitAtFirstOccurrenceRegex(
          authToken.content,
          '-',
        );

        const jwtToken = authArr[0];
        const tokenId = authArr[1];

        const decoded = await this.validateToken(jwtToken, tokenId);

        if (!decoded) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const expiryDate = new Date(
          authToken.createdAt.getMilliseconds() + authToken.expiryInMilliSecs,
        );

        const currentDate = new Date(Date.now());

        if (currentDate > expiryDate) {
          throw new Error(this.messageHelper.EXPIRED_TOKEN);
        }

        const foundUser = await tx.user.findUnique({
          where: {
            id: authToken.userId,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING);
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
   * @param {UserForgetPasswordDto} data The data passed
   * @returns {Promise<void>} Sends a email if the user account exists
   */

  public async forgotPassword(
    data: UserForgetPasswordDto,
  ): Promise<APIResponse<any>> {
    this.logger.log(`Forget password of user with email: ${data.email}`);
    try {
      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUniqueOrThrow({
          where: {
            email: data.email,
          },
          include: {
            profile: true,
          },
        });

        if (!foundUser) {
          throw new Error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING);
        }

        const tokenId = v4();

        const forgotPasswordToken = await this.createToken(
          {
            sub: foundUser.id,
            name: foundUser.profile.name,
            email: foundUser.email,
            role: foundUser.role,
          },
          tokenId,
          36000,
        );

        if (!forgotPasswordToken) {
          throw new Error(`${this.messageHelper.CREATE_ACTION_FAILED} - Token`);
        }

        const newUserToken = await this.prisma.authToken.create({
          data: {
            name: `forgot_password_token:${foundUser.id}`,
            content: `${forgotPasswordToken}-${tokenId}`,
            userId: foundUser.id,
            expiryInMilliSecs: 36000000,
          },
        });

        if (!newUserToken) {
          throw new Error(
            `${this.messageHelper.CREATE_ACTION_FAILED} - AuthToken`,
          );
        }

        await this.mailerService.sendEmail('base', {
          subject: 'Jetei Account Reset Password',
          to: foundUser.email,
          templatePath: './reset-password-started',
          data: {
            url: `${this.appConfig.environment.NODE_ENV === 'development' ? `http://localhost:${this.appConfig.environment.PORT}/account/reset-password?token=${newUserToken.content}` : `${this.appConfig.environment.NODE_ENV}/account/reset-password?token=${newUserToken.content}`}`,
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
    this.logger.log(`Reset password of user`);
    try {
      await this.prisma.$transaction(async (tx) => {
        const authToken = await tx.authToken.findFirst({
          where: {
            content: token,
          },
        });

        if (!authToken) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const authArr = this.siteHelper.splitAtFirstOccurrenceRegex(
          authToken.content,
          '-',
        );

        const jwtToken = authArr[0];
        const tokenId = authArr[1];

        const decoded = await this.validateToken(jwtToken, tokenId);

        if (!decoded) {
          throw new Error(this.messageHelper.INVALID_TOKEN);
        }

        const expiryDate = new Date(
          authToken.createdAt.getMilliseconds() + authToken.expiryInMilliSecs,
        );

        const currentDate = new Date(Date.now());

        if (currentDate > expiryDate) {
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
            id: authToken.userId,
          },
          data: {
            password: hashedPassword,
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
        context: `User forgot password failed`,
        error: e,
      });
      throw new BadRequestException(this.messageHelper.INVALID_TOKEN);
    }
  }

  public async invalidateUserToken(req: RequestUser, res: Response) {
    this.logger.log(`Invalidate token for user ${req.user.sub}`);
    try {
      const token: string = req.cookies['accessToken'];
      const tokenId: string = req.cookies['accessTokenId'];

      if (!token || !tokenId) {
        throw new Error(this.messageHelper.HTTP_UNAUTHORIZED);
      }

      await this.prisma.$transaction(async (tx) => {
        const foundUser = await tx.user.findUnique({
          where: {
            id: req.user.sub,
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
      res.cookie('accessToken', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure:
          this.appConfig.environment.NODE_ENV === 'production' ? true : false,
        expires: new Date(Date.now()),
      });
      return res.send({
        status_code: 200,
        type: 'success',
      } as APIResponse<any>);
    } catch (e) {
      this.logger.error(this.messageHelper.UPDATE_ACTION_FAILED, {
        context: `Failed to invalidate token for user ${req.user.sub}`,
        error: e,
      });
      throw new Error(e);
    }
  }

  /**
   * Validates the existence of the user
   * @param email The email of the user
   * @returns {Promise<User>} The user
   */
  public async validateUser(email: string) {
    try {
      const foundUser = await this.prisma.user.findUniqueOrThrow({
        where: {
          email: email,
        },
        include: {
          profile: true,
        },
      });

      if (!foundUser) {
        throw new BadRequestException(
          this.messageHelper.USER_ACCOUNT_NOT_EXISTING,
        );
      }

      return foundUser;
    } catch (e) {
      this.logger.error(this.messageHelper.USER_ACCOUNT_NOT_EXISTING, {
        context: `User validation failed: ${email}`,
        error: e,
      });
      throw new BadRequestException(
        this.messageHelper.USER_ACCOUNT_NOT_EXISTING,
      );
    }
  }

  /**
   * Generate a jwt token
   * @param {JwtPayload} payload The jwt payload
   * @param {string} tokenId The id of jwt token
   * @param {number} expiryTime The expiry time of the token in seconds
   * @returns {Promise<string>} The token
   */
  public async createToken(
    payload: JwtPayload,
    tokenId: string,
    expiryTime: number,
  ): Promise<string> {
    const token = await this.jwtService.signAsync(payload, {
      secret: this.appConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY,
      expiresIn: expiryTime,
      jwtid: tokenId,
    });
    return token;
  }

  /**
   * Validate and decode a jwt token
   * @param {token} token The jwt token
   * @param {string} tokenId The id of jwt token
   * @returns {Promise<any>} The payload
   */
  public async validateToken(token: string, tokenId?: string): Promise<any> {
    const decoded = await this.jwtService.verifyAsync(token, {
      secret: this.appConfig.authentication.ACCESS_JWT_TOKEN_SECRET_KEY,
      jwtid: tokenId,
    });
    return decoded;
  }
}
