# 📤 Watch Party → Kick Chat Relay Feature

## Overview

The Watch Party Relay feature allows messages sent in the **watch party web chat** to be forwarded to the **Kick streamer's chat**. This bridges your private watch party with the public Kick stream!

---

## 🎯 How It Works

### **Without Relay (Default):**
```
User types in watch party: "This is amazing!"
↓
Message appears in watch party chat only
❌ Kick streamer does NOT see it
```

### **With Relay Enabled:**
```
User types in watch party: "This is amazing!"
↓
Message appears in watch party chat
↓
Bot sends to Kick API
↓
Appears in Kick chat as: "[Watch Party] Username: This is amazing!"
✅ Kick streamer SEES it!
```

---

## 🚀 Usage

### **Method 1: Enable During Creation**

Create a watch party WITH relay enabled:
```
!kick watchparty bbjess relay
```

This will:
- ✅ Create the watch party
- ✅ Enable Kick chat relay immediately
- 📤 All messages go to Kick chat

### **Method 2: Toggle After Creation**

Create a watch party normally:
```
!kick watchparty bbjess
```

Then enable relay:
```
!kick relayon
```

Or disable it:
```
!kick relayoff
```

---

## 📋 Commands

| Command | Description | Example |
|---------|-------------|---------|
| `!kick watchparty <streamer>` | Create watch party (relay OFF) | `!kick watchparty bbjess` |
| `!kick watchparty <streamer> relay` | Create with relay ON | `!kick watchparty bbjess relay` |
| `!kick relayon` | Enable relay for active party | `!kick relayon` |
| `!kick relayoff` | Disable relay for active party | `!kick relayoff` |
| `!kick endparty` | End watch party | `!kick endparty` |

---

## 💬 Message Format

### In Watch Party Chat:
```
Username: This is a great stream!
```

### In Kick Chat (what streamer sees):
```
[Watch Party] Username: This is a great stream!
```

The `[Watch Party]` prefix helps the streamer identify where the message came from!

---

## 🎨 Visual Indicators

### **In Discord:**

When you create a watch party with relay:
```
🎬 Watch Party Created: bbjess

Features:
🎥 Live Kick stream (video + audio)
💬 Shared chat with Discord
👥 See who's watching
🔄 Perfect synchronization
📤 Messages relay to Kick chat ✅

Use !kick relayoff to disable Kick relay • !kick endparty to end
```

### **On Web Page:**

When relay is enabled, you'll see:
- 📤 **Kick Relay** badge in header (green background)
- System message: "📤 Kick chat relay is ENABLED - your messages will appear in the streamer's Kick chat!"

---

## 🔄 Full Workflow Example

### **Step 1: Create Watch Party with Relay**
```
Discord User: !kick watchparty bbjess relay
Bot: 🎬 Watch Party Created: bbjess
     📤 Messages relay to Kick chat ✅
     🔗 Join here: http://localhost:3001/party/abc123
```

### **Step 2: Users Join Web Page**
```
Users open link → Enter Discord username → Join watch party
```

### **Step 3: Users Chat**
```
Alice types: "Love the gameplay!"
↓
Appears in watch party: "Alice: Love the gameplay!"
↓
Sent to Kick chat: "[Watch Party] Alice: Love the gameplay!"
```

### **Step 4: Streamer Sees & Responds**
```
Streamer sees in Kick chat: "[Watch Party] Alice: Love the gameplay!"
Streamer types: !reply @Alice Thanks for watching!
↓
Reply appears in Discord: @Alice Thanks for watching!
↓
Reply also appears in watch party chat!
```

---

## 🔐 Privacy & Control

### **Who Sees What?**

| Message Location | Relay OFF | Relay ON |
|------------------|-----------|----------|
| Watch party chat | ✅ Visible | ✅ Visible |
| Kick chat | ❌ Hidden | ✅ Visible |
| Discord channel | ❌ Hidden | ❌ Hidden* |

*Watch party chat messages DON'T appear in Discord channel, only on the web page

### **Streamer Replies:**

