# Post-Deployment Checklist

## ✅ While Railway is Deploying

1. **Wait for deployment to complete** (usually 2-5 minutes)
   - Watch the logs in Railway dashboard
   - Should see: "Server running on port 3000"
   - Should see: "Kick Bot started"

2. **Get your Railway URL**
   - Railway dashboard → Your project
   - Copy the URL (e.g., `https://kick-bot-production.up.railway.app`)

## 🔧 Step 1: Add Environment Variables

In Railway dashboard → Your Project → Variables tab:

### Required Variables:

```env
# Kick OAuth (from dev.kick.com)
KICK_CLIENT_ID=01KFBYN2H0627PRTF8WAB9R446
KICK_CLIENT_SECRET=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
KICK_REDIRECT_URI=https://YOUR-RAILWAY-URL/auth/kick/callback

# Bot Account
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

## 🔗 Step 2: Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Edit your app
3. Add redirect URI: `https://YOUR-RAILWAY-URL/auth/kick/callback`
4. Save changes

## 🤖 Step 3: Get Bot Access Token

1. **Create bot account** on Kick.com (if not done)
   - Choose username (e.g., `CrossStreamBot`)
   - Complete account setup

2. **Get OAuth token** for bot account:
   - Use your Kick Developer App OAuth flow
   - Authorize with bot account
   - Get access token with `chat:write` scope
   - Add to Railway as `BOT_ACCESS_TOKEN`

3. **Set bot username**:
   - Add to Railway as `BOT_USERNAME`

## ✅ Step 4: Verify Deployment

1. **Check Railway Logs**
   - Should see: "Server running"
   - Should see: "Kick Bot started"
   - No errors

2. **Visit Your Bot**
   - Go to: `https://YOUR-RAILWAY-URL`
   - Should see web interface
   - Check "Invite Bot" tab

3. **Test Health Endpoint**
   - Visit: `https://YOUR-RAILWAY-URL/api/health`
   - Should return: `{"status":"ok",...}`

## 🎯 Step 5: Share with Streamers

Once everything works:

1. **Share Bot URL**: `https://YOUR-RAILWAY-URL`
2. **Share Bot Username**: From `BOT_USERNAME` env var
3. **Instructions**:
   - Visit bot URL
   - Go to "Invite Bot" tab
   - Add bot as moderator
   - Type `!setupchat` in chat

## 🆘 Troubleshooting

### Bot Not Starting?
- Check Railway logs for errors
- Verify all environment variables are set
- Check `BOT_ACCESS_TOKEN` is valid

### OAuth Not Working?
- Verify redirect URI matches exactly
- Must be HTTPS (Railway provides this)
- Check `KICK_CLIENT_ID` and `SECRET`

### WebSocket Issues?
- Railway supports WebSockets automatically
- Check Pusher connection logs
- Verify chatroom IDs are correct

---

**You're almost there!** Once environment variables are set, your bot will be fully functional.
