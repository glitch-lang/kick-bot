# How to Invite Bot to Your Kick Chat

## 🎯 Quick Steps

### 1. Set Bot Username in Railway

1. Go to Railway dashboard → Your project → Variables
2. Add: `BOT_USERNAME=YourBotUsername`
   - Replace `YourBotUsername` with your bot's actual Kick username
   - Example: `BOT_USERNAME=CrossStreamBot`

### 2. Get Bot Access Token

**You need an OAuth token for your bot account:**

1. **Create bot account** on Kick.com (if not done)
   - Choose username (e.g., `CrossStreamBot`)
   - Complete account setup

2. **Get OAuth token:**
   - Visit: `https://YOUR-RAILWAY-URL/auth/kick`
   - Log in with **bot account** (not your personal account)
   - Authorize the app
   - Get the access token from the callback
   - Or use Kick Developer App to get token manually

3. **Add to Railway:**
   - Railway → Variables → `BOT_ACCESS_TOKEN`
   - Paste the token

### 3. Add Bot to Your Channel

**Option A: Add as Moderator (Recommended)**

1. Go to your Kick channel
2. Click Settings → Moderators
3. Add bot username: `YourBotUsername` (from Step 1)
4. Give permission to send messages
5. Save

**Option B: Bot Auto-Joins**

- Some bots auto-join when you use commands
- Try typing `!setupchat` first
- If bot doesn't respond, use Option A

### 4. Register Your Channel

1. **In your Kick chat**, type: `!setupchat`
2. **Bot should respond**: "✅ Channel registered! Your command is: !yourchannelname"
3. **Done!** Your channel is registered

### 5. Test Commands

- `!streamers` - List all registered streamers
- `!online` - See who's live
- `!cooldownchat 60` - Set cooldown to 60 seconds

## 🔍 Finding Your Railway URL

1. Railway dashboard → Your project
2. Look for "Domains" or "Settings"
3. Copy the URL (e.g., `https://comfortable-spontaneity-production.up.railway.app`)

## 📝 Example Flow

```
1. Bot account created: "CrossStreamBot"
2. Railway → Variables → BOT_USERNAME=CrossStreamBot
3. Get OAuth token → Railway → BOT_ACCESS_TOKEN=token_here
4. Kick channel → Settings → Moderators → Add "CrossStreamBot"
5. In chat: !setupchat
6. Bot responds: "✅ Channel registered!"
7. Done!
```

## ✅ What You Need

- ✅ Railway URL (from Railway dashboard)
- ✅ Bot Kick account (create on kick.com)
- ✅ Bot OAuth token (from OAuth flow)
- ✅ Access to your Kick channel settings

---

**Follow these steps and your bot will be connected!**
