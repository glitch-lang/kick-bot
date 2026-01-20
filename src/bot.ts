import { kickAPI, KickChatMessage } from './kick-api';
import * as db from './database';
import axios from 'axios';

interface ChatListener {
  channelSlug: string;
  streamerId: number;
  onMessage: (message: KickChatMessage) => void;
}

export class KickBot {
  private listeners: Map<string, ChatListener> = new Map();
  private pollingInterval: NodeJS.Timeout | null = null;
  private isStarted: boolean = false;
  private lastMessagePerChannel: Map<number, number> = new Map(); // streamer_id -> last_request_id

  async start() {
    try {
      console.log('Starting Kick Bot...');
      
      // Load all active streamers and their commands
      try {
        await this.loadStreamers();
      } catch (error: any) {
        console.error('Error loading streamers (non-fatal):', error);
        // Continue even if streamers fail to load
      }
      
      // Start polling for chat messages (since WebSocket may not be available)
      this.startPolling();
      
      // Cleanup expired cooldowns periodically
      setInterval(() => {
        try {
          db.cleanupExpiredCooldowns();
        } catch (error: any) {
          console.error('Error cleaning up cooldowns:', error);
        }
      }, 60000); // Every minute
      
      this.isStarted = true;
      console.log('Kick Bot started and ready');
    } catch (error: any) {
      console.error('Bot start error:', error);
      console.error('Bot error details:', error.message);
      // Mark as started anyway so API endpoints work
      this.isStarted = true;
    }
  }

  private async loadStreamers() {
    try {
      const streamers = await db.getAllActiveStreamers();
      console.log(`Loading ${streamers.length} streamers...`);
      
      for (const streamer of streamers) {
        try {
          await this.connectToChannel(streamer);
        } catch (error: any) {
          console.error(`Error connecting to channel ${streamer.channel_name}:`, error);
          // Continue with other streamers
        }
      }
    } catch (error: any) {
      console.error('Error loading streamers:', error);
      // Don't throw - allow bot to continue
    }
  }

  private async connectToChannel(streamer: db.Streamer) {
    try {
      console.log(`Connecting to channel: ${streamer.channel_name}`);
      
      // Set up message handler - no need for commands, we'll check all streamers
      const onMessage = async (message: KickChatMessage) => {
        try {
          await this.handleMessage(streamer, message);
        } catch (error: any) {
          console.error(`Error handling message in ${streamer.channel_name}:`, error);
        }
      };
      
      this.listeners.set(streamer.channel_name, {
        channelSlug: streamer.channel_name,
        streamerId: streamer.id,
        onMessage,
      });
      
      // Connect via Kick API (now async)
      await kickAPI.connectToChat(streamer.channel_name, onMessage);
      console.log(`Successfully connected to channel: ${streamer.channel_name}`);
    } catch (error: any) {
      console.error(`Failed to connect to channel ${streamer.channel_name}:`, error);
      // Don't throw - allow other channels to connect
    }
  }

  private async handleMessage(
    streamer: db.Streamer | null,
    message: KickChatMessage
  ) {
    const content = message.content.trim();
    const username = message.user.username;
    const channelSlug = message.channel.slug;
    
    console.log(`\n🎯 Bot received message in ${channelSlug}:`);
    console.log(`   From: @${username}`);
    console.log(`   Content: "${content}"`);
    console.log(`   Message ID: ${message.id}`);
    
    // Handle !setupchat command - register via chat
    if (content.startsWith('!setupchat')) {
      await this.handleSetupChatCommand(message, channelSlug);
      return;
    }
    
    // Handle !cooldownchat command - set cooldown via chat
    if (content.startsWith('!cooldownchat')) {
      await this.handleCooldownChatCommand(message, channelSlug, content);
      return;
    }
    
    // Need a registered streamer for other commands
    if (!streamer) {
      // Try to find streamer by channel
      const foundStreamer = await db.getStreamerByChannelName(channelSlug);
      if (!foundStreamer) {
        // Not registered - ignore commands
        return;
      }
      streamer = foundStreamer;
    }
    
    // Handle !streamers command - list all available streamers
    if (content.startsWith('!streamers')) {
      await this.handleStreamersCommand(streamer, message);
      return;
    }
    
    // Handle !online command
    if (content.startsWith('!online')) {
      await this.handleOnlineCommand(streamer, message);
      return;
    }
    
    // Handle !respond command (with ID)
    if (content.startsWith('!respond')) {
      await this.handleRespondCommand(streamer, message, content);
      return;
    }
    
    // Handle !reply command (to most recent message)
    if (content.startsWith('!reply')) {
      await this.handleReplyCommand(streamer, message, content);
      return;
    }
    
    // Check if message is a command to a registered streamer
    // Format: !channelname message
    if (content.startsWith('!')) {
      const parts = content.substring(1).split(' ');
      const commandName = parts[0].toLowerCase();
      
      // Get all active streamers
      const allStreamers = await db.getAllActiveStreamers();
      const targetStreamer = allStreamers.find(s => 
        s.channel_name.toLowerCase() === commandName || 
        s.username.toLowerCase() === commandName
      );
      
      if (targetStreamer) {
        await this.handleStreamerCommand(streamer, targetStreamer, message, content);
        return;
      }
    }
  }

