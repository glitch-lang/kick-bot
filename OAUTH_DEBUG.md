# OAuth Debugging Guide

## Kick OAuth Requirements (from Official Docs)

### Endpoints
- **Authorization**: `https://id.kick.com/oauth/authorize`
- **Token Exchange**: `https://id.kick.com/oauth/token`
- **Token Introspection**: `https://id.kick.com/oauth/token/introspect`

### Required Parameters for Authorization

1. **client_id** - Your Kick app Client ID
2. **redirect_uri** - Must match EXACTLY in Kick app settings
3. **response_type** - Must be `code`
4. **scope** - Space-separated scopes (e.g., `chat:write user:read channel:read`)
5. **state** - CSRF protection token
6. **code_challenge** - PKCE challenge (SHA256 hash)
7. **code_challenge_method** - Must be `S256`

### Redirect URI Requirements

The redirect URI must match **EXACTLY**:
- Protocol: `http://` or `https://`
- Domain: `localhost` or your domain
- Port: `3000` (if specified)
- Path: `/auth/kick/callback` (exact path)
- **NO trailing slash**
- **Case sensitive**

### Common Issues

1. **"No authorization code received"**
   - Redirect URI doesn't match in Kick app settings
   - User denied authorization
   - Browser blocked the redirect
   - Check browser console for errors

2. **"Invalid redirect URI"**
   - URI in request doesn't match registered URI
   - Check for trailing slashes, protocol differences, port differences

3. **"State mismatch"**
   - Cookie expired or cleared
   - Multiple tabs trying to authorize
   - CSRF protection working correctly

### Debugging Steps

1. **Check Kick App Settings**
   ```
   Go to: https://dev.kick.com
   - Find your app
   - Check "Redirect URI" field
   - Must be: http://localhost:3000/auth/kick/callback
   ```

2. **Check .env File**
   ```
   KICK_REDIRECT_URI=http://localhost:3000/auth/kick/callback
   ```

3. **Check Server Logs**
   - Look for "OAuth Callback Received"
   - Check query parameters
   - Verify state matches

4. **Check Browser**
   - Open browser console
   - Look for errors
   - Check network tab for redirect

### Testing the OAuth URL

You can manually test the OAuth URL by visiting:
```
http://localhost:3000/auth/kick
```

This will redirect you to Kick's authorization page. Check:
- Does it redirect correctly?
- Do you see the authorization page?
- After clicking "Authorize", does it redirect back?
- What's in the URL when it redirects back?

### Expected Flow

1. User clicks "Connect with Kick"
2. Server generates OAuth URL with PKCE
3. User redirected to `https://id.kick.com/oauth/authorize?...`
4. User sees Kick authorization page
5. User clicks "Authorize"
6. Kick redirects to: `http://localhost:3000/auth/kick/callback?code=...&state=...`
7. Server receives code and exchanges for token

### If Still Not Working

1. **Verify Redirect URI in Kick App**
   - Copy the exact URI from Kick app settings
   - Compare character-by-character with your .env

2. **Check Browser Console**
   - Look for CORS errors
   - Look for blocked redirects
   - Check network requests

3. **Try Different Browser**
   - Some browsers block localhost redirects
   - Try Chrome, Firefox, or Edge

4. **Check Firewall/Antivirus**
   - May be blocking localhost connections
   - Temporarily disable to test
