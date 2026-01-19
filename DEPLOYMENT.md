# Deployment Guide

To share this bot with others, you need to host it on a publicly accessible server. Here are the best options:

## Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
**Free tier available, very simple setup**

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Connect your GitHub repository
5. Railway will auto-detect Node.js and deploy
6. Add environment variables in Railway dashboard:
   - `KICK_CLIENT_ID` - Your Kick app Client ID
   - `KICK_CLIENT_SECRET` - Your Kick app Client Secret
   - `KICK_REDIRECT_URI` - `https://your-app-name.railway.app/auth/kick/callback`
   - `PORT` - Railway sets this automatically
   - `NODE_ENV` - `production`
7. Get your app URL (e.g., `https://your-app-name.railway.app`)
8. **Update Kick App Settings:**
   - Go to https://dev.kick.com
   - Edit your app
   - Add redirect URI: `https://your-app-name.railway.app/auth/kick/callback`
   - Save

### Option 2: Render
**Free tier available**

1. Go to https://render.com
2. Sign up
3. Click "New" → "Web Service"
4. Connect your GitHub repository
5. Settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Environment:** Node
6. Add environment variables:
   - `KICK_CLIENT_ID`
   - `KICK_CLIENT_SECRET`
   - `KICK_REDIRECT_URI` - `https://your-app-name.onrender.com/auth/kick/callback`
   - `NODE_ENV` - `production`
7. Deploy
8. **Update Kick App Settings** with the Render URL

### Option 3: Fly.io
**Free tier available**

1. Install Fly CLI: `npm install -g @fly/cli`
2. Run: `fly launch`
3. Follow prompts
4. Set secrets:
   ```bash
   fly secrets set KICK_CLIENT_ID=your_client_id
   fly secrets set KICK_CLIENT_SECRET=your_secret
   fly secrets set KICK_REDIRECT_URI=https://your-app.fly.dev/auth/kick/callback
   fly secrets set NODE_ENV=production
   ```
5. Deploy: `fly deploy`
6. **Update Kick App Settings** with the Fly.io URL

### Option 4: DigitalOcean App Platform
**Paid, but reliable**

1. Go to https://cloud.digitalocean.com
2. Create App → Connect GitHub
3. Configure build/start commands
4. Add environment variables
5. Deploy

## Important: Update Kick App Redirect URI

**CRITICAL:** After deploying, you MUST update your Kick Developer App:

1. Go to https://dev.kick.com
2. Find your app
3. Edit settings
4. Add your production redirect URI:
   - Format: `https://your-domain.com/auth/kick/callback`
   - Example: `https://kick-bot.railway.app/auth/kick/callback`
5. Save changes

## Environment Variables Needed

Create a `.env` file or set these in your hosting platform:

```env
KICK_CLIENT_ID=your_client_id_here
KICK_CLIENT_SECRET=your_client_secret_here
KICK_REDIRECT_URI=https://your-domain.com/auth/kick/callback
PORT=3000
NODE_ENV=production
DB_PATH=./data/bot.db
BOT_USERNAME=your_bot_username
BOT_PASSWORD=your_bot_password
```

## Database Considerations

- **SQLite (current):** Works fine for small deployments
- **PostgreSQL (recommended for production):** Better for multiple users
  - Railway/Render provide free PostgreSQL databases
  - You'd need to update `database.ts` to use PostgreSQL instead

## Testing After Deployment

1. Visit your deployed URL
2. Click "Register" → "Connect with Kick"
3. Authorize the app
4. You should be redirected back to your dashboard
5. Create a test command
6. Test in chat

## Sharing with Others

Once deployed, share:
- **Your app URL:** `https://your-domain.com`
- **Instructions:** "Go to [URL], click Register, connect your Kick account"

## Troubleshooting

### OAuth 404 Error
- Check that redirect URI in Kick app matches exactly
- No trailing slashes
- Must be HTTPS in production

### Database Errors
- Ensure write permissions for SQLite file
- Or switch to PostgreSQL for production

### Bot Not Responding
- Check server logs
- Verify bot credentials are set
- Ensure bot account has access to channels
