/**
 * Describes a response for the client to consume
 */
export type APIResponse<T> = {
  type: 'success' | 'error';
  status_code: number;
  api_message?: string;
  api_description?: string;
  details?: {
    timestamp?: string;
    path?: string;
  };
  data?: Array<T> | object;
};

/**
 * Describes the payload passed
 */
export type JwtPayload = {
  id: string;
  email: string;
};

/**
 * Describes JWT options to be used
 */
export type JwtOptions = {
  issuer?: string;
  subject: string;
  expiry_time_in_secs: number;
};
