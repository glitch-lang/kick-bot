# Debug !setupchat - Check These

## 🔍 What to Check in Railway Logs

After you type `!setupchat` in your chat, check Railway Logs for these messages:

### ✅ Good Signs (Bot is Working)
- `!setupchat received from @yourusername in channel: yourchannel`
- `Getting channel info for: yourchannel`
- `Channel info retrieved: {...}`
- `Creating streamer entry for: yourchannel`
- `Streamer created with ID: X`
- `Sending success message to channel: yourchannel`

### ❌ Bad Signs (Bot Has Issues)
- **No messages at all** → Bot not connected to channel
- `Could not get channel info` → Channel name wrong or channel doesn't exist
- `BOT_ACCESS_TOKEN not set!` → Token missing in Railway
- `Error setting up chat:` → Something went wrong
- `Pusher error` → WebSocket connection failed

---

## 🚨 Most Common Issue: Bot Not Connected

**Problem:** Bot only connects to **registered** channels, but you need it connected to register!

**Check Railway Logs for:**
- `Connecting to channel: yourchannel` - Should see this
- `Pusher connected for channel: yourchannel` - Should see this
- `Subscribed to Pusher channel: chatroom.XXX` - Should see this

**If you DON'T see these:**
- Bot isn't connected to your channel
- Bot can't hear `!setupchat`

---

## 🔧 Quick Fixes

### Fix 1: Check Bot Token
1. Visit: `https://web-production-56232.up.railway.app/api/bot/token`
2. Should get a token (not an error)
3. If error, fix credentials

### Fix 2: Check Channel Name
- Your Kick URL: `https://kick.com/yourchannelname`
- Use `yourchannelname` (the part after `/`)
- Make sure it's correct and case-sensitive

### Fix 3: Check Railway Variables
- `BOT_ACCESS_TOKEN` - Must be set
- `BOT_USERNAME` - Must be set
- `KICK_CLIENT_ID` - Must be set
- `KICK_CLIENT_SECRET` - Must be set

### Fix 4: Try Manual Registration
If `!setupchat` won't work, use OAuth:
1. Visit: `https://web-production-56232.up.railway.app/auth/kick`
2. Log in and authorize
3. Channel will be registered automatically

---

## 📋 What to Tell Me

When asking for help, include:
1. **What you see in Railway Logs** when you type `!setupchat`
2. **Any error messages** in the logs
3. **Your channel name** (the slug)
4. **Whether bot is added to your channel** (moderator/permissions)

---

**Check Railway Logs first - that will tell us exactly what's wrong!**
