import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/kickbot.db';

// Ensure data directory exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(DB_PATH);

// Promisify database methods
const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;

export interface Streamer {
  id: number;
  username: string;
  kick_user_id: string;
  access_token: string;
  refresh_token?: string;
  channel_name: string;
  cooldown_seconds?: number;
  is_active: number;
  created_at: string;
}

export interface Command {
  id: number;
  streamer_id: number;
  command_name: string;
  target_streamer_id: number;
  channel_points_cost: number;
  cooldown_seconds: number;
  is_active: number;
  created_at: string;
}

export interface MessageRequest {
  id: number;
  from_user: string;
  from_channel: string;
  to_streamer_id: number;
  message: string;
  command_id: number | null;
  status: string; // 'pending', 'responded', 'expired'
  created_at: string;
  responded_at?: string;
  discord_channel_id?: string;
}

export interface Cooldown {
  id: number;
  user_id: string;
  channel: string;
  command_id: number;
  expires_at: string;
}

export interface Refund {
  id: number;
  user_id: string;
  channel: string;
  command_id: number;
  points_refunded: number;
  reason: string;
  created_at: string;
}

export async function initDatabase() {
  // Streamers table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS streamers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      kick_user_id TEXT NOT NULL UNIQUE,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      channel_name TEXT NOT NULL,
      cooldown_seconds INTEGER DEFAULT 60,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Commands table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      streamer_id INTEGER NOT NULL,
      command_name TEXT NOT NULL,
      target_streamer_id INTEGER NOT NULL,
      channel_points_cost INTEGER DEFAULT 100,
      cooldown_seconds INTEGER DEFAULT 300,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (streamer_id) REFERENCES streamers(id),
      FOREIGN KEY (target_streamer_id) REFERENCES streamers(id),
      UNIQUE(streamer_id, command_name)
    )
  `);

  // Message requests table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS message_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user TEXT NOT NULL,
      from_channel TEXT NOT NULL,
      to_streamer_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      command_id INTEGER,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      responded_at DATETIME,
      discord_channel_id TEXT,
      FOREIGN KEY (to_streamer_id) REFERENCES streamers(id),
      FOREIGN KEY (command_id) REFERENCES commands(id)
    )
  `);

  // Migration: Add discord_channel_id column if it doesn't exist
  try {
    await dbRun(`ALTER TABLE message_requests ADD COLUMN discord_channel_id TEXT`);
    console.log('✅ Migration: Added discord_channel_id column to message_requests');
  } catch (error: any) {
    // Column already exists or other error - that's okay
    if (!error.message.includes('duplicate column')) {
      console.log('discord_channel_id column already exists or migration not needed');
    }
  }

  // Cooldowns table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      command_id INTEGER,
      expires_at DATETIME NOT NULL,
      FOREIGN KEY (command_id) REFERENCES commands(id),
      UNIQUE(user_id, channel, command_id)
    )
  `);

  // Refunds table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS refunds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      command_id INTEGER,
      points_refunded INTEGER NOT NULL,
      reason TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (command_id) REFERENCES commands(id)
    )
  `);

  console.log('Database initialized successfully');
}

export async function getStreamerByUsername(username: string): Promise<Streamer | null> {
  return (await dbGet('SELECT * FROM streamers WHERE username = ?', [username])) as Streamer | null;
}

export async function getStreamerById(id: number): Promise<Streamer | null> {
  return (await dbGet('SELECT * FROM streamers WHERE id = ?', [id])) as Streamer | null;
}

export async function getStreamerByKickId(kickUserId: string): Promise<Streamer | null> {
  return (await dbGet('SELECT * FROM streamers WHERE kick_user_id = ?', [kickUserId])) as Streamer | null;
}

export async function getStreamerByChannelName(channelName: string): Promise<Streamer | null> {
  return (await dbGet('SELECT * FROM streamers WHERE channel_name = ?', [channelName])) as Streamer | null;
}

export async function createStreamer(data: Omit<Streamer, 'id' | 'created_at'>): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO streamers (username, kick_user_id, access_token, refresh_token, channel_name, cooldown_seconds, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.username, data.kick_user_id, data.access_token, data.refresh_token || null, data.channel_name, data.cooldown_seconds || 60, data.is_active],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

export async function updateStreamerCooldown(id: number, cooldownSeconds: number) {
  await dbRun(
    'UPDATE streamers SET cooldown_seconds = ? WHERE id = ?',
    [cooldownSeconds, id]
  );
}

export async function updateStreamerToken(id: number, accessToken: string, refreshToken?: string) {
  await dbRun(
    'UPDATE streamers SET access_token = ?, refresh_token = ? WHERE id = ?',
    [accessToken, refreshToken || null, id]
  );
}

export async function getAllActiveStreamers(): Promise<Streamer[]> {
  return (await dbAll('SELECT * FROM streamers WHERE is_active = 1') as Streamer[]);
}

export async function deactivateStreamer(id: number): Promise<void> {
  await dbRun(
    'UPDATE streamers SET is_active = 0 WHERE id = ?',
    [id]
  );
}

