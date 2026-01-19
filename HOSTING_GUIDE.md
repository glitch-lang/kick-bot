# Hosting Guide for Kick Cross-Streamer Bot

This guide covers hosting options for deploying the bot so multiple streamers can use it.

## 🚀 Recommended Hosting Platforms

### 1. Railway (Recommended) ⭐

**Best for:** Easy deployment, WebSocket support, automatic HTTPS

**Pros:**
- ✅ Free tier available (with limits)
- ✅ Automatic HTTPS/SSL
- ✅ WebSocket support
- ✅ Easy environment variable management
- ✅ GitHub integration
- ✅ Simple deployment process

**Deployment Steps:**

1. **Sign up**: Go to [railway.app](https://railway.app)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo" (or upload code)

3. **Configure Environment Variables**:
   ```
   KICK_CLIENT_ID=your_client_id
   KICK_CLIENT_SECRET=your_client_secret
   KICK_REDIRECT_URI=https://your-app.railway.app/auth/kick/callback
   BOT_USERNAME=your_bot_username
   BOT_ACCESS_TOKEN=your_bot_access_token
   JWT_SECRET=your_random_secret_key
   PORT=3000
   NODE_ENV=production
   DB_PATH=./data/kickbot.db
   ```

4. **Update Redirect URI**:
   - In your Kick Developer App settings, add: `https://your-app.railway.app/auth/kick/callback`
   - Replace `your-app.railway.app` with your Railway domain

5. **Deploy**:
   - Railway auto-detects Node.js
   - Runs `npm install` and `npm start`
   - Bot is live!

**Pricing:** Free tier: $5 credit/month, then pay-as-you-go

---

### 2. Render ⭐

**Best for:** Free tier, simple setup

**Pros:**
- ✅ Generous free tier
- ✅ WebSocket support
- ✅ Automatic HTTPS
- ✅ Easy deployment

**Deployment Steps:**

1. **Sign up**: Go to [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect GitHub repo
   - Select "Web Service"

3. **Configure**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Environment**: `Node`

4. **Set Environment Variables** (same as Railway)

5. **Update Redirect URI**:
   - Add: `https://your-app.onrender.com/auth/kick/callback`

**Pricing:** Free tier available (spins down after inactivity), paid plans start at $7/month

---

### 3. Fly.io ⭐

**Best for:** Global edge deployment, WebSocket support

**Pros:**
- ✅ Excellent WebSocket support
- ✅ Global edge network
- ✅ Free tier available
- ✅ Great for real-time apps

**Deployment Steps:**

1. **Install Fly CLI**:
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Login**:
   ```bash
   fly auth login
   ```

3. **Create App**:
   ```bash
   fly launch
   ```

4. **Set Secrets**:
   ```bash
   fly secrets set KICK_CLIENT_ID=your_client_id
   fly secrets set KICK_CLIENT_SECRET=your_client_secret
   fly secrets set BOT_USERNAME=your_bot_username
   fly secrets set BOT_ACCESS_TOKEN=your_bot_access_token
   # ... etc
   ```

5. **Deploy**:
   ```bash
   fly deploy
   ```

**Pricing:** Free tier: 3 shared VMs, then pay-as-you-go

---

### 4. DigitalOcean App Platform

**Best for:** Predictable pricing, good performance

**Pros:**
- ✅ Predictable pricing
- ✅ WebSocket support
- ✅ Good documentation
- ✅ Auto-scaling

**Pricing:** Starts at $5/month

---

## 🔧 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] **Bot Account Created**: Create a dedicated Kick account for the bot
- [ ] **Bot Token Obtained**: Get OAuth access token with `chat:write` scope
- [ ] **Kick Developer App**: Created at [dev.kick.com](https://dev.kick.com)
- [ ] **Redirect URI Updated**: Add your deployment URL to Kick app settings
- [ ] **Environment Variables**: All secrets configured
- [ ] **Database**: SQLite file will be created automatically (consider PostgreSQL for production)

## 📝 Environment Variables Required

```env
# Kick OAuth (from dev.kick.com)
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_REDIRECT_URI=https://your-domain.com/auth/kick/callback

# Bot Account
BOT_USERNAME=your_bot_username
BOT_ACCESS_TOKEN=your_bot_access_token

# Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=generate_random_secret_here

# Database (SQLite - auto-created)
DB_PATH=./data/kickbot.db
```

## 🌐 Making Bot Publicly Accessible

### For Streamers to Use:

1. **Share Bot Username**: Tell streamers the bot's Kick username
2. **Share Web Interface**: Give them your deployment URL (e.g., `https://your-bot.railway.app`)
3. **Instructions**: They visit "Invite Bot" tab and follow setup

### Bot Invite Process:

1. Streamer visits your bot's web interface
2. Clicks "Invite Bot" tab
3. Follows instructions to add bot to their channel
4. Types `!setupchat` in their chat
5. Bot automatically connects and registers

## 🔒 Security Considerations

1. **Keep Secrets Safe**: Never commit `.env` to Git
2. **Use Strong JWT_SECRET**: Generate random string
3. **HTTPS Only**: All hosting platforms provide this automatically
4. **Rate Limiting**: Consider adding rate limiting for public endpoints
5. **Database Backups**: SQLite file should be backed up regularly

## 📊 Monitoring & Maintenance

### Health Check Endpoint

The bot includes a health check at `/api/health` (you may want to add this).

### Logs

- **Railway**: View logs in dashboard
- **Render**: View logs in dashboard
- **Fly.io**: `fly logs`

### Database Backups

For SQLite:
- Download `data/kickbot.db` regularly
- Or migrate to PostgreSQL for better reliability

## 🚨 Troubleshooting

### Bot Not Responding

1. Check logs for errors
2. Verify `BOT_ACCESS_TOKEN` is valid
3. Ensure bot account has `chat:write` permission
4. Check WebSocket connections in logs

### OAuth Not Working

1. Verify redirect URI matches exactly
2. Check `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET`
3. Ensure HTTPS is enabled (required for OAuth)

### WebSocket Issues

1. Verify hosting platform supports WebSockets
2. Check firewall/network settings
3. Review Pusher connection logs

## 💡 Recommended Setup for Production

1. **Hosting**: Railway or Fly.io (best WebSocket support)
2. **Database**: Consider PostgreSQL instead of SQLite
3. **Monitoring**: Add health checks and logging
4. **Backups**: Regular database backups
5. **Domain**: Custom domain (optional but recommended)

## 📞 Support

If you need help:
- Check logs in hosting platform dashboard
- Review `REALTIME_CHAT.md` for chat setup
- Check `CHAT_SETUP.md` for command usage
