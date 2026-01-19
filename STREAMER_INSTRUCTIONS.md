# Instructions for Streamers

## How to Add the Bot to Your Channel

### Quick Setup (2 Minutes)

1. **Visit the Bot's Web Page**
   - Go to: `https://your-bot-domain.com` (provided by bot owner)
   - Or ask the bot owner for the web URL

2. **Go to "Invite Bot" Tab**
   - Click on the "Invite Bot" tab
   - Read the instructions

3. **Add Bot to Your Channel**
   - **Option A**: Bot will auto-join when you use commands
   - **Option B**: Manually add bot as moderator/bot in your channel settings
     - Go to your Kick channel settings
     - Add the bot username: `[Bot Username]` (provided by bot owner)

4. **Register Your Channel**
   - In your Kick chat, type: `!setupchat`
   - Bot will respond: "✅ Channel registered! Your command is: !yourchannelname"
   - Done! Your channel is now part of the network

5. **Set Your Cooldown (Optional)**
   - Type: `!cooldownchat 60` (60 seconds = 1 minute)
   - Adjust number to your preference

## How It Works

### Your Command
- Your channel name automatically becomes a command
- Example: If your channel is `mystream`, viewers use `!mystream <message>`

### Viewers Can:
- **Message You**: `!yourchannelname hello`
- **See All Streamers**: `!streamers`
- **Check Who's Live**: `!online`

### You Can:
- **Respond to Messages**: `!respond 123 hi back`
- **Set Cooldown**: `!cooldownchat 60`
- **See All Commands**: `!streamers`

## Example Flow

1. Viewer in another streamer's chat types: `!yourchannelname Hey, great stream!`
2. Message appears in YOUR chat: `📨 Message from @viewer (otherchannel): "Hey, great stream!" | ID: 123`
3. You respond: `!respond 123 Thanks!`
4. Response goes back to the viewer in the other streamer's chat

## Troubleshooting

### Bot Not Responding?
- Make sure bot is in your channel
- Check if bot account is online
- Try typing `!setupchat` again

### Already Registered?
- If you see "Channel already registered", you're good!
- Use `!cooldownchat` to change settings

### Need Help?
- Contact the bot owner
- Check the bot's web page for more info

## Privacy & Safety

- Only registered streamers can receive messages
- Cooldowns prevent spam
- You control who can message you (via cooldown settings)
- Messages show sender's username and channel

## Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `!setupchat` | Register your channel | `!setupchat` |
| `!cooldownchat <seconds>` | Set cooldown time | `!cooldownchat 60` |
| `!streamers` | List all registered streamers | `!streamers` |
| `!online` | See who's currently live | `!online` |
| `!respond <id> <message>` | Reply to a message | `!respond 123 hi` |
| `!yourchannelname <message>` | Send message to that streamer | `!jerzy hello` |

---

**Questions?** Contact the bot owner or visit the bot's web page!
