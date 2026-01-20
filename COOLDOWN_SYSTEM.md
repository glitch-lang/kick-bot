# ⏰ Cooldown System - Complete Guide

## Overview

The bot has a comprehensive cooldown system that prevents spam and gives streamers control over message frequency.

---

## 🎯 Key Features

✅ **Per-Streamer Cooldowns** - Each streamer sets their own cooldown  
✅ **Per-User Tracking** - Cooldowns are tracked per user, not globally  
✅ **Persistent Storage** - Saved in database, survives restarts  
✅ **Customizable** - Streamers can change anytime with `!cooldownchat`  
✅ **Remaining Time Display** - Shows exactly how long to wait  
✅ **Auto-Cleanup** - Old cooldowns are automatically removed  

---

## 📊 How It Works

### Default Cooldown
- **60 seconds (1 minute)** by default
- Set when streamer runs `!setupchat`
- Stored in database permanently

### Cooldown Scope
```
User + From Channel + Target Streamer = Unique Cooldown
```

**Example:**
- `@JohnDoe` in `partnerjohn` channel → `!realglitchdyeet`
- Cooldown applies only to `@JohnDoe` messaging `realglitchdyeet` from `partnerjohn`
- `@JohnDoe` can still message OTHER streamers immediately
- Other users can message `realglitchdyeet` without waiting

---

## 🎮 Streamer Commands

### Set Custom Cooldown

**Command:**
```
!cooldownchat <seconds>
```

**Examples:**
```
!cooldownchat 30      # 30 seconds
!cooldownchat 60      # 1 minute (default)
!cooldownchat 120     # 2 minutes
!cooldownchat 300     # 5 minutes
```

**Requirements:**
- ✅ Must be the channel broadcaster (owner)
- ✅ Channel must be registered with `!setupchat`
- ✅ Value must be a positive number

**Response:**
```
@YourName ✅ Cooldown updated to 2 minutes!
```

### Check Current Cooldown

**View in confirmation messages:**
When someone sends a message, they see:
```
@User ✅ Message sent to realglitchdyeet! They can respond with !reply (Cooldown: 1 minute)
```

---

## 👥 User Experience

### Sending a Message (No Cooldown)

```
User: !realglitchdyeet hey want to collab?
Bot: @User ✅ Message sent to realglitchdyeet! They can respond with !reply (Cooldown: 1 minute)
```

### Sending Again (On Cooldown)

```
User: !realglitchdyeet another message
Bot: @User ⏰ Cooldown active! Please wait 45s before messaging realglitchdyeet again.
```

### After Cooldown Expires

```
User: !realglitchdyeet follow up message
Bot: @User ✅ Message sent to realglitchdyeet! They can respond with !reply (Cooldown: 1 minute)
```

---

## 🗄️ Database Storage

### Streamers Table
```sql
CREATE TABLE streamers (
  id INTEGER PRIMARY KEY,
  username TEXT,
  channel_name TEXT,
  cooldown_seconds INTEGER DEFAULT 60,  ← Stored here!
  is_active INTEGER,
  ...
)
```

### Cooldowns Table
```sql
CREATE TABLE cooldowns (
  id INTEGER PRIMARY KEY,
  user_id TEXT,              ← Username
  channel TEXT,              ← From which channel
  command_id TEXT,           ← Target streamer ID
  expires_at DATETIME,       ← When cooldown ends
  UNIQUE(user_id, channel, command_id)
)
```

---

## 🔧 Technical Implementation

### Setting Cooldown

```typescript
// When user sends message
const cooldownKey = `streamer_${targetStreamer.id}`;
await db.setCooldown(
  userId,                              // User who sent message
  channel,                             // Channel they sent from
  cooldownKey,                         // Target streamer
  targetStreamer.cooldown_seconds || 60  // Streamer's custom cooldown
);
```

### Checking Cooldown

```typescript
// Before allowing message
const onCooldown = await db.checkCooldown(userId, channel, cooldownKey);
if (onCooldown) {
  const remainingSeconds = await db.getRemainingCooldown(userId, channel, cooldownKey);
  // Show user how long to wait
}
```

### Auto-Cleanup

```typescript
// Runs every minute
setInterval(() => {
  db.cleanupExpiredCooldowns();  // Removes expired cooldowns
}, 60000);
```

---

## 📝 Examples by Scenario

### Scenario 1: Different Cooldowns Per Streamer

**Setup:**
```
partnerjohn:     !cooldownchat 30   (30 second cooldown)
realglitchdyeet: !cooldownchat 120  (2 minute cooldown)
```

