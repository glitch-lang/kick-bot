# Quick Start Guide

Get your Kick Cross-Streamer Bot running in 5 minutes!

## 1. Install & Configure

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your Kick Client ID and Secret
# Get these from https://dev.kick.com
```

## 2. Get Kick API Credentials

1. Visit https://dev.kick.com
2. Create a new application
3. Set redirect URI: `http://localhost:3000/auth/kick/callback`
4. Copy Client ID and Client Secret to `.env`

## 3. Start the Bot

```bash
# Build the project
npm run build

# Start the server
npm start
```

## 4. Register Your Channel

1. Open http://localhost:3000
2. Click "Register" tab
3. Click "Connect with Kick"
4. Authorize the app

## 5. Create Your First Command

1. In Dashboard, click "Create New Command"
2. Enter command name (e.g., "jerzy")
3. Select target streamer
4. Set channel points cost (e.g., 100)
5. Set cooldown (e.g., 300 seconds)
6. Save

## 6. Set Up Channel Points Reward

1. Go to your Kick Creator Dashboard
2. Create a custom reward matching your command
3. Set cost to match your command's cost
4. Enable text input (optional)

## Done! 🎉

Viewers can now use `!<your_command> <message>` to send messages to other streamers!

For detailed setup, see [SETUP.md](./SETUP.md)
