# Get Bot Token - Simple Method (App Access Token)

## 🎯 The Right Way

According to [Kick's OAuth documentation](https://docs.kick.com/getting-started/generating-tokens-oauth2-flow), there are **2 types of tokens**:

1. **App Access Token** - Client Credentials flow (server-to-server, **no user login**)
2. **User Access Token** - Authorization Grant flow (requires user login)

**For the bot, use App Access Token (Client Credentials flow)!**

---

## ✅ Simple Method - No OAuth Needed!

### Step 1: Make Sure Variables Are Set

In Railway Variables, you need:
- `KICK_CLIENT_ID` = `01KFBYN2H0627PRTF8WAB9R446`
- `KICK_CLIENT_SECRET` = `c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed`

### Step 2: Get App Access Token

**Option A: Via API Endpoint (Easiest)**

1. Visit: `https://web-production-56232.up.railway.app/api/bot/token`
2. You'll get a JSON response with the `access_token`
3. Copy the `access_token` value
4. Add to Railway: `BOT_ACCESS_TOKEN` = (paste token)

**Option B: Via Railway Logs**

1. Railway Dashboard → Logs
2. Look for: `App Access Token obtained successfully`
3. The token will be in the logs

**Option C: Manual API Call**

```bash
curl -X POST https://id.kick.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=01KFBYN2H0627PRTF8WAB9R446&client_secret=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed"
```

---

## 📋 What You Get

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Copy the `access_token` value!**

---

## ✅ Add to Railway

1. Railway Dashboard → Variables
2. Add: `BOT_ACCESS_TOKEN`
3. Value: Paste the `access_token` from above
4. Save

---

## 🔄 Token Refresh

App Access Tokens expire (usually after `expires_in` seconds). You can:
- Get a new token using the same method
- Or implement automatic refresh in the code

---

## 🎯 Why This is Better

- ✅ **No OAuth redirect needed**
- ✅ **No user login required**
- ✅ **Just Client ID + Secret**
- ✅ **Perfect for server-to-server bot operations**
- ✅ **Much simpler than Authorization Grant flow**

---

**No more OAuth redirect issues! Just get the App Access Token directly!**
