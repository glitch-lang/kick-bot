# Fix OAuth Errors from Railway Logs

## 🔍 Issues Found

From your Railway logs, there are **2 critical errors**:

1. ❌ **"invalid redirect uri"** - Redirect URI doesn't match in Kick Developer App
2. ❌ **"Client authentication failed"** - Client secret is wrong or missing

---

## ✅ Fix 1: Redirect URI Mismatch

### Step 1: Check Railway Variables
Railway Dashboard → Variables → `KICK_REDIRECT_URI`

Must be exactly:
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

### Step 2: Update Kick Developer App
1. Go to [dev.kick.com](https://dev.kick.com)
2. Open your Developer App (Client ID: `01KFBYN2H0627PRTF8WAB9R446`)
3. Find **"Redirect URIs"** or **"Callback URLs"**
4. **Delete ALL old redirect URIs**
5. **Add this EXACT URL:**
   ```
   https://web-production-56232.up.railway.app/auth/kick/callback
   ```
6. **Save changes**
7. **Wait 2-3 minutes** for changes to propagate

### Step 3: Verify Match
Both must be **identical**:
- Railway: `https://web-production-56232.up.railway.app/auth/kick/callback`
- Kick App: `https://web-production-56232.up.railway.app/auth/kick/callback`

---

## ✅ Fix 2: Client Secret Error

### The Problem
The log shows `client_secret` is being sent as the redirect URI, which means:
- `KICK_CLIENT_SECRET` is not set in Railway, OR
- `KICK_CLIENT_SECRET` has the wrong value

### Step 1: Check Railway Variables
Railway Dashboard → Variables

**Verify these are set correctly:**

1. **KICK_CLIENT_ID**
   ```
   01KFBYN2H0627PRTF8WAB9R446
   ```

2. **KICK_CLIENT_SECRET** ⚠️ **CRITICAL**
   ```
   c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed
   ```
   **Make sure this is the ACTUAL secret, not the redirect URI!**

3. **KICK_REDIRECT_URI**
   ```
   https://web-production-56232.up.railway.app/auth/kick/callback
   ```

### Step 2: Verify Client Secret
- Go to [dev.kick.com](https://dev.kick.com)
- Open your Developer App
- Check the **Client Secret** shown there
- Make sure it matches what's in Railway Variables

### Step 3: Re-add if Wrong
If `KICK_CLIENT_SECRET` in Railway is wrong:
1. Delete the variable
2. Add it again with the correct value
3. Railway will redeploy

---

## 🔄 After Fixing

1. **Wait 2-3 minutes** for Kick Developer App changes to propagate
2. **Railway will auto-redeploy** after variable changes
3. **Try OAuth again:**
   - Visit: `https://web-production-56232.up.railway.app/auth/kick`
   - Should work now!

---

## 🎯 Quick Checklist

- [ ] `KICK_REDIRECT_URI` in Railway = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Redirect URI in Kick Developer App = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Both match **EXACTLY** (no trailing slash, exact domain)
- [ ] `KICK_CLIENT_ID` in Railway = `01KFBYN2H0627PRTF8WAB9R446`
- [ ] `KICK_CLIENT_SECRET` in Railway = `c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed`
- [ ] `KICK_CLIENT_SECRET` matches the secret in Kick Developer App
- [ ] Saved changes in Kick Developer App
- [ ] Waited 2-3 minutes for propagation

---

## 🆘 Still Getting Errors?

### Check Railway Logs Again
After fixing, check Railway logs for:
- ✅ "Token exchange successful" (good!)
- ❌ "invalid redirect uri" (redirect URI still wrong)
- ❌ "Client authentication failed" (client secret still wrong)

### Debug Steps
1. **Verify variables are set:**
   - Railway Dashboard → Variables
   - Make sure all 3 are there and correct

2. **Test redirect URI:**
   - Visit: `https://web-production-56232.up.railway.app/auth/kick`
   - Check if you get redirected to Kick
   - After authorizing, check if you get redirected back with `?code=...`

3. **Check Kick Developer App:**
   - Make sure redirect URI is saved
   - No extra spaces or characters
   - Matches Railway exactly

---

**The redirect URI must match EXACTLY, and the client secret must be correct!**
