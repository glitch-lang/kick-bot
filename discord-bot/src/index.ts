import { Client, GatewayIntentBits, EmbedBuilder, ChannelType, TextChannel, VoiceChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
import localtunnel from 'localtunnel';
import { Database } from './database';
import { StreamManager } from './stream-manager';
import { BrowserStreamManager } from './browser-stream-manager';
import { WatchPartyServer } from './watch-party-server';
import { AuthManager } from './auth-manager';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// Initialize database
const db = new Database();

const KICK_API_URL = process.env.KICK_BOT_API_URL || 'https://web-production-56232.up.railway.app';
let PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:3001';
const ENABLE_TUNNEL = process.env.ENABLE_TUNNEL === 'true' || false;

// Initialize AuthManager for Discord username tokens
const DISCORD_TOKEN_KEY = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const discordAuthManager = new AuthManager(DISCORD_TOKEN_KEY);

// Initialize StreamManager for voice streaming
const streamManager = new StreamManager(KICK_API_URL);
const browserStreamManager = new BrowserStreamManager();

// Use Railway's dynamic port or default to 3001 for local
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize Watch Party Server with optional OAuth
let watchPartyServer: WatchPartyServer;
if (process.env.KICK_OAUTH_CLIENT_ID && process.env.KICK_OAUTH_CLIENT_SECRET && 
    process.env.SESSION_SECRET && process.env.ENCRYPTION_KEY) {
  // OAuth enabled
  watchPartyServer = new WatchPartyServer(PORT, KICK_API_URL, db, {
    clientId: process.env.KICK_OAUTH_CLIENT_ID,
    clientSecret: process.env.KICK_OAUTH_CLIENT_SECRET,
    redirectUri: process.env.KICK_OAUTH_REDIRECT_URI || `${PUBLIC_URL}/auth/callback`,
    sessionSecret: process.env.SESSION_SECRET,
    encryptionKey: process.env.ENCRYPTION_KEY
  }, discordAuthManager);
} else {
  // OAuth disabled
  watchPartyServer = new WatchPartyServer(PORT, KICK_API_URL, undefined, undefined, discordAuthManager);
  console.log('ℹ️  OAuth login disabled (set KICK_OAUTH_* env vars to enable)');
}

// Start LocalTunnel if enabled
async function startTunnel() {
  if (!ENABLE_TUNNEL) {
    console.log('🌐 LocalTunnel disabled (set ENABLE_TUNNEL=true in .env to enable)');
    return;
  }

  try {
    console.log('🌐 Starting LocalTunnel for public access...');
    const tunnel = await localtunnel({ 
      port: PORT,
      subdomain: process.env.TUNNEL_SUBDOMAIN || undefined
    });

    PUBLIC_URL = tunnel.url;
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 PUBLIC URL ACTIVE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`   🔗 Your watch parties are now public at:`);
    console.log(`   ${PUBLIC_URL}`);
    console.log('');
    console.log(`   Share this URL with anyone in the world! 🌍`);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');

    // Update OAuth redirect URI if OAuth is enabled
    if (watchPartyServer && process.env.KICK_OAUTH_CLIENT_ID) {
      console.log(`ℹ️  OAuth redirect URI: ${PUBLIC_URL}/auth/callback`);
      console.log(`   (Update this in Kick Developer Portal if needed)`);
      console.log('');
    }

    tunnel.on('close', () => {
      console.log('⚠️  LocalTunnel closed. Restarting...');
      setTimeout(startTunnel, 5000);
    });

    tunnel.on('error', (err: Error) => {
      console.error('❌ LocalTunnel error:', err.message);
      console.log('   Retrying in 5 seconds...');
      setTimeout(startTunnel, 5000);
    });

  } catch (error: any) {
    console.error('❌ Failed to start LocalTunnel:', error.message);
    console.log('   Using local URL instead: http://localhost:3001');
    console.log('   To fix: npm install -g localtunnel');
  }
}

// Start tunnel after a short delay (let watch party server start first)
setTimeout(startTunnel, 2000);

