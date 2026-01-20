import { Client, GatewayIntentBits, EmbedBuilder, ChannelType, TextChannel, VoiceChannel } from 'discord.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { Database } from './database';
import { StreamManager } from './stream-manager';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const db = new Database();
const KICK_API_URL = process.env.KICK_BOT_API_URL || 'https://web-production-56232.up.railway.app';

// Initialize StreamManager for voice streaming
const streamManager = new StreamManager(KICK_API_URL);

// Track which Discord channels are watching which Kick streams
const watchParties = new Map<string, string>(); // channelId -> kickChannelName

client.once('ready', () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
  console.log(`📡 Connected to ${client.guilds.cache.size} servers`);
  
  // Load watch parties from database
  db.loadWatchParties().then(parties => {
    parties.forEach(party => {
      watchParties.set(party.discord_channel_id, party.kick_channel_name);
    });
    console.log(`📺 Loaded ${watchParties.size} watch parties`);
  });
  
  // Start checking for live streams
  setInterval(() => checkLiveStreams(), 60000); // Check every minute
});

client.on('messageCreate', async (message) => {
  // Ignore bot messages
  if (message.author.bot) return;
  
  const content = message.content.trim();
  
  // Command: !kick message <streamer> <message>
  if (content.startsWith('!kick message ')) {
    await handleKickMessage(message);
    return;
  }
  
  // Command: !kick watch <streamer>
  if (content.startsWith('!kick watch ')) {
    await handleWatchCommand(message);
    return;
  }
  
  // Command: !kick unwatch
  if (content.startsWith('!kick unwatch')) {
    await handleUnwatchCommand(message);
    return;
  }
  
  // Command: !kick stream <streamer> (voice streaming)
  if (content.startsWith('!kick stream ')) {
    await handleStreamCommand(message);
    return;
  }
  
  // Command: !kick stopstream
  if (content.startsWith('!kick stopstream')) {
    await handleStopStreamCommand(message);
    return;
  }
  
  // Command: !kick streams (active voice streams)
  if (content.startsWith('!kick streams')) {
    await handleActiveStreamsCommand(message);
    return;
  }
  
  // Command: !kick online
  if (content.startsWith('!kick online')) {
    await handleOnlineCommand(message);
    return;
  }
  
  // Command: !kick streamers
  if (content.startsWith('!kick streamers')) {
    await handleStreamersCommand(message);
    return;
  }
  
  // Command: !kick setupwebhook <webhook_url>
  if (content.startsWith('!kick setupwebhook')) {
    await handleSetupWebhookCommand(message);
    return;
  }
  
  // Command: !kick removewebhook
  if (content.startsWith('!kick removewebhook')) {
    await handleRemoveWebhookCommand(message);
    return;
  }
  
  // Command: !kick help
  if (content.startsWith('!kick help')) {
    await handleHelpCommand(message);
    return;
  }
});

