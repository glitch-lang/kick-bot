# 🚀 Deploy to Railway - Step by Step Guide

**Your code is ready! Let's deploy it now!** ✅

---

## ✅ **What's Already Done:**

- ✅ Railway config files created
- ✅ Code committed to git
- ✅ Pushed to GitHub: `https://github.com/glitch-lang/kick-bot`
- ✅ `.env` protected (won't be uploaded)
- ✅ All features ready to deploy

---

## 🚂 **Deploy Steps (5-10 minutes)**

### **Step 1: Sign Up for Railway**

1. Go to: **https://railway.app**
2. Click **"Start a New Project"**
3. Sign in with GitHub (use same account: `glitch-lang`)

**Benefits:**
- $5/month free credits
- No credit card required initially
- Enough for your bot

---

### **Step 2: Create New Project**

1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose repository: **`glitch-lang/kick-bot`**
4. Railway will ask for permissions - **Allow**

---

### **Step 3: Configure Root Directory**

**IMPORTANT:** Your bot is in the `discord-bot` folder, not root!

1. After selecting the repo, Railway creates a service
2. Click on the service (should say "kick-bot")
3. Go to **"Settings"** tab
4. Scroll to **"Root Directory"**
5. Set to: **`discord-bot`** ← Very important!
6. Click **"Save"**

---

### **Step 4: Add Environment Variables**

Click **"Variables"** tab and add these:

#### **Required Variables:**

```env
DISCORD_BOT_TOKEN=your_actual_discord_token_from_env_file
DISCORD_CLIENT_ID=1463251183262109798
KICK_BOT_API_URL=https://web-production-56232.up.railway.app
ENABLE_TUNNEL=false
```

**⚠️ IMPORTANT:** Get your actual `DISCORD_BOT_TOKEN` from your local `.env` file!

**Why `ENABLE_TUNNEL=false`?**
- Railway provides its own public URL
- No need for LocalTunnel on Railway!

#### **Optional Variables (for OAuth - add later if needed):**

```env
KICK_OAUTH_CLIENT_ID=
KICK_OAUTH_CLIENT_SECRET=
SESSION_SECRET=
ENCRYPTION_KEY=
```

**Don't have these yet?** That's fine! OAuth is optional. You can add them later.

---

### **Step 5: Generate Domain (Get Your Public URL)**

1. Go to **"Settings"** tab
2. Scroll to **"Networking"** section
3. Click **"Generate Domain"**

**You'll get a URL like:**
```
https://kick-bot-production.up.railway.app
```

**Copy this URL!** You'll need it next.

---

### **Step 6: Update PUBLIC_URL**

1. Go back to **"Variables"** tab
2. Find `PUBLIC_URL` variable
3. If it doesn't exist, add it:
   ```env
   PUBLIC_URL=https://kick-bot-production.up.railway.app
   ```
   *(Use YOUR actual Railway URL!)*

4. Click **"Save"**

---

### **Step 7: Deploy!**

Railway automatically deploys when you:
- ✅ Add the repo
- ✅ Set environment variables

**Watch the deployment:**
1. Click **"Deployments"** tab
2. See the build logs
3. Wait for: **"✅ Success"**

**Typical deployment time:** 2-5 minutes

---

## 🔍 **Verify Deployment**

### **Check Logs:**

1. In Railway dashboard → **"Deployments"**
2. Click latest deployment
3. View logs

**Look for:**
```
✅ Discord bot logged in as: YourBotName
🌐 Watch Party Server running on port 3001
📊 Server running at: https://kick-bot-production.up.railway.app
```

### **Test in Discord:**

```
!kick help
```

**Expected:** Bot responds with help menu

### **Create Watch Party:**

```
!kick watchparty bbjess
```

**Expected:** Bot creates party with Railway URL:
```
https://kick-bot-production.up.railway.app/party/abc123
```

---

## 🎉 **You're Live!**

### **What You Now Have:**

- ✅ Bot running 24/7 on Railway
- ✅ Permanent public URL (never changes!)
- ✅ Watch parties accessible worldwide
- ✅ Multiple streams supported
- ✅ Same formatting and features
- ✅ Auto-deploys when you push to GitHub

### **Your URLs:**

```
Bot Dashboard: https://railway.app/project/[your-project-id]
Public URL: https://kick-bot-production.up.railway.app
GitHub: https://github.com/glitch-lang/kick-bot
```

---

## 🔄 **Future Updates**

When you make changes:

```bash
# 1. Make your changes
# 2. Commit
git add .
git commit -m "Your update message"

# 3. Push
git push origin main

# 4. Railway auto-deploys! 🎉
```

**No manual redeployment needed!**

---

## 🚨 **Troubleshooting**

### **Bot Not Starting?**

**Check logs:**
1. Railway → Deployments → View logs

**Common issues:**
- Missing environment variables
- Wrong `ROOT_DIRECTORY` (should be `discord-bot`)

**Fix:**
1. Go to Settings → Root Directory → Set to `discord-bot`
2. Go to Variables → Add missing variables
3. Click "Redeploy" in Deployments tab

---

### **Build Failed?**

**Error:** "No build script found"

**Fix:**
1. Verify Root Directory is `discord-bot`
2. Check that `railway.json` is in `discord-bot/` folder

---

### **Watch Party Not Loading?**

**Error:** "Cannot access watch party"

**Fix:**
1. Check `PUBLIC_URL` in Variables matches your Railway domain
2. Restart deployment
3. Create new watch party

---

### **Database Issues?**

**Issue:** Database resets on deploy

**Solution:** Add Railway Volume (optional)

1. Settings → Volumes
2. Add volume: `/app/data`
3. Update database path to `/app/data/bot.db`

---

## 💰 **Cost Monitoring**

### **Free Tier:**
- $5/month in credits
- ~500 hours of runtime
- Perfect for hobby use

### **Monitor Usage:**
1. Railway dashboard → View usage
2. Set spending limits in settings
3. Get alerts when approaching limit

**Typical usage:** $5-10/month for 24/7 bot

---

## 📊 **What's Different from Local?**

| Feature | Local + Tunnel | Railway |
|---------|---------------|---------|
| **URL** | Changes daily | Permanent ✅ |
| **Uptime** | PC must run | 24/7 ✅ |
| **Speed** | Depends | Fast ✅ |
| **Features** | Same ✅ | Same ✅ |
| **Formatting** | Same ✅ | Same ✅ |
| **Multi-stream** | Yes ✅ | Yes ✅ |

---

## ✅ **Confirmation Checklist**

Before you finish, verify:

- [ ] Railway account created
- [ ] Project connected to GitHub
- [ ] Root directory set to `discord-bot`
- [ ] Environment variables added
- [ ] Domain generated
- [ ] `PUBLIC_URL` updated with Railway domain
- [ ] Deployment succeeded
- [ ] Bot responds in Discord
- [ ] Watch party URL uses Railway domain

---

## 🎊 **Success!**

Your bot is now:
- 🌍 **Public** - Anyone can access watch parties
- ⏰ **24/7** - Always online
- 🔗 **Permanent URL** - Never changes
- 🚀 **Auto-updating** - Push to GitHub = auto-deploy
- 👥 **Multi-stream** - Unlimited simultaneous parties
- 🎨 **Same look** - Identical formatting to local

**Share your watch parties with the world!** 🎉

---

## 📚 **Additional Resources**

- **Railway Docs:** https://docs.railway.app
- **Your GitHub:** https://github.com/glitch-lang/kick-bot
- **Railway Dashboard:** https://railway.app/dashboard

---

## 🆘 **Need Help?**

**Common commands:**
```bash
# View Railway logs
railway logs

# Redeploy
railway up

# Check status
railway status
```

**Or check:**
- Railway logs in dashboard
- GitHub Actions (if set up)
- Bot logs in Discord (DM yourself)

---

## 🎮 **Ready to Deploy?**

**Go to: https://railway.app and follow the steps above!**

Your code is ready. Your GitHub is updated. All you need to do is connect Railway and deploy! 🚀

**Time estimate:** 5-10 minutes from start to finish.

**You got this!** 💪
