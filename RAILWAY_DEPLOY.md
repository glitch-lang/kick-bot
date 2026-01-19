# Railway Deployment Guide

## ✅ Your Bot is Ready for Railway!

Railway can run this bot perfectly - it's a Node.js app with all standard dependencies.

## 🚀 Quick Deploy (5 Minutes)

### Step 1: Push to GitHub

```bash
cd C:\Users\willc\kick-bot
git init
git add .
git commit -m "Initial commit - Railway ready"
git remote add origin https://github.com/yourusername/kick-bot.git
git push -u origin main
```

**Important:** Make sure `.env` is NOT committed (it's in `.gitignore` ✅)

### Step 2: Deploy on Railway

1. **Go to**: [railway.app](https://railway.app)
2. **Sign up** with GitHub (free)
3. **Click**: "New Project"
4. **Select**: "Deploy from GitHub repo"
5. **Choose** your `kick-bot` repository
6. **Railway auto-detects** Node.js and starts deploying!

### Step 3: Configure Environment Variables

In Railway dashboard → Your Project → Variables tab, add:

```env
# Kick OAuth (from dev.kick.com)
KICK_CLIENT_ID=01KFBYN2H0627PRTF8WAB9R446
KICK_CLIENT_SECRET=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
KICK_REDIRECT_URI=https://your-app-name.railway.app/auth/kick/callback

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

**Important:** 
- Replace `your-app-name.railway.app` with your actual Railway domain (shown in dashboard)
- Get `BOT_ACCESS_TOKEN` from Kick OAuth flow

### Step 4: Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Edit your app
3. Add redirect URI: `https://your-app-name.railway.app/auth/kick/callback`
4. Save

### Step 5: Get Bot Access Token

1. Create bot account on Kick.com (if not done)
2. Use OAuth flow to get access token
3. Token needs `chat:write` scope
4. Add to Railway env vars as `BOT_ACCESS_TOKEN`

### Step 6: Deploy!

Railway will automatically:
- ✅ Install dependencies (`npm install`)
- ✅ Build TypeScript (`npm run build`)
- ✅ Start server (`npm start`)
- ✅ Provide HTTPS URL
- ✅ Keep it running 24/7

## 🔍 Verify Deployment

1. **Check Railway Logs**
   - Go to Railway dashboard → Deployments → View Logs
   - Should see: "Server running on port 3000"
   - Should see: "Kick Bot started"

2. **Visit Your Bot**
   - Go to: `https://your-app-name.railway.app`
   - Should see web interface
   - Check "Invite Bot" tab shows bot username

3. **Test Health Endpoint**
   - Visit: `https://your-app-name.railway.app/api/health`
   - Should return: `{"status":"ok",...}`

## 📋 Railway Configuration Files

### `railway.json` ✅
- Tells Railway how to build and run
- Already configured!

### `Procfile` ✅
- Alternative start command
- Already created!

### `package.json` ✅
- Has `build` and `start` scripts
- Railway uses these automatically

## 🔧 Railway-Specific Settings

### Port Configuration
Railway sets `PORT` automatically - your code already handles this:
```typescript
const PORT = process.env.PORT || 3000;
```

### Database Persistence
SQLite file is stored in Railway's filesystem:
- Persists between deployments
- Backed up automatically
- Accessible via Railway dashboard

### Environment Variables
All secrets stored securely in Railway:
- Encrypted at rest
- Not visible in code
- Can be updated without redeploying

## 🆘 Troubleshooting

### Build Fails?
- Check Railway logs for errors
- Ensure `package.json` has all dependencies
- Verify TypeScript compiles locally first

### Bot Not Starting?
- Check `BOT_ACCESS_TOKEN` is set
- Verify `BOT_USERNAME` matches Kick account
- Check logs for connection errors

### OAuth Not Working?
- Verify redirect URI matches exactly
- Must be HTTPS (Railway provides this)
- Check `KICK_CLIENT_ID` and `SECRET` are correct

### WebSocket Issues?
- Railway supports WebSockets automatically
- Check Pusher connection logs
- Verify chatroom IDs are correct

## 💰 Railway Pricing

- **Free Tier**: $5 credit/month
- **Hobby Plan**: $5/month (if you exceed free tier)
- **Pro Plan**: $20/month (for production)

**Your bot will likely stay in free tier** unless you have many users.

## ✅ Pre-Deployment Checklist

- [x] Code pushed to GitHub
- [x] `.env` in `.gitignore` (not committed)
- [x] `railway.json` configured
- [x] `Procfile` created
- [x] Environment variables ready
- [ ] Bot account created on Kick
- [ ] Bot access token obtained
- [ ] Kick app redirect URI updated

## 🎯 After Deployment

1. **Share Bot URL**: `https://your-app-name.railway.app`
2. **Share Bot Username**: From `BOT_USERNAME` env var
3. **Streamers Add Bot**: As moderator in their channel
4. **Streamers Register**: Type `!setupchat` in chat

## 📚 Additional Resources

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Your Bot Docs: See `README.md`

---

**Your bot is 100% ready for Railway!** Just push to GitHub and deploy. 🚀
