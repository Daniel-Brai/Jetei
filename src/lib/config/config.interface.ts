/**
 * Describes the application configuration
 */
export interface IAppConfig {
  environment: {
    /**
     * The node environment
     */
    NODE_ENV: string;
    /**
     * The server port
     */
    PORT: number;
    /**
     * The url of the application deployed
     */
    PROD_URL?: string;
  };
  authentication: {
    /**
     * The hashing salt or rounds
     */
    HASHING_SALT_OR_ROUNDS: string | number;
    /**
     * The access token secret key
     */
    ACCESS_JWT_TOKEN_SECRET_KEY: string;
  };
  database: {
    pg: {
      /**
       * The PostgreSQL URL
       */
      PG_URL: string;
    };
    redis: {
      /**
       * The Redis Host
       */
      REDIS_HOST: string;
      /**
       * The Redis Port
       */
      REDIS_PORT: number;
      /**
       * The Redis Password
       */
      REDIS_PASSWORD?: string;
    };
  };
  services: {
    sendwave: {
      SENDWAVE_API_KEY?: string;
    };
    smtp: {
      SMTP_HOST: string;
      SMTP_PORT: number;
      SMTP_PASSWORD: string;
      SMTP_EMAIL_ADDRESS: string;
    };
  };
}

/**
 * Describe the site configuration
 */
export interface ISiteConfig {
  /**
   * The name of the site
   */
  name: string;
  /**
   * The description of the site
   */
  description: string;
  /**
   * The opengraph image path for SEO
   */
  ogImagePath: string;

  /**
   * The canonical url per user request
   */
  canonicalUrl?: string;

  /**
   * The links available to the site
   */
  links: {
    /**
     * The Github link
     */
    github: string;
  };
  /**
   * The site's author
   */
  author: {
    /**
     * The author anme
     */
    name: string;
    /**
     * The author email
     */
    email: string;
  };
  /**
   * The year on the site
   */
  year: number;
}
