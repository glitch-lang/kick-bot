# OAuth Troubleshooting Guide

If you're getting redirected to `https://id.kick.com/` without seeing the authorization page, follow these steps:

## Step 1: Verify Redirect URI Match

**This is the #1 cause of OAuth issues!**

1. Go to https://dev.kick.com
2. Find your app (Client ID: `01KFBYN2H0627PRTF8WAB9R446`)
3. Check the **Redirect URI** field
4. It must be EXACTLY: `http://localhost:3000/auth/kick/callback`

**Common mistakes:**
- ❌ `https://localhost:3000/auth/kick/callback` (wrong protocol)
- ❌ `http://localhost:3000/auth/kick/callback/` (trailing slash)
- ❌ `http://127.0.0.1:3000/auth/kick/callback` (different host)
- ✅ `http://localhost:3000/auth/kick/callback` (correct)

## Step 2: Test OAuth URL Manually

1. Go to http://localhost:3000/api/debug/oauth
2. Copy the `oauthUrl` from the response
3. Paste it directly in your browser
4. If it still redirects to `id.kick.com/`, the redirect URI doesn't match

## Step 3: Check Server Logs

When you click "Connect with Kick", check the server terminal. You should see:
```
Initiating OAuth flow...
Client ID: Set
Redirect URI: http://localhost:3000/auth/kick/callback
⚠️ IMPORTANT: Make sure this redirect URI matches EXACTLY in your Kick app settings!
OAuth URL: https://id.kick.com/oauth/authorize?...
```

## Step 4: Verify App is Active

1. Go to https://dev.kick.com
2. Make sure your app is **active/enabled**
3. Check that all required scopes are enabled:
   - ✅ Read user information
   - ✅ Write to Chat feed
   - ✅ Read channel information
   - ✅ Subscribe to events
   - ✅ Read Channel points rewards

## Step 5: Try Different Browser

Sometimes browser cookies/cache can cause issues:
1. Try incognito/private mode
2. Clear cookies for `id.kick.com`
3. Try a different browser

## Step 6: Check Kick App Status

- Make sure your app isn't suspended
- Verify the Client ID is correct: `01KFBYN2H0627PRTF8WAB9R446`
- Check if there are any error messages in Kick's developer dashboard

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| Redirects to `id.kick.com/` | Redirect URI mismatch | Update redirect URI in Kick app settings |
| `invalid_redirect_uri` | URI doesn't match | Check exact match (no trailing slash, correct protocol) |
| `invalid_client` | Client ID wrong | Verify Client ID in .env matches Kick app |
| `access_denied` | User denied | User needs to click "Allow" |

## Quick Test

Run this in your browser console or terminal:
```javascript
// Test if redirect URI is registered
const testUrl = 'https://id.kick.com/oauth/authorize?client_id=01KFBYN2H0627PRTF8WAB9R446&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fkick%2Fcallback&response_type=code&scope=chat%3Awrite%20user%3Aread%20channel%3Aread%20events%3Asubscribe%20channel_points%3Aread';
console.log('Test URL:', testUrl);
// Open this URL - if it shows authorization page, it works!
```

## Still Not Working?

1. Double-check redirect URI in Kick app settings
2. Make sure you're using `http://` not `https://` for localhost
3. Verify port is `3000` (not `3001` or other)
4. Check server logs for the exact redirect URI being used
5. Try the debug endpoint: http://localhost:3000/api/debug/oauth
