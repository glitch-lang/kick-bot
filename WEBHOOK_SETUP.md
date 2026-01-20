# 🎣 Webhook Setup Guide for Kick Bot

Your bot now supports **listening to chat messages** via Kick's Event Subscriptions (Webhooks)!

## How It Works

1. ✅ Your bot has the `events:subscribe` scope
2. 📡 During OAuth registration, the bot subscribes to `chat.message.sent` events
3. 📬 Kick sends HTTP POST requests to your webhook URL when messages are posted
4. 🤖 Your bot receives the message, parses commands, and responds

## Local Testing with ngrok

**Problem:** Webhooks require a **public HTTPS URL**, but your bot runs on `localhost:3000`.

**Solution:** Use **ngrok** to create a temporary public URL that forwards to your local server.

### Step 1: Install ngrok

**Option A: Download**
1. Go to [ngrok.com/download](https://ngrok.com/download)
2. Download the Windows version
3. Extract `ngrok.exe` to a folder (e.g., `C:\ngrok`)

**Option B: Via Chocolatey**
```powershell
choco install ngrok
```

### Step 2: Sign Up (Free)
1. Create account at [ngrok.com](https://ngrok.com)
2. Get your authtoken from the dashboard
3. Run: `ngrok config add-authtoken YOUR_TOKEN_HERE`

### Step 3: Start ngrok
Open a **new PowerShell window** and run:
```powershell
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Forwarding                    https://a1b2-3-4-5-6.ngrok-free.app -> http://localhost:3000
```

**Copy the `https://...ngrok-free.app` URL!**

### Step 4: Update Your .env File
Edit `C:\Users\willc\kick-bot\.env`:
```env
WEBHOOK_BASE_URL=https://YOUR-NGROK-URL.ngrok-free.app
```

**Example:**
```env
WEBHOOK_BASE_URL=https://a1b2-3-4-5-6.ngrok-free.app
```

### Step 5: Restart Your Bot
```powershell
cd C:\Users\willc\kick-bot
npm start
```

### Step 6: Re-authenticate (Important!)
1. Go to `http://localhost:3000`
2. Click **"Connect with Kick"** again
3. This time, the bot will subscribe to events using your ngrok URL!

## Testing Commands

Once webhooks are working, type these in your Kick chat:

- `!ping` - Bot responds with "Pong! 🏓"
- `!help` - Shows available commands
- `!uptime` - Shows how long the bot has been running

## Troubleshooting

### "404 Not Found" or "503" on ngrok
- Make sure your bot is running on port 3000
- Check that ngrok is forwarding to the correct port

### Bot doesn't respond to commands
1. Check server logs for incoming webhook events
2. Look for `📨 Webhook received from Kick`
3. Verify the signature is valid (look for `✅ Webhook signature verified`)

### "Failed to subscribe to chat events"
Common reasons:
- **401 Unauthorized**: Token missing `events:subscribe` scope - re-authenticate
- **403 Forbidden**: Bot doesn't have permission - make sure you `/mod CrossTalkBot`
- **404 Not Found**: Endpoint doesn't exist yet (Kick may not have webhooks live yet)
- **409 Conflict**: Subscription already exists for this chatroom

### Checking Webhook Status
The bot logs will show:
```
📡 Attempting to subscribe to chat events for realglitchdyeet...
   Endpoint: https://api.kick.com/public/v1/events/subscriptions
   Chatroom ID: 12345
   Webhook URL: https://your-ngrok-url.ngrok-free.app/webhooks/kick
   Event Type: chat.message.sent
✅ Successfully subscribed to chat events
   Subscription ID: abc123
```

## Production Deployment (No ngrok needed!)

When you deploy to Railway/Heroku/etc:
1. Update `.env` with your production URL:
   ```env
   WEBHOOK_BASE_URL=https://your-bot.railway.app
   ```
2. Re-deploy
3. Re-authenticate via OAuth to subscribe with the new URL

## Important Notes

### ngrok Free Tier Limitations
- ⚠️ URL changes every time you restart ngrok
- 🔄 Must update `.env` and re-authenticate each time
- ⏱️ Sessions expire after 2 hours (need to restart)

### ngrok Paid Tier ($8/month)
- ✅ Reserved subdomain (URL never changes)
- ✅ No session limits
- ✅ No need to re-authenticate

### Current Implementation Status

**What Works:**
- ✅ Event subscription API calls
- ✅ Webhook endpoint (`POST /webhooks/kick`)
- ✅ Signature verification
- ✅ Command parsing (`!ping`, `!help`, `!uptime`)
- ✅ Auto-subscribe on OAuth registration

**What Might Not Work Yet:**
- ⚠️ **Kick's webhook infrastructure may not be live for all apps yet**
- If you get a 404 error when subscribing, this feature may still be in beta
- The bot will still work perfectly for **sending messages** via the dashboard!

## Manual Testing (Without Waiting for Real Messages)

Test the webhook endpoint directly:
```powershell
curl -X POST http://localhost:3000/webhooks/kick `
  -H "Content-Type: application/json" `
  -d '{
    "type": "chat.message.sent",
    "data": {
      "id": "test123",
      "content": "!ping",
      "sender": { "id": 1, "username": "TestUser", "slug": "testuser" },
      "chatroom_id": 12345,
      "channel": { "id": 123, "slug": "realglitchdyeet" },
      "created_at": "2026-01-20T00:00:00Z"
    }
  }'
```

Check your server logs - you should see:
```
📨 Webhook received from Kick
   Event Type: chat.message.sent
   From: TestUser
   Message: "!ping"
   Channel: realglitchdyeet
📬 Processing webhook message from realglitchdyeet
🎮 Command received: !ping
📤 Sending message to realglitchdyeet
✅ SUCCESS!
```

## Next Steps

1. **For Local Testing:** Set up ngrok (15 minutes)
2. **For Production:** Deploy to Railway and use production URL
3. **Alternative:** Continue using dashboard to send messages (works perfectly!)

---

**Need help?** Check the server logs at `http://localhost:3000/logs` for detailed debugging info!
