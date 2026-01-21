import sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    // Use environment variable for DB path, or Railway's temp directory, or local data folder
    let dbDir: string;
    
    if (process.env.DB_PATH) {
      // Custom DB path from environment
      dbDir = path.dirname(process.env.DB_PATH);
    } else if (process.env.RAILWAY_ENVIRONMENT) {
      // On Railway, use /tmp (ephemeral but writable)
      dbDir = '/tmp/data';
      console.log('🚂 Running on Railway - using ephemeral storage (/tmp)');
      console.log('⚠️  Note: Database will reset on each deployment. For persistence, add a Railway volume.');
    } else {
      // Local development
      dbDir = './data';
    }
    
    const dbPath = process.env.DB_PATH || path.join(dbDir, 'discord-bot.db');
    
    // Create directory if it doesn't exist (must succeed before DB creation)
    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`✅ Created database directory: ${dbDir}`);
      } catch (error) {
        console.error(`❌ CRITICAL: Failed to create database directory: ${error}`);
        console.error(`❌ Cannot proceed without writable database directory!`);
        throw new Error(`Failed to create database directory: ${dbDir}`);
      }
    } else {
      console.log(`✅ Database directory exists: ${dbDir}`);
    }
    
    // Verify directory is writable
    try {
      fs.accessSync(dbDir, fs.constants.W_OK);
      console.log(`✅ Database directory is writable`);
    } catch (error) {
      console.error(`❌ CRITICAL: Database directory is not writable: ${dbDir}`);
      throw new Error(`Database directory is not writable: ${dbDir}`);
    }
    
    console.log(`📂 Using database path: ${dbPath}`);
    
    // Open database and wait for it to be ready before initializing
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error(`❌ CRITICAL: Failed to open database at ${dbPath}:`, err);
        process.exit(1); // Exit if database can't be opened
      }
      console.log(`✅ Database opened successfully at ${dbPath}`);
      
      // Initialize tables after database is ready
      this.init().catch((error) => {
        console.error(`❌ CRITICAL: Database initialization failed:`, error);
        process.exit(1);
      });
    });
  }

  private runQuery(sql: string, params: any[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  private getQuery(sql: string, params: any[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }

  private allQuery(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  private async init() {
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS watch_parties (
        discord_channel_id TEXT PRIMARY KEY,
        kick_channel_name TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS discord_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_user_id TEXT NOT NULL,
        discord_channel_id TEXT NOT NULL,
        kick_streamer TEXT NOT NULL,
        message TEXT NOT NULL,
        request_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS stream_notifications (
        discord_channel_id TEXT NOT NULL,
        kick_channel_name TEXT NOT NULL,
        notified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (discord_channel_id, kick_channel_name)
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS discord_webhooks (
        discord_channel_id TEXT PRIMARY KEY,
        webhook_url TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS account_links (
        discord_user_id TEXT PRIMARY KEY,
        kick_username TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE INDEX IF NOT EXISTS idx_kick_username ON account_links(kick_username)
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS chat_relays (
        discord_channel_id TEXT PRIMARY KEY,
        kick_streamer TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS watch_party_settings (
        party_id TEXT PRIMARY KEY,
        relay_to_kick INTEGER DEFAULT 0,
        two_way_chat INTEGER DEFAULT 1,
        streamer_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS auto_watch_parties (
        guild_id TEXT NOT NULL,
        discord_channel_id TEXT NOT NULL,
        streamer_name TEXT NOT NULL,
        auto_relay INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (guild_id, streamer_name)
      )
    `);

    // OAuth tokens table - stores encrypted tokens
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS oauth_tokens (
        user_id TEXT PRIMARY KEY,
        encrypted_data TEXT NOT NULL,
        iv TEXT NOT NULL,
        auth_tag TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // User sessions table - for session management
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        session_id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        kick_username TEXT,
        csrf_token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Kick user profiles cache
    await this.runQuery(`
      CREATE TABLE IF NOT EXISTS kick_profiles (
        kick_user_id INTEGER PRIMARY KEY,
        username TEXT NOT NULL,
        email TEXT,
        avatar TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Run migrations
    await this.runMigrations();
    
    console.log('✅ Discord bot database initialized');
  }

  private async runMigrations() {
    try {
      // Migration 1: Add two_way_chat column to watch_party_settings if it doesn't exist
      console.log('🔍 Checking database schema...');
      const tableInfo: any[] = await this.allQuery('PRAGMA table_info(watch_party_settings)');
      console.log(`📊 watch_party_settings columns: ${tableInfo.map(c => c.name).join(', ')}`);
      
      const hasTwoWayChat = tableInfo.some((col: any) => col.name === 'two_way_chat');
      
      if (!hasTwoWayChat) {
        console.log('🔄 Running migration: Adding two_way_chat column...');
        await this.runQuery('ALTER TABLE watch_party_settings ADD COLUMN two_way_chat INTEGER DEFAULT 1');
        console.log('✅ Migration complete: two_way_chat column added');
        
        // Verify it was added
        const newTableInfo: any[] = await this.allQuery('PRAGMA table_info(watch_party_settings)');
        console.log(`✅ Updated columns: ${newTableInfo.map(c => c.name).join(', ')}`);
      } else {
        console.log('✅ two_way_chat column already exists');
      }
    } catch (error) {
      console.error('❌ Migration error:', error);
      // Try to provide more details
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Stack:', error.stack);
      }
    }
  }

  async loadWatchParties(): Promise<any[]> {
    return await this.allQuery('SELECT * FROM watch_parties');
  }

  async saveWatchParty(channelId: string, kickChannelName: string, guildId: string) {
    await this.runQuery(
      'INSERT OR REPLACE INTO watch_parties (discord_channel_id, kick_channel_name, guild_id) VALUES (?, ?, ?)',
      [channelId, kickChannelName, guildId]
    );
  }

  async removeWatchParty(channelId: string) {
    await this.runQuery('DELETE FROM watch_parties WHERE discord_channel_id = ?', [channelId]);
  }

  async logDiscordMessage(data: any) {
    await this.runQuery(
      'INSERT INTO discord_messages (discord_user_id, discord_channel_id, kick_streamer, message, request_id) VALUES (?, ?, ?, ?, ?)',
      [data.discord_user_id, data.discord_channel_id, data.kick_streamer, data.message, data.request_id]
    );
  }

  async getOriginalMessage(requestId: number): Promise<any> {
    return await this.getQuery('SELECT * FROM discord_messages WHERE request_id = ?', [requestId]);
  }

  async getLastNotification(channelId: string, kickChannelName: string): Promise<number | null> {
    const result: any = await this.getQuery(
      'SELECT notified_at FROM stream_notifications WHERE discord_channel_id = ? AND kick_channel_name = ?',
      [channelId, kickChannelName]
    );
    
    if (result) {
      return new Date(result.notified_at).getTime();
    }
    return null;
  }

  async saveNotification(channelId: string, kickChannelName: string) {
    await this.runQuery(
      'INSERT OR REPLACE INTO stream_notifications (discord_channel_id, kick_channel_name, notified_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [channelId, kickChannelName]
    );
  }

  async saveWebhook(channelId: string, webhookUrl: string, guildId: string) {
    await this.runQuery(
      'INSERT OR REPLACE INTO discord_webhooks (discord_channel_id, webhook_url, guild_id, updated_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
      [channelId, webhookUrl, guildId]
    );
  }

  async getWebhook(channelId: string): Promise<string | null> {
    const result: any = await this.getQuery(
      'SELECT webhook_url FROM discord_webhooks WHERE discord_channel_id = ?',
      [channelId]
    );
    return result ? result.webhook_url : null;
  }

  async removeWebhook(channelId: string) {
    await this.runQuery('DELETE FROM discord_webhooks WHERE discord_channel_id = ?', [channelId]);
  }

  async getAllWebhooks(): Promise<Array<{discord_channel_id: string, webhook_url: string, guild_id: string}>> {
    return await this.allQuery('SELECT * FROM discord_webhooks');
  }

  // Account Linking
  async linkAccount(discordUserId: string, kickUsername: string) {
    await this.runQuery(
      'INSERT OR REPLACE INTO account_links (discord_user_id, kick_username, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [discordUserId, kickUsername.toLowerCase()]
    );
  }

  async unlinkAccount(discordUserId: string) {
    await this.runQuery('DELETE FROM account_links WHERE discord_user_id = ?', [discordUserId]);
  }

  async getLinkedKickUsername(discordUserId: string): Promise<string | null> {
    const result: any = await this.getQuery(
      'SELECT kick_username FROM account_links WHERE discord_user_id = ?',
      [discordUserId]
    );
    return result ? result.kick_username : null;
  }

  async getLinkedDiscordId(kickUsername: string): Promise<string | null> {
    const result: any = await this.getQuery(
      'SELECT discord_user_id FROM account_links WHERE LOWER(kick_username) = LOWER(?)',
      [kickUsername]
    );
    return result ? result.discord_user_id : null;
  }

  async getAllLinkedAccounts(): Promise<Array<{discord_user_id: string, kick_username: string}>> {
    return await this.allQuery('SELECT discord_user_id, kick_username FROM account_links');
  }

  // Chat Relay
  async saveChatRelay(channelId: string, kickStreamer: string, guildId: string) {
    await this.runQuery(
      'INSERT OR REPLACE INTO chat_relays (discord_channel_id, kick_streamer, guild_id) VALUES (?, ?, ?)',
      [channelId, kickStreamer.toLowerCase(), guildId]
    );
  }

  async removeChatRelay(channelId: string) {
    await this.runQuery('DELETE FROM chat_relays WHERE discord_channel_id = ?', [channelId]);
  }

  async getChatRelay(channelId: string): Promise<{kick_streamer: string} | null> {
    const result: any = await this.getQuery(
      'SELECT kick_streamer FROM chat_relays WHERE discord_channel_id = ? AND active = 1',
      [channelId]
    );
    return result;
  }

  async getAllActiveChatRelays(): Promise<Array<{discord_channel_id: string, kick_streamer: string, guild_id: string}>> {
    return await this.allQuery('SELECT * FROM chat_relays WHERE active = 1');
  }

  // Watch Party Settings
  async saveWatchPartySettings(partyId: string, settings: {relay_to_kick?: boolean, two_way_chat?: boolean, streamer_name?: string}) {
    await this.runQuery(
      'INSERT OR REPLACE INTO watch_party_settings (party_id, relay_to_kick, two_way_chat, streamer_name) VALUES (?, ?, ?, ?)',
      [partyId, settings.relay_to_kick ? 1 : 0, settings.two_way_chat !== false ? 1 : 0, settings.streamer_name || null]
    );
  }

  async getWatchPartySettings(partyId: string): Promise<{relay_to_kick: boolean, two_way_chat: boolean, streamer_name: string | null} | null> {
    const result: any = await this.getQuery(
      'SELECT relay_to_kick, two_way_chat, streamer_name FROM watch_party_settings WHERE party_id = ?',
      [partyId]
    );
    if (!result) return null;
    return {
      relay_to_kick: result.relay_to_kick === 1,
      two_way_chat: result.two_way_chat === 1,
      streamer_name: result.streamer_name
    };
  }

  async deleteWatchPartySettings(partyId: string) {
    await this.runQuery('DELETE FROM watch_party_settings WHERE party_id = ?', [partyId]);
  }

  // Auto Watch Parties
  async addAutoWatchParty(guildId: string, channelId: string, streamerName: string, autoRelay: boolean = false) {
    await this.runQuery(
      'INSERT OR REPLACE INTO auto_watch_parties (guild_id, discord_channel_id, streamer_name, auto_relay) VALUES (?, ?, ?, ?)',
      [guildId, channelId, streamerName.toLowerCase(), autoRelay ? 1 : 0]
    );
  }

  async removeAutoWatchParty(guildId: string, streamerName: string) {
    await this.runQuery(
      'DELETE FROM auto_watch_parties WHERE guild_id = ? AND LOWER(streamer_name) = LOWER(?)',
      [guildId, streamerName]
    );
  }

  async getAutoWatchParties(guildId?: string): Promise<Array<{guild_id: string, discord_channel_id: string, streamer_name: string, auto_relay: boolean}>> {
    const query = guildId 
      ? 'SELECT * FROM auto_watch_parties WHERE guild_id = ?'
      : 'SELECT * FROM auto_watch_parties';
    const params = guildId ? [guildId] : [];
    const results: any[] = await this.allQuery(query, params);
    return results.map(r => ({
      guild_id: r.guild_id,
      discord_channel_id: r.discord_channel_id,
      streamer_name: r.streamer_name,
      auto_relay: r.auto_relay === 1
    }));
  }

  async getAllAutoWatchPartyStreamers(): Promise<Array<{guild_id: string, discord_channel_id: string, streamer_name: string, auto_relay: boolean}>> {
    const results: any[] = await this.allQuery('SELECT * FROM auto_watch_parties');
    return results.map(r => ({
      guild_id: r.guild_id,
      discord_channel_id: r.discord_channel_id,
      streamer_name: r.streamer_name,
      auto_relay: r.auto_relay === 1
    }));
  }

  // OAuth Tokens Management
  async saveOAuthTokens(userId: string, encryptedData: string, iv: string, authTag: string, expiresAt: number) {
    await this.runQuery(
      `INSERT OR REPLACE INTO oauth_tokens (user_id, encrypted_data, iv, auth_tag, expires_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [userId, encryptedData, iv, authTag, expiresAt]
    );
  }

  async getOAuthTokens(userId: string): Promise<{encrypted_data: string, iv: string, auth_tag: string, expires_at: number} | null> {
    return await this.getQuery(
      'SELECT encrypted_data, iv, auth_tag, expires_at FROM oauth_tokens WHERE user_id = ?',
      [userId]
    );
  }

  async deleteOAuthTokens(userId: string) {
    await this.runQuery('DELETE FROM oauth_tokens WHERE user_id = ?', [userId]);
  }

  // User Sessions Management
  async createSession(sessionId: string, userId: string, csrfToken: string, expiresAt: number, ipAddress?: string, userAgent?: string) {
    await this.runQuery(
      `INSERT INTO user_sessions (session_id, user_id, csrf_token, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [sessionId, userId, csrfToken, expiresAt, ipAddress || null, userAgent || null]
    );
  }

  async getSession(sessionId: string): Promise<any> {
    return await this.getQuery(
      'SELECT * FROM user_sessions WHERE session_id = ? AND expires_at > ?',
      [sessionId, Math.floor(Date.now() / 1000)]
    );
  }

  async updateSessionActivity(sessionId: string) {
    await this.runQuery(
      'UPDATE user_sessions SET last_activity = CURRENT_TIMESTAMP WHERE session_id = ?',
      [sessionId]
    );
  }

  async updateSessionKickUsername(sessionId: string, kickUsername: string) {
    await this.runQuery(
      'UPDATE user_sessions SET kick_username = ? WHERE session_id = ?',
      [kickUsername, sessionId]
    );
  }

  async deleteSession(sessionId: string) {
    await this.runQuery('DELETE FROM user_sessions WHERE session_id = ?', [sessionId]);
  }

  async deleteExpiredSessions() {
    await this.runQuery(
      'DELETE FROM user_sessions WHERE expires_at < ?',
      [Math.floor(Date.now() / 1000)]
    );
  }

  async deleteUserSessions(userId: string) {
    await this.runQuery('DELETE FROM user_sessions WHERE user_id = ?', [userId]);
  }

  // Kick Profile Cache
  async saveKickProfile(kickUserId: number, username: string, email?: string, avatar?: string) {
    await this.runQuery(
      `INSERT OR REPLACE INTO kick_profiles (kick_user_id, username, email, avatar, updated_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [kickUserId, username, email || null, avatar || null]
    );
  }

  async getKickProfile(kickUserId: number): Promise<{username: string, email: string | null, avatar: string | null} | null> {
    return await this.getQuery(
      'SELECT username, email, avatar FROM kick_profiles WHERE kick_user_id = ?',
      [kickUserId]
    );
  }

  async getKickProfileByUsername(username: string): Promise<{kick_user_id: number, email: string | null, avatar: string | null} | null> {
    return await this.getQuery(
      'SELECT kick_user_id, email, avatar FROM kick_profiles WHERE username = ?',
      [username.toLowerCase()]
    );
  }
}
