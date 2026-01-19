# Setup Guide for Kick Cross-Streamer Bot

## Step-by-Step Setup Instructions

### 1. Prerequisites

- Node.js 18 or higher installed
- A Kick.com account
- A Kick Developer account (sign up at https://dev.kick.com)

### 2. Install Dependencies

```bash
cd kick-bot
npm install
```

### 3. Create Kick Developer Application

1. Go to https://dev.kick.com
2. Log in with your Kick account
3. Navigate to "Applications" or "My Apps"
4. Click "Create New Application"
5. Fill in:
   - **Name**: Cross-Streamer Bot (or any name)
   - **Description**: Bot for cross-streamer messaging
   - **Redirect URI**: 
     ```
     http://localhost:3000/auth/kick/callback
     ```
     ⚠️ **CRITICAL**: Copy this EXACTLY as shown:
     - Must be `http://` (not `https://`) for localhost
     - Must include port `:3000`
     - Must include the full path `/auth/kick/callback`
     - No trailing slashes
     - Case-sensitive
6. Save and note your **Client ID** and **Client Secret**

### 4. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` in a text editor and fill in:
   ```
   KICK_CLIENT_ID=your_client_id_here
   KICK_CLIENT_SECRET=your_client_secret_here
   KICK_REDIRECT_URI=http://localhost:3000/auth/kick/callback
   PORT=3000
   NODE_ENV=development
   JWT_SECRET=generate_a_random_string_here
   DB_PATH=./data/kickbot.db
   ```

3. Generate a secure JWT secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and use it as your `JWT_SECRET`

### 5. Build the Project

```bash
npm run build
```

### 6. Start the Server

For development (with auto-reload):
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on `http://localhost:3000`

### 7. Register Your First Streamer

1. Open `http://localhost:3000` in your browser
2. Click the "Register" tab
3. Click "Connect with Kick"
4. Authorize the application
5. You'll be redirected back to the dashboard

### 8. Set Up Channel Points Reward

**Important**: For the bot to work properly with channel points, you need to set up a custom reward in your Kick dashboard:

1. Go to your Kick Creator Dashboard
2. Navigate to "Channel Points" or "Rewards"
3. Create a new custom reward:
   - **Name**: Match your command (e.g., "Send message to Jerzy")
   - **Cost**: Set to match your command's channel points cost
   - **Enable**: "Require text input" (optional, but recommended)
   - **Cooldown**: Set a cooldown period
4. Save the reward

### 9. Create Your First Command

1. In the dashboard, click "Create New Command"
2. Fill in:
   - **Command Name**: e.g., "jerzy" (without the !)
   - **Target Streamer**: Select the streamer you want to send messages to
   - **Channel Points Cost**: e.g., 100
   - **Cooldown**: e.g., 300 seconds (5 minutes)
3. Click "Create Command"

### 10. Test the Bot

1. Have a viewer redeem the channel points reward in your chat
2. Or have them type `!<your_command> <message>` in chat
3. The message should appear in the target streamer's chat
4. The target streamer can respond using `!respond <id> <message>`

## Production Deployment

### Environment Variables for Production

Update your `.env` file with production values:

```
KICK_REDIRECT_URI=https://yourdomain.com/auth/kick/callback
NODE_ENV=production
PORT=3000
```

### Update Kick Developer App

1. Go to your Kick Developer application settings
2. Add your production redirect URI
3. Update the redirect URI in your `.env` file

### Recommended Hosting

- **Heroku**: Easy deployment with PostgreSQL addon
- **Railway**: Simple Node.js hosting
- **DigitalOcean**: VPS with PM2 for process management
- **AWS**: EC2 or Elastic Beanstalk

### Security Considerations

1. Use HTTPS in production
2. Store secrets securely (use environment variables, not code)
3. Regularly rotate JWT secrets
4. Implement rate limiting
5. Monitor for abuse

## Troubleshooting

### "OAuth callback error"
- Verify your redirect URI matches exactly in both Kick app settings and `.env`
- Check that Client ID and Secret are correct
- Ensure your app has the required scopes

### "Bot not responding"
- Check server logs for errors
- Verify access tokens are valid (they may have expired)
- Ensure the bot has proper permissions in channels

### "Messages not sending"
- Verify target streamer has registered
- Check that access tokens are valid
- Review Kick API rate limits
- Check server logs for API errors

### "Database errors"
- Ensure the `data/` directory exists and is writable
- Check file permissions
- Verify SQLite3 is installed

## Next Steps

- Set up multiple streamers
- Create commands for different streamers
- Monitor the communities page to see all participants
- Customize cooldowns and channel points costs

## Support

If you encounter issues:
1. Check server logs
2. Verify all environment variables are set
3. Ensure Kick API endpoints are accessible
4. Review the README.md for more details
