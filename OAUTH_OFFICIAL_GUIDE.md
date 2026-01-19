# Kick OAuth 2.1 - Official Documentation Guide

Based on: [Kick OAuth 2.1 Documentation](https://docs.kick.com/getting-started/generating-tokens-oauth2-flow)

## ✅ Our Implementation Status

### Authorization Endpoint (`GET /oauth/authorize`)
**Status:** ✅ Correct

**Required Parameters (all present):**
- ✅ `client_id` - Your Client ID
- ✅ `response_type=code` 
- ✅ `redirect_uri` - Must match EXACTLY in Kick app settings
- ✅ `state` - Random string for CSRF protection
- ✅ `scope` - Space-separated scopes
- ✅ `code_challenge` - PKCE challenge (required)
- ✅ `code_challenge_method=S256` - PKCE method (required)

**Endpoint:** `https://id.kick.com/oauth/authorize` ✅

### Token Endpoint (`POST /oauth/token`)
**Status:** ✅ Correct

**Required Headers:**
- ✅ `Content-Type: application/x-www-form-urlencoded`

**Required Body Parameters:**
- ✅ `grant_type=authorization_code`
- ✅ `code` - Authorization code from callback
- ✅ `client_id` - Your Client ID
- ✅ `client_secret` - Your Client Secret
- ✅ `redirect_uri` - Must match authorization request
- ✅ `code_verifier` - PKCE verifier (required)

**Endpoint:** `https://id.kick.com/oauth/token` ✅

---

## 🔍 The Problem: "No authorization code received"

According to the documentation, this error means:
- ❌ The `code` parameter is missing from the callback URL
- This happens when the `redirect_uri` doesn't match exactly

---

## ✅ Fix: Redirect URI Must Match EXACTLY

### Step 1: Check Railway Variables

**Railway Dashboard → Variables → `KICK_REDIRECT_URI`**

Must be:
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

**Check:**
- ✅ Starts with `https://` (not `http://`)
- ✅ No trailing slash
- ✅ Exact domain: `web-production-56232.up.railway.app`
- ✅ Exact path: `/auth/kick/callback`

### Step 2: Update Kick Developer App

**Go to:** [dev.kick.com](https://dev.kick.com) → Your App → Redirect URIs

**Add this EXACT URL:**
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

**Important:**
- Must match Railway's `KICK_REDIRECT_URI` **EXACTLY**
- No trailing slash
- Must be `https://` (not `http://`)
- Case-sensitive (though URLs are usually case-insensitive)

### Step 3: Verify Match

**Railway:**
```
KICK_REDIRECT_URI = https://web-production-56232.up.railway.app/auth/kick/callback
```

**Kick Developer App:**
```
https://web-production-56232.up.railway.app/auth/kick/callback
```

**They must be identical!**

---

## 📋 Complete OAuth Flow (Per Documentation)

### 1. Authorization Request
```
GET https://id.kick.com/oauth/authorize?
    response_type=code&
    client_id=<your_client_id>&
    redirect_uri=https://web-production-56232.up.railway.app/auth/kick/callback&
    scope=chat:write user:read channel:read events:subscribe channel_points:read&
    code_challenge=<code_challenge>&
    code_challenge_method=S256&
    state=<random_state>
```

### 2. User Authorizes
- User is redirected to Kick
- User logs in and authorizes
- Kick redirects back with `code` parameter

### 3. Expected Callback
```
https://web-production-56232.up.railway.app/auth/kick/callback?code=<code>&state=<state>
```

**If you see this URL without `?code=...`, the redirect URI doesn't match!**

### 4. Token Exchange
```
POST https://id.kick.com/oauth/token

Headers:
Content-Type: application/x-www-form-urlencoded

Body:
grant_type=authorization_code
client_id=<client_id>
client_secret=<client_secret>
redirect_uri=https://web-production-56232.up.railway.app/auth/kick/callback
code_verifier=<code_verifier>
code=<code>
```

---

## 🔧 Troubleshooting Steps

### 1. Check Railway Logs
**Railway Dashboard → Logs**

Look for:
```
Redirect URI: https://web-production-56232.up.railway.app/auth/kick/callback
```

This shows what redirect URI the app is using.

### 2. Test OAuth URL
Visit: `https://web-production-56232.up.railway.app/auth/kick`

You should be redirected to:
```
https://id.kick.com/oauth/authorize?response_type=code&client_id=...&redirect_uri=https://web-production-56232.up.railway.app/auth/kick/callback&...
```

### 3. After Authorization
After clicking "Authorize" on Kick, you should be redirected to:
```
https://web-production-56232.up.railway.app/auth/kick/callback?code=ABC123...&state=XYZ789...
```

**If you're redirected to a different URL or see an error, the redirect URI doesn't match!**

### 4. Common Mistakes
- ❌ Trailing slash: `.../callback/`
- ❌ Missing `https://`
- ❌ Wrong domain
- ❌ Extra spaces
- ❌ Different path

---

## ✅ Verification Checklist

- [ ] `KICK_REDIRECT_URI` in Railway = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Redirect URI in Kick Developer App = `https://web-production-56232.up.railway.app/auth/kick/callback`
- [ ] Both match **EXACTLY** (character for character)
- [ ] No trailing slashes
- [ ] Both use `https://`
- [ ] Railway service is deployed and running
- [ ] You clicked "Authorize" on Kick's page (didn't cancel)

---

## 🚀 After Fixing

1. **Save changes** in Kick Developer App
2. **Wait 1-2 minutes** for changes to propagate
3. **Clear browser cookies** (optional, but recommended)
4. **Try OAuth again:**
   - Visit: `https://web-production-56232.up.railway.app/auth/kick`
   - Log in and authorize
   - Should redirect to: `https://web-production-56232.up.railway.app/auth/kick/callback?code=...`

---

**The redirect URI is the #1 cause of "No authorization code received" errors!**
