import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import { SiteHelpers, MessageHelpers } from '@/common/helpers/app.helpers';
import { RequestUser } from '@/interfaces';
import { AuthenticationService } from '@/domain/api/v1/authentication/authentication.service';
import { AppConfig, SiteConfig } from '@/lib/config/config.provider';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { Response, Request } from 'express';
import { v4 } from 'uuid';
import { SearchQueryDto } from './common/dtos/app.dtos';
import { APIResponse, SearchResult } from './types';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly appConfig = AppConfig;
  private readonly siteHelpers = SiteHelpers;
  private readonly messageHelpers = MessageHelpers;
  private readonly siteConfig = SiteConfig;
  private readonly logoutUrl = '/account/logout';
  constructor(
    private readonly healthService: HealthCheckService,
    private readonly dbService: PrismaHealthIndicator,
    private readonly authService: AuthenticationService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get the health status of the application
   * @returns {Promise<{name: string; colur: string}>} The Status Response
   */
  public async healthCheck(): Promise<{ name: string; colour: string }> {
    const status = await this.healthService.check([
      () => this.dbService.pingCheck('database', this.prisma),
    ]);
    if (status.status === 'ok') {
      return {
        name: 'Operational',
        colour: 'bg-blue-500',
      };
    }
    return {
      name: 'Error',
      colour: 'bg-red-500',
    };
  }

  /**
   * Get index page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getIndex(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei homepage`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;

      const canonicalURL = getCanonicalUrl(req);
      const status = await this.healthCheck();

      setLocals(req, res);

      return res.render('views/index', {
        canonicalURL: canonicalURL,
        title: `${this.siteConfig.name} - Collaborate instantly, learn collectively`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        user: req.user,
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get login page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getLogin(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Login page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/login', {
        canonicalURL: canonicalURL,
        title: `Login into your acccount | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        api_url: '/api/v1/authentication/login',
        form_id: 'login-form',
        form_name: 'Login',
        redirectUrl: '/workspace',
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Callback for Github Authentication
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response if successful
   */
  public async githubAuthCallback(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Github callback for user: ${req.user}`);
    try {
      const tokenId = v4();

      const accessToken = await this.authService.createToken(
        {
          sub: req.user.sub,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
        },
        tokenId,
        36000,
      );

      if (!accessToken) {
        throw new Error(`${this.messageHelpers.CREATE_ACTION_FAILED} - Token`);
      }

      const newUserToken = await this.prisma.authToken.create({
        data: {
          name: `access_token:${req.user.sub}`,
          content: `${accessToken}--${tokenId}`,
          userId: req.user.sub,
          expiryInMilliSecs: '36000000',
        },
      });

      if (!newUserToken) {
        throw new Error(
          `${this.messageHelpers.CREATE_ACTION_FAILED} - AuthToken`,
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
      return;
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Logout user
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response if sucessful
   */
  public async getLogout(req: RequestUser, res: Response) {
    this.logger.log(`Log out authenticated user: ${req.user.sub}`);
    await this.authService.invalidateUserToken(req, res);
  }

  /**
   * Get signup page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getSignup(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Signup page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/signup', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Create an account | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        api_url: '/api/v1/authentication/signup',
        form_id: 'signup-form',
        form_name: 'Signup',
        redirectUrl: '/account/signup-successful',
        logoutUrl: this.logoutUrl,
        nonce: generateNonce(),
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get forgot password page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getForgotPassword(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Forgot password page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/forgot-password', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Forgot Password | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        api_url: '/api/v1/authentication/forgot-password',
        form_id: 'forgot-password-form',
        form_name: 'Forgot password',
        redirectUrl: '/account/forgot-password/started',
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getForgotPasswordStarted(
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Forgot password started page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/forgot-password-started', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Forgot Password Started | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get signup successful page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getSignUpSuccessful(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Signup success page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/signup-successful', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Signup successful | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get verification page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @param {string} token The token passed for user verification
   * @returns {Promise<void>} The HTML response
   */
  public async getVerification(
    req: Request,
    res: Response,
    token: string,
  ): Promise<void> {
    this.logger.log(`Get Jetei Account verification page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();

      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/verification', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Account Verification | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        api_url: `/api/v1/authentication/verify-account?token=${token}`,
        form_id: 'verify-account-form',
        form_name: 'Verify account',
        redirectUrl: '/account/verification-successful',
        token: token,
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get verification successful page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getVerificationSuccessful(
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Account verification success page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/verification-successful', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Verification successful | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get forbidden page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getForbidden(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei 403 page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/403', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `403 - Access denied | ${this.siteConfig.name}`,
        description: `403 Error — Access denied for resource | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get unauthorized page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getUnauthorized(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei 401 page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/401', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `401 - Unauthorized | ${this.siteConfig.name}`,
        description: `401 Error - Unauthorized | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get resource not found page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getNotFound(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei 404 page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/404', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${SiteConfig.ogImagePath}`,
        title: `404 - Not Found | ${SiteConfig.name}`,
        description: `404 Error — this page was not found | ${SiteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...SiteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get privacy page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getPrivacy(req: Request, res: Response): Promise<void> {
    this.logger.log(`Get Jetei privacy page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/privacy', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${SiteConfig.ogImagePath}`,
        title: `Privacy | ${SiteConfig.name}`,
        description: `Privacy | ${SiteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...SiteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get settings page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getUserSettings(req: RequestUser, res: Response): Promise<void> {
    this.logger.log(`Get Jetei User Settings page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render(`views/settings/index`, {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${SiteConfig.ogImagePath}`,
        title: `Settings | ${SiteConfig.name}`,
        description: `Settings | ${SiteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        form_id: 'get-details',
        api_url: '/api/v1/authentication/me',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...SiteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get internal server error page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getInternalServerError(
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei 500 page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/500', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `500 - Internal Server Error | ${this.siteConfig.name}`,
        description: `500 Error — something went wrong | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.UNEXPECTED_RESULT,
      );
    }
  }

  /**
   * Get reset password page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getResetPasswordByToken(
    req: Request,
    res: Response,
    token: string,
  ): Promise<void> {
    this.logger.log(`Get Jetei Reset password page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const canonicalURL = getCanonicalUrl(req);
      const status = await this.healthCheck();

      setLocals(req, res);

      return res.render('views/auth/reset-password', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Reset Password | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        status: status,
        user: req.user,
        api_url: `/api/v1/authentication/reset-password?token=${token}`,
        form_id: 'reset-password-form',
        form_name: 'Reset password',
        redirectUrl: '/account/reset-confirmed',
        logoutUrl: this.logoutUrl,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get reset password successful page
   * @param {Request} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getResetPasswordConfirmed(
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Reset Password confirmed page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/reset-successful', {
        canonicalURL: canonicalURL,
        title: `Reset Password Confirmed | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspace(req: RequestUser, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Workspace page for user: ${req.user.sub}`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/index', {
        canonicalURL: canonicalURL,
        title: `Your Workspace | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        form_id: 'workspace-get-details',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        api_url: '/api/v1/hubs/latest-notes-and-chats',
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace bookwark page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceBookmarks(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace Bookwarks page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/bookmarks/index', {
        canonicalURL: canonicalURL,
        title: `Your Bookmarks | ${this.siteConfig.name}`,
        description: `Your Bookmarks | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        api_url: '/api/v1/authentication/me/bookmarks',
        form_id: 'get-bookmarks',
        form_name: 'Create Bookmark',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace bookmark create page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceBookmarksCreate(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace Bookwarks create page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/bookmarks/new', {
        canonicalURL: canonicalURL,
        title: `Create a Bookmark | ${this.siteConfig.name}`,
        description: `Create a Bookmark | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        api_url: '/api/v1/authentication/me/bookmarks',
        form_id: 'create-bookmarks',
        form_name: 'Create Bookmark',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hubs page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubs(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace Hubs page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/index', {
        canonicalURL: canonicalURL,
        title: `Your Hubs | ${this.siteConfig.name}`,
        description: `Your Hubs | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        form_id: 'get-hub',
        api_url: '/api/v1/hubs',
        form_name: 'Hub get',
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hubs create page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubsCreate(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace Hubs create page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/new', {
        canonicalURL: canonicalURL,
        title: `Create Hub | ${this.siteConfig.name}`,
        description: `Create Hub | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        form_id: 'hub-create',
        api_url: '/api/v1/hubs',
        form_name: 'Hub create',
        nonce: generateNonce(),
        redirectUrl: '/workspace/hubs',
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hubs edit page
   * @param {string} hubId The id of hub
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubsEdit(
    hubId: string,
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace Hubs edit page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/edit', {
        canonicalURL: canonicalURL,
        title: `Edit Hub | ${this.siteConfig.name}`,
        description: `Edit Hub | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        form_id: 'hub-edit',
        api_url: `/api/v1/hubs/${hubId}`,
        form_name: 'Hub edit',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace add hub invitee page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubAddInvitee(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace add invitee to hub page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/invitees/new', {
        canonicalURL: canonicalURL,
        title: `Invite to Hub | ${this.siteConfig.name}`,
        description: `Invite to Hub | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        ws_url: `${AppConfig.environment.NODE_ENV === 'development' ? `ws://localhost:${AppConfig.environment.WS_PORT}` : `wss://${req.hostname}:${AppConfig.environment.WS_PORT}`}`,
        form_id: `hub-add-invitee`,
        api_url: `/api/v1/hubs/add-invitee`,
        form_name: 'Hub add invitee',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hubs edit invitee page
   * @param {string} hubId The id of the hub
   * @param {string} inviteeId  The id of the invitee
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubInviteeEdit(
    hubId: string,
    inviteeId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace edit invitee to hub page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/invitees/edit', {
        canonicalURL: canonicalURL,
        title: `Edit Invitee Privileges | ${this.siteConfig.name}`,
        description: `Edit Invitee Privileges | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        hubId: hubId,
        inviteeId: inviteeId,
        form_id: `hub-edit-invitee-${inviteeId}`,
        api_url: `/api/v1/hubs/${hubId}/invitees/${inviteeId}`,
        form_name: 'Hub edit invitee',
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hub by id page
   * @param {string} hubId The id of hub
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubById(
    hubId: string,
    req: RequestUser,
    res: Response,
  ) {
    this.logger.log(`Get the details for the hub: ${hubId}`);
    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/id', {
        canonicalURL: canonicalURL,
        title: `Your Hub  | ${this.siteConfig.name}`,
        description: `Your Hub | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        user: req.user,
        form_id: `get-hub-${hubId}`,
        api_url: `/api/v1/hubs/${hubId}`,
        hubId: hubId,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hub create note page
   * @param {string} hubId The id of hub
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubCreateNewNote(
    hubId: string,
    req: RequestUser,
    res: Response,
  ) {
    this.logger.log(`Get page for the hub: ${hubId} to create new note`);
    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/notes/new', {
        canonicalURL: canonicalURL,
        title: `Create a Note | ${this.siteConfig.name}`,
        description: `Create a Note | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        api_url: `/api/v1/hubs/${hubId}/notes`,
        form_id: `create-note`,
        form_name: 'Create Note',
        hubId: hubId,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hub edit note by id page
   * @param {string} hubId The id of hub
   * @param {string} noteId The id of note
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceHubByIdNoteByIdEdit(
    hubId: string,
    noteId: string,
    req: RequestUser,
    res: Response,
  ) {
    this.logger.log(`Get page for editing note: ${noteId} in hub: ${hubId}`);
    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/hubs/notes/edit', {
        canonicalURL: canonicalURL,
        title: `Edit Note | ${this.siteConfig.name}`,
        description: `Edit Note | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        ws_url: `${AppConfig.environment.NODE_ENV === 'development' ? `ws://localhost:${AppConfig.environment.WS_PORT}` : `wss://${req.hostname}:${AppConfig.environment.WS_PORT}`}`,
        note_link_url: `/api/v1/hubs/${hubId}/notes/${noteId}/link`,
        form_id: `edit-note`,
        form_name: 'Edit Note',
        hubId: hubId,
        noteId: noteId,
        user: req.user,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        status: status,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hub create chat page
   * @param {string} hubId The id of hub
   * @param {string} noteId The id of note
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceChatById(
    chatId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace chat page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/chats/id', {
        canonicalURL: canonicalURL,
        title: `Chat | ${this.siteConfig.name}`,
        description: `Chat | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        user: req.user,
        ws_url: `${AppConfig.environment.NODE_ENV === 'development' ? `ws://localhost:${AppConfig.environment.WS_PORT}` : `wss://${req.hostname}`}`,
        form_id: 'chat-form',
        chatId: chatId,
        form_name: 'Chat',
        logoutUrl: this.logoutUrl,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get workspace hub create chat page
   * @param {RequestUser} req The request object
   * @param {Response} res The response object
   * @returns {Promise<void>} The HTML response
   */
  public async getWorkspaceChatCreate(
    req: RequestUser,
    res: Response,
  ): Promise<void> {
    this.logger.log(`Get Jetei Workspace chat create page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();
      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/workspace/chats/new', {
        canonicalURL: canonicalURL,
        title: `New Chat | ${this.siteConfig.name}`,
        description: `New Chat | ${this.siteConfig.name}`,
        ip: req.ip,
        nonce: generateNonce(),
        user: req.user,
        ws_url: `${AppConfig.environment.NODE_ENV === 'development' ? `ws://localhost:${AppConfig.environment.WS_PORT}` : `wss://${req.hostname}`}`,
        api_url: `/api/v1/hubs/invitees`,
        form_id: 'new-chat-form',
        form_name: 'New Chat',
        status: status,
        logoutUrl: this.logoutUrl,
        ...this.siteConfig,
      });
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(
        this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get or crate a chat for user
   * @param req The request object
   * @param inviteeId The id of the invitee
   * @returns {Promise<void>} Redirects to a chat
   */
  public async createOrFindChatforUserWithInvitee(
    req: RequestUser,
    res: Response,
    inviteeId: string,
  ): Promise<void> {
    this.logger.log(`Get or create chat for user with invitee ${inviteeId}`);

    try {
      const foundChat = await this.prisma.chat.findFirst({
        where: {
          participants: {
            some: {
              inviteeId: inviteeId,
              userId: req.user.sub,
            },
          },
        },
      });

      if (!foundChat) {
        const newParticipants = await this.prisma.chatParticipant.create({
          data: {
            inviteeId: inviteeId,
            userId: req.user.sub,
          },
        });

        if (!newParticipants) {
          throw new Error(this.messageHelpers.CREATE_ACTION_FAILED);
        }

        const newChat = await this.prisma.chat.create({
          data: {
            participants: {
              connect: { id: newParticipants.id },
            },
          },
        });

        if (!newChat) {
          throw new Error(this.messageHelpers.CREATE_ACTION_FAILED);
        }

        return res.redirect(302, `/workspace/chats/${newChat.id}`);
      }

      return res.redirect(302, `/workspace/chats/${foundChat.id}`);
    } catch (e) {
      this.logger.error(this.messageHelpers.HTTP_INTERNAL_SERVER_ERROR, {
        error: e,
      });
      throw new InternalServerErrorException(e);
    }
  }

  /**
   * Get workspace hub search results
   * @param {RequestUser} req The request object
   * @param {SearchQueryDto} query The search query
   * @returns {Promise<string>} The HTML response
   */
  public async getWorkspaceSearchResults(
    req: RequestUser,
    query: SearchQueryDto,
  ): Promise<string> {
    this.logger.log(
      `Get search results for prefix: ${query.prefix} for text: ${query.text} `,
    );

    try {
      const { data } = await this.searchQueryBuilder(req, query);
      return this.buildSearchResultsHTMLResponse(data as SearchResult[]);
    } catch (e) {
      this.logger.error(this.messageHelpers.RETRIEVAL_ACTION_FAILED, {
        error: e,
      });
      throw new BadRequestException(e);
    }
  }

  /**
   * Builds search results
   * @param {RequestUser} req The request object
   * @param {SearchQueryDto} query The query passed
   * @returns {Promise<APIResponse<SearchResult[]>>} The API response
   */
  private async searchQueryBuilder(
    req: RequestUser,
    query: SearchQueryDto,
  ): Promise<APIResponse<SearchResult[]>> {
    try {
      if (query.prefix === 'bookmarks:') {
        const foundBookmarks = await this.prisma.bookmark.findMany({
          where: {
            userId: req.user.sub,
            name: {
              contains: query.text,
              mode: 'insensitive',
            },
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: 4,
        });

        if (foundBookmarks.length === 0) {
          return {
            type: 'success',
            status_code: 200,
            data: [],
          };
        }

        const data: SearchResult[] = foundBookmarks.map((b) => {
          return {
            name: b.name,
            url: `/workspace/bookmarks/${b.id}`,
            updatedAt: this.siteHelpers.formatDistanceToNow(b.updatedAt),
          };
        });
        return {
          type: 'success',
          status_code: 200,
          data: data,
        };
      } else if (query.prefix === 'notes:') {
        const foundNotes = await this.prisma.note.findMany({
          where: {
            name: {
              contains: query.text,
              mode: 'insensitive',
            },
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: 4,
        });

        if (foundNotes.length === 0) {
          return {
            type: 'success',
            status_code: 200,
            data: [],
          };
        }

        const data: SearchResult[] = foundNotes.map((n) => {
          return {
            name: n.name,
            description: n.text,
            url: `/workspace/hubs/${n.hubId}/notes/${n.id}/edit`,
            updatedAt: this.siteHelpers.formatDistanceToNow(n.updatedAt),
          };
        });
        return {
          type: 'success',
          status_code: 200,
          data: data,
        };
      } else if (query.prefix === 'hubs:') {
        const foundHubs = await this.prisma.hub.findMany({
          where: {
            userId: req.user.sub,
            name: {
              contains: query.text,
              mode: 'insensitive',
            },
          },
          orderBy: [{ updatedAt: 'desc' }],
          take: 4,
        });

        if (foundHubs.length === 0) {
          return {
            type: 'success',
            status_code: 200,
            data: [],
          };
        }

        const data: SearchResult[] = foundHubs.map((h) => {
          return {
            name: h.name,
            description: h.description,
            url: `/workspace/hubs/${h.id}`,
            updatedAt: this.siteHelpers.formatDistanceToNow(h.updatedAt),
          };
        });
        return {
          type: 'success',
          status_code: 200,
          data: data,
        };
      } else {
        throw new Error(`Unknown prefix: ${query.prefix}`);
      }
    } catch (e) {
      throw new Error(e);
    }
  }

  /**
   * Builds the HTML response
   * @param {SearchResult[]} result The search results
   * @returns {string} THe HTML Response
   */
  private buildSearchResultsHTMLResponse(result: SearchResult[]): string {
    let HTML = '';

    if (result.length === 0) {
      HTML += `
      <div class="px-4 py-3 btn-outline rounded-md w-full">
        <div class="flex items-center justify-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-search-x"><path d="m13.5 8.5-5 5"/><path d="m8.5 8.5 5 5"/><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <p class="text-sm font-medium text-center">
            Oops! We can't find what you are looking for!
          </p>
        </div>
      </div>
      `;
      return HTML;
    }

    for (let i = 0; i < result.length; i++) {
      const data = result[i];
      HTML += `
      <a
        class="mb-5 flex px-4 py-2 justify-between gap-x-6 btn-outline rounded-md cursor-pointer w-full"
        href="${data.url}"
      >
        <div class="flex min-w-0 gap-x-4">
          <div class="min-w-0 flex-auto">
            <p
              class="text-sm font-semibold leading-6 text-foreground"
            >
              ${data.name}
            </p>
            <p
              class="mt-1 truncate text-xs leading-5 text-gray-500"
            >
              ${!data?.description ? '' : data.description}
            </p>
          </div>
        </div>
        <div
          class="hidden shrink-0 sm:flex sm:flex-col sm:items-end"
        >
          <p class="mt-1 text-xs leading-5 text-gray-500">
            ${data.updatedAt}
          </p>
          <p class="text-sm leading-6 text-muted-foreground">
          </p>
        </div>
      </a> 
      `;
    }
    return HTML;
  }
}
