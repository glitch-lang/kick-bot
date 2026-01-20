# 🎮 CrossTalk Discord Integration Setup Guide

Connect your Discord server with Kick streamers for cross-platform communication and stream watching!

## 🌟 Features

### ✅ What You Can Do:

1. **Cross-Platform Messaging**
   - Discord users send messages to Kick streamers
   - Kick streamers reply directly to Discord users
   - Works even when streamers are offline

2. **Stream Watch Parties**
   - Set Discord channels to watch specific Kick streams
   - Get @everyone notifications when streams go live
   - Rich embeds with stream info, viewer count, thumbnails
   - Multiple channels can watch different streams simultaneously

3. **Live Status Tracking**
   - See which Kick streamers are currently live
   - View viewer counts and stream titles
   - Get instant updates when watched streams start

## 🚀 Quick Start (5 minutes)

### Step 1: Create Discord Bot

1. Go to https://discord.com/developers/applications
2. Click **"New Application"**
3. Give it a name (e.g., "CrossTalk Bot")
4. Go to **"Bot"** tab on the left
5. Click **"Add Bot"** → **"Yes, do it!"**
6. **Copy the Token** (you'll need this!)
   - Click "Reset Token" if needed
   - Click "Copy"
7. Enable **"Message Content Intent"**:
   - Scroll down to "Privileged Gateway Intents"
   - Toggle ON: **Message Content Intent**
   - Click "Save Changes"

### Step 2: Invite Bot to Your Server

1. Go to **"OAuth2"** → **"URL Generator"** tab
2. Select **Scopes**:
   - ✅ `bot`
3. Select **Bot Permissions**:
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Mention Everyone (for stream notifications)
4. **Copy the Generated URL** at the bottom
5. **Open URL in browser** and select your server
6. Click **"Authorize"**

### Step 3: Configure & Run Bot

1. **Navigate to discord-bot folder:**
   ```bash
   cd C:\Users\willc\kick-bot\discord-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create .env file:**
   ```bash
   copy .env.example .env
   ```

4. **Edit .env file** and add your token:
   ```env
   DISCORD_BOT_TOKEN=your_bot_token_here
   DISCORD_CLIENT_ID=your_client_id_here
   KICK_BOT_API_URL=https://web-production-56232.up.railway.app
   ```

5. **Build and start:**
   ```bash
   npm run build
   npm start
   ```

**✅ Bot is now online!** You should see:
```
✅ Discord bot logged in as CrossTalk Bot#1234
📡 Connected to 1 servers
```

---

## 📖 Usage Guide

### 💬 Sending Messages to Kick

**Command:**
```
!kick message <streamer> <your message>
```

**Example:**
```
!kick message realglitchdyeet Hey! When's your next stream?
```

**What Happens:**

1. **Discord (you see):**
   ```
   ✅ Message sent to realglitchdyeet on Kick! They can respond with !reply
   ```

2. **Kick Chat (streamer sees):**
   ```
   📨 Message from @YourDiscordName (Discord): "Hey! When's your next stream?" 
   | ID: 15 | Reply: !respond 15 <message> OR !reply <message>
   ```

3. **Streamer Responds (in Kick chat):**
   ```
   !reply Tomorrow at 8pm EST!
   ```

4. **Discord (you receive):**
   ```
   💬 Response from realglitchdyeet
   Tomorrow at 8pm EST!
   ```

---

### 📺 Watch Parties

**Start Watching a Stream:**
```
!kick watch <streamer>
```

**Example:**
```
!kick watch realglitchdyeet
```

**What Happens:**

1. **Immediate Response:**
   ```
   📺 Now watching realglitchdyeet - I'll notify this channel when they go live!
   🔗 https://kick.com/realglitchdyeet
   ```

2. **When Stream Goes Live (in your Discord channel):**
   ```
   @everyone

   🔴 realglitchdyeet is now LIVE!
   Amazing gameplay session!
   👥 Viewers: 342

   [Stream Thumbnail]
   🔗 https://kick.com/realglitchdyeet
   ```

**Stop Watching:**
```
!kick unwatch
```

**Notes:**
- Each Discord channel can watch ONE streamer
- Multiple Discord channels can watch DIFFERENT streamers
- Bot checks every minute for live status
- Won't spam (max 1 notification per hour)

---

### 📊 Other Commands

**See Who's Live:**
```
!kick online
```

Shows all registered Kick streamers with their live status, viewer counts, and stream titles.

**List All Streamers:**
```
!kick streamers
```

Shows all available streamers you can message or watch.

**Help:**
```
!kick help
```

Shows all available commands.

---

## 🏗️ Architecture

### How Messages Work:

```
┌─────────────┐         ┌──────────────┐         ┌──────────┐
│   Discord   │ ──────> │  Discord Bot │ ──────> │ Kick Bot │
│    User     │         │   (This!)    │         │   API    │
└─────────────┘         └──────────────┘         └──────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │   Kick   │
                                                  │   Chat   │
                                                  └──────────┘
```

### Response Flow:

```
Kick Streamer types !reply
       │
       ▼
   Kick Bot processes
       │
       ▼
   Sends to Discord via embed
       │
       ▼
   Discord User sees response
```

### Watch Party System:

```
Discord Bot checks every 60 seconds
       │
       ▼
   Is streamer live?
       │
   ┌───┴────┐
   │ YES    │ NO → Continue checking
   ▼        
Check last notification time
   │
   ▼
Send live notification with @everyone
   │
   ▼
Save notification time (prevents spam)
```

---

## 🎯 Use Cases

### Use Case 1: Community Manager

**Scenario:** You manage a Discord for multiple Kick streamers

```discord
User: !kick message jerzy Hey, we'd love to collab!
Bot: ✅ Message sent to jerzy on Kick!

[5 minutes later]
Bot: 💬 Response from jerzy
     Sounds great! DM me on Twitter @jerzystreams
```

### Use Case 2: Watch Party

**Scenario:** Your Discord wants to watch a specific streamer together

```discord
Mod: !kick watch realglitchdyeet
Bot: 📺 Now watching realglitchdyeet

[When stream starts]
Bot: @everyone 🔴 realglitchdyeet is now LIVE!
     [Stream embed with thumbnail and viewer count]

[Everyone clicks link and watches together]
```

### Use Case 3: Multi-Stream Community

**Scenario:** Different Discord channels watch different streamers

```discord
#watch-jerzy channel:
!kick watch jerzy

#watch-glitch channel:
!kick watch realglitchdyeet

#watch-another channel:
!kick watch anotherstreamer
```

Each channel gets notifications only for their watched streamer!

---

## 🛡️ Security & Permissions

### Minimal Permissions Required:

✅ **Needed:**
- Send Messages (to respond to commands)
- Embed Links (for rich stream embeds)
- Mention Everyone (for @everyone stream notifications)
- Read Message History (to see commands)

❌ **NOT Needed:**
- Administrator
- Manage Server
- Manage Channels
- Kick/Ban Members
- Manage Roles

**Why this is safe:**
- Bot only reads messages starting with `!kick`
- Cannot delete messages
- Cannot modify server settings
- Cannot kick/ban users
- Only sends notifications when streams go live

---

## 🚀 Deployment Options

### Option 1: Railway (Recommended for 24/7)

1. Create Railway account: https://railway.app
2. Create new project
3. Connect GitHub repo
4. Set environment variables
5. Deploy!

**Pros:** 24/7 uptime, auto-restarts, free tier available

### Option 2: Your Computer (Quick testing)

```bash
npm run dev
```

**Pros:** Free, instant testing
**Cons:** Bot offline when computer sleeps

### Option 3: VPS (Advanced)

Use PM2 for process management:
```bash
npm install -g pm2
npm run build
pm2 start dist/index.js --name crosstalk-discord
pm2 save
pm2 startup
```

---

## 🔧 Troubleshooting

### Bot doesn't respond to commands

**Check:**
- ✅ "Message Content Intent" enabled in Discord Developer Portal?
- ✅ Bot has "Send Messages" permission in the channel?
- ✅ Using correct prefix? (`!kick` not just `kick`)
- ✅ Bot is online? (green dot next to name)

**Fix:**
```bash
# Restart bot
npm start
```

### Watch notifications not working

**Check:**
- ✅ Bot has "Mention Everyone" permission?
- ✅ Streamer is registered in CrossTalk?
- ✅ Used correct streamer name in `!kick watch`?

**Note:** Bot checks every 60 seconds, so there may be up to 1 minute delay

### Messages not reaching Kick

**Check:**
- ✅ Kick bot is running on Railway?
- ✅ KICK_BOT_API_URL in .env is correct?
- ✅ Streamer has registered with `!setupchat` on Kick?

**Test API:**
```bash
curl https://web-production-56232.up.railway.app/api/streamers
```

Should show list of registered streamers.

---

## 📊 Stats & Monitoring

### Check Bot Status:

```discord
!kick help
```

If bot responds, it's working!

### Check Registered Streamers:

```discord
!kick streamers
```

Shows all available streamers.

### Check Live Streams:

```discord
!kick online
```

Shows who's currently streaming.

---

## 🎉 Success Checklist

- [ ] Discord bot created in Developer Portal
- [ ] Message Content Intent enabled
- [ ] Bot invited to Discord server
- [ ] .env file configured with token
- [ ] Bot running (`npm start`)
- [ ] Bot responds to `!kick help`
- [ ] Can send message with `!kick message`
- [ ] Can watch stream with `!kick watch`
- [ ] Receiving live notifications

---

## 💡 Tips & Best Practices

1. **Use dedicated channels for watch parties**
   - Create `#kick-streams` channel
   - Set it to watch your main streamer
   - Keeps notifications organized

2. **Test with offline streamer first**
   - Try `!kick message` to offline streamer
   - Verify message appears in their Kick chat
   - Wait for their response

3. **Set up multiple watch channels**
   - `#watch-jerzy` → `!kick watch jerzy`
   - `#watch-glitch` → `!kick watch realglitchdyeet`
   - Each community gets their own space

4. **Use roles for notifications**
   - Create "Stream Watchers" role
   - Give it to users who want @everyone pings
   - Others can mute the watch channel

---

## 🔮 Future Features Coming Soon

- [ ] Stream clips shared in Discord
- [ ] VOD links when stream ends
- [ ] Custom notification messages per server
- [ ] Stream schedules and reminders
- [ ] Multi-stream embeds
- [ ] Stream analytics and stats
- [ ] Highlight reels

---

## 📞 Support

Need help?

1. Check this guide thoroughly
2. Verify all environment variables
3. Check bot logs for errors
4. Test Kick bot API separately
5. Ensure Discord permissions are correct

**Common Issues:**
- "Bot doesn't respond" → Enable Message Content Intent
- "Can't mention everyone" → Give bot Mention Everyone permission
- "Messages not sending to Kick" → Check KICK_BOT_API_URL
- "Streamers not found" → Make sure they registered with `!setupchat`

---

**Enjoy connecting your communities across Discord and Kick!** 🎮🎉
