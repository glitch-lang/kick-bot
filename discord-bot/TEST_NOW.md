# 🧪 Test Discord Activities NOW

## Current Status
✅ Code committed and saved
✅ Environment configured (`DISCORD_ACTIVITY_ID` set)
✅ Project built successfully
⏳ Ready to test!

## Quick Test (5 minutes)

### 1. Enable Activities in Discord Portal (2 min)
1. Go to: https://discord.com/developers/applications/1463251183262109798
2. Click **Activities** in left sidebar
3. Click **Enable Activities** button
4. Add URL Mapping:
   - Target: `/`
   - Prefix: `/`
   - URL: `http://localhost:3001`
5. Click **Save**

### 2. Start the Bot (1 min)
```bash
cd discord-bot
npm start
```

Look for these console messages:
- ✅ "Discord bot logged in"
- ✅ "Activity slash commands registered!"
- ✅ "Watch Party server running"

### 3. Test in Discord (2 min)
1. **Join a voice channel** in your Discord server
2. **Type:** `/activity realglitchdyeet` (or any Kick streamer)
3. **Look for:** Bot's reply with activity information
4. **Click:** The activity URL in the bot's message
5. **Watch it load!** 🎉

## What You'll See

### In Console:
```
✅ Discord bot logged in as YourBot#1234
🎮 Activity Launcher initialized with ID: 1463251183262109798
✅ Activity slash commands registered!
🎬 Watch Party server running on http://localhost:3001
```

### In Discord:
```
/activity realglitchdyeet
```
Bot replies with:
```
🎬 Kick Watch Party Created!

Option 1: Discord Activity (Recommended)
Click: [Activity URL]

Option 2: Web Browser
https://localhost:3001/party/abc123

Features:
✅ Two-way chat enabled
❌ Relay to Kick disabled
```

### In the Activity:
- Kick stream loads
- Your Discord username auto-filled
- Chat works
- Viewer count shows

## Troubleshooting

### Slash command not showing?
- **Wait:** Can take up to 1 hour for global commands
- **Or:** Restart Discord client
- **Or:** Use `!kick watchparty` for now (regular web version)

### Activity won't load?
- Check Discord Portal → Activities → URL Mappings
- Make sure it's exactly: `http://localhost:3001`
- Try in browser first: http://localhost:3001/activity/test

### Bot not starting?
- Check Railway URL is correct in KICK_BOT_API_URL
- Verify Discord token is valid
- Check bot has proper permissions in Discord

## Alternative: Test Web Version First

If Activities aren't working yet, test the regular web version:

```
!kick watchparty realglitchdyeet
```

This will create a web-based watch party that you can open in your browser while you wait for Activity slash commands to propagate.

## Next Steps After Testing

1. ✅ Verify Activity loads inside Discord
2. ✅ Test with multiple users
3. ✅ Deploy to Railway for production
4. ✅ Update URL mappings to Railway URL

---

**Ready?** Start with Step 1 above! 🚀

**Need help?** See `QUICK_START_ACTIVITY.md` for detailed instructions.
