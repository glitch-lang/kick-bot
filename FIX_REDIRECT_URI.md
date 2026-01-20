# Fix "Invalid Redirect URI" Error

## The Problem

The redirect URI in your `.env` file must match **EXACTLY** what's configured in your Kick Developer App settings.

## Current Configuration

Your `.env` has:
```
KICK_REDIRECT_URI=http://localhost:3000/auth/kick/callback
```

## Solution

### Step 1: Check Your Kick App Settings

1. Go to https://dev.kick.com
2. Log in with your Kick account
3. Find your app (Client ID: `01KFBYN2H0627PRTF8WAB9R446`)
4. Check the **Redirect URI** field

### Step 2: Make Sure They Match EXACTLY

The redirect URI must match **character for character**:
- ✅ `http://localhost:3000/auth/kick/callback` (correct)
- ❌ `http://localhost:3000/auth/kick/callback/` (trailing slash - wrong)
- ❌ `https://localhost:3000/auth/kick/callback` (https instead of http - wrong)
- ❌ `http://127.0.0.1:3000/auth/kick/callback` (127.0.0.1 instead of localhost - wrong)

### Step 3: Update Kick App Settings

If the redirect URI in your Kick app is different, you have two options:

**Option A: Update Kick App (Recommended)**
1. Go to https://dev.kick.com
2. Edit your app
3. Set Redirect URI to: `http://localhost:3000/auth/kick/callback`
4. Save

**Option B: Update .env File**
1. Check what redirect URI is in your Kick app settings
2. Update `.env` to match it exactly:
   ```
   KICK_REDIRECT_URI=<exact_uri_from_kick_app>
   ```
3. Restart the bot

### Step 4: Common Issues

- **Trailing slash**: Make sure there's NO trailing slash
- **Protocol**: Must be `http://` for localhost (not `https://`)
- **Port**: Must be `3000` (or whatever port you're using)
- **Case sensitive**: Must be lowercase
- **Spaces**: No spaces before or after

### Step 5: Test

After updating, try the OAuth flow again:
1. Go to `http://localhost:3000`
2. Click "Register" → "Connect with Kick"
3. Should redirect to Kick authorization page (no error)

## Quick Fix Command

If you want to update the Kick app to match your current `.env`:

1. Go to https://dev.kick.com
2. Edit your app
3. Set Redirect URI to: `http://localhost:3000/auth/kick/callback`
4. Save
5. Try OAuth again
