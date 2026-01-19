# Registration Troubleshooting Guide

## Error: "user_info" - What It Means

This error means the bot successfully received an OAuth token, but cannot retrieve your user information from Kick's API.

## Step-by-Step Diagnosis

### Step 1: Check Server Logs

When you try to register, the server terminal will show:

1. **Token Scopes**:
   ```
   Token scopes: user:read channel:read chat:write events:subscribe channel_points:read
   ```
   ✅ **Good**: All scopes are present
   ❌ **Bad**: If `user:read` is missing, that's the problem!

2. **Token Introspection**:
   ```
   Token introspection response: { "data": { "scope": "...", ... } }
   ```
   - Check the `scope` field
   - Should include `user:read`
   - If missing, the scope wasn't granted

3. **Endpoint Attempts**:
   ```
   Trying user info endpoint: https://api.kick.com/public/v1/user
   User info error for ...: { status: 401, ... }
   ```
   - Note which endpoints were tried
   - Check error status codes:
     - **401**: Unauthorized (token invalid or missing scope)
     - **403**: Forbidden (scope not granted)
     - **404**: Endpoint doesn't exist

### Step 2: Verify Scopes in Kick App

1. Go to https://dev.kick.com
2. Find your app (Client ID: `01KFBYN2H0627PRTF8WAB9R446`)
3. Check app settings:
   - ✅ Is `user:read` scope enabled?
   - ✅ Are all required scopes enabled?

### Step 3: Verify Authorization

When you click "Connect with Kick" and authorize:
1. **Do you see a permissions screen?**
   - ✅ Yes: Good, you're authorizing
   - ❌ No: OAuth flow might be broken

2. **What permissions are shown?**
   - Should list: Read user info, Write to chat, etc.
   - Make sure you click "Allow" for ALL permissions

3. **After authorization, check URL**:
   - Should redirect to: `http://localhost:3000/auth/kick/callback?code=...`
   - If you see `?error=...` in URL, that's the issue

### Step 4: Test Token Manually

1. **Get token from server logs** (after registration attempt)
2. **Test in browser console**:
   ```javascript
   // Replace YOUR_TOKEN with actual token from logs
   fetch('https://api.kick.com/public/v1/user', {
     headers: {
       'Authorization': 'Bearer YOUR_TOKEN',
       'Content-Type': 'application/json'
     }
   })
   .then(r => {
     console.log('Status:', r.status);
     return r.json();
   })
   .then(data => console.log('Response:', data))
   .catch(err => console.error('Error:', err));
   ```

3. **Check response**:
   - **200 OK**: Endpoint works, but our code might not parse it correctly
   - **401/403**: Token doesn't have `user:read` scope
   - **404**: Wrong endpoint

## Common Fixes

### Fix 1: Scope Not Granted

**Problem**: `user:read` scope not in token

**Solution**:
1. Revoke app access in Kick settings
2. Re-authorize and make sure to grant ALL permissions
3. Check server logs to verify scope is now present

### Fix 2: Wrong Endpoint

**Problem**: All endpoints return 404

**Solution**:
- Check Kick's latest API documentation
- The endpoint might have changed
- Try the debug endpoint to see which endpoints were attempted

### Fix 3: Token Type Issue

**Problem**: Using App Access Token instead of User Access Token

**Solution**:
- Make sure you're using Authorization Code flow (not Client Credentials)
- User tokens are required for user info

## What to Share for Help

If you need help debugging, share:

1. **Server log output** showing:
   - Token scopes
   - Token introspection response
   - Endpoint attempts and errors

2. **Browser console** (F12) showing:
   - Any JavaScript errors
   - Network tab showing API calls

3. **Kick app settings**:
   - Which scopes are enabled
   - Redirect URI configured

## Quick Checklist

- [ ] `user:read` scope enabled in Kick app
- [ ] `user:read` scope included in OAuth request
- [ ] User granted `user:read` permission during authorization
- [ ] Token shows `user:read` in introspection response
- [ ] Redirect URI matches exactly
- [ ] Using User Access Token (not App Token)
- [ ] Server logs show which endpoints were tried

## Still Not Working?

1. Check server terminal logs (most important!)
2. Visit: http://localhost:3000/api/debug/last-attempt
3. Share the error details from logs
4. Verify all scopes are enabled and granted
