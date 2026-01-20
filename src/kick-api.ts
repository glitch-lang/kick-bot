import axios, { AxiosInstance } from 'axios';
import WebSocket from 'ws';

export interface KickChatMessage {
  id: string;
  content: string;
  type: 'message' | 'reply';
  user: {
    id: number;
    username: string;
    slug: string;
  };
  channel: {
    id: number;
    slug: string;
  };
  created_at: string;
}

export class KickAPI {
  private apiClient: AxiosInstance;
  private chatWebSocket: WebSocket | null = null;
  private chatListeners: Map<string, (message: KickChatMessage) => void> = new Map();
  private pusherConnections: Map<string, any> = new Map(); // Store Pusher instances per channel

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'https://kick.com/api',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // OAuth methods
  getAuthUrl(clientId: string, redirectUri: string, state: string, codeChallenge: string, scopes: string[] = [
    'chat:write',           // Write to Chat feed - REQUIRED for sending messages
    'user:read',             // Read user information - REQUIRED for OAuth
    'channel:read',          // Read channel information - REQUIRED for channel details
    'events:subscribe',      // Subscribe to events - REQUIRED for listening to chat messages
    'channel_points:read'    // Read Channel points rewards - REQUIRED for checking channel points
  ]): { url: string; codeVerifier: string } {
    const scope = scopes.join(' ');
    
    // Build authorization URL using URL object (cleaner approach)
    const authUrl = new URL('https://id.kick.com/oauth/authorize');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', scope);
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');
    
    console.log('\n🔐 OAuth Authorization URL Generated:');
    console.log('Full URL:', authUrl.toString());
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', scope);
    console.log('State:', state);
    console.log('Code Challenge:', codeChallenge);
    console.log('Code Challenge Method: S256');
    console.log('\n📋 Compare with Kick App Settings:');
    console.log('   - Redirect URI in Kick app MUST be:', redirectUri);
    console.log('   - Must match EXACTLY (no trailing slash, exact protocol)');
    
    return { url: authUrl.toString(), codeVerifier: '' }; // codeVerifier will be set by caller
  }

  // Generate PKCE code verifier and challenge
  generatePKCE(): { codeVerifier: string; codeChallenge: string } {
    const crypto = require('crypto');
    
    // Generate code verifier (43-128 characters, URL-safe)
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    
    // Generate code challenge (SHA256 hash of verifier, base64url encoded)
    const codeChallenge = crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');
    
    return { codeVerifier, codeChallenge };
  }

  private generateState(): string {
    // Generate a random state string for CSRF protection
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('base64url');
  }

  async exchangeCodeForToken(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    codeVerifier: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    try {
      // Kick requires application/x-www-form-urlencoded (not JSON)
      // Build payload object first (cleaner approach)
      const payload: any = {
        grant_type: 'authorization_code',
        client_id: clientId,
        code_verifier: codeVerifier, // Send the original secret (not challenge)
        code: code,
        redirect_uri: redirectUri,
      };

      // Add client secret if provided
      if (clientSecret) {
        payload.client_secret = clientSecret;
      }

      // Convert to URLSearchParams for form-encoded format
      const params = new URLSearchParams(payload);
      
      console.log('\n🔄 Exchanging authorization code for token...');
      console.log('Token endpoint: https://id.kick.com/oauth/token');
      console.log('Has code_verifier:', !!codeVerifier);
      console.log('Has client_secret:', !!clientSecret);
      
      const response = await axios.post('https://id.kick.com/oauth/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('✅ Token exchange successful');
      console.log('Access token received:', response.data.access_token ? 'Yes' : 'No');
      console.log('Refresh token received:', response.data.refresh_token ? 'Yes' : 'No');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ Token exchange error:');
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Error data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Error:', error.message);
      }
      throw error;
    }
  }

  async refreshToken(
    refreshToken: string,
    clientId: string,
    clientSecret: string
  ): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
    try {
      // Kick requires application/x-www-form-urlencoded
      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      const response = await axios.post('https://id.kick.com/oauth/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      return response.data;
    } catch (error: any) {
      console.error('Token refresh error:', error.response?.data || error.message);
      throw error;
    }
  }

