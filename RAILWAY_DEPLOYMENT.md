# 🚂 Railway Deployment Guide

Deploy your Discord bot to Railway for **permanent public access** with zero configuration!

---

## 🎯 **Why Railway?**

### **Advantages:**
- ✅ **Automatic public URL** (no tunneling needed!)
- ✅ **Permanent URL** that never changes
- ✅ **Free tier** with $5/month credit
- ✅ **Zero-downtime deploys**
- ✅ **Automatic HTTPS**
- ✅ **Built-in CI/CD** from GitHub
- ✅ **Environment variables** management
- ✅ **24/7 uptime** (no need to keep your PC on!)

### **URL Format:**
```
https://your-app-production.up.railway.app
```

No more LocalTunnel, ngrok, or keeping your PC running! 🎉

---

## 🚀 **Quick Deploy (5 Minutes)**

### **Step 1: Sign Up for Railway**

1. Go to https://railway.app
2. Click "Start a New Project"
3. Sign up with GitHub (recommended)

**Free Tier:**
- $5/month in free credits
- Enough for hobby projects
- No credit card required initially

---

### **Step 2: Deploy from GitHub**

**Option A: Direct Deploy (Easiest)**

1. Push your code to GitHub:
   ```bash
   cd C:\Users\willc\kick-bot
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/kick-bot.git
   git push -u origin main
   ```

2. In Railway dashboard:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your `kick-bot` repository
   - Select the `discord-bot` folder as root

3. Railway will automatically:
   - ✅ Detect it's a Node.js app
   - ✅ Run `npm install`
   - ✅ Run `npm run build`
   - ✅ Run `npm start`
   - ✅ Generate a public URL

**Option B: Deploy without GitHub**

1. Install Railway CLI:
   ```powershell
   npm install -g @railway/cli
   ```

2. Login:
   ```powershell
   railway login
   ```

3. Deploy:
   ```powershell
   cd C:\Users\willc\kick-bot\discord-bot
   railway init
   railway up
   ```

---

### **Step 3: Configure Environment Variables**

In Railway dashboard:

1. Click your project
2. Go to "Variables" tab
3. Add these variables:

```env
DISCORD_BOT_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
KICK_BOT_API_URL=https://web-production-56232.up.railway.app
PUBLIC_URL=https://your-app-production.up.railway.app
```

