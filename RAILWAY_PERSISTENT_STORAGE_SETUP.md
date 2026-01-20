# 💾 Railway Persistent Storage Setup

## Problem
By default, Railway's filesystem is **ephemeral** - it gets wiped on every restart!  
This means your SQLite database (with all registered streamers) is lost on restarts.

## Solution: Add Persistent Volume

### Step 1: Create Volume in Railway

1. Go to your Railway project dashboard
2. Click on your bot service
3. Go to the **"Variables"** tab
4. Scroll down to **"Volumes"** section
5. Click **"+ New Volume"**
6. Configure:
   - **Mount Path:** `/app/data`
   - **Size:** 1GB (more than enough for SQLite)
7. Click **"Add"**

### Step 2: Set Environment Variable

1. Still in the **"Variables"** tab
2. Add a new variable:
   - **Key:** `DB_PATH`
   - **Value:** `/app/data/kickbot.db`
3. Click **"Add"**

### Step 3: Deploy

1. Click **"Deploy"** or wait for auto-deploy
2. Your database will now persist between restarts!

---

## Verify It's Working

### Test 1: Register a Streamer
1. Go to a Kick channel
2. Type: `!setupchat`
3. Bot responds: ✅ Channel registered!

### Test 2: Restart Bot
1. In Railway dashboard, click **"Redeploy"**
2. Wait for bot to restart
3. Go to the same Kick channel
4. The bot should still be connected and remember the streamer!

### Test 3: Check Logs
Look for this in Railway logs:
```
Loading 3 streamers...
Connecting to channel: partnerjohn
Connecting to channel: realglitchdyeet
Connecting to channel: anotherstreamer
```

If you see your streamers loading, it's working! ✅

---

## Alternative: Use PostgreSQL (Production Recommended)

For larger deployments, consider using PostgreSQL instead of SQLite:

### Why PostgreSQL?
- Better for production
- Built-in Railway integration
- No volume setup needed
- Better concurrent access
- Automatic backups

### How to Switch

1. **Add PostgreSQL to Railway:**
   - Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
   - Railway will create database and add `DATABASE_URL` variable

2. **Update Code:**
   - Install: `npm install pg`
   - Update `database.ts` to use PostgreSQL instead of SQLite

3. **Migrate Data:**
   - Export from SQLite
   - Import to PostgreSQL

---

## Current Setup Summary

✅ **Database Location:** `/app/data/kickbot.db`  
✅ **Volume Mount:** `/app/data`  
✅ **Persists:** Streamers, messages, cooldowns, commands  

---

## Troubleshooting

### Streamers Lost After Restart?

**Check if volume is mounted:**
```bash
# In Railway logs, you should see:
Connecting to channel: [streamer names]
```

**If you see:**
```
Loading 0 streamers...
```

Then the database is empty. Check:
1. Is volume created in Railway?
2. Is `DB_PATH` environment variable set?
3. Is mount path `/app/data`?

### Permission Errors?

Railway volumes have correct permissions by default. If you see permission errors:
1. Check that `DB_PATH` points to `/app/data/kickbot.db`
2. Verify the volume mount path is exactly `/app/data`

---

## What Gets Saved

With persistent storage, these persist between restarts:

✅ **Registered Streamers**
- Username
- Channel name
- Access tokens (encrypted)
- Cooldown settings

✅ **Message History**
- All cross-streamer messages
- Replies and responses
- Timestamps

✅ **Cooldowns**
- User cooldowns per command
- Prevents spam across restarts

✅ **Commands**
- Custom streamer commands
- Channel point costs
- Target streamers

---

**Questions? Check Railway logs for any database-related errors!**
