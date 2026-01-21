# 🤖 Auto Watch Party Feature Guide

## Overview

The **Auto Watch Party** feature automatically creates watch parties when your favorite streamers go live! No more manually checking if they're online - the bot does it for you and posts the watch party link in Discord.

---

## 🚀 Quick Setup

### **Step 1: Make Your Watch Party Public**

By default, watch parties use `http://localhost:3001` which only works on your PC.

**Choose a tunneling solution:**

#### **Option A: ngrok (Easiest)**
```powershell
# Terminal 1: Start ngrok
C:\ngrok\ngrok.exe http 3001

# Copy the URL (e.g., https://abc123.ngrok-free.app)
```

#### **Option B: Cloudflare Tunnel (Free Forever)**
```powershell
C:\cloudflared.exe tunnel --url http://localhost:3001
```

#### **Option C: LocalTunnel**
```powershell
lt --port 3001 --subdomain crosstalk
```

### **Step 2: Set Public URL**

Add to `discord-bot/.env`:
```env
PUBLIC_URL=https://abc123.ngrok-free.app
```

### **Step 3: Restart Bot**
```powershell
# Stop bot (Ctrl+C)
npm start
```

### **Step 4: Add Auto Watch Party**

In Discord:
```
!kick autoparty add bbjess
```

### **Step 5: Wait for Streamer to Go Live**

When bbjess goes live:
- ✅ Watch party is automatically created
- ✅ Link is posted to Discord with @here ping
- ✅ Everyone can click and join!

---

## 📋 **Commands**

### **Add Auto Watch Party**
```
!kick autoparty add <streamer>
!kick autoparty add <streamer> relay
```

**Examples:**
```
!kick autoparty add bbjess
!kick autoparty add realglitchdyeet relay
```

**With `relay`:** Messages in watch party will be sent to Kick chat

### **Remove Auto Watch Party**
```
!kick autoparty remove <streamer>
```

**Example:**
```
!kick autoparty remove bbjess
```

### **List Auto Watch Parties**
```
!kick autoparty list
!kick autoparty
```

Shows all streamers configured for auto watch parties in your server.

---

## 🎬 **How It Works**

### **The Process:**

```
1. Bot checks if streamers are live (every 2 minutes)
        ↓
2. bbjess goes live!
        ↓
3. Bot detects: bbjess offline → online
        ↓
4. Bot creates watch party automatically
        ↓
5. Bot posts to Discord channel with @here
        ↓
6. Users click link and join watch party
        ↓
7. When bbjess goes offline, bot detects it
        ↓
8. Next time they go live, process repeats!
```

### **Smart Detection:**

- ✅ Only creates party when streamer **transitions** from offline to live
- ✅ Won't spam multiple parties if already live
- ✅ Won't create party if one already exists in that channel
- ✅ Tracks each streamer's live status

---

## 📺 **What Gets Posted to Discord**

When a streamer goes live, Discord receives:

```
@here

🔴 bbjess is now LIVE!

Watch Party Auto-Created!

🔗 Join here: https://abc123.ngrok-free.app/party/xyz789

Stream Info:
📺 Title: Just Chatting and Gaming
🎮 Category: Gaming
👥 Viewers: 1,234

Features:
🎥 Synchronized video + audio
💬 Shared chat
👥 See who's watching

📺 Watch on Kick: https://kick.com/bbjess

Auto-created watch party • Use !kick endparty to end
```

---

## 🎯 **Use Cases**

### **Use Case 1: Streamer Notification Server**
```
Goal: Notify when specific streamers go live
Setup: 
  !kick autoparty add streamer1
  !kick autoparty add streamer2
  !kick autoparty add streamer3
Result: All 3 get auto watch parties when live
```

### **Use Case 2: Community Server**
```
Goal: Auto watch parties for partnered streamers
Setup:
  !kick autoparty add mainstrea mer relay
Result: Watch party + messages relay to Kick
```

### **Use Case 3: Multiple Servers**
```
Goal: Different streamers in different servers
Server 1: !kick autoparty add streamer1
Server 2: !kick autoparty add streamer2
Result: Each server gets their own auto parties
```

---

## ⚙️ **Configuration Options**

### **Per-Streamer Settings:**

| Setting | Command | Description |
|---------|---------|-------------|
| **Basic** | `add <streamer>` | Auto-create watch party |
| **With Relay** | `add <streamer> relay` | Auto-create + enable Kick relay |

### **Channel-Specific:**

Each auto watch party is tied to:
- ✅ Specific Discord channel (where you ran the command)
- ✅ Specific streamer
- ✅ Specific guild/server

### **Example:**