**Railway automatically sets:**
- `PORT` (you'll need to use this for the watch party server)
- `NODE_ENV=production`

**Optional (for Kick OAuth):**
```env
KICK_OAUTH_CLIENT_ID=your_client_id
KICK_OAUTH_CLIENT_SECRET=your_client_secret
KICK_OAUTH_REDIRECT_URI=https://your-app-production.up.railway.app/auth/callback
SESSION_SECRET=your_32_byte_hex_string
ENCRYPTION_KEY=your_32_byte_hex_string
```

**Don't enable LocalTunnel on Railway:**
```env
ENABLE_TUNNEL=false
```
*(Railway provides its own public URL!)*

---

### **Step 4: Get Your Public URL**

1. In Railway dashboard, click "Settings"
2. Scroll to "Networking"
3. Click "Generate Domain"

Your URL will be:
```
https://your-app-production.up.railway.app
```

**Copy this URL** and update your `.env`:
```env
PUBLIC_URL=https://your-app-production.up.railway.app
```

Push changes:
```bash
git add .
git commit -m "Update public URL"
git push
```

Railway will **auto-redeploy**!

---

## 🔧 **Configuration**

### **Update Watch Party Port**

Railway provides the `PORT` environment variable. Update `watch-party-server.ts` to use it:

```typescript
const PORT = process.env.PORT || 3001;
const watchPartyServer = new WatchPartyServer(PORT, KICK_API_URL, ...);
```

Or better yet, Railway will automatically detect the port!

### **SQLite Database**

Railway has **persistent storage**, but it's limited. Consider:

**Option 1: Use Railway's Volume**
- Add a volume in Railway dashboard
- Mount to `/app/data`
- Update database path: `./data/bot.db`

**Option 2: Use PostgreSQL (Recommended for Production)**
- Add PostgreSQL plugin in Railway
- Migrate from SQLite to PostgreSQL
- Use connection string from Railway

### **Puppeteer on Railway**

Puppeteer works on Railway! But you may need to add this to `package.json`:

```json
{
  "scripts": {
    "postinstall": "node -e \"try{require('puppeteer').createBrowserFetcher().download()}catch(e){}\""
  }
}
```

Or use `puppeteer-core` with `chrome-aws-lambda` for smaller images.

---

## 🧪 **Testing Your Deployment**

### **Test 1: Check if Bot is Online**

In Discord:
```
!kick help
```

✅ **Pass:** Bot responds

### **Test 2: Check Watch Party**

```
!kick watchparty bbjess
```

Check the URL in the embed. Should be:
```
https://your-app-production.up.railway.app/party/abc123
```

✅ **Pass:** URL uses Railway domain

### **Test 3: Access from Anywhere**

Send the link to a friend or open in incognito:

✅ **Pass:** They can access the watch party!

---

## 📊 **Cost Estimation**

### **Free Tier:**
- $5/month in credits
- ~500 hours of usage
- Perfect for hobby projects

### **Usage:**
- Bot running 24/7: ~$5-10/month
- Watch parties: Minimal bandwidth
- Database: Free (up to 1GB)

### **Optimization Tips:**

1. **Sleep when inactive** (optional):
   - Railway can auto-sleep after inactivity
   - Bot will wake up on request

2. **Use shared resources**:
   - Keep watch party server on same instance
   - Don't create multiple services

3. **Monitor usage**:
   - Check Railway dashboard for costs
   - Set spending limits

---

## 🚨 **Troubleshooting**

### **Bot Not Starting**

**Check logs:**
1. Railway dashboard → "Deployments"
2. Click latest deployment
3. View logs

**Common issues:**
- Missing environment variables
- Build failed (check `npm run build`)
- Port binding error (use `process.env.PORT`)

**Fix:**
```bash
# View logs
railway logs

# Restart
railway restart
```

---

### **Database Not Persisting**

**Issue:** Database resets on each deploy

**Solution:** Add a Railway volume

1. Railway dashboard → "Settings"
2. Scroll to "Volumes"
3. Add volume: `/app/data`
4. Update database path to `/app/data/bot.db`

---

### **Watch Party Not Loading**

**Issue:** Visitors can't access watch party

**Check:**
1. `PUBLIC_URL` in Railway variables matches generated domain
2. Port is correct (use `process.env.PORT`)
3. Watch party server is starting (check logs)

**Test:**
```bash
curl https://your-app-production.up.railway.app/party/test
```

---

### **OAuth Callback Error**

**Issue:** "Redirect URI mismatch"

**Fix:**
1. Update Kick Developer Portal with Railway URL:
   ```
   https://your-app-production.up.railway.app/auth/callback
   ```

2. Update Railway environment variable:
   ```env
   KICK_OAUTH_REDIRECT_URI=https://your-app-production.up.railway.app/auth/callback
   ```

3. Redeploy

---

## 🔄 **Updates & Deployments**

### **Auto-Deploy from GitHub**

When connected to GitHub, Railway auto-deploys on push:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Railway auto-deploys! 🎉
```

### **Manual Deploy**

```bash
railway up
```

### **Rollback**

In Railway dashboard:
1. Go to "Deployments"
2. Click previous successful deployment
3. Click "Redeploy"

---

## 💡 **Pro Tips**

### **Tip 1: Use Railway CLI**

```bash
# View logs in real-time
railway logs -f

# Open project in browser
railway open

# Run commands in Railway environment
railway run npm run build

# Link local project to Railway
railway link
```

### **Tip 2: Environment-Specific Config**

Create multiple Railway projects:
- `kick-bot-dev` (development)
- `kick-bot-prod` (production)

### **Tip 3: Health Checks**

Add a health check endpoint:

```typescript
// In watch-party-server.ts
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
```

Railway can ping this to ensure your bot is running.

### **Tip 4: Custom Domain**

Railway supports custom domains!

1. Railway dashboard → "Settings" → "Networking"
2. Add custom domain: `bot.yourdomain.com`
3. Update DNS records as shown
4. Update `PUBLIC_URL` to your custom domain

---

## 📚 **Comparison: Local vs Railway**

| Feature | Local (with Tunnel) | Railway |
|---------|---------------------|---------|
| **Setup** | 5 minutes | 10 minutes |
| **URL** | Changes | Permanent |
| **Uptime** | PC must run | 24/7 |
| **Cost** | Free | $5-10/month |
| **Speed** | Depends | Fast (CDN) |
| **Reliability** | PC dependent | 99.9% uptime |
| **Scaling** | Limited | Automatic |
| **SSL/HTTPS** | Via tunnel | Built-in |
| **Custom Domain** | Hard | Easy |

---

## 🎉 **You're Deployed!**

Your bot is now running 24/7 in the cloud with a permanent public URL!

### **What You Get:**
- ✅ Bot online 24/7
- ✅ Watch parties accessible worldwide
- ✅ Permanent URL that never changes
- ✅ Automatic HTTPS
- ✅ Auto-deploy from GitHub
- ✅ No need to keep your PC running!

### **Share Your Watch Parties:**
```
https://your-app-production.up.railway.app/party/abc123
```

Anyone, anywhere can join! 🌍✨

---

## 🆚 **When to Use What?**

### **Use Local + LocalTunnel When:**
- ✅ Testing/development
- ✅ Don't want to pay
- ✅ PC is always on
- ✅ Learning/experimenting

### **Use Railway When:**
- ✅ Production deployment
- ✅ Need 24/7 uptime
- ✅ Want permanent URL
- ✅ Serious project
- ✅ Don't want to manage infrastructure

---

## 🔗 **Resources**

- **Railway Docs:** https://docs.railway.app
- **Railway Discord:** https://discord.gg/railway
- **Railway Status:** https://status.railway.app
- **Pricing:** https://railway.app/pricing

---

## 🚀 **Next Steps**

1. Deploy to Railway
2. Update `PUBLIC_URL` with Railway domain
3. Test watch parties
4. Share links with everyone!
5. Monitor usage in Railway dashboard

**Enjoy your 24/7 public watch parties!** 🎊
