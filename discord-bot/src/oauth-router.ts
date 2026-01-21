import express, { Router, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { AuthManager } from './auth-manager';
import { Database } from './database';

const ConnectSqlite3 = require('connect-sqlite3');
const SQLiteStore = ConnectSqlite3(session);

/**
 * Secure OAuth Router for Kick Authentication
 * 
 * Features:
 * - OAuth 2.0 authorization code flow
 * - CSRF protection
 * - Rate limiting
 * - Secure session management
 * - Encrypted token storage
 */

export class OAuthRouter {
  private router: Router;
  private authManager: AuthManager;
  private db: Database;
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private sessionSecret: string;

  constructor(
    db: Database,
    config: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      sessionSecret: string;
      encryptionKey: string;
    }
  ) {
    this.db = db;
    this.router = Router();
    this.authManager = new AuthManager(config.encryptionKey);
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.redirectUri = config.redirectUri;
    this.sessionSecret = config.sessionSecret;

    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    // Security headers
    this.router.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.socket.io"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "wss:", "https:"],
          frameSrc: ["https://player.kick.com", "https://kick.com"],
          fontSrc: ["'self'", "data:"],
        },
      },
    }));

    // Rate limiting for auth endpoints
    const authLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // Limit each IP to 10 requests per window
      message: 'Too many authentication attempts, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.router.use('/auth', authLimiter);

    // Session management with SQLite store
    // Use Railway's writable /tmp directory if on Railway, otherwise local ./data
    const sessionDir = process.env.RAILWAY_ENVIRONMENT ? '/tmp/data' : './data';
    
    this.router.use(
      session({
        store: new SQLiteStore({
          db: 'sessions.db',
          dir: sessionDir,
        }),
        secret: this.sessionSecret,
        resave: false,
        saveUninitialized: false,
        name: 'kick.sid', // Custom name to avoid default 'connect.sid'
        cookie: {
          secure: process.env.NODE_ENV === 'production', // HTTPS only in production
          httpOnly: true, // Prevent JavaScript access
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: 'lax', // CSRF protection
        },
      })
    );
  }

  private setupRoutes() {
    // Get auth status
    this.router.get('/auth/status', this.authMiddleware.bind(this), async (req: Request, res: Response) => {
      if (req.user) {
        res.json({
          authenticated: true,
          user: req.user,
          csrfToken: req.csrfToken
        });
      } else {
        res.json({ authenticated: false });
      }
    });

    // Initiate OAuth login
    this.router.get('/auth/login', (req: Request, res: Response) => {
      try {
        // Save the return URL (where user came from) to redirect back after login
        const returnUrl = req.query.returnUrl as string || req.headers.referer || '/party';
        req.session.returnUrl = returnUrl;
        
        // Generate session ID if not exists
        if (!req.session.userId) {
          req.session.userId = this.authManager.generateSessionId();
        }

        // Generate CSRF-protected state parameter
        const state = this.authManager.generateOAuthState(req.session.userId);
        req.session.oauthState = state;

        // Generate PKCE code verifier and challenge
        const codeVerifier = this.authManager.generateCodeVerifier();
        const codeChallenge = this.authManager.generateCodeChallenge(codeVerifier);
        req.session.codeVerifier = codeVerifier; // Store for token exchange

        // Generate CSRF token for future API calls
        const csrfToken = this.authManager.generateCsrfToken();
        req.session.csrfToken = csrfToken;

        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ error: 'Failed to initiate authentication' });
          }

          // Build Kick OAuth 2.1 URL with PKCE
          const authUrl = new URL('https://id.kick.com/oauth/authorize');
          authUrl.searchParams.append('client_id', this.clientId);
          authUrl.searchParams.append('redirect_uri', this.redirectUri);
          authUrl.searchParams.append('response_type', 'code');
          authUrl.searchParams.append('scope', 'user:read'); // Basic user info
          authUrl.searchParams.append('state', state);
          authUrl.searchParams.append('code_challenge', codeChallenge);
          authUrl.searchParams.append('code_challenge_method', 'S256');

          res.redirect(authUrl.toString());
        });
      } catch (error) {
        console.error('❌ OAuth login error:', error);
        res.status(500).json({ error: 'Authentication failed' });
      }
    });

    // OAuth callback
    this.router.get('/auth/callback', async (req: Request, res: Response) => {
      try {
        const { code, state, error } = req.query;

        // Check for OAuth errors
        if (error) {
          console.error('❌ OAuth error:', error);
          return res.redirect('/party?error=auth_failed');
        }

        // Validate required parameters
        if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
          return res.status(400).send('Invalid OAuth callback');
        }

        // Verify state parameter (CSRF protection)
        const savedState = req.session.oauthState;
        if (!savedState || savedState !== state) {
          console.warn('⚠️ OAuth state mismatch - possible CSRF attack');
          return res.status(403).send('Invalid state parameter');
        }

        // Verify state signature and expiration
        const userId = this.authManager.verifyOAuthState(state);
        if (!userId) {
          return res.status(403).send('Expired or invalid state parameter');
        }

        // Get code verifier from session
        const codeVerifier = req.session.codeVerifier;
        if (!codeVerifier) {
          console.error('❌ Code verifier not found in session');
          return res.status(400).send('Invalid session - code verifier missing');
        }

        // Exchange code for tokens using PKCE
        const tokens = await this.authManager.exchangeCodeForToken(
          code,
          codeVerifier,
          this.clientId,
          this.clientSecret,
          this.redirectUri
        );

        if (!tokens) {
          return res.redirect('/party?error=token_exchange_failed');
        }

        // Clean up code verifier from session
        delete req.session.codeVerifier;

        // Fetch user profile
        const profile = await this.authManager.fetchUserProfile(tokens.access_token);
        if (!profile) {
          return res.redirect('/party?error=profile_fetch_failed');
        }

        // Encrypt and store tokens
        const encryptedTokens = this.authManager.encryptTokens(tokens, userId);
        await this.db.saveOAuthTokens(
          userId,
          encryptedTokens.encryptedData,
          encryptedTokens.iv,
          encryptedTokens.authTag,
          tokens.expires_at
        );

        // Cache user profile
        await this.db.saveKickProfile(
          profile.id,
          profile.username,
          profile.email,
          profile.avatar
        );

        // Create secure session
        const sessionId = this.authManager.generateSessionId();
        const csrfToken = req.session.csrfToken || this.authManager.generateCsrfToken();
        const expiresAt = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

        await this.db.createSession(
          sessionId,
          userId,
          csrfToken,
          expiresAt,
          req.ip,
          req.get('user-agent')
        );

        await this.db.updateSessionKickUsername(sessionId, profile.username);

        // Set session data
        req.session.sessionId = sessionId;
        req.session.userId = userId;
        req.session.kickUsername = profile.username;
        req.session.kickId = profile.id;
        req.session.avatar = profile.avatar;
        req.session.csrfToken = csrfToken;

        // Clean up OAuth state
        delete req.session.oauthState;

        req.session.save((err) => {
          if (err) {
            console.error('Session save error:', err);
            return res.redirect('/party?error=session_failed');
          }

          console.log(`✅ User authenticated: ${profile.username} (ID: ${profile.id})`);
          
          // Redirect back to watch party
          const returnUrl = req.session.returnUrl || '/party';
          delete req.session.returnUrl;
          res.redirect(returnUrl + '?auth=success');
        });

      } catch (error) {
        console.error('❌ OAuth callback error:', error);
        res.redirect('/party?error=auth_failed');
      }
    });

    // Logout
    this.router.post('/auth/logout', this.authMiddleware.bind(this), async (req: Request, res: Response) => {
      try {
        const sessionId = req.session?.sessionId;
        
        if (sessionId) {
          // Delete session from database
          await this.db.deleteSession(sessionId);
        }

        // Destroy session
        req.session.destroy((err) => {
          if (err) {
            console.error('Session destruction error:', err);
            return res.status(500).json({ error: 'Logout failed' });
          }

          res.json({ success: true });
        });
      } catch (error) {
        console.error('❌ Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
      }
    });

    // Refresh token endpoint (authenticated users only)
    this.router.post('/auth/refresh', this.authMiddleware.bind(this), async (req: Request, res: Response) => {
      try {
        if (!req.user) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        const userId = req.user.id;

        // Get encrypted tokens from database
        const tokenData = await this.db.getOAuthTokens(userId);
        if (!tokenData) {
          return res.status(404).json({ error: 'No tokens found' });
        }

        // Decrypt tokens
        const tokens = this.authManager.decryptTokens({
          encryptedData: tokenData.encrypted_data,
          iv: tokenData.iv,
          authTag: tokenData.auth_tag
        }, userId);

        if (!tokens || !tokens.refresh_token) {
          return res.status(400).json({ error: 'Invalid or missing refresh token' });
        }

        // Refresh access token
        const newTokens = await this.authManager.refreshAccessToken(
          tokens.refresh_token,
          this.clientId,
          this.clientSecret
        );

        if (!newTokens) {
          return res.status(500).json({ error: 'Token refresh failed' });
        }

        // Re-encrypt and save new tokens
        const encryptedTokens = this.authManager.encryptTokens(newTokens, userId);
        await this.db.saveOAuthTokens(
          userId,
          encryptedTokens.encryptedData,
          encryptedTokens.iv,
          encryptedTokens.authTag,
          newTokens.expires_at
        );

        res.json({ success: true, expiresAt: newTokens.expires_at });

      } catch (error) {
        console.error('❌ Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
      }
    });
  }

  /**
   * Authentication middleware - verifies session and loads user data
   */
  private async authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const sessionId = req.session?.sessionId;

      if (!sessionId) {
        return next(); // Not authenticated, but continue
      }

      // Get session from database
      const sessionData = await this.db.getSession(sessionId);
      
      if (!sessionData) {
        delete req.session.sessionId;
        return next(); // Session expired
      }

      // Update last activity
      await this.db.updateSessionActivity(sessionId);

      // Load user data
      req.user = {
        id: sessionData.user_id,
        kickId: req.session.kickId || 0,
        kickUsername: sessionData.kick_username,
        avatar: req.session.avatar
      };

      req.csrfToken = sessionData.csrf_token;

      next();
    } catch (error) {
      console.error('❌ Auth middleware error:', error);
      next(); // Continue without auth
    }
  }

  /**
   * CSRF protection middleware - validates CSRF token for state-changing operations
   */
  csrfProtection() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
        return next(); // CSRF protection not needed for safe methods
      }

      const token = req.headers['x-csrf-token'] || req.body.csrfToken;
      const sessionToken = req.session?.csrfToken;

      if (!token || !sessionToken || token !== sessionToken) {
        console.warn('⚠️ CSRF token mismatch');
        return res.status(403).json({ error: 'Invalid CSRF token' });
      }

      next();
    };
  }

  /**
   * Require authentication middleware - blocks unauthenticated users
   */
  requireAuth() {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    };
  }

  getRouter(): Router {
    return this.router;
  }

  getAuthManager(): AuthManager {
    return this.authManager;
  }
}
