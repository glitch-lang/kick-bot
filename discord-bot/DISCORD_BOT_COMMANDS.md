# 🤖 Discord Bot Commands - Complete Guide

## Bot Name: Kick Party#4763

Your Discord bot is currently **ONLINE** and ready to use!

---

## 📋 All Available Commands

All commands start with `!kick`

---

## 💬 **Messaging Commands**

### 1. Send Message to Kick Streamer

**Command:**
```
!kick message <streamer> <your message>
```

**Examples:**
```
!kick message realglitchdyeet Hey! Want to collab?
!kick message partnerjohn Love your stream!
```

**What happens:**
1. Your message is sent to the Kick streamer's chat
2. Bot replies: ✅ Message sent to **streamer** on Kick! They can respond with !reply
3. Streamer sees your message in their Kick chat
4. Streamer can reply with `!reply <message>` in their Kick chat
5. You'll see their reply in Discord!

**Requirements:**
- Streamer must be registered (used `!setupchat` on Kick)
- You must be in a Discord text channel

---

## 📺 **Watch Party Commands**

### 2. Watch a Kick Streamer

**Command:**
```
!kick watch <streamer>
```

**Example:**
```
!kick watch realglitchdyeet
```

**What happens:**
1. Bot confirms: 📺 Now watching **streamer**
2. When streamer goes live, bot posts @everyone notification with:
   - Stream title
   - Viewer count
   - Thumbnail image
   - Link to stream
3. Notification happens once per stream (no spam)

**Perfect for:**
- Setting up watch parties
- Getting notified when your favorite streamers go live
- Community stream watching

---

### 3. Stop Watching

**Command:**
```
!kick unwatch
```

**What happens:**
- Stops watching the current streamer in this channel
- No more live notifications

---

## 📊 **Info Commands**

### 4. See Who's Live

**Command:**
```
!kick online
```

**What it shows:**
- Which registered streamers are currently live
- Their viewer counts
- Stream titles
- Links to their streams

**Example response:**
```
🔴 LIVE STREAMERS

🎮 realglitchdyeet
   👥 342 viewers
   🎬 Amazing gameplay session!
   🔗 https://kick.com/realglitchdyeet

🎮 partnerjohn
   👥 156 viewers
   🎬 Chill vibes tonight
   🔗 https://kick.com/partnerjohn
```

---

### 5. List All Streamers

**Command:**
```
!kick streamers
```

**What it shows:**
- All registered Kick streamers
- Their usernames
- Whether they're online/offline

---

### 6. Help Command

**Command:**
```
!kick help
```

**What it shows:**
- This command list
- Quick examples
- Command categories

---

## 🎯 **Quick Start Guide**

### Step 1: Test the Bot
```
!kick help
```
Bot should respond with command list ✅

### Step 2: See Available Streamers
```
!kick streamers
```
Shows all streamers you can message ✅

### Step 3: Send Your First Message
```
!kick message realglitchdyeet Hello from Discord!
```
Message is sent to Kick! ✅

### Step 4: Set Up a Watch Party
```
!kick watch realglitchdyeet
```
You'll get notified when they go live! ✅

---

## 📝 **Full Command Reference**

| Command | What It Does | Example |
|---------|-------------|---------|
| `!kick message <streamer> <msg>` | Send message to Kick streamer | `!kick message jerzy Hey!` |
| `!kick watch <streamer>` | Get notified when they go live | `!kick watch jerzy` |
| `!kick unwatch` | Stop watching current streamer | `!kick unwatch` |
| `!kick online` | See who's currently live | `!kick online` |
| `!kick streamers` | List all registered streamers | `!kick streamers` |
| `!kick help` | Show command list | `!kick help` |

---

## 💡 **Example Scenarios**

### Scenario 1: Send Message & Get Reply

**You (Discord):**
```
!kick message realglitchdyeet Want to collab on a stream?
```

**Bot:**
```
✅ Message sent to realglitchdyeet on Kick! They can respond with !reply
```

