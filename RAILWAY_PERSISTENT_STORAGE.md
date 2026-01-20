# 🗄️ Railway Persistent Storage Setup

## Problem

By default, Railway containers are **ephemeral** - when they restart, any local files (like your SQLite database) are deleted. This means:
- ❌ Streamer registrations lost on restart
- ❌ Message history deleted
- ❌ Watch party configurations gone
- ❌ Have to re-register every time

## Solution: Persistent Volumes

Railway offers **persistent volumes** that survive container restarts!

---

## 🚀 Setup Instructions

### Step 1: Add Volume in Railway Dashboard

1. **Go to Railway Dashboard**: https://railway.app
2. **Select your project** (kick-bot)
3. **Click on your service**
4. Go to **"Settings"** tab
5. Scroll to **"Volumes"** section
6. Click **"+ Add Volume"**

### Step 2: Configure Volume

**Mount Path:** `/app/data`

**Volume Name:** `kickbot-database` (or any name you like)

Click **"Add"**

### Step 3: Set Environment Variable

Still in Railway Dashboard:

1. Go to **"Variables"** tab
2. Add new variable:
   ```
   DB_PATH=/app/data/kickbot.db
   ```
3. Click **"Add"**

### Step 4: Redeploy

Railway will automatically redeploy with the new configuration.

**That's it!** Your database will now persist across restarts! 🎉

---

## 📊 How It Works

### Before (Ephemeral):

```
Container starts
    ↓
Creates /app/data/kickbot.db
    ↓
Streamer registers
    ↓
Container restarts
    ↓
❌ Database deleted!
```

### After (Persistent):

```
Container starts
    ↓
Mounts /app/data volume
    ↓
Uses /app/data/kickbot.db
    ↓
Streamer registers
    ↓
Container restarts
    ↓
✅ Database still there!
```

---

## 🔍 Verify It's Working

### Test 1: Register a Streamer

1. Go to: https://web-production-56232.up.railway.app/auth/kick
2. Authorize your channel
3. Check: https://web-production-56232.up.railway.app/api/streamers
   - Should show your channel

### Test 2: Force Restart

1. In Railway Dashboard → **"Deployments"** tab
2. Click **"Restart"** on your current deployment
3. Wait for restart
4. Check: https://web-production-56232.up.railway.app/api/streamers
   - ✅ Should STILL show your channel!

**If it's gone** → Volume not set up correctly, check steps above

---

## 📝 Configuration Details

### Environment Variables

Your Railway project should have:

```env
# Database (persistent storage)
DB_PATH=/app/data/kickbot.db

# Kick OAuth
KICK_CLIENT_ID=your_kick_client_id
KICK_CLIENT_SECRET=your_kick_client_secret
KICK_REDIRECT_URI=https://web-production-56232.up.railway.app/auth/kick/callback

# Bot Account
BOT_ACCESS_TOKEN=your_bot_access_token
BOT_USERNAME=CrossTalk

# Server
PORT=3000
WEBHOOK_BASE_URL=https://web-production-56232.up.railway.app

# Admin (for viewing bot token)
ADMIN_PASSWORD=your_secure_password
```

### Volume Configuration

| Setting | Value |
|---------|-------|
| Mount Path | `/app/data` |
| Volume Name | `kickbot-database` |
| Size | 1GB (default, more than enough) |

---

## 💾 Database Location

### Local Development:
```
C:\Users\willc\kick-bot\data\kickbot.db
```

### Railway Production:
```
/app/data/kickbot.db (persisted across restarts)
```

---

## 🔧 Troubleshooting

### Database still getting deleted?

**Check:**
1. ✅ Volume added in Railway Dashboard?
2. ✅ Mount path is `/app/data`?
3. ✅ `DB_PATH=/app/data/kickbot.db` in environment variables?
4. ✅ Redeployed after adding volume?

**Common mistakes:**
- ❌ Wrong mount path (must be `/app/data` exactly)
- ❌ Forgot to set `DB_PATH` environment variable
- ❌ Didn't redeploy after adding volume

### How to check logs:

Railway Dashboard → **"Logs"** tab

Look for:
```
Database initialized successfully
Loading N streamers...
```

If `N > 0`, database is working!

---

## 📦 Volume Limits

### Railway Free Tier:
- ✅ 1GB storage (plenty for SQLite)
- ✅ Persists indefinitely
- ✅ Backed up automatically

### What uses space:
- Database file: ~100KB - 10MB (depending on usage)
- Plenty of room for thousands of messages!

---

## 🗑️ Backup Your Database (Optional)

### Download Database from Railway:

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login:
   ```bash
   railway login
   ```

3. Link to project:
   ```bash
   railway link
   ```

4. Download database:
   ```bash
   railway run cat /app/data/kickbot.db > backup.db
   ```

**Or use Railway's built-in backups** (Pro plan)

---

## 🎯 Success Checklist

- [ ] Volume added in Railway Dashboard
- [ ] Mount path: `/app/data`
- [ ] `DB_PATH` environment variable set
- [ ] Redeployed
- [ ] Registered streamer
- [ ] Restarted container
- [ ] Streamer still shows in `/api/streamers`

Once all checked, your database is persistent! 🎉

---

## 🔄 Migration (if already have data)

If you already have streamers registered but didn't use volumes:

### Option 1: Re-register (Simple)
Just go through OAuth again - takes 30 seconds

### Option 2: Migrate Database (Advanced)
1. Download current database (if possible)
2. Set up volume
3. Upload database to volume
4. Restart

**Option 1 is easier!** Just re-register through the web dashboard.

---

## 📚 Additional Resources

- Railway Volumes Docs: https://docs.railway.app/reference/volumes
- SQLite Best Practices: https://www.sqlite.org/bestpractice.html

---

**Your database will now survive all restarts, redeployments, and updates!** 🚀
