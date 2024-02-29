import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { HealthCheckService, PrismaHealthIndicator } from '@nestjs/terminus';
import {
  SiteHelpers,
  AuthenticationHelpers,
  MessageHelpers,
} from '@/common/helpers/app.helpers';
import { RequestUser } from '@/interfaces';
import { SiteConfig } from '@/lib/config/config.provider';
import { PrismaService } from '@/infra/gateways/database/prisma/prisma.service';
import { Response, Request } from 'express';

export const hubs = [
  {
    id: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
    name: 'My Zig Hub',
    subject:
      'Everything I know, love and plan to do with the Zig Programming Language',
    markdown: {
      text: "At its core, Zig is designed for speed and system-level interaction. Inspired by C, it embraces manual memory management, offering fine-grained control over your code's efficiency. This makes it ideal for performance-critical applications like embedded systems, game engines, and networking tools.",
    },
    updated_at: '2023-06-09T09:00:00',
  },
  {
    id: '110e8400-e29b-11d4-a716-446655440000',
    name: 'The Alchemists',
    subject: 'For the love of Elixir, OTP and Pheonix',
    markdown: {
      text: "The Alchemists are a passionate team driven by a love for the Elixir programming language. We're not just programmers, but alchemists in our crafts, transmuting complex concepts into elegant solutions and clear documentation for the future.",
    },
    updated_at: '2023-10-22T10:30:00',
  },
];

export const chats = [
  {
    id: '6c84fb90-12c4-11e1-840d-7b25c5ee775a',
    name: 'Gerard Brai',
    workspace: 'Explorers',
    subject: 'Meeting Tomorrow',
    markdown: {
      text: "Hi Daniel, let's have a meeting tomorrow to discuss the project. I've been reviewing the project details and have some ideas I'd like to share. It's crucial that we align on our next steps to ensure the project's success.\n\nPlease come prepared with any questions or insights you may have. Looking forward to our meeting!\n\nBest regards, William",
    },
    date: '2024-02-22T09:00:00',
    read: false,
  },
  {
    id: '110e8400-e29b-11d4-a716-446655440000',
    name: 'Promise Okafor',
    workspace: 'Frontend Gurus',
    subject: 'Re: Project Update',
    markdown: {
      text: "Thank you for the project update. It looks great! I've gone through the report, and the progress is impressive. The team has done a fantastic job, and I appreciate the hard work everyone has put in.\n\nI have a few minor suggestions that I'll include in the attached document.\n\nLet's discuss these during our next meeting. Keep up the excellent work!\n\nBest regards, Alice",
    },
    date: '2024-02-16T10:30:00',
    read: true,
  },
];

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  private readonly siteHelpers = SiteHelpers;
  private readonly messageHelpers = MessageHelpers;
  private readonly authHelpers = AuthenticationHelpers;
  private readonly siteConfig = SiteConfig;
  private readonly logoutUrl = '/account/logout';
  private readonly prismaService = new PrismaService();

  constructor(
    private readonly healthService: HealthCheckService,
    private readonly dbService: PrismaHealthIndicator,
  ) {}

  public async healthCheck() {
    const status = await this.healthService.check([
      () => this.dbService.pingCheck('database', this.prismaService),
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

  public getLogout(req: RequestUser, res: Response) {
    this.logger.log(`Log out authenticated user`);
    req.session.destroy((err: Error) => {
      if (err) {
        this.logger.error(this.messageHelpers.USER_LOGOUT_FAILED, {
          error: err,
          user: {
            id: req.user.id,
          },
        });
        throw new BadRequestException(err?.message);
      }
      return {
        type: 'success',
        status_code: 200,
        api_message: `Logout successful`,
        api_description: 'Proceeding to homepage...',
      };
    });
    res.redirect(301, '/');
  }

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
        api_url: '/api/v1/authentication/forget-password',
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

  public async getVerification(
    req: Request,
    res: Response,
    token: string,
  ): Promise<void> {
    this.logger.log(`Get Jetei Account verification page`);

    try {
      const { setLocals, generateNonce, getCanonicalUrl } = this.siteHelpers;
      const status = await this.healthCheck();

      await this.authHelpers.verifyToken(token);

      const canonicalURL = getCanonicalUrl(req);

      setLocals(req, res);

      return res.render('views/auth/verification', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Account Verification | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        api_url: `/api/v1/authentication/verify-account/${token}`,
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
        description: `503 Error — Access denied for resource | ${this.siteConfig.name}`,
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
      const decoded = await this.authHelpers.verifyToken(token);

      setLocals(req, res);

      return res.render('views/auth/reset-password', {
        canonicalURL: canonicalURL,
        ogImagePath: `${canonicalURL}/${this.siteConfig.ogImagePath}`,
        title: `Reset Password | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        status: status,
        api_url: `/api/v1/authentication/reset-password/${token}`,
        form_id: 'reset-password-form',
        form_name: 'Reset password',
        redirectUrl: '/account/reset-confirmed',
        logoutUrl: this.logoutUrl,
        email: decoded?.email,
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

  public async getWorkspace(req: RequestUser, res: Response): Promise<void> {
    this.logger.log(`Get Jetei Workspace page`);

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
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        hubs: hubs,
        chats: chats,
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
        ip: req.ip,
        url: req.url,
        nonce: generateNonce(),
        logoutUrl: this.logoutUrl,
        form_id: '/api/v1/hubs',
        form_name: 'Hub get',
        hubs: hubs,
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
        title: `Create a Hub | ${this.siteConfig.name}`,
        ip: req.ip,
        url: req.url,
        form_id: '/api/v1/hubs',
        form_name: 'Hub create',
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
}