**Streamer sees in Kick chat:**
```
📨 @YourName from Discord: "Want to collab on a stream?" | Reply: !reply <your message>
```

**Streamer types in Kick:**
```
!reply Yeah let's do it! DM me on Twitter
```

**You see in Discord:**
```
💬 Response from realglitchdyeet
Yeah let's do it! DM me on Twitter
```

---

### Scenario 2: Watch Party

**Setup:**
```
!kick watch realglitchdyeet
```

**Bot:**
```
📺 Now watching realglitchdyeet - I'll notify this channel when they go live!
```

**When stream goes live:**
```
@everyone

🔴 realglitchdyeet is now LIVE!
Amazing gameplay session!
👥 Viewers: 342

[Stream Thumbnail Image]
🔗 https://kick.com/realglitchdyeet
```

---

### Scenario 3: Check Who's Live

**You:**
```
!kick online
```

**Bot shows:**
```
🔴 LIVE STREAMERS (2)

🎮 realglitchdyeet - 342 viewers
   "Amazing gameplay!"
   https://kick.com/realglitchdyeet

🎮 partnerjohn - 156 viewers  
   "Chill vibes"
   https://kick.com/partnerjohn

📴 OFFLINE (1)
• anotherstreamer
```

---

## 🔧 **Troubleshooting**

### Bot doesn't respond

**Check:**
1. ✅ Is bot online? (green dot next to name)
2. ✅ Does bot have "Read Messages" permission?
3. ✅ Are you using `!kick` prefix?
4. ✅ Are you in a text channel?

**Fix:**
- Restart bot: Check terminal where it's running
- Re-invite bot with proper permissions
- Try `!kick help` to test

---

### "Streamer not found" error

**Cause:** Streamer hasn't registered with the bot yet

**Solution:** 
Streamer needs to type in their Kick chat:
```
!setupchat
```

---

### Watch notifications not working

**Check:**
1. ✅ Did you run `!kick watch <streamer>`?
2. ✅ Does bot have "Mention Everyone" permission?
3. ✅ Is streamer registered?

**Note:** Bot checks every 60 seconds, so there may be a slight delay

---

### Message not reaching Kick

**Check:**
1. ✅ Is Kick bot running on Railway? (check https://web-production-56232.up.railway.app/health)
2. ✅ Did streamer register with `!setupchat`?
3. ✅ Is streamer's name spelled correctly?

**Test:**
```
!kick streamers
```
This shows all available streamers

---

## ⚙️ **Bot Status**

**Current Status:** ✅ ONLINE  
**Bot Name:** Kick Party#4763  
**Prefix:** `!kick`  
**API:** https://web-production-56232.up.railway.app  
**Database:** Local SQLite (with persistent storage)

---

## 🎮 **Try It Now!**

Copy and paste these commands in your Discord:

```
!kick help
!kick streamers
!kick online
!kick message realglitchdyeet Hello from Discord!
!kick watch realglitchdyeet
```

---

## 🚀 **Advanced Usage**

### Multiple Watch Channels

You can set up different channels to watch different streamers:

**#kick-jerzy channel:**
```
!kick watch jerzy
```

**#kick-glitch channel:**
```
!kick watch realglitchdyeet
```

Each channel gets notifications for their watched streamer only!

---

### Cross-Platform Conversations

1. Send message from Discord → Kick
2. Streamer replies in Kick → Discord
3. Back and forth messaging works!
4. Perfect for collaborations and community building

---

## 📞 **Support**

### Common Questions

**Q: Can I message multiple streamers at once?**  
A: No, one streamer per command. But you can send multiple commands!

**Q: Do streamers see who sent the message?**  
A: Yes! They see your Discord username.

**Q: Can I watch multiple streamers?**  
A: One per channel. Use multiple Discord channels for multiple streamers.

**Q: Is there a cooldown?**  
A: No Discord-side cooldown. Kick streamers can set their own cooldowns.

**Q: Can I send images/links?**  
A: Text only for now. Images/embeds coming soon!

---

**Your Discord bot is ready to use! Try `!kick help` now!** 🎉
