import sqlite3 from 'sqlite3';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('./data/discord-bot.db');
    this.init();
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
    
    console.log('✅ Discord bot database initialized');
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
}
