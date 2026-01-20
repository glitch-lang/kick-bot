# 🔗 Discord Webhook Setup - Enable Kick → Discord Replies

## Why Setup Webhooks?

Currently, Discord users can send messages to Kick streamers with `!kick message`, but when streamers reply on Kick, the replies need a way to get back to Discord.

**Discord Webhooks** allow Kick streamers to send replies back to Discord channels!

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create a Discord Webhook

1. **Go to your Discord server**
2. **Right-click the channel** where you want to receive Kick replies
3. **Click "Edit Channel"**
4. **Click "Integrations"** in the left menu
5. **Click "Webhooks"**
6. **Click "New Webhook"**
7. **Name it:** "CrossTalk" or "Kick Bot"
8. **(Optional) Change avatar:** Upload a custom image
9. **Click "Copy Webhook URL"** 📋
10. **Click "Save Changes"**

---

### Step 2: Add Webhook to Bot Environment

**On Railway:**

1. Go to your Railway project
2. Click on your bot service
3. Go to **"Variables"** tab
4. Click **"+ New Variable"**
5. Add:
   - **Variable:** `DISCORD_WEBHOOK_URL`
   - **Value:** `[paste your webhook URL]`
6. Click **"Add"**
7. Bot will redeploy automatically

**For Local Bot:**

Edit `.env` file:
```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/123456789/abcdefghijklmnop
```

---

### Step 3: Test It!

**In Discord:**
```
!kick message realglitchdyeet Hello from Discord!
```

**In Kick (as realglitchdyeet):**
```
!reply Hey thanks for the message!
```

**Back in Discord:**
You should see:
```
💬 realglitchdyeet replied to @YourName:
Hey thanks for the message!
```

---

## ✅ What Works After Setup

### Before Webhook:
```
Discord → Kick: ✅ Works
Kick → Discord: ❌ Doesn't work
```

### After Webhook:
```
Discord → Kick: ✅ Works
Kick → Discord: ✅ Works! 
```

---

## 📝 Example Flow

### 1. Discord User Sends Message
```
Discord User: !kick message realglitchdyeet Want to collab?
Bot: ✅ Message sent to realglitchdyeet on Kick!
```

### 2. Kick Streamer Sees Message
```
In Kick chat:
📨 @DiscordUser from Discord: "Want to collab?" | Reply: !reply <your message>
```

### 3. Kick Streamer Replies
```
realglitchdyeet: !reply Sure! Let's do Friday at 8pm
Bot: ✅ Reply sent to @DiscordUser on Discord!
```

### 4. Discord User Gets Reply
```
In Discord (via webhook):
💬 realglitchdyeet replied to @DiscordUser:
Sure! Let's do Friday at 8pm
```

---

## 🔧 Multiple Discord Channels

You can create webhooks for multiple channels!

### Option 1: One Webhook Per Channel

**#general channel:**
1. Create webhook → Copy URL
2. Set as `DISCORD_WEBHOOK_URL`

**#kick-messages channel:**
1. Create webhook → Copy URL
2. Use this channel for Kick messages

### Option 2: Different Webhooks Per Purpose

Currently, the bot uses one webhook URL. To support multiple channels, you would need to:
- Store webhook URLs per Discord channel
- Map them in the database
- (Future enhancement)

---

## 🛡️ Security

### Webhook URL Safety

⚠️ **Keep webhook URLs private!**

- Anyone with the URL can post to your channel
- Don't share it publicly
- Don't commit it to GitHub
- Use environment variables only

### If Webhook is Compromised

1. Go to Discord channel settings
2. Click "Integrations" → "Webhooks"
3. Find the compromised webhook
4. Click "Delete Webhook"
5. Create a new one
6. Update environment variable

---

## 📊 Webhook vs Bot Messages

### Using Webhook (Recommended)
```
✅ Appears as "CrossTalk" (custom name/avatar)
✅ Cleaner appearance
✅ Can customize username/avatar per message
✅ No rate limits (for our use case)
```

### Using Bot Account
```
❌ Appears as your bot account
❌ Limited customization
✅ Can use embeds and buttons
✅ More control
```

For simple replies, **webhooks are perfect**!

---

## 🐛 Troubleshooting

### "Webhook URL is invalid"

**Check:**
1. ✅ URL starts with `https://discord.com/api/webhooks/`
2. ✅ No spaces or line breaks
3. ✅ URL is the full URL (not truncated)

**Fix:**
```bash
# Check Railway environment variable
# Make sure it's exactly:
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_ID/YOUR_TOKEN
```

---

### Replies not appearing in Discord

**Check:**
1. ✅ Is webhook URL set in environment?
2. ✅ Did bot redeploy after adding webhook?
3. ✅ Is webhook still valid? (check Discord)
4. ✅ Did Kick streamer use `!reply` command?

**Test webhook manually:**
```bash
curl -X POST https://discord.com/api/webhooks/YOUR_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message!"}'
```

If this works, webhook is valid!

---

### "Reply sent to Discord" but nothing appears

**Possible causes:**
1. Webhook was deleted in Discord
2. Channel was deleted
3. Bot lost webhook permissions

**Fix:**
1. Create a new webhook
2. Update environment variable
3. Redeploy bot

---

## 🔮 Future Enhancements

Potential improvements:

- [ ] Multiple webhooks per Discord server
- [ ] Rich embeds for replies
- [ ] Reaction buttons ("Reply", "Block", etc.)
- [ ] Threaded replies
- [ ] Attachment support
- [ ] GIF/Image forwarding

---

## 📝 Quick Reference

### Create Webhook:
Discord Channel → Edit → Integrations → Webhooks → New Webhook

### Add to Railway:
Variables → + New Variable → `DISCORD_WEBHOOK_URL` → Paste URL

### Test:
```
Discord: !kick message <streamer> <message>
Kick: !reply <response>
```

---

## ✅ Success Checklist

- [ ] Created Discord webhook
- [ ] Copied webhook URL
- [ ] Added to Railway environment variables
- [ ] Bot redeployed
- [ ] Tested Discord → Kick message
- [ ] Tested Kick → Discord reply
- [ ] Reply appears in Discord

---

**Once setup, bidirectional Discord ↔ Kick messaging works perfectly!** 🎉
