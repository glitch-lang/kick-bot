# Discord Activities Implementation

## Overview

This implementation adds Discord Activity support to the Kick watch party bot, allowing users to launch watch parties directly from Discord voice channels without needing an external browser.

## What's New

### Files Added:
- `public/activity.html` - Activity-optimized watch party interface
- `src/activity-launcher.ts` - Activity invite creation and management
- `DISCORD_ACTIVITY_SETUP.md` - Detailed setup guide
- `QUICK_START_ACTIVITY.md` - Quick 10-minute setup guide
- `README_ACTIVITIES.md` - This file

### Files Modified:
- `src/index.ts` - Added Activity launcher integration
- `src/watch-party-server.ts` - Added `/activity/:partyId` route
- `.env.example` - Added `DISCORD_ACTIVITY_ID` configuration
- `package.json` - Added `@discord/embedded-app-sdk` dependency

## How It Works

```
User joins voice channel
         ↓
User runs /activity <streamer>
         ↓
Bot creates Activity invite
         ↓
Discord shows "Start Activity" button
         ↓
User clicks button
         ↓
Discord loads activity.html in iframe
         ↓
Activity connects to watch party server
         ↓
User watches stream inside Discord!
```

## Architecture

### Activity Flow:
1. **Slash Command** (`/activity`) triggers `ActivityLauncher.handleCommand()`
2. **Watch Party Created** via `WatchPartyServer.createWatchParty()`
3. **Activity Invite** created with `InviteTargetType.EmbeddedApplication`
4. **Discord SDK** initializes in `activity.html`
5. **Socket.IO** connects user to watch party
6. **Synchronized experience** across all participants

### Components:

#### ActivityLauncher (`activity-launcher.ts`)
- Handles `/activity` slash command
- Creates Discord Activity invites
- Validates permissions and voice channel state
- Provides fallback to web-based watch parties

#### Activity HTML (`activity.html`)
- Embedded App SDK integration
- Auto-detects Discord username
- Optimized for iframe constraints
- Compact UI for Activity view

#### Watch Party Server
- Serves both regular and Activity versions
- Routes:
  - `/party/:partyId` - Regular web view
  - `/activity/:partyId` - Activity iframe view
- Same backend logic for both

## Configuration

### Required Environment Variables:
```env
# Discord Bot (existing)
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...

# NEW: Discord Activity
DISCORD_ACTIVITY_ID=your_application_id

# Watch Party Server
PUBLIC_URL=https://your-domain.com
PORT=3001
```

### Discord Developer Portal Setup:
1. Enable Activities for your application
2. Configure URL mappings:
   - Development: `http://localhost:3001`
   - Production: Your Railway/VPS URL
3. Set proper scopes and permissions

## Testing

### Local Testing:
1. Use localtunnel or ngrok for public URL
2. Set tunnel URL in Discord Developer Portal
3. Test in a test Discord server
4. Monitor console logs for errors

```bash
# Terminal 1: Start bot
npm run dev

# Terminal 2: Create tunnel
npx localtunnel --port 3001
```

### Production Testing:
1. Deploy to Railway
2. Update URL mappings to Railway URL
3. Test in production Discord server
4. Monitor Railway logs

## Commands

### Slash Commands:
```
/activity <streamer>                    - Launch Activity
/activity <streamer> relay:true         - Enable Kick relay
/activity <streamer> twoway:false       - Disable two-way chat
```

### Legacy Commands (still work):
```
!kick watchparty <streamer>             - Web-based watch party
!kick autoparty add <streamer>          - Auto-create when live
```

## Permissions Required

Bot needs:
- `CREATE_INSTANT_INVITE` - For creating Activity invites
- `CONNECT` - For voice channel access
- Standard permissions from before

## Limitations

- Activities only work in regular Voice Channels (not Stage channels)
- Requires Discord client that supports Activities
- May require Discord approval for public directory
- Works in private servers without approval

## Comparison: Activity vs Web-Based

| Feature | Discord Activity | Web-Based |
|---------|-----------------|-----------|
| **Launch** | Inside Discord | External browser |
| **Username** | Auto-filled from Discord | Manual entry |
| **Permissions** | Native Discord auth | Public access |
| **Mobile** | Supported | Supported |
| **Browser** | Not needed | Required |
| **Setup** | Requires Activity approval | Works immediately |

## Troubleshooting

### Common Issues:

**Activity doesn't load:**
- Check URL mappings in Developer Portal
- Verify PUBLIC_URL is correct and accessible
- Check CSP headers allow Discord domains

**Slash command not appearing:**
- Commands take up to 1 hour to propagate globally
- Try guild-specific registration for testing
- Restart Discord client

**Cannot create invite:**
- Verify bot has CREATE_INSTANT_INVITE permission
- Check DISCORD_ACTIVITY_ID is correct
- Ensure Activity is enabled in portal

**Blank screen in Activity:**
- Check browser console for errors
- Verify Discord SDK initialization
- Check parent domain is allowed in iframe

## Development Tips

1. **Test locally first** with tunnel before deploying
2. **Use guild commands** for instant testing (no 1-hour wait)
3. **Check browser console** for SDK errors
4. **Monitor bot logs** for backend issues
5. **Use ephemeral replies** for command feedback

## Future Enhancements

Possible improvements:
- Voice channel member sync
- Rich Presence integration
- Custom Activity artwork
- In-Activity polls/reactions
- Multi-stream viewing
- Picture-in-picture mode

## Migration from Web-Based

Existing watch parties continue to work!

Users can choose:
- `/activity` for Discord Activities (new)
- `!kick watchparty` for web-based (existing)

Both use the same backend, so features are identical.

## Production Checklist

Before going live:
- [ ] Activities enabled in Discord Developer Portal
- [ ] URL mappings updated for production
- [ ] DISCORD_ACTIVITY_ID set in Railway
- [ ] PUBLIC_URL set to Railway URL
- [ ] Slash commands registered
- [ ] Tested in production Discord server
- [ ] Documented for users

## Support & Resources

- [Discord Activities Docs](https://discord.com/developers/docs/activities/overview)
- [Embedded App SDK](https://github.com/discord/embedded-app-sdk)
- [Discord Developer Portal](https://discord.com/developers/applications)

---

**Implementation completed!** Ready for testing and deployment. 🚀