  // App Access Token (Client Credentials flow) - for bot/server-to-server operations
  async getAppAccessToken(
    clientId: string,
    clientSecret: string
  ): Promise<{ access_token: string; token_type: string; expires_in: number }> {
    try {
      // Kick requires application/x-www-form-urlencoded
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });
      
      const response = await axios.post('https://id.kick.com/oauth/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('App Access Token obtained successfully');
      return response.data;
    } catch (error: any) {
      console.error('App Access Token error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Chat methods
  async sendChatMessage(
    channelSlug: string,
    message: string,
    accessToken: string,
    type: 'user' | 'bot' = 'bot'
  ): Promise<boolean> {
    try {
      // Get channel info first to get the chatroom ID
      const channelInfo = await this.getChannelInfo(channelSlug);
      if (!channelInfo) {
        console.error('Could not get channel info for:', channelSlug);
        return false;
      }
      
      const chatroomId = channelInfo.chatroom_id;
      if (!chatroomId) {
        console.error('No chatroom ID found for:', channelSlug);
        return false;
      }

      // ✅ OFFICIAL KICK PUBLIC API ENDPOINT (from docs.kick.com)
      const endpoint = `https://api.kick.com/public/v1/chat`;
      
      console.log(`\n📤 Sending message to ${channelSlug}`);
      console.log(`   Endpoint: ${endpoint} (OFFICIAL PUBLIC API)`);
      console.log(`   Message: "${message}"`);
      console.log(`   Type: ${type}`);
      
      const response = await axios.post(
        endpoint,
        {
          content: message,
          type: type, // "bot" or "user"
          // Note: broadcaster_user_id is NOT required for bots and is ignored
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
        }
      );
      
      if (response.status === 200 || response.status === 201) {
        console.log(`✅ Message sent successfully!`);
        return true;
      }
      
      console.error(`❌ Unexpected status code: ${response.status}`);
      return false;
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error(`\n❌ Failed to send message to ${channelSlug}:`);
      console.error(`   Status: ${status}`);
      console.error(`   Error:`, JSON.stringify(errorData, null, 2));
      
      if (status === 401) {
        console.error('   💡 Token may be invalid or missing chat:write scope');
      } else if (status === 403) {
        console.error('   💡 Bot may not have permission or is not modded');
      } else if (status === 404) {
        console.error('   💡 Chatroom not found or endpoint incorrect');
      } else if (status === 422) {
        console.error('   💡 Message content may be invalid');
      }
      
      return false;
    }
  }

  // Connect to chat via Pusher WebSocket (for listening to messages)
  async connectToChat(channelSlug: string, onMessage: (message: KickChatMessage) => void): Promise<void> {
    // Kick uses Pusher for real-time chat
    // First, get the chatroom ID for this channel
    try {
      const channelInfo = await this.getChannelInfo(channelSlug);
      if (!channelInfo) {
        console.error(`Could not get channel info for ${channelSlug}`);
        this.chatListeners.set(channelSlug, onMessage);
        return;
      }

      const chatroomId = (channelInfo as any).chatroom_id;
      
      if (!chatroomId) {
        console.error(`No chatroom ID found for ${channelSlug}, using polling fallback`);
        this.chatListeners.set(channelSlug, onMessage);
        return;
      }

      await this.connectToPusher(channelSlug, chatroomId, onMessage);
    } catch (error: any) {
      console.error(`Error connecting to chat for ${channelSlug}:`, error.message);
      // Fallback: store listener for polling
      this.chatListeners.set(channelSlug, onMessage);
    }
  }

  async disconnectFromChat(channelSlug: string): Promise<void> {
    try {
      // Close WebSocket connection if exists
      const ws = this.pusherConnections.get(channelSlug);
      if (ws) {
        ws.close();
        this.pusherConnections.delete(channelSlug);
      }
      
      // Remove chat listener
      this.chatListeners.delete(channelSlug);
      
      console.log(`✅ Disconnected from chat: ${channelSlug}`);
    } catch (error: any) {
      console.error(`Error disconnecting from ${channelSlug}:`, error.message);
    }
  }

  private async connectToPusher(channelSlug: string, chatroomId: number, onMessage: (message: KickChatMessage) => void): Promise<void> {
    // Kick's Pusher configuration - UPDATED KEY (2026)
    const PUSHER_KEY = '32cbd69e4b950bf97679';
    
    // Current working Pusher endpoint (2026) - same as Botrix/Kicklet use
    const endpoints = [
      { url: `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=7.6.0&flash=false`, name: 'us2 (Current Working)' },
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔌 Attempting Pusher connection for ${channelSlug} with ${endpoint.name}...`);
        console.log(`WebSocket URL: ${endpoint.url}`);
        
        const ws = await this.tryPusherConnection(endpoint.url, channelSlug, chatroomId, onMessage);
        if (ws) {
          console.log(`✅ Successfully connected using ${endpoint.name}`);
          return; // Success!
        }
      } catch (error: any) {
        console.log(`❌ ${endpoint.name} failed:`, error.message);
        continue;
      }
    }
    
    // If all Pusher endpoints fail, log it
    // Note: Kick's Pusher appears to be internal-only and requires authentication
    console.error('❌ All Pusher endpoints failed');
    console.error('⚠️ Kick\'s Pusher chat appears to be internal-only');
    console.error('💡 Bot will still be able to send messages via API');
  }
  
  private async tryPusherConnection(
    wsUrl: string,
    channelSlug: string,
    chatroomId: number,
    onMessage: (message: KickChatMessage) => void
  ): Promise<WebSocket | null> {
    return new Promise((resolve, reject) => {
      let resolved = false;
      try {
        const ws = new WebSocket(wsUrl);
      
      let connectionEstablished = false;
      
      ws.on('open', () => {
        console.log(`\n🔌 Pusher WebSocket connected for ${channelSlug}`);
        console.log(`📡 Chatroom ID: ${chatroomId}`);
        // Don't subscribe yet - wait for pusher:connection_established
      });

      ws.on('message', (data: Buffer) => {
        const eventStr = data.toString();
        try {
          const parsed = JSON.parse(eventStr);
          
          // Handle Pusher events
          if (parsed.event === 'pusher:connection_established') {
            console.log(`✅ Pusher connection established for ${channelSlug}`);
            connectionEstablished = true;
            
            // Subscribe to chatroom - Kick uses chatrooms.{id}.v2 format (v2 is required!)
            const subscribeMessage = {
              event: 'pusher:subscribe',
              data: {
                auth: '',
                channel: `chatrooms.${chatroomId}.v2`
              }
            };
            ws.send(JSON.stringify(subscribeMessage));
            console.log(`📤 Sent subscription request for chatrooms.${chatroomId}`);
            
            // Also try subscribing without waiting - sometimes it works immediately
            console.log(`💡 If subscription fails, Kick may require authenticated subscription`);
            
            if (!resolved) {
              resolved = true;
              resolve(ws);
            }
          } else if (parsed.event === 'pusher_internal:subscription_succeeded') {
            console.log(`✅ Subscribed to chatroom for ${channelSlug} - Bot is now listening for messages!`);
            // Store connection after successful subscription
            this.pusherConnections.set(channelSlug, ws);
            this.chatListeners.set(channelSlug, onMessage);
          } else if (parsed.event === 'pusher:error') {
            // Handle Pusher errors properly
            let errorData: any;
            try {
              errorData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
            } catch (e) {
              errorData = parsed.data;
            }
            
            console.error(`\n❌ Pusher error for ${channelSlug}:`);
            console.error(`   Full error data:`, JSON.stringify(errorData, null, 2));
            console.error(`   Raw parsed data:`, parsed.data);
            console.error(`   Full parsed object:`, JSON.stringify(parsed, null, 2));
            
            if (errorData?.message) {
              console.error(`   Error message: ${errorData.message}`);
            }
            if (errorData?.code) {
              console.error(`   Error code: ${errorData.code}`);
            }
            
            // Check if it's a subscription error
            if (errorData?.message?.toLowerCase().includes('subscription') || 
                errorData?.message?.toLowerCase().includes('nonsubbed') ||
                errorData?.message?.toLowerCase().includes('channel')) {
              console.error(`   ⚠️ Subscription error detected!`);
              console.error(`   💡 This might mean:`);
              console.error(`      - Channel name format is wrong`);
              console.error(`      - Channel requires authentication`);
              console.error(`      - Chatroom ID is incorrect`);
            }
            
            // Common Pusher errors:
            // - 4001: App key not in cluster / Over connection limit
            // - 4004: Over channel limit  
            // - 4005: Over event limit
            // - 4006: Subscription failed (private channel needs auth)
            if (errorData?.code === 4001) {
              console.error(`   ⚠️ App key not in this cluster - will try different endpoint`);
              ws.close();
              if (!resolved) {
                resolved = true;
                resolve(null); // Signal to try next endpoint
              }
              return;
            }
            if (errorData?.code === 4006) {
              console.error(`   ⚠️ Subscription failed - chatroom may require authentication`);
              console.error(`   💡 Kick chatrooms might be private channels requiring auth`);
              // Try next endpoint
              ws.close();
              if (!resolved) {
                resolved = true;
                resolve(null);
              }
              return;
            }
            
            // For any other error, try next endpoint
            console.error(`   ⚠️ Unknown Pusher error - will try next endpoint`);
            ws.close();
            if (!resolved) {
              resolved = true;
              resolve(null);
            }
            return;
          } else if (parsed.event === 'App\\Events\\ChatMessageEvent' || 
                     parsed.event === 'App/Events/ChatMessageEvent' ||
                     parsed.event === 'chat-message' || 
                     parsed.event === 'ChatMessageEvent' ||
                     parsed.event?.includes('ChatMessage') ||
                     parsed.event?.includes('Message')) {
            console.log(`\n📨 ✅ CHAT MESSAGE RECEIVED! Event: ${parsed.event}`);
            console.log(`   Raw data:`, JSON.stringify(parsed.data, null, 2));
            // Chat message received
            let messageData: any;
            try {
              messageData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
            } catch (e) {
              messageData = parsed.data;
            }
            
            const chatMessage: KickChatMessage = {
              id: messageData?.id?.toString() || messageData?.message_id?.toString() || Date.now().toString(),
              content: messageData?.content || messageData?.message || messageData?.text || '',
              type: 'message',
              user: {
                id: messageData?.user?.id || messageData?.sender?.id || messageData?.user_id || 0,
                username: messageData?.user?.username || messageData?.sender?.username || messageData?.username || 'unknown',
                slug: messageData?.user?.slug || messageData?.user?.username || messageData?.username || 'unknown',
              },
              channel: {
                id: messageData?.channel?.id || messageData?.chatroom_id || 0,
                slug: channelSlug,
              },
              created_at: messageData?.created_at || messageData?.timestamp || new Date().toISOString(),
            };
            
            onMessage(chatMessage);
          } else if (parsed.event && parsed.data) {
            // Try to parse as chat message if it has message-like structure
            if (parsed.event !== 'pusher:error' && parsed.event !== 'pusher:connection_established' && parsed.event !== 'pusher_internal:subscription_succeeded') {
              try {
                const messageData = typeof parsed.data === 'string' ? JSON.parse(parsed.data) : parsed.data;
                if (messageData?.content || messageData?.message || messageData?.text) {
                  const chatMessage: KickChatMessage = {
                    id: messageData?.id?.toString() || Date.now().toString(),
                    content: messageData?.content || messageData?.message || messageData?.text || '',
                    type: 'message',
                    user: {
                      id: messageData?.user?.id || messageData?.sender?.id || messageData?.user_id || 0,
                      username: messageData?.user?.username || messageData?.sender?.username || messageData?.username || 'unknown',
                      slug: messageData?.user?.slug || messageData?.user?.username || messageData?.username || 'unknown',
                    },
                    channel: {
                      id: messageData?.channel?.id || messageData?.chatroom_id || 0,
                      slug: channelSlug,
                    },
                    created_at: messageData?.created_at || messageData?.timestamp || new Date().toISOString(),
                  };
                  onMessage(chatMessage);
                }
              } catch (e) {
                // Not a chat message, ignore
                console.log(`   ❌ Not a chat message format`);
              }
            }
          }
        } catch (error: any) {
          console.error(`Error parsing Pusher message for ${channelSlug}:`, error.message);
          if (process.env.DEBUG_CHAT === 'true') {
            console.error(`Raw message data:`, eventStr.substring(0, 500));
          }
        }
      });

      ws.on('error', (error) => {
        console.error(`Pusher WebSocket error for ${channelSlug}:`, error);
        if (!resolved) {
          resolved = true;
          reject(error);
        }
      });

      ws.on('close', (code, reason) => {
        // Only reconnect if connection was successful (not if it failed during connection attempt)
        if (resolved && this.pusherConnections.has(channelSlug)) {
          console.log(`Pusher WebSocket closed for ${channelSlug}, reconnecting...`);
          // Reconnect after 5 seconds
          setTimeout(() => {
            this.connectToPusher(channelSlug, chatroomId, onMessage);
          }, 5000);
        } else if (!resolved) {
          // Connection failed before establishing
          resolved = true;
          resolve(null); // Signal to try next endpoint
        }
      });

      // Timeout after 10 seconds if connection doesn't establish
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log(`⏱️ Connection timeout for ${channelSlug}`);
          ws.close();
          resolve(null); // Try next endpoint
        }
      }, 10000);
      
    } catch (error: any) {
      console.error(`Error creating Pusher connection for ${channelSlug}:`, error.message);
      reject(error);
    }
    });
  }

  // Get user info - First try token introspection to verify token
  async getUserInfo(accessToken: string): Promise<{ id: number; username: string; slug: string } | null> {
    // First, verify the token is valid using introspection endpoint
    try {
      console.log('Verifying token with introspection endpoint...');
      const introspectResponse = await axios.post('https://id.kick.com/oauth/token/introspect', null, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      console.log('Token introspection:', JSON.stringify(introspectResponse.data, null, 2));
    } catch (error: any) {
      console.error('Token introspection error:', error.response?.status, error.response?.data || error.message);
    }
    
    // Try different possible endpoints for user info
    // Kick's API base URL is https://api.kick.com
    // Based on /public/v1/public-key pattern, try /public/v1/ endpoints first
    const endpoints = [
      'https://api.kick.com/public/v1/user',
      'https://api.kick.com/public/v1/users/me',
      'https://api.kick.com/public/v1/me',
      'https://api.kick.com/v1/user',
      'https://api.kick.com/v2/user',
      'https://api.kick.com/v1/users/me',
      'https://api.kick.com/v2/users/me',
      'https://api.kick.com/v1/me',
      'https://api.kick.com/v1/profile',
      'https://api.kick.com/public/v1/profile',
      // Fallback to old endpoints
      'https://kick.com/api/v1/user',
      'https://kick.com/api/v2/user',
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying user info endpoint: ${endpoint}`);
        const response = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000, // 10 second timeout
        });
        
        console.log('User info response status:', response.status);
        console.log('User info response data:', JSON.stringify(response.data, null, 2));
        
        // Handle different response structures
        const data = response.data;
        
        // Direct structure
        if (data.id && data.username) {
          return {
            id: data.id,
            username: data.username,
            slug: data.slug || data.username.toLowerCase(),
          };
        }
        
        // Wrapped in 'data' field
        if (data.data && data.data.id && data.data.username) {
          return {
            id: data.data.id,
            username: data.data.username,
            slug: data.data.slug || data.data.username.toLowerCase(),
          };
        }
        
        // Wrapped in 'user' field
        if (data.user && data.user.id && data.user.username) {
          return {
            id: data.user.id,
            username: data.user.username,
            slug: data.user.slug || data.user.username.toLowerCase(),
          };
        }
        
        // Check if it's an array (some APIs return arrays)
        if (Array.isArray(data) && data[0] && data[0].id && data[0].username) {
          return {
            id: data[0].id,
            username: data[0].username,
            slug: data[0].slug || data[0].username.toLowerCase(),
          };
        }
        
        console.warn('Unexpected response structure:', Object.keys(data));
      } catch (error: any) {
        const status = error.response?.status;
        const errorData = error.response?.data;
        console.error(`User info error for ${endpoint}:`, {
          status,
          statusText: error.response?.statusText,
          data: errorData,
          message: error.message,
        });
        continue; // Try next endpoint
      }
    }
    
    console.error('All user info endpoints failed');
    console.error('Access token (first 20 chars):', accessToken?.substring(0, 20));
    return null;
  }

  // Cache channel info to avoid repeated API calls
  private channelInfoCache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CHANNEL_INFO_CACHE_TTL = 300000; // 5 minutes

  // Get channel info (with caching)
  async getChannelInfo(channelSlug: string, useCache: boolean = true): Promise<{ id: number; slug: string; user_id: number; chatroom_id?: number } | null> {
    // Check cache first
    if (useCache) {
      const cached = this.channelInfoCache.get(channelSlug);
      if (cached && Date.now() - cached.timestamp < this.CHANNEL_INFO_CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      // Only use the endpoint that works!
      const endpoint = `https://kick.com/api/v2/channels/${channelSlug}`;
      
      const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      };
      
      const response = await axios.get(endpoint, {
        headers: headers,
        timeout: 10000,
      });
      
      const data = response.data.data || response.data;
      
      if (data && (data.id || data.slug)) {
        const channelInfo = {
          id: data.id,
          slug: data.slug || channelSlug,
          user_id: data.user_id || data.user?.id || data.user_id,
          chatroom_id: data.chatroom?.id || data.chatroom_id || data.chatroom?.id,
        };
        
        // Cache the result
        this.channelInfoCache.set(channelSlug, {
          data: channelInfo,
          timestamp: Date.now(),
        });
        
        return channelInfo;
      }
      
      return null;
    } catch (error: any) {
      const status = error.response?.status;
      if (status !== 404) { // Only log non-404 errors
        console.error(`Channel info error for ${channelSlug}:`, status, error.response?.data || error.message);
      }
      return null;
    }
  }

  // Check if user has enough channel points (workaround - may need to be implemented differently)
  async checkChannelPoints(
    channelSlug: string,
    userId: string,
    requiredPoints: number
  ): Promise<boolean> {
    // Note: Kick's API may not expose channel points directly
    // This would need to be implemented via:
    // 1. Custom reward redemption webhook (if available)
    // 2. Polling reward queue
    // 3. Manual verification by streamer
    // For now, we'll return true and rely on cooldowns
    console.log(`Checking channel points for ${userId} in ${channelSlug} (required: ${requiredPoints})`);
    return true; // Placeholder
  }

  // Get recent chat messages (polling fallback)
  // NOTE: Kick doesn't have a public chat messages API endpoint
  // This is a placeholder - Pusher WebSocket is the only real way to get chat messages
  async getRecentChatMessages(channelSlug: string, limit: number = 50): Promise<KickChatMessage[]> {
    // Chat message endpoints don't exist - return empty array
    // We rely on Pusher WebSocket for real-time chat
    // This function exists for fallback but won't work
    return [];
  }

  // Check if a streamer is currently live
  async isStreamerLive(channelSlug: string): Promise<boolean> {
    const channelInfo = await this.getChannelInfo(channelSlug);
    if (!channelInfo) {
      return false;
    }
    
    // Try to get livestream info using correct API base URL
    const endpoints = [
      `https://api.kick.com/v1/channels/${channelSlug}`,
      `https://api.kick.com/v2/channels/${channelSlug}`,
      `https://api.kick.com/public/v1/channels/${channelSlug}`,
      `https://kick.com/api/v2/channels/${channelSlug}`, // Fallback
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        });
        const data = response.data;
        const channelData = data.data || data.channel || data;
        const livestream = channelData.livestream;
        
        if (livestream && livestream.is_live) {
          return true;
        }
        return false;
      } catch (error: any) {
        continue;
      }
    }
    
    return false;
  }

  // Get streamer status with more details
  async getStreamerStatus(channelSlug: string): Promise<{ isLive: boolean; title?: string; viewerCount?: number }> {
    const endpoints = [
      `https://api.kick.com/v1/channels/${channelSlug}`,
      `https://api.kick.com/v2/channels/${channelSlug}`,
      `https://api.kick.com/public/v1/channels/${channelSlug}`,
      `https://kick.com/api/v2/channels/${channelSlug}`, // Fallback
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          timeout: 10000,
        });
        const data = response.data;
        const channelData = data.data || data.channel || data;
        const livestream = channelData.livestream;
        
        if (livestream && livestream.is_live) {
          return {
            isLive: true,
            title: livestream.session_title || undefined,
            viewerCount: livestream.viewer_count || undefined,
          };
        }
        
        return { isLive: false };
      } catch (error: any) {
        continue;
      }
    }
    
    return { isLive: false };
  }

  // Event Subscription Methods (for listening to chat)
  /**
   * Subscribe to chat messages for a specific channel
   * @param chatroomId The chatroom ID to listen to
   * @param webhookUrl The public URL where Kick will send events
   * @param webhookSecret A secret for verifying webhook signatures
   * @param accessToken OAuth token with events:subscribe scope
   */
  async subscribeToChannelChat(
    chatroomId: number,
    webhookUrl: string,
    webhookSecret: string,
    accessToken: string
  ): Promise<{ subscriptionId: string; success: boolean; error?: string }> {
    try {
      const endpoint = 'https://api.kick.com/public/v1/events/subscriptions';
      
      const payload = {
        type: 'chat.message.sent',
        version: 'v1',
        condition: {
          chatroom_id: chatroomId.toString()
        },
        transport: {
          method: 'webhook',
          callback_url: webhookUrl,
          secret: webhookSecret
        }
      };

      console.log('\n📡 Subscribing to chat events:');
      console.log(`   Endpoint: ${endpoint}`);
      console.log(`   Chatroom ID: ${chatroomId}`);
      console.log(`   Webhook URL: ${webhookUrl}`);
      console.log(`   Event Type: chat.message.sent`);

      const response = await axios.post(endpoint, payload, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.status === 200 || response.status === 201 || response.status === 202) {
        const subscriptionId = response.data.id || response.data.subscription_id;
        console.log('✅ Successfully subscribed to chat events');
        console.log(`   Subscription ID: ${subscriptionId}`);
        return { subscriptionId, success: true };
      }

      console.log('⚠️ Unexpected response:', response.data);
      return { subscriptionId: '', success: false, error: 'Unexpected response' };
    } catch (error: any) {
      const status = error.response?.status;
      const errorData = error.response?.data;
      
      console.error('\n❌ Failed to subscribe to chat events:');
      console.error(`   Status: ${status}`);
      console.error(`   Error:`, JSON.stringify(errorData, null, 2));
      
      if (status === 401) {
        console.error('   💡 Token may be invalid or missing events:subscribe scope');
      } else if (status === 403) {
        console.error('   💡 Bot may not have permission to subscribe to events');
      } else if (status === 404) {
        console.error('   💡 Event subscription endpoint may not exist yet');
      } else if (status === 409) {
        console.error('   💡 Subscription may already exist for this chatroom');
      }
      
      return { subscriptionId: '', success: false, error: errorData?.message || error.message };
    }
  }

  /**
   * List all active event subscriptions
   */
  async listEventSubscriptions(accessToken: string): Promise<any[]> {
    try {
      const endpoint = 'https://api.kick.com/public/v1/events/subscriptions';
      
      const response = await axios.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.data.data || response.data || [];
    } catch (error: any) {
      console.error('Failed to list event subscriptions:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Delete an event subscription
   */
  async deleteEventSubscription(subscriptionId: string, accessToken: string): Promise<boolean> {
    try {
      const endpoint = `https://api.kick.com/public/v1/events/subscriptions/${subscriptionId}`;
      
      const response = await axios.delete(endpoint, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      return response.status === 200 || response.status === 204;
    } catch (error: any) {
      console.error('Failed to delete event subscription:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Verify webhook signature (for incoming webhook requests)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const crypto = require('crypto');
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = 'sha256=' + hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    try {
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch {
      return false;
    }
  }
}

export const kickAPI = new KickAPI();
