# 🌐 Multi-Server Webhook System Guide

## Overview

The CrossTalk bot now supports **unlimited Discord servers** with a per-channel webhook system! Each Discord channel can have its own webhook, allowing Kick streamers to reply directly to that specific channel.

---

## 🎯 **How It Works**

### **The Problem We Solved:**
- ❌ **Before**: One webhook URL in `.env` → only worked for ONE Discord channel
- ✅ **After**: Webhooks stored in database → works for UNLIMITED Discord channels/servers!

### **The Flow:**
```
1. Discord User: "!kick message realglitchdyeet hey"
   └─> Discord bot stores webhook URL + sends to Kick

2. Kick Streamer: "!reply what's up?"
   └─> Kick bot looks up stored webhook URL
   └─> Sends reply to THE EXACT Discord channel

3. Discord Channel: Receives reply from Kick! ✅
```

---

## 📋 **Setup Instructions (Per Discord Channel)**

### **Step 1: Create a Webhook in Your Discord Channel**

1. **Right-click the Discord channel** where you want to receive Kick replies
2. Click **"Edit Channel"**
3. Go to **"Integrations"** tab
4. Click **"Webhooks"** → **"New Webhook"** (or "Create Webhook")
5. **Copy the Webhook URL** (it looks like: `https://discord.com/api/webhooks/123456789/abc...`)

### **Step 2: Register the Webhook with CrossTalk**

In the Discord channel, run:
```
!kick setupwebhook https://discord.com/api/webhooks/YOUR_WEBHOOK_URL_HERE
```

You'll see:
```
✅ Webhook set up successfully!

Kick streamers can now reply to your messages in this channel using !reply or !respond commands.
```

### **Step 3: Test It!**

1. Send a message to a Kick streamer:
   ```
   !kick message realglitchdyeet test message
   ```

2. Have the Kick streamer reply:
   ```
   !reply got your message!
   ```

3. **Reply appears in your Discord channel!** ✅

---

## 🔧 **Managing Webhooks**

### **Check if Webhook is Set Up:**
Try sending a message. If no webhook is configured, you'll see:
```
⚠️ Webhook not set up!

To receive replies from Kick streamers in this channel, you need to set up a webhook first.

[Instructions provided...]
```

### **Update a Webhook:**
Just run `!kick setupwebhook <new_url>` again. It will replace the old one.

### **Remove a Webhook:**
```
!kick removewebhook
```

---

## 🌍 **Multi-Server Support**

### **How Many Servers Can Use CrossTalk?**
**UNLIMITED!** ✨

Each Discord server, and even each channel within a server, can have its own webhook.

### **Example Setup:**

**Server 1 - "Gaming Squad"**
- `#kick-chat` → Webhook A → Receives replies here
- `#streamers` → Webhook B → Receives replies here

**Server 2 - "Streamer Community"**
- `#general` → Webhook C → Receives replies here
- `#vip-chat` → Webhook D → Receives replies here

**All work independently and simultaneously!**

---

## 🗄️ **Database Structure**

### **Discord Bot Database (`discord-bot.db`)**
```sql
CREATE TABLE discord_webhooks (
  discord_channel_id TEXT PRIMARY KEY,
  webhook_url TEXT NOT NULL,
  guild_id TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **Kick Bot Database (`kick-bot.db`)**
```sql
-- message_requests table includes:
discord_channel_id TEXT,      -- Which Discord channel sent the message
discord_webhook_url TEXT,     -- The webhook URL for that specific channel
```

---

## 🔐 **Security & Privacy**

### **Webhook URL Security:**
- ✅ Webhook URLs are stored **encrypted in the database**
- ✅ Only accessible by the bot
- ✅ Never exposed in logs or API responses
- ✅ Each webhook is channel-specific (not server-wide)

### **Who Can Set Up Webhooks?**
- Anyone with **"Manage Channel"** or **"Manage Webhooks"** permissions in Discord
- Typically: Server admins, moderators, or channel owners

### **Can Others See My Webhook?**
- ❌ No! Webhook URLs are never displayed after setup
- ✅ Only stored securely in the database

---

## 🚨 **Troubleshooting**

### **"Webhook not set up" Warning:**
**Solution:** Run `!kick setupwebhook <url>` in that channel.

### **Replies Not Appearing:**
1. **Check webhook is set up:** Try sending a message - if you see the warning, webhook is missing
2. **Verify webhook URL is valid:** It should start with `https://discord.com/api/webhooks/`
3. **Check webhook still exists:** Go to Discord channel settings → Integrations → Webhooks. If deleted, create a new one and re-register.
4. **Check permissions:** The webhook needs permission to send messages in that channel

### **Multiple Servers Using Same Webhook:**
⚠️ **Don't do this!** Each channel should have its own unique webhook. If multiple channels share a webhook, replies will go to ALL of them.

**Solution:** Create a separate webhook for each channel.

### **Webhook URL Changed:**
If you regenerated or deleted a webhook in Discord, run:
```
!kick setupwebhook <new_webhook_url>
```

---

## 📊 **Commands Summary**

| Command | Description | Example |
|---------|-------------|---------|
| `!kick setupwebhook <url>` | Set up webhook for this channel | `!kick setupwebhook https://discord.com/api/webhooks/...` |
| `!kick removewebhook` | Remove webhook from this channel | `!kick removewebhook` |
| `!kick message <streamer> <msg>` | Send message to Kick streamer | `!kick message jerzy hey!` |
| `!kick help` | Show all commands | `!kick help` |

---

## 🎓 **For Server Admins**

### **Best Practices:**

1. **Dedicated Channel:** Create a dedicated `#kick-chat` channel for CrossTalk messages
2. **Pin Instructions:** Pin a message with webhook setup instructions
3. **Manage Webhooks:** Regularly check Discord Integrations to see active webhooks
4. **Multiple Channels:** You can set up webhooks in multiple channels for different purposes

### **Webhook Naming:**
When creating webhooks in Discord, name them clearly:
- ✅ "CrossTalk - Kick Replies"
- ✅ "CrossTalk Bot"
- ❌ "Webhook #1" (confusing if you have multiple)

---

## 🆘 **Need Help?**

If you're still having issues:

1. Check the bot logs (if you're self-hosting)
2. Verify the Kick bot and Discord bot are both running
3. Make sure the Kick streamer is registered in CrossTalk
4. Test with `!kick streamers` to see available streamers

---

## 🚀 **What's Next?**

With multi-server webhooks working, you can now:

- ✅ Use CrossTalk in unlimited Discord servers
- ✅ Set up multiple channels per server
- ✅ Receive Kick replies in the correct channels
- ✅ Scale to as many communities as you want!

**Ready to test voice streaming?** Check out `DISCORD_STREAM_WATCH_PARTIES.md` for the next feature! 🎧
