# Quick Deploy Guide

## 🚀 Fastest Way to Deploy (Railway - Recommended)

### Step 1: Prepare Your Code

1. Push your code to GitHub (if not already):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/kick-bot.git
   git push -u origin main
   ```

### Step 2: Deploy on Railway

1. **Go to**: [railway.app](https://railway.app)
2. **Sign up** with GitHub
3. **Click**: "New Project" → "Deploy from GitHub repo"
4. **Select** your repository
5. **Railway auto-detects** Node.js and starts deploying

### Step 3: Configure Environment Variables

In Railway dashboard, go to "Variables" tab and add:

```
KICK_CLIENT_ID=your_client_id_from_dev_kick_com
KICK_CLIENT_SECRET=your_client_secret
KICK_REDIRECT_URI=https://your-app.railway.app/auth/kick/callback
BOT_USERNAME=your_bot_kick_username
BOT_ACCESS_TOKEN=your_bot_oauth_token
JWT_SECRET=generate_random_string_here
PORT=3000
NODE_ENV=production
DB_PATH=./data/kickbot.db
```

**Important**: Replace `your-app.railway.app` with your actual Railway domain!

### Step 4: Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Edit your app
3. Add redirect URI: `https://your-app.railway.app/auth/kick/callback`
4. Save

### Step 5: Get Bot Access Token

1. Create a bot account on Kick.com
2. Use OAuth flow to get access token for bot account
3. Token needs `chat:write` scope
4. Add to Railway environment variables

### Step 6: Share with Streamers

Your bot is now live! Share:

- **Web Interface**: `https://your-app.railway.app`
- **Bot Username**: The Kick username of your bot account

Streamers can:
1. Visit your web interface
2. Go to "Invite Bot" tab
3. Add bot to their channel
4. Type `!setupchat` in chat

## 🎯 Alternative: Render (Free Tier)

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. "New" → "Web Service"
4. Connect your GitHub repo
5. Configure:
   - **Build**: `npm install && npm run build`
   - **Start**: `npm start`
6. Add environment variables (same as Railway)
7. Update redirect URI to: `https://your-app.onrender.com/auth/kick/callback`

## 🔗 What Streamers Need

Share this with streamers who want to use your bot:

1. **Web URL**: `https://your-app.railway.app`
2. **Bot Username**: `YourBotUsername`
3. **Instructions**:
   - Visit the web URL
   - Go to "Invite Bot" tab
   - Add bot to your channel (or bot will auto-join)
   - Type `!setupchat` in your chat
   - Done! Your channel is registered

## ✅ Testing After Deployment

1. Visit your deployment URL
2. Check "Invite Bot" tab loads
3. Try OAuth registration (if needed)
4. Test `!setupchat` command in a test channel
5. Verify bot responds to commands

## 🆘 Common Issues

**Bot not responding?**
- Check Railway logs
- Verify `BOT_ACCESS_TOKEN` is set correctly
- Ensure bot account has `chat:write` permission

**OAuth not working?**
- Redirect URI must match exactly
- Must use HTTPS (Railway provides this automatically)
- Check `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET`

**WebSocket issues?**
- Railway supports WebSockets automatically
- Check logs for Pusher connection errors

## 📝 Next Steps

- [ ] Set up custom domain (optional)
- [ ] Configure database backups
- [ ] Add monitoring/alerting
- [ ] Share bot with streamers!
