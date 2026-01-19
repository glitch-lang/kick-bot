# How to Get Your Bot Access Token

## 🤖 Step-by-Step Guide

### Step 1: Create Bot Account (If Not Done)

1. Go to [kick.com](https://kick.com)
2. Sign up for a new account
3. Choose a username (e.g., `CrossStreamBot`, `KickMessengerBot`)
4. Complete account setup
5. **Remember this username** - you'll need it for `BOT_USERNAME`

### Step 2: Get OAuth Token for Bot Account

**Method 1: Via Your Railway Bot (Easiest)**

1. **Make sure Railway has these variables set:**
   - `KICK_CLIENT_ID`
   - `KICK_CLIENT_SECRET`
   - `KICK_REDIRECT_URI` (your Railway URL)

2. **Visit your bot's OAuth URL:**
   ```
   https://comfortable-spontaneity-production.up.railway.app/auth/kick
   ```
   (Replace with your actual Railway URL if different)

3. **Log in with your BOT ACCOUNT** (not your personal account!)
   - Use the bot account username/password you created
   - Authorize the app

4. **Get the token:**
   - After authorization, you'll be redirected
   - Check Railway logs for the token
   - OR check the callback URL for token info
   - OR the token will be stored in the database

**Method 2: Via Kick Developer Portal**

1. Go to [dev.kick.com](https://dev.kick.com)
2. Use your Kick Developer App
3. Authorize with **bot account**
4. Get access token with `chat:write` scope
5. Copy the token

**Method 3: Check Railway Logs**

After OAuth flow, check Railway logs:
- Railway Dashboard → Your Project → Logs
- Look for token information
- Or check database for stored tokens

### Step 3: Add Token to Railway

1. Go to Railway Dashboard → Variables
2. Add: `BOT_ACCESS_TOKEN`
3. Value: Paste the token you got
4. Save

## 🔍 What the Token Looks Like

The token is a long string, something like:
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ...
```

## ⚠️ Important Notes

- **Token must be for BOT ACCOUNT** (not your personal account)
- **Token needs `chat:write` scope** to send messages
- **Token expires** - you may need to refresh it later
- **Keep token secret** - don't share it publicly

## 🆘 Troubleshooting

### Can't Get Token?
- Make sure bot account exists on Kick.com
- Verify `KICK_CLIENT_ID` and `SECRET` are set in Railway
- Check `KICK_REDIRECT_URI` matches your Railway URL exactly
- Try the OAuth flow again

### Token Not Working?
- Verify token has `chat:write` permission
- Check token hasn't expired
- Try getting a new token

---

**You need to go through the OAuth flow to get the token - I can't generate it for you!**
