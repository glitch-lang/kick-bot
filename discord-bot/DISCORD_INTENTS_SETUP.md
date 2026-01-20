# 🔐 Discord Bot Security & Intents Setup

## 🚨 IMPORTANT: Token Security

### ✅ What We're Doing Right:
- ✅ `.env` files are in `.gitignore` (never committed to Git)
- ✅ Token stored locally only
- ✅ Railway uses environment variables (separate from code)

### 🔄 Regenerate Your Token (DO THIS NOW!):

**You shared your token in chat - it needs to be regenerated immediately!**

1. Go to https://discord.com/developers/applications
2. Select your **CrossTalk Bot** application
3. Go to **"Bot"** tab
4. Scroll down and click **"Reset Token"**
5. Click **"Yes, do it!"**
6. **Copy the new token** (you'll only see it once!)
7. Update your `.env` file with the new token

---

## 🎯 Required Discord Intents

### In Discord Developer Portal:

1. Go to https://discord.com/developers/applications
2. Select your application
3. Go to **"Bot"** tab on the left
4. Scroll to **"Privileged Gateway Intents"**

### Enable These Intents:

#### ✅ **Message Content Intent** (REQUIRED)
- **Why:** Bot needs to read message content to see commands like `!kick message`
- **Without it:** Bot sees messages but content is empty
- **Security:** Bot only reads messages, can't modify them

#### ⚠️ **Server Members Intent** (OPTIONAL)
- **Why:** Only if you want to track user info for analytics
- **Recommended:** Leave OFF for minimal permissions

#### ⚠️ **Presence Intent** (OPTIONAL)
- **Why:** Only if you want to see online/offline status
- **Recommended:** Leave OFF for minimal permissions

---

## 🔧 Bot Configuration in Code

### Current Setup (in `src/index.ts`):

```typescript
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,           // Access server info
    GatewayIntentBits.GuildMessages,    // See when messages sent
    GatewayIntentBits.MessageContent,   // Read message content (needs intent enabled)
  ],
});
```

### What Each Intent Does:

| Intent | Purpose | Required? |
|--------|---------|-----------|
| `Guilds` | Access server list, channels | ✅ YES |
| `GuildMessages` | Know when messages are sent | ✅ YES |
| `MessageContent` | Read actual message text | ✅ YES |

---

## 🛡️ Bot Permissions

### In Discord (when inviting bot):

These are **permissions**, not intents:

#### ✅ **Minimal Required Permissions:**
- **Send Messages** - To respond to commands
- **Embed Links** - For rich stream embeds
- **Read Message History** - To see commands
- **Mention Everyone** - For @everyone stream notifications

#### ❌ **NOT Needed (DO NOT GIVE):**
- Administrator
- Manage Server
- Manage Channels
- Manage Roles
- Kick/Ban Members
- Manage Messages (delete, pin, etc.)

---

## 📝 Invite URL with Correct Permissions

### Generate Your Invite Link:

1. Go to https://discord.com/developers/applications
2. Your application → **"OAuth2"** → **"URL Generator"**
3. Select **Scopes:**
   - ✅ `bot`
4. Select **Bot Permissions:**
   - ✅ Send Messages
   - ✅ Embed Links
   - ✅ Attach Files
   - ✅ Read Message History
   - ✅ Mention Everyone

### Or Use This Template:

Replace `YOUR_CLIENT_ID` with `1463251183262109798`:

```
https://discord.com/api/oauth2/authorize?client_id=1463251183262109798&permissions=2147766336&scope=bot
```

**Permission Value Breakdown:**
- `2147766336` = Send Messages + Embed Links + Attach Files + Read Message History + Mention Everyone

---

## 🔐 Environment Variable Security

### Local Development (.env file):

**Location:** `C:\Users\willc\kick-bot\discord-bot\.env`

```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=your_new_regenerated_token_here
DISCORD_CLIENT_ID=1463251183262109798

# Kick Bot API
KICK_BOT_API_URL=https://web-production-56232.up.railway.app
```

**✅ Security Checklist:**
- [ ] `.env` is in `.gitignore` ✓
- [ ] Never commit `.env` to Git ✓
- [ ] Token regenerated after exposure ⚠️ (DO THIS NOW)
- [ ] Only share token through secure channels (not chat/Discord)

---

## 🚀 Railway Deployment (Separate from Git)

### For Production (Railway):

1. **Railway Dashboard** → Your Discord bot project
2. **Variables** tab
3. Add these:
   ```
   DISCORD_BOT_TOKEN=your_regenerated_token
   DISCORD_CLIENT_ID=1463251183262109798
   KICK_BOT_API_URL=https://web-production-56232.up.railway.app
   ```

**Railway stores these securely - they're NOT in your Git repo!**

---

## ⚠️ If Token Gets Exposed:

### Immediate Actions:

1. **Regenerate Token** (Discord Developer Portal)
2. **Update `.env` file** locally
3. **Update Railway environment variables** (if deployed)
4. **Restart bot** to use new token

### Signs of Compromised Token:

- Bot acting weird (sending messages you didn't program)
- Bot online when you didn't start it
- Unexpected server joins
- Rate limit errors (someone spamming with your bot)

**If you see any of these → REGENERATE IMMEDIATELY!**

---

## 🎯 Summary Checklist

### Discord Developer Portal:
- [ ] Message Content Intent enabled
- [ ] Bot token regenerated (if exposed)
- [ ] Invite URL uses minimal permissions

### Local Setup:
- [ ] `.env` file created in `discord-bot/` folder
- [ ] `.env` is in `.gitignore`
- [ ] Token stored in `.env` only (not in code)

### Railway (if deploying):
- [ ] Environment variables set in Railway dashboard
- [ ] `.env` files NOT committed to Git

---

## 🔍 Quick Security Test

### ✅ Your token is secure if:
1. Running `git log --all -p | grep -i "discord_bot_token"` shows nothing
2. `.env` file is NOT in your Git repo
3. Token is different from what you shared earlier
4. Only you have access to the `.env` file

### ❌ Regenerate if:
1. Token appears in Git history
2. Token shared in public chat/Discord
3. Bot behaving unexpectedly
4. Unsure if compromised (regenerate to be safe!)

---

## 💡 Best Practices

1. **Never hardcode tokens** in source files
2. **Use `.env` files** for local development
3. **Use Railway environment variables** for production
4. **Regenerate tokens** if ever exposed
5. **Minimal permissions** - only what bot needs
6. **Regular security reviews** - check what permissions bot has

---

## 📞 Need Help?

**Token exposed?**
→ Regenerate immediately in Discord Developer Portal

**Bot not responding?**
→ Check Message Content Intent is enabled

**Permission errors?**
→ Check bot has Send Messages permission in channel

---

**Your bot is now configured with minimal, secure permissions!** 🔐✨
