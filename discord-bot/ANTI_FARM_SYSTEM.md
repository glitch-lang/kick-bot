# 🛡️ Anti-Farm Points System

## Overview

The watch party system includes a sophisticated anti-farm mechanism to ensure points are only awarded to users who are genuinely watching streams.

---

## How It Works

### Client-Side (Frontend)

**Heartbeat System:**
- Sends a "heartbeat" every **60 seconds**
- Calculates a **legitimacy score** (0-100) based on:
  - **Window Focus** (+40 points): User has the Activity window focused
  - **Player Loaded** (+30 points): Kick player iframe is loaded
  - **Page Visible** (+30 points): Tab/window is visible (not minimized/background)

**Requirements:**
- Minimum legitimacy score of **60/100** required
- Must wait at least **25 seconds** between heartbeats
- 3 consecutive failures triggers a warning message

**Detection:**
```javascript
✅ Legitimate: User watching with focus = 100 score
⚠️  Suspicious: Tab in background = 60 score (borderline)
❌ Farming: Window minimized = 30 score (rejected)
```

---

### Server-Side (Backend)

**Fraud Detection Rules:**

1. **Rate Limiting**
   - Reject heartbeats < 25 seconds apart
   - Max 5 heartbeats per 5 minutes

2. **Pattern Detection**
   - All perfect scores (100/100) = likely bot
   - Average score < 65 = suspicious behavior

3. **Session Validation**
   - Must have active viewing session in party
   - Streamer name must match party
   - Discord ID must be verified

4. **Heartbeat History**
   - Tracks last 10 heartbeats per user
   - Detects burst patterns
   - Identifies automation

---

## Points Calculation

- **1 minute of watch time** per valid heartbeat
- Points = total minutes watched
- Tracked in database with timestamps
- View with `!points` command in chat

---

## Kick Iframe Configuration

**Player URL:**
```javascript
https://player.kick.com/${streamer}?autoplay=true&muted=false&parent=${domain}&parent=discord.com
```

**Why both parents?**
- `parent=${domain}` - Your Railway URL
- `parent=discord.com` - Discord's iframe domain
- Kick's player validates the parent domain

**Important:** 
- Kick may need to whitelist your Railway domain
- If player doesn't load, this is likely why
- Test with browser console for CORS errors

---

## API Endpoints

### POST `/api/heartbeat`

**Request:**
```json
{
  "partyId": "abc123",
  "streamerName": "bbjess",
  "discordId": "123456789",
  "username": "User#1234",
  "legitimacyScore": 100,
  "timestamp": 1234567890
}
```

**Response (Success):**
```json
{
  "success": true,
  "totalMinutes": 45,
  "legitimacyScore": 100
}
```

**Response (Fraud Detected):**
```json
{
  "error": "Suspicious activity detected",
  "reason": "Heartbeats too frequent"
}
```

---

## Fraud Detection Thresholds

| Check | Threshold | Reason |
|-------|-----------|--------|
| Heartbeat Gap | < 25 seconds | Too frequent |
| Legitimacy Score | < 60 | Not focused/visible |
| Average Score | < 65 | Consistently suspicious |
| Burst Rate | > 6 in 5 min | Automation detected |
| Perfect Pattern | 5x 100 scores | Likely bot |

---

## Testing Anti-Farm

### ✅ Legitimate Use (Should Work):
1. Open Activity in Discord
2. Keep window focused
3. Wait 60 seconds
4. Check logs: `💗 Heartbeat: ... Score: 100/100`

### ❌ Farming Attempts (Should Fail):
1. **Minimize window** → Score too low
2. **Background tab** → Score too low
3. **Rapid clicks** → Rate limited
4. **Multiple windows** → Burst detected

---

## Console Commands

**Check your stats:**
```
!points
!stats
```

**Output:**
```
📊 **Username** | Session: 15m | Total: 45m | Points: 45 💎
```

---

## Future Enhancements

Possible improvements:

1. **Stream Status Check**
   - Verify stream is actually live
   - Detect if stream goes offline

2. **Engagement Metrics**
   - Track chat participation
   - Bonus points for active viewers

3. **Machine Learning**
   - Train model on farming patterns
   - Adaptive fraud detection

4. **Rewards System**
   - Spend points on perks
   - Leaderboards
   - Achievements

---

## Security Notes

- **Don't trust the client**: All validation happens server-side
- **Heartbeat history**: Stored in memory, resets on server restart
- **Database**: Session times persisted for long-term tracking
- **Discord ID**: Required for points tracking (prevents anonymous farming)

---

## Troubleshooting

**"⚠️ Activity detected as idle"**
- Keep the Activity window focused
- Don't minimize or switch tabs
- Ensure Discord app has focus

**"Heartbeat failed: 429"**
- You're sending heartbeats too frequently
- System detected farming behavior
- Wait 60 seconds and try again

**"No active viewing session"**
- You left the watch party
- Rejoin the party to resume tracking

---

## Related Files

- **Frontend**: `discord-bot/public/activity.html` (lines 709-811)
- **Backend**: `discord-bot/src/watch-party-server.ts` (heartbeat endpoint & fraud detection)
- **Database**: `discord-bot/src/database.ts` (session tracking)