async function handleKickMessage(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick message"
  
  if (parts.length < 2) {
    await message.reply('❌ Usage: `!kick message <streamer> <your message>`\nExample: `!kick message jerzy Hey, great stream!`');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  const messageText = parts.slice(1).join(' ');
  
  try {
    // Check if webhook is set up for this channel
    const webhookUrl = await db.getWebhook(message.channel.id);
    if (!webhookUrl) {
      await message.reply('⚠️ **Webhook not set up!**\n\nTo receive replies from Kick streamers in this channel, you need to set up a webhook first.\n\n**How to set up:**\n1. Right-click this channel → **Edit Channel**\n2. Go to **Integrations** → **Webhooks**\n3. Click **New Webhook** or **Create Webhook**\n4. Copy the **Webhook URL**\n5. Run: `!kick setupwebhook <paste_webhook_url_here>`\n\nYour message will still be sent, but replies won\'t appear here until you set up the webhook.');
    }
    
    // Send message via Kick bot API
    const response = await axios.post(`${KICK_API_URL}/api/discord/message`, {
      from_user: message.author.username,
      from_platform: 'discord',
      to_streamer: streamerName,
      message: messageText,
      discord_channel_id: message.channel.id,
      webhook_url: webhookUrl, // Send the webhook URL to the backend
    });
    
    if (response.data.success) {
      await message.reply(`✅ Message sent to **${streamerName}** on Kick! They can respond with !reply`);
      
      // Log in database for tracking responses
      await db.logDiscordMessage({
        discord_user_id: message.author.id,
        discord_channel_id: message.channel.id,
        kick_streamer: streamerName,
        message: messageText,
        request_id: response.data.request_id,
      });
    } else {
      await message.reply(`❌ Failed to send message: ${response.data.error || 'Unknown error'}`);
    }
  } catch (error: any) {
    console.error('Error sending message to Kick:', error);
    await message.reply(`❌ Error: ${error.response?.data?.error || error.message}`);
  }
}

async function handleWatchCommand(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick watch"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick watch <streamer>`\nExample: `!kick watch jerzy`');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  const channelId = message.channel.id;
  
  try {
    // Check if streamer exists
    const response = await axios.get(`${KICK_API_URL}/api/streamers`);
    const streamers = response.data;
    const streamer = streamers.find((s: any) => 
      s.channel_name.toLowerCase() === streamerName || s.username.toLowerCase() === streamerName
    );
    
    if (!streamer) {
      await message.reply(`❌ Streamer **${streamerName}** is not registered in CrossTalk.\nUse \`!kick streamers\` to see available streamers.`);
      return;
    }
    
    // Set up watch party
    watchParties.set(channelId, streamer.channel_name);
    await db.saveWatchParty(channelId, streamer.channel_name, message.guild?.id || '');
    
    // Check if they're live right now
    const liveStatus = await checkStreamerLive(streamer.channel_name);
    
    if (liveStatus.isLive) {
      const embed = new EmbedBuilder()
        .setColor(0x00ff00)
        .setTitle(`🔴 LIVE: ${streamer.username}`)
        .setDescription(liveStatus.title || 'No title')
        .setURL(`https://kick.com/${streamer.channel_name}`)
        .addFields(
          { name: '👥 Viewers', value: liveStatus.viewers?.toString() || '0', inline: true }
        )
        .setThumbnail('https://i.imgur.com/YourKickLogo.png') // Add Kick logo
        .setTimestamp();
      
      await message.channel.send({ embeds: [embed] });
    } else {
      await message.reply(`📺 Now watching **${streamer.username}** - I'll notify this channel when they go live!\n🔗 https://kick.com/${streamer.channel_name}`);
    }
  } catch (error: any) {
    console.error('Error setting up watch party:', error);
    await message.reply(`❌ Error: ${error.message}`);
  }
}

async function handleUnwatchCommand(message: any) {
  const channelId = message.channel.id;
  
  if (!watchParties.has(channelId)) {
    await message.reply('❌ This channel is not watching any Kick streamer.');
    return;
  }
  
  const streamerName = watchParties.get(channelId);
  watchParties.delete(channelId);
  await db.removeWatchParty(channelId);
  
  await message.reply(`📺 Stopped watching **${streamerName}**`);
}

async function handleOnlineCommand(message: any) {
  try {
    const response = await axios.get(`${KICK_API_URL}/api/streamers`);
    const streamers = response.data;
    
    const onlineChecks = await Promise.all(
      streamers.map(async (s: any) => ({
        streamer: s,
        status: await checkStreamerLive(s.channel_name),
      }))
    );
    
    const online = onlineChecks.filter(c => c.status.isLive);
    const offline = onlineChecks.filter(c => !c.status.isLive);
    
    const embed = new EmbedBuilder()
      .setColor(0x667eea)
      .setTitle('📺 CrossTalk Streamers')
      .setTimestamp();
    
    if (online.length > 0) {
      const onlineList = online.map(c => 
        `🟢 **${c.streamer.username}** - ${c.status.viewers || 0} viewers\n${c.status.title || 'No title'}`
      ).join('\n\n');
      embed.addFields({ name: 'LIVE NOW', value: onlineList });
    }
    
    if (offline.length > 0) {
      const offlineList = offline.map(c => `⚫ ${c.streamer.username}`).join('\n');
      embed.addFields({ name: 'Offline', value: offlineList });
    }
    
    await message.reply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error fetching streamers:', error);
    await message.reply('❌ Error fetching streamer status');
  }
}

async function handleStreamersCommand(message: any) {
  try {
    const response = await axios.get(`${KICK_API_URL}/api/streamers`);
    const streamers = response.data;
    
    if (streamers.length === 0) {
      await message.reply('❌ No streamers registered yet.');
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x667eea)
      .setTitle('🎮 CrossTalk Streamers')
      .setDescription('Send messages to any of these streamers using `!kick message <streamer> <message>`')
      .setTimestamp();
    
    const streamerList = streamers.map((s: any) => 
      `• **${s.username}** - \`!kick message ${s.channel_name} <msg>\`\n  🔗 https://kick.com/${s.channel_name}`
    ).join('\n\n');
    
    embed.addFields({ name: 'Available Streamers', value: streamerList });
    
    await message.reply({ embeds: [embed] });
  } catch (error: any) {
    console.error('Error fetching streamers:', error);
    await message.reply('❌ Error fetching streamers');
  }
}

async function handleSetupWebhookCommand(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick setupwebhook"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick setupwebhook <webhook_url>`\n\n**How to get a webhook URL:**\n1. Right-click this channel → **Edit Channel**\n2. Go to **Integrations** → **Webhooks**\n3. Click **New Webhook** or **Create Webhook**\n4. Copy the **Webhook URL**\n5. Run: `!kick setupwebhook <paste_url_here>`\n\n**Why?** This allows Kick streamers to send replies back to this Discord channel!');
    return;
  }
  
  const webhookUrl = parts[0];
  
  // Validate webhook URL
  if (!webhookUrl.startsWith('https://discord.com/api/webhooks/') && !webhookUrl.startsWith('https://discordapp.com/api/webhooks/')) {
    await message.reply('❌ Invalid webhook URL! It should start with `https://discord.com/api/webhooks/` or `https://discordapp.com/api/webhooks/`');
    return;
  }
  
  try {
    // Save webhook to database
    await db.saveWebhook(message.channel.id, webhookUrl, message.guild?.id || '');
    
    await message.reply('✅ **Webhook set up successfully!**\n\nKick streamers can now reply to your messages in this channel using `!reply` or `!respond` commands.');
  } catch (error: any) {
    console.error('Error saving webhook:', error);
    await message.reply(`❌ Error saving webhook: ${error.message}`);
  }
}

