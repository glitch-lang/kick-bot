# Discord Activity Setup Guide

## Overview
This guide will help you convert the Kick watch party into a Discord Activity that can be launched from voice channels.

## Step 1: Discord Developer Portal Setup

1. Go to https://discord.com/developers/applications
2. Select your application (or create a new one)
3. Go to **Activities** section in the left sidebar
4. Click **Enable Activities**

## Step 2: Configure URL Mappings

In the Activities section, you need to configure URL mappings:

### URL Mappings Configuration:
```
Target: /
Prefix: /
```

This tells Discord to proxy your watch party URL through their CDN.

### Important URLs:
- **Development URL**: `http://localhost:3001` (for testing)
- **Production URL**: Your Railway URL (e.g., `https://your-discord-bot.up.railway.app`)

## Step 3: Set Activity Metadata

In the Activities section, configure:

- **Activity Name**: "Kick Watch Party"
- **Description**: "Watch and chat with Kick streamers together!"
- **Application ID**: Copy this - you'll need it for launching

## Step 4: Environment Variables

Add to your `.env` file:

```env
# Discord Activity Configuration
DISCORD_ACTIVITY_ID=your_activity_id_here
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

## Step 5: Invite Permissions

Your Discord bot needs the following permissions to create Activity invites:
- `CREATE_INSTANT_INVITE` (Create Invite)
- Permission value: `1` (or include in your OAuth2 URL)

## Step 6: Testing

### Local Testing:
1. Use localtunnel or ngrok to expose localhost:3001
2. Set the tunnel URL in Discord Developer Portal under Activities
3. Join a voice channel in Discord
4. Use command: `/watchparty <streamer>` with Activity enabled
5. Discord will show an "Open in Discord" button

### Production:
1. Deploy to Railway
2. Update Activity URL mapping to your Railway URL
3. Publish your Activity (may require Discord approval)

## How Activities Work

1. User joins voice channel in Discord
2. User runs `/watchparty <streamer>` command
3. Bot creates an Activity invite with target application ID
4. Discord shows "Start Activity" button
5. When clicked, Discord loads your watch-party in an iframe
6. The iframe uses Discord Embedded SDK to communicate with Discord
7. Multiple users can join the same Activity instance

## Launching Activities (from Bot)

```typescript
// Create invite with Activity target
const invite = await voiceChannel.createInvite({
  targetType: InviteTargetType.EmbeddedApplication,
  targetApplication: process.env.DISCORD_ACTIVITY_ID,
  maxAge: 0, // Never expires
  maxUses: 0  // Unlimited uses
});

// Send invite link
await interaction.reply({
  content: `🎬 Click to start watch party: ${invite.url}`,
  ephemeral: true
});
```

## Benefits of Activities

✅ Native Discord integration - no external browser needed
✅ Better permissions - activities run in trusted iframe
✅ Synchronized experience - all users see the same thing
✅ Persistent across voice channel sessions
✅ Can access Discord user info via SDK

## Next Steps

Once setup is complete:
1. Test locally with tunnel
2. Update production environment variables
3. Deploy to Railway
4. Test in production
5. Submit for Activity approval (optional, for public directory)

## Troubleshooting

### Activity won't load:
- Check URL mappings are correct
- Verify CSP headers allow Discord domains
- Check browser console for errors

### Can't create invite:
- Verify bot has CREATE_INSTANT_INVITE permission
- Check DISCORD_ACTIVITY_ID is correct
- Ensure Activity is enabled in Developer Portal

### Users see blank screen:
- Check Discord SDK initialization
- Verify parent domain is allowed in iframe
- Check for JavaScript errors in console
