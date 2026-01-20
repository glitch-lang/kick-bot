import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import * as db from './database';
import { kickAPI, KickChatMessage } from './kick-api';
import { KickBot } from './bot';

dotenv.config();

const app = express();
// CRITICAL: Railway assigns PORT dynamically - MUST use process.env.PORT
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log(`PORT from environment: ${process.env.PORT || 'not set, using 3000'}`);
console.log(`Using PORT: ${PORT}`);

// Initialize bot instance (will be started after DB init)
// MUST be before health check endpoints that reference it
const bot = new KickBot();

// CRITICAL: Health check routes MUST be registered FIRST - before ANY middleware
// Railway checks this immediately on startup - it must respond instantly
// These endpoints have ZERO dependencies - respond immediately
// IMPORTANT: These MUST be defined before any middleware or catch-all routes
app.get('/health', (req, res, next) => {
  // No async, no database, no bot - just respond immediately
  // Use Express res.send() for proper handling
  res.status(200).setHeader('Content-Type', 'text/plain').send('OK');
  // Explicitly end the response to prevent further middleware
  return;
});

app.get('/api/health', (req, res, next) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    botStarted: bot.isBotStarted(),
  });
  // Explicitly end the response to prevent further middleware
  return;
});

// Now add middleware (after health check routes are registered)
app.use(cors());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Handle uncaught errors to prevent crashes - NEVER EXIT
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  // CRITICAL: Don't exit - keep the server running
  // Railway will restart if needed, but we should stay alive
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // CRITICAL: Don't exit - keep the server running
});

// Handle SIGTERM gracefully (Railway sends this for graceful shutdown)
let isShuttingDown = false;
process.on('SIGTERM', () => {
  console.log('Received SIGTERM - Railway is requesting shutdown');
  if (!isShuttingDown) {
    isShuttingDown = true;
    console.log('Initiating graceful shutdown...');
    // Give Railway time to verify health, then allow shutdown
    setTimeout(() => {
      console.log('Graceful shutdown complete');
      process.exit(0);
    }, 5000); // 5 second grace period
  }
});

process.on('SIGINT', () => {
  console.log('Received SIGINT');
  if (!isShuttingDown) {
    isShuttingDown = true;
    setTimeout(() => {
      process.exit(0);
    }, 2000);
  }
});

// Keep process alive - prevent accidental exits
const keepAlive = setInterval(() => {
  // Just keep the process running
}, 30000); // Every 30 seconds

// CRITICAL: Start HTTP server IMMEDIATELY (synchronously) - before any async operations
// Railway checks health endpoint within seconds of container start
console.log('Starting HTTP server immediately...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Server is ready to accept connections`);
  console.log(`✅ Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`✅ Railway can now reach the server on port ${PORT}`);
});

// Keep server alive - prevent timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

// Initialize database and bot in background (non-blocking)
async function startBackgroundServices() {
  try {
    console.log('Starting background services (database, bot)...');
    
    // Prevent server from closing
    server.on('close', () => {
      console.warn('⚠️ Server closed event - this should not happen');
    });
    
    server.on('error', (error: any) => {
      console.error('Server error:', error);
      // Don't exit - try to keep running
    });
    
    // Initialize database in background (non-blocking)
    db.initDatabase().then(() => {
      console.log('✅ Database initialized successfully');
      
      // Then start bot in background (non-blocking)
      bot.start().then(() => {
        console.log('✅ Bot started successfully');
      }).catch((error: any) => {
        console.error('⚠️ Bot startup error (non-fatal):', error);
        console.error('Bot error details:', error?.message);
        // Don't crash the server if bot fails to start
      });
    }).catch((error: any) => {
      console.error('⚠️ Database initialization error (non-fatal):', error);
      console.error('Database error details:', error?.message);
      // Don't crash the server if database fails
    });
    
    // Return server to keep reference alive
    return server;
    
  } catch (error: any) {
    console.error('❌ Failed to start server:', error);
    console.error('Server error details:', error?.message);
    console.error('Server error stack:', error?.stack);
    // CRITICAL: Don't exit or throw - keep process alive
    // Return null but don't crash
    return null;
  }
}

// Start background services (database, bot) - non-blocking
startBackgroundServices();

// Keep process alive forever
console.log('✅ Process started, keeping alive...');

// Webhook endpoint for receiving Kick events (MUST be BEFORE bodyParser.json middleware applies)
app.post('/webhooks/kick', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get the raw body for signature verification
    const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-kick-signature'] as string;
    const webhookSecret = process.env.WEBHOOK_SECRET || '';

    console.log('\n📨 Webhook received from Kick');
    console.log(`   Signature: ${signature || 'None'}`);
    console.log(`   Body length: ${rawBody.length} bytes`);
    console.log(`   Body type: ${typeof req.body}`);

    // Verify the signature
    if (signature && webhookSecret) {
      const isValid = kickAPI.verifyWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('❌ Invalid webhook signature - rejecting request');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ Webhook signature verified');
    } else if (!signature) {
      console.warn('⚠️ No signature provided - accepting anyway for testing');
    }

    // Parse the event
    const event = JSON.parse(rawBody);
    console.log(`   Event Type: ${event.type || event.event_type}`);
    
    // Handle chat message events
    if (event.type === 'chat.message.sent' || event.event_type === 'chat.message.sent') {
      const messageData = event.data || event.payload;
      
      if (!messageData) {
        console.error('❌ No message data in event');
        return res.status(400).json({ error: 'No message data' });
      }

      console.log(`   From: ${messageData.sender?.username || 'Unknown'}`);
      console.log(`   Message: "${messageData.content || messageData.message}"`);
      console.log(`   Channel: ${messageData.channel?.slug || messageData.chatroom_id}`);

      // Pass the message to the bot for command processing
      try {
        await bot.handleWebhookMessage({
          id: messageData.id || messageData.message_id || Date.now().toString(),
          content: messageData.content || messageData.message || '',
          type: 'message',
          user: {
            id: messageData.sender?.id || 0,
            username: messageData.sender?.username || 'Unknown',
            slug: messageData.sender?.slug || messageData.sender?.username || 'unknown'
          },
          channel: {
            id: messageData.chatroom_id || messageData.channel?.id || 0,
            slug: messageData.channel?.slug || messageData.channel_slug || ''
          },
          created_at: messageData.created_at || new Date().toISOString()
        });
      } catch (error) {
        console.error('Error handling webhook message:', error);
      }
    }

    // Respond with 200 OK
    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OAuth Routes
app.get('/auth/kick', (req, res) => {
  const clientId = process.env.KICK_CLIENT_ID;
  const redirectUri = process.env.KICK_REDIRECT_URI || `http://localhost:${PORT}/auth/kick/callback`;
  
  if (!clientId || clientId === 'your_kick_client_id' || clientId.trim() === '') {
    console.error('Kick client ID not configured properly');
    return res.redirect(`/?error=${encodeURIComponent('Bot is not yet configured. Please contact the administrator.')}`);
  }
  
  console.log('\n🚀 Initiating OAuth flow...');
  console.log('Client ID:', clientId ? 'Set' : 'Missing');
  console.log('Redirect URI:', redirectUri);
  console.log('⚠️ IMPORTANT: Make sure this redirect URI matches EXACTLY in your Kick app settings!');
  console.log('⚠️ Check: https://dev.kick.com - Your app settings must have:');
  console.log('   Redirect URI:', redirectUri);
  console.log('\n📋 OAuth Requirements (from Kick docs):');
  console.log('   - Endpoint: https://id.kick.com/oauth/authorize');
  console.log('   - Must use PKCE (code_challenge + code_challenge_method=S256)');
  console.log('   - Must include: client_id, redirect_uri, response_type=code, scope, state');
  console.log('   - Redirect URI must match EXACTLY (protocol, domain, port, path)');
  
  // Generate state for CSRF protection
  const crypto = require('crypto');
  const state = crypto.randomBytes(32).toString('base64url');
  
  // Generate PKCE code verifier and challenge (REQUIRED by Kick)
  const { codeVerifier, codeChallenge } = kickAPI.generatePKCE();
  
  console.log('\n🚀 Starting OAuth Flow:');
  console.log('State generated:', state.substring(0, 20) + '...');
  console.log('Code verifier generated:', codeVerifier.substring(0, 20) + '...');
  console.log('Code challenge:', codeChallenge.substring(0, 20) + '...');
  
  // Store state and code_verifier in cookies (needed for token exchange)
  // Use SameSite=None and Secure for cross-site requests, or Lax for same-site
  const cookieOptions = {
    httpOnly: true,
    maxAge: 600000, // 10 minutes
    sameSite: 'lax' as const, // Allow cookie to be sent on redirects
    secure: false, // Set to true in production with HTTPS
  };
  
  res.cookie('oauth_state', state, cookieOptions);
  res.cookie('oauth_code_verifier', codeVerifier, cookieOptions);
  
  // Also store in memory as fallback (for debugging)
  if (!(global as any).oauthSessions) {
    (global as any).oauthSessions = new Map();
  }
  (global as any).oauthSessions.set(state, { codeVerifier, timestamp: Date.now() });
  console.log('💾 Stored code_verifier in cookie and memory (fallback)');
  
  const { url: authUrl } = kickAPI.getAuthUrl(clientId, redirectUri, state, codeChallenge);
  console.log('\n📤 Redirecting user to authorization page...');
  console.log('Authorization URL:', authUrl);
  res.redirect(authUrl);
});

