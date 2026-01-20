# How to Get a User OAuth Token with chat:write Scope

## The Problem

Your current token is an **app token** (client credentials flow), which may not have `chat:write` scope or may not work for sending chat messages. You need a **user OAuth token** instead.

## Solution: Get User OAuth Token

### Step 1: Open OAuth Authorization URL

Open this URL in your browser (replace with your actual client ID if different):

```
https://id.kick.com/oauth/authorize?client_id=01KFBYN2H0627PRTF8WAB9R446&redirect_uri=http://localhost:3000/auth/kick/callback&response_type=code&scope=chat:write%20user:read%20channel:read%20events:subscribe%20channel_points:read
```

Or use the bot's web interface:
1. Go to `http://localhost:3000`
2. Click "Register" tab
3. Click "Connect with Kick"
4. Authorize the app with ALL scopes (especially `chat:write`)

### Step 2: Get the Authorization Code

After authorizing, you'll be redirected to:
```
http://localhost:3000/auth/kick/callback?code=AUTHORIZATION_CODE_HERE
```

Copy the `code` parameter.

### Step 3: Exchange Code for Token

Run this command (replace `YOUR_CODE` with the actual code):

```bash
curl -X POST https://id.kick.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=01KFBYN2H0627PRTF8WAB9R446" \
  -d "client_secret=c0965f24b3ba7f71bda846d9a842acb888aaaa80311fdd5f50b4791f70e88fed" \
  -d "code=YOUR_CODE" \
  -d "grant_type=authorization_code" \
  -d "redirect_uri=http://localhost:3000/auth/kick/callback"
```

### Step 4: Update .env

Copy the `access_token` from the response and update your `.env`:

```
BOT_ACCESS_TOKEN=your_new_user_oauth_token_here
```

### Step 5: Verify Token Has Scopes

Run:
```bash
node verify-token.js
```

You should see `chat:write` in the scopes list.

### Step 6: Test Sending Message

Run:
```bash
node test-send-message.js
```

It should now succeed!

## Alternative: Use the Bot's Web Interface

1. Make sure the bot server is running
2. Go to `http://localhost:3000`
3. Click "Register" tab
4. Click "Connect with Kick"
5. Authorize with ALL scopes
6. After redirect, check the server logs for the token
7. Copy the token to `BOT_ACCESS_TOKEN` in `.env`

## Important Notes

- **User OAuth tokens** are tied to a specific user account
- The account you authorize must be the **bot account** (CrossTalkBot)
- Make sure to authorize with **ALL scopes**, especially `chat:write`
- The bot account must be a **moderator** in your channel: `/mod CrossTalkBot`
