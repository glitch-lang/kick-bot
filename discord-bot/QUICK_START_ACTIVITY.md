# Quick Start: Discord Activities for Kick Watch Parties

This guide will help you get Discord Activities working for your Kick watch parties in **under 10 minutes**.

## What You'll Get

✅ Launch watch parties directly from Discord voice channels  
✅ No external browser needed - embedded in Discord  
✅ Native Discord integration  
✅ Shared viewing experience  
✅ Auto-filled Discord usernames

## Step 1: Enable Activities in Discord (2 minutes)

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application (the same one your bot uses)
3. Click **Activities** in the left sidebar
4. Click **Enable Activities** button
5. Copy your **Application ID** (you'll need this)

## Step 2: Configure Environment Variables (1 minute)

Add to your `.env` file:

```env
DISCORD_ACTIVITY_ID=YOUR_APPLICATION_ID_HERE
```

Replace `YOUR_APPLICATION_ID_HERE` with the Application ID you copied in Step 1.

## Step 3: Set URL Mappings (2 minutes)

Still in the Discord Developer Portal → Activities section:

### For Local Development:
```
Target: /
Prefix: /
URL: http://localhost:3001
```

### For Production (Railway):
```
Target: /
Prefix: /
URL: https://your-discord-bot.up.railway.app
```

Replace with your actual Railway URL.

## Step 4: Deploy/Restart (2 minutes)

### Local Testing:
```bash
cd discord-bot
npm run build
npm start
```

### Railway:
Just push to git - Railway will auto-deploy:
```bash
git add .
git commit -m "Add Discord Activity support"
git push
```

## Step 5: Test It! (1 minute)

1. Join a voice channel in Discord
2. Run command: `/activity realglitchdyeet` (or any Kick streamer)
3. Click the "Start Activity" button that Discord shows
4. Watch party opens inside Discord! 🎉

## Available Commands

```
/activity <streamer>           - Launch watch party Activity
/activity <streamer> relay     - Enable Kick chat relay
/activity <streamer> twoway    - Enable two-way chat
```

### Examples:
```
/activity bbjess
/activity realglitchdyeet relay
/activity jerzy twoway
```

## Troubleshooting

### "Activity not found"
- Make sure you enabled Activities in Discord Developer Portal
- Verify DISCORD_ACTIVITY_ID is set correctly in .env
- Restart your bot

### "Cannot create invite"
- Make sure your bot has "Create Invite" permission
- Try in a different voice channel

### Activity shows blank screen
- Check URL mappings are correct
- Verify your PUBLIC_URL is accessible
- Check browser console for errors

### Slash command not showing
- Slash commands can take up to 1 hour to register globally
- For instant testing, use guild-specific commands instead
- Restart Discord client

## Production Deployment Checklist

Before going to production:

- [ ] DISCORD_ACTIVITY_ID is set in Railway environment variables
- [ ] URL mappings point to Railway URL (not localhost)
- [ ] PUBLIC_URL is set to your Railway URL
- [ ] Activities are enabled in Discord Developer Portal
- [ ] Bot is redeployed with latest code

## Notes

- Activities are currently in **beta** from Discord
- You may need approval from Discord for public distribution
- For private servers (your own Discord), approval is NOT needed
- Activities work best in regular voice channels (not Stage channels)

## Next Steps

Once working:
- Customize the activity UI in `public/activity.html`
- Add more features (polls, reactions, etc.)
- Submit for Discord Activity approval (optional)

## Support

If you run into issues:
1. Check `DISCORD_ACTIVITY_SETUP.md` for detailed troubleshooting
2. Verify all environment variables are set
3. Check bot logs for errors
4. Make sure Activities are enabled in Developer Portal

---

**That's it!** You should now have working Discord Activities. 🎉
