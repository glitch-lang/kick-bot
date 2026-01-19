# How to Use the Bot in Your Channel

## Quick Start

Once you've registered your channel, the bot automatically connects to your chat! Here's what you need to know:

## 1. Register Your Channel

1. Go to the web interface (http://localhost:3000)
2. Click "Register"
3. Connect your Kick account
4. Your channel is now registered!

## 2. The Bot Automatically Connects

When you register, the bot automatically:
- Connects to your channel's chat
- Listens for commands
- Responds to messages

**No additional setup needed!** The bot runs in the background.

## 3. Available Commands

### For Viewers:
- `!streamers` - List all registered streamers
- `!online` - See who's currently live
- `!yourchannelname <message>` - Send a message to you

### For You (Streamer):
- `!respond <id> <message>` - Reply to a message you received

## 4. How It Works

1. **Viewer sends message:**
   ```
   !yourchannelname hello!
   ```

2. **Bot processes:**
   - Checks if you're online
   - Checks cooldown
   - Sends message to your chat

3. **You see in your chat:**
   ```
   📨 Message from @viewer (theirchannel / theirusername): "hello!" | ID: 123 | Reply: !respond 123 <message>
   ```

4. **You respond:**
   ```
   !respond 123 hi back!
   ```

5. **Viewer sees in their chat:**
   ```
   💬 Response from @you (yourchannel): "hi back!" | Request ID: 123
   ```

## 5. Setting Your Cooldown

1. Go to Dashboard
2. Set your cooldown (how long viewers wait between messages)
3. Click "Update Cooldown"

## 6. Troubleshooting

### Bot Not Responding?

1. **Check if bot is running:**
   - Look at the server terminal
   - Should see: "Connecting to channel: yourchannelname"

2. **Check registration:**
   - Go to Dashboard
   - Should see "Welcome, yourusername!"

3. **Check bot credentials:**
   - Make sure `.env` has `BOT_USERNAME` and `BOT_PASSWORD`
   - These are for the bot account (not your account)

### Bot Account Setup

The bot needs its own Kick account to send messages. You have two options:

**Option 1: Use Existing Bot Account**
- Set `BOT_USERNAME` and `BOT_PASSWORD` in `.env`
- Bot will use this account to send messages

**Option 2: Use Your Account (Current Setup)**
- The bot uses YOUR access token to send messages
- No separate bot account needed!

## 7. Testing

1. Register your channel
2. Open your Kick chat
3. Type: `!streamers`
4. Bot should respond with list of streamers

## 8. For Multiple Streamers

1. Each streamer registers separately
2. Bot connects to all registered channels automatically
3. Viewers can message any registered streamer using `!channelname`

## Important Notes

- The bot listens to ALL registered channels
- Commands work in ANY registered channel's chat
- Cooldown is per-viewer, per-streamer
- Messages only work if target streamer is online
