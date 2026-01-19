# How to Connect Bot to Your Channel

## 🔍 The Problem

The bot only connects to **registered** channels, but you need it connected to register! This creates a chicken-and-egg problem.

## ✅ Solution: Manual Connection

After Railway redeploys, you can manually connect the bot to your channel.

---

## 📋 Step-by-Step

### Step 1: Wait for Railway to Deploy

Railway will automatically redeploy after the latest changes (1-2 minutes).

### Step 2: Connect Bot to Your Channel

**Option A: Using curl (Command Line)**

Replace `yourchannelname` with your actual channel name:

```bash
curl -X POST https://web-production-56232.up.railway.app/api/bot/connect \
  -H "Content-Type: application/json" \
  -d '{"channelSlug": "yourchannelname"}'
```

**Option B: Using a REST Client**

1. Use Postman, Insomnia, or any REST client
2. POST to: `https://web-production-56232.up.railway.app/api/bot/connect`
3. Headers: `Content-Type: application/json`
4. Body:
   ```json
   {
     "channelSlug": "yourchannelname"
   }
   ```

**Option C: Using Browser Console**

Open browser console (F12) and run:

```javascript
fetch('https://web-production-56232.up.railway.app/api/bot/connect', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ channelSlug: 'yourchannelname' })
})
.then(r => r.json())
.then(console.log);
```

### Step 3: Check Railway Logs

After connecting, check Railway Logs for:
- ✅ `Connecting to channel (unregistered): yourchannelname`
- ✅ `Pusher connected for channel: yourchannelname`
- ✅ `Subscribed to Pusher channel: chatroom.XXX`

### Step 4: Use !setupchat

1. Go to your Kick chat
2. Type: `!setupchat`
3. Bot should respond: `✅ Channel registered! Your command is: !yourchannelname`

---

## 🆘 Troubleshooting

### Error: "Bot is not started yet"

**Fix:** Wait 10-30 seconds and try again. The bot needs time to initialize.

### Error: "Missing channelSlug"

**Fix:** Make sure you're sending the channel name in the request body:
```json
{
  "channelSlug": "yourchannelname"
}
```

### No Response After Connecting

**Check:**
1. Railway Logs for connection errors
2. Your channel name is correct (case-sensitive)
3. Bot token is set in Railway Variables

### Still Can't Hear !setupchat

**Try:**
1. Check Railway Logs for Pusher connection
2. Verify channel name matches exactly
3. Wait a few seconds after connecting before typing `!setupchat`

---

## 🎯 Alternative: OAuth Registration

If manual connection doesn't work, use OAuth:

1. Visit: `https://web-production-56232.up.railway.app/auth/kick`
2. Log in with your Kick account
3. Authorize the app
4. Your channel will be registered automatically

---

## 📋 Quick Checklist

- [ ] Railway has redeployed (check Logs)
- [ ] Sent POST request to `/api/bot/connect`
- [ ] Got success response
- [ ] Checked Railway Logs for connection
- [ ] Typed `!setupchat` in Kick chat
- [ ] Bot responded successfully

---

**Your channel name is the part after `kick.com/` in your channel URL!**
