# How to Add the Bot to Your Kick Channel

## 🤖 Bot Name

The bot's username is: **`[YourBotUsername]`** (set in `BOT_USERNAME` environment variable)

**Important:** You need to:
1. Create a Kick account for the bot
2. Set `BOT_USERNAME` in your `.env` file to match that account
3. Get an OAuth access token for that bot account
4. Set `BOT_ACCESS_TOKEN` in your `.env` file

## 📝 Step-by-Step: Adding Bot to Kick Channel

### Method 1: Chat Command (Easiest - Recommended)

1. **Make sure bot account exists on Kick.com**
   - Create a Kick account with your chosen bot username
   - Example: `CrossStreamBot`, `KickMessengerBot`, etc.

2. **Bot will auto-join when invited OR you can manually add it:**
   - Go to your Kick channel
   - In chat, the bot should appear (or you can invite it)
   - Type: `!setupchat`
   - Bot responds: "✅ Channel registered!"

**That's it!** The bot is now connected to your channel.

### Method 2: Manual Invite (If Needed)

If the bot doesn't auto-join, manually add it:

1. **Go to your Kick channel settings:**
   - Visit: `https://kick.com/dashboard/settings`
   - Or go to your channel → Settings

2. **Add Bot as Moderator/Bot:**
   - Navigate to "Moderators" or "Bots" section
   - Add the bot username: `[YourBotUsername]`
   - Give it permission to send messages

3. **Register in Chat:**
   - Go to your channel chat
   - Type: `!setupchat`
   - Bot confirms registration

## 🎯 For Streamers (End Users)

### Quick Setup Instructions

**Share these instructions with streamers who want to use your bot:**

---

### How to Add the Bot

1. **Visit the Bot's Web Page**
   - Go to: `https://your-bot-domain.com` (your deployment URL)
   - Click "Invite Bot" tab

2. **Add Bot to Your Channel**
   - **Option A**: Bot will auto-join when you use commands
   - **Option B**: Manually add bot:
     - Go to your Kick channel settings
     - Add bot username: `[YourBotUsername]` as moderator/bot
     - Give it permission to send messages

3. **Register Your Channel**
   - In your Kick chat, type: `!setupchat`
   - Bot responds: "✅ Channel registered! Your command is: !yourchannelname"

4. **Set Cooldown (Optional)**
   - Type: `!cooldownchat 60` (sets 60 second cooldown)

**Done!** Your channel is now part of the network.

---

## 🔧 Bot Account Setup (For Bot Owner)

### Step 1: Create Bot Account

1. Go to [kick.com](https://kick.com)
2. Create a new account for your bot
3. Choose a username (e.g., `CrossStreamBot`, `KickMessengerBot`)
4. Complete account setup

### Step 2: Get Bot Access Token

You need an OAuth access token for the bot account:

1. **Option A: Use OAuth Flow**
   - Use your Kick Developer App
   - Authorize the bot account
   - Get access token with `chat:write` scope

2. **Option B: Use Bot Account Credentials**
   - If Kick supports bot accounts directly
   - Get token from Kick's bot account settings

### Step 3: Configure Environment Variables

In your `.env` file or hosting platform:

```env
BOT_USERNAME=YourBotUsername
BOT_ACCESS_TOKEN=your_bot_oauth_access_token_here
```

### Step 4: Deploy

Once deployed, streamers can:
- Visit your bot's web URL
- Follow "Invite Bot" instructions
- Use `!setupchat` to register

## 📋 What Streamers See

When a streamer visits your bot's web page:

1. **Home Tab**: Overview of features
2. **Invite Bot Tab**: Step-by-step instructions
3. **Register Tab**: OAuth registration (if needed)
4. **Dashboard Tab**: Their channel settings
5. **Communities Tab**: List of all registered streamers

## ✅ Verification

After adding the bot:

1. **Check Bot is Online**: Bot account should be online/active
2. **Test Command**: Type `!setupchat` in your chat
3. **Verify Response**: Bot should respond immediately
4. **Check Logs**: Server logs should show Pusher connection

## 🆘 Troubleshooting

### Bot Not Responding?

- **Check Bot Account**: Is the bot account online?
- **Verify Token**: Is `BOT_ACCESS_TOKEN` set correctly?
- **Check Permissions**: Does bot have `chat:write` permission?
- **Review Logs**: Check server logs for errors

### Bot Not Joining Channel?

- **Manual Add**: Add bot as moderator in channel settings
- **Check Username**: Ensure `BOT_USERNAME` matches Kick account exactly
- **Verify Access**: Bot account needs to be able to join channels

### Commands Not Working?

- **Registration**: Make sure you ran `!setupchat` first
- **Bot Online**: Bot account must be online
- **WebSocket**: Check if Pusher connection is active (check logs)

## 💡 Best Practices

1. **Bot Username**: Choose something clear and memorable
   - Examples: `CrossStreamBot`, `KickMessengerBot`, `StreamConnector`

2. **Bot Profile**: 
   - Add a profile picture
   - Write a clear bio explaining what the bot does

3. **Communication**:
   - Share bot username clearly
   - Provide web URL for instructions
   - Include setup instructions

4. **Monitoring**:
   - Keep bot account online
   - Monitor server logs
   - Check for connection issues

## 📞 Sharing with Streamers

When sharing your bot, provide:

1. **Bot Username**: `YourBotUsername`
2. **Web URL**: `https://your-bot-domain.com`
3. **Quick Instructions**:
   - Visit web URL
   - Go to "Invite Bot" tab
   - Add bot to channel
   - Type `!setupchat` in chat

---

**Need Help?** Check the bot's web page or contact the bot owner.
