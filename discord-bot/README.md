# 🎮 CrossTalk Discord Bot

Discord bot for watching Kick streams together with synchronized watch parties, two-way chat, and OAuth login.

## Features

- 🎬 **Watch Parties** - Create synchronized watch parties for Kick streams
- 💬 **Two-Way Chat** - See Kick chat messages in your watch party
- 🔐 **Kick OAuth** - Secure login with real Kick accounts
- 🎫 **Discord Auto-fill** - Automatic username from Discord
- 🌐 **Public Access** - Share watch parties with anyone
- 👥 **Multi-Stream** - Support multiple simultaneous watch parties

## Deployment

### Railway (Recommended)

1. Push to GitHub
2. Connect to Railway
3. Add environment variables
4. Deploy!

See `RAILWAY_DEPLOYMENT.md` for detailed instructions.

### Local Development

```bash
npm install
npm run build
npm start
```

## Environment Variables

Required:
- `DISCORD_BOT_TOKEN` - Your Discord bot token
- `DISCORD_CLIENT_ID` - Your Discord client ID
- `KICK_BOT_API_URL` - Kick API endpoint

Optional:
- `ENABLE_TUNNEL` - Enable LocalTunnel for public access (local only)
- `KICK_OAUTH_CLIENT_ID` - For Kick OAuth login
- `KICK_OAUTH_CLIENT_SECRET` - For Kick OAuth login
- `SESSION_SECRET` - For secure sessions
- `ENCRYPTION_KEY` - For token encryption

## Documentation

- `RAILWAY_DEPLOYMENT.md` - How to deploy to Railway
- `LOCALHOST_PUBLIC_ACCESS.md` - Local tunneling options
- `TWO_WAY_CHAT_GUIDE.md` - Two-way chat feature
- `OAUTH_SECURITY_GUIDE.md` - OAuth security details
- `DISCORD_USERNAME_AUTO_FILL.md` - Discord auto-fill feature

## Commands

- `!kick help` - Show all commands
- `!kick watchparty <streamer>` - Create a watch party
- `!kick track <streamer>` - Track when streamer goes live
- `!kick untrack <streamer>` - Stop tracking streamer

## License

MIT
