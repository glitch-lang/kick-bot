import sqlite3 from 'sqlite3';
import { promisify } from 'util';

export class Database {
  private db: sqlite3.Database;

  constructor() {
    this.db = new sqlite3.Database('./data/discord-bot.db');
    this.init();
  }

  private async init() {
    const run = promisify(this.db.run.bind(this.db));
    
    await run(`
      CREATE TABLE IF NOT EXISTS watch_parties (
        discord_channel_id TEXT PRIMARY KEY,
        kick_channel_name TEXT NOT NULL,
        guild_id TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await run(`
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
    
    await run(`
      CREATE TABLE IF NOT EXISTS stream_notifications (
        discord_channel_id TEXT NOT NULL,
        kick_channel_name TEXT NOT NULL,
        notified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (discord_channel_id, kick_channel_name)
      )
    `);
    
    console.log('✅ Discord bot database initialized');
  }

  async loadWatchParties(): Promise<any[]> {
    const all = promisify(this.db.all.bind(this.db));
    return await all('SELECT * FROM watch_parties');
  }

  async saveWatchParty(channelId: string, kickChannelName: string, guildId: string) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT OR REPLACE INTO watch_parties (discord_channel_id, kick_channel_name, guild_id) VALUES (?, ?, ?)',
      [channelId, kickChannelName, guildId]
    );
  }

  async removeWatchParty(channelId: string) {
    const run = promisify(this.db.run.bind(this.db));
    await run('DELETE FROM watch_parties WHERE discord_channel_id = ?', [channelId]);
  }

  async logDiscordMessage(data: any) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT INTO discord_messages (discord_user_id, discord_channel_id, kick_streamer, message, request_id) VALUES (?, ?, ?, ?, ?)',
      [data.discord_user_id, data.discord_channel_id, data.kick_streamer, data.message, data.request_id]
    );
  }

  async getOriginalMessage(requestId: number): Promise<any> {
    const get = promisify(this.db.get.bind(this.db));
    return await get('SELECT * FROM discord_messages WHERE request_id = ?', [requestId]);
  }

  async getLastNotification(channelId: string, kickChannelName: string): Promise<number | null> {
    const get = promisify(this.db.get.bind(this.db));
    const result: any = await get(
      'SELECT notified_at FROM stream_notifications WHERE discord_channel_id = ? AND kick_channel_name = ?',
      [channelId, kickChannelName]
    );
    
    if (result) {
      return new Date(result.notified_at).getTime();
    }
    return null;
  }

  async saveNotification(channelId: string, kickChannelName: string) {
    const run = promisify(this.db.run.bind(this.db));
    await run(
      'INSERT OR REPLACE INTO stream_notifications (discord_channel_id, kick_channel_name, notified_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [channelId, kickChannelName]
    );
  }
}
