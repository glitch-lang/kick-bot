# Fix: "Client authentication failed" Error

## 🔍 The Problem

The `/api/bot/token` endpoint is returning:
```json
{
  "error": "invalid_client",
  "error_description": "Client authentication failed"
}
```

This means your **Client ID** or **Client Secret** is wrong or doesn't match what's in your Kick Developer App.

---

## ✅ Step-by-Step Fix

### Step 1: Verify Credentials in Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Log in
3. Open your Developer App
4. **Copy these EXACT values:**
   - **Client ID**: Should be `01KFBYN2H0627PRTF8WAB9R446`
   - **Client Secret**: Copy the secret shown (it might be different!)

### Step 2: Update Railway Variables

Railway Dashboard → Variables

**Update these variables:**

1. **KICK_CLIENT_ID**
   - Value: `01KFBYN2H0627PRTF8WAB9R446`
   - (Or whatever your actual Client ID is from Step 1)

2. **KICK_CLIENT_SECRET** ⚠️ **IMPORTANT**
   - Value: Copy the **EXACT** secret from Kick Developer App
   - **Make sure there are no extra spaces or characters!**
   - The secret you have might be: `c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed`
   - But verify it matches what's in Kick Developer App!

### Step 3: Verify No Typos

Common mistakes:
- ❌ Extra spaces before/after
- ❌ Missing characters
- ❌ Wrong Client ID
- ❌ Old/regenerated secret

### Step 4: Check if Secret Was Regenerated

If you regenerated your Client Secret in Kick Developer App:
- The old secret won't work
- You MUST use the new secret
- Update Railway Variables with the new secret

---

## 🔧 Test After Fixing

1. **Wait for Railway to redeploy** (1-2 minutes)
2. **Visit:** `https://web-production-56232.up.railway.app/api/bot/token`
3. **Should get:**
   ```json
   {
     "success": true,
     "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "Bearer",
     "expires_in": 3600
   }
   ```

---

## 🆘 Still Not Working?

### Check Railway Logs

Railway Dashboard → Logs

Look for:
- `App Access Token error:` - Shows what went wrong
- `Client authentication failed` - Credentials still wrong

### Verify Variables Are Set

1. Railway Dashboard → Variables
2. Make sure both `KICK_CLIENT_ID` and `KICK_CLIENT_SECRET` are there
3. Check their values match Kick Developer App exactly

### Try Manual API Call

You can test the credentials directly:

```bash
curl -X POST https://id.kick.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=01KFBYN2H0627PRTF8WAB9R446&client_secret=YOUR_SECRET_HERE"
```

Replace `YOUR_SECRET_HERE` with your actual secret from Kick Developer App.

If this works, the credentials are correct and the issue is in Railway variables.
If this fails, the credentials themselves are wrong.

---

## 📋 Quick Checklist

- [ ] Opened Kick Developer App at dev.kick.com
- [ ] Copied Client ID exactly
- [ ] Copied Client Secret exactly (no spaces)
- [ ] Updated `KICK_CLIENT_ID` in Railway Variables
- [ ] Updated `KICK_CLIENT_SECRET` in Railway Variables
- [ ] Values match Kick Developer App exactly
- [ ] No extra spaces or characters
- [ ] Waited for Railway to redeploy
- [ ] Tested `/api/bot/token` endpoint again

---

**The Client ID and Secret must match EXACTLY what's in your Kick Developer App!**