async function handleRemoveWebhookCommand(message: any) {
  try {
    const existing = await db.getWebhook(message.channel.id);
    
    if (!existing) {
      await message.reply('❌ No webhook set up for this channel.');
      return;
    }
    
    await db.removeWebhook(message.channel.id);
    await message.reply('✅ Webhook removed from this channel. Kick streamers can no longer send replies here.');
  } catch (error: any) {
    console.error('Error removing webhook:', error);
    await message.reply(`❌ Error removing webhook: ${error.message}`);
  }
}

async function handleHelpCommand(message: any) {
  const embed = new EmbedBuilder()
    .setColor(0x667eea)
    .setTitle('🤖 CrossTalk Discord Bot - Commands')
    .setDescription('Connect Discord with Kick streamers!')
    .addFields(
      {
        name: '💬 Messaging',
        value: '`!kick message <streamer> <msg>` - Send message to Kick streamer\n`!kick online` - See who\'s live\n`!kick streamers` - List all streamers',
      },
      {
        name: '⚙️ Webhook Setup (Required for Replies)',
        value: '`!kick setupwebhook <url>` - Set up webhook for receiving replies\n`!kick removewebhook` - Remove webhook',
      },
      {
        name: '📺 Watch Parties (Notifications)',
        value: '`!kick watch <streamer>` - Get notified when streamer goes live\n`!kick unwatch` - Stop watching',
      },
      {
        name: '🎵 Voice Streaming (NEW!)',
        value: '`!kick stream <streamer>` - Stream Kick audio to your voice channel\n`!kick stopstream` - Stop streaming\n`!kick streams` - Show active streams',
      },
      {
        name: '❓ Help',
        value: '`!kick help` - Show this help message',
      }
    )
    .setFooter({ text: 'CrossTalk - Connecting communities across platforms' })
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

async function checkStreamerLive(channelName: string): Promise<any> {
  try {
    const response = await axios.get(`https://kick.com/api/v2/channels/${channelName}`);
    const data = response.data;
    const livestream = data.livestream;
    
    if (livestream && livestream.is_live) {
      return {
        isLive: true,
        title: livestream.session_title,
        viewers: livestream.viewer_count,
        thumbnail: livestream.thumbnail?.url,
      };
    }
    
    return { isLive: false };
  } catch (error) {
    return { isLive: false };
  }
}

async function checkLiveStreams() {
  for (const [channelId, kickChannelName] of watchParties.entries()) {
    try {
      const status = await checkStreamerLive(kickChannelName);
      
      // Check if we've already notified for this stream session
      const lastNotified = await db.getLastNotification(channelId, kickChannelName);
      
      if (status.isLive && (!lastNotified || Date.now() - lastNotified > 3600000)) {
        // Stream is live and we haven't notified in the last hour
        const channel = await client.channels.fetch(channelId) as TextChannel;
        
        if (channel && channel.type === ChannelType.GuildText) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setTitle(`🔴 ${kickChannelName} is now LIVE!`)
            .setDescription(status.title || 'No title')
            .setURL(`https://kick.com/${kickChannelName}`)
            .addFields(
              { name: '👥 Viewers', value: status.viewers?.toString() || '0', inline: true }
            )
            .setImage(status.thumbnail)
            .setTimestamp();
          
          await channel.send({ content: '@everyone', embeds: [embed] });
          await db.saveNotification(channelId, kickChannelName);
        }
      }
    } catch (error) {
      console.error(`Error checking stream for ${kickChannelName}:`, error);
    }
  }
}

