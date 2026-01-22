# 🎮 How Discord Activities Actually Work

## The Correct Mental Model

Discord Activities are **client-side web applications** that run in the user's browser, not on your server.

```
User Opens Activity
     ↓
Discord loads your HTML in an iframe
     ↓
Your HTML loads Kick player iframe (via Discord's proxy)
     ↓
Kick player runs in USER'S BROWSER
     ↓
Everything happens client-side ✅
```

---

## ❌ What We Were Doing Wrong

```
User → Discord Activity → Your Server (Railway) → Kick API
                                                    ↓
                                                  403 ❌
```

We were trying to connect to Kick's API from **Railway's server** to implement "two-way chat relay". This:
- **Gets blocked** (cloud IPs are flagged)
- **Is unnecessary** (Kick chat loads in the player)
- **Is not how Activities work**

---

## ✅ How It Should Work

```
User's Browser:
├── Discord Client
└── Activity iframe (your HTML)
    ├── Kick player iframe
    │   └── Has built-in chat ✅
    └── Socket.IO → Your Server
        └── Discord party chat only ✅
```

**Key Points:**
- Kick player loads **in the user's browser**
- No server-side Kick API calls needed
- Your server only handles Discord party coordination
- Discord's URL mapping proxies the Kick URLs

---

## 🎯 Real Examples: How Other Activities Work

### YouTube Together
```html
<iframe src="/.proxy/youtube/embed/VIDEO_ID"></iframe>
```
- Loads YouTube player in user's browser
- No backend YouTube API calls
- Just coordinates which video to play

### Watch Together (Netflix, etc.)
- Embeds video player client-side
- Backend only syncs play/pause state
- Never calls Netflix API from server

### Poker Night
- Game logic runs client-side in iframe
- Backend only handles multiplayer state
- No calls to external poker APIs

---

## 🔧 Our Implementation

### What Your Server Does:
1. **Serves the Activity HTML** (`activity.html`)
2. **Handles party coordination** (who's in the party, chat messages)
3. **Tracks points** (heartbeat system, anti-farm)
4. **Socket.IO for real-time** (viewer updates, Discord party chat)

### What Your Server Does NOT Do:
1. ~~Connect to Kick's API~~
2. ~~Fetch Kick chat messages~~
3. ~~Send messages to Kick~~
4. ~~Load Kick streams~~

All of that happens **client-side** via the embedded iframes!

---

## 📋 Discord URL Mappings (How Client-Side Loading Works)

### Setup in Discord Developer Portal:

| Prefix | Target | What It Does |
|--------|--------|--------------|
| `/` | `https://your-railway-app.com` | Your Activity HTML |
| `/kick-player` | `https://player.kick.com` | Proxies Kick player |
| `/kick-chat` | `https://kick.com/popout` | Proxies Kick chat |

### How It Works:

**In your HTML:**
```html
<iframe src="/.proxy/kick-player/username"></iframe>
```

**Discord transforms it to:**
```
User's Browser loads: https://player.kick.com/username
```

**Result:**
- User's browser makes the request (not your server)
- Kick sees a normal user browsing
- No 403 errors! ✅

---

## 🎨 Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ User's Browser (Discord Client)                         │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Discord Activity (iframe)                          │ │
│  │                                                    │ │
│  │  ┌──────────────────┐  ┌──────────────────────┐  │ │
│  │  │ Kick Player      │  │ Discord Party Chat   │  │ │
│  │  │ (/.proxy/player) │  │ (Socket.IO)          │  │ │
│  │  │                  │  │                      │  │ │
│  │  │ • Stream video   │  │ • Party messages     │  │ │
│  │  │ • Built-in chat  │  │ • Viewer list        │  │ │
│  │  │ • Controls       │  │ • Points display     │  │ │
│  │  └──────────────────┘  └──────────────────────┘  │ │
│  │           ↓                       ↓               │ │
│  │     Kick's servers          Your Railway Server  │ │
│  │     (direct from browser)   (WebSocket)          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 What Happens When User Launches Activity

1. **User clicks "Launch Activity" in Discord**
2. **Discord loads your URL** (`/.proxy/` → Railway)
3. **Your server sends `activity.html`**
4. **User's browser renders the HTML**
5. **Browser loads Kick player** (`/.proxy/kick-player/streamer`)
   - Discord proxies → `https://player.kick.com/streamer`
   - Loaded directly in user's browser
   - Kick sees normal user, not a bot ✅
6. **Browser connects to your server** (Socket.IO for party chat)
7. **Everything works!** 🎉

---

## 🔑 Key Takeaways

### For Discord Activities:

1. **Think client-side first**
   - iframe loads in user's browser
   - Your server just coordinates

2. **Use Discord's URL mapping**
   - Let Discord proxy external resources
   - No server-side API calls needed

3. **Your server's job:**
   - Serve the HTML
   - Handle party state
   - WebSocket coordination
   - Points tracking

4. **Not your server's job:**
   - Fetching from third-party APIs
   - Loading video streams
   - Managing external chat

### This is Why:

- **YouTube Together** doesn't call YouTube API from backend
- **Watch Together** doesn't call Netflix API from backend
- **Poker Night** doesn't need external poker APIs

They all work **client-side** with backend just coordinating multiplayer state!

---

## 🚀 Our Final Implementation

### Server (Railway):
```typescript
// ✅ DO: Coordinate party state
app.post('/api/create-party', (req, res) => {
  const partyId = createWatchParty(streamer, guild, isActivity: true);
  res.json({ partyId });
});

// ✅ DO: Handle WebSocket for Discord party chat
io.on('connection', (socket) => {
  socket.on('join-party', handleJoin);
  socket.on('chat-message', handleMessage);
});

// ✅ DO: Track points
app.post('/api/heartbeat', validateHeartbeat);

// ❌ DON'T: Call Kick API
// if (isActivity) {
//   // Skip this! Player loads client-side
//   connectToKickChat(streamer); // Causes 403
// }
```

### Client (`activity.html`):
```html
<!-- ✅ Kick player loads in user's browser -->
<iframe src="/.proxy/kick-player/streamer"></iframe>

<!-- ✅ Socket.IO to your server for party coordination -->
<script>
  const socket = io();
  socket.emit('join-party', { partyId, username });
</script>
```

---

## ✅ Result

- **No 403 errors** (no server-side Kick API calls)
- **Stream works** (loads in user's browser)
- **Chat works** (embedded in Kick player)
- **Points work** (server-side tracking)
- **Party coordination works** (Socket.IO)

**This is exactly how Discord Activities are meant to work!** 🎉