const activeWatchParties = new Map<string, string>(); // channelId -> partyId
const autoWatchPartyChannels = new Map<string, Set<string>>(); // guildId -> Set<streamerNames>

// Track which Discord channels are watching which Kick streams
const watchParties = new Map<string, string>(); // channelId -> kickChannelName
const liveStreamers = new Set<string>(); // Track which streamers are currently live

// Check if streamers are live and auto-create watch parties
async function checkLiveStreamers() {
  try {
    const autoParties = await db.getAllAutoWatchPartyStreamers();
    if (autoParties.length === 0) return;
    
    console.log(`🔍 Checking ${autoParties.length} auto watch party configurations...`);
    
    for (const ap of autoParties) {
      try {
        // Check if streamer is live
        const response = await axios.get(`${KICK_API_URL}/api/kick/streamer/${ap.streamer_name}`);
        const streamData = response.data;
        
        const isLive = streamData.is_live === true;
        const wasLive = liveStreamers.has(ap.streamer_name);
        
        // If streamer just went live (transition from offline to live)
        if (isLive && !wasLive) {
          liveStreamers.add(ap.streamer_name);
          console.log(`🟢 ${ap.streamer_name} went live! Creating auto watch party...`);
          
          // Check if party already exists for this channel
          if (activeWatchParties.has(ap.discord_channel_id)) {
            console.log(`⏭️ Watch party already active in channel ${ap.discord_channel_id}, skipping`);
            continue;
          }
          
          // Create watch party
          const partyId = watchPartyServer.createWatchParty(
            ap.streamer_name,
            ap.guild_id,
            'Discord Server', // We don't have guild name here easily
            ap.auto_relay
          );
          
          activeWatchParties.set(ap.discord_channel_id, partyId);
          
          // Save settings
          await db.saveWatchPartySettings(partyId, {
            relay_to_kick: ap.auto_relay,
            two_way_chat: true,
            streamer_name: ap.streamer_name
          });
          
          // Get watch party URL
          const partyUrl = `${PUBLIC_URL}/party/${partyId}`;
          
          // Post to Discord channel
          const channel = await client.channels.fetch(ap.discord_channel_id) as TextChannel;
          if (channel) {
            const embed = new EmbedBuilder()
              .setColor(0x53fc18)
              .setTitle(`🔴 ${ap.streamer_name} is now LIVE!`)
              .setDescription(
                `**Watch Party Auto-Created!**\n\n` +
                `🔗 **Join here:** ${partyUrl}\n\n` +
                `**Stream Info:**\n` +
                `📺 **Title:** ${streamData.session_title || 'Live Stream'}\n` +
                `🎮 **Category:** ${streamData.category || 'Gaming'}\n` +
                `👥 **Viewers:** ${streamData.viewer_count || 0}\n\n` +
                `${ap.auto_relay ? '📤 Kick chat relay is **ENABLED** ✅\n' : ''}` +
                `**Features:**\n` +
                `🎥 Synchronized video + audio\n` +
                `💬 Shared chat\n` +
                `👥 See who's watching`
              )
              .setThumbnail(streamData.thumbnail || `https://kick.com/${ap.streamer_name}/thumb.jpg`)
              .addFields({
                name: '📺 Watch on Kick',
                value: `https://kick.com/${ap.streamer_name}`,
                inline: false
              })
              .setFooter({ text: 'Auto-created watch party • Use !kick endparty to end' })
              .setTimestamp();
            
            await channel.send({ content: '@here', embeds: [embed] });
            console.log(`✅ Posted watch party for ${ap.streamer_name} in channel ${ap.discord_channel_id}`);
          }
        }
        
        // If streamer went offline
        if (!isLive && wasLive) {
          liveStreamers.delete(ap.streamer_name);
          console.log(`🔴 ${ap.streamer_name} went offline`);
        }
        
      } catch (error: any) {
        // Silently skip errors for individual streamers
        if (error.response?.status !== 404) {
          console.error(`Error checking ${ap.streamer_name}:`, error.message);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in checkLiveStreamers:', error);
  }
}

client.once('ready', async () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`);
  console.log(`📡 Connected to ${client.guilds.cache.size} servers`);
  
  // Start watch party server
  await watchPartyServer.start();
  
  // Load watch parties from database
  db.loadWatchParties().then(parties => {
    parties.forEach(party => {
      watchParties.set(party.discord_channel_id, party.kick_channel_name);
    });
    console.log(`📺 Loaded ${watchParties.size} watch parties`);
  });
  
  // Load auto watch parties from database
  db.getAllAutoWatchPartyStreamers().then(autoParties => {
    autoParties.forEach(ap => {
      if (!autoWatchPartyChannels.has(ap.guild_id)) {
        autoWatchPartyChannels.set(ap.guild_id, new Set());
      }
      autoWatchPartyChannels.get(ap.guild_id)!.add(ap.streamer_name);
    });
    console.log(`🤖 Loaded ${autoParties.length} auto watch party configurations`);
  });
  
  // Start checking for live streamers (every 2 minutes)
  setInterval(checkLiveStreamers, 120000);
  console.log('🔍 Started live streamer checker (every 2 minutes)');
  
  // Also check immediately on startup
  setTimeout(checkLiveStreamers, 10000); // Wait 10s after startup
  
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
  
  // Command: !kick browserstream <streamer> (browser-based streaming)
  if (content.startsWith('!kick browserstream ')) {
    await handleBrowserStreamCommand(message);
    return;
  }
  
  // Command: !kick watchparty <streamer> (web-based watch party)
  if (content.startsWith('!kick watchparty ')) {
    await handleWatchPartyCommand(message);
    return;
  }
  
  // Command: !kick endparty (end watch party)
  if (content.startsWith('!kick endparty')) {
    await handleEndPartyCommand(message);
    return;
  }
  
  // Command: !kick relayon (enable kick chat relay for watch party)
  if (content.startsWith('!kick relayon')) {
    await handleRelayToggleCommand(message, true);
    return;
  }
  
  // Command: !kick relayoff (disable kick chat relay for watch party)
  if (content.startsWith('!kick relayoff')) {
    await handleRelayToggleCommand(message, false);
    return;
  }
  
  // Command: !kick autoparty add <streamer> (auto-create watch party when streamer goes live)
  if (content.startsWith('!kick autoparty add ')) {
    await handleAutoPartyAddCommand(message);
    return;
  }
  
  // Command: !kick autoparty remove <streamer>
  if (content.startsWith('!kick autoparty remove ')) {
    await handleAutoPartyRemoveCommand(message);
    return;
  }
  
  // Command: !kick autoparty list
  if (content.startsWith('!kick autoparty list') || content.startsWith('!kick autoparty')) {
    await handleAutoPartyListCommand(message);
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

// Handle button interactions
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  if (interaction.customId.startsWith('join_party_')) {
    const partyId = interaction.customId.replace('join_party_', '');
    const username = interaction.user.username;
    const userId = interaction.user.id;

    // Generate signed token with Discord info
    const token = discordAuthManager.generateDiscordToken(username, userId);
    const personalUrl = `${PUBLIC_URL}/party/${partyId}?discord=${token}`;

    try {
      // Send DM with personal link
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setColor(0x9147ff)
            .setTitle('🎫 Your Personal Watch Party Link')
            .setDescription(
              `Hey ${username}! Here's your personal link:\n\n` +
              `🔗 ${personalUrl}\n\n` +
              `**What's special about this link:**\n` +
              `✅ Your Discord username is auto-filled\n` +
              `✅ Ready to chat instantly\n` +
              `✅ Secure and signed just for you\n\n` +
              `**This link expires in 24 hours**`
            )
            .setTimestamp()
        ]
      });

      // Acknowledge the button click
      await interaction.reply({
        content: '✅ Check your DMs! I sent you a personal link with your username pre-filled.',
        ephemeral: true
      });

      console.log(`🎫 Generated personal link for ${username} (${userId}) - party ${partyId}`);

    } catch (error) {
      console.error('Error sending personal link:', error);
      await interaction.reply({
        content: '❌ Could not send DM. Please make sure your DMs are open!\n\n' +
                 `You can still use the public link: ${PUBLIC_URL}/party/${partyId}`,
        ephemeral: true
      });
    }
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
      discord_user_id: message.author.id, // Send the user ID for proper @mentions
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
        name: '🎵 Voice Streaming',
        value: '`!kick stream <streamer>` - Fast streaming (optimized)\n`!kick browserstream <streamer>` - Browser mode (more reliable)\n`!kick stopstream` - Stop streaming\n`!kick streams` - Show active streams',
      },
      {
        name: '🎬 Watch Party',
        value: '`!kick watchparty <streamer> [relay]` - Create web watch party (two-way chat included)\n`!kick relayon` - Enable Kick chat relay\n`!kick relayoff` - Disable Kick chat relay\n`!kick endparty` - End watch party',
      },
      {
        name: '🤖 Auto Watch Party (NEW!)',
        value: '`!kick autoparty add <streamer> [relay]` - Auto-create when live\n`!kick autoparty remove <streamer>` - Remove auto-create\n`!kick autoparty list` - List all auto watch parties',
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
    await message.reply('❌ Usage: `!kick stream <streamer>`\nExample: `!kick stream realglitchdyeet`\n\n⚠️ **Note:** You must be in a voice channel first!\n\n💡 **Tip:** Try `!kick browserstream <streamer>` for more reliable streaming!');
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
  
  await message.reply(`🎬 Starting stream of **${streamerName}** (Fast Mode)...\n\n⏳ Connecting to Kick stream (optimized for low latency)...`);
  
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

async function handleBrowserStreamCommand(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick browserstream"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick browserstream <streamer>`\nExample: `!kick browserstream realglitchdyeet`\n\n🌐 **Browser Mode:** Opens a real browser and captures the stream (more reliable but slower)');
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
  
  try {
    const result = await browserStreamManager.startBrowserStream(
      streamerName,
      voiceChannel,
      message.channel as TextChannel
    );
    
    console.log(`Browser stream result: ${result}`);
  } catch (error: any) {
    console.error('Browser stream command error:', error);
    await message.reply(`❌ Error starting browser stream: ${error.message}`);
  }
}

async function handleStopStreamCommand(message: any) {
  const guildId = message.guild?.id;
  
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  try {
    // Try stopping both types of streams
    const normalResult = await streamManager.stopWatchParty(guildId);
    const browserResult = await browserStreamManager.stopBrowserStream(guildId);
    
    // Combine results
    if (normalResult.includes('No active') && browserResult.includes('No active')) {
      await message.reply('❌ No active streams in this server!');
    } else {
      const messages = [];
      if (!normalResult.includes('No active')) messages.push(normalResult);
      if (!browserResult.includes('No active')) messages.push(browserResult);
      await message.reply(messages.join('\n'));
    }
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

// WATCH PARTY COMMANDS
async function handleWatchPartyCommand(message: any) {
  const parts = message.content.split(' ').slice(2); // Remove "!kick watchparty"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick watchparty <streamer> [relay]`\nExample: `!kick watchparty bbjess`\nExample with relay: `!kick watchparty bbjess relay`\n\n🎬 Creates a synchronized web watch party with video, audio, and chat!\n📤 Add `relay` to send watch party messages to Kick chat!');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  const relayEnabled = parts[1]?.toLowerCase() === 'relay';
  const guildId = message.guild?.id;
  const channelId = message.channel?.id;
  
  if (!guildId || !channelId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  // Check if party already exists for this channel
  if (activeWatchParties.has(channelId)) {
    await message.reply('❌ A watch party is already active in this channel! Use `!kick endparty` to end it first.');
    return;
  }
  
  try {
    // Create watch party
    const partyId = watchPartyServer.createWatchParty(
      streamerName,
      guildId,
      message.guild?.name || 'Discord Server',
      relayEnabled
    );
    
    activeWatchParties.set(channelId, partyId);
    
    // Save settings to database
    await db.saveWatchPartySettings(partyId, {
      relay_to_kick: relayEnabled,
      two_way_chat: true, // Always enable two-way chat for now
      streamer_name: streamerName
    });
    
    // Get watch party URL
    const partyUrl = `${PUBLIC_URL}/party/${partyId}`;
    
    // Create button for personalized link
    const button = new ButtonBuilder()
      .setCustomId(`join_party_${partyId}`)
      .setLabel('🎫 Get Your Personal Link')
      .setStyle(ButtonStyle.Primary);
    
    const row = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(button);
    
    // Send embed with link
    const embed = new EmbedBuilder()
      .setColor(0x9147ff)
      .setTitle(`🎬 Watch Party Created: ${streamerName}`)
      .setDescription(
        `**Your synchronized watch party is ready!**\n\n` +
        `🔗 **Public Link:** ${partyUrl}\n` +
        `🎫 **Or click button below** for a personal link with your Discord username auto-filled!\n\n` +
        `**Features:**\n` +
        `🎥 Live Kick stream (video + audio)\n` +
        `💬 Shared chat with Discord\n` +
        `👥 See who's watching\n` +
        `🔄 Perfect synchronization\n` +
        `${relayEnabled ? '📤 **Messages relay to Kick chat** ✅\n' : ''}`
      )
      .addFields({
        name: '📺 Direct Kick Link',
        value: `https://kick.com/${streamerName}`,
        inline: false
      })
      .setFooter({ text: relayEnabled ? 'Use !kick relayoff to disable Kick relay • !kick endparty to end' : 'Use !kick relayon to relay messages to Kick • !kick endparty to end' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed], components: [row] });
    
    console.log(`🎬 Created watch party ${partyId} for ${streamerName} in ${message.guild?.name} (relay: ${relayEnabled})`);
    
  } catch (error: any) {
    console.error('Error creating watch party:', error);
    await message.reply(`❌ Failed to create watch party: ${error.message}`);
  }
}

async function handleEndPartyCommand(message: any) {
  const channelId = message.channel?.id;
  
  if (!channelId) {
    await message.reply('❌ Could not identify channel!');
    return;
  }
  
  const partyId = activeWatchParties.get(channelId);
  
  if (!partyId) {
    await message.reply('❌ No active watch party in this channel!');
    return;
  }
  
  try {
    watchPartyServer.deleteWatchParty(partyId);
    activeWatchParties.delete(channelId);
    await db.deleteWatchPartySettings(partyId);
    
    await message.reply('✅ Watch party ended! Thanks for watching together! 🎬');
    console.log(`🛑 Ended watch party ${partyId}`);
    
  } catch (error: any) {
    console.error('Error ending watch party:', error);
    await message.reply(`❌ Failed to end watch party: ${error.message}`);
  }
}

async function handleRelayToggleCommand(message: any, enabled: boolean) {
  const channelId = message.channel?.id;
  
  if (!channelId) {
    await message.reply('❌ Could not identify channel!');
    return;
  }
  
  const partyId = activeWatchParties.get(channelId);
  
  if (!partyId) {
    await message.reply('❌ No active watch party in this channel! Create one with `!kick watchparty <streamer>`');
    return;
  }
  
  try {
    const success = watchPartyServer.setRelayToKick(partyId, enabled);
    
    if (!success) {
      await message.reply('❌ Watch party not found!');
      return;
    }
    
    // Update database
    await db.saveWatchPartySettings(partyId, { relay_to_kick: enabled });
    
    if (enabled) {
      await message.reply('✅ **Kick chat relay ENABLED!**\n\n📤 Messages sent in the watch party will now appear in the Kick streamer\'s chat with a `[Watch Party]` prefix.');
    } else {
      await message.reply('✅ **Kick chat relay DISABLED!**\n\n💬 Messages in the watch party will stay private (watch party only).');
    }
    
    console.log(`${enabled ? '✅' : '❌'} Relay ${enabled ? 'enabled' : 'disabled'} for party ${partyId}`);
    
  } catch (error: any) {
    console.error('Error toggling relay:', error);
    await message.reply(`❌ Failed to toggle relay: ${error.message}`);
  }
}

// AUTO WATCH PARTY COMMANDS
async function handleAutoPartyAddCommand(message: any) {
  const parts = message.content.split(' ').slice(3); // Remove "!kick autoparty add"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick autoparty add <streamer> [relay]`\nExample: `!kick autoparty add bbjess`\nExample with relay: `!kick autoparty add bbjess relay`\n\n🤖 Auto-creates a watch party when the streamer goes live!');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  const autoRelay = parts[1]?.toLowerCase() === 'relay';
  const guildId = message.guild?.id;
  const channelId = message.channel?.id;
  
  if (!guildId || !channelId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  try {
    await db.addAutoWatchParty(guildId, channelId, streamerName, autoRelay);
    
    // Add to memory map
    if (!autoWatchPartyChannels.has(guildId)) {
      autoWatchPartyChannels.set(guildId, new Set());
    }
    autoWatchPartyChannels.get(guildId)!.add(streamerName);
    
    await message.reply(
      `✅ **Auto Watch Party enabled for ${streamerName}!**\n\n` +
      `🤖 When ${streamerName} goes live, a watch party will automatically be created in this channel.\n` +
      `${autoRelay ? '📤 Kick relay will be enabled automatically.\n' : ''}` +
      `\n💡 Use \`!kick autoparty list\` to see all auto watch parties.`
    );
    
    console.log(`🤖 Auto watch party added: ${streamerName} in guild ${guildId} (relay: ${autoRelay})`);
    
  } catch (error: any) {
    console.error('Error adding auto watch party:', error);
    await message.reply(`❌ Failed to add auto watch party: ${error.message}`);
  }
}

async function handleAutoPartyRemoveCommand(message: any) {
  const parts = message.content.split(' ').slice(3); // Remove "!kick autoparty remove"
  
  if (parts.length === 0) {
    await message.reply('❌ Usage: `!kick autoparty remove <streamer>`\nExample: `!kick autoparty remove bbjess`');
    return;
  }
  
  const streamerName = parts[0].toLowerCase();
  const guildId = message.guild?.id;
  
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  try {
    await db.removeAutoWatchParty(guildId, streamerName);
    
    // Remove from memory map
    autoWatchPartyChannels.get(guildId)?.delete(streamerName);
    
    await message.reply(`✅ Auto watch party removed for **${streamerName}**.`);
    console.log(`🗑️ Auto watch party removed: ${streamerName} from guild ${guildId}`);
    
  } catch (error: any) {
    console.error('Error removing auto watch party:', error);
    await message.reply(`❌ Failed to remove auto watch party: ${error.message}`);
  }
}

async function handleAutoPartyListCommand(message: any) {
  const guildId = message.guild?.id;
  
  if (!guildId) {
    await message.reply('❌ This command can only be used in a server!');
    return;
  }
  
  try {
    const autoParties = await db.getAutoWatchParties(guildId);
    
    if (autoParties.length === 0) {
      await message.reply('ℹ️ No auto watch parties configured for this server.\n\nUse `!kick autoparty add <streamer>` to add one!');
      return;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x9147ff)
      .setTitle('🤖 Auto Watch Parties')
      .setDescription(
        `**${autoParties.length} streamer(s) configured:**\n\n` +
        autoParties.map((ap, i) => 
          `${i + 1}. **${ap.streamer_name}**\n` +
          `   Channel: <#${ap.discord_channel_id}>\n` +
          `   Relay: ${ap.auto_relay ? '✅ Enabled' : '❌ Disabled'}`
        ).join('\n\n')
      )
      .setFooter({ text: 'Watch parties will be created automatically when these streamers go live!' })
      .setTimestamp();
    
    await message.reply({ embeds: [embed] });
    
  } catch (error: any) {
    console.error('Error listing auto watch parties:', error);
    await message.reply(`❌ Failed to list auto watch parties: ${error.message}`);
  }
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

// Start the bot after database is ready
async function startBot() {
  try {
    console.log('⏳ Waiting for database to be ready...');
    await db.waitForReady();
    console.log('✅ Database ready, starting bot...');
    await client.login(process.env.DISCORD_BOT_TOKEN);
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
}

startBot();
