# Fix: "No authorization code received"

## 🔍 The Problem

This error means Kick isn't sending the authorization code back to your callback URL. The most common cause is a **redirect URI mismatch**.

---

## ✅ Step-by-Step Fix

### Step 1: Verify Your Railway Redirect URI

Your redirect URI should be:
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

**Check in Railway:**
1. Railway Dashboard → Your Service → **Variables** tab
2. Find `KICK_REDIRECT_URI`
3. Make sure it's **exactly**: `https://web-production-56232.up.railway.app/auth/kick/callback`
4. **No trailing slash!** ❌ `.../callback/` is wrong
5. **Must be https!** ❌ `http://...` is wrong

### Step 2: Update Kick Developer App

1. Go to [dev.kick.com](https://dev.kick.com)
2. Log in
3. Open your Developer App (the one with Client ID: `01KFBYN2H0627PRTF8WAB9R446`)
4. Find **"Redirect URIs"** or **"Callback URLs"** section
5. **Delete any old redirect URIs** (like `http://localhost:3000/auth/kick/callback`)
6. **Add this EXACT URL:**
   ```
   https://web-production-56232.up.railway.app/auth/kick/callback
   ```
7. **Save changes**

### Step 3: Verify Exact Match

The redirect URI must match **EXACTLY** in both places:

**Railway Variables:**
```
KICK_REDIRECT_URI = https://web-production-56232.up.railway.app/auth/kick/callback
```

**Kick Developer App:**
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

**Common mistakes:**
- ❌ Trailing slash: `.../callback/`
- ❌ Missing `https://`
- ❌ Wrong domain
- ❌ Extra spaces
- ❌ Different case (though URLs are case-insensitive)

---

## 🔧 Additional Checks

### Check Railway Logs

1. Railway Dashboard → Your Service → **Logs** tab
2. Look for lines like:
   ```
   Redirect URI: https://web-production-56232.up.railway.app/auth/kick/callback
   ```
3. This shows what redirect URI the app is using

### Test the OAuth Flow

1. Visit: `https://web-production-56232.up.railway.app/auth/kick`
2. You should be redirected to Kick
3. After authorizing, you should be redirected back to:
   ```
   https://web-production-56232.up.railway.app/auth/kick/callback?code=...
   ```
4. If you see an error page or different URL, the redirect URI is wrong

---

## 🆘 Other Possible Causes

### 1. You Denied Authorization
- Make sure you click **"Authorize"** or **"Allow"** on Kick's authorization page
- Don't close the window or click "Cancel"

### 2. OAuth Endpoint Issue
- Make sure you're using the correct Kick OAuth endpoint
- Should be: `https://id.kick.com/oauth/authorize`

### 3. Cookie Issues
- Make sure cookies are enabled in your browser
- Try in an incognito/private window
- Clear cookies and try again

### 4. Railway Not Fully Deployed
- Wait for Railway deployment to complete
- Check Railway Logs for any errors
- Make sure the service is "Active" or "Running"

---

## 📋 Quick Checklist

- [ ] `KICK_REDIRECT_URI` in Railway = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Redirect URI in Kick Developer App = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Both match **EXACTLY** (no trailing slash, no spaces)
- [ ] Railway service is deployed and running
- [ ] You clicked "Authorize" on Kick's page
- [ ] Cookies are enabled in browser

---

## 🔄 After Fixing

1. **Save changes** in Kick Developer App
2. **Wait 1-2 minutes** for changes to propagate
3. **Try OAuth again:**
   - Visit: `https://web-production-56232.up.railway.app/auth/kick`
   - Log in and authorize
   - Should redirect back with `?code=...` in the URL

---

**The redirect URI must match EXACTLY in both Railway and Kick Developer App!**
