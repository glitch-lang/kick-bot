import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import axios from 'axios';
import { KickChatListener } from './kick-chat-listener';
import { OAuthRouter } from './oauth-router';
import { Database } from './database';

interface WatchParty {
  id: string;
  streamerName: string;
  guildId: string;
  guildName: string;
  createdAt: Date;
  relayToKick: boolean;
  twoWayChat: boolean;
  kickChatListener?: KickChatListener;
  viewers: Map<string, { 
    username: string;
    joinedAt: Date;
    discordId?: string; // Store Discord ID for points tracking
  }>;
  chatMessages: Array<{
    username: string;
    message: string;
    timestamp: Date;
    platform: 'discord' | 'kick';
  }>;
}

interface HeartbeatRecord {
  timestamp: number;
  legitimacyScore: number;
}

export class WatchPartyServer {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private watchParties: Map<string, WatchParty> = new Map();
  private port: number;
  private kickApiUrl: string;
  private oauthRouter?: OAuthRouter;
  private db?: Database;
  private discordAuthManager?: any;
  private heartbeatHistory: Map<string, HeartbeatRecord[]> = new Map(); // discordId -> heartbeats

  constructor(
    port: number = 3001, 
    kickApiUrl: string = 'https://web-production-56232.up.railway.app',
    db?: Database,
    oauthConfig?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
      sessionSecret: string;
      encryptionKey: string;
    },
    discordAuthManager?: any
  ) {
    this.port = port;
    this.kickApiUrl = kickApiUrl;
    this.db = db;
    this.discordAuthManager = discordAuthManager;
    this.app = express();
    
    // Trust Railway's proxy for accurate IP detection and rate limiting
    if (process.env.RAILWAY_ENVIRONMENT) {
      this.app.set('trust proxy', 1);
      console.log('✅ Express configured to trust Railway proxy');
    }
    
    this.server = http.createServer(this.app);
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    // Setup OAuth if config provided
    if (db && oauthConfig) {
      this.oauthRouter = new OAuthRouter(db, oauthConfig);
      console.log('🔐 OAuth authentication enabled');
    }

    this.setupRoutes();
    this.setupSocketIO();
  }

  private setupRoutes() {
    // Bypass LocalTunnel interstitial page for Discord Activities
    this.app.use((req, res, next) => {
      res.setHeader('Bypass-Tunnel-Reminder', 'true');
      next();
    });
    
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Mount OAuth router if available
    if (this.oauthRouter) {
      this.app.use(this.oauthRouter.getRouter());
    }

    // Verify Discord token endpoint
    this.app.get('/api/verify-discord', (req, res) => {
      const token = req.query.token as string;
      
      console.log('🔍 Discord verification request received');
      console.log('Token present:', !!token);
      console.log('discordAuthManager present:', !!this.discordAuthManager);
      
      if (!token) {
        console.log('❌ No token provided');
        return res.json({ valid: false, error: 'No token provided' });
      }

      if (!this.discordAuthManager) {
        console.log('❌ No discordAuthManager configured');
        return res.json({ valid: false, error: 'Auth manager not configured' });
      }

      try {
        const decoded = this.discordAuthManager.verifyDiscordToken(token);
        if (decoded) {
          console.log('✅ Token verified:', decoded.username, 'ID:', decoded.id);
          res.json({
            valid: true,
            username: decoded.username,
            id: decoded.id
          });
        } else {
          console.log('❌ Token verification failed - invalid or expired');
          res.json({ valid: false, error: 'Invalid or expired token' });
        }
      } catch (error) {
        console.error('❌ Token verification error:', error);
        res.json({ valid: false, error: 'Verification error' });
      }
    });

    // Watch party page (regular)
    this.app.get('/party/:partyId', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/watch-party.html'));
    });

    // Activity page (Discord Activity iframe)
    this.app.get('/activity/:partyId', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/activity.html'));
    });

    // Get party info
    this.app.get('/api/party/:partyId', (req, res) => {
      const party = this.watchParties.get(req.params.partyId);
      if (!party) {
        return res.status(404).json({ error: 'Watch party not found' });
      }

      res.json({
        id: party.id,
        streamerName: party.streamerName,
        guildName: party.guildName,
        createdAt: party.createdAt,
        viewerCount: party.viewers.size,
        viewers: Array.from(party.viewers.values()),
        recentMessages: party.chatMessages.slice(-50),
        relayToKick: party.relayToKick,
        twoWayChat: party.twoWayChat,
        kickChatConnected: party.kickChatListener?.isConnected() || false
      });
    });

    // Post message to party (from Discord bot)
    this.app.post('/api/party/:partyId/message', (req, res) => {
      const party = this.watchParties.get(req.params.partyId);
      if (!party) {
        return res.status(404).json({ error: 'Watch party not found' });
      }

      const { username, message, platform } = req.body;
      const chatMessage = {
        username,
        message,
        timestamp: new Date(),
        platform: platform || 'discord'
      };

      party.chatMessages.push(chatMessage);

      // Broadcast to all viewers
      this.io.to(req.params.partyId).emit('new-message', chatMessage);

      res.json({ success: true });
    });

    // Create a new party (from Discord Activity)
    this.app.post('/api/create-party', (req, res) => {
      const { streamerName, channelId, guildId, guildName } = req.body;
      
      if (!streamerName) {
        return res.status(400).json({ error: 'Streamer name required' });
      }

      // Create the party
      const partyId = this.createWatchParty(
        streamerName,
        guildId || 'activity',
        guildName || 'Discord Activity',
        false, // relayToKick
        true   // twoWayChat
      );

      res.json({ 
        success: true,
        partyId,
        url: `/activity/${partyId}`
      });
    });

    // Heartbeat endpoint for anti-farm points tracking
    this.app.post('/api/heartbeat', async (req, res) => {
      const { partyId, streamerName, discordId, username, legitimacyScore, timestamp } = req.body;

      // Validate required fields
      if (!partyId || !discordId || legitimacyScore === undefined) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Reject low legitimacy scores (< 60)
      if (legitimacyScore < 60) {
        return res.status(400).json({ error: 'Legitimacy score too low', score: legitimacyScore });
      }

      // Check if party exists
      const party = this.watchParties.get(partyId);
      if (!party) {
        return res.status(404).json({ error: 'Party not found' });
      }

      // Verify the party is actually for this streamer (prevent gaming the system)
      if (party.streamerName !== streamerName.toLowerCase()) {
        return res.status(400).json({ error: 'Streamer mismatch' });
      }

      // Award points (1 minute of watch time per heartbeat)
      if (this.db) {
        try {
          // Check if user has an active viewing session
          const hasActiveSession = Array.from(party.viewers.values()).some(
            viewer => viewer.discordId === discordId
          );

          if (!hasActiveSession) {
            return res.status(400).json({ error: 'No active viewing session' });
          }

          // Anti-farm fraud detection
          const fraudCheck = this.detectFraud(discordId, legitimacyScore, timestamp);
          if (!fraudCheck.isLegit) {
            console.warn(`🚫 FRAUD DETECTED: ${username} (${discordId}) - ${fraudCheck.reason}`);
            return res.status(429).json({ 
              error: 'Suspicious activity detected', 
              reason: fraudCheck.reason 
            });
          }

          // Log the heartbeat
          console.log(`💗 Heartbeat: ${username} (${discordId}) watching ${streamerName} - Score: ${legitimacyScore}/100`);

          // Get user's total watch time
          const stats = await this.db.getUserWatchTime(discordId);

          res.json({ 
            success: true,
            totalMinutes: stats.totalMinutes,
            legitimacyScore
          });
        } catch (error) {
          console.error('Heartbeat error:', error);
          res.status(500).json({ error: 'Server error' });
        }
      } else {
        res.json({ success: true, message: 'Heartbeat received (DB not configured)' });
      }
    });
  }

  private setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('🔌 User connected to watch party');

      // Join watch party
      socket.on('join-party', async (data: { partyId: string, username: string, discordId?: string }) => {
        const { partyId, username, discordId } = data;
        const party = this.watchParties.get(partyId);

        if (!party) {
          socket.emit('error', { message: 'Watch party not found' });
          return;
        }

        socket.join(partyId);
        const joinedAt = new Date();
        party.viewers.set(socket.id, { username, joinedAt, discordId });

        // Log Discord user joining for points tracking
        if (discordId) {
          console.log(`👤 ${username} (Discord: ${discordId}) joined watch party: ${party.streamerName} 🎮`);
          
          // Save viewing session to database for future points calculation
          if (this.db) {
            try {
              await this.db.saveViewingSession(partyId, discordId, username, party.streamerName, joinedAt);
            } catch (error) {
              console.error('Failed to save viewing session:', error);
            }
          }
        } else {
          console.log(`👤 ${username} joined watch party: ${party.streamerName}`);
        }

        // Send party info to user
        socket.emit('party-info', {
          streamerName: party.streamerName,
          guildName: party.guildName,
          viewerCount: party.viewers.size,
          recentMessages: party.chatMessages.slice(-50)
        });

        // Broadcast viewer joined
        this.io.to(partyId).emit('viewer-joined', {
          username,
          viewerCount: party.viewers.size
        });
      });

      // Send message
      socket.on('send-message', async (data: { partyId: string, username: string, message: string }) => {
        const { partyId, username, message } = data;
        const party = this.watchParties.get(partyId);

        if (!party) return;

        // Check for commands
        if (message.startsWith('!')) {
          await this.handleChatCommand(partyId, socket.id, username, message, party);
          return;
        }

        const chatMessage = {
          username,
          message,
          timestamp: new Date(),
          platform: 'discord' as const
        };

        party.chatMessages.push(chatMessage);
        this.io.to(partyId).emit('new-message', chatMessage);

        // Relay to Kick if enabled
        if (party.relayToKick) {
          try {
            await this.sendMessageToKick(party.streamerName, username, message);
            console.log(`📤 Relayed message to Kick: [${username}] ${message}`);
          } catch (error) {
            console.error('Failed to relay message to Kick:', error);
          }
        }
      });

      // User disconnect
      socket.on('disconnect', async () => {
        for (const [partyId, party] of this.watchParties.entries()) {
          if (party.viewers.has(socket.id)) {
            const viewer = party.viewers.get(socket.id);
            
            // Update viewing session end time for points tracking
            if (viewer?.discordId && this.db) {
              const leftAt = new Date();
              const watchTimeMinutes = Math.floor((leftAt.getTime() - viewer.joinedAt.getTime()) / 60000);
              
              try {
                await this.db.endViewingSession(partyId, viewer.discordId, leftAt);
                console.log(`👋 ${viewer.username} (Discord: ${viewer.discordId}) left watch party after ${watchTimeMinutes} minutes 🎮`);
              } catch (error) {
                console.error('Failed to end viewing session:', error);
              }
            } else if (viewer) {
              console.log(`👋 ${viewer.username} left watch party`);
            }
            
            party.viewers.delete(socket.id);

            this.io.to(partyId).emit('viewer-left', {
              username: viewer?.username,
              viewerCount: party.viewers.size
            });
          }
        }
      });
    });
  }

  createWatchParty(streamerName: string, guildId: string, guildName: string, relayToKick: boolean = false, twoWayChat: boolean = true): string {
    const partyId = this.generatePartyId();
    
    const party: WatchParty = {
      id: partyId,
      streamerName: streamerName.toLowerCase(),
      guildId,
      guildName,
      createdAt: new Date(),
      relayToKick,
      twoWayChat,
      viewers: new Map(),
      chatMessages: []
    };

    this.watchParties.set(partyId, party);
    console.log(`🎉 Created watch party: ${partyId} for ${streamerName} (Kick relay: ${relayToKick}, Two-way: ${twoWayChat})`);

    // Connect to Kick chat if two-way chat is enabled
    if (twoWayChat) {
      this.connectToKickChat(partyId, streamerName);
    }

    return partyId;
  }

  private async connectToKickChat(partyId: string, streamerName: string) {
    try {
      const party = this.watchParties.get(partyId);
      if (!party) return;

      const listener = new KickChatListener(streamerName);
      
      const connected = await listener.connect((username: string, message: string) => {
        // Forward Kick message to watch party
        const chatMessage = {
          username,
          message,
          timestamp: new Date(),
          platform: 'kick' as const
        };

        party.chatMessages.push(chatMessage);
        this.io.to(partyId).emit('new-message', chatMessage);
      });

      if (connected) {
        party.kickChatListener = listener;
        console.log(`✅ Two-way chat connected for ${streamerName} (party: ${partyId})`);
      } else {
        console.log(`⚠️ Could not connect two-way chat for ${streamerName}`);
      }

    } catch (error) {
      console.error(`Error connecting to Kick chat:`, error);
    }
  }

  setRelayToKick(partyId: string, enabled: boolean): boolean {
    const party = this.watchParties.get(partyId);
    if (!party) return false;
    
    party.relayToKick = enabled;
    console.log(`${enabled ? '✅' : '❌'} Kick relay ${enabled ? 'enabled' : 'disabled'} for party ${partyId}`);
    return true;
  }

  private async sendMessageToKick(streamerName: string, username: string, message: string): Promise<void> {
    try {
      await axios.post(`${this.kickApiUrl}/api/chat/send`, {
        channel: streamerName,
        message: `[Watch Party] ${username}: ${message}`
      });
    } catch (error: any) {
      console.error(`Error sending message to Kick: ${error.message}`);
      throw error;
    }
  }

  deleteWatchParty(partyId: string): boolean {
    const party = this.watchParties.get(partyId);
    if (!party) return false;

    // Disconnect from Kick chat if connected
    if (party.kickChatListener) {
      party.kickChatListener.disconnect();
      console.log(`🔌 Disconnected Kick chat for party ${partyId}`);
    }

    // Notify all viewers
    this.io.to(partyId).emit('party-ended');

    // Remove all sockets from room
    this.io.in(partyId).socketsLeave(partyId);

    this.watchParties.delete(partyId);
    console.log(`🛑 Deleted watch party: ${partyId}`);

    return true;
  }

  getWatchParty(partyId: string): WatchParty | undefined {
    return this.watchParties.get(partyId);
  }

  addChatMessage(partyId: string, username: string, message: string, platform: 'discord' | 'kick') {
    const party = this.watchParties.get(partyId);
    if (!party) return;

    const chatMessage = {
      username,
      message,
      timestamp: new Date(),
      platform
    };

    party.chatMessages.push(chatMessage);
    this.io.to(partyId).emit('new-message', chatMessage);
  }

  private async handleChatCommand(partyId: string, socketId: string, username: string, message: string, party: WatchParty) {
    const command = message.toLowerCase().split(' ')[0];
    
    // System message helper
    const sendSystemMessage = (text: string) => {
      const systemMessage = {
        username: 'System',
        message: text,
        timestamp: new Date(),
        platform: 'discord' as const
      };
      this.io.to(socketId).emit('new-message', systemMessage);
    };

    // Get viewer's Discord ID
    const viewer = party.viewers.get(socketId);
    const discordId = viewer?.discordId;

    switch (command) {
      case '!points':
      case '!stats':
        if (!discordId) {
          sendSystemMessage('⚠️ You need to join via Discord link to track points!');
          return;
        }
        
        if (this.db) {
          try {
            const stats = await this.db.getUserWatchTime(discordId);
            const currentMinutes = Math.floor((new Date().getTime() - viewer.joinedAt.getTime()) / 60000);
            sendSystemMessage(
              `📊 **${username}** | Session: ${currentMinutes}m | Total: ${stats.totalMinutes}m | Points: ${stats.totalMinutes} 💎`
            );
          } catch (error) {
            console.error('Failed to get stats:', error);
            sendSystemMessage('❌ Failed to load stats');
          }
        } else {
          sendSystemMessage('❌ Stats tracking not available');
        }
        break;

      case '!help':
        sendSystemMessage(
          '📋 **Commands:** !points (stats) | !party (info) | !help'
        );
        break;

      case '!party':
        const uptimeMinutes = Math.floor((new Date().getTime() - party.createdAt.getTime()) / 60000);
        sendSystemMessage(
          `🎉 **${party.streamerName}** | ${party.viewers.size} viewers | ${uptimeMinutes}m uptime`
        );
        break;

      default:
        // Unknown command - show hint
        sendSystemMessage(
          `❓ Unknown command. Type !help for available commands`
        );
        break;
    }
  }

  private detectFraud(discordId: string, legitimacyScore: number, timestamp: number): { isLegit: boolean; reason?: string } {
    // Get or create heartbeat history for this user
    if (!this.heartbeatHistory.has(discordId)) {
      this.heartbeatHistory.set(discordId, []);
    }

    const history = this.heartbeatHistory.get(discordId)!;
    const now = Date.now();

    // Add current heartbeat to history
    history.push({ timestamp, legitimacyScore });

    // Keep only last 10 heartbeats (last ~10 minutes)
    if (history.length > 10) {
      history.shift();
    }

    // Fraud Detection Rules:

    // 1. Check for rapid-fire heartbeats (< 25 seconds apart)
    if (history.length >= 2) {
      const lastHeartbeat = history[history.length - 2];
      const timeDiff = timestamp - lastHeartbeat.timestamp;
      if (timeDiff < 25000) {
        return { isLegit: false, reason: 'Heartbeats too frequent' };
      }
    }

    // 2. Check for suspiciously perfect scores (all 100s = likely bot)
    if (history.length >= 5) {
      const recentScores = history.slice(-5).map(h => h.legitimacyScore);
      const allPerfect = recentScores.every(score => score === 100);
      if (allPerfect) {
        return { isLegit: false, reason: 'Suspiciously perfect pattern' };
      }
    }

    // 3. Check average legitimacy score
    const avgScore = history.reduce((sum, h) => sum + h.legitimacyScore, 0) / history.length;
    if (avgScore < 65) {
      return { isLegit: false, reason: 'Low average legitimacy' };
    }

    // 4. Check for heartbeat bursts (too many in short time)
    const last5Minutes = history.filter(h => now - h.timestamp < 300000);
    if (last5Minutes.length > 6) { // Max 5 legit heartbeats in 5 minutes
      return { isLegit: false, reason: 'Too many heartbeats in short period' };
    }

    // Passed all fraud checks
    return { isLegit: true };
  }

  private generatePartyId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`🎬 Watch Party server running on http://localhost:${this.port}`);
        resolve();
      });
    });
  }

  getPort(): number {
    return this.port;
  }
}
