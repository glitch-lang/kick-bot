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
  viewers: Map<string, { username: string, joinedAt: Date }>;
  chatMessages: Array<{
    username: string;
    message: string;
    timestamp: Date;
    platform: 'discord' | 'kick';
  }>;
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
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));

    // Mount OAuth router if available
    if (this.oauthRouter) {
      this.app.use(this.oauthRouter.getRouter());
    }

    // Verify Discord token endpoint
    this.app.get('/api/verify-discord', (req, res) => {
      const token = req.query.token as string;
      
      if (!token) {
        return res.json({ valid: false });
      }

      if (!this.discordAuthManager) {
        return res.json({ valid: false });
      }

      const decoded = this.discordAuthManager.verifyDiscordToken(token);
      if (decoded) {
        res.json({
          valid: true,
          username: decoded.username,
          id: decoded.id
        });
      } else {
        res.json({ valid: false });
      }
    });

    // Watch party page
    this.app.get('/party/:partyId', (req, res) => {
      res.sendFile(path.join(__dirname, 'public/watch-party.html'));
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
  }

  private setupSocketIO() {
    this.io.on('connection', (socket) => {
      console.log('🔌 User connected to watch party');

      // Join watch party
      socket.on('join-party', (data: { partyId: string, username: string }) => {
        const { partyId, username } = data;
        const party = this.watchParties.get(partyId);

        if (!party) {
          socket.emit('error', { message: 'Watch party not found' });
          return;
        }

        socket.join(partyId);
        party.viewers.set(socket.id, { username, joinedAt: new Date() });

        console.log(`👤 ${username} joined watch party: ${party.streamerName}`);

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
      socket.on('disconnect', () => {
        for (const [partyId, party] of this.watchParties.entries()) {
          if (party.viewers.has(socket.id)) {
            const viewer = party.viewers.get(socket.id);
            party.viewers.delete(socket.id);

            this.io.to(partyId).emit('viewer-left', {
              username: viewer?.username,
              viewerCount: party.viewers.size
            });

            console.log(`👋 ${viewer?.username} left watch party`);
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
