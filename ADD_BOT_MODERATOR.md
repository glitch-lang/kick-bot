# How to Add Bot as Moderator

## 🤖 Step-by-Step Guide

### Step 1: Get Your Bot Username

1. **Railway Dashboard → Variables**
2. Find `BOT_USERNAME`
3. **Copy the value** (e.g., `CrossStreamBot`)

**If `BOT_USERNAME` is not set:**
- You need to create a bot account on Kick.com first
- Then add the username to Railway Variables

---

### Step 2: Add Bot to Your Channel

#### Option A: Via Kick Dashboard (Recommended)

1. **Go to your Kick channel**
   - Visit: `https://kick.com/yourchannelname`
   - Or go to: `https://kick.com/dashboard`

2. **Go to Channel Settings**
   - Click your profile → **Settings**
   - Or go to: `https://kick.com/dashboard/settings`

3. **Find "Moderators" Section**
   - Look for "Moderators" or "Chat Moderators"
   - Click "Add Moderator" or "Manage Moderators"

4. **Add Bot Account**
   - Enter your bot's username (from `BOT_USERNAME`)
   - Click "Add" or "Save"

5. **Give Permissions**
   - Make sure bot can **send messages**
   - Bot doesn't need ban/timeout permissions (unless you want that)

#### Option B: Via Chat (If You're Owner)

1. **In your Kick chat**, type:
   ```
   /mod BOT_USERNAME
   ```
   Replace `BOT_USERNAME` with your actual bot username

2. **Bot should be added as moderator**

---

### Step 3: Verify Bot is Added

1. **Check Moderator List**
   - Go to channel settings → Moderators
   - You should see your bot username listed

2. **Check Chat**
   - Bot might appear in the moderator list in chat
   - Or you'll see it when it sends messages

---

### Step 4: Test Bot

1. **In your Kick chat**, type:
   ```
   !setupchat
   ```

2. **Bot should respond:**
   ```
   ✅ Channel registered! Your command is: !yourchannelname | Default cooldown: 60s
   ```

---

## 🆘 Troubleshooting

### Bot Not Responding to !setupchat

**Check:**
1. Is `BOT_USERNAME` set in Railway Variables?
2. Is `BOT_ACCESS_TOKEN` set in Railway Variables?
3. Is bot added as moderator?
4. Does bot have permission to send messages?
5. Check Railway Logs for errors

### Bot Can't Send Messages

**Check:**
1. Bot account exists on Kick.com
2. Bot is added as moderator
3. Bot has "Send Messages" permission
4. `BOT_ACCESS_TOKEN` is valid (not expired)

### Bot Not in Channel

**Try:**
1. Manually invite bot to channel
2. Or use `/mod BOT_USERNAME` command
3. Or add via channel settings

---

## 📋 Quick Checklist

- [ ] Created bot account on Kick.com
- [ ] Added `BOT_USERNAME` to Railway Variables
- [ ] Added `BOT_ACCESS_TOKEN` to Railway Variables
- [ ] Added bot as moderator in channel settings
- [ ] Bot has permission to send messages
- [ ] Typed `!setupchat` in chat
- [ ] Bot responded successfully

---

**Your bot username is whatever you set in Railway Variables as `BOT_USERNAME`!**