**User Experience:**
```
User: !partnerjohn hello
Bot: ✅ Message sent! (Cooldown: 30 seconds)

[User waits 30 seconds]

User: !partnerjohn another message
Bot: ✅ Message sent! (Cooldown: 30 seconds)

User: !realglitchdyeet hey there
Bot: ✅ Message sent! (Cooldown: 2 minutes)

[User tries again after 1 minute]

User: !realglitchdyeet follow up
Bot: ⏰ Cooldown active! Please wait 1m 0s...
```

### Scenario 2: Multiple Users, No Interference

**User A:**
```
UserA: !realglitchdyeet message from A
Bot: ✅ Message sent! (Cooldown: 1 minute)
```

**User B (immediately after):**
```
UserB: !realglitchdyeet message from B
Bot: ✅ Message sent! (Cooldown: 1 minute)
```

**Result:** Both messages go through! Cooldowns are per-user.

### Scenario 3: Streamer Changes Cooldown Mid-Stream

**Initial:**
```
realglitchdyeet: !cooldownchat 60
Bot: ✅ Cooldown updated to 1 minute!
```

**User sends message:**
```
User: !realglitchdyeet test
Bot: ✅ Message sent! (Cooldown: 1 minute)
```

**Streamer changes it:**
```
realglitchdyeet: !cooldownchat 30
Bot: ✅ Cooldown updated to 30 seconds!
```

**Next user message:**
```
AnotherUser: !realglitchdyeet hello
Bot: ✅ Message sent! (Cooldown: 30 seconds)  ← New cooldown applied!
```

---

## ⚙️ Configuration Options

### Recommended Cooldowns by Use Case

| Use Case | Cooldown | Reason |
|----------|----------|--------|
| **High Traffic Stream** | 120-300s (2-5 min) | Prevent spam, manage volume |
| **Normal Stream** | 60s (1 min) | Balanced, default |
| **Small Community** | 30s (30 sec) | Encourage interaction |
| **Testing/Development** | 10-15s | Quick testing |
| **Collaborations** | 30-60s | Active conversations |

### Minimum/Maximum Values

- **Minimum:** 0 seconds (no cooldown)
- **Recommended Minimum:** 15 seconds
- **Default:** 60 seconds
- **Maximum:** No hard limit (use your judgment!)
- **Common Maximum:** 300 seconds (5 minutes)

---

## 🐛 Troubleshooting

### "Cooldown active" but I just started

**Cause:** You sent a message recently
**Solution:** Wait for the countdown to finish

### Cooldown seems stuck

**Cause:** Database issue
**Solution:** 
```bash
# Check Railway logs for errors
# Cooldowns auto-expire after their time
# Or wait 5 minutes for auto-cleanup
```

### Want to reset a user's cooldown

**Current:** Not implemented
**Workaround:** User must wait, or streamer can temporarily set `!cooldownchat 0`

### Cooldown not saving after restart

**Check:**
1. ✅ Is persistent volume set up on Railway?
2. ✅ Is `DB_PATH` environment variable set?
3. ✅ Check Railway logs for database errors

---

## 🔮 Advanced Features (Future)

Potential enhancements:

- [ ] Per-user cooldown overrides (VIPs, subs)
- [ ] Global cooldown reset command for mods
- [ ] Cooldown multipliers for different user roles
- [ ] Time-based cooldowns (longer at night, shorter during day)
- [ ] Analytics: Track cooldown effectiveness

---

## 📊 Database Queries

### View All Streamer Cooldowns

```sql
SELECT username, channel_name, cooldown_seconds 
FROM streamers 
WHERE is_active = 1
ORDER BY cooldown_seconds ASC;
```

### View Active Cooldowns

```sql
SELECT user_id, channel, command_id, expires_at
FROM cooldowns
WHERE expires_at > datetime('now')
ORDER BY expires_at ASC;
```

### Count Cooldowns Per Streamer

```sql
SELECT 
  s.username,
  COUNT(c.id) as active_cooldowns
FROM streamers s
LEFT JOIN cooldowns c ON c.command_id = 'streamer_' || s.id
WHERE c.expires_at > datetime('now')
GROUP BY s.id;
```

---

## ✅ Verification Checklist

- [x] Default cooldown (60s) set on registration
- [x] Custom cooldowns saved to database
- [x] Cooldowns persist across restarts (with volume)
- [x] Per-user cooldown tracking works
- [x] Remaining time displayed to users
- [x] Expired cooldowns auto-cleaned
- [x] Broadcaster-only cooldown changes
- [x] Cooldown shown in confirmation messages

---

## 🎯 Summary

**The cooldown system is fully implemented and working!**

✅ Streamers control their own cooldown via `!cooldownchat`  
✅ Saved permanently in database  
✅ Per-user tracking prevents spam  
✅ Shows remaining time when on cooldown  
✅ Auto-cleans expired cooldowns  
✅ Respects each streamer's preferences  

**No action needed - it's already working!** 🎉
