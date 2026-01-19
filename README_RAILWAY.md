# 🚂 Railway Deployment - Quick Start

## ✅ Ready to Deploy!

Your bot is configured and ready for Railway deployment.

## 🚀 3-Step Deployment

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Railway ready"
git remote add origin https://github.com/yourusername/kick-bot.git
git push -u origin main
```

### 2. Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. New Project → Deploy from GitHub
4. Select your repo
5. Done! Railway auto-detects Node.js

### 3. Add Environment Variables
In Railway dashboard → Variables:

```
KICK_CLIENT_ID=your_client_id
KICK_CLIENT_SECRET=your_client_secret
KICK_REDIRECT_URI=https://your-app.railway.app/auth/kick/callback
BOT_USERNAME=your_bot_username
BOT_ACCESS_TOKEN=your_bot_token
JWT_SECRET=your_random_secret
PORT=3000
NODE_ENV=production
DB_PATH=./data/kickbot.db
```

## ✅ That's It!

Your bot is live at: `https://your-app.railway.app`

See `RAILWAY_DEPLOY.md` for detailed instructions.