When a streamer uses `!reply`, the message goes to:
- ✅ Discord channel (where original message was sent)
- ✅ Watch party chat (if relay is enabled)

---

## 🎯 Use Cases

### **Use Case 1: Public Watch Party**
```
Scenario: Community watch party, want streamer to see engagement
Solution: Create with relay enabled
Command: !kick watchparty bbjess relay
Result: All watch party messages go to Kick chat
```

### **Use Case 2: Private Watch Party**
```
Scenario: Friends watching together, discussing privately
Solution: Create without relay (default)
Command: !kick watchparty bbjess
Result: Watch party chat stays private
```

### **Use Case 3: Mixed Approach**
```
Scenario: Start private, then want to engage with streamer
Solution: Create normally, enable relay later
Commands: 
  !kick watchparty bbjess
  (later) !kick relayon
Result: Can control when messages are public
```

---

## 🔧 Technical Details

### **Message Flow with Relay:**

```
Watch Party Web Page
        ↓
  Socket.IO (WebSocket)
        ↓
Watch Party Server
        ↓
   Kick Bot API
        ↓
    Kick Chat
```

### **API Endpoint:**

The watch party server sends messages to:
```
POST https://your-kick-bot-api.com/api/chat/send
{
  "channel": "bbjess",
  "message": "[Watch Party] Username: Message text"
}
```

---

## ⚠️ Important Notes

1. **Relay is PER Watch Party:**
   - Each watch party has its own relay setting
   - Creating a new party resets to default (OFF)
   - Use `relay` parameter to enable on creation

2. **Message Prefix:**
   - All relayed messages have `[Watch Party]` prefix
   - Cannot be removed (helps streamer identify source)
   - Format: `[Watch Party] Username: Message`

3. **Requires Kick Bot API:**
   - Relay only works if Kick bot is running
   - Messages fail silently if API is down
   - Check bot logs for relay confirmation

4. **One-Way Relay:**
   - Watch party → Kick: ✅ Works
   - Kick → Watch party: ❌ Not automatic
   - Use `!reply` for streamer responses

---

## 📊 Comparison: Direct Message vs Watch Party Relay

| Feature | `!kick message` | Watch Party Relay |
|---------|----------------|-------------------|
| **Who sends it** | Discord user | Watch party viewer |
| **Where typed** | Discord channel | Watch party web page |
| **Appears in Kick** | ✅ Yes | ✅ Yes (if enabled) |
| **Message format** | `[Discord] User: Msg` | `[Watch Party] User: Msg` |
| **Streamer can reply** | ✅ Yes (`!reply`) | ✅ Yes (`!reply`) |
| **Purpose** | Direct engagement | Group discussion + engagement |

---

## 🚨 Troubleshooting

### **Messages Not Appearing in Kick**

**Possible Causes:**
1. Relay not enabled → Run `!kick relayon`
2. Kick bot API down → Check if Kick bot is running
3. Streamer name wrong → Verify streamer name in party

**Check:**
```
- Look for 📤 badge on web page
- Check bot logs for "Relayed message to Kick"
- Verify Kick bot is responding to API calls
```

### **Can't Enable Relay**

**Error:** "No active watch party in this channel!"

**Solution:**
1. Create watch party first: `!kick watchparty <streamer>`
2. Then enable relay: `!kick relayon`

### **Relay Badge Not Showing**

**Fix:** Refresh the web page after enabling relay

---

## ✨ Future Enhancements

Planned features:
- [ ] Two-way relay (Kick chat → Watch party)
- [ ] Custom message prefixes
- [ ] Relay toggle from web page
- [ ] Message filtering/moderation
- [ ] Relay rate limiting
- [ ] Multiple watch parties with different relay settings

---

## 🎉 Get Started!

Try it now:

### **Basic Watch Party:**
```
!kick watchparty bbjess
```

### **With Kick Relay:**
```
!kick watchparty bbjess relay
```

### **Toggle Relay:**
```
!kick relayon
!kick relayoff
```

Enjoy bridging your watch parties with Kick streams! 🎬📤