// VOICE STREAMING COMMANDS
async function handleStreamCommand(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick stream"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick stream <streamer>`\nExample: `!kick stream realglitchdyeet`\n\n⚠️ **Note:** You must be in a voice channel first!');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  
  // Check if user is in a voice channel
  const member = message.member;
  if (!member?.voice.channel) {
    await message.reply('❌ You must join a voice channel first before I can stream!');
    return;
  }
  
  const voiceChannel = member.voice.channel as VoiceChannel;
  
  await message.reply(`🎬 Starting stream of **${streamerName}**...\n\n⏳ Connecting to Kick stream (this may take 5-10 seconds)...`);
  
  try {
    const result = await streamManager.startWatchParty(
      streamerName,
      voiceChannel,
      message.channel as TextChannel
    );
    
    // Result is already sent by StreamManager to the channel
    console.log(`Stream result: ${result}`);
  } catch (error: any) {
    console.error('Stream command error:', error);
    await message.reply(`❌ Error starting stream: ${error.message}`);
  }
}

async function handleStopStreamCommand(message: any) {
  const guildId = message.guild?.id;
  
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  try {
    const result = await streamManager.stopWatchParty(guildId);
    await message.reply(result);
  } catch (error: any) {
    console.error('Stop stream error:', error);
    await message.reply(`❌ Error stopping stream: ${error.message}`);
  }
}

async function handleActiveStreamsCommand(message: any) {
  const guildId = message.guild?.id;
  
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  const activeStreams = streamManager.getActiveStreams(guildId);
  
  if (activeStreams.length === 0) {
    await message.reply('📺 No active streams in this server right now.');
    return;
  }
  
  const embed = new EmbedBuilder()
    .setColor(0x667eea)
    .setTitle('📺 Active Watch Parties')
    .setDescription(
      activeStreams.map(s => 
        `🔴 **${s.streamerName}** streaming in <#${s.voiceChannelId}>\n🔗 ${s.kickStreamUrl}`
      ).join('\n\n')
    )
    .setTimestamp();
  
  await message.reply({ embeds: [embed] });
}

// Handle incoming responses from Kick streamers
export async function handleKickResponse(data: any) {
  try {
    // Find the Discord channel that sent the original message
    const originalMessage = await db.getOriginalMessage(data.request_id);
    
    if (originalMessage) {
      const channel = await client.channels.fetch(originalMessage.discord_channel_id) as TextChannel;
      
      if (channel && channel.type === ChannelType.GuildText) {
        const embed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle(`💬 Response from ${data.streamer_name}`)
          .setDescription(data.message)
          .setFooter({ text: `From Kick.com/${data.streamer_channel}` })
          .setTimestamp();
        
        await channel.send({ content: `<@${originalMessage.discord_user_id}>`, embeds: [embed] });
      }
    }
  } catch (error) {
    console.error('Error handling Kick response:', error);
  }
}

client.login(process.env.DISCORD_BOT_TOKEN);
