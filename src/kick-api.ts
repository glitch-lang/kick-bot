import axios, { AxiosInstance } from 'axios';

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
    
    // Kick requires PKCE (Proof Key for Code Exchange)
    // code_challenge and code_challenge_method are REQUIRED
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      state: state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });
    
    const authUrl = `https://id.kick.com/oauth/authorize?${params.toString()}`;
    
    console.log('OAuth URL:', authUrl);
    console.log('Client ID:', clientId);
    console.log('Redirect URI:', redirectUri);
    console.log('Scopes:', scope);
    console.log('State:', state);
    console.log('Code Challenge:', codeChallenge);
    
    return { url: authUrl, codeVerifier: '' }; // codeVerifier will be set by caller
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
      // Also requires code_verifier for PKCE
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier,
      });
      
      const response = await axios.post('https://id.kick.com/oauth/token', params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      console.log('Token exchange successful');
      return response.data;
    } catch (error: any) {
      console.error('Token exchange error:', error.response?.data || error.message);
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

  // Chat methods
  async sendChatMessage(
    channelSlug: string,
    message: string,
    accessToken: string,
    type: 'user' | 'bot' = 'bot'
  ): Promise<boolean> {
    try {
      // Get channel info first using correct API base URL
      const channelInfo = await this.getChannelInfo(channelSlug);
      if (!channelInfo) {
        console.error('Could not get channel info for:', channelSlug);
        return false;
      }
      const channelId = channelInfo.id;

      // Send message via Kick's chat API using correct base URL
      const chatEndpoints = [
        `https://api.kick.com/v1/channels/${channelId}/messages`,
        `https://api.kick.com/v2/channels/${channelId}/messages`,
        `https://api.kick.com/public/v1/channels/${channelId}/messages`,
        `https://kick.com/api/v2/channels/${channelId}/messages`, // Fallback
      ];
      
      for (const endpoint of chatEndpoints) {
        try {
          const response = await axios.post(
            endpoint,
            {
              content: message,
              type: type,
            },
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
            }
          );
          if (response.status === 200 || response.status === 201) {
            return true;
          }
        } catch (error: any) {
          console.error(`Chat message error for ${endpoint}:`, error.response?.status);
          continue;
        }
      }

      // All endpoints failed
      return false;
    } catch (error: any) {
      console.error('Send message error:', error.response?.data || error.message);
      // Fallback: Try alternative endpoint structure
      try {
        const response = await axios.post(
          `https://kick.com/api/v1/chat`,
          {
            content: message,
            type: type,
            broadcaster_user_id: channelSlug,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        return response.status === 200 || response.status === 201;
      } catch (fallbackError: any) {
        console.error('Fallback send message error:', fallbackError.response?.data || fallbackError.message);
        return false;
      }
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

  private async connectToPusher(channelSlug: string, chatroomId: number, onMessage: (message: KickChatMessage) => void): Promise<void> {
    // Kick's Pusher configuration
    const PUSHER_KEY = 'eb1d5f283081a78b932c';
    const PUSHER_CLUSTER = 'us2';
    
    // Use native WebSocket for Pusher protocol
    const wsUrl = `wss://ws-${PUSHER_CLUSTER}.pusher.app/app/${PUSHER_KEY}?protocol=7&client=js&version=7.4.0&flash=false`;
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log(`Pusher WebSocket connected for ${channelSlug}`);
        
        // Subscribe to chatroom channel
        const subscribeMessage = {
          event: 'pusher:subscribe',
          data: {
            channel: `chatrooms.${chatroomId}`
          }
        };
        ws.send(JSON.stringify(subscribeMessage));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle Pusher events
          if (data.event === 'pusher:connection_established') {
            console.log(`Pusher connection established for ${channelSlug}`);
          } else if (data.event === 'pusher_internal:subscription_succeeded') {
            console.log(`Subscribed to chatroom for ${channelSlug}`);
          } else if (data.event === 'App\\Events\\ChatMessageEvent') {
            // Chat message received
            const messageData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
            const chatMessage: KickChatMessage = {
              id: messageData.id?.toString() || Date.now().toString(),
              content: messageData.content || messageData.message || '',
              type: 'message',
              user: {
                id: messageData.user?.id || messageData.sender?.id || 0,
                username: messageData.user?.username || messageData.sender?.username || 'unknown',
                slug: messageData.user?.slug || messageData.user?.username || 'unknown',
              },
              channel: {
                id: messageData.channel?.id || 0,
                slug: channelSlug,
              },
              created_at: messageData.created_at || new Date().toISOString(),
            };
            
            onMessage(chatMessage);
          } else if (data.event && data.data) {
            // Try to parse as chat message
            try {
              const messageData = typeof data.data === 'string' ? JSON.parse(data.data) : data.data;
              if (messageData.content || messageData.message) {
                const chatMessage: KickChatMessage = {
                  id: messageData.id?.toString() || Date.now().toString(),
                  content: messageData.content || messageData.message || '',
                  type: 'message',
                  user: {
                    id: messageData.user?.id || messageData.sender?.id || 0,
                    username: messageData.user?.username || messageData.sender?.username || 'unknown',
                    slug: messageData.user?.slug || messageData.user?.username || 'unknown',
                  },
                  channel: {
                    id: messageData.channel?.id || 0,
                    slug: channelSlug,
                  },
                  created_at: messageData.created_at || new Date().toISOString(),
                };
                onMessage(chatMessage);
              }
            } catch (e) {
              // Not a chat message, ignore
            }
          }
        } catch (error: any) {
          console.error(`Error parsing Pusher message for ${channelSlug}:`, error.message);
        }
      };

      ws.onerror = (error) => {
        console.error(`Pusher WebSocket error for ${channelSlug}:`, error);
      };

      ws.onclose = () => {
        console.log(`Pusher WebSocket closed for ${channelSlug}, reconnecting...`);
        // Reconnect after 5 seconds
        setTimeout(() => {
          this.connectToPusher(channelSlug, chatroomId, onMessage);
        }, 5000);
      };

      // Store connection
      this.pusherConnections.set(channelSlug, ws);
      this.chatListeners.set(channelSlug, onMessage);
    } catch (error: any) {
      console.error(`Error creating Pusher connection for ${channelSlug}:`, error.message);
      // Fallback to polling
      this.chatListeners.set(channelSlug, onMessage);
    }
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
          },
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

  // Get channel info
  async getChannelInfo(channelSlug: string): Promise<{ id: number; slug: string; user_id: number; chatroom_id?: number } | null> {
    try {
      // Try multiple endpoints to get channel info with chatroom
      const endpoints = [
        `https://kick.com/api/v2/channels/${channelSlug}`,
        `https://api.kick.com/v1/channels/${channelSlug}`,
        `https://api.kick.com/v2/channels/${channelSlug}`,
      ];
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(endpoint);
          const data = response.data.data || response.data;
          return {
            id: data.id,
            slug: data.slug || channelSlug,
            user_id: data.user_id || data.user?.id,
            chatroom_id: data.chatroom?.id || data.chatroom_id,
          };
        } catch (e) {
          continue;
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Get channel info error:', error.response?.data || error.message);
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
        const response = await axios.get(endpoint);
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
        const response = await axios.get(endpoint);
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
}

export const kickAPI = new KickAPI();