  private async handleCommand(
    fromStreamer: db.Streamer,
    command: db.Command,
    message: KickChatMessage,
    content: string
  ) {
    const userId = message.user.username;
    const channel = fromStreamer.channel_name;
    
    // Check cooldown
    const onCooldown = await db.checkCooldown(userId, channel, command.id);
    if (onCooldown) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} You're on cooldown for this command. Please wait.`
      );
      return;
    }
    
    // Extract message content
    const messageText = content.substring(`!${command.command_name}`.length).trim();
    if (!messageText) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} Usage: !${command.command_name} <message>`
      );
      return;
    }
    
    // Get target streamer
    const targetStreamer = await db.getStreamerById(command.target_streamer_id);
    if (!targetStreamer || !targetStreamer.is_active) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} Target streamer is not available.`
      );
      return;
    }
    
    // Check if target streamer is online
    const isLive = await kickAPI.isStreamerLive(targetStreamer.channel_name);
    if (!isLive) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} ${targetStreamer.username} is currently offline. Use !online to check who's live!`
      );
      return;
    }
    
    // Create message request
    const requestId = await db.createMessageRequest({
      from_user: userId,
      from_channel: channel,
      to_streamer_id: targetStreamer.id,
      message: messageText,
      command_id: command.id,
    });
    
    // Set cooldown
    await db.setCooldown(userId, channel, command.id, command.cooldown_seconds);
    
    // Send message to target streamer's chat with clear sender information
    const notificationMessage = `📨 Message from @${userId} (${fromStreamer.channel_name} / ${fromStreamer.username}): "${messageText}" | ID: ${requestId} | Reply: !respond ${requestId} <message>`;
    await this.sendMessage(
      targetStreamer.channel_name,
      targetStreamer.access_token,
      notificationMessage
    );
    
    // Confirm to sender
    const cooldownMinutes = Math.floor(command.cooldown_seconds / 60);
    const cooldownText = cooldownMinutes > 0 ? `${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''}` : `${command.cooldown_seconds} second${command.cooldown_seconds > 1 ? 's' : ''}`;
    await this.sendMessage(
      fromStreamer.channel_name,
      fromStreamer.access_token,
      `@${userId} ✅ Message sent to ${targetStreamer.username}! They can respond with !respond ${requestId} <message> (Cooldown: ${cooldownText})`
    );
  }

  private async handleSetupChatCommand(message: KickChatMessage, channelSlug: string) {
    const userId = message.user.username;
    console.log(`\n🔔 !setupchat received from @${userId} in channel: ${channelSlug}`);
    console.log(`📨 Message content: "${message.content}"`);
    console.log(`👤 User ID: ${message.user.id}, Username: ${message.user.username}`);
    
    // Get channel info first to check if user is broadcaster
    let channelInfo;
    try {
      console.log(`Getting channel info for: ${channelSlug}`);
      channelInfo = await kickAPI.getChannelInfo(channelSlug);
      if (!channelInfo) {
        console.error(`Could not get channel info for: ${channelSlug}`);
        const botToken = await this.getBotToken(channelSlug);
        if (botToken) {
          await this.sendMessage(channelSlug, botToken, `@${userId} Could not get channel info. Please try again.`);
        }
        return;
      }
    } catch (error: any) {
      console.error(`Error getting channel info:`, error);
      const botToken = await this.getBotToken(channelSlug);
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Error getting channel info. Please try again.`);
      }
      return;
    }
    
    // Check if user is the broadcaster (channel owner)
    // Channel slug should match broadcaster username (case-insensitive)
    const isBroadcaster = userId.toLowerCase() === channelSlug.toLowerCase();
    
    if (!isBroadcaster) {
      const botToken = await this.getBotToken(channelSlug);
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Only the channel broadcaster can use !setupchat. Please ask the broadcaster to run this command.`);
      }
      return;
    }
    
    // Check if already registered
    const existing = await db.getStreamerByChannelName(channelSlug);
    if (existing) {
      // Try to send message - use OAuth token from database or bot token
      const botToken = await this.getBotToken(channelSlug);
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} This channel is already registered! Use !cooldownchat <seconds> to set cooldown.`);
      }
      return;
    }
    
    // Get channel info to get username
    try {
      console.log(`Channel info retrieved: ${JSON.stringify(channelInfo)}`);
      
      // Get username from channel slug (slug is usually the username)
      // Or fetch user info if needed
      const username = channelSlug; // Channel slug is typically the username
      
      // Create streamer entry (without OAuth token - will use bot token for sending)
      // For now, we'll use a placeholder token - in production you'd want OAuth
      const placeholderToken = 'bot_token_' + channelSlug;
      console.log(`Creating streamer entry for: ${username}`);
      const streamerId = await db.createStreamer({
        username: username,
        kick_user_id: channelInfo.user_id?.toString() || channelSlug,
        access_token: placeholderToken,
        refresh_token: undefined,
        channel_name: channelSlug,
        cooldown_seconds: 60,
        is_active: 1,
      });
      
      console.log(`Streamer created with ID: ${streamerId}`);
      
      // Reload streamers to include new one
      await this.loadStreamers();
      
      const botToken = await this.getBotToken(channelSlug);
      if (botToken) {
        console.log(`Sending success message to channel: ${channelSlug}`);
        await this.sendMessage(channelSlug, botToken, `@${userId} ✅ Channel registered! Your command is: !${channelSlug} | Default cooldown: 60s | Use !cooldownchat <seconds> to change.`);
      } else {
        console.error('❌ No valid token available for sending message!');
      }
    } catch (error: any) {
      console.error('Error setting up chat:', error);
      console.error('Error stack:', error.stack);
    }
  }
  
  private async handleCooldownChatCommand(message: KickChatMessage, channelSlug: string, content: string) {
    const userId = message.user.username;
    
    // Get channel info to check if user is broadcaster
    const channelInfo = await kickAPI.getChannelInfo(channelSlug);
    const isBroadcaster = userId.toLowerCase() === channelSlug.toLowerCase();
    
    if (!isBroadcaster) {
      const botToken = process.env.BOT_ACCESS_TOKEN || '';
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Only the channel broadcaster can use !cooldownchat.`);
      }
      return;
    }
    
    // Get streamer
    const streamer = await db.getStreamerByChannelName(channelSlug);
    if (!streamer) {
      const botToken = process.env.BOT_ACCESS_TOKEN || '';
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Channel not registered. Use !setupchat first.`);
      }
      return;
    }
    
    // Parse cooldown value
    const parts = content.split(' ');
    if (parts.length < 2) {
      const botToken = process.env.BOT_ACCESS_TOKEN || '';
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Usage: !cooldownchat <seconds> (e.g., !cooldownchat 60)`);
      }
      return;
    }
    
    const cooldownSeconds = parseInt(parts[1]);
    if (isNaN(cooldownSeconds) || cooldownSeconds < 0) {
      const botToken = process.env.BOT_ACCESS_TOKEN || '';
      if (botToken) {
        await this.sendMessage(channelSlug, botToken, `@${userId} Invalid cooldown value. Use a number in seconds (e.g., 60 for 1 minute).`);
      }
      return;
    }
    
    // Update cooldown
    await db.updateStreamerCooldown(streamer.id, cooldownSeconds);
    
    const cooldownMinutes = Math.floor(cooldownSeconds / 60);
    const cooldownText = cooldownMinutes > 0 ? `${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''}` : `${cooldownSeconds} second${cooldownSeconds > 1 ? 's' : ''}`;
    
    const botToken = await this.getBotToken(channelSlug);
    if (botToken) {
      await this.sendMessage(channelSlug, botToken, `@${userId} ✅ Cooldown updated to ${cooldownText}!`);
    }
  }

  private async handleStreamerCommand(
    fromStreamer: db.Streamer,
    targetStreamer: db.Streamer,
    message: KickChatMessage,
    content: string
  ) {
    const userId = message.user.username;
    const channel = fromStreamer.channel_name;
    
    // Extract message content (everything after !channelname)
    const commandName = targetStreamer.channel_name.toLowerCase();
    const messageText = content.substring(`!${commandName}`.length).trim();
    
    if (!messageText) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} Usage: !${targetStreamer.channel_name} <message>`
      );
      return;
    }
    
    // Check cooldown (use a special cooldown key based on target streamer)
    const cooldownKey = `streamer_${targetStreamer.id}`;
    const onCooldown = await db.checkCooldown(userId, channel, cooldownKey);
    if (onCooldown) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} You're on cooldown. Please wait before messaging ${targetStreamer.username} again.`
      );
      return;
    }
    
    // Check if target streamer is online
    const isLive = await kickAPI.isStreamerLive(targetStreamer.channel_name);
    if (!isLive) {
      await this.sendMessage(
        fromStreamer.channel_name,
        fromStreamer.access_token,
        `@${userId} ${targetStreamer.username} is currently offline. Use !streamers or !online to check who's live!`
      );
      return;
    }
    
    // Create message request (command_id can be null now)
    const requestId = await db.createMessageRequest({
      from_user: userId,
      from_channel: channel,
      to_streamer_id: targetStreamer.id,
      message: messageText,
      command_id: null, // No longer using command table
    });
    
    // Track this as the last message for the target streamer
    this.lastMessagePerChannel.set(targetStreamer.id, requestId);
    
    // Set cooldown using target streamer's cooldown setting
    await db.setCooldown(userId, channel, cooldownKey, targetStreamer.cooldown_seconds || 60);
    
    // Send message to target streamer's chat
    const notificationMessage = `📨 Message from @${userId} (${fromStreamer.channel_name} / ${fromStreamer.username}): "${messageText}" | ID: ${requestId} | Reply: !respond ${requestId} <message> OR !reply <message>`;
    await this.sendMessage(
      targetStreamer.channel_name,
      targetStreamer.access_token,
      notificationMessage
    );
    
    // Confirm to sender
    const cooldownSeconds = targetStreamer.cooldown_seconds || 60;
    const cooldownMinutes = Math.floor(cooldownSeconds / 60);
    const cooldownText = cooldownMinutes > 0 ? `${cooldownMinutes} minute${cooldownMinutes > 1 ? 's' : ''}` : `${cooldownSeconds} second${cooldownSeconds > 1 ? 's' : ''}`;
    await this.sendMessage(
      fromStreamer.channel_name,
      fromStreamer.access_token,
      `@${userId} ✅ Message sent to ${targetStreamer.username}! They can respond with !respond ${requestId} <message> (Cooldown: ${cooldownText})`
    );
  }
  
  private async handleStreamersCommand(
    streamer: db.Streamer,
    message: KickChatMessage
  ) {
    const userId = message.user.username;
    
    // Get all active streamers
    const allStreamers = await db.getAllActiveStreamers();
    
    if (allStreamers.length === 0) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${userId} No streamers registered yet.`
      );
      return;
    }
    
    // Build list of streamers
    const streamerList = allStreamers
      .map(s => `• !${s.channel_name} - ${s.username}`)
      .join('\n');
    
    await this.sendMessage(
      streamer.channel_name,
      streamer.access_token,
      `@${userId} Available streamers:\n${streamerList}\n\nUse: !channelname <message> to send a message!`
    );
  }

  private async handleOnlineCommand(
    streamer: db.Streamer,
    message: KickChatMessage
  ) {
    const userId = message.user.username;
    
    // Get all active streamers
    const allStreamers = await db.getAllActiveStreamers();
    
    // Check online status for all streamers
    const onlineStatuses: Array<{ streamer: db.Streamer; isLive: boolean; status?: any }> = [];
    
    for (const targetStreamer of allStreamers) {
      const status = await kickAPI.getStreamerStatus(targetStreamer.channel_name);
      onlineStatuses.push({
        streamer: targetStreamer,
        isLive: status.isLive,
        status: status,
      });
    }
    
    // Format response
    const onlineStreamers = onlineStatuses.filter(s => s.isLive);
    const offlineStreamers = onlineStatuses.filter(s => !s.isLive);
    
    let response = `📺 Online Streamers:\n`;
    
    if (onlineStreamers.length === 0) {
      response += `❌ No streamers are currently online.\n\n`;
    } else {
      for (const { streamer: s, status } of onlineStreamers) {
        const viewerInfo = status.viewerCount ? ` 👁️ ${status.viewerCount} viewers` : '';
        const titleInfo = status.title ? ` - ${status.title}` : '';
        response += `🟢 ${s.username}${viewerInfo}${titleInfo}\n`;
      }
      response += `\n`;
    }
    
    if (offlineStreamers.length > 0) {
      response += `💤 Offline:\n`;
      for (const { streamer: s } of offlineStreamers) {
        response += `⚫ ${s.username}\n`;
      }
    }
    
    // Send response (may need to split if too long)
    if (response.length > 500) {
      // Split into multiple messages
      const lines = response.split('\n');
      let currentMessage = '';
      
      for (const line of lines) {
        if ((currentMessage + line + '\n').length > 500) {
          await this.sendMessage(streamer.channel_name, streamer.access_token, currentMessage.trim());
          currentMessage = line + '\n';
        } else {
          currentMessage += line + '\n';
        }
      }
      
      if (currentMessage.trim()) {
        await this.sendMessage(streamer.channel_name, streamer.access_token, currentMessage.trim());
      }
    } else {
      await this.sendMessage(streamer.channel_name, streamer.access_token, response.trim());
    }
  }

  private async handleRespondCommand(
    streamer: db.Streamer,
    message: KickChatMessage,
    content: string
  ) {
    const parts = content.split(' ');
    if (parts.length < 3) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Usage: !respond <request_id> <message>`
      );
      return;
    }
    
    const requestId = parseInt(parts[1]);
    const responseMessage = parts.slice(2).join(' ');
    
    if (isNaN(requestId) || !responseMessage) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Invalid request ID or message.`
      );
      return;
    }
    
    // Get the original request
    const request = await db.getRequestById(requestId);
    if (!request || request.to_streamer_id !== streamer.id) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Request not found or not yours to respond to.`
      );
      return;
    }
    
    if (request.status !== 'pending') {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} This request has already been responded to.`
      );
      return;
    }
    
    // Get the original sender's streamer info
    const fromStreamer = await db.getStreamerByUsername(request.from_channel);
    if (!fromStreamer) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Could not find original sender's channel.`
      );
      return;
    }
    
    // Mark request as responded
    await db.markRequestResponded(requestId);
    
    // Send response back to original channel with clear sender information
    const responseText = `💬 Response from @${streamer.username} (${streamer.channel_name}): "${responseMessage}" | Request ID: ${requestId}`;
    await this.sendMessage(
      fromStreamer.channel_name,
      fromStreamer.access_token,
      `@${request.from_user} ${responseText}`
    );
    
    // Confirm to responder
    await this.sendMessage(
      streamer.channel_name,
      streamer.access_token,
      `@${message.user.username} Response sent to @${request.from_user} in ${fromStreamer.channel_name}!`
    );
  }

  private async handleReplyCommand(
    streamer: db.Streamer,
    message: KickChatMessage,
    content: string
  ) {
    const parts = content.split(' ');
    if (parts.length < 2) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Usage: !reply <message>`
      );
      return;
    }
    
    const responseMessage = parts.slice(1).join(' ');
    
    if (!responseMessage) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Please provide a message to reply with.`
      );
      return;
    }
    
    // Get the last message ID for this streamer
    const lastRequestId = this.lastMessagePerChannel.get(streamer.id);
    
    if (!lastRequestId) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} No recent messages to reply to. Use !respond <id> <message> for older messages.`
      );
      return;
    }
    
    // Get the original request
    const request = await db.getRequestById(lastRequestId);
    if (!request || request.to_streamer_id !== streamer.id) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Could not find the last message. Use !respond <id> <message> instead.`
      );
      return;
    }
    
    if (request.status !== 'pending') {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} You already responded to this message. Use !respond <id> <message> for specific messages.`
      );
      return;
    }
    
    // Get the original sender's streamer info
    const fromStreamer = await db.getStreamerByUsername(request.from_channel);
    if (!fromStreamer) {
      await this.sendMessage(
        streamer.channel_name,
        streamer.access_token,
        `@${message.user.username} Could not find original sender's channel.`
      );
      return;
    }
    
    // Mark request as responded
    await db.markRequestResponded(lastRequestId);
    
    // Send response back to original channel
    const responseText = `💬 Response from @${streamer.username} (${streamer.channel_name}): "${responseMessage}"`;
    await this.sendMessage(
      fromStreamer.channel_name,
      fromStreamer.access_token,
      `@${request.from_user} ${responseText}`
    );
    
    // Confirm to responder
    await this.sendMessage(
      streamer.channel_name,
      streamer.access_token,
      `@${message.user.username} ✅ Reply sent to @${request.from_user} in ${fromStreamer.channel_name}!`
    );
  }

  // Get the best available bot token for a channel (OAuth token or bot token)
  private async getBotToken(channelSlug: string): Promise<string | null> {
    try {
      // First, try to get OAuth token from database
      const streamer = await db.getStreamerByChannelName(channelSlug);
      if (streamer && streamer.access_token && !streamer.access_token.startsWith('bot_token_')) {
        return streamer.access_token;
      }
      
      // Fall back to bot token from environment
      const botToken = process.env.BOT_ACCESS_TOKEN;
      if (botToken) {
        return botToken;
      }
      
      console.warn(`No token available for channel ${channelSlug}`);
      return null;
    } catch (error) {
      console.error(`Error getting bot token for ${channelSlug}:`, error);
      return process.env.BOT_ACCESS_TOKEN || null;
    }
  }

  private async sendMessage(channelSlug: string, accessToken: string, message: string): Promise<boolean> {
    try {
      // If token is a placeholder, try to use bot token
      if (accessToken && accessToken.startsWith('bot_token_')) {
        const botToken = process.env.BOT_ACCESS_TOKEN;
        if (botToken) {
          return await kickAPI.sendChatMessage(channelSlug, message, botToken, 'bot');
        }
        console.warn(`No bot token available for channel ${channelSlug}`);
        return false;
      }
      return await kickAPI.sendChatMessage(channelSlug, message, accessToken, 'bot');
    } catch (error) {
      console.error(`Error sending message to ${channelSlug}:`, error);
      return false;
    }
  }

  private lastMessageIds: Map<string, Set<string>> = new Map();
  private pollingEnabled: Map<string, boolean> = new Map(); // Track if polling is needed per channel
  
  private startPolling() {
    // NOTE: Chat message polling doesn't work - Kick doesn't have a public chat messages API
    // We rely entirely on Pusher WebSocket for real-time chat messages
    // This polling function is kept as a placeholder but does nothing
    console.log('📡 Chat polling disabled - using Pusher WebSocket only');
    // No polling interval - we rely on Pusher WebSocket connections
  }
  
  // Connect to any channel (for !setupchat)
  private async connectToAnyChannel(channelSlug: string) {
    if (this.listeners.has(channelSlug)) {
      console.log(`Already connected to channel: ${channelSlug}`);
      return; // Already connected
    }
    
    console.log(`Connecting to channel (unregistered): ${channelSlug}`);
    
    // Set up message handler - no streamer yet, will be registered via !setupchat
    const onMessage = async (message: KickChatMessage) => {
      await this.handleMessage(null, message);
    };
    
    this.listeners.set(channelSlug, {
      channelSlug: channelSlug,
      streamerId: 0,
      onMessage,
    });
    
    // Connect via Kick API (now async)
    await kickAPI.connectToChat(channelSlug, onMessage);
  }

  // Public method to connect to channel for setup (called from API)
  async connectToChannelForSetup(channelSlug: string): Promise<void> {
    if (!this.isStarted) {
      throw new Error('Bot is not started yet. Please wait for bot to initialize.');
    }
    await this.connectToAnyChannel(channelSlug);
  }
  
  // Check if bot is started
  isBotStarted(): boolean {
    return this.isStarted;
  }
  
  // Check if channel is connected
  isChannelConnected(channelSlug: string): boolean {
    return this.listeners.has(channelSlug);
  }
  
  // Public method to handle incoming chat messages (called from WebSocket or API)
  async handleIncomingMessage(channelSlug: string, message: KickChatMessage) {
    // Ensure channel is connected
    if (!this.listeners.has(channelSlug)) {
      console.log(`Channel ${channelSlug} not connected, connecting now...`);
      await this.connectToAnyChannel(channelSlug);
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Get listener for this channel
    const listener = this.listeners.get(channelSlug);
    if (listener) {
      await listener.onMessage(message);
    } else {
      console.warn(`No listener found for channel ${channelSlug} after connection attempt`);
    }
  }

  // Public method to handle webhook messages (called from webhook endpoint)
  async handleWebhookMessage(message: KickChatMessage) {
    const channelSlug = message.channel.slug;
    
    console.log(`\n📬 Processing webhook message from ${channelSlug}`);
    console.log(`   From: ${message.user.username}`);
    console.log(`   Message: "${message.content}"`);
    
    // Ensure channel is connected
    if (!this.listeners.has(channelSlug)) {
      console.log(`Channel ${channelSlug} not connected, connecting now...`);
      await this.connectToAnyChannel(channelSlug);
      // Wait a moment for connection to establish
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Get listener for this channel
    const listener = this.listeners.get(channelSlug);
    if (listener) {
      await listener.onMessage(message);
    } else {
      console.warn(`No listener found for channel ${channelSlug} after connection attempt`);
      // Try to process the message anyway (for commands)
      await this.processCommand(channelSlug, message);
    }
  }

  // Process commands directly (used for webhook messages when no listener exists)
  private async processCommand(channelSlug: string, message: KickChatMessage) {
    const content = message.content.trim();
    
    // Ignore messages from the bot itself
    if (message.user.username.toLowerCase() === process.env.BOT_USERNAME?.toLowerCase()) {
      return;
    }
    
    // Check if it's a command
    if (!content.startsWith('!')) {
      return;
    }
    
    const [command, ...args] = content.slice(1).split(' ');
    const commandLower = command.toLowerCase();
    
    console.log(`\n🎮 Command received: !${commandLower}`);
    console.log(`   From: ${message.user.username}`);
    console.log(`   Args: ${args.join(' ')}`);
    
    try {
      // Get bot token for sending messages
      const token = await this.getBotToken(channelSlug);
      if (!token) {
        console.error('No bot token available');
        return;
      }
      
      // Process the command
      switch (commandLower) {
        case 'ping':
          await kickAPI.sendChatMessage(channelSlug, `@${message.user.username} Pong! 🏓`, token);
          break;
          
        case 'commands':
        case 'help':
          await kickAPI.sendChatMessage(
            channelSlug,
            `@${message.user.username} Commands: !ping, !online, !streamers, !setupchat, !reply <msg>, !respond <id> <msg>, !channelname <msg>`,
            token
          );
          break;
          
        case 'send':
          // Cross-channel message: !send channelname message here
          if (args.length < 2) {
            await kickAPI.sendChatMessage(
              channelSlug,
              `@${message.user.username} Usage: !send <channel> <message>`,
              token
            );
            break;
          }
          
          const targetChannel = args[0].toLowerCase();
          const crossMessage = args.slice(1).join(' ');
          
          // Format the cross-chat message
          const formattedMessage = `📨 Cross-chat from @${message.user.username} (${channelSlug}): ${crossMessage}`;
          
          try {
            const success = await kickAPI.sendChatMessage(targetChannel, formattedMessage, token);
            
            if (success) {
              await kickAPI.sendChatMessage(
                channelSlug,
                `@${message.user.username} ✅ Message sent to ${targetChannel}!`,
                token
              );
              console.log(`✅ Cross-chat message sent from ${channelSlug} to ${targetChannel}`);
            } else {
              await kickAPI.sendChatMessage(
                channelSlug,
                `@${message.user.username} ❌ Failed to send message to ${targetChannel}. Channel may not exist.`,
                token
              );
            }
          } catch (error) {
            console.error(`Failed to send cross-chat message:`, error);
            await kickAPI.sendChatMessage(
              channelSlug,
              `@${message.user.username} ❌ Error sending message to ${targetChannel}`,
              token
            );
          }
          break;
          
        case 'uptime':
          const uptime = Math.floor(process.uptime());
          const hours = Math.floor(uptime / 3600);
          const minutes = Math.floor((uptime % 3600) / 60);
          const seconds = uptime % 60;
          await kickAPI.sendChatMessage(
            channelSlug,
            `@${message.user.username} Bot uptime: ${hours}h ${minutes}m ${seconds}s`,
            token
          );
          break;
          
        default:
          // Unknown command - ignore it
          console.log(`   Unknown command: !${commandLower}`);
          break;
      }
    } catch (error) {
      console.error(`Error processing command !${commandLower}:`, error);
    }
  }

  async stop() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    console.log('Kick Bot stopped');
  }
}

// Start bot if run directly
if (require.main === module) {
  const bot = new KickBot();
  bot.start().catch(console.error);
  
  process.on('SIGINT', async () => {
    await bot.stop();
    process.exit(0);
  });
}
