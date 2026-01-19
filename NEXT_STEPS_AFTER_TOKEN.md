# Next Steps After Getting Bot Token

## ✅ What You've Done
- Got App Access Token from `/api/bot/token`
- Added `BOT_ACCESS_TOKEN` to Railway Variables

---

## 📋 Next Steps

### Step 1: Set BOT_USERNAME

1. **Railway Dashboard → Variables**
2. **Add/Update:** `BOT_USERNAME`
3. **Value:** Your bot account's Kick username
   - This is the username of the bot account you created on Kick.com
   - Example: `CrossStreamBot`, `KickMessengerBot`, etc.

**Why?** The bot needs to know its own username to respond properly.

---

### Step 2: Create Bot Account on Kick (If Not Done)

1. Go to [kick.com](https://kick.com)
2. **Create a new account** (separate from your personal account)
3. Choose a username (e.g., `CrossStreamBot`)
4. **Remember this username** - this is your `BOT_USERNAME`

---

### Step 3: Add Bot to Your Kick Channel

You need to add the bot as a moderator or give it permission to send messages:

#### Option A: Add as Moderator
1. Go to your Kick channel
2. Channel Settings → Moderators
3. Add the bot account (the `BOT_USERNAME` you set)
4. Give it permission to send messages

#### Option B: Chat Command (If Bot Can Auto-Join)
1. Make sure bot account exists on Kick.com
2. The bot may auto-join your channel
3. Type in chat: `!setupchat`

---

### Step 4: Register Your Channel

Once the bot is in your channel:

1. **In your Kick chat, type:**
   ```
   !setupchat
   ```

2. **Bot should respond:**
   ```
   ✅ Channel registered! Your command is: !yourchannelname | Default cooldown: 60s | Use !cooldownchat <seconds> to change.
   ```

3. **Your channel is now registered!**

---

### Step 5: Test the Bot

#### Test 1: Check Bot Commands
In any registered channel's chat, type:
```
!streamers
```
Should list all registered streamers.

#### Test 2: Send a Message
In another streamer's chat (if they're registered), type:
```
!yourchannelname Hello!
```
Should send a message to your channel.

#### Test 3: Check Online Status
In any chat, type:
```
!online
```
Should show which streamers are currently live.

#### Test 4: Set Cooldown
In your channel's chat, type:
```
!cooldownchat 120
```
Sets cooldown to 120 seconds (2 minutes).

---

## 🎯 Quick Checklist

- [ ] `BOT_ACCESS_TOKEN` added to Railway Variables ✅
- [ ] `BOT_USERNAME` added to Railway Variables (your bot's Kick username)
- [ ] Bot account created on Kick.com
- [ ] Bot added to your channel (moderator or has permissions)
- [ ] Typed `!setupchat` in your channel
- [ ] Bot responded with success message
- [ ] Tested `!streamers` command
- [ ] Tested `!online` command
- [ ] Set cooldown with `!cooldownchat`

---

## 🆘 Troubleshooting

### Bot Doesn't Respond to !setupchat

**Check:**
1. Is `BOT_ACCESS_TOKEN` set correctly in Railway?
2. Is `BOT_USERNAME` set correctly in Railway?
3. Is the bot account added to your channel?
4. Does the bot have permission to send messages?
5. Check Railway Logs for errors

### Bot Not Sending Messages

**Check Railway Logs:**
- Railway Dashboard → Logs
- Look for errors when bot tries to send messages
- Check if token has `chat:write` scope

### Bot Can't Connect to Chat

**Check:**
1. Railway Logs for Pusher connection errors
2. Make sure bot account exists and is valid
3. Verify `BOT_ACCESS_TOKEN` is valid (not expired)

---

## 🚀 You're Ready!

Once you've completed these steps:
- ✅ Bot is registered
- ✅ Your channel has a command (`!yourchannelname`)
- ✅ Viewers can message you
- ✅ You can respond with `!respond <id> <message>`
- ✅ Cooldowns prevent spam

**Enjoy your cross-streamer bot!**
