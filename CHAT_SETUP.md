# Chat-Based Setup Guide

## How to Add the Bot to Your Channel

### Step 1: Invite the Bot
The bot needs to be in your chat. You can:
- Add the bot account as a moderator
- Or the bot will automatically join when you use commands

### Step 2: Register via Chat
In your Kick chat, type:
```
!setupchat
```

The bot will:
- Register your channel automatically
- Use your channel name as the command
- Set default cooldown to 60 seconds

**Response:** `✅ Channel registered! Your command is: !yourchannelname | Default cooldown: 60s | Use !cooldownchat <seconds> to change.`

### Step 3: Set Your Cooldown (Optional)
In your chat, type:
```
!cooldownchat 60
```

This sets how long viewers must wait between messages (in seconds).

Examples:
- `!cooldownchat 60` = 1 minute cooldown
- `!cooldownchat 300` = 5 minutes cooldown
- `!cooldownchat 0` = No cooldown (not recommended)

## Available Commands

### For Streamers:
- `!setupchat` - Register your channel
- `!cooldownchat <seconds>` - Set cooldown time
- `!respond <id> <message>` - Reply to a message

### For Viewers:
- `!streamers` - List all registered streamers
- `!online` - See who's currently live
- `!channelname <message>` - Send message to that streamer

## How It Works

1. **Streamer registers:** `!setupchat`
   - Bot adds channel to database
   - Channel name becomes command automatically

2. **Viewer sends message:** `!yourchannelname hello`
   - Bot checks if you're online
   - Bot checks cooldown
   - Message appears in your chat

3. **You respond:** `!respond 123 hi back`
   - Bot sends response to original viewer
   - Shows in their chat

## Bot Token Setup

The bot needs an access token to send messages. Add to `.env`:

```env
BOT_ACCESS_TOKEN=your_bot_account_access_token
```

**Note:** The bot account needs to be able to send messages in channels. You can:
1. Use a dedicated bot account (recommended)
2. Or use your own account's token (for testing)

## Testing

1. Make sure bot is running: `npm start`
2. Go to your Kick channel chat
3. Type: `!setupchat`
4. Bot should respond confirming registration
5. Test: `!cooldownchat 30`
6. Bot should confirm cooldown update

## Troubleshooting

### Bot Not Responding?
- Check server logs for errors
- Make sure `BOT_ACCESS_TOKEN` is set in `.env`
- Verify bot account has permission to send messages

### Commands Not Working?
- Make sure channel is registered (`!setupchat`)
- Check bot is connected to your channel
- Verify bot account is in your chat

### Can't Send Messages?
- Bot needs `BOT_ACCESS_TOKEN` in `.env`
- Token must have `chat:write` scope
- Bot account must be able to post in channels
