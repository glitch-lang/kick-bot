# CrossTalk Discord Bot

Connect your Discord server with Kick streamers!

## Features

### 💬 Cross-Platform Messaging
- Send messages from Discord to Kick streamers
- Receive responses from streamers in Discord
- Works even when streamers are offline

### 📺 Stream Watch Parties
- Watch specific Kick streams in Discord channels
- Get notified when streamers go live
- Multiple channels can watch different streams
- Automatic stream embeds with viewer count

### 🔔 Live Notifications
- @everyone ping when watched streamer goes live
- Rich embeds with stream title, viewer count, and thumbnail
- Smart notification system (won't spam every minute)

## Setup

### 1. Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Go to "Bot" tab
4. Click "Add Bot"
5. Copy the **Bot Token**
6. Enable these intents:
   - ✅ Message Content Intent
   - ✅ Server Members Intent (optional)

### 2. Get Client ID

1. In your application page, go to "OAuth2"
2. Copy the **Client ID**

### 3. Invite Bot to Server

Use this URL (replace `YOUR_CLIENT_ID`):
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=2147746816&scope=bot
```

**Permissions included:**
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Add Reactions
- Mention @everyone (for stream notifications)

### 4. Configure Bot

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your tokens:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   KICK_BOT_API_URL=https://web-production-56232.up.railway.app
   ```

### 5. Install and Run

```bash
# Install dependencies
npm install

# Build
npm run build

# Start bot
npm start
```

Or for development:
```bash
npm run dev
```

## Commands

### Messaging Commands

**Send message to Kick streamer:**
```
!kick message <streamer> <your message>
```
Example: `!kick message jerzy Hey, love your content!`

**See who's live:**
```
!kick online
```

**List all streamers:**
```
!kick streamers
```

### Watch Party Commands

**Watch a streamer in this channel:**
```
!kick watch <streamer>
```
Example: `!kick watch jerzy`

- Bot will notify when they go live
- Shows rich embed with stream info
- Multiple Discord channels can watch different streamers

**Stop watching:**
```
!kick unwatch
```

### Help

**Show all commands:**
```
!kick help
```

## Usage Examples

### Example 1: Send Message to Streamer

**Discord User:**
```
!kick message realglitchdyeet Hey! When's your next stream?
```

**Bot Response:**
```
✅ Message sent to realglitchdyeet on Kick! They can respond with !reply
```

**In Kick Chat (realglitchdyeet's chat):**
```
📨 Message from @DiscordUser (discord): "Hey! When's your next stream?" 
| ID: 15 | Reply: !respond 15 <message> OR !reply <message>
```

**Streamer Responds in Kick:**
```
!reply Tomorrow at 8pm EST!
```

**Back in Discord:**
```
💬 Response from realglitchdyeet
Tomorrow at 8pm EST!
```

### Example 2: Watch Party

**Setup:**
```
!kick watch jerzy
```

**Bot Response:**
```
📺 Now watching jerzy - I'll notify this channel when they go live!
🔗 https://kick.com/jerzy
```

**When Jerzy Goes Live:**
```
@everyone

🔴 jerzy is now LIVE!
Crazy speedrun attempts! | 👥 Viewers: 245

🔗 https://kick.com/jerzy
```

## Architecture

### How It Works

```
Discord User
    ↓
Discord Bot (this)
    ↓
Kick Bot API (https://web-production-56232.up.railway.app)
    ↓
Kick Chat
```

### Responses Flow

```
Kick Streamer types !reply
    ↓
Kick Bot processes
    ↓
Sends to Discord Bot API
    ↓
Discord Bot sends embed to channel
    ↓
Discord User sees response
```

### Watch Parties

- Each Discord channel can watch ONE Kick streamer
- Bot checks every minute if watched streamers are live
- Sends notification with @everyone ping
- Won't spam (max 1 notification per hour per stream session)
- Multiple Discord channels can watch different streamers simultaneously

## Minimal Permissions

The bot only needs these permissions:
- ✅ Send Messages
- ✅ Embed Links
- ✅ Mention @everyone (for stream notifications)

**Does NOT need:**
- ❌ Administrator
- ❌ Manage Server
- ❌ Manage Channels
- ❌ Kick Members
- ❌ Ban Members

## Deployment

### Railway (Recommended)

1. Create new Railway project
2. Add environment variables
3. Deploy from GitHub
4. Bot will run 24/7

### Local/VPS

```bash
npm run build
npm start
```

Keep running with PM2:
```bash
npm install -g pm2
pm2 start dist/index.js --name crosstalk-discord
pm2 save
```

## Troubleshooting

### Bot doesn't respond to commands

- Make sure "Message Content Intent" is enabled in Discord Developer Portal
- Check bot has permission to send messages in the channel
- Verify bot is online (`!kick help` should work)

### Stream notifications not working

- Check bot has permission to mention @everyone
- Verify streamer is registered in CrossTalk
- Bot checks every minute, so there may be a small delay

### Messages not reaching Kick

- Verify Kick Bot API URL is correct
- Check Kick bot is online and registered
- Make sure streamer has registered with !setupchat

## Support

For issues:
1. Check bot logs
2. Verify environment variables
3. Test Kick bot API directly
4. Check Discord bot permissions

## Future Features

- [ ] Stream clips in Discord
- [ ] VOD links when stream ends
- [ ] Custom notification messages
- [ ] Stream schedules
- [ ] Multi-stream watching in one channel
- [ ] Stream analytics/stats
