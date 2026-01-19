# Bot Name and Setup

## 🤖 What is the Bot Called?

The bot's name is determined by the **`BOT_USERNAME`** environment variable.

### Default/Example Names:
- `CrossStreamBot`
- `KickMessengerBot`
- `StreamConnector`
- `KickCrossBot`

**You choose the name when you create the bot's Kick account!**

## 📝 How to Set Up the Bot Name

### Step 1: Create Bot Account on Kick

1. Go to [kick.com](https://kick.com)
2. Create a new account
3. Choose your bot username (e.g., `CrossStreamBot`)
4. Complete account setup

### Step 2: Configure Environment Variable

In your `.env` file or hosting platform:

```env
BOT_USERNAME=CrossStreamBot
```

Replace `CrossStreamBot` with your actual bot username.

### Step 3: Get Bot Access Token

You need an OAuth token for the bot account:

1. Use your Kick Developer App OAuth flow
2. Authorize with the bot account
3. Get access token with `chat:write` scope
4. Add to `.env`:

```env
BOT_ACCESS_TOKEN=your_bot_oauth_token_here
```

## 🎯 How Streamers Add the Bot

### Simple Instructions for Streamers:

1. **Bot Username**: `[YourBotUsername]` (whatever you set in BOT_USERNAME)

2. **Add Bot to Channel**:
   - Go to channel settings → Moderators/Bots
   - Add bot username: `[YourBotUsername]`
   - OR bot will auto-join when they use commands

3. **Register**:
   - In chat, type: `!setupchat`
   - Done!

### What Streamers See:

When they visit your bot's web page (`https://your-bot-domain.com`):

- **Bot Username** is displayed on "Invite Bot" tab
- Clear instructions on how to add it
- Step-by-step guide

## 🔍 Finding Your Bot Name

The bot name appears in:
- Web interface "Invite Bot" tab
- API endpoint: `/api/bot/info`
- Environment variable: `BOT_USERNAME`

## ✅ Checklist

Before sharing your bot:

- [ ] Created Kick account for bot
- [ ] Set `BOT_USERNAME` in `.env`
- [ ] Got OAuth token for bot account
- [ ] Set `BOT_ACCESS_TOKEN` in `.env`
- [ ] Bot account has `chat:write` permission
- [ ] Deployed bot with correct environment variables
- [ ] Bot username displays correctly on web page

## 📞 Sharing Bot Name

When sharing with streamers, tell them:

1. **Bot Username**: `[YourBotUsername]`
2. **Web URL**: `https://your-bot-domain.com`
3. **Quick Steps**:
   - Add bot to channel (username: `[YourBotUsername]`)
   - Type `!setupchat` in chat
   - Done!

---

**Example:**

> "Hey! Add my bot `CrossStreamBot` to your channel, then type `!setupchat` in your chat. Visit https://my-bot.railway.app for full instructions!"
