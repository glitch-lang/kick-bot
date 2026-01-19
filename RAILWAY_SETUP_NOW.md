# Railway Setup - What to Do Now

## 🚀 Your Bot is Live on Railway!

Now you need to configure it and invite it to your Kick channel.

## 📋 Step-by-Step Setup

### Step 1: Get Your Railway URL

1. Go to Railway dashboard
2. Click on your project (`comfortable-spontaneity`)
3. Copy your Railway URL (e.g., `https://comfortable-spontaneity-production.up.railway.app`)

### Step 2: Add Environment Variables in Railway

In Railway dashboard → Your Project → Variables tab, add these:

```env
# Kick OAuth (from dev.kick.com - you already have these)
KICK_CLIENT_ID=01KFBYN2H0627PRTF8WAB9R446
KICK_CLIENT_SECRET=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
KICK_REDIRECT_URI=https://YOUR-RAILWAY-URL/auth/kick/callback

# Bot Account (YOU NEED TO SET THESE)
BOT_USERNAME=your_bot_kick_username
BOT_ACCESS_TOKEN=your_bot_oauth_token_here

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=047d558dd35bb13e8bf257c9d0928a4945b566fcca2629a3927dae1c330670fd

# Database
DB_PATH=./data/kickbot.db
```

**Important:** Replace `YOUR-RAILWAY-URL` with your actual Railway domain!

### Step 3: Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Edit your app
3. Add redirect URI: `https://YOUR-RAILWAY-URL/auth/kick/callback`
4. Save

### Step 4: Create Bot Account & Get Token

#### A. Create Bot Account on Kick

1. Go to [kick.com](https://kick.com)
2. Create a new account (e.g., `CrossStreamBot`, `KickMessengerBot`)
3. Complete account setup
4. **Note the username** - you'll need it for `BOT_USERNAME`

#### B. Get Bot Access Token

**Option 1: Use OAuth Flow (Recommended)**

1. Visit: `https://YOUR-RAILWAY-URL/auth/kick`
2. Log in with your **bot account** (not your personal account)
3. Authorize the app
4. You'll be redirected back
5. **Get token from callback** (check server logs or use browser dev tools)

**Option 2: Manual Token (If OAuth doesn't work)**

1. Use your Kick Developer App
2. Authorize with bot account
3. Get access token with `chat:write` scope
4. Copy the token

#### C. Add to Railway

1. Go to Railway → Variables
2. Set `BOT_USERNAME` = your bot's Kick username
3. Set `BOT_ACCESS_TOKEN` = the OAuth token you got

### Step 5: Invite Bot to Your Channel

#### Method 1: Add as Moderator (Recommended)

1. Go to your Kick channel: `https://kick.com/YOUR_CHANNEL`
2. Click on your channel → Settings
3. Go to "Moderators" section
4. Add your bot username (from `BOT_USERNAME`)
5. Give it permission to send messages

#### Method 2: Use Chat Command

1. Make sure bot account exists
2. In your Kick chat, type: `!setupchat`
3. Bot should respond (if it's in your channel)

### Step 6: Register Your Channel

1. **Make sure bot is in your channel** (added as moderator)
2. **In your Kick chat**, type: `!setupchat`
3. **Bot responds**: "✅ Channel registered! Your command is: !yourchannelname"
4. **Done!** Your channel is now registered

### Step 7: Test It!

1. **Test `!streamers`**: Should list all registered streamers
2. **Test `!online`**: Should show who's live
3. **Set cooldown**: `!cooldownchat 60`

## 🔧 What Changed from Local?

| Setting | Local | Railway |
|---------|-------|---------|
| **URL** | `localhost:3000` | `your-app.railway.app` |
| **Redirect URI** | `http://localhost:3000/...` | `https://your-app.railway.app/...` |
| **Environment** | `.env` file | Railway Variables |
| **Database** | Local file | Railway filesystem |
| **Access** | Only you | Public |

## ✅ Checklist

- [ ] Railway URL copied
- [ ] Environment variables added to Railway
- [ ] Kick app redirect URI updated
- [ ] Bot account created on Kick
- [ ] Bot access token obtained
- [ ] `BOT_USERNAME` set in Railway
- [ ] `BOT_ACCESS_TOKEN` set in Railway
- [ ] Bot added as moderator to your channel
- [ ] Typed `!setupchat` in your chat
- [ ] Bot responded successfully

## 🆘 Troubleshooting

### Bot Not Responding?

1. **Check Railway logs** - Look for errors
2. **Verify `BOT_ACCESS_TOKEN`** - Must be valid OAuth token
3. **Check bot is moderator** - Needs mod status to send messages
4. **Verify bot account** - Must exist and be accessible

### OAuth Not Working?

1. **Redirect URI must match exactly** - Check Railway URL
2. **Must be HTTPS** - Railway provides this automatically
3. **Check `KICK_CLIENT_ID` and `SECRET`** - Must be correct

### Database Errors?

- Should be fixed now with the initialization fix
- Check Railway logs for "Database initialized successfully"

## 🎯 Quick Summary

1. **Set Railway environment variables** (especially `BOT_USERNAME` and `BOT_ACCESS_TOKEN`)
2. **Update Kick app redirect URI** to your Railway URL
3. **Create bot account** on Kick.com
4. **Get bot OAuth token** (with `chat:write` scope)
5. **Add bot as moderator** in your channel
6. **Type `!setupchat`** in your chat
7. **Done!** Bot is connected

---

**Your bot is live - just needs configuration!** Follow the steps above to get it working.
