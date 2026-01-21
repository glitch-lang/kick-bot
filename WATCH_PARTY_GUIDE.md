# 🎬 Watch Party Feature Guide

## Overview

The Watch Party feature creates a **synchronized web-based experience** where Discord users can watch Kick streams together with:
- 🎥 **Live video + audio** (perfectly synced from Kick)
- 💬 **Shared chat** (Discord users can chat together)
- 👥 **Viewer list** (see who's watching)
- 🔄 **Real-time updates**

---

## 🚀 Quick Start

### **1. Create a Watch Party**

In Discord, type:
```
!kick watchparty bbjess
```

The bot will reply with a link like:
```
http://localhost:3001/party/abc123xyz
```

### **2. Join the Watch Party**

1. Click the link from Discord
2. Enter your Discord username
3. Start watching!

### **3. End the Watch Party**

```
!kick endparty
```

---

## 💬 How Chat Works

### **Discord ↔ Kick Chat Flow**

#### **Current Implementation:**

**Discord → Kick (Direct Message)**
```
You in Discord: !kick message @bbjess Hey!
↓
Kick streamer sees: "[Discord] YourName: Hey!"
↓
Streamer replies in Kick: !reply @YourName Thanks!
↓
You see in Discord: @YourName Thanks!
```

**Watch Party Chat (Discord Only)**
```
User opens watch party page
↓
Types message in web chat
↓
Message appears for all watch party viewers
↓
(Kick streamer does NOT see these messages)
```

#### **What's Different:**

| Feature | Direct Message | Watch Party Chat |
|---------|---------------|------------------|
| **Kick streamer sees it** | ✅ Yes | ❌ No |
| **Discord users see it** | ✅ Yes (in Discord) | ✅ Yes (on web page) |
| **Where it appears** | Kick chat + Discord | Web page only |
| **Purpose** | Talk TO streamer | Talk ABOUT stream with friends |

---

## 🎯 Use Cases

### **Scenario 1: Private Watch Party**
```
You and friends want to watch a stream together
→ Use !kick watchparty
→ Chat together on the web page
→ Streamer doesn't see your messages
```

### **Scenario 2: Public Engagement**
```
You want the streamer to see your message
→ Use !kick message @streamer in Discord
→ Message goes to Kick chat
→ Streamer can reply
```

### **Scenario 3: Both!**
```
Watch party is running
→ Someone uses !kick message @streamer
→ Streamer replies
→ Reply shows up in Discord channel
→ Everyone in watch party sees it too!
```

---

## 🔧 How It Works Technically

### **Architecture:**

```
┌─────────────┐
│   Discord   │
│    User     │
└──────┬──────┘
       │ 1. Types: !kick watchparty bbjess
       ↓
┌─────────────┐
│ Discord Bot │
└──────┬──────┘
       │ 2. Creates party ID: abc123
       │ 3. Starts web server on port 3001
       ↓
┌─────────────┐
│ Watch Party │ ← http://localhost:3001/party/abc123
│  Web Page   │
└──────┬──────┘
       │ 4. Embeds Kick stream
       │ 5. Connects to Socket.IO
       ↓
┌─────────────┐
│ Kick.com    │ ← Video + Audio (perfectly synced!)
│   Stream    │
└─────────────┘
```

### **Synchronization:**

- **Video + Audio:** Comes directly from Kick embed (native sync)
- **No Discord voice needed:** Everything streams from Kick
- **Chat:** Real-time via Socket.IO WebSockets
- **Viewer updates:** Live updates when users join/leave

---

## 📋 Commands Summary

| Command | Description | Example |
|---------|-------------|---------|
| `!kick watchparty <streamer>` | Create web watch party | `!kick watchparty bbjess` |
| `!kick endparty` | End active watch party | `!kick endparty` |
| `!kick message @streamer <msg>` | Send message TO Kick streamer | `!kick message @bbjess Hi!` |
| `!kick stream <streamer>` | Audio-only to Discord voice | `!kick stream bbjess` |

---

## 🎨 Watch Party Features

### **On the Web Page:**

1. **Video Player**
   - Native Kick embed
   - Full screen support
   - Quality auto-adjusts

2. **Chat Tab**
   - See messages from all viewers
   - Type messages to other viewers
   - Timestamps on all messages

3. **Viewers Tab**
   - See who's currently watching
   - Live viewer count
   - Join/leave notifications

---

## 🌐 Local vs VPS Deployment

### **Current Setup (Local):**
```
URL: http://localhost:3001/party/abc123
✅ Works on your PC
❌ Only you can access it
❌ Stops when you close laptop
```

### **VPS Deployment:**
```
URL: https://yourdomain.com/party/abc123
✅ Anyone can access
✅ Works 24/7
✅ Shareable link
```

To deploy to VPS, the watch party server will automatically use your server's public IP instead of localhost.

---

## 🔐 Privacy & Security

### **What Watch Party Viewers Can See:**
- ✅ Kick stream (video + audio)
- ✅ Chat messages from other watch party viewers
- ✅ Usernames of other viewers
- ❌ Your Discord messages (unless you post in watch party chat)
- ❌ Private Discord conversations

### **What Kick Streamer Can See:**
- ❌ Watch party chat messages
- ❌ Who's in the watch party
- ✅ Only messages sent via `!kick message`

---

## 🚨 Troubleshooting

### **"Watch party not found" error**
- Party may have ended
- Check if bot is running: `!kick help`
- Create new party: `!kick watchparty <streamer>`

### **Can't hear audio**
- Audio comes from Kick embed, not Discord
- Check Kick player volume (bottom right of player)
- Ensure browser isn't muted

### **Chat not updating**
- Refresh the page
- Check internet connection
- Ensure you entered a username

### **Link doesn't work**
- Only works on your local PC (for now)
- Deploy to VPS for shareable links
- Make sure bot is running

---

## 🎯 Next Steps

### **To Make It Work for Everyone:**

1. **Deploy to VPS** (follow `VPS_DEPLOYMENT_GUIDE.md`)
2. **Get a domain** (e.g., `watchparty.yoursite.com`)
3. **Set up HTTPS** (using Let's Encrypt/Certbot)
4. **Update bot** to use public URL instead of localhost

Then your watch party links will look like:
```
https://watchparty.yoursite.com/party/abc123
```

And **anyone** can join! 🎉

---

## 📊 Comparison: Watch Party vs Voice Streaming

| Feature | Watch Party | Voice Streaming |
|---------|-------------|-----------------|
| **Platform** | Web browser | Discord voice |
| **Video** | ✅ Yes | ❌ No |
| **Audio** | ✅ Yes (from Kick) | ✅ Yes (from bot) |
| **Sync** | Perfect (native) | Good (~2-3s delay) |
| **Chat** | ✅ Shared chat | ❌ No chat |
| **Accessibility** | Anyone with link | Discord members only |
| **Setup** | 1 command | 1 command + join voice |

---

## ✨ Features Coming Soon

- [ ] Kick chat relay (see actual Kick chat in watch party)
- [ ] Discord chat relay (watch party messages → Discord)
- [ ] Multiple watch parties per server
- [ ] Party chat moderation tools
- [ ] Viewer reactions/emotes
- [ ] Stream highlights/clips
- [ ] Watch party history/analytics

---

## 💡 Pro Tips

1. **For Best Experience:**
   - Use Chrome/Edge browser
   - Good internet connection (5+ Mbps)
   - Close other tabs to save resources

2. **For Streamers:**
   - Share watch party link in Discord
   - Pin the watch party message
   - Use `!kick message` for direct streamer engagement

3. **For Viewers:**
   - Enter your Discord name for recognition
   - Use chat to discuss with other viewers
   - Full screen the player for immersive experience

---

## 🎉 Enjoy Your Watch Parties!

You now have a fully synchronized, web-based watch party system that brings your Discord community together to watch Kick streams!

**Try it now:**
```
!kick watchparty bbjess
```

Happy watching! 🍿🎬
