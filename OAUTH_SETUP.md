# Kick OAuth Setup Guide

If clicking "Connect with Kick" just redirects to kick.com without showing an authorization screen, follow these steps:

## Step 1: Create a Kick Developer Application

1. Go to **https://dev.kick.com**
2. Log in with your Kick account
3. Navigate to "Applications" or "My Apps"
4. Click "Create New Application" or "New App"
5. Fill in the application details:
   - **Name**: Cross-Streamer Bot (or any name)
   - **Description**: Bot for cross-streamer messaging
   - **Redirect URI**: 
     ```
     http://localhost:3000/auth/kick/callback
     ```
     ⚠️ **CRITICAL**: Copy this EXACTLY as shown:
     - Must be `http://` (not `https://`) for localhost
     - Must include port `:3000`
     - Must include the full path `/auth/kick/callback`
     - No trailing slashes
     - Case-sensitive
6. Save the application
7. **Copy your Client ID and Client Secret** - you'll need these next

## Step 2: Configure Environment Variables

1. Open the `.env` file in the project root (`C:\Users\willc\kick-bot\.env`)
2. Update these values:

```env
KICK_CLIENT_ID=your_actual_client_id_here
KICK_CLIENT_SECRET=your_actual_client_secret_here
KICK_REDIRECT_URI=http://localhost:3000/auth/kick/callback
```

3. **DO NOT** use placeholder values like `your_kick_client_id` - use your actual credentials

## Step 3: Restart the Server

After updating the `.env` file:

1. Stop the current server (if running)
2. Restart it:
   ```bash
   npm start
   ```

## Step 4: Test the Connection

1. Go to http://localhost:3000
2. Click the "Register" tab
3. Click "Connect with Kick"
4. You should see a Kick authorization screen asking for permissions
5. Click "Authorize" or "Allow"
6. You'll be redirected back to the dashboard

## Troubleshooting

### Still redirecting to kick.com homepage?

**Check 1: Client ID is set correctly**
- Open `.env` file
- Make sure `KICK_CLIENT_ID` is NOT `your_kick_client_id`
- It should be a long string of characters/numbers

**Check 2: Redirect URI matches exactly**
- In Kick Developer Dashboard, your redirect URI must be: `http://localhost:3000/auth/kick/callback`
- In your `.env` file, `KICK_REDIRECT_URI` must be the same
- Check for:
  - `http` vs `https` (use `http` for localhost)
  - Trailing slashes
  - Port number (must be 3000)
  - Exact path: `/auth/kick/callback`

**Check 3: Check server logs**
- Look at the terminal where the server is running
- You should see logs like:
  ```
  Initiating OAuth flow...
  Client ID: Set
  Redirect URI: http://localhost:3000/auth/kick/callback
  OAuth URL: https://kick.com/api/oauth/authorize?client_id=...
  ```

**Check 4: Try the OAuth URL manually**
- Copy the OAuth URL from server logs
- Paste it in your browser
- If it still goes to homepage, the endpoint might be wrong

**Check 5: Kick API Status**
- Kick's API is still evolving
- Some endpoints may have changed
- Check https://docs.kick.com for latest OAuth documentation
- The endpoint might be:
  - `https://kick.com/api/oauth/authorize` (current)
  - `https://kick.com/api/v1/oauth/authorize` (alternative)
  - `https://kick.com/oauth/authorize` (alternative)

## Alternative: Manual OAuth URL Testing

If the automatic flow doesn't work, you can test the OAuth URL manually:

1. Get your Client ID from `.env`
2. Construct the URL:
   ```
   https://kick.com/api/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:3000/auth/kick/callback&response_type=code&scope=chat:write%20user:read%20channel:read
   ```
3. Replace `YOUR_CLIENT_ID` with your actual client ID
4. Open this URL in your browser
5. If it shows an authorization screen, the URL is correct
6. If it goes to homepage, try the alternative endpoints above

## Still Having Issues?

1. **Check Kick Developer Forums**: https://github.com/KickEngineering/KickDevDocs
2. **Verify App Status**: Make sure your app is approved/active in the developer dashboard
3. **Check Scopes**: Some scopes might require special permissions
4. **Browser Issues**: Try a different browser or incognito mode
5. **Clear Cookies**: Clear Kick.com cookies and try again

## Common Error Messages

- **"Kick Client ID not configured"**: Set `KICK_CLIENT_ID` in `.env`
- **"no_code"**: Authorization was denied or redirect URI mismatch
- **"invalid_redirect_uri"**: Redirect URI doesn't match in Kick app settings
- **"invalid_client"**: Client ID or Secret is incorrect
