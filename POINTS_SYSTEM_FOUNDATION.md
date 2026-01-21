# 🎮 Watch Party Points System - Foundation Complete!

## ✅ What's Been Implemented

Your Discord bot now **automatically tracks** Discord users who join watch parties! This is the foundation for a future points/rewards system.

---

## 🔍 How It Works

### **1. Discord User Joins Watch Party**

When a user clicks the personalized Discord link:
```
https://your-railway-url.app/party/abc123?discord=SIGNED_TOKEN
```

The system:
1. ✅ **Verifies** the Discord token (username + ID)
2. ✅ **Auto-fills** their Discord username
3. ✅ **Captures** their Discord ID
4. ✅ **Tracks** when they join
5. ✅ **Saves** viewing session to database

**User sees:**
```
✅ Welcome YourName! (Verified from Discord) 🎮 Points tracking enabled!
```

---

### **2. System Tracks Watch Time**

While the user watches:
- ✅ Session is **active** in the database
- ✅ Join time is recorded
- ✅ Discord ID is stored

**Railway logs show:**
```
👤 YourName (Discord: 123456789) joined watch party: streamer_name 🎮
💾 Saved viewing session for YourName (123456789) watching streamer_name
```

---

### **3. User Leaves / Closes Tab**

When the user leaves:
- ✅ System **calculates** watch time in minutes
- ✅ **Updates** the database with end time
- ✅ **Stores** total watch time

**Railway logs show:**
```
👋 YourName (Discord: 123456789) left watch party after 42 minutes 🎮
💾 Updated viewing session: 42 minutes watched
```

---

## 💾 Database: `viewing_sessions` Table

All viewing data is automatically saved:

| Field | Description |
|-------|-------------|
| `id` | Unique session ID |
| `party_id` | Which watch party |
| `discord_user_id` | User's Discord ID ✅ |
| `username` | User's Discord username |
| `streamer_name` | Which Kick streamer |
| `joined_at` | When they joined |
| `left_at` | When they left |
| `watch_time_minutes` | Total minutes watched |

**Example data:**
```sql
id: 1
party_id: "abc123"
discord_user_id: "463251183262109798"
username: "GamerDude"
streamer_name: "xqc"
joined_at: "2026-01-21T05:30:00Z"
left_at: "2026-01-21T06:12:00Z"
watch_time_minutes: 42
```

---

## 📊 Available Queries (Already Implemented!)

### **Get User's Total Watch Time**
```typescript
const stats = await db.getUserWatchTime("463251183262109798");
// Returns: { totalMinutes: 420, sessions: 10 }
```

### **Get Streamer's Total Views**
```typescript
const stats = await db.getStreamerWatchTime("xqc");
// Returns: { totalMinutes: 12000, uniqueViewers: 50 }
```

---

## 🚀 What You Can Build Next (Points System)

### **Option 1: Simple Points System**
```
1 point = 1 minute watched
Command: !points → Shows your points
Command: !leaderboard → Top 10 viewers
```

### **Option 2: Advanced Rewards System**
```
- Earn points for watching
- Spend points on:
  - Custom Discord roles
  - Streamer shoutouts
  - Raffle entries
  - Exclusive emotes
```

### **Option 3: Loyalty Tiers**
```
Bronze: 100 minutes
Silver: 500 minutes
Gold: 1000 minutes
Diamond: 5000 minutes
```

---

## 🔨 How to Implement Points (When Ready)

### **Step 1: Add Points Calculation**

Add this to `database.ts`:
```typescript
async getUserPoints(discordUserId: string): Promise<number> {
  const stats = await this.getUserWatchTime(discordUserId);
  return stats.totalMinutes; // 1 point per minute
}

async getLeaderboard(limit: number = 10): Promise<Array<{username: string, points: number}>> {
  return await this.allQuery(
    `SELECT username, SUM(watch_time_minutes) as points
     FROM viewing_sessions
     WHERE left_at IS NOT NULL
     GROUP BY discord_user_id
     ORDER BY points DESC
     LIMIT ?`,
    [limit]
  );
}
```

### **Step 2: Add Discord Command**

Add this to `index.ts`:
```typescript
if (content.startsWith('!points')) {
  const stats = await db.getUserWatchTime(message.author.id);
  message.reply(`You have **${stats.totalMinutes} points** from watching ${stats.sessions} sessions! 🎮`);
}

if (content.startsWith('!leaderboard')) {
  const leaderboard = await db.getLeaderboard(10);
  const embed = new EmbedBuilder()
    .setTitle('🏆 Watch Party Leaderboard')
    .setDescription(
      leaderboard.map((user, i) => 
        `${i + 1}. **${user.username}** - ${user.points} points`
      ).join('\n')
    );
  message.reply({ embeds: [embed] });
}
```

---

## ✅ Current Status

### **What Works NOW:**
- ✅ Discord users are automatically identified
- ✅ Watch time is tracked and saved
- ✅ Database stores all sessions
- ✅ OAuth redirects back to watch party
- ✅ System logs show Discord IDs

### **What's NOT Implemented (Yet):**
- ❌ Points calculation commands
- ❌ Leaderboard display
- ❌ Reward redemption
- ❌ Point spending system

---

## 📋 Testing the Tracking

1. Create a watch party: `!watchparty xqc`
2. Click the DM link (includes Discord token)
3. **Watch the Railway logs:**
   ```
   👤 YourName (Discord: 123456789) joined watch party: xqc 🎮
   💾 Saved viewing session for YourName (123456789) watching xqc
   ```
4. Leave the watch party (close tab)
5. **Check Railway logs again:**
   ```
   👋 YourName (Discord: 123456789) left watch party after X minutes 🎮
   💾 Updated viewing session: X minutes watched
   ```

---

## 🎯 Your Discord ID is Captured!

Every time someone joins from a Discord link:
- ✅ Their Discord ID is verified
- ✅ Their session is saved to the database
- ✅ Watch time is calculated automatically
- ✅ Data is ready for points calculation

**You now have EVERYTHING you need to build a points/rewards system!** 🚀

---

## 📞 Need Help Implementing Points?

Just ask! The foundation is complete, now we can build:
- Simple points display
- Leaderboards
- Reward redemption
- Loyalty tiers
- Custom badges/roles
- Anything you want!