```
#general channel: !kick autoparty add bbjess
→ Watch parties for bbjess post in #general

#streaming channel: !kick autoparty add xqc
→ Watch parties for xqc post in #streaming
```

---

## 🔍 **Monitoring & Logs**

### **Bot Console Output:**

```
🔍 Checking 3 auto watch party configurations...
🟢 bbjess went live! Creating auto watch party...
🎬 Created watch party abc123 for bbjess (relay: false)
✅ Posted watch party for bbjess in channel 123456789
```

### **When Streamer Goes Offline:**

```
🔴 bbjess went offline
```

### **Check Interval:**

Bot checks every **2 minutes** for live status changes.

---

## 🛠️ **Advanced Setup**

### **Multiple Channels, Same Streamer:**

You can have the same streamer in multiple channels:

```
#general: !kick autoparty add bbjess
#gaming: !kick autoparty add bbjess relay
```

Result: Two separate watch parties will be created in different channels!

### **Auto-Cleanup:**

When you remove an auto watch party:
```
!kick autoparty remove bbjess
```

- ✅ Removed from database
- ✅ Bot stops checking for this streamer (in this server)
- ⚠️ Does NOT end existing watch parties

---

## 📊 **Resource Usage**

### **Network:**

- **Check interval:** Every 2 minutes
- **API calls:** 1 per streamer per check
- **Example:** 5 auto watch parties = 5 API calls every 2 minutes

### **Performance:**

- ✅ Very lightweight
- ✅ Doesn't impact bot performance
- ✅ Scales to hundreds of streamers

---

## 🚨 **Troubleshooting**

### **Watch Party Not Created**

**Possible causes:**
1. Streamer is actually offline
2. Bot didn't detect live transition
3. Watch party already exists in channel

**Check:**
```
!kick autoparty list  # Verify streamer is added
!kick online          # Check if streamer is live manually
```

### **Link Doesn't Work for Others**

**Problem:** Using localhost URL

**Solution:**
1. Set up ngrok or similar tunneling
2. Add PUBLIC_URL to .env
3. Restart bot

### **Not Getting @here Ping**

**Check:** Discord channel permissions
- Bot needs "Mention Everyone" permission

---

## 🎮 **Full Example Workflow**

### **Scenario: Gaming Community**

```
# Step 1: Set up tunneling
C:\ngrok\ngrok.exe http 3001
→ Get URL: https://abc123.ngrok-free.app

# Step 2: Configure bot
Add to .env: PUBLIC_URL=https://abc123.ngrok-free.app
Restart bot

# Step 3: Add favorite streamers
!kick autoparty add shroud relay
!kick autoparty add pokimane
!kick autoparty add xqc relay

# Step 4: Wait for them to go live
→ Bot checks every 2 minutes
→ When shroud goes live, watch party is created
→ @here notification in Discord
→ Community clicks link and joins
→ Watch together with synced video/audio!

# Step 5: Manage
!kick autoparty list  # See all configured
!kick autoparty remove xqc  # Remove one
```

---

## 📈 **Best Practices**

### **1. Use Descriptive Channels**

```
✅ #watch-parties: Auto watch parties here
✅ #streamer-live: Notifications here
❌ #general: Mixed with other chat
```

### **2. Don't Over-Add**

```
✅ Add 3-5 favorite streamers
❌ Add 50+ streamers (spam risk)
```

### **3. Use Relay Wisely**

```
✅ Enable relay for partnered streamers
✅ Enable relay for interactive streams
❌ Enable relay for every streamer
```

### **4. Test First**

```
1. Add one streamer
2. Wait for them to go live
3. Verify watch party works
4. Add more streamers
```

---

## 🔗 **Related Features**

| Feature | Command | Use Case |
|---------|---------|----------|
| **Manual Watch Party** | `!kick watchparty <streamer>` | Create on-demand |
| **Voice Streaming** | `!kick stream <streamer>` | Audio only to Discord |
| **Direct Message** | `!kick message @streamer` | Send message to Kick chat |

---

## ✅ **Quick Checklist**

Before using auto watch parties:

- [ ] Tunneling set up (ngrok/Cloudflare/LocalTunnel)
- [ ] PUBLIC_URL configured in .env
- [ ] Bot restarted after .env change
- [ ] Bot has "Mention Everyone" permission
- [ ] Added at least one auto watch party
- [ ] Tested with a streamer who's online

---

## 🎉 **You're Ready!**

Your bot will now automatically create watch parties when streamers go live!

**Try it:**
```
!kick autoparty add <your_favorite_streamer>
```

Wait for them to go live and watch the magic happen! ✨
