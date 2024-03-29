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
     * The websockets port
     */
    WS_PORT: number;
    /**
     * The url of the application deployed
     */
    PROD_URL?: string;
    /**
     * The feature flags used seperated by comma;
     */
    FLAGS?: string;
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
    /**
     * The google client id
     */
    GOOGLE_CLIENT_ID: string;
    /**
     * The google Client secret;
     */
    GOOGLE_CLIENT_SECRET: string;
    /**
     * The google callaback url;
     */
    GOOGLE_CALLBACK_URL: string;
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
      /**
       * The Sendwave API Key
       */
      SENDWAVE_API_KEY?: string;
    };
    smtp: {
      /**
       * The SMTP Host
       */
      SMTP_HOST: string;
      /**
       * The SMTP PORT
       */
      SMTP_PORT: number;
      /**
       * The SMTP Password
       */
      SMTP_PASSWORD: string;
      /**
       * The SMTP user email address
       */
      SMTP_EMAIL_ADDRESS: string;
    };
    cloudinary: {
      /**
       * The cloudinary bucket name
       */
      CLOUD_BUCKET_NAME: string;
      /**
       * The cloudinary API key
       */
      CLOUD_API_KEY: string;
      /**
       * The cloudinary secret key
       */
      CLOUD_SECRET_KEY;
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
