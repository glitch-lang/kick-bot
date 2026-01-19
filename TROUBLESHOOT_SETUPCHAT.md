# Troubleshooting !setupchat Not Working

## 🔍 Why !setupchat Might Not Work

The bot needs to be **connected to your channel** to hear the `!setupchat` command. Here are common issues:

---

## ✅ Check These First

### 1. Is BOT_ACCESS_TOKEN Set?
- Railway Dashboard → Variables
- Make sure `BOT_ACCESS_TOKEN` is set
- Should be a long token string

### 2. Is BOT_USERNAME Set?
- Railway Dashboard → Variables
- Make sure `BOT_USERNAME` is set
- Should be your bot account's Kick username

### 3. Is Bot Account Added to Channel?
- Go to your Kick channel settings
- Add the bot account as a moderator
- Or give it permission to send messages

### 4. Check Railway Logs
Railway Dashboard → Logs

Look for:
- ✅ "Pusher connected for channel: yourchannel"
- ✅ "Subscribed to Pusher channel: chatroom.XXX"
- ❌ "Error connecting to Pusher" - Connection issue
- ❌ "Could not get channel info" - Channel not found

---

## 🔧 Common Issues & Fixes

### Issue 1: Bot Not Connected to Channel

**Problem:** Bot only connects to registered channels, but you need it connected to register!

**Solution:** The bot should auto-connect when you type `!setupchat`, but if it doesn't:

1. **Check Railway Logs** for connection errors
2. **Verify channel name** - Make sure you're using the correct channel slug
3. **Try manual connection** - The bot should connect automatically when it receives a message

### Issue 2: Bot Can't Send Messages

**Problem:** Bot receives `!setupchat` but can't respond.

**Check:**
- `BOT_ACCESS_TOKEN` is valid (not expired)
- Bot account has permission to send messages in your channel
- Token has `chat:write` scope

**Fix:**
- Get a new token from `/api/bot/token`
- Update `BOT_ACCESS_TOKEN` in Railway
- Wait for redeploy

### Issue 3: Channel Not Found

**Problem:** "Could not get channel info"

**Check:**
- Channel slug is correct (usually your username)
- Channel exists on Kick.com
- Channel is public (not private)

**Fix:**
- Verify your channel URL: `https://kick.com/yourchannelname`
- Use the exact channel name (case-sensitive)

### Issue 4: Pusher Connection Failed

**Problem:** Bot can't connect to Kick's WebSocket

**Check Railway Logs for:**
- "Pusher error"
- "Connection failed"
- Network errors

**Possible Causes:**
- Railway network issues
- Kick API issues
- Firewall blocking WebSocket

**Fix:**
- Wait a few minutes and try again
- Check Kick's status
- Restart Railway service

---

## 🧪 Debug Steps

### Step 1: Check Bot is Running
1. Railway Dashboard → Logs
2. Look for: "Kick Bot started"
3. Should see: "Database initialized successfully"

### Step 2: Check Bot Can Connect
1. Railway Logs
2. Look for: "Connecting to channel: yourchannel"
3. Should see: "Pusher connected for channel: yourchannel"

### Step 3: Test Bot Token
1. Visit: `https://web-production-56232.up.railway.app/api/bot/token`
2. Should get a token (not an error)
3. If error, fix credentials first

### Step 4: Check Channel Name
1. Your Kick channel URL: `https://kick.com/yourchannelname`
2. Use `yourchannelname` (the part after `/`)
3. Make sure it matches exactly

### Step 5: Try Again
1. In your Kick chat, type: `!setupchat`
2. Wait a few seconds
3. Check if bot responds

---

## 🆘 Still Not Working?

### Check Railway Logs in Real-Time

1. Railway Dashboard → Logs
2. Keep it open
3. Type `!setupchat` in your chat
4. Watch the logs for:
   - Message received
   - Connection attempts
   - Errors

### Manual Registration Alternative

If `!setupchat` won't work, you can register via OAuth:

1. Visit: `https://web-production-56232.up.railway.app/auth/kick`
2. Log in with your Kick account
3. Authorize the app
4. Your channel will be registered automatically

---

## 📋 Quick Checklist

- [ ] `BOT_ACCESS_TOKEN` set in Railway ✅
- [ ] `BOT_USERNAME` set in Railway
- [ ] Bot account exists on Kick.com
- [ ] Bot added to your channel (moderator/permissions)
- [ ] Channel name is correct
- [ ] Railway service is running (check Logs)
- [ ] Bot connected to Pusher (check Logs)
- [ ] Typed `!setupchat` in chat
- [ ] Waited a few seconds for response
- [ ] Checked Railway Logs for errors

---

**Most common issue: Bot not connected to channel. Check Railway Logs to see if Pusher connection succeeded!**
