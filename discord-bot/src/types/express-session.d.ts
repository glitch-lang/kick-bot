import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
    sessionId?: string;
    oauthState?: string;
    codeVerifier?: string;
    csrfToken?: string;
    kickUsername?: string;
    kickId?: number;
    avatar?: string;
    returnUrl?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        kickId: number;
        kickUsername: string;
        avatar?: string;
      };
      csrfToken?: string;
    }
  }
}