app.get('/auth/kick/callback', async (req, res) => {
  const { code, error, error_description, state } = req.query;
  
  // Log all query parameters for debugging
  console.log('\n🔔 OAuth Callback Received');
  console.log('Full URL:', req.protocol + '://' + req.get('host') + req.originalUrl);
  console.log('Query params:', JSON.stringify(req.query, null, 2));
  console.log('Has code:', !!code);
  console.log('Has error:', !!error);
  console.log('Has state:', !!state);
  
  // Verify state parameter (CSRF protection)
  const storedState = req.cookies?.oauth_state;
  console.log('Stored state:', storedState);
  console.log('Received state:', state);
  
  if (state && storedState && state !== storedState) {
    console.error('❌ State mismatch - possible CSRF attack');
    console.error('Expected:', storedState);
    console.error('Received:', state);
    return res.redirect('/?error=invalid_state');
  }
  
  // Clear the state cookie
  res.clearCookie('oauth_state');
  
  // Check for OAuth errors
  if (error) {
    const errorMsg = typeof error === 'string' ? error : String(error);
    const errorDesc = typeof error_description === 'string' ? error_description : (error_description ? String(error_description) : errorMsg);
    console.error('❌ OAuth error received:', errorMsg);
    console.error('Error description:', errorDesc);
    console.error('Full error response:', JSON.stringify(req.query, null, 2));
    return res.redirect(`/?error=${encodeURIComponent(errorDesc)}`);
  }
  
  if (!code) {
    console.error('❌ No authorization code received');
    console.error('All query params:', JSON.stringify(req.query, null, 2));
    console.error('Expected redirect URI:', process.env.KICK_REDIRECT_URI || `http://localhost:${PORT}/auth/kick/callback`);
    console.error('\n💡 Troubleshooting:');
    console.error('1. Check that redirect URI in Kick app matches exactly:', process.env.KICK_REDIRECT_URI || `http://localhost:${PORT}/auth/kick/callback`);
    console.error('2. Make sure you clicked "Authorize" on the Kick authorization page');
    console.error('3. Check browser console for any errors');
    return res.redirect('/?error=no_code');
  }
  
  console.log('Received authorization code');
  
  try {
    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    const redirectUri = process.env.KICK_REDIRECT_URI || `http://localhost:${PORT}/auth/kick/callback`;
    
    if (!clientId || !clientSecret) {
      return res.redirect('/?error=config');
    }
    
    // Get code_verifier from cookie (required for PKCE)
    console.log('\n🔍 Checking for code_verifier...');
    console.log('All cookies:', JSON.stringify(req.cookies, null, 2));
    console.log('Cookie names:', Object.keys(req.cookies || {}));
    
    let codeVerifier = req.cookies?.oauth_code_verifier;
    
    // Fallback: Try to get from memory using state
    if (!codeVerifier && state) {
      console.log('⚠️ Code verifier not in cookie, trying memory fallback...');
      const session = (global as any).oauthSessions?.get(state);
      if (session && Date.now() - session.timestamp < 600000) { // 10 minutes
        codeVerifier = session.codeVerifier;
        console.log('✅ Retrieved code_verifier from memory fallback');
        // Clean up old sessions
        (global as any).oauthSessions.delete(state);
      }
    }
    
    console.log('Code verifier found:', !!codeVerifier);
    console.log('Code verifier value:', codeVerifier ? codeVerifier.substring(0, 20) + '...' : 'MISSING');
    
    if (!codeVerifier) {
      console.error('❌ Code verifier missing from both cookie and memory');
      console.error('This usually means:');
      console.error('  1. Cookie expired (10 minute timeout)');
      console.error('  2. Cookie was cleared by browser');
      console.error('  3. Cookie parser not working');
      console.error('  4. Different browser/session used');
      console.error('  5. State mismatch (different state than when cookie was set)');
      console.error('\n💡 Solution: Try the OAuth flow again immediately');
      return res.redirect('/?error=missing_code_verifier');
    }
    
    // Clear the code verifier cookie
    res.clearCookie('oauth_code_verifier');
    console.log('✅ Code verifier retrieved successfully');
    
    const tokens = await kickAPI.exchangeCodeForToken(
      code as string,
      clientId,
      clientSecret,
      redirectUri,
      codeVerifier
    );
    
    // Get user info
    console.log('Fetching user info with access token...');
    console.log('Token received:', tokens.access_token ? 'Yes' : 'No');
    console.log('Token type:', (tokens as any).token_type || 'unknown');
    console.log('Token expires in:', (tokens as any).expires_in || 'unknown');
    console.log('Token scopes:', (tokens as any).scope || 'unknown');
    
    // Try token introspection first - it might contain user info
    let userInfo: { id: number; username: string; slug: string } | null = null;
    let introspectData: any = null;
    
    try {
      console.log('Trying token introspection...');
      const introspectResponse = await axios.post('https://id.kick.com/oauth/token/introspect', null, {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
        },
      });
      introspectData = introspectResponse.data;
      console.log('Token introspection response:', JSON.stringify(introspectData, null, 2));
      
      // Check if introspection contains user info in the data field
      if (introspectData?.data) {
        const data = introspectData.data;
        console.log('Introspection data structure:', Object.keys(data));
        console.log('Introspection scope:', data.scope);
        console.log('Introspection token_type:', data.token_type);
        
        // Check if user:read scope is present
        const scopes = (data.scope || '').split(' ');
        const hasUserRead = scopes.includes('user:read');
        console.log('Has user:read scope:', hasUserRead);
        
        if (!hasUserRead) {
          console.error('⚠️ WARNING: Token does NOT have user:read scope!');
          console.error('Granted scopes:', scopes);
          console.error('This is why user info retrieval is failing.');
        }
        
        // Some OAuth servers include user info in introspection
        if (data.user_id || data.sub || data.client_id) {
          console.log('Found data in introspection:', {
            user_id: data.user_id,
            sub: data.sub,
            client_id: data.client_id,
            scope: data.scope,
            token_type: data.token_type
          });
        }
        
        // Check if there's user info nested somewhere
        if (data.user) {
          console.log('Found user object in introspection:', data.user);
        }
      }
    } catch (error: any) {
      console.error('Token introspection error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Try to get user info from API
    userInfo = await kickAPI.getUserInfo(tokens.access_token);
    
    // If still no user info, try alternative: use the token to make a test API call
    // and see what endpoints actually work
    if (!userInfo) {
      console.log('Standard endpoints failed, trying alternative approaches...');
      
      // Try using the token with channel endpoints to see if token works at all
      // We could potentially get user info from a different endpoint
      try {
        // Try getting current user's channels or profile
        const testEndpoints = [
          'https://kick.com/api/v1/channels/me',
          'https://api.kick.com/v1/channels/me',
          'https://kick.com/api/v1/profile',
          'https://api.kick.com/v1/profile',
        ];
        
        for (const endpoint of testEndpoints) {
          try {
            console.log(`Testing alternative endpoint: ${endpoint}`);
            const testResponse = await axios.get(endpoint, {
              headers: {
                Authorization: `Bearer ${tokens.access_token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              },
              timeout: 10000,
            });
            console.log(`✅ ${endpoint} responded:`, JSON.stringify(testResponse.data, null, 2));
            
            // Check if this response contains user info
            const data = testResponse.data;
            if (data?.user?.id && data?.user?.username) {
              userInfo = {
                id: data.user.id,
                username: data.user.username,
                slug: data.user.slug || data.user.username.toLowerCase(),
              };
              console.log('✅ Found user info in alternative endpoint!');
              break;
            }
          } catch (e: any) {
            console.log(`❌ ${endpoint} failed:`, e.response?.status);
          }
        }
      } catch (e) {
        console.error('Alternative endpoint test failed:', e);
      }
    }
    
    // Last resort: Create a temporary registration that requires manual completion
    if (!userInfo) {
      console.error('Failed to get user info after trying all methods');
      console.error('Token (first 30 chars):', tokens.access_token?.substring(0, 30) + '...');
      console.error('Full token response:', JSON.stringify(tokens, null, 2));
      console.error('Introspect data:', JSON.stringify(introspectData, null, 2));
      
      // For bot account, use the BOT_USERNAME from environment
      const botUsername = process.env.BOT_USERNAME;
      if (botUsername) {
        console.log(`🤖 Using BOT_USERNAME from environment: ${botUsername}`);
        userInfo = {
          id: Date.now(), // Temporary ID
          username: botUsername,
          slug: botUsername.toLowerCase()
        };
      } else {
        // Store token temporarily and redirect to a manual completion page
        // Store last attempt for debugging
        lastRegistrationAttempt = {
          timestamp: new Date().toISOString(),
          tokenReceived: !!tokens.access_token,
          tokenPreview: tokens.access_token?.substring(0, 30) + '...',
          tokenType: (tokens as any).token_type,
          scopes: (tokens as any).scope,
          introspectData: introspectData,
          error: 'All user info endpoints failed'
        };
        
        // Store token temporarily in a secure way for manual completion
        // Generate a temporary registration token
        const crypto = require('crypto');
        const tempToken = crypto.randomBytes(32).toString('hex');
        
        // Store in memory (in production, use Redis or database)
        if (!(global as any).tempRegistrations) {
          (global as any).tempRegistrations = new Map();
        }
        (global as any).tempRegistrations.set(tempToken, {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: Date.now() + 600000, // 10 minutes
        });
        
        // Update last attempt for debugging
        lastRegistrationAttempt.error = 'All user info endpoints failed - redirecting to manual registration';
        
        // Redirect to manual completion page
        return res.redirect(`/register/manual?token=${tempToken}`);
      }
    }
    
    console.log('✅ User info retrieved successfully:', userInfo);
    
    // Check if streamer already exists (try by username if ID is temporary)
    let streamer = await db.getStreamerByKickId(userInfo.id.toString());
    if (!streamer) {
      // Try by username
      const allStreamers = await db.getAllActiveStreamers();
      streamer = allStreamers.find(s => s.username.toLowerCase() === userInfo.username.toLowerCase()) || null;
    }
    
    if (streamer) {
      // Update tokens
      console.log(`Updating existing streamer: ${streamer.username}`);
      await db.updateStreamerToken(streamer.id, tokens.access_token, tokens.refresh_token);
    } else {
      // Get channel info (optional - may fail for bot accounts)
      let chatroomId: number | undefined;
      try {
        const channelInfo = await kickAPI.getChannelInfo(userInfo.slug);
        if (channelInfo) {
          chatroomId = channelInfo.chatroom_id;
        }
      } catch (error) {
        console.warn('Could not get channel info, proceeding without it');
      }
      
      // Create new streamer
      console.log(`Creating new streamer: ${userInfo.username}`);
      const streamerId = await db.createStreamer({
        username: userInfo.username,
        kick_user_id: userInfo.id.toString(),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        channel_name: userInfo.slug,
        is_active: 1,
      });
      
      streamer = await db.getStreamerById(streamerId);
    }
    
    // If this is a bot account registration, show the token for Railway
    // Check if username matches BOT_USERNAME or if it's the first registration
    const botUsername = process.env.BOT_USERNAME;
    const isBotAccount = botUsername && userInfo.username.toLowerCase() === botUsername.toLowerCase();
    
    if (isBotAccount) {
      // Store token temporarily to display it
      const crypto = require('crypto');
      const tokenDisplayId = crypto.randomBytes(16).toString('hex');
      if (!(global as any).tokenDisplays) {
        (global as any).tokenDisplays = new Map();
      }
      (global as any).tokenDisplays.set(tokenDisplayId, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        username: userInfo.username,
        expires_at: Date.now() + 300000, // 5 minutes
      });
      
      // Redirect to token display page
      return res.redirect(`/bot-token?token_id=${tokenDisplayId}`);
    }
    
    // Subscribe to chat events for this channel
    try {
      // Try to get channel info for chatroom ID
      const channelInfo = await kickAPI.getChannelInfo(userInfo.slug);
      
      if (channelInfo && channelInfo.chatroom_id) {
        const chatroomId = channelInfo.chatroom_id;
        const webhookUrl = `${process.env.WEBHOOK_BASE_URL || 'http://localhost:3000'}/webhooks/kick`;
        const webhookSecret = process.env.WEBHOOK_SECRET || '';
        
        console.log(`\n📡 Attempting to subscribe to chat events for ${userInfo.slug}...`);
        const subscriptionResult = await kickAPI.subscribeToChannelChat(
          chatroomId,
          webhookUrl,
          webhookSecret,
          tokens.access_token
        );
        
        if (subscriptionResult.success) {
          console.log('✅ Successfully subscribed to chat events!');
          // Store subscription ID in database for later management
          if (streamer && subscriptionResult.subscriptionId) {
            // TODO: Add subscription_id column to database and store it
            console.log(`Subscription ID: ${subscriptionResult.subscriptionId}`);
          }
        } else {
          console.error('⚠️ Failed to subscribe to chat events:', subscriptionResult.error);
          console.error('Bot will still work for sending messages, but cannot listen to chat');
        }
      } else {
        console.warn('⚠️ Could not get chatroom ID, skipping webhook subscription');
        console.warn('Bot will still work for sending messages');
        console.warn('To enable listening, the bot needs to be used on a specific channel');
      }
    } catch (error: any) {
      console.error('⚠️ Error subscribing to chat events:', error.message);
      console.error('Bot will still work for sending messages, but cannot listen to chat');
    }
    
    // Redirect to home page with dashboard tab and streamer_id
    // Store streamer_id in session/cookie for persistence
    res.cookie('streamer_id', streamer?.id?.toString(), { httpOnly: false, maxAge: 86400000 }); // 24 hours
    res.redirect(`/?success=1&streamer_id=${streamer?.id}&tab=dashboard`);
  } catch (error: any) {
    console.error('OAuth callback error:', error);
    res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
});

// API Routes
app.get('/api/streamers', async (req, res) => {
  try {
    const streamers = await db.getAllActiveStreamers();
    res.json(streamers.map(s => ({
      id: s.id,
      username: s.username,
      channel_name: s.channel_name,
      created_at: s.created_at,
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get online status of all streamers
app.get('/api/streamers/online', async (req, res) => {
  try {
    const streamers = await db.getAllActiveStreamers();
    const onlineStatus = await Promise.all(
      streamers.map(async (streamer) => {
        try {
          const isLive = await kickAPI.isStreamerLive(streamer.channel_name);
          return {
            id: streamer.id,
            username: streamer.username,
            channel_name: streamer.channel_name,
            is_online: isLive,
          };
        } catch (error: any) {
          console.error(`Error checking status for ${streamer.channel_name}:`, error);
          return {
            id: streamer.id,
            username: streamer.username,
            channel_name: streamer.channel_name,
            is_online: false,
            error: error.message,
          };
        }
      })
    );
    res.json(onlineStatus);
  } catch (error: any) {
    console.error('Error getting online streamers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/streamer/:id', async (req, res) => {
  try {
    const streamer = await db.getStreamerById(parseInt(req.params.id));
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    res.json({
      id: streamer.id,
      username: streamer.username,
      channel_name: streamer.channel_name,
      created_at: streamer.created_at,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/streamer/:id/commands', async (req, res) => {
  try {
    const streamerId = parseInt(req.params.id);
    const commands = await db.getCommandsByStreamer(streamerId);
    
    // Get target streamer info for each command
    const commandsWithTargets = await Promise.all(
      commands.map(async (cmd) => {
        const target = await db.getStreamerById(cmd.target_streamer_id);
        return {
          ...cmd,
          target_streamer: target ? {
            id: target.id,
            username: target.username,
            channel_name: target.channel_name,
          } : null,
        };
      })
    );
    
    res.json(commandsWithTargets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/streamer/:id/cooldown', async (req, res) => {
  try {
    const streamerId = parseInt(req.params.id);
    const { cooldown_seconds } = req.body;
    
    if (cooldown_seconds === undefined || cooldown_seconds < 0) {
      return res.status(400).json({ error: 'Invalid cooldown value' });
    }
    
    await db.updateStreamerCooldown(streamerId, cooldown_seconds);
    res.json({ message: 'Cooldown updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/streamer/:id/requests', async (req, res) => {
  try {
    const streamerId = parseInt(req.params.id);
    const requests = await db.getPendingRequests(streamerId);
    res.json(requests);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/streamer/:id/refunds', async (req, res) => {
  try {
    const streamerId = parseInt(req.params.id);
    const streamer = await db.getStreamerById(streamerId);
    if (!streamer) {
      return res.status(404).json({ error: 'Streamer not found' });
    }
    // Get refunds for this streamer's channel
    const refunds = await db.getRefundsByUser('', streamer.channel_name);
    res.json(refunds);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Debug endpoint - shows last registration attempt info
let lastRegistrationAttempt: any = null;

// Debug endpoint to check OAuth configuration
app.get('/api/debug/oauth', (req, res) => {
  const clientId = process.env.KICK_CLIENT_ID;
  const redirectUri = process.env.KICK_REDIRECT_URI || `http://localhost:3000/auth/kick/callback`;
  
  // Generate PKCE for demo
  const crypto = require('crypto');
  const state = crypto.randomBytes(32).toString('base64url');
  const { codeChallenge } = kickAPI.generatePKCE();
  const { url: oauthUrl } = kickAPI.getAuthUrl(clientId || 'MISSING', redirectUri, state, codeChallenge);
  
  res.json({
    clientId: clientId ? 'Set' : 'Missing',
    redirectUri: redirectUri,
    oauthUrl: oauthUrl,
    instructions: [
      '1. Go to https://dev.kick.com',
      '2. Find your app settings',
      `3. Make sure Redirect URI is EXACTLY: ${redirectUri}`,
      '4. Check that Client ID matches',
      '5. Try the OAuth URL above manually in your browser',
      '6. Note: This URL includes PKCE (code_challenge) which is required by Kick'
    ]
  });
});

// Debug endpoint to see last registration attempt
app.get('/api/debug/last-attempt', (req, res) => {
  if (!lastRegistrationAttempt) {
    return res.json({ message: 'No registration attempts yet. Try registering first.' });
  }
  res.json({
    message: 'Last registration attempt details',
    attempt: lastRegistrationAttempt,
    instructions: [
      'Check the server terminal for full logs',
      'Look for "Trying user info endpoint" messages',
      'Check error status codes (401, 403, 404, etc.)',
      'Verify user:read scope is enabled in Kick app settings'
    ]
  });
});

app.get('/api/online-status', async (req, res) => {
  try {
    const streamers = await db.getAllActiveStreamers();
    const statuses = await Promise.all(
      streamers.map(async (streamer) => {
        const status = await kickAPI.getStreamerStatus(streamer.channel_name);
        return {
          streamer: {
            id: streamer.id,
            username: streamer.username,
            channel_name: streamer.channel_name,
          },
          isLive: status.isLive,
          title: status.title,
          viewerCount: status.viewerCount,
        };
      })
    );
    res.json(statuses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Manual registration endpoint
app.get('/register/manual', (req, res) => {
  const { token } = req.query;
  if (!token || typeof token !== 'string') {
    return res.redirect('/?error=invalid_token');
  }
  
  // Check if temp registration exists
  const tempReg = (global as any).tempRegistrations?.get(token);
  if (!tempReg || Date.now() > tempReg.expires_at) {
    return res.redirect('/?error=token_expired');
  }
  
  // Show manual registration page
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.post('/api/register/manual', async (req, res) => {
  try {
    const { token, username, channel } = req.body;
    
    if (!token || !username || !channel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get temp registration
    const tempReg = (global as any).tempRegistrations?.get(token);
    if (!tempReg || Date.now() > tempReg.expires_at) {
      return res.status(400).json({ error: 'Token expired or invalid' });
    }
    
    // Try to get user ID from channel info
    const channelInfo = await kickAPI.getChannelInfo(channel);
    let userId: string | null = null;
    
    if (channelInfo) {
      userId = channelInfo.user_id?.toString() || null;
    }
    
    // If we can't get user ID, generate a temporary one or use username hash
    if (!userId) {
      const crypto = require('crypto');
      userId = crypto.createHash('md5').update(username).digest('hex').substring(0, 10);
      console.log('Using generated user ID for:', username);
    }
    
    // Ensure userId is not null
    if (!userId) {
      return res.status(400).json({ error: 'Could not determine user ID' });
    }
    
    // Check if streamer already exists
    let streamer = await db.getStreamerByUsername(username);
    if (!streamer) {
      streamer = await db.getStreamerByKickId(userId);
    }
    
    if (streamer) {
      // Update tokens
      await db.updateStreamerToken(streamer.id, tempReg.access_token, tempReg.refresh_token);
    } else {
      // Create new streamer
      const streamerId = await db.createStreamer({
        username: username,
        kick_user_id: userId,
        access_token: tempReg.access_token,
        refresh_token: tempReg.refresh_token,
        channel_name: channel,
        is_active: 1,
      });
      streamer = await db.getStreamerById(streamerId);
    }
    
    // Clean up temp registration
    (global as any).tempRegistrations?.delete(token);
    
    // Redirect to dashboard
    res.cookie('streamer_id', streamer?.id?.toString(), { httpOnly: false, maxAge: 86400000 });
    res.json({ success: true, streamer_id: streamer?.id });
  } catch (error: any) {
    console.error('Manual registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to receive chat messages (for webhook or manual trigger)
app.post('/api/chat/message', async (req, res) => {
  try {
    const { channelSlug, message } = req.body;
    
    if (!channelSlug || !message) {
      return res.status(400).json({ error: 'Missing channelSlug or message' });
    }
    
    // Convert to KickChatMessage format
    const chatMessage: KickChatMessage = {
      id: message.id || Date.now().toString(),
      content: message.content || message.text || '',
      type: message.type || 'message',
      user: {
        id: message.user?.id || 0,
        username: message.user?.username || message.username || 'unknown',
        slug: message.user?.slug || message.user?.username || 'unknown',
      },
      channel: {
        id: message.channel?.id || 0,
        slug: channelSlug,
      },
      created_at: message.created_at || new Date().toISOString(),
    };
    
    // Handle the message
    await bot.handleIncomingMessage(channelSlug, chatMessage);
    
    res.json({ success: true, message: 'Message processed' });
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoints are defined at the top (before static files)

// API endpoint to get bot username for invite page
app.get('/api/bot/info', (req, res) => {
  res.json({
    username: process.env.BOT_USERNAME || 'YourBotUsername',
    inviteUrl: `https://kick.com/${process.env.BOT_USERNAME || 'yourbot'}`,
    webUrl: req.protocol + '://' + req.get('host'),
  });
});

// API endpoint to connect bot to a channel (for !setupchat)
app.post('/api/bot/connect', async (req, res) => {
  try {
    const { channelSlug } = req.body;
    
    if (!channelSlug) {
      return res.status(400).json({ error: 'Missing channelSlug' });
    }
    
    // Check if bot is started
    if (!bot.isBotStarted()) {
      return res.status(503).json({ 
        error: 'Bot is not started yet. Please wait a moment and try again.',
        retryAfter: 5
      });
    }
    
    // Connect bot to channel (will listen for !setupchat)
    await bot.connectToChannelForSetup(channelSlug);
    
    res.json({ 
      success: true, 
      message: `Bot connected to channel: ${channelSlug}. You can now use !setupchat in your chat.`,
      channelSlug,
      instructions: [
        `1. Make sure the bot is a moderator: Type "/mod CrossTalkBot" in your chat`,
        `2. Then type "!setupchat" to register your channel`,
        `3. Check the bot logs to see if it's receiving messages`
      ]
    });
  } catch (error: any) {
    console.error('Error connecting bot to channel:', error);
    res.status(500).json({ error: error.message || 'Failed to connect bot to channel' });
  }
});

// API endpoint to check bot connection status
// Test endpoint to send a message using OAuth token (GET version for dashboard)
app.get('/api/bot/test-send', async (req, res) => {
  try {
    const { channel, message } = req.query;
    
    if (!channel || !message) {
      return res.status(400).json({ 
        error: 'Missing channel or message',
        usage: 'GET /api/bot/test-send?channel=realglitchdyeet&message=test'
      });
    }
    
    // Get OAuth token from database
    const streamers = await db.getAllActiveStreamers();
    const streamer = streamers.find(s => 
      s.channel_name.toLowerCase() === (channel as string).toLowerCase() ||
      s.username.toLowerCase() === (channel as string).toLowerCase()
    );
    
    if (!streamer || !streamer.access_token || streamer.access_token.startsWith('bot_token_')) {
      // Try to get any OAuth token
      const streamerWithToken = streamers.find(s => 
        s.access_token && !s.access_token.startsWith('bot_token_') && s.access_token.length > 20
      );
      
      if (!streamerWithToken) {
        return res.status(400).json({ 
          error: 'No OAuth token found',
          message: 'Complete OAuth registration first at /auth/kick',
          streamers: streamers.map(s => ({ username: s.username, channel: s.channel_name, hasToken: !!s.access_token }))
        });
      }
      
      console.log(`Using OAuth token from streamer: ${streamerWithToken.username}`);
      const success = await kickAPI.sendChatMessage(channel as string, message as string, streamerWithToken.access_token, 'bot');
      
      if (success) {
        return res.json({ 
          success: true, 
          message: 'Message sent successfully',
          channel: channel,
          content: message
        });
      } else {
        return res.status(500).json({ error: 'Failed to send message' });
      }
    }
    
    const success = await kickAPI.sendChatMessage(channel as string, message as string, streamer.access_token, 'bot');
    
    if (success) {
      return res.json({ 
        success: true, 
        message: 'Message sent successfully',
        channel: channel,
        content: message
      });
    } else {
      return res.status(500).json({ error: 'Failed to send message' });
    }
  } catch (error) {
    console.error('Test send error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Test endpoint to send a message using OAuth token (POST version)
app.post('/api/bot/test-send', async (req, res) => {
  try {
    const { channelSlug, message } = req.body;
    
    if (!channelSlug || !message) {
      return res.status(400).json({ 
        error: 'Missing channelSlug or message',
        usage: 'POST /api/bot/test-send with {"channelSlug": "realglitchdyeet", "message": "test"}'
      });
    }
    
    // Get OAuth token from database
    const streamers = await db.getAllActiveStreamers();
    const streamer = streamers.find(s => 
      s.channel_name.toLowerCase() === channelSlug.toLowerCase() ||
      s.username.toLowerCase() === channelSlug.toLowerCase()
    );
    
    if (!streamer || !streamer.access_token || streamer.access_token.startsWith('bot_token_')) {
      // Try to get any OAuth token
      const streamerWithToken = streamers.find(s => 
        s.access_token && !s.access_token.startsWith('bot_token_') && s.access_token.length > 20
      );
      
      if (!streamerWithToken) {
        return res.status(400).json({ 
          error: 'No OAuth token found',
          message: 'Complete OAuth registration first at /auth/kick',
          streamers: streamers.map(s => ({ username: s.username, channel: s.channel_name, hasToken: !!s.access_token }))
        });
      }
      
      console.log(`Using OAuth token from streamer: ${streamerWithToken.username}`);
      const success = await kickAPI.sendChatMessage(channelSlug, message, streamerWithToken.access_token, 'bot');
      
      if (success) {
        return res.json({ 
          success: true, 
          message: 'Message sent successfully!',
          channel: channelSlug,
          tokenSource: streamerWithToken.username
        });
      } else {
        return res.status(500).json({ 
          error: 'Failed to send message',
          channel: channelSlug
        });
      }
    }
    
    const success = await kickAPI.sendChatMessage(channelSlug, message, streamer.access_token, 'bot');
    
    if (success) {
      res.json({ success: true, message: 'Message sent successfully!', channel: channelSlug });
    } else {
      res.status(500).json({ error: 'Failed to send message', channel: channelSlug });
    }
  } catch (error: any) {
    console.error('Test send error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bot/status/:channelSlug', async (req, res) => {
  try {
    const { channelSlug } = req.params;
    const isConnected = bot.isChannelConnected(channelSlug);
    
    res.json({
      channelSlug,
      connected: isConnected,
      botUsername: process.env.BOT_USERNAME || 'CrossTalkBot',
      instructions: isConnected 
        ? 'Bot is connected. Make sure to run "/mod CrossTalkBot" in your chat, then try !setupchat'
        : `Bot is not connected. Use POST /api/bot/connect with {"channelSlug": "${channelSlug}"} to connect`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API endpoint to get App Access Token (Client Credentials flow) for bot
app.get('/api/bot/token', async (req, res) => {
  try {
    const clientId = process.env.KICK_CLIENT_ID;
    const clientSecret = process.env.KICK_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
      return res.status(400).json({ 
        error: 'KICK_CLIENT_ID and KICK_CLIENT_SECRET must be set in environment variables' 
      });
    }
    
    // Get App Access Token using Client Credentials flow
    const tokenData = await kickAPI.getAppAccessToken(clientId, clientSecret);
    
    res.json({
      success: true,
      access_token: tokenData.access_token,
      token_type: tokenData.token_type,
      expires_in: tokenData.expires_in,
      message: 'Copy this access_token to BOT_ACCESS_TOKEN in Railway Variables'
    });
  } catch (error: any) {
    console.error('Error getting App Access Token:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to get App Access Token',
      details: error.response?.data 
    });
  }
});

// Bot token display page (after OAuth for bot account)
app.get('/bot-token', (req, res) => {
  const tokenId = req.query.token_id as string;
  if (!tokenId) {
    return res.status(400).send(`
      <html>
        <head><title>Bot Token</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>❌ Invalid Request</h1>
          <p>No token ID provided.</p>
          <a href="/">Go Home</a>
        </body>
      </html>
    `);
  }
  
  const tokenData = (global as any).tokenDisplays?.get(tokenId);
  if (!tokenData || Date.now() > tokenData.expires_at) {
    return res.status(404).send(`
      <html>
        <head><title>Bot Token</title></head>
        <body style="font-family: Arial; padding: 20px;">
          <h1>❌ Token Not Found or Expired</h1>
          <p>This token display link has expired. Please authorize again.</p>
          <a href="/auth/kick">Authorize Again</a> | <a href="/">Go Home</a>
        </body>
      </html>
    `);
  }
  
  // Delete token after displaying (one-time use)
  (global as any).tokenDisplays.delete(tokenId);
  
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Bot Token - Copy This!</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .token-box { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; word-break: break-all; }
          .token-box code { font-size: 14px; }
          .copy-btn { background: #4CAF50; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
          .copy-btn:hover { background: #45a049; }
          .success { color: #4CAF50; font-weight: bold; }
          .warning { background: #fff3cd; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .steps { background: #e7f3ff; padding: 15px; border-radius: 4px; margin: 20px 0; }
          .steps ol { margin: 10px 0; padding-left: 20px; }
          .steps li { margin: 8px 0; }
        </style>
      </head>
      <body>
        <h1>✅ Bot Token Retrieved!</h1>
        <p class="success">Your bot account "${tokenData.username}" has been authorized.</p>
        
        <div class="warning">
          <strong>⚠️ Important:</strong> Copy this token now! This page will only show it once.
        </div>
        
        <h2>Bot Access Token:</h2>
        <div class="token-box">
          <code id="token">${tokenData.access_token}</code>
        </div>
        <button class="copy-btn" onclick="copyToken()">📋 Copy Token</button>
        <p id="copy-status"></p>
        
        <div class="steps">
          <h3>📋 Next Steps - Add to Railway:</h3>
          <ol>
            <li>Copy the token above</li>
            <li>Go to <strong>Railway Dashboard</strong> → Your Project → <strong>Variables</strong> tab</li>
            <li>Add new variable: <code>BOT_ACCESS_TOKEN</code></li>
            <li>Paste the token as the value</li>
            <li>Also add: <code>BOT_USERNAME</code> = <code>${tokenData.username}</code></li>
            <li>Railway will automatically redeploy</li>
          </ol>
        </div>
        
        <h3>Bot Username:</h3>
        <div class="token-box">
          <code>${tokenData.username}</code>
        </div>
        <button class="copy-btn" onclick="copyUsername()">📋 Copy Username</button>
        
        <p style="margin-top: 30px;">
          <a href="/">← Go Home</a>
        </p>
        
        <script>
          function copyToken() {
            const token = document.getElementById('token').textContent;
            navigator.clipboard.writeText(token).then(() => {
              document.getElementById('copy-status').innerHTML = '<span class="success">✅ Token copied to clipboard!</span>';
            });
          }
          
          function copyUsername() {
            navigator.clipboard.writeText('${tokenData.username}').then(() => {
              alert('✅ Username copied to clipboard!');
            });
          }
        </script>
      </body>
    </html>
  `);
});

// OAuth diagnostic endpoint
app.get('/api/oauth/diagnostic', (req, res) => {
  const clientId = process.env.KICK_CLIENT_ID;
  const redirectUri = process.env.KICK_REDIRECT_URI || `http://localhost:${PORT}/auth/kick/callback`;
  
  const diagnostic = {
    clientId: clientId ? 'Set' : 'Missing',
    clientSecret: process.env.KICK_CLIENT_SECRET ? 'Set' : 'Missing',
    redirectUri: redirectUri,
    expectedInKickApp: redirectUri,
    oauthUrl: `https://id.kick.com/oauth/authorize`,
    requiredParams: [
      'client_id',
      'redirect_uri',
      'response_type=code',
      'scope',
      'state',
      'code_challenge',
      'code_challenge_method=S256',
    ],
    instructions: [
      `1. Go to https://dev.kick.com`,
      `2. Find your app (Client ID: ${clientId || 'NOT SET'})`,
      `3. Check "Redirect URI" field`,
      `4. Must be EXACTLY: ${redirectUri}`,
      `5. No trailing slash, exact case, exact protocol`,
    ],
    testUrl: `/auth/kick`,
  };
  
  res.json(diagnostic);
});

// Setup status endpoint - check what's configured
app.get('/api/setup/status', async (req, res) => {
  try {
    const status = {
      bot: {
        username: process.env.BOT_USERNAME || null,
        token: process.env.BOT_ACCESS_TOKEN ? 'Set' : 'Missing',
        tokenValid: false,
      },
      kick: {
        clientId: process.env.KICK_CLIENT_ID || null,
        clientSecret: process.env.KICK_CLIENT_SECRET ? 'Set' : 'Missing',
        redirectUri: process.env.KICK_REDIRECT_URI || null,
      },
      database: {
        initialized: false,
        streamers: 0,
      },
      botStatus: {
        started: bot.isBotStarted(),
        connectedChannels: [],
      },
    };

    // Check if bot token is valid
    if (process.env.BOT_ACCESS_TOKEN) {
      try {
        const introspectResponse = await axios.post('https://id.kick.com/oauth/token/introspect', null, {
          headers: { Authorization: `Bearer ${process.env.BOT_ACCESS_TOKEN}` },
        });
        status.bot.tokenValid = introspectResponse.data?.data?.active === true;
      } catch (e) {
        status.bot.tokenValid = false;
      }
    }

    // Check database
    try {
      const streamers = await db.getAllActiveStreamers();
      status.database.initialized = true;
      status.database.streamers = streamers.length;
    } catch (e) {
      status.database.initialized = false;
    }

    // Get connected channels (if we can track them)
    // This would require exposing listener info from bot

    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Quick setup guide endpoint
app.get('/api/setup/guide', (req, res) => {
  const guide = {
    steps: [
      {
        step: 1,
        title: 'Configure Bot Token',
        description: 'Get a user OAuth token with chat:write scope',
        completed: !!process.env.BOT_ACCESS_TOKEN,
        action: '/auth/kick',
        actionText: 'Get Bot Token',
      },
      {
        step: 2,
        title: 'Add Bot as Moderator',
        description: `Type "/mod ${process.env.BOT_USERNAME || 'CrossTalkBot'}" in your chat`,
        completed: false, // Can't check this via API
        action: null,
        actionText: 'Go to Your Channel',
      },
      {
        step: 3,
        title: 'Connect Bot to Channel',
        description: 'Connect the bot to your channel so it can listen',
        completed: false,
        action: '/api/bot/connect',
        actionText: 'Connect Bot',
      },
      {
        step: 4,
        title: 'Register Your Channel',
        description: 'Type "!setupchat" in your chat to register',
        completed: false,
        action: null,
        actionText: 'Go to Your Chat',
      },
    ],
    botUsername: process.env.BOT_USERNAME || 'CrossTalkBot',
    botTokenSet: !!process.env.BOT_ACCESS_TOKEN,
  };

  res.json(guide);
});

// Test OAuth flow page
app.get('/test-oauth', (req, res) => {
  res.sendFile(path.join(__dirname, '../test-oauth-flow.html'));
});

// Log viewer page
app.get('/logs', (req, res) => {
  res.sendFile(path.join(__dirname, '../view-logs.html'));
});

// In-memory log storage for debugging (last 100 lines)
if (!(global as any).serverLogs) {
  (global as any).serverLogs = [];
}

// Override console.log to capture logs
const originalLog = console.log;
const originalError = console.error;
console.log = (...args: any[]) => {
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  (global as any).serverLogs.push({ type: 'log', message, timestamp: new Date().toISOString() });
  if ((global as any).serverLogs.length > 100) {
    (global as any).serverLogs.shift();
  }
  originalLog(...args);
};
console.error = (...args: any[]) => {
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  (global as any).serverLogs.push({ type: 'error', message, timestamp: new Date().toISOString() });
  if ((global as any).serverLogs.length > 100) {
    (global as any).serverLogs.shift();
  }
  originalError(...args);
};

// API endpoint to view recent logs
app.get('/api/logs', (req, res) => {
  const logs = (global as any).serverLogs || [];
  const filter = req.query.filter as string;
  let filteredLogs = logs;
  
  if (filter) {
    filteredLogs = logs.filter((log: any) => 
      log.message.toLowerCase().includes(filter.toLowerCase())
    );
  }
  
  res.json({
    total: logs.length,
    filtered: filteredLogs.length,
    logs: filteredLogs.slice(-50), // Last 50 logs
  });
});

// Serve static files (CSS, JS) - AFTER all API routes
// Only serve static files if NOT a health endpoint
const staticMiddleware = express.static(path.join(__dirname, '../public'));
app.use((req, res, next) => {
  // Skip static file serving for health endpoints
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }
  staticMiddleware(req, res, next);
});

// Serve frontend (catch-all must be LAST and must exclude health endpoints)
// IMPORTANT: Express routes are matched in order, so health routes above will match first
// But we still need to exclude them here as a safety measure
app.get('*', (req, res, next) => {
  // Skip health endpoints - they're handled above
  if (req.path === '/health' || req.path === '/api/health') {
    // Don't send response - health route already handled it
    return next('route'); // Skip to next matching route (but there isn't one, so this prevents response)
  }
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Server is started in startServer() function after initialization
