# 🚂 Railway Deployment Guide

Your Kick bot is now deployed on Railway!

## 📋 Environment Variables to Set on Railway

Go to your Railway project settings and add these environment variables:

### Required Variables:
```
KICK_CLIENT_ID=01KFBYN2H0627PRTF8WAB9R446
KICK_CLIENT_SECRET=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
KICK_REDIRECT_URI=https://YOUR-RAILWAY-URL.railway.app/auth/kick/callback
PORT=3000
NODE_ENV=production
JWT_SECRET=047d558dd35bb13e8bf257c9d0928a4945b566fcca2629a3927dae1c330670fd
DB_PATH=./data/kickbot.db
BOT_USERNAME=CrossTalkBot
BOT_ACCESS_TOKEN=317457251|wdqQy3KrAlfQaBwdkolSTTITJQLIuUf8GTiHfx6Z
DEBUG_CHAT=true
WEBHOOK_SECRET=a8f3c9e2d7b4f1a6e9c8b5d2f7a4e1c9b6d3f0a7e4c1b8d5f2a9e6c3b0d7f4a1
WEBHOOK_BASE_URL=https://YOUR-RAILWAY-URL.railway.app
```

## 🔧 Setup Steps:

### 1. Get Your Railway URL
After deployment, Railway will give you a URL like:
```
https://kick-bot-production-abc123.up.railway.app
```

### 2. Update Environment Variables
Replace `YOUR-RAILWAY-URL` in these variables:
- `KICK_REDIRECT_URI=https://YOUR-RAILWAY-URL.railway.app/auth/kick/callback`
- `WEBHOOK_BASE_URL=https://YOUR-RAILWAY-URL.railway.app`

### 3. Update Kick Developer App Settings
Go to your Kick Developer App at:
https://kick.com/dashboard/settings/applications

Update the **Redirect URI** to match:
```
https://YOUR-RAILWAY-URL.railway.app/auth/kick/callback
```

### 4. Re-authenticate
1. Go to `https://YOUR-RAILWAY-URL.railway.app`
2. Click "Connect with Kick"
3. Complete OAuth flow
4. Bot will automatically subscribe to chat events!

## 🎮 Testing Your Bot

### Send a Message:
1. Go to your Railway URL dashboard
2. Click a quick message button
3. Check your Kick chat!

### Test Commands:
Go to your Kick chat and type:
- `!ping` → Bot responds "Pong! 🏓"
- `!help` → Shows commands
- `!uptime` → Shows bot uptime

## 📊 Monitoring

### View Logs:
```
https://YOUR-RAILWAY-URL.railway.app/logs
```

### Railway Dashboard:
Monitor your bot's health, view logs, and check deployments at:
https://railway.com/project/dee53b4a-ff3c-4a62-9d8c-5984c313fb8f

## ✅ What Works After Deployment:

- ✅ **Send messages** via dashboard
- ✅ **Send messages** via API
- ✅ **Listen to chat** via webhooks (no ngrok needed!)
- ✅ **Respond to commands** automatically
- ✅ **OAuth authentication**
- ✅ **Auto-subscribe to events**
- ✅ **24/7 uptime**

## 🔄 Future Updates

To update your bot:
```powershell
# 1. Make changes locally
# 2. Commit and push
git add .
git commit -m "Update bot"
git push

# Railway will automatically redeploy!
```

## 🆘 Troubleshooting

### Bot not responding to commands:
1. Check Railway logs for errors
2. Verify webhook subscription succeeded (look for "✅ Successfully subscribed to chat events")
3. Make sure bot is modded in your channel: `/mod CrossTalkBot`

### OAuth errors:
1. Verify `KICK_REDIRECT_URI` matches Railway URL
2. Verify redirect URI in Kick app settings matches Railway URL
3. Check that all environment variables are set

### Database errors:
Railway uses ephemeral storage, so the database will reset on each deploy. For persistence, you'll need to:
1. Add Railway PostgreSQL plugin, OR
2. Use Railway's persistent volumes, OR
3. Use an external database service

---

**Your bot is now running just like Botrix!** 🎉