export async function reactivateStreamer(id: number): Promise<void> {
  await dbRun(
    'UPDATE streamers SET is_active = 1 WHERE id = ?',
    [id]
  );
}

export async function deleteStreamer(streamerId: number): Promise<void> {
  await dbRun('DELETE FROM streamers WHERE id = ?', [streamerId]);
}

export async function getCommand(streamerId: number, commandName: string): Promise<Command | null> {
  return (await dbGet(
    'SELECT * FROM commands WHERE streamer_id = ? AND command_name = ? AND is_active = 1',
    [streamerId, commandName]
  )) as Command | null;
}

export async function getCommandsByStreamer(streamerId: number): Promise<Command[]> {
  return (await dbAll(
    'SELECT * FROM commands WHERE streamer_id = ? AND is_active = 1',
    [streamerId]
  ) as Command[]);
}

export async function createCommand(data: Omit<Command, 'id' | 'created_at'>): Promise<number> {
  const result = await dbRun(
    `INSERT INTO commands (streamer_id, command_name, target_streamer_id, channel_points_cost, cooldown_seconds, is_active)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [data.streamer_id, data.command_name, data.target_streamer_id, data.channel_points_cost, data.cooldown_seconds, data.is_active]
  );
  return (result as any).lastID;
}

export async function createMessageRequest(data: Omit<MessageRequest, 'id' | 'created_at' | 'status' | 'responded_at'>): Promise<number> {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO message_requests (from_user, from_channel, to_streamer_id, message, command_id, status, discord_channel_id)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [data.from_user, data.from_channel, data.to_streamer_id, data.message, data.command_id, data.discord_channel_id || null],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      }
    );
  });
}

export async function markRequestRefunded(requestId: number) {
  await dbRun(
    'UPDATE message_requests SET status = ? WHERE id = ?',
    ['refunded', requestId]
  );
}

export async function getPendingRequests(streamerId: number): Promise<MessageRequest[]> {
  return (await dbAll(
    'SELECT * FROM message_requests WHERE to_streamer_id = ? AND status = ? ORDER BY created_at DESC',
    [streamerId, 'pending']
  ) as MessageRequest[]);
}

export async function markRequestResponded(requestId: number) {
  await dbRun(
    'UPDATE message_requests SET status = ?, responded_at = CURRENT_TIMESTAMP WHERE id = ?',
    ['responded', requestId]
  );
}

export async function getRequestById(id: number): Promise<MessageRequest | null> {
  return (await dbGet('SELECT * FROM message_requests WHERE id = ?', [id])) as MessageRequest | null;
}

export async function checkCooldown(userId: string, channel: string, commandId: number | string): Promise<boolean> {
  const cooldown = await dbGet(
    'SELECT * FROM cooldowns WHERE user_id = ? AND channel = ? AND command_id = ? AND expires_at > datetime("now")',
    [userId, channel, String(commandId)]
  );
  return cooldown !== null && cooldown !== undefined;
}

export async function getRemainingCooldown(userId: string, channel: string, commandId: number | string): Promise<number> {
  const cooldown = await dbGet(
    'SELECT expires_at FROM cooldowns WHERE user_id = ? AND channel = ? AND command_id = ? AND expires_at > datetime("now")',
    [userId, channel, String(commandId)]
  );
  
  if (!cooldown) {
    return 0;
  }
  
  const expiresAt = new Date(cooldown.expires_at).getTime();
  const now = Date.now();
  const remainingMs = expiresAt - now;
  
  return Math.max(0, Math.ceil(remainingMs / 1000)); // Return seconds remaining
}

export async function setCooldown(userId: string, channel: string, commandId: number | string, cooldownSeconds: number) {
  const expiresAt = new Date(Date.now() + cooldownSeconds * 1000).toISOString();
  await dbRun(
    `INSERT OR REPLACE INTO cooldowns (user_id, channel, command_id, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, channel, String(commandId), expiresAt]
  );
}

export async function removeCooldown(userId: string, channel: string, commandId: number | string) {
  await dbRun(
    'DELETE FROM cooldowns WHERE user_id = ? AND channel = ? AND command_id = ?',
    [userId, channel, String(commandId)]
  );
}

export async function cleanupExpiredCooldowns() {
  await dbRun('DELETE FROM cooldowns WHERE expires_at < datetime("now")');
}

export async function createRefund(
  userId: string,
  channel: string,
  commandId: number,
  pointsRefunded: number,
  reason: string
): Promise<number> {
  const result = await dbRun(
    `INSERT INTO refunds (user_id, channel, command_id, points_refunded, reason)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, channel, commandId, pointsRefunded, reason]
  );
  return (result as any).lastID;
}

export async function getRefundsByUser(userId: string, channel: string): Promise<Refund[]> {
  return (await dbAll(
    'SELECT * FROM refunds WHERE user_id = ? AND channel = ? ORDER BY created_at DESC LIMIT 10',
    [userId, channel]
  ) as Refund[]);
}

export { db };
