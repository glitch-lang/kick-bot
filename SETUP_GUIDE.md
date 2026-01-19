# Complete Setup Guide for Kick Cross-Streamer Bot

## For Bot Administrators

### Step 1: Create Kick Developer Application

1. **Go to Kick Developer Portal**
   - Visit: https://dev.kick.com
   - Log in with your Kick account
   - Navigate to "Applications" or "My Apps"

2. **Create New Application**
   - Click "Create New Application" or "New App"
   - Fill in:
     - **Name**: Cross-Streamer Bot (or your preferred name)
     - **Description**: Bot for cross-streamer messaging
     - **Redirect URI**: `http://localhost:3000/auth/kick/callback`
       - ⚠️ **CRITICAL**: Must match EXACTLY (including http/https, port, path)
       - For production, use: `https://yourdomain.com/auth/kick/callback`

3. **Enable Required Scopes**
   Make sure these scopes are enabled in your app settings:
   - ✅ **Read user information (including email address)** - `user:read`
   - ✅ **Write to Chat feed** - `chat:write`
   - ✅ **Read channel information** - `channel:read`
   - ✅ **Subscribe to events** - `events:subscribe`
   - ✅ **Read Channel points rewards** - `channel_points:read`

4. **Save and Copy Credentials**
   - **Client ID**: Copy this (e.g., `01KFBYN2H0627PRTF8WAB9R446`)
   - **Client Secret**: Copy this (keep it secret!)

### Step 2: Configure Environment Variables

1. **Open `.env` file** in the project root
2. **Set these values**:
   ```env
   KICK_CLIENT_ID=your_client_id_here
   KICK_CLIENT_SECRET=your_client_secret_here
   KICK_REDIRECT_URI=http://localhost:3000/auth/kick/callback
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=your_secure_random_string
   DB_PATH=./data/kickbot.db
   ```

3. **Generate JWT Secret**:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output to `JWT_SECRET`

### Step 3: Start the Server

```bash
npm install
npm run build
npm start
```

The server will start on http://localhost:3000

---

## For Streamers (Registering Their Channels)

### Step 1: Access the Bot Website

1. Go to http://localhost:3000 (or your production URL)
2. Click the **"Register"** tab

### Step 2: Connect Your Kick Account

1. Click **"Connect with Kick"** button
2. You'll be redirected to Kick.com
3. **Authorize the application**:
   - Review the permissions requested
   - Make sure you see permissions for:
     - Reading your user information
     - Writing to chat
     - Reading channel information
     - Subscribing to events
   - Click **"Authorize"** or **"Allow"**

### Step 3: Complete Registration

1. After authorization, you'll be redirected back
2. The bot will automatically:
   - Retrieve your user information
   - Register your channel
   - Set up your dashboard

3. **If you see an error**:
   - Check that all scopes were granted during authorization
   - Verify the bot administrator has configured the app correctly
   - Check server logs for detailed error messages

### Step 4: Set Up Commands

1. Go to **Dashboard** tab
2. Click **"Create New Command"**
3. Fill in:
   - **Command Name**: e.g., "jerzy" (without the !)
   - **Target Streamer**: Select who receives messages
   - **Channel Points Cost**: e.g., 100
   - **Cooldown**: e.g., 300 seconds
4. Click **"Create Command"**

### Step 5: Set Up Channel Points Reward

1. Go to your **Kick Creator Dashboard**
2. Navigate to **Channel Points** settings
3. Create a **Custom Reward**:
   - **Name**: Match your command (e.g., "Send message to Jerzy")
   - **Cost**: Match your command's channel points cost
   - **Enable**: "Require text input" (optional)
   - **Cooldown**: Set if desired
4. Save the reward

---

## Troubleshooting Registration Issues

### Error: "user_info"

**Symptoms**: After authorization, you see "Error: user_info"

**Possible Causes**:
1. `user:read` scope not enabled in Kick app settings
2. `user:read` scope not granted during authorization
3. User info API endpoint incorrect or changed
4. Token doesn't have required permissions

**Solutions**:

1. **Verify Scopes in Kick App**:
   - Go to https://dev.kick.com
   - Find your app
   - Check that `user:read` scope is enabled

2. **Check Authorization**:
   - When authorizing, make sure you grant ALL requested permissions
   - Don't deny any scopes

3. **Check Server Logs**:
   - Look at the server terminal
   - Find "Token introspection response:" 
   - Check "scope" field - should include `user:read`
   - Look for "Trying user info endpoint:" messages
   - Note which endpoints return errors and what status codes

4. **Verify Token**:
   - Check server logs for "Token scopes:" 
   - Should show: `user:read channel:read chat:write events:subscribe channel_points:read`
   - If `user:read` is missing, the scope wasn't granted

5. **Test Manually**:
   - Get the access token from server logs
   - Test in browser console:
   ```javascript
   fetch('https://api.kick.com/public/v1/user', {
     headers: { 'Authorization': 'Bearer YOUR_TOKEN' }
   })
   .then(r => r.json())
   .then(console.log)
   ```

### Error: "no_code"

**Cause**: No authorization code received from Kick

**Solutions**:
- Redirect URI mismatch - check exact match in app settings
- User denied authorization
- OAuth endpoint issue

### Error: "invalid_redirect_uri"

**Cause**: Redirect URI doesn't match app settings

**Solutions**:
- Check exact match (http vs https, trailing slash, port number)
- Update app settings or `.env` file to match

---

## API Endpoints Reference

### OAuth Endpoints
- **Authorization**: `https://id.kick.com/oauth/authorize`
- **Token Exchange**: `https://id.kick.com/oauth/token`
- **Token Introspection**: `https://id.kick.com/oauth/token/introspect`

### API Endpoints (Base: `https://api.kick.com`)
- **User Info**: `https://api.kick.com/public/v1/user` (or `/v1/user`)
- **Channel Info**: `https://api.kick.com/v1/channels/{slug}`
- **Public Key**: `https://api.kick.com/public/v1/public-key`

---

## Required Scopes Checklist

When creating your Kick app, ensure these scopes are enabled:

- [ ] `user:read` - Read user information
- [ ] `channel:read` - Read channel information  
- [ ] `chat:write` - Write to chat
- [ ] `events:subscribe` - Subscribe to events
- [ ] `channel_points:read` - Read channel points

---

## Support

If you continue having issues:

1. **Check Server Logs**: Most detailed information is there
2. **Visit Debug Endpoint**: http://localhost:3000/api/debug/last-attempt
3. **Verify App Settings**: https://dev.kick.com
4. **Check Kick Documentation**: https://docs.kick.com

---

## Quick Reference

**Redirect URI for Local Development**:
```
http://localhost:3000/auth/kick/callback
```

**Redirect URI for Production**:
```
https://yourdomain.com/auth/kick/callback
```

**Required Scopes** (space-separated):
```
user:read channel:read chat:write events:subscribe channel_points:read
```
